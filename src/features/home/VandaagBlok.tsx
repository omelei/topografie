import { useEffect, useState } from 'react';
import { NextIcon } from '@/components/Icon';
import { dagplan, type ItemState, type ModeId, type PlanSet } from '@/game-core';
import { isPremiumOnderwerp, isPremiumVorm } from '@/features/module/premium';
import { formsFor } from '@/features/module/forms';
import { naamVan, type Gespeeld, type Onderdeel } from '@/features/module/onderdelen';
import { PremiumSlot } from '@/features/premium/PremiumSlot';
import { usePremium } from '@/features/premium/usePremium';
import { MODULE_ICON } from '@/features/shell/moduleIcons';
import { t } from '@/i18n';
import { loadItemStates } from '@/store/progress';

/**
 * "Vandaag": wat er klaarstaat om te herhalen (ADR-126).
 *
 * De belofte van premium is dat leer.nu het herhalen plant. Die belofte stond
 * op de premiumpagina en nergens in het product: de Leitner-planning koos wel
 * wát een ronde vroeg, maar nooit wélke ronde je vandaag moest doen. Een kind
 * dat de voordeur opende kreeg drie rijen geschiedenis en geen opdracht.
 *
 * Dit blok is dat antwoord, en het staat bovenaan omdat het de enige plek in de
 * app is die zegt wat er nú te doen is. Elke regel is één druk op de knop: die
 * set, de manier waarop dit kind hem het laatst deed, en alleen de onderdelen
 * die aan de beurt zijn.
 *
 * **Zonder code staat er hoeveel, niet wat** (ADR-124's regel). Het getal is
 * waar en het is van het kind zelf — dat mag je niet achterhouden — maar het
 * plan zelf is waar premium voor is. Wie niets te herhalen heeft, ziet niets:
 * een leeg plan aanprijzen is een lege doos op slot doen.
 */
export function VandaagBlok({
  alles,
  gespeeld,
  onPlan,
}: {
  readonly alles: readonly Onderdeel[];
  readonly gespeeld: readonly Gespeeld[];
  readonly onPlan: (deel: Onderdeel, mode: ModeId, ids: readonly string[]) => void;
}) {
  const { actief } = usePremium();
  const [states, setStates] = useState<ReadonlyMap<string, ItemState> | null>(null);

  useEffect(() => {
    void loadItemStates().then(setStates);
  }, []);

  // Niets tot het bekend is: een blok dat "0 klaar" zegt en dan van gedachten
  // verandert heeft een kind iets verteld wat niet waar was.
  if (states === null) return null;

  const plan = dagplan(planSets(alles), states, new Date());
  if (plan.vragen === 0) return null;

  return (
    <section className="tk-vandaag" aria-label={t('vandaag.titel')}>
      <div className="flex flex-col gap-1">
        <h2 className="tk-sectie">{t('vandaag.titel')}</h2>
        {/* Twee zinnen, elk waar op zijn eigen plek. Met een code staan de
            vragen echt klaar — er is een knop. Zonder code is het een feit over
            dit kind en geen wachtrij: die vragen zijn gewoon te oefenen in hun
            eigen set, alleen niet met één druk vanaf hier. */}
        <p className="text-lopend">
          {actief
            ? plan.vragen === 1
              ? t('vandaag.eenKlaar')
              : t('vandaag.klaar', { aantal: plan.vragen })
            : plan.vragen === 1
              ? t('vandaag.eenVraag')
              : t('vandaag.vragen', { aantal: plan.vragen })}
        </p>
      </div>

      {actief ? (
        <ul className="tk-lijst">
          {plan.rondes.map(({ set, ids }) => {
            const mode = vormVoor(set, gespeeld);
            const ModuleIcon = MODULE_ICON[set.moduleId];

            return (
              <li key={set.setId}>
                <button
                  type="button"
                  data-module={set.moduleId}
                  className="tk-lijstrij"
                  onClick={() => onPlan(set, mode, ids)}
                >
                  <span className="tk-plaat tk-plaat-klein">
                    <ModuleIcon size={20} />
                  </span>
                  <span className="tk-lijstrij-tekst">
                    <span className="tk-lijstrij-titel">{naamVan(set)}</span>
                    <span className="tk-lijstrij-regel">
                      {t('vandaag.ronde', { aantal: ids.length })}
                    </span>
                  </span>
                  <span className="tk-lijstrij-pijl">
                    <NextIcon size={20} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <PremiumSlot wat="premium.wat.vandaag" />
      )}
    </section>
  );
}

/**
 * Waarover het plan gaat: elke set die een eigen Leitner-doos heeft.
 *
 * Mixen tellen niet mee. Een mix is de andere sets bij elkaar, dus zijn
 * onderdelen staan al ergens in — meetellen zou elke vraag twee keer plannen en
 * "22 vragen klaar" maken van elf. De foutenlijsten vallen af om dezelfde
 * reden: dat is een dwarsdoorsnede, geen set.
 */
function planSets(alles: readonly Onderdeel[]): readonly PlanSet<Onderdeel>[] {
  return alles
    .filter((deel) => !deel.mix && !isPremiumOnderwerp(deel.setId))
    .map((deel) => ({ sleutel: deel.setId, set: deel, items: deel.items }));
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
function vormVoor(deel: Onderdeel, gespeeld: readonly Gespeeld[]): ModeId {
  const laatst = gespeeld.find(
    (ronde) => ronde.deel.setId === deel.setId && !isPremiumVorm(ronde.ronde.mode),
  );
  if (laatst) return laatst.ronde.mode;

  const vormen = formsFor(deel.moduleId, deel.setId);
  const gratis = vormen.find((vorm) => !isPremiumVorm(vorm.id));
  return gratis?.id ?? vormen[0]!.id;
}
