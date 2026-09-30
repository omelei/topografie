import { Geheugencheck, type CheckKlaar } from './Geheugencheck';
import { Fragment, useEffect, useState, type ReactNode } from 'react';
import { Brandmark } from '@/components/Brandmark';
import {
  formatGrade,
  grade,
  huidigeGroep,
  isKleutergroep,
  type Groep,
  type ModeId,
} from '@/game-core';
import { NextIcon } from '@/components/Icon';
import { ProgressBar } from '@/components/ProgressBar';
import { MODULE_ICON } from '@/features/shell/moduleIcons';
import type { Module } from '@/features/shell/modules';
import { useVandaag, vrijeVorm } from './useVandaag';
import { t, type TranslationKey } from '@/i18n';
import { loadOpenRounds, loadPlayedRounds } from '@/store/progress';
import {
  getActiveChild,
  groepOnbekend,
  setGroep as bewaarGroep,
  zetGroepOnbekend,
} from '@/store/children';
import { tel } from '@/store/teller';
import type { OpenRound, PlayedRound } from '@/store/progress';
import {
  geplaatst,
  meestGeoefend,
  naamVan,
  starters,
  startbareOnderdelen,
  voorGroep,
  POPULAR_SHOWN,
  type Gespeeld,
  type Onderdeel,
  type Populair,
} from '@/features/module/onderdelen';
import { usePremium } from '@/features/premium/usePremium';
import { GroepVraag, VakkenRaster, VoorKleuters, ZoWerktHet } from './Kennismaken';
import { TerugBlok } from './TerugBlok';
import { VandaagBlok } from './VandaagBlok';
import { ScrollRij } from './ScrollRij';
import { NaamUitnodiging, VoorWieNieuwIs } from './NogZonderNaam';
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
  /** Naar de pagina van een vak, vanuit "Kies een vak" (ADR-204). */
  readonly onVak: (id: Module['id']) => void;
  /** De geheugencheck, één keer per kind (ADR-228). */
  readonly onGeheugencheck: (check: CheckKlaar) => void;
  /** Naar de pagina voor ouders, voor wie nog geen naam heeft (ADR-229). */
  readonly onVoorOuders: () => void;
}

