import { NextIcon } from '@/components/Icon';
import type { ModeId } from '@/game-core';
import { naamVan, type Gespeeld, type Onderdeel } from '@/features/module/onderdelen';
import { PremiumSlot } from '@/features/premium/PremiumSlot';
import { usePremium } from '@/features/premium/usePremium';
import { MODULE_ICON } from '@/features/shell/moduleIcons';
import { t } from '@/i18n';
import { useVandaag, vormVoor } from './useVandaag';

/**
 * "Vandaag": wat er klaarstaat om te herhalen (ADR-126).
 *
 * De belofte van premium is dat leer.nu het herhalen plant. Die belofte stond
 * op de premiumpagina en nergens in het product: de Leitner-planning koos wel
 * wát een ronde vroeg, maar nooit wélke ronde je vandaag moest doen. Een kind
 * dat de voordeur opende kreeg drie rijen geschiedenis en geen opdracht.
 *
 * Dit blok is dat antwoord, en met premium staat het bovenaan omdat het de enige
 * plek in de app is die zegt wat er nú te doen is. Elke regel is één druk op de
 * knop: die set, de manier waarop dit kind hem het laatst deed, en alleen de
 * onderdelen die aan de beurt zijn. Zonder premium zet `HomeScreen` het onder
 * de rijen: een slot is geen eerste opdracht (ADR-152).
 *
 * **Zonder code staat er hoeveel, niet wat** (ADR-124's regel). Het getal is
 * waar en het is van het kind zelf — dat mag je niet achterhouden — maar het
 * plan zelf is waar premium voor is. Wie niets te herhalen heeft, ziet niets:
 * een leeg plan aanprijzen is een lege doos op slot doen.
 */
export function VandaagBlok({
  gespeeld,
  onPlan,
}: {
  readonly gespeeld: readonly Gespeeld[];
  readonly onPlan: (deel: Onderdeel, mode: ModeId, ids: readonly string[]) => void;
}) {
  const { actief } = usePremium();
  const vandaag = useVandaag();

  // Niets tot het bekend is: een blok dat "0 klaar" zegt en dan van gedachten
  // verandert heeft een kind iets verteld wat niet waar was.
  if (vandaag === null) return null;

  const { plan, voortgang } = vandaag;

  // Klaar voor vandaag (ADR-139). Hiervoor gaf dit blok `null` terug zodra er
  // niets meer openstond: de beloning voor precies op schema zijn was dat het
  // blok verdween. "Vandaag" is de vier rondes waar de dag mee begon, dus er
  // staat "klaar voor vandaag" en niet "je bent bij" — dat laatste zou onwaar
  // zijn zolang er verderop nog werk ligt.
  if (voortgang.klaar) {
    return (
      <section className="tk-vandaag" aria-label={t('vandaag.titel')}>
        <div className="flex flex-col gap-1">
          <h2 className="tk-sectie">{t('vandaag.titel')}</h2>
          <p className="text-lopend">{t('vandaag.klaarVoorVandaag')}</p>
          <p className="text-tekst-secundair">{t('vandaag.klaarUitleg')}</p>
        </div>
      </section>
    );
  }

  if (plan.vragen === 0) return null;

  return (
    <section className="tk-vandaag" aria-label={t('vandaag.titel')}>
      <div className="flex flex-col gap-1">
        <h2 className="tk-sectie">{t('vandaag.titel')}</h2>
        {/* Twee zinnen, elk waar op zijn eigen plek. Met een code staan de
            vragen echt klaar — er is een knop. Zonder code is het een feit over
            dit kind en geen wachtrij: die vragen zijn gewoon te oefenen in hun
            eigen set, alleen niet met één druk vanaf hier. */}
        {voortgang.gedaan > 0 ? (
          <p className="text-tekst-secundair">
            {t('vandaag.gedaan', { gedaan: voortgang.gedaan, totaal: voortgang.totaal })}
          </p>
        ) : null}
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
