import type { ComponentType } from 'react';
import {
  BoltIcon,
  ChoiceIcon,
  DiplomaIcon,
  ExploreIcon,
  KeyboardIcon,
  PaperIcon,
  PointIcon,
  ShieldIcon,
  type IconProps,
} from '@/components/Icon';
import {
  alsTopoDiplomaSet,
  diplomaWerelddeelVanSet,
  isRekenDiplomaSet,
  isTaalDiplomaSet,
  KLOK_DIPLOMA_SETS,
  type ModeId,
  type RoundRule,
} from '@/game-core';
import { t, type TranslationKey } from '@/i18n';
import { isVlagFouten, isVlagMix } from '@/content/loadVlaggen';
import { isTaalFouten, isTaalMix } from '@/content/loadTaal';
import { EIGEN_DEEL } from './regios';
import { TAAL_ROUND_RULE } from '@/features/taal/taalRegels';
import { loadItemSets } from '@/content/loadSets';
import {
  isFoutenSet,
  isMixSet,
  ROUND_RULE,
  SETS,
  setsInRound,
  type SetId,
} from '@/features/practice/useRound';
import { SUM_ROUND_RULE } from '@/features/sums/useSumRound';
import { KLOK_ROUND_RULE } from '@/features/klok/useKlokRound';
import { VLAG_ROUND_RULE } from '@/features/vlaggen/useVlagRound';

/**
 * The ways of practising a module offers, in order of weight, each with a face.
 *
 * This replaces `round/modes.ts`, and it changes one thing that file was
 * explicit about: **the clock and the lives are in the list.** They used to be
 * chips beside it, on the argument that adding sixty seconds to something you
 * already know is not a way of learning it. That argument is still true, and it
 * is now made by the order and by the line under each name — which is where an
 * argument belongs, because a chip made it in a way that cost a child the thing
 * K2 exists for.
 *
 * What it cost: a chip started a round on the spot. So the two heaviest ways in
 * the product were the only two that skipped the sentence saying what was about
 * to happen, and a child who pressed one never read "Provincies aanwijzen · 15
 * vragen" at all. Now every way goes through the same three steps — what, how,
 * start — and the start button says what it is starting.
 *
 * Six is the ceiling, and it is a drawing rule rather than a limit on the
 * product: past six the grid stops being one glance and a seventh way is a
 * scroll before a child has chosen anything. A module with more than six ways
 * has a question to answer about which six to offer, and it should have to
 * answer it here rather than quietly growing a row.
 */

export interface PracticeForm {
  readonly id: ModeId;
  readonly name: TranslationKey;
  /** One line saying what this is for, which is what makes the order legible. */
  readonly reason: TranslationKey;
  readonly icon: ComponentType<Omit<IconProps, 'children'>>;
  /** How the round ends, or null for exploring, which is not a round. */
  readonly rule: RoundRule | null;
  /**
   * Seconds one question tends to take, for the estimate beside the start
   * button. Null where there is nothing honest to estimate: a round that ends
   * on three lives is exactly as long as the child is good.
   */
  readonly seconds: number | null;
  /**
   * Which sets this way of practising is offered for. Absent means all of them.
   *
   * Two ways need it and both for the same kind of reason. **Ontdekken** is
   * where a child meets a set for the first time, and a mix of everything is
   * not where anyone meets anything for the first time. A **tafeldiploma** is a
   * diploma for one table, so it is offered on a table and nowhere else — there
   * is no such thing as a diploma for "alle tafels door elkaar", and offering
   * one on a mix would mean inventing a certificate no school hands out.
   */
  readonly geldtVoor?: (setId: string) => boolean;
  /**
   * The way only the oefentoets asks in, never a tile of its own.
   *
   * Every other module's oefentoets answers in one of its own ways — typing —
   * so pressing the toets chooses a tile that is already there. Flags cannot
   * type (ADR-102), and the test they get alternates between the two ways that
   * exist; that alternation is a way of asking a child is never offered on its
   * own.
   */
  readonly alleenToets?: boolean;
  /**
   * A way whose length is part of what it is. A vlaggendiploma asks twenty
   * because that is the diploma, so "Hoeveel vragen?" is not asked under it —
   * the reason a tafeldiploma never showed the step, said out loud rather than
   * falling out of a table of ten having nothing shorter to offer.
   */
  readonly vasteLengte?: boolean;
}