export function HomeScreen({
  naam,
  onBegin,
  onVerder,
  onPlan,
  onDiplomas,
  onVak,
  onGeheugencheck,
  onVoorOuders,
}: HomeScreenProps) {
  const [played, setPlayed] = useState<readonly PlayedRound[]>([]);
  // Of de rondes gelezen zijn: pas dan is "nog niets geoefend" waar, en
  // anders flitsen de blokken voor een nieuw kind langs bij een kind van jaren.
  const [gelezen, setGelezen] = useState(false);
  const [open, setOpen] = useState<readonly OpenRound[] | null>(null);
  const [groep, setGroep] = useState<Groep | undefined>(undefined);
  const [groepGelezen, setGroepGelezen] = useState(false);
  const [kindId, setKindId] = useState<string | null>(null);
  // Of dit kind op de vraag naar de groep "Weet ik niet" zei (ADR-243), en of
  // het net op "Andere groep" drukte.
  const [weetNiet, setWeetNiet] = useState(false);
  const [andereGroep, setAndereGroep] = useState(false);

  useEffect(() => {
    void loadPlayedRounds().then((rondes) => {
      setPlayed(rondes);
      setGelezen(true);
    });
    void loadOpenRounds().then(setOpen);
    void (async () => {
      const kind = await getActiveChild();
      setGroep(kind ? huidigeGroep(kind, new Date()) : undefined);
      setKindId(kind?.id ?? null);
      setWeetNiet(kind ? await groepOnbekend(kind.id) : false);
      setGroepGelezen(true);
    })();
  }, []);

  // De groep, gekozen op Vandaag (ADR-243): bewaard bij het kind, zoals op Jij,
  // en geteld zonder wie (ADR-210). Alleen de keuze zelf, en niet samen met
  // iets anders: wat een kind oefent, blijft op het apparaat.
  async function kiesGroep(gekozen: Groep | undefined) {
    if (kindId !== null) {
      await bewaarGroep(kindId, gekozen);
      if (gekozen === undefined) await zetGroepOnbekend(kindId);
    }
    tel('groep', gekozen === undefined ? '/geen' : `/${gekozen}`);
    setGroep(gekozen);
    setWeetNiet(gekozen === undefined);
    setAndereGroep(false);
  }

  // Over every set a round can be started on, mixes included: a round of the
  // Rekenmix that could not be placed would drop out of the history entirely.
  const alles = startbareOnderdelen();
  const gespeeld = geplaatst(played, alles);
  const populair = meestGeoefend(gespeeld);
  // Een kind zonder naam oefent gewoon (ADR-229); de voordeur groet het zonder
  // naam, en vraagt hem pas na de eerste ronde, als uitnodiging.
  const naamloos = naam.trim() === '';

  // Het welkomstvlak (Kleurblokken, ADR-238): het merkvlak van de pagina, met
  // Denker die zwaait over de rand. De vormen zijn versiering, staan stil en
  // dragen geen tekst.
  const kop = (
    <div className="tk-etalage tk-welkom">
      <span className="tk-welkom-vorm tk-welkom-cirkel" aria-hidden="true" />
      <span className="tk-welkom-vorm tk-welkom-zon" aria-hidden="true" />
      <span className="tk-welkom-vorm tk-welkom-room" aria-hidden="true" />
      <span className="tk-welkom-vorm tk-welkom-room-twee" aria-hidden="true" />
      <div className="tk-welkom-tekst">
        <h1 className="tk-welkom-kop">
          {naamloos ? t('home.welcomeZonderNaam') : t('home.welcome', { naam })}
        </h1>
        <WelkomRegel />
      </div>
      <span className="tk-welkom-denker">
        <Brandmark size={136} uitdrukking="zwaaien" />
      </span>
    </div>
  );

  // Wie twee weken weg was, hoort eerst dat zijn diploma's er nog hangen, en
  // wat de eerste ronde terug kost (ADR-149). Niets als er niets te zeggen is.
  const terug = <TerugBlok played={played} gespeeld={gespeeld} onVerder={onVerder} />;

  // Met premium bovenaan, boven alles: dan is het het enige blok dat zegt wat er
  // nú te doen is, met een knop per ronde (ADR-126). Zonder premium is het een
  // getal en een slot, en dat is geen opdracht: wie binnenkomt, ziet dan eerst
  // waar hij kan beginnen, en het blok staat onder de rijen (ADR-152).
  //
  // De sleutel is de groep: die wordt na het openen gelezen, en het plan volgt
  // hem (ADR-151), ook als hij bovenaan deze pagina gekozen wordt (ADR-243).
  // Met de naam van het blok ervoor, want Vandaag en het doel staan naast
  // elkaar in dezelfde kolom en zouden anders dezelfde sleutel dragen.
  const { actief } = usePremium();
  const vandaag = (
    <VandaagBlok key={`vandaag-${groep ?? 'geen'}`} gespeeld={gespeeld} onPlan={onPlan} />
  );
  const vandaagBoven = actief ? vandaag : null;
  const vandaagOnder = actief ? null : vandaag;

  // En wat dit kind zich deze week voorneemt (ADR-162). Onder de rij waar het
  // mee begint en onder "Vandaag": eerst waar je kunt drukken, dan wat er nu
  // aan de beurt is, dan waar het deze week heen moet. Andersom leest de
  // voordeur als een doelstelling met huiswerk eronder.
  //
  // Met de groep als sleutel, zoals Vandaag: de diploma's die erbij passen,
  // zodra hij gelezen is (ADR-153).
  const weekdoelen = <WeekdoelenBlok key={`weekdoel-${groep ?? 'geen'}`} onDiplomas={onDiplomas} />;

  // Een nieuw kind: eerst waar het begint, dan de vakken en hoe het werkt
  // (ADR-204). Wie al geoefend heeft, heeft de vakken onderaan: de rijen
  // erboven zijn dan zijn eigen weg terug.
  // Nieuw is: nog geen ronde af én geen ronde half. Wie er één stopte, heeft
  // "Maak af" nodig en is geen beginner meer.
  const nieuw = gelezen && played.length === 0 && open !== null && open.length === 0;

  // Een nieuw kind zonder groep krijgt eerst de vraag naar de groep (ADR-243),
  // want de groep bepaalt waarmee het begint. Wie "Weet ik niet" zei, krijgt
  // hem niet terug; wie op "Andere groep" drukt, wel.
  const groepVraag =
    nieuw && ((groep === undefined && !weetNiet) || andereGroep) ? (
      <GroepVraag gekozen={groep === undefined && !weetNiet ? null : groep} onKies={kiesGroep} />
    ) : null;

  // Waar dit kind mee begint: de eerste rij van de pagina, want het is de enige
  // die zegt "druk hier, dan oefen je" (ADR-162). Voor een nieuw kind zijn dat
  // de vijf onderwerpen van zijn groep, één per vak, en kiest het zelf waarmee
  // (ADR-243). Wie al geoefend heeft, ziet de rij als "Meest geoefend", ook
  // zonder naam. Groep 1 en 2 hebben nog geen onderwerpen, en krijgen hier te
  // horen dat die eraan komen (ADR-244).
  const beginnen =
    groepVraag !== null ? null : nieuw && isKleutergroep(groep) ? (
      <VoorKleuters />
    ) : (
      <Populairst populair={populair} groep={groep} premium={actief} onBegin={onBegin} />
    );

  // Onder die rij, zolang het kind nieuw is: een andere groep kiezen. Onder de
  // kaarten en niet erboven, want eerst kiest het waarmee het begint. Zonder
  // naam in dezelfde rij als "Ik ben een ouder".
  const andereGroepKnop =
    nieuw && groepVraag === null ? (
      <button
        type="button"
        className="tk-button tk-button-tertiary"
        onClick={() => setAndereGroep(true)}
      >
        {groep === undefined ? t('home.begin.kiesGroep') : t('home.begin.andereGroep')}
      </button>
    ) : null;

  // Wat bij de groep past en nog niet gedaan is, onder wat het vaakst gedaan
  // is (ADR-206). Zo doet de groep ook iets voor wie al geoefend heeft.
  const passend = (
    <PastBijGroep gespeeld={gespeeld} groep={groep} premium={actief} onBegin={onBegin} />
  );
  const vakken = <VakkenRaster onVak={onVak} />;

  // Elk blok met een vaste sleutel: als de rondes gelezen zijn en de pagina
  // van volgorde wisselt, verhuist React de blokken in plaats van ze opnieuw
  // te bouwen, zodat een rij zijn focus en zijn scrollstand houdt.
  const blok = (sleutel: string, inhoud: ReactNode) => <Fragment key={sleutel}>{inhoud}</Fragment>;
  //
  // Zonder naam staan onder waar je begint de twee uitwegen van het oude
  // naamscherm: voor een ouder en voor een kind met een inlogcode (ADR-229).
  const gast = naamloos ? (
    <VoorWieNieuwIs onVoorOuders={onVoorOuders} ervoor={andereGroepKnop} />
  ) : andereGroepKnop === null ? null : (
    <div className="flex flex-wrap gap-3">{andereGroepKnop}</div>
  );
  // Pas als alles gelezen is, staat de rest er (ADR-229). Daarvoor alleen de
  // kop: de pagina tekende eerst de indeling voor wie al oefende en wisselde
  // dan naar die voor een nieuw kind, en alles onder het eerste blok sprong een
  // scherm omlaag. Sinds er geen naamscherm meer voor staat, is dat het eerste
  // wat een nieuwe bezoeker ziet, en Lighthouse zag het ook (CLS 0,36).
  const gelezenAlles = gelezen && open !== null && groepGelezen;
  const kern = !gelezenAlles
    ? [blok('kop', kop)]
    : nieuw
      ? [
          blok('kop', kop),
          blok('groepVraag', groepVraag),
          blok('beginnen', beginnen),
          blok('gast', gast),
          blok('vandaagBoven', vandaagBoven),
          blok('vakken', vakken),
          blok('zo', <ZoWerktHet />),
          blok('weekdoelen', weekdoelen),
          blok('vandaagOnder', vandaagOnder),
        ]
      : [
          blok('kop', kop),
          // Na de eerste ronde, één keer: hoe heet je? Weg te klikken (ADR-229).
          blok('naam', naamloos ? <NaamUitnodiging /> : null),
          blok('terug', terug),
          // Eén keer per kind, bovenaan zolang hij er is: het is een uitnodiging
          // en geen rij, en na één ronde is hij weg (ADR-228).
          blok('check', <Geheugencheck onStart={onGeheugencheck} />),
          blok('beginnen', beginnen),
          blok('passend', passend),
          blok('vandaagBoven', vandaagBoven),
          blok('weekdoelen', weekdoelen),
          blok('recent', <Recent gespeeld={gespeeld} premium={actief} onBegin={onBegin} />),
          blok('maakAf', <MaakAf open={open} alles={alles} premium={actief} onVerder={onVerder} />),
          blok('vandaagOnder', vandaagOnder),
          blok('vakken', vakken),
          blok('gast', gast),
        ];

  // Eén kolom, op elke maat (ADR-168). De kolom ernaast is weg.
  return <div className="tk-home">{kern}</div>;
}

