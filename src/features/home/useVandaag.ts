import { useEffect, useState } from 'react';
import {
  dagplan,
  type Dagplan,
  type Groep,
  type ItemState,
  type ModeId,
  type PlanSet,
} from '@/game-core';
import { isFoutenOnderwerp, isPremiumOnderwerp, isPremiumVorm } from '@/features/module/premium';
import { formsFor } from '@/features/module/forms';
import { EIGEN_DEEL } from '@/features/module/regios';
import { taalDeelVan } from '@/content/loadTaal';
import { voorrangVoor } from '@/features/module/groepen';
import { startbareOnderdelen, type Gespeeld, type Onderdeel } from '@/features/module/onderdelen';
import { loadItemStates } from '@/store/progress';
import { groepVanActiefKind } from '@/store/children';
import { leesDagstand, schrijfDagstand } from '@/store/dagstandStore';
import { standVoor, voortgangVan, volgendeSet, type Voortgang } from './dagstand';

/**
 * Vandaag, voor de twee plekken die het nodig hebben (ADR-139).
 *
 * De voordeur toont het plan; het uitslagscherm zegt hoeveel er nog van vandaag
 * over is en schakelt door. Dat is dezelfde rekensom, en twee keer dezelfde
 * rekensom is een keer te veel — zeker als één ervan ook vastlegt waar de dag
 * mee begon.
 *
 * Het vastleggen gebeurt hier, bij het eerste bezoek op een dag. Dat is een
 * schrijfactie die niemand vroeg, en daarom precies één: `standVoor` geeft de
 * bewaarde stand terug zodra die van vandaag is.
 */

export interface Vandaag {
  readonly plan: Dagplan<Onderdeel>;
  readonly voortgang: Voortgang;
  /** De eerstvolgende ronde van vandaag, of null als vandaag klaar is. */
  readonly volgende: { readonly deel: Onderdeel; readonly ids: readonly string[] } | null;
  /**
   * Hoeveel er morgen klaarstaat: dezelfde rekensom, een dag verder.
   *
   * Leitner weet dit allang — elk onderdeel draagt zijn eigen `volgendeReview` —
   * en het product zei het nooit. Bij hoogstens tien minuten per dag is de
   * laatste zin die een kind ziet het enige dat over morgen kan gaan, en een
   * product dat eindigt met wat er net gebeurde, eindigt met het verleden.
   *
   * Wat vandaag is geoefend, schuift vooruit en telt hier niet mee. Wat vandaag
   * bleef liggen wél: dat staat er morgen nog steeds.
   */
  readonly morgen: number;
}

const DAG_MS = 86_400_000;

/**
 * Waarover het plan gaat: elke set die een eigen Leitner-doos heeft.
 *
 * Mixen tellen niet mee. Een mix is de andere sets bij elkaar, dus zijn
 * onderdelen staan al ergens in — meetellen zou elke vraag twee keer plannen en
 * "22 vragen klaar" maken van elf. De foutenlijsten vallen af om dezelfde
 * reden: dat is een dwarsdoorsnede, geen set.
 */
export function planSets(alles: readonly Onderdeel[]): readonly PlanSet<Onderdeel>[] {
  return alles
    .filter(
      (deel) => !deel.mix && !(isPremiumOnderwerp(deel.setId) || isFoutenOnderwerp(deel.setId)),
    )
    .map((deel) => ({ sleutel: deel.setId, set: deel, items: deel.items }));
}

export function useVandaag(now: Date = new Date()): Vandaag | null {
  const [geladen, setGeladen] = useState<{
    readonly states: ReadonlyMap<string, ItemState>;
    readonly groep: Groep | undefined;
  } | null>(null);
  const [vandaag, setVandaag] = useState<Vandaag | null>(null);

  useEffect(() => {
    void Promise.all([loadItemStates(), groepVanActiefKind(now)]).then(([states, groep]) =>
      setGeladen({ states, groep }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (geladen === null) return;
    const { states, groep } = geladen;

    // Wat bij de groep past, gaat voor bij gelijk wachten (ADR-151). Het
    // onthouden beslist eerst; zonder groep is dit het plan van altijd.
    const voorrang = voorrangVoor(groep);
    const sets = planSets(startbareOnderdelen());
    const plan = dagplan(sets, states, now, voorrang);
    const morgen = dagplan(sets, states, new Date(now.getTime() + DAG_MS), voorrang).vragen;
    const open = plan.rondes.map((ronde) => ronde.set.setId);

    void (async () => {
      const bewaard = await leesDagstand();
      const stand = standVoor(bewaard, open, now);

      // Geen dag zolang er niets te doen was: dan is er niets af te maken en
      // niets te vieren, en er wordt niets weggeschreven.
      if (stand === null) {
        setVandaag({
          plan,
          voortgang: voortgangVan({ dag: '', sets: [] }, open),
          volgende: null,
          morgen,
        });
        return;
      }
      if (stand !== bewaard) await schrijfDagstand(stand);

      const eerste = volgendeSet(stand, open);
      const ronde = eerste === null ? null : plan.rondes.find((r) => r.set.setId === eerste);

      setVandaag({
        plan,
        voortgang: voortgangVan(stand, open),
        volgende: ronde ? { deel: ronde.set, ids: ronde.ids } : null,
        morgen,
      });
    })();
    // `now` is per render een nieuw object; de dag erin is wat telt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geladen]);

  return vandaag;
}

/**
 * Hoe dit kind deze set het laatst deed, en anders de eerste manier die de
 * module aanbiedt.
 *
 * Een geplande ronde hoort te voelen als de ronde die je gisteren deed, niet
 * als een manier die de app voor je koos. En nooit een premiummanier: dit blok
 * is er ook zonder code geweest, en een plan dat naar de betaalpagina leidt is
 * geen plan.
 */
export function vormVoor(deel: Onderdeel, gespeeld: readonly Gespeeld[]): ModeId {
  const laatst = gespeeld.find(
    (ronde) => ronde.deel.setId === deel.setId && !isPremiumVorm(ronde.ronde.mode),
  );
  if (laatst) return laatst.ronde.mode;
  return eersteVrijeVorm(deel);
}

/**
 * De eerste gratis manier die deze set aanbiedt (ADR-192).
 *
 * `formsFor` vraagt het deel en niet de set: bij Taal zijn werkwoorden en eigen
 * lijsten elk een eigen rij manieren, en met de set-id kreeg elke taalset de
 * manieren van spelling.
 */
export function eersteVrijeVorm(deel: Onderdeel): ModeId {
  const taalDeel =
    taalDeelVan(deel.setId) ?? (deel.setId.startsWith('taal-eigen-') ? EIGEN_DEEL : null);
  const vormen = formsFor(deel.moduleId, taalDeel);
  const gratis = vormen.find((vorm) => !isPremiumVorm(vorm.id));
  return gratis?.id ?? vormen[0]!.id;
}

/**
 * Zonder premium wordt een premiummanier de eerste gratis manier van die set
 * (ADR-192). Voor de rijen op Vandaag: wat een kind vóór de grens zocht of
 * typte, staat daar nog, en een kaart die op een slot uitloopt is geen kaart.
 */
export function vrijeVorm(deel: Onderdeel, mode: ModeId, premium: boolean): ModeId {
  return premium || !isPremiumVorm(mode) ? mode : eersteVrijeVorm(deel);
}
