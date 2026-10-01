import {
  aanDeBeurt,
  isDue,
  minutenVoor,
  TERUGKOMST_DAGEN,
  type ItemState,
  type ModeId,
} from '@/game-core';
import { isFoutenOnderwerp, isPremiumOnderwerp } from '@/features/module/premium';
import { startbareOnderdelen, type Gespeeld, type Onderdeel } from '@/features/module/onderdelen';
import { t } from '@/i18n';
import type { PlayedRound } from '@/store/progress';
import { NuDoenKaart } from './NuDoen';
import { vormVoor } from './useVandaag';

/** De eerste ronde na een tijd weg: kort, zodat hij makkelijk af te maken is. */
const EERSTE_RONDE = 9;

const DAG_MS = 86_400_000;

/**
 * Terugkomen na weken (ADR-149, ADR-158).
 *
 * Wie twee weken of langer geen ronde deed, wordt begroet als iemand die
 * terugkomt, niet als iemand die iets miste. Er staat geen aantal gemiste dagen
 * en er is niets weg: de diploma's staan er nog, en een ring loopt nooit terug. Wel
 * hoeveel stenen er klaarliggen, en hoe lang de eerste ronde duurt.
 *
 * Dat aantal is `aanDeBeurt`, en dat klopt precies: die telt alleen onderdelen
 * die eerder beantwoord zijn én nu aan de beurt zijn — en dat is woord voor
 * woord wat er te halen valt.
 *
 * **De eerste ronde is kort en makkelijk.** Negen vragen, uit de set met de
 * meeste plaatjes die terug moeten komen, en de sterkste eerst: wie drie weken
 * weg was, haalt anders op de eerste dag maar de helft goed (model in het
 * concept), en dat is een slechte eerste dag terug. Elke opfrisser in doos vijf
 * levert bovendien een stempel op.
 */
export interface Terugkomst {
  /** Hoeveel vragen er vandaag terugkomen. */
  readonly aantal: number;
  /** De eerste ronde terug: de set, en welke vragen. */
  readonly eerste: { readonly deel: Onderdeel; readonly ids: readonly string[] };
  readonly minuten: number;
}

/**
 * Of dit kind terugkomt, en met wat (ADR-149). Null als de laatste ronde
 * minder dan `TERUGKOMST_DAGEN` geleden is, of als er niets terug hoeft. Sinds
 * ADR-250 apart van de kaart, omdat Nu doen moet weten of hij er is.
 */
export function terugkomst(
  played: readonly PlayedRound[],
  states: ReadonlyMap<string, ItemState>,
  now: Date,
): Terugkomst | null {
  const laatste = played[0]?.at;
  if (laatste === undefined) return null;

  const weg = Math.floor((now.getTime() - new Date(laatste).getTime()) / DAG_MS);
  if (weg < TERUGKOMST_DAGEN) return null;

  const aantal = aanDeBeurt([...states.keys()], states, now);
  if (aantal === 0) return null;

  const eerste = eersteRonde(states, now);
  if (eerste === null) return null;
  return { aantal, eerste, minuten: minutenVoor(eerste.ids.length) };
}

/**
 * Welkom terug als Nu doen (ADR-250): de kaart zonder vak, want hij gaat over
 * alles wat je oefende. "Later" zet hem weg tot het kind een ronde deed, en
 * daarna is hij vanzelf weg: dan was de laatste ronde vandaag.
 */
export function TerugKaart({
  terug,
  gespeeld,
  onVerder,
  onLater,
}: {
  readonly terug: Terugkomst;
  readonly gespeeld: readonly Gespeeld[];
  readonly onVerder: (deel: Onderdeel, mode: ModeId, ids: readonly string[]) => void;
  readonly onLater: () => void;
}) {
  const { aantal, eerste, minuten } = terug;

  return (
    <NuDoenKaart
      kop={t('terug.zin')}
      regel={`${aantal === 1 ? t('terug.klaarEen') : t('terug.klaar', { aantal })} ${
        minuten === 1 ? t('terug.minuutEen') : t('terug.minuten', { minuten })
      }`}
      knop={t('terug.knop')}
      onStart={() => onVerder(eerste.deel, vormVoor(eerste.deel, gespeeld), eerste.ids)}
      onLater={onLater}
    />
  );
}

/** De set met de meeste plaatjes die terug moeten, en daaruit de sterkste negen. */
function eersteRonde(
  states: ReadonlyMap<string, ItemState>,
  now: Date,
): { readonly deel: Onderdeel; readonly ids: readonly string[] } | null {
  let beste: { deel: Onderdeel; ids: string[]; aantal: number } | null = null;
  for (const deel of startbareOnderdelen()) {
    if (deel.mix || isPremiumOnderwerp(deel.setId) || isFoutenOnderwerp(deel.setId)) continue;
    const terug = deel.items
      .map((item) => states.get(item.id))
      .filter((state): state is ItemState => state !== undefined && state.laatsteReview !== null)
      .filter((state) => isDue(state, now));
    if (terug.length > 0 && (beste === null || terug.length > beste.aantal)) {
      const ids = [...terug]
        .sort((a, b) => b.box - a.box)
        .slice(0, EERSTE_RONDE)
        .map((state) => state.itemId);
      beste = { deel, ids, aantal: terug.length };
    }
  }
  return beste === null ? null : { deel: beste.deel, ids: beste.ids };
}
