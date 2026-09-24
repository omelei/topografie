import type { Groep } from './groep';
import type { Schedulable } from './leitner';

/**
 * Taal: a word in a sentence, a verb in a sentence, and what counts as having
 * written it (ADR-118).
 *
 * The fifth kind of thing this product asks about, and the first where the
 * letter *is* the answer. A place may be typed with one slip (ADR-017) because
 * what is being tested is where it lies; here what is being tested is exactly
 * the slip. So judging is its own function, and `answer.ts` stays topography's.
 *
 * Two kinds of item. A **spelling item** is a word, the letters in it a child
 * has to decide about (`gat`), the letter pieces offered for them, and a
 * sentence to show it in — every word is asked in a sentence, so a word that
 * sounds like another one ("wij" and "wei") is always the one the sentence
 * means. A **verb item** is a sentence with a gap, the infinitive and the
 * person and tense the gap asks for. Its answer is in the content, and for
 * every weak verb it is also worked out here (`werkwoordsvorm`), so a content
 * test can refuse a form the rule would not make.
 *
 * Pure like the rest of game-core. The Dutch *rules* are here because the
 * content test and the wrong answers both need them; the Dutch *sentences*
 * that explain a rule are not — `werkwoordRegel` says which rule applied and to
 * what, and `features/taal` puts the words on through `t()`, the split
 * `klokVorm` makes for the clock (ADR-092).
 */

/** The parts of the Taal page. Engels is the third (ADR-217). */
export type TaalDeel = 'spelling' | 'werkwoorden' | 'engels';

/**
 * The school year an item belongs to is a `Groep` (`groep.ts`), the same type a
 * child's group is since ADR-151. Taal's items are groep 5 to 8, and
 * `taal.content.test.ts` holds them there.
 */

export interface SpellingItem extends Schedulable {
  /** `taal-sp-eiij-trein`. Stable: a Leitner box is filed under it. */
  readonly id: string;
  /** The word, as the Woordenlijst spells it. */
  readonly woord: string;
  /** Where the letters that decide are: `woord.slice(gat[0], gat[1])`. */
  readonly gat: readonly [number, number];
  /**
   * The letter pieces offered for the gap, the right one among them: `ei` and
   * `ij`. Never a whole word — a child who sees a word spelled wrong keeps the
   * picture of it too.
   */
  readonly keuzes: readonly string[];
  /** A short sentence with the word in it once, never as its first word. */
  readonly zin: string;
  readonly groep: Groep;
  /**
   * The word as it shows the rule, where a rule can be shown: the longer word
   * for d or t (`honden`), the word in pieces for one letter or two (`ma-nen`).
   */
  readonly hulp?: string;
  /** The other word it sounds like, where there is one: `wij` for `wei`. */
  readonly klinktAls?: string;
}

/** Who the verb is about. Hij stands for every one person that is not ik or jij. */
export type Persoon = 'ik' | 'jij' | 'hij' | 'wij';

/** Tegenwoordige tijd, verleden tijd, voltooid deelwoord. */
export type Tijd = 'tt' | 'vt' | 'vd';

export interface WerkwoordItem extends Schedulable {
  /** `taal-ww-tt-worden-hij`. Stable: a Leitner box is filed under it. */
  readonly id: string;
  /** The sentence with the answer in it once. The screen opens the gap. */
  readonly zin: string;
  readonly infinitief: string;
  readonly persoon: Persoon;
  /** Jij áchter the verb: "Word jij morgen tien?" — and then there is no t. */
  readonly achter?: boolean;
  readonly tijd: Tijd;
  readonly antwoord: string;
  /**
   * A form no rule makes, which a child has to know: "reed", "geworden". Every
   * item without it is worked out again by `werkwoordsvorm` in the content test.
   */
  readonly sterk?: boolean;
  readonly groep: Groep;
}

/**
 * An English word, for groep 7 and 8 (ADR-217): the Dutch word a child is
 * given, the English word it writes, and an English sentence to write it in.
 * The sentence does what it does for spelling: of the four animals on offer,
 * "The ▢ sleeps in its basket" and "hond" leave one.
 */
