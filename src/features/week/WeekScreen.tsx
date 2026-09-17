import type { ReactNode } from 'react';
import { t } from '@/i18n';
import { useWeek } from './useWeek';
import { Jaarstrook, WeekdoelKiezer, WeekkaartVakjes, WeekStandZin } from './Weekkaart';

/** De regels van de weekkaart, in de volgorde waarin een kind ze tegenkomt. */
const REGELS = ['week.regel1', 'week.regel2', 'week.regel3'] as const;

/**
 * De pagina van de weekkaart (ADR-149), waar de reekspagina stond.
 *
 * **De kaart van deze week**, groot, met wat er nog nodig is. **Het weekdoel**,
 * dat een kind met een ouder kiest: twee tot vijf dagen. **De strook van het
 * schooljaar**, met een zegel voor elke week waarin het doel gehaald werd. En
 * **de regels**, uitgeschreven, want een kaart die een kind niet kan voorspellen
 * voelt oneerlijk zodra hij iets doet wat het niet verwachtte.
 *
 * Niet premium. De reekspagina was dat wel (ADR-116), en de getallen die daar
 * stonden, staan op Onthouden. Wat hier staat, is wat het kind deed.
 */
export function WeekScreen({ aside }: { readonly aside: ReactNode }) {
  const { week, kiesDoel } = useWeek();

  return (
    <div className="tk-page">
      <div className="tk-page-main">
        <h1 className="tk-titel">{t('week.titel')}</h1>

        {week === null ? null : (
          <>
            <section className="tk-card flex flex-col gap-4" aria-label={t('week.kaartLabel')}>
              <WeekkaartVakjes kaart={week.kaart} />
              <WeekStandZin kaart={week.kaart} />
            </section>

            <section className="flex flex-col gap-3" aria-label={t('week.doelTitel')}>
              <h2 className="tk-sectie">{t('week.doelTitel')}</h2>
              <p className="text-lopend">{t('week.doelUitleg')}</p>
              <WeekdoelKiezer doel={week.kaart.doel} onKies={kiesDoel} />
            </section>

            <section className="flex flex-col gap-3" aria-label={t('week.strookTitel')}>
              <h2 className="tk-sectie">{t('week.strookTitel')}</h2>
              <Jaarstrook strook={week.strook} />
            </section>

            <section className="flex flex-col gap-3" aria-label={t('week.regelsTitel')}>
              <h2 className="tk-sectie">{t('week.regelsTitel')}</h2>
              <ul className="tk-regels">
                {REGELS.map((regel) => (
                  <li key={regel}>{t(regel)}</li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
      {aside}
    </div>
  );
}