/**
 * One glance, not a scroll. See the note above.
 *
 * Seven since ADR-117, and only on topography's maps: its six ways and the
 * topodiploma. That is one question answered here, as the note asks — the
 * diploma is not a way of practising but the test at the end of them, it is
 * offered only once a map is chosen, and with the oefentoets beside it the
 * grid is four rows of two rather than three and a half.
 */
export const MAX_FORMS = 7;

/**
 * Topography: the four that teach, then the two that put pressure on what is
 * already taught.
 *
 * Pointing asks where something is and is where a child meets a set for the
 * first time. Multiple choice narrows the field to four and is the step up to
 * typing rather than a way around it. Typing asks for the name unaided, which
 * is what a test will ask. Exploring asks nothing at all.
 */
export const TOPO_FORMS: readonly PracticeForm[] = [
  {
    id: 'wijs-aan',
    name: 'mode.wijs-aan',
    reason: 'way.wijs-aan',
    icon: PointIcon,
    rule: ROUND_RULE['wijs-aan'],
    seconds: 10,
  },
  {
    id: 'meerkeuze',
    name: 'mode.meerkeuze',
    reason: 'way.meerkeuze',
    icon: ChoiceIcon,
    rule: ROUND_RULE.meerkeuze,
    seconds: 8,
  },
  {
    id: 'hoe-heet-dit',
    name: 'mode.hoe-heet-dit',
    reason: 'way.hoe-heet-dit',
    icon: KeyboardIcon,
    rule: ROUND_RULE['hoe-heet-dit'],
    seconds: 14,
  },
  {
    id: 'ontdekken',
    name: 'mode.ontdekken',
    reason: 'way.ontdekken',
    icon: ExploreIcon,
    rule: null,
    seconds: null,
    // Nor a child's own list of mistakes: exploring is where a set is met.
    geldtVoor: (setId) => !isMixSet(setId) && !isFoutenSet(setId),
  },
  {
    id: 'bliksemronde',
    name: 'mode.bliksemronde',
    reason: 'way.bliksemronde',
    icon: BoltIcon,
    rule: ROUND_RULE.bliksemronde,
    seconds: null,
  },
  {
    id: 'overleven',
    name: 'mode.overleven',
    reason: 'way.overleven',
    icon: ShieldIcon,
    rule: ROUND_RULE.overleven,
    seconds: null,
  },
  {
    // Last, for the tafeldiploma's reason: it is the test at the end of the
    // practice rather than a way in. On one map at a time, and not on the
    // world, the Topomix or a list of mistakes (ADR-117).
    id: 'topo-diploma',
    name: 'mode.topo-diploma',
    reason: 'way.topo-diploma',
    icon: DiplomaIcon,
    rule: ROUND_RULE['topo-diploma'],
    seconds: 14,
    vasteLengte: true,
    geldtVoor: (setId) => alsTopoDiplomaSet(setId) !== null,
  },
];

/**
 * The tables, in the order every page has (ADR-112): choosing, then typing,
 * then the two with pressure, then the diploma. A sum has nothing to find, so
 * there is no "zoeken" here, and no exploring either — the seventh sum of the
 * table of seven is not somewhere a child can wander.
 *
 * ADR-049 had typing first on this page, on the argument that four plausible
 * products can be narrowed by a child who cannot do the sum. The argument is
 * still true, and it is now made by the line under each tile rather than by an
 * order no other page has: a child who learned on topography that the second
 * tile is the step up finds the same thing here.
 */
