import { useEffect, useState } from 'react';
import { countMastered, formatGrade, grade, type ItemState, type ModeId } from '@/game-core';
import { NextIcon } from '@/components/Icon';
import { ProgressBar } from '@/components/ProgressBar';
import { RAIL_MODULES, type Module } from '@/features/shell/modules';
import { MODULE_ICON } from '@/features/shell/moduleIcons';
import { useDesk } from '@/features/shell/useSmallScreen';
import { t, type TranslationKey } from '@/i18n';
import { loadItemStates, loadPlayedRounds } from '@/store/progress';
import type { PlayedRound } from '@/store/progress';
import {
  geplaatst,
  meestGeoefend,
  naamVan,
  onderdelen,
  starters,
  startbareOnderdelen,
  POPULAR_SHOWN,
  type Gespeeld,
  type Onderdeel,
  type Populair,
} from '@/features/module/onderdelen';
import { ReeksBlok } from './ReeksBlok';
import { ScrollRij } from './ScrollRij';
import { FavorietenBlok, GoedBlok } from './SideColumn';
import { ToetsenBlok } from './ToetsenBlok';

/**
 * K1, the front door — which is also leer.nu itself.
 *
 * Redrawn in 2026-09 (ADR-094) and still the same argument, in the same order.
 * First the child's own name, and under it what doing this is. Then the ways
 * in — what this child goes back to most, what they did last and how it went,
 * and everything else there is, furthest along first. Then the child's own
 * column: the tests, the streak, how the whole of it is going, and their
 * favourites.
 *
 * **Two rows that scroll sideways, and one list.** "Meest geoefend" and
 * "Verder oefenen" are rows of cards at every size, one swipe, press or arrow
 * key from what is past the edge (`ScrollRij`). "Recent geoefend" is a list
 * (ADR-112): it is a log, read top to bottom, newest first, and a log laid on
 * its side made a child scroll to find out what they did yesterday.
 *
 * **The column moves, the page does not.** From 1200 it stands beside the rows.
 * Below that its blocks go into the flow of this page: the tests and the streak
 * side by side on a tablet above the rows, and the other two after them. Which
 * block goes where is decided here, in React, because it is the reading order
 * as well as the drawing (see `useDesk`).
 *
 * Two things it deliberately does not do. **It does not forecast** — "wat
 * onthoud je" is K9's. And **the test block is about the tests**: when they are
 * and what they are about, with no mark, no bar and no projection.
 */

/** How many rounds the history shows: as many as "meest geoefend" holds. */
const RECENT_SHOWN = POPULAR_SHOWN;

export interface HomeScreenProps {
  /** Whose front door this is. K1 opens by saying so. */
  readonly naam: string;
  /** The way to the streak's own page, which their column links to. */
  readonly onReeks: () => void;
  /**
   * One way into a round, whichever module it is in: the same one the child's
   * own column and the module pages use.
   */
  readonly onBegin: (deel: Onderdeel, mode: ModeId) => void;
  readonly onModule?: ((id: Module['id']) => void) | undefined;
}

