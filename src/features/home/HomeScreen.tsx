import { useEffect, useState } from 'react';
import { formatGrade, grade, type ModeId } from '@/game-core';
import { NextIcon } from '@/components/Icon';
import { ProgressBar } from '@/components/ProgressBar';
import { MODULE_ICON } from '@/features/shell/moduleIcons';
import { useDesk } from '@/features/shell/useSmallScreen';
import { t, type TranslationKey } from '@/i18n';
import { loadOpenRounds, loadPlayedRounds } from '@/store/progress';
import type { OpenRound, PlayedRound } from '@/store/progress';
import {
  geplaatst,
  meestGeoefend,
  naamVan,
  starters,
  startbareOnderdelen,
  POPULAR_SHOWN,
  type Gespeeld,
  type Onderdeel,
  type Populair,
} from '@/features/module/onderdelen';
import { ReeksBlok } from './ReeksBlok';
import { HeldHoek } from '@/features/reis/HeldHoek';
import { DoelBlok } from './DoelBlok';
import { VandaagBlok } from './VandaagBlok';
import { ScrollRij } from './ScrollRij';
import { FavorietenBlok, GoedBlok } from './SideColumn';
import { ToetsenBlok } from './ToetsenBlok';

/**
 * K1, the front door — which is also leer.nu itself.
 *
 * Redrawn in 2026-09 (ADR-094) and still the same argument, in the same order.
 * First the child's own name, and under it what doing this is. Then the ways
 * in — what this child goes back to most, what they did last and how it went,
 * and what they started and did not finish. Then the child's own column: the
 * tests, the streak, how the whole of it is going, and their favourites.
 *
 * **Two rows that scroll sideways, and one list.** "Meest geoefend" and "Maak
 * af" are rows of cards at every size, one swipe, press or arrow key from what
 * is past the edge (`ScrollRij`). "Recent geoefend" is a list (ADR-112): it is
 * a log, read top to bottom, newest first.
 *
 * **"Maak af" took the place of "Verder oefenen"** (ADR-115). That row was one
 * tile per module with a bar of how much was remembered — a second way to the
 * rail's five doors, and a forecast in a place ADR-094 said should not have
 * one. What a child actually wants from the front door is the round they left
 * halfway: the provinces they stopped at seven, the clock they closed when
 * dinner was ready. Each card is one of those, and pressing it asks the
 * questions that round had not asked yet.
 *
 * **The column is beside the rows, or it is the tests alone.** From 1200 it
 * stands beside the rows. Below that only the tests stay, above the rows: they
 * are where a test is planned, and a phone is where a parent often does it. The
 * streak, "Goed beantwoord" and the favourites are not drawn below 1200
 * (ADR-119), which is decided here, in React, rather than hidden in CSS, so a
 * screen reader does not meet them either (see `useDesk`).
 *
 * Two things it deliberately does not do. **It does not forecast** — "wat
 * onthoud je" is K9's. And **the test block is about the tests**: when they are
 * and what they are about, with no mark, no bar and no projection.
 */

/** How many rounds the history shows: as many as "meest geoefend" holds. */
const RECENT_SHOWN = POPULAR_SHOWN;

/** How many unfinished rounds the row holds. It scrolls; ten is a week of stopping. */
const OPEN_SHOWN = 10;

export interface HomeScreenProps {
  /** Whose front door this is. K1 opens by saying so. */
  readonly naam: string;
  /** Welke held dit kind draagt, groot naast de begroeting (ADR-142). */
  readonly sticker: string | undefined;
  /** Een andere held kiezen. Gaat naar App, want de balk toont hem ook. */
  readonly onHeld: (sticker: string) => void;
  /** The way to the streak's own page, which their column links to. */
  readonly onReeks: () => void;
  /**
   * One way into a round, whichever module it is in: the same one the child's
   * own column and the module pages use.
   */
  readonly onBegin: (deel: Onderdeel, mode: ModeId) => void;
  /** An unfinished round, picked up: the same set and way, asking only the rest. */
  readonly onVerder: (deel: Onderdeel, mode: ModeId, rest: readonly string[]) => void;
  /**
   * Een geplande ronde: dezelfde set, dezelfde manier, en alleen de onderdelen
   * die vandaag aan de beurt zijn (ADR-126). Dat is wat "Maak af" ook doet, met
   * een andere reden — daar is de rest van een ronde, hier wat je bijna vergeet.
   */
  readonly onPlan: (deel: Onderdeel, mode: ModeId, ids: readonly string[]) => void;
}