/**
 * De zin onder de begroeting. Met premium en vragen die vandaag terug moeten:
 * hoeveel dat er zijn, want dat is wat er nu klaarstaat (ADR-238). Anders de
 * zin van altijd. Zonder code is dat getal een feit en geen wachtrij
 * (ADR-124), dus dan staat het alleen in het blok Vandaag herhalen.
 */
function WelkomRegel() {
  const { actief } = usePremium();
  const vandaag = useVandaag();
  const vragen = actief && vandaag !== null && !vandaag.voortgang.klaar ? vandaag.plan.vragen : 0;

  return (
    <p className="tk-welkom-tekstregel">
      {vragen === 0
        ? t('home.todayOpen')
        : vragen === 1
          ? t('home.welkomKlaarEen')
          : t('home.welkomKlaar', { aantal: vragen })}
    </p>
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
  readonly status: string | null;
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
      {status === null ? null : <span className="tk-kaart-voet">{status}</span>}
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
  premium,
  onBegin,
}: {
  readonly populair: readonly Populair[];
  /** Waarmee een nieuw kind begint, hangt af van zijn groep (ADR-151). */
  readonly groep: Groep | undefined;
  /**
   * Zonder premium geen aantal eronder, en een premiummanier wordt de eerste
   * gratis manier van die set (ADR-192). De volgorde blijft, want die zegt waar
   * je mee verder wilt; de telling is voortgang.
   */
  readonly premium: boolean;
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
    <ScrollRij
      titel={
        !leeg
          ? t('home.popularTitle')
          : groep === undefined
            ? t('home.popularStart')
            : t('home.popularStartGroep', { groep })
      }
    >
      {lijst.map(({ deel, mode, keer }) => (
        <GeoefendKaart
          key={`${deel.setId}-${mode}`}
          deel={deel}
          vorm={t(`mode.${vrijeVorm(deel, mode, premium)}` as TranslationKey)}
          // Nought is a sentence rather than a nought: "0 keer gespeeld" reads
          // as a score on a child who has done nothing wrong.
          status={
            !premium
              ? null
              : keer === 0
                ? t('home.popularNone')
                : keer === 1
                  ? t('home.popularOnce')
                  : t('home.popularTimes', { aantal: keer })
          }
          onClick={() => onBegin(deel, vrijeVorm(deel, mode, premium))}
        />
      ))}
    </ScrollRij>
  );
}