export const SUM_FORMS: readonly PracticeForm[] = [
  {
    id: 'som-meerkeuze',
    name: 'mode.som-meerkeuze',
    reason: 'way.som-meerkeuze',
    icon: ChoiceIcon,
    rule: SUM_ROUND_RULE['som-meerkeuze'],
    seconds: 6,
  },
  {
    id: 'som-typen',
    name: 'mode.som-typen',
    reason: 'way.som-typen',
    icon: KeyboardIcon,
    rule: SUM_ROUND_RULE['som-typen'],
    seconds: 8,
  },
  {
    id: 'bliksemronde',
    name: 'mode.bliksemronde',
    reason: 'way.bliksemronde',
    icon: BoltIcon,
    rule: SUM_ROUND_RULE.bliksemronde,
    seconds: null,
  },
  {
    id: 'overleven',
    name: 'mode.overleven',
    reason: 'way.overleven',
    icon: ShieldIcon,
    rule: SUM_ROUND_RULE.overleven,
    seconds: null,
  },
  {
    // Last, because it is the heaviest thing rekenen asks and because it is not
    // practice: it is the test at the end of it, the one a child already knows
    // from school. Ten sums, all of them right, and one mistake ends the
    // attempt — which is what makes it worth having and why it is not offered
    // as the way in.
    //
    // No clock, and that is a departure from the tafeltoets a teacher gives.
    // The product says on its own settings page that haste does not help you
    // remember, and it does not switch that off for the one exercise where a
    // child would feel it most (ADR-064).
    id: 'tafeldiploma',
    name: 'mode.tafeldiploma',
    reason: 'way.tafeldiploma',
    icon: DiplomaIcon,
    rule: SUM_ROUND_RULE.tafeldiploma,
    seconds: 8,
    vasteLengte: true,
    geldtVoor: (setId) => /^tafel-\d+$/.test(setId),
  },
  {
    // En op elke andere soort som hetzelfde, onder zijn eigen naam (ADR-168).
    // Twee tegels en niet één, omdat het twee verschillende toetsen zijn: de
    // tafel is foutloos en de rest haal je met negen op de tien. Op één set is
    // er altijd precies één van de twee te zien.
    id: 'reken-diploma',
    name: 'mode.reken-diploma',
    reason: 'way.reken-diploma',
    icon: DiplomaIcon,
    rule: SUM_ROUND_RULE['reken-diploma'],
    seconds: 8,
    vasteLengte: true,
    geldtVoor: isRekenDiplomaSet,
  },
];

/**
 * Klokkijken, in the order every page has (ADR-112): finding, choosing,
 * typing, then the two that put pressure on what is already read.
 *
 * **"Klok zoeken" is first, and it is the clock's zoeken.** The other ways all
 * show a face and ask what it says. This one shows a time and asks which of
 * four faces says it — the name given and the picture found, which is what
 * zoeken is on the map and on the flags. It is also the half a schoolbook
 * drills hardest, because it catches a child who has learned to recognise
 * twelve pictures.
 *
 * **Choosing is second.** The four times offered are the four mistakes children
 * actually make reading a face — an hour out, over for voor, the hands swapped
 * — so choosing between them is an exercise of its own (`klokDistractors`).
 *
 * **Typing is third and last of the three that teach**, for the reason the map
 * gives: writing "7:35" unaided is what a test asks.
 *
 * No exploring on a clock — twelve faces is not somewhere a child can wander.
 *
 * **And a klokdiploma last** (ADR-117). This comment used to say there was
 * none, because no Dutch school hands one out the way it does for a table. The
 * owner asked for one, and the argument that settles it is the product's own:
 * a diploma here is the test at the end of the practice, sat on one step of
 * the clock at a time, and a child who has read ten faces of kwartieren
 * without help has something worth having a name for.
 */
export const KLOK_FORMS: readonly PracticeForm[] = [
  {
    id: 'klok-welke-klok',
    name: 'mode.klok-welke-klok',
    reason: 'way.klok-welke-klok',
    // Pointing, because that is what it is: four faces and a finger. The mark
    // is the map's, and the two are never on a page together.
    icon: PointIcon,
    rule: KLOK_ROUND_RULE['klok-welke-klok'],
    seconds: 12,
  },
  {
    id: 'klok-meerkeuze',
    name: 'mode.klok-meerkeuze',
    reason: 'way.klok-meerkeuze',
    icon: ChoiceIcon,
    rule: KLOK_ROUND_RULE['klok-meerkeuze'],
    seconds: 10,
  },
  {
    id: 'klok-typen',
    name: 'mode.klok-typen',
    reason: 'way.klok-typen',
    icon: KeyboardIcon,
    rule: KLOK_ROUND_RULE['klok-typen'],
    seconds: 14,
  },
  {
    id: 'bliksemronde',
    name: 'mode.bliksemronde',
    reason: 'way.bliksemronde',
    icon: BoltIcon,
    rule: KLOK_ROUND_RULE.bliksemronde,
    seconds: null,
  },
  {
    id: 'overleven',
    name: 'mode.overleven',
    reason: 'way.overleven',
    icon: ShieldIcon,
    rule: KLOK_ROUND_RULE.overleven,
    seconds: null,
  },
  {
    id: 'klok-diploma',
    name: 'mode.klok-diploma',
    reason: 'way.klok-diploma',
    icon: DiplomaIcon,
    rule: KLOK_ROUND_RULE['klok-diploma'],
    seconds: 14,
    vasteLengte: true,
    geldtVoor: (setId) => (KLOK_DIPLOMA_SETS as readonly string[]).includes(setId),
  },
];

