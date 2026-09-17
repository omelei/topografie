import { StampIcon } from '@/components/Icon';
import {
  WEEKDOEL_MAX,
  WEEKDOEL_MIN,
  type JaarWeek,
  type WeekDag,
  type Weekkaart as WeekkaartStand,
} from '@/game-core';
import { t, type TranslationKey } from '@/i18n';

/**
 * De weekkaart en wat erbij hoort (ADR-149).
 *
 * Zeven vakjes, maandag tot en met zondag, als een papieren stempelkaart. Een
 * dag met een afgemaakte ronde heeft een stempel; een lege dag is gewoon leeg,
 * en de dagen die nog komen zijn dunner. Het doel staat als lijn onder het vakje
 * waar het gehaald zou zijn, zodat een kind ziet hoeveel stempels het nodig heeft
 * zonder te rekenen.
 *
 * Er staat nergens "gemist" of "op rij". Een reeks brak op elke lege dag; deze
 * kaart kan niet breken.
 */

/** Maandag is 0 op de kaart, zondag 6; `dag.kort` telt zoals `Date.getDay`. */
function weekdagVan(index: number): number {
  return (index + 1) % 7;
}

function dagZin(dag: WeekDag): string {
  if (dag.vandaag) return dag.geoefend ? t('week.vandaagWel') : t('week.vandaagNiet');
  const naam = t(`dag.lang.${weekdagVan(dag.index)}` as TranslationKey);
  return dag.geoefend ? t('week.dagWel', { dag: naam }) : t('week.dagNiet', { dag: naam });
}

export function WeekkaartVakjes({ kaart }: { readonly kaart: WeekkaartStand }) {
  return (
    <ol className="tk-weekkaart" aria-label={t('week.kaartLabel')}>
      {kaart.dagen.map((dag) => (
        <li
          key={dag.dag}
          className="tk-weekvak"
          data-stempel={dag.geoefend ? 'ja' : undefined}
          data-vandaag={dag.vandaag ? 'ja' : undefined}
          data-later={dag.later ? 'ja' : undefined}
          data-doel={dag.index + 1 === kaart.doel ? 'ja' : undefined}
        >
          <span className="tk-weekvak-naam" aria-hidden="true">
            {t(`dag.kort.${weekdagVan(dag.index)}` as TranslationKey)}
          </span>
          <span className="tk-weekvak-stempel" aria-hidden="true">
            {dag.geoefend ? <StampIcon size={24} /> : null}
          </span>
          <span className="tk-sr-only">{dagZin(dag)}</span>
        </li>
      ))}
    </ol>
  );
}

/** Hoe de week ervoor staat, in één zin. */
export function WeekStandZin({ kaart }: { readonly kaart: WeekkaartStand }) {
  if (kaart.gehaald) return <p className="tk-week-stand">{t('week.gehaald')}</p>;
  const nog = kaart.doel - kaart.aantal;
  return (
    <p className="tk-week-stand">
      {t('week.stand', { aantal: kaart.aantal, doel: kaart.doel })}{' '}
      {nog === 1 ? t('week.nogEen') : t('week.nog', { aantal: nog })}
    </p>
  );
}

/** Twee tot vijf dagen, als keuzes naast elkaar. */
export function WeekdoelKiezer({
  doel,
  onKies,
}: {
  readonly doel: number;
  readonly onKies: (doel: number) => void;
}) {
  const keuzes = Array.from(
    { length: WEEKDOEL_MAX - WEEKDOEL_MIN + 1 },
    (_, index) => WEEKDOEL_MIN + index,
  );
  return (
    <div className="tk-keuzes" role="group" aria-label={t('week.doelTitel')}>
      {keuzes.map((aantal) => (
        <button
          key={aantal}
          type="button"
          className="tk-keuze"
          aria-pressed={aantal === doel}
          onClick={() => onKies(aantal)}
        >
          {t('week.doelKeuze', { aantal })}
        </button>
      ))}
    </div>
  );
}

const DATUM = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short' });

function datumVan(maandag: string): string {
  const [jaar, maand, dag] = maandag.split('-').map(Number);
  return DATUM.format(new Date(jaar ?? 1970, (maand ?? 1) - 1, dag ?? 1));
}

/**
 * De schooljaarstrook: een zegel voor elke week waarin het doel gehaald werd.
 * Een lege plek is een lege plek. Zegels tellen op en gaan nooit weg.
 */
export function Jaarstrook({ strook }: { readonly strook: readonly JaarWeek[] }) {
  const zegels = strook.filter((week) => week.zegel).length;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-tekst-secundair">
        {zegels === 0
          ? t('week.strookNul')
          : zegels === 1
            ? t('week.strookEen')
            : t('week.strookStand', { aantal: zegels })}
      </p>
      <ol className="tk-strook" aria-label={t('week.strookTitel')}>
        {strook.map((week) => (
          <li
            key={week.week}
            className="tk-zegel"
            data-zegel={week.zegel ? 'ja' : undefined}
            data-nu={week.nu ? 'ja' : undefined}
          >
            <span className="tk-sr-only">
              {week.nu
                ? t('week.zegelNu')
                : week.zegel
                  ? t('week.zegelWel', { datum: datumVan(week.maandag) })
                  : t('week.zegelNiet', { datum: datumVan(week.maandag) })}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
