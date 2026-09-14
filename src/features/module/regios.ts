import { leesLijsten } from '@/store/woordlijsten';
import type { TaalDeel } from '@/game-core';
import type { TranslationKey } from '@/i18n';
import type { Module } from '@/features/shell/modules';

/**
 * Where on the map, which is the first question topography has to ask.
 *
 * Step 1 used to offer five named sets in a flat list — "Provincies van
 * Nederland", "Hoofdsteden van de provincies", "Steden van Nederland" — and
 * every one of them said where it was in its own name. Five cards that each
 * repeat the same word are five cards a child reads instead of scans, and the
 * moment there are countries of Europe as well the list is nine and the word
 * is doing the work a heading should be doing.
 *
 * So the page asks the coarse question first: **the world, then a werelddeel,
 * then Nederland.** Then what — provincies, steden, wateren, eilanden, mix, or
 * simply landen — in one word each, because the region above has already said
 * the rest. Then how, which is step 2 and has not moved (ADR-083).
 *
 * There are eight now rather than three, and the six werelddelen in the middle
 * are the whole point: pointing at a country on a map of the world is hopeless
 * at any size, and on a map of Africa it is fine. Every geography app worth
 * copying organises itself this way, and so does every atlas (ADR-087).
 *
 * All three exist. Two of them arrived after the row did, which is the row
 * doing its job: the shape of the product was drawn before the content was
 * there, a child could see what was coming, and nothing had to move when it
 * came (ADR-086). The `built` flag stays, because the next region will need it.
 *
 * **Taal uses the same row for its parts** (ADR-118): Spelling and
 * Werkwoorden, and Engels when it comes. "Welk deel?" is the same question as
 * "Waar op de kaart?" — the coarsest choice, one of a few, answered first, the
 * first one already chosen — and a second mechanism that did the same thing
 * under another name would be two places to keep in step. So for Taal a
 * region is a part; the row asks its own question (`regioVraag`).
 */
/** Het derde deel van Taal: de lijsten die een ouder zelf intypte (ADR-135). */
export const EIGEN_DEEL = 'eigen';

export interface Regio {
  readonly id:
    | 'wereld'
    | 'afrika'
    | 'azie'
    | 'europa'
    | 'noord-amerika'
    | 'zuid-amerika'
    | 'oceanie'
    | 'nederland'
    | TaalDeel
    /** Het derde deel van Taal: de lijsten die een ouder zelf intypte (ADR-135). */
    | typeof EIGEN_DEEL;
  readonly naam: TranslationKey;
  /** Whether there are sets behind it today. */
  readonly built: boolean;
}

/**
 * Widest first, then the werelddelen in the order an atlas prints them, then
 * home. Nederland is last on the row and first on the page: the row is a map of
 * the world getting smaller, and the page opens where a Dutch child starts.
 */
export const TOPO_REGIOS: readonly Regio[] = [
  { id: 'wereld', naam: 'regio.wereld', built: true },
  { id: 'afrika', naam: 'regio.afrika', built: true },
  { id: 'azie', naam: 'regio.azie', built: true },
  { id: 'europa', naam: 'regio.europa', built: true },
  { id: 'noord-amerika', naam: 'regio.noord-amerika', built: true },
  { id: 'zuid-amerika', naam: 'regio.zuid-amerika', built: true },
  { id: 'oceanie', naam: 'regio.oceanie', built: true },
  { id: 'nederland', naam: 'regio.nederland', built: true },
];

/**
 * The regions a module divides its subjects by, or none.
 *
 * Topography and flags have them, and it is the same row: flags hang off
 * topography — the same child learns the same werelddelen — so they ask where
 * in the same words, in the same order (ADR-102). The shape is a list rather
 * than a flag so that rekenen, which has no geography to divide, simply gets
 * an empty one and the page draws no row. A module with one region would draw
 * a row of one, which is a label you cannot press, so the row waits for two.
 */
export function regiosVan(moduleId: Module['id']): readonly Regio[] {
  if (moduleId === 'woorden') return taalDelen();
  return moduleId === 'topo' || moduleId === 'vlaggen' ? TOPO_REGIOS : [];
}

/**
 * Taal's parts. Spelling first, because it is where groep 5 starts and what a
 * child brings home from school most weeks. Engels is the third, in a step of
 * its own; until then it is not a chip, not even one that says "binnenkort".
 */
export const TAAL_DELEN: readonly Regio[] = [
  { id: 'spelling', naam: 'regio.spelling', built: true },
  { id: 'werkwoorden', naam: 'regio.werkwoorden', built: true },
];

/**
 * De delen van Taal, met het eigen deel erbij zodra er een lijst is.
 *
 * Een deel en geen `geldtVoor` op de spellingvormen, want op deze module staan
 * de vormen er vóórdat een onderwerp gekozen is (ADR-118): `ModuleScreen` laat
 * dan elke vorm mét een `geldtVoor` weg, en dat zou "Kies de letters" van de
 * spellingpagina halen.
 *
 * Zonder lijsten is er geen deel. Een knop naar een leeg deel is een deur naar
 * een lege kamer, en dat is dezelfde regel waarmee een onderwerp zonder sets
 * ook niet getekend wordt.
 */
function taalDelen(): readonly Regio[] {
  const heeft = leesLijsten().some((lijst) => lijst.woorden.length > 0);
  return heeft ? [...TAAL_DELEN, { id: EIGEN_DEEL, naam: 'regio.eigen', built: true }] : TAAL_DELEN;
}

/** What the row asks: where on the map, or which part of Taal. */
export function regioVraag(moduleId: Module['id']): TranslationKey {
  return moduleId === 'woorden' ? 'deel.title' : 'regio.title';
}

/** The word before the row's answer in the start bar: "kaart", or "deel". */
export function regioLabel(moduleId: Module['id']): TranslationKey {
  return moduleId === 'woorden' ? 'start.deel' : 'start.kaart';
}

/**
 * Where the page opens when nothing else has decided.
 *
 * Topography opens on Nederland rather than the first row. The row is ordered
 * widest first, the way an atlas is; the page opens where a Dutch child starts,
 * which is home.
 *
 * Flags open on the world (ADR-111). Nederland on the flags page is the twelve
 * provincievlaggen, and a child who comes for flags comes for the countries'.
 *
 * Taal opens on Spelling, which is this row's default in the same sense: the
 * only thing on the page chosen before the child chooses (ADR-118).
 */
export function eersteRegio(moduleId: Module['id'], regios: readonly Regio[]): Regio['id'] | null {
  const standaard: Regio['id'] =
    moduleId === 'vlaggen' ? 'wereld' : moduleId === 'woorden' ? 'spelling' : 'nederland';
  const eerst = regios.find((regio) => regio.id === standaard && regio.built);
  return (eerst ?? regios.find((regio) => regio.built))?.id ?? null;
}