export interface EngelsItem extends Schedulable {
  /** `taal-en-dieren-dog`. Stable: a Leitner box is filed under it. */
  readonly id: string;
  /** The Dutch word, as the question gives it: `hond`. */
  readonly nl: string;
  /** The English word, British as school teaches it: `colour`. */
  readonly en: string;
  /** Other spellings that count: `color`, `gray`, `grandpa`. */
  readonly aliassen?: readonly string[];
  /** A short English sentence with the word in it once, never as its first word. */
  readonly zin: string;
  readonly groep: Groep;
}

/**
 * What may stand in front of an English answer and is then left off: "a dog",
 * "the dog" and "to walk" are the word a child was asked for.
 */
export const ENGELS_VOORAF: readonly string[] = ['a', 'an', 'the', 'to'];

/** The forms of a strong verb that no rule makes. Content, not code. */
export interface SterkWerkwoord {
  /** Verleden tijd, one person: `werd`. */
  readonly vt: string;
  /** Verleden tijd, more than one: `werden`. */
  readonly vtMv: string;
  /** Voltooid deelwoord: `geworden`. */
  readonly vd: string;
}

export type SterkeWerkwoorden = Readonly<Record<string, SterkWerkwoord>>;

/**
 * How long the word stands in the sentence in a flitsdictee before it goes.
 *
 * Kijktijd, not antwoordtijd: it is how long a child looks, as in kijken,
 * afdekken, schrijven, controleren. The typing that follows has no limit, so
 * this is not the clock that the rule against a clock in spelling is about
 * (ADR-118). Three seconds is enough to read a word of two syllables twice and
 * too short to copy it letter by letter, which is the exercise. For a screen
 * reader it counts from the moment the sentence is read out.
 */
export const FLITS_KIJKTIJD_MS = 3000;

// ---------------------------------------------------------------------------
// A word in a sentence

/** The letters of the gap: `ei` in trein. */
export function gatLetters(item: SpellingItem): string {
  return item.woord.slice(item.gat[0], item.gat[1]);
}

function regexVan(woord: string): RegExp {
  const letterlijk = woord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // A whole word: no letter, digit or apostrophe on either side, so "trein" is
  // not found in "treinen" and "ei" is not found in "klein".
  return new RegExp(`(?<![\\p{L}\\p{N}'’])${letterlijk}(?![\\p{L}\\p{N}])`, 'giu');
}

/** How often a word stands in a sentence, as a whole word, whatever its case. */
export function keerInZin(zin: string, woord: string): number {
  return [...zin.matchAll(regexVan(woord))].length;
}

export interface ZinDelen {
  readonly voor: string;
  /** The word as the sentence writes it, which may start with a capital. */
  readonly woord: string;
  readonly na: string;
}

/**
 * The sentence cut around the word, so the screen can open a gap in it or mark
 * it. Null when the word is not in the sentence, which the content test
 * forbids.
 */
export function zinDelen(zin: string, woord: string): ZinDelen | null {
  const match = regexVan(woord).exec(zin);
  if (!match) return null;
  return {
    voor: zin.slice(0, match.index),
    woord: match[0],
    na: zin.slice(match.index + match[0].length),
  };
}

// ---------------------------------------------------------------------------
// Judging what was typed

export interface WoordOpties {
  /** Other spellings that count, for Engels: `color` beside `colour`. */
  readonly aliassen?: readonly string[];
  /**
   * Words that may stand in front of the answer and are then left off, for
   * Engels: a, an, the, and to before a verb. Empty for Dutch.
   */
  readonly vooraf?: readonly string[];
}

export interface WoordOordeel {
  readonly goed: boolean;
  /** What was typed, without the spaces around it. What the screen quotes back. */
  readonly getypt: string;
}

function klein(tekst: string): string {
  // NFC first: an é typed as e and an accent is the same letter as é, and a
  // phone may send either. That is encoding, not forgiveness.
  return tekst.normalize('NFC').toLocaleLowerCase('nl-NL');
}

/**
 * Right or wrong, and strictly (ADR-118).
 *
 * Capitals do not count and the spaces around the word are dropped. Nothing
 * else is forgiven: an accent, a trema, an apostrophe or a hyphen is part of
 * the word, and one letter out is wrong. That is the reverse of ADR-017, and
 * for the reason ADR-017 gave: there the letter was noise around a place; here
 * the letter is the thing being asked.
 */