/**
 * Flags: the name to the flag, the flag to the name, then looking, then the
 * lives — and the oefentoets, which asks both ways round (ADR-102).
 *
 * **No typing, on purpose.** Topography and rekenen have it, and it stays out
 * of here: spelling "Azerbeidzjan" or "Kirgizië" is a spelling test, and this
 * is about knowing a flag when you see one. Consistency with the other modules
 * is not a reason to add it.
 *
 * **Vlag zoeken first**, because it is the clock's "Klok zoeken" with flags:
 * the name is given and the picture is the answer, which is the half a child
 * who knows a few flags by sight is least practised in. It is named after the
 * rule the other modules follow: when the options are pictures the way is
 * "{thing} zoeken", when they are words it is Meerkeuze.
 *
 * **A bliksemronde as well** (ADR-112). It was missing here, and every other
 * page has one: a minute of flags, both ways round, like the oefentoets.
 */
export const VLAG_FORMS: readonly PracticeForm[] = [
  {
    id: 'vlag-zoeken',
    name: 'mode.vlag-zoeken',
    reason: 'way.vlag-zoeken',
    icon: PointIcon,
    rule: VLAG_ROUND_RULE['vlag-zoeken'],
    seconds: 12,
  },
  {
    id: 'vlag-meerkeuze',
    name: 'mode.vlag-meerkeuze',
    reason: 'way.vlag-meerkeuze',
    icon: ChoiceIcon,
    rule: VLAG_ROUND_RULE['vlag-meerkeuze'],
    seconds: 10,
  },
  {
    id: 'ontdekken',
    name: 'mode.ontdekken',
    reason: 'way.ontdekken',
    icon: ExploreIcon,
    rule: null,
    seconds: null,
    // Where a child meets a set, and a mix of everything or a list of their
    // own mistakes is not where anyone meets anything.
    geldtVoor: (setId) => !isVlagMix(setId) && !isVlagFouten(setId),
  },
  {
    id: 'bliksemronde',
    name: 'mode.bliksemronde',
    reason: 'way.bliksemronde',
    icon: BoltIcon,
    rule: VLAG_ROUND_RULE.bliksemronde,
    seconds: null,
  },
  {
    id: 'overleven',
    name: 'mode.overleven',
    reason: 'way.overleven',
    icon: ShieldIcon,
    rule: VLAG_ROUND_RULE.overleven,
    seconds: null,
  },
  {
    // Last of the tiles, for the tafeldiploma's reason: it is not practice but
    // the test at the end of it. Offered on the whole of a werelddeel and
    // nowhere else — a diploma for the well-known flags would be a certificate
    // for the easy half (ADR-104).
    id: 'vlag-diploma',
    name: 'mode.vlag-diploma',
    reason: 'way.vlag-diploma',
    icon: DiplomaIcon,
    rule: VLAG_ROUND_RULE['vlag-diploma'],
    seconds: 12,
    vasteLengte: true,
    geldtVoor: (setId) => diplomaWerelddeelVanSet(setId) !== null,
  },
  {
    id: 'vlag-gemengd',
    name: 'mode.vlag-gemengd',
    reason: 'way.vlag-gemengd',
    icon: PaperIcon,
    rule: VLAG_ROUND_RULE['vlag-gemengd'],
    seconds: 12,
    alleenToets: true,
  },
];

/**
 * Spelling, in the order every page has (ADR-112) — and with three of its ways
 * missing on purpose (ADR-118).
 *
 * **No zoeken.** On the map the name is given and the place is found; the
 * spelling version would be a word given by ear and the right spelling found
 * among four. Three of those four would be the word spelled wrong, and a child
 * who looks at a wrong picture of a word keeps it. So the options here are
 * never words, only the letters that decide.
 *
 * **Kies de letters** is the meerkeuze: the sentence with the word in it and
 * the deciding letters open, and two to four letter pieces to put there. The
 * step up to writing, not a way round it.
 *
 * **Flitsdictee** is zelf typen: the word stands in its sentence for three
 * seconds, goes, and the child writes all of it — kijken, afdekken, schrijven,
 * controleren. The three seconds are for looking; the typing has no clock.
 *
 * **Ontdekken**: the set as a list, the deciding letters marked and the rule
 * in a sentence. Not on a mix or a list of mistakes, where nobody meets a set.
 *
 * **No bliksemronde.** Spelling is thinking, not recognising, and a clock on
 * it teaches guessing (businessplan v6 §5.8). This departs from ADR-112's
 * "a bliksemronde on every page", and ADR-118 says so.
 *
 * **Overleven**, over three lives, asks the letters. De oefentoets is de
 * flitsdictee, met niets gezegd tot het eind (`TOETS_VORM`).
 *
 * **En er is wél een diploma** (ADR-168). Hier stond dat geen school er een
 * uitdeelt voor spelling en dat het verzinnen ervan een verzonnen certificaat
 * is. Datzelfde argument stond bij de klok en bij de kaart, en ADR-117 heeft
 * het daar omgedraaid met de reden die hier net zo goed geldt: het diploma is
 * in dit product de toets aan het eind van het oefenen. Wat er stond, maakte
 * Taal het enige vak waar niets te halen viel.
 */