/**
 * "Past bij groep 6": per vak de set van de groep die dit kind nog niet deed
 * (ADR-206). Zonder groep, of als alles gedaan is, staat de rij er niet.
 */
function PastBijGroep({
  gespeeld,
  groep,
  premium,
  onBegin,
}: {
  readonly gespeeld: readonly Gespeeld[];
  readonly groep: Groep | undefined;
  readonly premium: boolean;
  readonly onBegin: (deel: Onderdeel, mode: ModeId) => void;
}) {
  if (groep === undefined || gespeeld.length === 0) return null;
  const lijst = voorGroep(groep, new Set(gespeeld.map(({ deel }) => deel.setId)));
  if (lijst.length === 0) return null;

  return (
    <ScrollRij titel={t('home.pastBijGroep', { groep })}>
      {lijst.map(({ deel, mode }) => {
        const vorm = vrijeVorm(deel, mode, premium);
        return (
          <GeoefendKaart
            key={deel.setId}
            deel={deel}
            vorm={t(`mode.${vorm}` as TranslationKey)}
            status={premium ? t('home.popularNone') : null}
            onClick={() => onBegin(deel, vorm)}
          />
        );
      })}
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
  premium,
  onBegin,
}: {
  readonly gespeeld: readonly Gespeeld[];
  /**
   * Zonder premium geen cijfer, en een premiummanier wordt de eerste gratis
   * manier van die set (ADR-192): de rij blijft de snelste weg terug naar wat
   * je net deed, de uitslag ervan is voortgang.
   */
  readonly premium: boolean;
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
            // Een cijfer alleen bij een toets (ADR-235): een oefenronde, met
            // hulp onderweg, krijgt geen oordeel maar een telling.
            const cijfer = ronde.toets === true ? grade(ronde.correct, ronde.answered) : null;
            const vorm = vrijeVorm(deel, ronde.mode, premium);
            const uit = { goed: ronde.correct, totaal: ronde.answered };

            return (
              <li key={ronde.at}>
                <button
                  type="button"
                  data-module={deel.moduleId}
                  className="tk-lijstrij"
                  onClick={() => onBegin(deel, vorm)}
                >
                  <span className="tk-plaat">
                    <ModuleIcon size={24} />
                  </span>
                  <span className="tk-lijstrij-tekst">
                    <span className="tk-lijstrij-titel">{naamVan(deel)}</span>
                    <span className="tk-lijstrij-regel">{t(`mode.${vorm}` as TranslationKey)}</span>
                  </span>
                  {premium ? (
                    <span className="tk-lijstrij-stand">
                      {cijfer === null
                        ? t('home.recentOutOf', uit)
                        : t('home.recentLine', { cijfer: formatGrade(cijfer), ...uit })}
                    </span>
                  ) : null}
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
  premium,
  onVerder,
}: {
  readonly open: readonly OpenRound[] | null;
  readonly alles: readonly Onderdeel[];
  /** Zonder premium gaat een ronde in een premiummanier verder op een gratis manier (ADR-192). */
  readonly premium: boolean;
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
            className="tk-kaart tk-maakaf"
            onClick={() => onVerder(deel, vrijeVorm(deel, ronde.mode, premium), ronde.rest)}
          >
            <span className="tk-plaat tk-plaat-groot">
              <ModuleIcon size={24} />
            </span>
            <span className="tk-kaart-titel">{naamVan(deel)}</span>
            <span className="tk-kaart-regel">
              {t(`mode.${vrijeVorm(deel, ronde.mode, premium)}` as TranslationKey)}
            </span>
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
