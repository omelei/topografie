import { useEffect, useState } from 'react';
import { formatGrade, grade, type Groep, type ModeId } from '@/game-core';
import { NextIcon } from '@/components/Icon';
import { ProgressBar } from '@/components/ProgressBar';
import { MODULE_ICON } from '@/features/shell/moduleIcons';
import { t, type TranslationKey } from '@/i18n';
import { loadOpenRounds, loadPlayedRounds } from '@/store/progress';
import { groepVanActiefKind } from '@/store/children';
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
import { usePremium } from '@/features/premium/usePremium';
import { ReeksRegel } from '@/features/toren/ReeksRegel';
import { TerugBlok } from './TerugBlok';
import { VandaagBlok } from './VandaagBlok';
import { ScrollRij } from './ScrollRij';
import { GroepVraag } from './GroepVraag';
import { WeekdoelenBlok } from './WeekdoelenBlok';

/**
 * K1, the front door — which is also leer.nu itself.
 *
 * Redrawn in 2026-09 (ADR-094) and still the same argument, in the same order.
 * First the child's own name, and under it what doing this is. Then the ways
 * in — what this child goes back to most, what they did last and how it went,
 * and what they started and did not finish.
 *
 * **Waar je begint staat bovenaan** (ADR-162). "Hier begin je mee vandaag" is
 * het eerste blok onder de begroeting, en het is de enige rij die zegt: druk
 * hier, dan oefen je. Voor wie al geoefend heeft is het dezelfde rij onder de
 * kop "Meest geoefend" — wat dit kind zelf het vaakst koos, is waar het vandaag
 * ook weer mee begint.
 *
 * **En "Waar je voor gaat" is "Je doelen voor deze week" geworden** (ADR-162):
 * één diploma dat maanden kon duren, vervangen door een handvol doelen met een
 * zondag eraan, zelf gemaakt en weg te laten.
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
 * **Er staat geen kolom meer naast** (ADR-168). Van de vier blokken die de
 * eigen kolom ooit droeg was "Jouw favorieten" het laatste, en het was een
 * derde weg naar dezelfde ronde: "Meest geoefend" staat bovenaan deze pagina en
 * "Recent geoefend" eronder, allebei met dezelfde set en dezelfde manier achter
 * de knop. Drie lijsten van hetzelfde is geen keuze maar ruis, en het was de
 * enige daarvan die alleen boven 1200 bestond — dus wat een kind op de laptop
 * van thuis als "zijn plek" leerde kennen, was op de tablet van school weg.
 * Eén kolom, op elke maat.
 *
 * One thing it deliberately does not do: **it does not forecast** — "wat
 * onthoud je" is K9's.
 */

/** How many rounds the history shows: as many as "meest geoefend" holds. */
const RECENT_SHOWN = POPULAR_SHOWN;

/** How many unfinished rounds the row holds. It scrolls; ten is a week of stopping. */
const OPEN_SHOWN = 10;

export interface HomeScreenProps {
  /** Whose front door this is. K1 opens by saying so. */
  readonly naam: string;
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
  /** Naar alle diploma's, op Jij (ADR-153). */
  readonly onDiplomas: () => void;
}