export const SPELLING_FORMS: readonly PracticeForm[] = [
  {
    id: 'taal-letters',
    name: 'mode.taal-letters',
    reason: 'way.taal-letters',
    icon: ChoiceIcon,
    rule: TAAL_ROUND_RULE['taal-letters'],
    seconds: 8,
  },
  {
    id: 'taal-flitsdictee',
    name: 'mode.taal-flitsdictee',
    reason: 'way.taal-flitsdictee',
    icon: KeyboardIcon,
    rule: TAAL_ROUND_RULE['taal-flitsdictee'],
    seconds: 12,
  },
  {
    id: 'ontdekken',
    name: 'mode.ontdekken',
    reason: 'way.ontdekken',
    icon: ExploreIcon,
    rule: null,
    seconds: null,
    geldtVoor: (setId) => !isTaalMix(setId) && !isTaalFouten(setId),
  },
  {
    id: 'overleven',
    name: 'mode.overleven',
    reason: 'way.overleven',
    icon: ShieldIcon,
    rule: TAAL_ROUND_RULE.overleven,
    seconds: null,
  },
  {
    // Het taaldiploma, als laatste (ADR-168). Zie `rewards.ts` voor waarom de
    // zin hierboven — "geen school deelt er een uit" — is omgedraaid.
    id: 'taal-diploma',
    name: 'mode.taal-diploma',
    reason: 'way.taal-diploma',
    icon: DiplomaIcon,
    rule: TAAL_ROUND_RULE['taal-diploma'],
    seconds: 12,
    vasteLengte: true,
    geldtVoor: isTaalDiplomaSet,
  },
];

/**
 * Een eigen lijst kent maar één manier (ADR-135).
 *
 * "Kies de letters", "Ontdekken" en "Overleven" vragen alle drie naar de letters
 * die beslissen, en die staan in het bestand naast het woord. Een ouder die de
 * lijst van school intypt schrijft geen gaten, en dat horen we ook niet te
 * vragen. Het flitsdictee laat het woord even zien en laat het dan typen — en
 * dat ís een dictee.
 *
 * Dit is een eigen deel van Taal en geen `geldtVoor` op de spellingvormen. Op
 * deze module staan de vormen er namelijk vóórdat een onderwerp gekozen is
 * (ADR-118), en `ModuleScreen` laat dan elke vorm mét een `geldtVoor` weg — dus
 * zou die aanpak "Kies de letters" van de spellingpagina halen.
 */
export const EIGEN_FORMS: readonly PracticeForm[] = [
  {
    id: 'taal-flitsdictee',
    name: 'mode.taal-flitsdictee',
    reason: 'way.taal-flitsdictee',
    icon: KeyboardIcon,
    rule: TAAL_ROUND_RULE['taal-flitsdictee'],
    seconds: 12,
  },
];

/**
 * Werkwoorden, in the same order and missing the same three, for the same
 * reasons (ADR-118).
 *
 * **Kies de vorm** offers three forms, and all three exist: "word", "wordt"
 * and "werd", never "wort". What a child chooses between is d, t or dt among
 * real words (`werkwoordAfleiders`). **Typ de vorm** is the same sentence with
 * the form typed, which is what a test asks. **Ontdekken** is the rule cards —
 * ik is the stem, hij is the stem and a t, 't kofschip, ge- and a t or a d —
 * each with examples from the set. **Overleven** chooses, over three lives.
 *
 * No zoeken, because there is nothing to find; no bliksemronde, because d, t
 * or dt against a clock is guessing. Een diploma wél, sinds ADR-168, met
 * dezelfde redenering als bij spelling. The oefentoets types.
 */