export function beoordeelWoord(
  getypt: string,
  antwoord: string,
  opties: WoordOpties = {},
): WoordOordeel {
  const kaal = getypt.trim();
  const eigen = klein(kaal);
  const goed = [antwoord, ...(opties.aliassen ?? [])].map(klein);
  const kandidaten = [eigen];
  for (const woord of opties.vooraf ?? []) {
    const voor = `${klein(woord)} `;
    if (eigen.startsWith(voor)) kandidaten.push(eigen.slice(voor.length).trim());
  }
  const raak = kandidaten.some((kandidaat) => goed.includes(kandidaat));
  return { goed: kaal.length > 0 && raak, getypt: kaal };
}

/** A run of letters, and whether it differs from the other word. */
export interface Stuk {
  readonly tekst: string;
  readonly anders: boolean;
}

export interface Verschil {
  /** What was typed, with the letters that are not in the right word marked. */
  readonly getypt: readonly Stuk[];
  /** The right word, with the letters the typed one did not have marked. */
  readonly goed: readonly Stuk[];
}

function stukken(letters: readonly string[], anders: readonly boolean[]): Stuk[] {
  const uit: Stuk[] = [];
  letters.forEach((letter, index) => {
    const vlag = anders[index] ?? false;
    const vorige = uit.at(-1);
    if (vorige && vorige.anders === vlag)
      uit[uit.length - 1] = { tekst: vorige.tekst + letter, anders: vlag };
    else uit.push({ tekst: letter, anders: vlag });
  });
  return uit;
}

/**
 * Which letters differ, on both sides: "trijn" against "trein" marks `ij` in
 * the one and `ei` in the other.
 *
 * An edit alignment with a preference for putting two letters side by side
 * rather than calling one missing and one extra, because "ij where ei belongs"
 * is how a child reads the mistake. Capitals are not a difference.
 */
export function letterVerschil(getypt: string, goed: string): Verschil {
  const a = [...getypt.trim()];
  const b = [...goed];
  const la = a.map(klein);
  const lb = b.map(klein);

  const rijen = a.length + 1;
  const kolommen = b.length + 1;
  const d: number[] = new Array<number>(rijen * kolommen).fill(0);
  const at = (i: number, j: number) => d[i * kolommen + j] as number;
  for (let i = 0; i < rijen; i++) d[i * kolommen] = i;
  for (let j = 0; j < kolommen; j++) d[j] = j;
  for (let i = 1; i < rijen; i++) {
    for (let j = 1; j < kolommen; j++) {
      const kosten = la[i - 1] === lb[j - 1] ? 0 : 1;
      d[i * kolommen + j] = Math.min(at(i - 1, j - 1) + kosten, at(i - 1, j) + 1, at(i, j - 1) + 1);
    }
  }

  const andersA = a.map(() => false);
  const andersB = b.map(() => false);
  let i = a.length;
  let j = b.length;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const kosten = la[i - 1] === lb[j - 1] ? 0 : 1;
      if (at(i, j) === at(i - 1, j - 1) + kosten) {
        if (kosten === 1) {
          andersA[i - 1] = true;
          andersB[j - 1] = true;
        }
        i--;
        j--;
        continue;
      }
    }
    if (i > 0 && at(i, j) === at(i - 1, j) + 1) {
      andersA[i - 1] = true;
      i--;
    } else {
      andersB[j - 1] = true;
      j--;
    }
  }

  return { getypt: stukken(a, andersA), goed: stukken(b, andersB) };
}

// ---------------------------------------------------------------------------
// Verbs: worked out, not copied

const KLINKERS = 'aeiouyëïéèöü';
const isKlinker = (letter: string | undefined) => letter !== undefined && KLINKERS.includes(letter);

/**
 * The prefixes that take no ge- in a voltooid deelwoord. Longest first, so
 * "ont" is not read as "on".
 */
export const ZONDER_GE = ['ont', 'ver', 'her', 'be', 'ge', 'er'] as const;
export type Voorvoegsel = (typeof ZONDER_GE)[number];

/** The letters of 't kofschip, and x, which the rhyme leaves out and the rule does not. */
const KOFSCHIP = ['t', 'k', 'f', 's', 'ch', 'p', 'x'];

/**
 * The prefix a verb starts with, or null.
 *
 * Only where what follows is still a verb with a vowel of its own: "bellen" is
 * not be- and "llen", and "verven" is not ver- and "ven". A handful of verbs
 * start with these letters without them being a prefix at all ("ergeren"); the
 * content leaves those out, and AFBAKENING.md says so.
 */