export function HomeScreen({ naam, onReeks, onBegin, onModule }: HomeScreenProps) {
  const [states, setStates] = useState<Map<string, ItemState> | null>(null);
  const [played, setPlayed] = useState<readonly PlayedRound[]>([]);
  const desk = useDesk();

  useEffect(() => {
    void loadItemStates().then(setStates);
    void loadPlayedRounds().then(setPlayed);
  }, []);

  const known = states ?? new Map<string, ItemState>();

  // Over every set a round can be started on, mixes included: a round of the
  // Rekenmix that could not be placed would drop out of the history entirely.
  const gespeeld = geplaatst(played, startbareOnderdelen());
  const populair = meestGeoefend(gespeeld);

  const kop = (
    <div className="tk-home-kop">
      <h1 className="tk-titel">{t('home.welcome', { naam })}</h1>
      <p className="text-lopend text-tekst-secundair">{t('home.todayOpen')}</p>
    </div>
  );

  const rijen = (
    <>
      <Populairst populair={populair} onBegin={onBegin} />
      <Recent gespeeld={gespeeld} onBegin={onBegin} />
      <VerderOefenen known={known} onOpen={onModule} />
    </>
  );

  const toetsen = <ToetsenBlok />;
  const reeks = <ReeksBlok onReeks={onReeks} />;
  const goed = <GoedBlok />;
  const favorieten = <FavorietenBlok onBegin={onBegin} />;

  if (desk) {
    return (
      <div className="tk-home">
        <div className="tk-home-main">
          {kop}
          {rijen}
        </div>

        <aside className="tk-home-aside">
          {toetsen}
          {reeks}
          {goed}
          {favorieten}
        </aside>
      </div>
    );
  }

  // Below 1200 the tests and the streak are a pair above the rows: the two
  // blocks about this week, side by side on a tablet (ADR-110, ADR-112).
  return (
    <div className="tk-home">
      {kop}
      <div className="tk-home-paar">
        {toetsen}
        {reeks}
      </div>
      {rijen}
      {goed}
      {favorieten}
    </div>
  );
}

/**
 * One card in "meest geoefend": a mark, the exercise, the way it was done, and
 * under a rule how often.
 */
function GeoefendKaart({
  deel,
  vorm,
  status,
  onClick,
}: {
  readonly deel: Onderdeel;
  readonly vorm: string;
  readonly status: string;
  readonly onClick: () => void;
}) {
  const ModuleIcon = MODULE_ICON[deel.moduleId];

  return (
    <button type="button" data-module={deel.moduleId} className="tk-kaart" onClick={onClick}>
      <span className="tk-plaat tk-plaat-groot">
        <ModuleIcon size={24} />
      </span>
      <span className="tk-kaart-titel tk-kaart-titel-twee">{naamVan(deel)}</span>
      <span className="tk-kaart-regel">{vorm}</span>
      <span className="tk-kaart-voet">{status}</span>
    </button>
  );
}

/**
 * Where this child keeps going, most played first, with the count on each.
 *
 * **The count is this device's own.** There is no backend and nothing leaves
 * the machine (ADR-015), so there is no "most popular with everyone" and no
 * honest way to invent one. A profile with no rounds behind it is offered the
 * ones to start with, at nought rather than at a number that would be a guess.
 */
function Populairst({
  populair,
  onBegin,
}: {
  readonly populair: readonly Populair[];
  readonly onBegin: (deel: Onderdeel, mode: ModeId) => void;
}) {
  const leeg = populair.length === 0;
  const lijst = leeg ? starters() : populair;
  if (lijst.length === 0) return null;

  return (
    <ScrollRij
      titel={t('home.popularTitle')}
      onder={leeg ? <p className="text-tekst-secundair">{t('home.popularNew')}</p> : null}
    >
      {lijst.map(({ deel, mode, keer }) => (
        <GeoefendKaart
          key={`${deel.setId}-${mode}`}
          deel={deel}
          vorm={t(`mode.${mode}` as TranslationKey)}
          // Nought is a sentence rather than a nought: "0 keer gespeeld" reads
          // as a score on a child who has done nothing wrong.
          status={
            keer === 0
              ? t('home.popularNone')
              : keer === 1
                ? t('home.popularOnce')
                : t('home.popularTimes', { aantal: keer })
          }
          onClick={() => onBegin(deel, mode)}
        />
      ))}
    </ScrollRij>
  );
}

/**
 * What was just practised, and what it came to — newest first, as a list.
 *
 * A log and not a league table. The mark is over what was answered rather than
 * what was asked, because a round can be stopped early and the questions nobody
 * saw were not got wrong. Every row starts that same set the same way again.
 */