export const WERKWOORD_FORMS: readonly PracticeForm[] = [
  {
    id: 'taal-vorm-kiezen',
    name: 'mode.taal-vorm-kiezen',
    reason: 'way.taal-vorm-kiezen',
    icon: ChoiceIcon,
    rule: TAAL_ROUND_RULE['taal-vorm-kiezen'],
    seconds: 8,
  },
  {
    id: 'taal-vorm-typen',
    name: 'mode.taal-vorm-typen',
    reason: 'way.taal-vorm-typen',
    icon: KeyboardIcon,
    rule: TAAL_ROUND_RULE['taal-vorm-typen'],
    seconds: 12,
  },
  {
    id: 'ontdekken',
    name: 'mode.ontdekken',
    reason: 'way.ontdekken',
    icon: ExploreIcon,
    rule: null,
    seconds: null,
    geldtVoor: (setId) => !isTaalMix(setId) && !isTaalFouten(setId),
  },
  {
    id: 'overleven',
    name: 'mode.overleven',
    reason: 'way.overleven',
    icon: ShieldIcon,
    rule: TAAL_ROUND_RULE.overleven,
    seconds: null,
  },
  {
    id: 'taal-diploma',
    name: 'mode.taal-diploma',
    reason: 'way.taal-diploma',
    icon: DiplomaIcon,
    rule: TAAL_ROUND_RULE['taal-diploma'],
    seconds: 12,
    vasteLengte: true,
    geldtVoor: isTaalDiplomaSet,
  },
];

/**
 * Engels (ADR-217): the Dutch word given, the English word chosen or typed,
 * in an English sentence. The same five as werkwoorden, for the same reasons:
 * choose first, then type as a test asks; ontdekken is the list; overleven
 * chooses over three lives; the diploma types.
 */
export const ENGELS_FORMS: readonly PracticeForm[] = [
  {
    id: 'taal-engels-kiezen',
    name: 'mode.taal-engels-kiezen',
    reason: 'way.taal-engels-kiezen',
    icon: ChoiceIcon,
    rule: TAAL_ROUND_RULE['taal-engels-kiezen'],
    seconds: 8,
  },
  {
    id: 'taal-engels-typen',
    name: 'mode.taal-engels-typen',
    reason: 'way.taal-engels-typen',
    icon: KeyboardIcon,
    rule: TAAL_ROUND_RULE['taal-engels-typen'],
    seconds: 12,
  },
  {
    id: 'ontdekken',
    name: 'mode.ontdekken',
    reason: 'way.ontdekken',
    icon: ExploreIcon,
    rule: null,
    seconds: null,
    geldtVoor: (setId) => !isTaalMix(setId) && !isTaalFouten(setId),
  },
  {
    id: 'overleven',
    name: 'mode.overleven',
    reason: 'way.overleven',
    icon: ShieldIcon,
    rule: TAAL_ROUND_RULE.overleven,
    seconds: null,
  },
  {
    id: 'taal-diploma',
    name: 'mode.taal-diploma',
    reason: 'way.taal-diploma',
    icon: DiplomaIcon,
    rule: TAAL_ROUND_RULE['taal-diploma'],
    seconds: 12,
    vasteLengte: true,
    geldtVoor: isTaalDiplomaSet,
  },
];

/**
 * The way the oefentoets answers in: typing, because that is what a test asks
 * — the name unaided, the sum unaided, the time written out, the word after
 * the flitsdictee's three seconds, the verb form. The oefentoets is a tile of
 * its own and pressing it chooses this way too, so a child is never asked to
 * pick a way a test does not have (ADR-100).
 *
 * Per module, and per part where a module has parts: Taal's two parts type in
 * two different ways (ADR-118), and Engels types in a third (ADR-217).
 *
 * Flags cannot type, so their toets asks both ways round instead (ADR-102).
 */
const TOETS_VORM: Record<string, ModeId> = {
  topo: 'hoe-heet-dit',
  tafels: 'som-typen',
  klok: 'klok-typen',
  vlaggen: 'vlag-gemengd',
  spelling: 'taal-flitsdictee',
  werkwoorden: 'taal-vorm-typen',
  engels: 'taal-engels-typen',
};

/**
 * The way the oefentoets uses, if this page offers it; null otherwise. `deel`
 * is the part a page with parts is on, which decides before the module does.
 */
export function toetsVormVan(
  moduleId: string,
  forms: readonly PracticeForm[],
  deel: string | null = null,
): PracticeForm | null {
  const vorm = (deel === null ? undefined : TOETS_VORM[deel]) ?? TOETS_VORM[moduleId];
  return forms.find((form) => form.id === vorm) ?? null;
}

/**
 * The ways a page offers. On Taal they follow the part rather than the set:
 * with Spelling chosen the page shows spelling's ways before a subject is.
 */