export function voorvoegselVan(infinitief: string): Voorvoegsel | null {
  for (const voor of ZONDER_GE) {
    if (!infinitief.startsWith(voor)) continue;
    const rest = infinitief.slice(voor.length);
    if ([...rest.slice(0, -2)].some((letter) => isKlinker(letter))) return voor;
  }
  return null;
}

/** Groups of vowels, which is near enough to syllables for the one question below. */
function klinkergroepen(woord: string): number {
  return woord.split(/[^aeiouyëïéèöü]+/).filter((groep) => groep.length > 0).length;
}

/** The stem of a verb with no prefix: "maken" → "maak", "leven" → "leef". */
function kaleStam(kern: string): string {
  let stam = kern.endsWith('en') ? kern.slice(0, -2) : kern;
  const laatste = stam.at(-1);
  const voorlaatste = stam.at(-2);

  if (laatste !== undefined && laatste === voorlaatste && !isKlinker(laatste)) {
    // A double consonant is single in the stem: bellen, bel.
    stam = stam.slice(0, -1);
  } else if (
    laatste !== undefined &&
    !isKlinker(laatste) &&
    // A w keeps the vowel single (duwen, duw), and so does an x, which is two
    // consonants in one letter (faxen, fax).
    laatste !== 'w' &&
    laatste !== 'x' &&
    'aeou'.includes(voorlaatste ?? '') &&
    !isKlinker(stam.at(-3)) &&
    // An unstressed e before l, n, r or m is a schwa and stays single:
    // wandelen, wandel; tekenen, teken. A stem of one syllable has no schwa.
    !(voorlaatste === 'e' && 'lnrm'.includes(laatste) && klinkergroepen(stam) > 1)
  ) {
    // An open syllable in the infinitive is a long vowel, written twice when
    // the syllable closes: maken, maak.
    stam = `${stam.slice(0, -1)}${voorlaatste ?? ''}${laatste}`;
  }

  // No word ends in v or z: leven, leef; verhuizen, verhuis.
  if (stam.endsWith('v')) stam = `${stam.slice(0, -1)}f`;
  else if (stam.endsWith('z')) stam = `${stam.slice(0, -1)}s`;
  return stam;
}

/**
 * The stem, which is what ik says in the tegenwoordige tijd: "ik word".
 *
 * For weak verbs of the kind the content holds. Loan verbs stressed on -eren
 * (proberen, studeren) sound like "luisteren" and are not written like it; a
 * rule cannot hear the stress, so those are not in the content.
 */
export function stamVan(infinitief: string): string {
  const voor = voorvoegselVan(infinitief);
  return voor ? `${voor}${kaleStam(infinitief.slice(voor.length))}` : kaleStam(infinitief);
}

/**
 * The letter before -en in the infinitive, which is the one 't kofschip asks
 * about — the infinitive, not the stem, which is the trap: leven has a v and
 * makes "leefde", even though the stem ends in f.
 */
export function kofschipLetter(infinitief: string): string {
  const zonderEn = infinitief.endsWith('en') ? infinitief.slice(0, -2) : infinitief;
  return zonderEn.endsWith('ch') ? 'ch' : (zonderEn.at(-1) ?? '');
}

export function inKofschip(infinitief: string): boolean {
  return KOFSCHIP.includes(kofschipLetter(infinitief));
}

function enkelvoudTt(stam: string): string {
  return stam.endsWith('t') ? stam : `${stam}t`;
}

function verledenTijd(infinitief: string, meervoud: boolean): string {
  const uitgang = inKofschip(infinitief) ? 'te' : 'de';
  return `${stamVan(infinitief)}${uitgang}${meervoud ? 'n' : ''}`;
}

function voltooidDeelwoord(infinitief: string): string {
  const stam = stamVan(infinitief);
  const letter = inKofschip(infinitief) ? 't' : 'd';
  const achter = stam.endsWith(letter) ? stam : `${stam}${letter}`;
  if (voorvoegselVan(infinitief)) return achter;
  // Ge- before a vowel that would run into its e takes a trema: geëindigd.
  const eerste = achter[0];
  if (eerste === 'e') return `geë${achter.slice(1)}`;
  if (eerste === 'i' && achter[1] !== 'j') return `geï${achter.slice(1)}`;
  return `ge${achter}`;
}