export function HomeScreen({
  naam,
  sticker,
  onHeld,
  onReeks,
  onBegin,
  onVerder,
  onPlan,
}: HomeScreenProps) {
  const [played, setPlayed] = useState<readonly PlayedRound[]>([]);
  const [open, setOpen] = useState<readonly OpenRound[] | null>(null);
  const desk = useDesk();

  useEffect(() => {
    void loadPlayedRounds().then(setPlayed);
    void loadOpenRounds().then(setOpen);
  }, []);

  // Over every set a round can be started on, mixes included: a round of the
  // Rekenmix that could not be placed would drop out of the history entirely.
  const alles = startbareOnderdelen();
  const gespeeld = geplaatst(played, alles);
  const populair = meestGeoefend(gespeeld);

  const kop = (
    <div className="tk-home-kop">
      {/* De held van dit kind, groot, als eerste ding op het scherm (ADR-142).
          Naast de begroeting en niet erboven: samen zijn ze één zin — dit is
          jouw voordeur en dit ben jij. */}
      <HeldHoek sticker={sticker} onHeld={onHeld} />
      <div className="tk-home-welkom">
        <h1 className="tk-titel">{t('home.welcome', { naam })}</h1>
        <p className="text-lopend text-tekst-secundair">{t('home.todayOpen')}</p>
      </div>
    </div>
  );

  // Bovenaan, boven alles: het is het enige blok dat zegt wat er nú te doen is
  // (ADR-126). De rijen eronder zijn geschiedenis.
  const vandaag = <VandaagBlok gespeeld={gespeeld} onPlan={onPlan} />;

  // En waar het naartoe gaat (ADR-141). Onder "Vandaag" en niet erboven: eerst
  // wat er nu te doen is, dan waarvoor. Andersom leest de voordeur als een
  // doelstelling met huiswerk eronder.
  const doel = <DoelBlok gespeeld={gespeeld} onBegin={onBegin} />;

  const rijen = (
    <>
      <Populairst populair={populair} onBegin={onBegin} />
      <Recent gespeeld={gespeeld} onBegin={onBegin} />
      <MaakAf open={open} alles={alles} onVerder={onVerder} />
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
          {vandaag}
          {doel}
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

  // Below 1200 the tests alone, above the rows (ADR-119).
  return (
    <div className="tk-home">
      {kop}
      {vandaag}
      {doel}
      {toetsen}
      {rijen}
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
 * **The count is this device's own.** Progress never leaves the machine
 * (ADR-015), so there is no "most popular with everyone" and no honest way to
 * invent one. A profile with no rounds behind it is offered the ones to start
 * with, at nought rather than at a number that would be a guess.
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
    // De kop hangt af van wie ernaar kijkt. Voor een kind dat nog niets deed is
    // "Meest geoefend" een kop over een geschiedenis die niet bestaat, en het
    // is meteen het eerste wat het leest (ADR-131). De regel eronder zei dat al
    // en is nu de kop zelf, want twee keer hetzelfde is één keer te veel.
    <ScrollRij titel={leeg ? t('home.popularStart') : t('home.popularTitle')}>
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
 * The rounds this child started and did not finish, newest first (ADR-115).
 *
 * Each card is the set, the way it was being answered, and how far it got —
 * as a bar and in words, because "nog 8 van de 15" is what decides whether it
 * is worth doing before dinner. Pressing it asks exactly the questions that
 * round had not asked yet, in the same way, and nothing else.
 *
 * Empty is a sentence rather than an absent row: the row is where a stopped
 * round will be, and a child who has never stopped one should still learn
 * that it is there.
 */
function MaakAf({
  open,
  alles,
  onVerder,
}: {
  readonly open: readonly OpenRound[] | null;
  readonly alles: readonly Onderdeel[];
  readonly onVerder: (deel: Onderdeel, mode: ModeId, rest: readonly string[]) => void;
}) {
  const kaarten = (open ?? []).flatMap((ronde) => {
    const deel = alles.find((kandidaat) => kandidaat.setId === ronde.setId);
    return deel ? [{ deel, ronde }] : [];
  });
  const getoond = kaarten.slice(0, OPEN_SHOWN);

  return (
    <ScrollRij
      titel={t('home.openTitle')}
      // Nothing until the rounds are read, so the sentence for "nothing to
      // finish" never flashes past a child who has three.
      leeg={open !== null && getoond.length === 0 ? t('home.openNone') : undefined}
    >
      {getoond.map(({ deel, ronde }) => {
        const ModuleIcon = MODULE_ICON[deel.moduleId];
        const rest =
          ronde.rest.length === 1
            ? t('home.openRestOne', { totaal: ronde.totaal })
            : t('home.openRest', { aantal: ronde.rest.length, totaal: ronde.totaal });

        return (
          <button
            key={`${deel.setId}-${ronde.mode}`}
            type="button"
            data-module={deel.moduleId}
            className="tk-kaart"
            onClick={() => onVerder(deel, ronde.mode, ronde.rest)}
          >
            <span className="tk-plaat tk-plaat-groot">
              <ModuleIcon size={24} />
            </span>
            <span className="tk-kaart-titel tk-kaart-titel-twee">{naamVan(deel)}</span>
            <span className="tk-kaart-regel">{t(`mode.${ronde.mode}` as TranslationKey)}</span>
            {/* The bar is decorative: the words under it say the same, and the
                whole card is one button whose name is read once. */}
            <span aria-hidden="true">
              <ProgressBar value={ronde.beantwoord / ronde.totaal} showDot={false} label={rest} />
            </span>
            <span className="tk-kaart-voet">{rest}</span>
          </button>
        );
      })}
    </ScrollRij>
  );
}
