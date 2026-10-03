import { useEffect, useId, useRef, useState } from 'react';
import { StreakIcon } from '@/components/Icon';
import { t } from '@/i18n';
import { dagenGeoefend, dayKey, reeksVan, type Reeks } from '@/game-core';
import { loadPlayedRounds } from '@/store/progress';

/**
 * De dagen achter elkaar, bovenin op elke maat (ADR-259).
 *
 * Een ronde knop met de punten van de reeks, en een druk opent een kaartje:
 * het aantal in zon, de zin eronder en de week van maandag tot en met zondag,
 * met de dagen waarop geoefend is in zon. Een keuze van de eigenaar, naar het
 * ontwerp "Tablet en desktop": ADR-149 en ADR-158 hielden de reeks juist weg
 * bij het kind, omdat hij breekt op een lege dag. De rekensom is die van
 * `reeksVan` en verandert niet: alle dagen tellen, en vandaag breekt hij pas
 * vannacht.
 *
 * Niets wordt bewaard; de dagen komen uit de afgemaakte rondes, één keer
 * gelezen als de pagina opent. Na een ronde staat de schil opnieuw, en dan
 * telt de nieuwe dag mee.
 */
export function ReeksKnop({ kindId }: { readonly kindId: string }) {
  const [stand, zetStand] = useState<{ reeks: Reeks; week: WeekDag[] } | null>(null);
  const [open, zetOpen] = useState(false);
  const kaartId = useId();
  const doos = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let weg = false;
    // Van het kind dat nu oefent; `kindId` zegt alleen wanneer dat een ander is.
    void loadPlayedRounds().then((rondes) => {
      if (weg) return;
      const nu = new Date();
      const dagen = dagenGeoefend(rondes.map((ronde) => ronde.at));
      zetStand({ reeks: reeksVan(dagen, nu), week: dezeWeek(dagen, nu) });
    });
    return () => {
      weg = true;
    };
  }, [kindId]);

  // Dicht met Escape of met een tik ernaast, zoals elk kaartje dat opengaat.
  useEffect(() => {
    if (!open) return;
    const ernaast = (event: PointerEvent) => {
      if (!doos.current?.contains(event.target as Node)) zetOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') zetOpen(false);
    };
    document.addEventListener('pointerdown', ernaast);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', ernaast);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  const aantal = stand?.reeks.dagen ?? 0;

  return (
    <div ref={doos} className="tk-reeks">
      <button
        type="button"
        className="tk-reeks-knop"
        aria-label={t('reeks.knop', { aantal })}
        aria-expanded={open}
        aria-controls={kaartId}
        onClick={() => zetOpen(!open)}
      >
        <StreakIcon size={24} />
      </button>
      <div id={kaartId} className="tk-reeks-kaart" hidden={!open}>
        <div className="tk-reeks-kop">
          <span className="tk-reeks-getal" aria-hidden="true">
            {aantal}
          </span>
          <div className="tk-reeks-tekst">
            <p className="tk-reeks-titel">
              {aantal === 1 ? t('reeks.titelEen') : t('reeks.titel', { aantal })}
            </p>
            <p className="tk-reeks-zin">{stand === null ? null : zinVoor(stand.reeks)}</p>
          </div>
        </div>
        {stand === null ? null : (
          <ol className="tk-reeks-week" aria-label={t('reeks.week')}>
            {stand.week.map((dag) => (
              <li
                key={dag.dag}
                className="tk-reeks-dag"
                data-geoefend={dag.geoefend ? '' : undefined}
                data-vandaag={dag.vandaag ? '' : undefined}
                aria-label={t(dag.geoefend ? 'reeks.dagGeoefend' : 'reeks.dagNiet', {
                  dag: dag.naam,
                })}
              >
                <span aria-hidden="true">{dag.letter}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

interface WeekDag {
  readonly dag: string;
  readonly letter: string;
  readonly naam: string;
  readonly geoefend: boolean;
  readonly vandaag: boolean;
}

const LETTER = new Intl.DateTimeFormat('nl-NL', { weekday: 'narrow' });
const WEEKDAG = new Intl.DateTimeFormat('nl-NL', { weekday: 'long' });
const DATUM = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long' });

/** Maandag tot en met zondag van de week waarin `nu` valt. */
function dezeWeek(geoefend: ReadonlySet<string>, nu: Date): WeekDag[] {
  const maandag = nu.getDate() - ((nu.getDay() + 6) % 7);
  const vandaag = dayKey(nu);
  return Array.from({ length: 7 }, (_, plek) => {
    const datum = new Date(nu.getFullYear(), nu.getMonth(), maandag + plek);
    const dag = dayKey(datum);
    return {
      dag,
      letter: LETTER.format(datum).toUpperCase(),
      naam: WEEKDAG.format(datum),
      geoefend: geoefend.has(dag),
      vandaag: dag === vandaag,
    };
  });
}

/** De zin onder het getal: sinds wanneer, of wat er vandaag nog kan. */
function zinVoor(reeks: Reeks): string {
  if (reeks.dagen === 0) return t('reeks.geen');
  if (reeks.opHetSpel) return t('reeks.vandaagNog', { aantal: reeks.dagen + 1 });
  if (reeks.dagen === 1) return t('reeks.alleenVandaag');
  const nu = new Date();
  const begin = new Date(nu.getFullYear(), nu.getMonth(), nu.getDate() - (reeks.dagen - 1));
  const dag = reeks.dagen <= 7 ? WEEKDAG.format(begin) : DATUM.format(begin);
  return t('reeks.sinds', { dag });
}