export function formsFor(moduleId: string, deel: string | null = null): readonly PracticeForm[] {
  if (moduleId === 'tafels') return SUM_FORMS;
  if (moduleId === 'klok') return KLOK_FORMS;
  if (moduleId === 'vlaggen') return VLAG_FORMS;
  if (moduleId === 'woorden') {
    if (deel === EIGEN_DEEL) return EIGEN_FORMS;
    if (deel === 'engels') return ENGELS_FORMS;
    return deel === 'werkwoorden' ? WERKWOORD_FORMS : SPELLING_FORMS;
  }
  return TOPO_FORMS;
}

/**
 * What is actually drawn: what the chosen set can be practised in, with at
 * most six tiles.
 *
 * The set is part of it because step 2 is about a set that step 1 has already
 * named. A way of practising that does not apply to it is not greyed out — it
 * is absent, the same way an unbuilt module is absent from the rail: a disabled
 * control on a chooser is a question a child has to ask someone about.
 *
 * The cap counts tiles. A way only the oefentoets asks in is not a tile, so it
 * neither counts towards the six nor is ever the one the cap drops — on the
 * flags page it is the seventh entry, and dropping it took the oefentoets with
 * it.
 *
 * There used to be a second argument, the clock setting, which kept the
 * bliksemronde off every page until "Klok bij het oefenen" was switched on.
 * ADR-112 offers it everywhere and the setting is gone.
 */
export function offeredForms(
  forms: readonly PracticeForm[],
  setId: string | null,
  krap = false,
): readonly PracticeForm[] {
  let tegels = 0;
  const offered = forms
    .filter((form) => setId === null || !form.geldtVoor || form.geldtVoor(setId))
    .filter((form) => form.alleenToets === true || ++tegels <= MAX_FORMS);

  // On a map too crowded to point at, pointing goes last rather than first. It
  // is still offered — see `teDrukOmAanTeWijzen` for why it is moved and not
  // removed — and what leads instead is multiple choice, where the map lights a
  // country up and the child answers in words.
  if (!krap) return offered;
  const wijzen = offered.filter((form) => form.id === 'wijs-aan');
  return [...offered.filter((form) => form.id !== 'wijs-aan'), ...wijzen];
}

/**
 * How many shapes a map may hold before pointing at it is worth offering first.
 *
 * Measured rather than guessed. For each map the build makes, count the
 * countries that end up with neither a usable help ring nor enough of their own
 * area for a fingertip — the ones a child simply cannot hit:
 *
 * ```
 * regio           landen   laptop   tablet   telefoon
 * Zuid-Amerika        12        0        0          1
 * Oceanië              9        1        1          1
 * Noord-Amerika       23       12       13         20
 * Europa              46        4        7         21
 * Azië                47        5        9         29
 * Afrika              52        5        9         19
 * Wereld             167       90      106        160
 * ```
 *
 * Two lines fall out of that table and both are here as numbers rather than as
 * a feeling. **Past fifteen shapes a map is no longer pointable on a phone**,
 * where it gets about two hundred pixels of height — Zuid-Amerika and Oceanië
 * stay, everything larger goes. **Past a hundred it is not pointable
 * anywhere**, which is the world map and only the world map: ninety of its
 * hundred and sixty-seven countries are unreachable on a laptop.
 *
 * Point sets are exempt. A city is already drawn as a marker sized for a finger
 * (`reachablePoints`), so eighty cities are eighty targets; it is *shapes* that
 * ask a child to hit a coastline.
 *
 * Moved, never removed. On a digibord a class points at the world map together,
 * and a rule about phones has no business taking that away — what it may do is
 * stop handing a ten-year-old on a bus the one way of practising that will not
 * work for them (ADR-087).
 */
export const KRAP_OP_EEN_TELEFOON = 15;
export const KRAP_OVERAL = 100;

export function teDrukOmAanTeWijzen(
  setId: string | null,
  aantalVormen: number,
  kleinScherm: boolean,
): boolean {
  if (setId === null) return false;

  // A list of mistakes is asked on its map, and it is the map that is crowded:
  // six countries still wrong on the world map are six targets among a hundred
  // and sixty-seven. Nederland's spans five layers, like the mix, and is left
  // alone like the mix.
  if (isFoutenSet(setId)) {
    const [kaart, ...meer] = setsInRound(setId);
    if (!kaart || meer.length > 0) return false;
    const vormen = loadItemSets().find((set) => set.id === kaart)?.items.length ?? aantalVormen;
    return teDrukOmAanTeWijzen(kaart, vormen, kleinScherm);
  }

  const shape = SETS[setId as SetId];
  // A set the map does not know, or one answered on markers rather than on its
  // own outlines. Neither is what this rule is about.
  if (!shape || shape.answers === 'points') return false;

  return aantalVormen > (kleinScherm ? KRAP_OP_EEN_TELEFOON : KRAP_OVERAL);
}