/**
 * One form of a weak verb, the way the rules make it.
 *
 * - **Tegenwoordige tijd.** Ik: the stem. Jij and hij: the stem and a t, unless
 *   the stem already ends in one (hij zet) — and jij *after* the verb takes no
 *   t ("Word jij?"). Wij, and every other plural: the infinitive.
 * - **Verleden tijd.** The stem and -te or -de, -ten or -den for more than one,
 *   decided by 't kofschip on the letter before -en in the infinitive.
 * - **Voltooid deelwoord.** Ge-, the stem, and a t or a d by the same letter —
 *   none added where the stem already ends in it, and no ge- after be-, ver-,
 *   ont-, her-, ge- or er-.
 */
export function werkwoordsvorm(
  infinitief: string,
  persoon: Persoon,
  tijd: Tijd,
  opties: { readonly achter?: boolean } = {},
): string {
  const stam = stamVan(infinitief);
  if (tijd === 'vd') return voltooidDeelwoord(infinitief);
  if (tijd === 'vt') return verledenTijd(infinitief, persoon === 'wij');
  if (persoon === 'wij') return infinitief;
  if (persoon === 'ik') return stam;
  if (persoon === 'jij' && opties.achter) return stam;
  return enkelvoudTt(stam);
}

/** Every form of one verb a question may offer. All of them exist. */
export interface WerkwoordVormen {
  readonly ik: string;
  readonly hij: string;
  readonly infinitief: string;
  readonly vt: string;
  readonly vtMv: string;
  readonly vd: string;
}

/**
 * The forms of a verb, the strong ones from the list and the rest from the
 * rules. The tegenwoordige tijd is made by the rules for every verb in the
 * content, strong or not: "wordt" is as regular as "fietst".
 */
export function werkwoordVormen(
  infinitief: string,
  sterk: SterkeWerkwoorden = {},
): WerkwoordVormen {
  const lijst = sterk[infinitief];
  return {
    ik: werkwoordsvorm(infinitief, 'ik', 'tt'),
    hij: werkwoordsvorm(infinitief, 'hij', 'tt'),
    infinitief,
    vt: lijst?.vt ?? werkwoordsvorm(infinitief, 'hij', 'vt'),
    vtMv: lijst?.vtMv ?? werkwoordsvorm(infinitief, 'wij', 'vt'),
    vd: lijst?.vd ?? werkwoordsvorm(infinitief, 'hij', 'vd'),
  };
}

/** What the rules make for this item, strong verbs aside. */
export function berekendAntwoord(item: WerkwoordItem): string {
  return werkwoordsvorm(
    item.infinitief,
    item.persoon,
    item.tijd,
    item.achter ? { achter: true } : {},
  );
}

const zelfde = (a: string, b: string) => klein(a) === klein(b);

/**
 * The two wrong answers beside a verb question: always two real forms of the
 * same verb, never a form spelled wrong. "wort" and "fietsde" do not exist, so
 * they are never on the screen — what a child chooses between is d, t or dt
 * among forms that do.
 *
 * - Tegenwoordige tijd: the other of stem and stem + t, then the verleden tijd
 *   ("Hij ▢ morgen tien": word, wordt, werd).
 * - Verleden tijd: the form for one or more persons, and the tegenwoordige tijd
 *   for the same person.
 * - Voltooid deelwoord: the hij-form and the verleden tijd (verhuisd,
 *   verhuist, verhuisde).
 *
 * Where two forms are the same word (ik zet, hij zet) the next real form fills
 * the place, so there are always three different options.
 */
export function werkwoordAfleiders(item: WerkwoordItem, sterk: SterkeWerkwoorden = {}): string[] {
  const v = werkwoordVormen(item.infinitief, sterk);
  const meervoud = item.persoon === 'wij';
  const zelfdePersoonTt = meervoud ? v.infinitief : item.persoon === 'ik' ? v.ik : v.hij;

  const voorkeur: readonly string[] =
    item.tijd === 'tt'
      ? [v.ik, v.hij, v.vt, v.vtMv, v.infinitief, v.vd]
      : item.tijd === 'vt'
        ? [meervoud ? v.vt : v.vtMv, zelfdePersoonTt, v.vd, v.infinitief, v.hij, v.ik]
        : [v.hij, v.vt, v.vtMv, v.ik, v.infinitief];

  const gekozen: string[] = [];
  for (const vorm of voorkeur) {
    if (gekozen.length === 2) break;
    if (zelfde(vorm, item.antwoord) || gekozen.some((al) => zelfde(al, vorm))) continue;
    gekozen.push(vorm);
  }
  return gekozen;
}