function Recent({
  gespeeld,
  onBegin,
}: {
  readonly gespeeld: readonly Gespeeld[];
  readonly onBegin: (deel: Onderdeel, mode: ModeId) => void;
}) {
  const recent = gespeeld.slice(0, RECENT_SHOWN);

  return (
    <section className="flex flex-col gap-3" aria-label={t('home.recentTitle')}>
      <h2 className="tk-sectie">{t('home.recentTitle')}</h2>

      {recent.length === 0 ? (
        <p className="text-tekst-secundair">{t('home.recentNone')}</p>
      ) : (
        <ul className="tk-lijst">
          {recent.map(({ deel, ronde }) => {
            const ModuleIcon = MODULE_ICON[deel.moduleId];
            const cijfer = grade(ronde.correct, ronde.answered);
            const uit = { goed: ronde.correct, totaal: ronde.answered };

            return (
              <li key={ronde.at}>
                <button
                  type="button"
                  data-module={deel.moduleId}
                  className="tk-lijstrij"
                  onClick={() => onBegin(deel, ronde.mode)}
                >
                  <span className="tk-plaat">
                    <ModuleIcon size={24} />
                  </span>
                  <span className="tk-lijstrij-tekst">
                    <span className="tk-lijstrij-titel">{naamVan(deel)}</span>
                    <span className="tk-lijstrij-regel">
                      {t(`mode.${ronde.mode}` as TranslationKey)}
                    </span>
                  </span>
                  <span className="tk-lijstrij-stand">
                    {cijfer === null
                      ? t('home.recentOutOf', uit)
                      : t('home.recentLine', { cijfer: formatGrade(cijfer), ...uit })}
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

/**
 * Everything else there is, furthest along first.
 *
 * All of them, not only the ones that are built (ADR-051): a child who can see
 * that flags are coming is reading a plan. The ones that exist are sorted by how
 * much of them is remembered, and the ones that do not come after all of them,
 * in the rail's order — a stable sort keeps it.
 */
function VerderOefenen({
  known,
  onOpen,
}: {
  readonly known: ReadonlyMap<string, ItemState>;
  readonly onOpen?: ((id: Module['id']) => void) | undefined;
}) {
  const alles = onderdelen();

  const kaarten = RAIL_MODULES.map((module) => {
    const ids = alles
      .filter((deel) => deel.moduleId === module.id)
      .flatMap((deel) => deel.items.map((item) => item.id));
    const mastered = countMastered(known, ids);

    return {
      module,
      totaal: ids.length,
      mastered,
      stand: ids.length === 0 ? 0 : mastered / ids.length,
      started: ids.some((id) => known.get(id)?.laatsteReview != null),
    };
  }).sort((a, b) => Number(b.module.built) - Number(a.module.built) || b.stand - a.stand);

  return (
    <ScrollRij titel={t('home.practiceMore')}>
      {kaarten.map(({ module, totaal, mastered, stand, started }) => {
        const ModuleIcon = MODULE_ICON[module.id];
        const onthoud = t('home.setMastered', { goed: mastered, totaal });

        return (
          <button
            key={module.id}
            type="button"
            data-module={module.id}
            data-accent="module"
            data-soon={module.built ? undefined : 'ja'}
            className="tk-kaart tk-verder"
            onClick={() => onOpen?.(module.id)}
          >
            <span className="tk-verder-kop">
              <span className="tk-plaat tk-plaat-groot">
                <ModuleIcon size={24} />
              </span>
              <span className="tk-kaart-titel">{t(module.name)}</span>
            </span>

            {/* The bar is the handoff's, and it is hidden from the
                accessibility tree: the whole card is one button, and a bar's
                own name folded into the button's is read out twice. What it
                shows is said in words instead, for the reader who cannot see
                it. */}
            {module.built ? (
              <>
                <span aria-hidden="true">
                  <ProgressBar value={stand} showDot={false} label={onthoud} />
                </span>
                <span className="tk-sr-only">{started ? onthoud : t('home.setNew')}</span>
              </>
            ) : (
              <span className="tk-kaart-regel">{t('soon.subtitle')}</span>
            )}
          </button>
        );
      })}
    </ScrollRij>
  );
}