/**
 * How long a round may be made, when a child wants to say.
 *
 * Ten is what a round has always been and stays the default. The other three
 * exist because the sets stopped being ten: the Rekenmix holds five hundred
 * sums and the Topomix a hundred and fifteen, and "oefen tien" of five hundred
 * is a child who never finishes anything (ADR-074).
 *
 * Only the ones that fit are offered. Choosing fifty of a table of ten is a
 * button that lies — the round would ask ten and the estimate beside it would
 * have said six minutes.
 */
export const QUESTION_CHOICES: readonly number[] = [10, 25, 50, 100];

/**
 * The biggest set that is offered whole, as "Alle 12". Past a hundred a whole
 * set is not a round, it is an afternoon: the world's hundred and sixty-seven
 * countries stop at a hundred.
 */
const HEEL_TOT = 100;

/**
 * The lengths worth offering for this way of practising on this set, or none.
 *
 * The four above that fit, the round's own length — fifteen on the map, which
 * is what a round asks when nobody chooses and so has to be something a child
 * can choose back — and the whole set where it fits in one round. Without those
 * last two the row never appeared on topography: twelve provinces fit only
 * "10", and one chip is not a choice (ADR-100).
 *
 * Empty where there is nothing to choose: a round that ends on a clock or on
 * three lives has no number of questions, a diploma is the whole table by
 * definition, and a set of ten has one honest answer.
 */
export function questionChoices(form: PracticeForm, setSize: number): number[] {
  if (form.rule === null || form.rule.kind !== 'fixed' || form.vasteLengte) return [];
  const korter = [...new Set([...QUESTION_CHOICES, form.rule.aantal])]
    .filter((count) => count < setSize)
    .sort((a, b) => a - b);
  const fits = setSize <= HEEL_TOT ? [...korter, setSize] : korter;
  return fits.length > 1 ? fits : [];
}

/**
 * How many questions this way of practising asks of this set, where it is
 * knowable — the child's choice if they made one, and the round's own length
 * if they did not.
 *
 * Capped at the set either way. A set cannot be asked more questions than it
 * holds without repeating itself inside one round, which teaches a child that
 * the app has run out rather than that they have.
 */
export function questionCount(
  form: PracticeForm,
  setSize: number,
  chosen: number | null = null,
): number | null {
  if (form.rule === null || form.rule.kind !== 'fixed') return null;
  const wanted =
    chosen !== null && questionChoices(form, setSize).includes(chosen) ? chosen : form.rule.aantal;
  return Math.min(setSize, wanted);
}

/**
 * Roughly how long it takes, in whole minutes, or null where saying would be
 * guessing.
 *
 * The design puts this beside the start button, and it earns its place with a
 * parent as much as with a child: "ongeveer vier minuten" is the difference
 * between practice before dinner and practice tomorrow. The per-question
 * figures are held here rather than measured, and they are deliberately round —
 * a number to the minute would claim a precision this does not have.
 */
export function minutesFor(form: PracticeForm, questions: number | null): number | null {
  if (form.rule === null) return null;
  if (form.rule.kind === 'tijd') return Math.max(1, Math.round(form.rule.seconden / 60));
  if (form.rule.kind === 'levens') return null;
  if (form.seconds === null || questions === null) return null;
  return Math.max(1, Math.round((questions * form.seconds) / 60));
}

/**
 * What the start button says, which is the last thing a child reads before a
 * round and therefore has to be what the round is.
 *
 * The measure comes from the rule rather than from the copy, so a round whose
 * clock is changed cannot end up with a button still promising sixty seconds.
 */
export function startLabel(
  form: PracticeForm,
  setNaam: string,
  setSize: number,
  chosen: number | null = null,
): string {
  const hoe = t(form.name).toLocaleLowerCase('nl-NL');

  if (form.rule === null) return t('choose.startOpen', { set: setNaam, hoe });
  if (form.rule.kind === 'tijd') {
    return t('choose.startTime', { set: setNaam, hoe, seconden: form.rule.seconden });
  }
  if (form.rule.kind === 'levens') {
    return t('choose.startLives', { set: setNaam, hoe, aantal: form.rule.levens });
  }
  return t('choose.start', {
    set: setNaam,
    hoe,
    aantal: questionCount(form, setSize, chosen) ?? form.rule.aantal,
  });
}