function schud<T>(bron: readonly T[], rng: () => number): T[] {
  const uit = [...bron];
  for (let i = uit.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = uit[i] as T;
    const b = uit[j] as T;
    uit[i] = b;
    uit[j] = a;
  }
  return uit;
}

/** Three options, the answer among them, in the order shown. Dealt once. */
export function werkwoordOpties(
  item: WerkwoordItem,
  sterk: SterkeWerkwoorden = {},
  rng: () => number = Math.random,
): string[] {
  return schud([item.antwoord, ...werkwoordAfleiders(item, sterk)], rng);
}

/**
 * Four English words to choose from: the answer and three others from the same
 * set, so a child chooses between colours on the colours page and not between
 * a colour and a cow.
 */
export function engelsOpties(
  item: EngelsItem,
  set: readonly EngelsItem[],
  rng: () => number = Math.random,
): string[] {
  const goed = [item.en, ...(item.aliassen ?? [])].map((woord) => woord.toLowerCase());
  const anderen = [...new Set(set.map((ander) => ander.en))].filter(
    (woord) => !goed.includes(woord.toLowerCase()),
  );
  return schud([item.en, ...schud(anderen, rng).slice(0, 3)], rng);
}

/** The letter pieces for a spelling item, in the order shown. Dealt once. */
export function letterOpties(item: SpellingItem, rng: () => number = Math.random): string[] {
  return schud(item.keuzes, rng);
}

/**
 * Which rule made this form, and what it was applied to — so the sentence
 * after a wrong answer can be about this verb: "Hij, dus stam + t: word + t =
 * wordt." The words are `features/taal`'s.
 */
export type WerkwoordRegel =
  | { readonly soort: 'sterk'; readonly vorm: string; readonly infinitief: string }
  | { readonly soort: 'tt-stam'; readonly stam: string; readonly achter: boolean }
  | {
      readonly soort: 'tt-t';
      readonly persoon: 'jij' | 'hij';
      readonly stam: string;
      readonly vorm: string;
      /** The stem ends in t already, so nothing is added: hij zet. */
      readonly alT: boolean;
    }
  | { readonly soort: 'tt-meervoud'; readonly vorm: string }
  | {
      readonly soort: 'vt';
      readonly letter: string;
      readonly kofschip: boolean;
      readonly stam: string;
      readonly vorm: string;
      readonly meervoud: boolean;
      readonly infinitief: string;
    }
  | {
      readonly soort: 'vd';
      readonly letter: string;
      readonly kofschip: boolean;
      readonly stam: string;
      readonly vorm: string;
      readonly voorvoegsel: Voorvoegsel | null;
      readonly infinitief: string;
    };

export function werkwoordRegel(item: WerkwoordItem): WerkwoordRegel {
  const { infinitief, antwoord } = item;
  if (item.sterk) return { soort: 'sterk', vorm: antwoord, infinitief };

  const stam = stamVan(infinitief);
  if (item.tijd === 'tt') {
    if (item.persoon === 'wij') return { soort: 'tt-meervoud', vorm: antwoord };
    if (item.persoon === 'ik' || (item.persoon === 'jij' && item.achter)) {
      return { soort: 'tt-stam', stam, achter: item.achter === true };
    }
    return { soort: 'tt-t', persoon: item.persoon, stam, vorm: antwoord, alT: stam.endsWith('t') };
  }

  const letter = kofschipLetter(infinitief);
  const kofschip = inKofschip(infinitief);
  if (item.tijd === 'vt') {
    return {
      soort: 'vt',
      letter,
      kofschip,
      stam,
      vorm: antwoord,
      meervoud: item.persoon === 'wij',
      infinitief,
    };
  }
  return {
    soort: 'vd',
    letter,
    kofschip,
    stam,
    vorm: antwoord,
    voorvoegsel: voorvoegselVan(infinitief),
    infinitief,
  };
}