export function HomeScreen({ naam, onBegin, onVerder, onPlan, onDiplomas }: HomeScreenProps) {
  const [played, setPlayed] = useState<readonly PlayedRound[]>([]);
  const [open, setOpen] = useState<readonly OpenRound[] | null>(null);
  const [groep, setGroep] = useState<Groep | undefined>(undefined);

  useEffect(() => {
    void loadPlayedRounds().then(setPlayed);
    void loadOpenRounds().then(setOpen);
    void groepVanActiefKind().then(setGroep);
  }, []);

  // Over every set a round can be started on, mixes included: a round of the
  // Rekenmix that could not be placed would drop out of the history entirely.
  const alles = startbareOnderdelen();
  const gespeeld = geplaatst(played, alles);
  const populair = meestGeoefend(gespeeld);

  const kop = (
    <div className="tk-home-kop">
      <div className="tk-home-welkom">
        <h1 className="tk-titel">{t('home.welcome', { naam })}</h1>
        <p className="text-lopend text-tekst-secundair">{t('home.todayOpen')}</p>
      </div>
    </div>
  );

  // Wie twee weken weg was, hoort eerst dat het album er nog staat, en wat de
  // eerste ronde terug kost (ADR-149). Niets als er niets te zeggen is.
  const terug = <TerugBlok played={played} gespeeld={gespeeld} onVerder={onVerder} />;

  // Met premium bovenaan, boven alles: dan is het het enige blok dat zegt wat er
  // nú te doen is, met een knop per ronde (ADR-126). Zonder premium is het een
  // getal en een slot, en dat is geen opdracht: wie binnenkomt, ziet dan eerst
  // waar hij kan beginnen, en het blok staat onder de rijen (ADR-152).
  //
  // De sleutel is de groep: wie die op de voordeur kiest, ziet het plan meteen
  // in de nieuwe volgorde, zonder de pagina te verlaten (ADR-151). Met de naam
  // van het blok ervoor, want Vandaag en het doel staan naast elkaar in
  // dezelfde kolom en zouden anders dezelfde sleutel dragen.
  const { actief } = usePremium();
  const vandaag = (
    <VandaagBlok key={`vandaag-${groep ?? 'geen'}`} gespeeld={gespeeld} onPlan={onPlan} />
  );
  const vandaagBoven = actief ? vandaag : null;
  const vandaagOnder = actief ? null : vandaag;

  // Eén keer, voor een kind dat er al was vóór de vraag naar de groep: onder
  // Vandaag, zodat het plan er eerst staat en niemand wacht (ADR-151).
  const groepVraag = <GroepVraag onGekozen={setGroep} />;

  // En wat dit kind zich deze week voorneemt (ADR-162). Onder de rij waar het
  // mee begint en onder "Vandaag": eerst waar je kunt drukken, dan wat er nu
  // aan de beurt is, dan waar het deze week heen moet. Andersom leest de
  // voordeur als een doelstelling met huiswerk eronder.
  //
  // Met de groep als sleutel, zoals Vandaag: wie hem op de voordeur kiest, ziet
  // meteen de diploma's die erbij passen (ADR-153).
  const weekdoelen = <WeekdoelenBlok key={`weekdoel-${groep ?? 'geen'}`} onDiplomas={onDiplomas} />;

  // Waar dit kind mee begint: de eerste rij van de pagina, want het is de enige
  // die zegt "druk hier, dan oefen je" (ADR-162).
  const beginnen = <Populairst populair={populair} groep={groep} onBegin={onBegin} />;

  const rijen = (
    <>
      <Recent gespeeld={gespeeld} onBegin={onBegin} />
      <MaakAf open={open} alles={alles} onVerder={onVerder} />
    </>
  );

  // Eén regel als er een reeks loopt en vandaag nog leeg is (ADR-158). De
  // weekkaart stond hier; die is met de toren vervallen.
  const reeksRegel = <ReeksRegel />;

  const kern = (
    <>
      {kop}
      {terug}
      {reeksRegel}
      {beginnen}
      {vandaagBoven}
      {groepVraag}
      {weekdoelen}
      {rijen}
      {vandaagOnder}
    </>
  );

  // Eén kolom, op elke maat (ADR-168). De kolom ernaast is weg.
  return <div className="tk-home">{kern}</div>;
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
  groep,
  onBegin,
}: {
  readonly populair: readonly Populair[];
  /** Waarmee een nieuw kind begint, hangt af van zijn groep (ADR-151). */
  readonly groep: Groep | undefined;
  readonly onBegin: (deel: Onderdeel, mode: ModeId) => void;
}) {
  const leeg = populair.length === 0;
  const lijst = leeg ? starters(groep) : populair;
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
