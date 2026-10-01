import { CorrectIcon, NextIcon } from '@/components/Icon';
import type { ModeId } from '@/game-core';
import { naamVan, type Gespeeld, type Onderdeel } from '@/features/module/onderdelen';
import { MODULE_ICON } from '@/features/shell/moduleIcons';
import { t } from '@/i18n';
import { vormVoor, type Vandaag } from './useVandaag';

/** Hoeveel rondes van vandaag als vaktegel staan; de rest is een lijst (ADR-238). */
const TEGELS = 3;

/**
 * "Vandaag": wat er klaarstaat om te herhalen (ADR-126).
 *
 * De belofte van premium is dat leer.nu het herhalen plant. Die belofte stond
 * op de premiumpagina en nergens in het product: de Leitner-planning koos wel
 * wát een ronde vroeg, maar nooit wélke ronde je vandaag moest doen. Een kind
 * dat de voordeur opende kreeg drie rijen geschiedenis en geen opdracht.
 *
 * Sinds ADR-250 is dit blok drie dingen op drie plekken, en `HomeScreen`
 * kiest:
 *
 * - **Met premium en iets te herhalen** de tegels, als Nu doen bovenaan. Elke
 *   tegel is één druk op de knop: die set, de manier waarop dit kind hem het
 *   laatst deed, en alleen de onderdelen die aan de beurt zijn.
 * - **Met premium en klaar** de bevestiging, onder Nu doen (ADR-139): de
 *   beloning voor op schema zijn is niet dat het blok verdwijnt.
 * - **Zonder premium** één regel met het getal, onderaan. Het getal is waar en
 *   van het kind zelf (ADR-124's regel), het plan is waar premium voor is. Er
 *   staat geen slot en geen knop naar premium: een kind koopt niets (R-11), en
 *   wat er te kiezen valt, leest de ouder op de premiumpagina.
 *
 * Wie niets te herhalen heeft, ziet niets: een leeg plan aanprijzen is een lege
 * doos op slot doen.
 */
export function VandaagHerhalen({
  vandaag,
  gespeeld,
  onPlan,
}: {
  readonly vandaag: Vandaag;
  readonly gespeeld: readonly Gespeeld[];
  readonly onPlan: (deel: Onderdeel, mode: ModeId, ids: readonly string[]) => void;
}) {
  const { plan, voortgang } = vandaag;

  // Hooguit drie rondes als vaktegel (Kleurblokken, ADR-238); wat er meer is,
  // staat eronder als de lijst van altijd.
  const tegels = plan.rondes.slice(0, TEGELS);
  const rest = plan.rondes.slice(TEGELS);

  return (
    <section className="tk-vandaag" aria-label={t('vandaag.titel')}>
      <div className="flex flex-col gap-1">
        <div className="tk-sectie">
          <h2>{t('vandaag.titel')}</h2>
          <span className="tk-sectie-meta">{t('vandaag.bijschrift')}</span>
        </div>
        {voortgang.gedaan > 0 ? (
          <p className="text-tekst-secundair">
            {t('vandaag.gedaan', { gedaan: voortgang.gedaan, totaal: voortgang.totaal })}
          </p>
        ) : null}
      </div>

      <ul className="tk-herhaaltegels">
        {tegels.map(({ set, ids }, plek) => {
          const mode = vormVoor(set, gespeeld);
          const ModuleIcon = MODULE_ICON[set.moduleId];

          return (
            <li key={set.setId}>
              <button
                type="button"
                data-module={set.moduleId}
                className="tk-herhaaltegel"
                onClick={() => onPlan(set, mode, ids)}
              >
                <span className="tk-herhaaltegel-vorm" aria-hidden="true" />
                {plek === 0 ? <span className="tk-herhaaltegel-stip" aria-hidden="true" /> : null}
                <span className="tk-plaat tk-plaat-tegel">
                  <ModuleIcon size={28} />
                </span>
                <span className="tk-herhaaltegel-tekst">
                  <span className="tk-herhaaltegel-titel">{naamVan(set)}</span>
                  <span className="tk-herhaaltegel-regel">
                    {ids.length === 1
                      ? t('vandaag.rondeEen')
                      : t('vandaag.ronde', { aantal: ids.length })}
                  </span>
                </span>
                {plek === 0 ? (
                  <span className="tk-herhaaltegel-pijl" aria-hidden="true">
                    <NextIcon size={22} />
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
      {rest.length === 0 ? null : (
        <ul className="tk-lijst">
          {rest.map(({ set, ids }) => {
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
                      {ids.length === 1
                        ? t('vandaag.rondeEen')
                        : t('vandaag.ronde', { aantal: ids.length })}
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
      )}
    </section>
  );
}

/** Klaar voor vandaag (ADR-139), als bevestiging onder Nu doen: in zon, want het is gehaald. */
export function KlaarVoorVandaag() {
  return (
    <section className="tk-klaar" aria-label={t('vandaag.titel')}>
      <span className="tk-klaar-teken" aria-hidden="true">
        <CorrectIcon size={22} />
      </span>
      <span className="tk-klaar-tekst">
        <span className="tk-klaar-kop">{t('vandaag.klaarVoorVandaag')}</span>
        <span className="tk-hulp">{t('vandaag.klaarUitleg')}</span>
      </span>
    </section>
  );
}

/**
 * Zonder premium: hoeveel er vandaag terugkomt, als feit. Het getal staat in
 * een schijf in nacht, zoals een getal buiten een vak.
 */
export function HerhaalRegel({ vragen }: { readonly vragen: number }) {
  return (
    <section className="tk-herhaalregel" aria-label={t('vandaag.titel')}>
      <span className="tk-herhaalregel-getal" data-tint="nacht" aria-hidden="true">
        {vragen}
      </span>
      <p className="tk-hulp">
        {vragen === 1 ? t('vandaag.eenVraag') : t('vandaag.vragen', { aantal: vragen })}
      </p>
    </section>
  );
}
