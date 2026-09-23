import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { nl } from '@/i18n/nl';

const ROOT = process.cwd();

/**
 * Two rules about words, checked rather than remembered.
 *
 * **Every visible string lives in nl.ts.** Not because a second language is
 * coming — it is not — but because copy that is scattered through components
 * cannot be read as a whole, and the register rules in §5.7 are about the whole:
 * one word for retention, one job for "score", nothing that praises the child
 * rather than the work. You cannot hold a tone of voice consistent across
 * twenty files if you can only see one at a time.
 *
 * **Some words are retired.** "Vast", "blijft zitten" and "beheersing" were
 * three words for one idea, two of them carrying school baggage a ten-year-old
 * hears before they hear the meaning — "blijft zitten" is being held back a
 * year. "Leuk", "spelenderwijs", "avontuur" and "plezier" are the vocabulary of
 * a product describing itself as fun, which is a claim the child gets to make
 * and not us.
 */

/** Files that legitimately hold letters that are not copy. */
const NOT_COPY: ReadonlyMap<string, string> = new Map([
  [
    'src/design/Gallery.tsx',
    'a development-only page whose labels are query addresses for its own test, and which never ships',
  ],
  [
    'src/features/diagnose/DiagnoseScherm.tsx',
    "an instrument behind #diagnose, for the owner and never for a child: its labels are names of measurements, and putting them in nl.ts would work against the one thing that file is for — being readable as the product's whole voice (ADR-128)",
  ],
]);

const LABELLED_ATTRIBUTES =
  /\b(aria-label|placeholder|title|alt|aria-valuetext|aria-description)="([^"]*[a-zA-Z]{2,}[^"]*)"/g;
/** Text sitting between two tags on one line, with no expression around it. */
const JSX_TEXT = />([^<>{}]*[a-zA-Z]{2,}[^<>{}]*)</g;

/**
 * Key families built from a template — `t(`mode.${mode}`)` and its like — so the
 * whole name never appears in the source. Each one is a real call site; the
 * pattern is the seam, not an exemption.
 */
const SAMENGESTELD: readonly RegExp[] = [
  /^mode\./, // RondeKlaar, HomeScreen, Afzwemmen
  /^regio\./, // vlagNamen, VlagDiplomas
  /^set\./, // KlokDiplomas, KlokResultScreen
  /^status\./, // RetentionScreen
  /^zoom\./, // ZoomKiezer
  /^klok\.(uur|getal)\./, // klokTaal
  /^sums\.mixLevel/, // onderdelen
  /^taal\.kaart\./, // taalTaal
  /^taal\.uitleg\./, // taalTaal, via UITLEG
  /^weekdoel\.soort\./, // WeekdoelenBlok
];

/** Every TypeScript file under a directory, tests included. */
function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) sourceFiles(full, out);
    else if (/\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}

function componentFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) componentFiles(full, out);
    else if (/\.tsx$/.test(entry) && !/\.test\.tsx$/.test(entry)) out.push(full);
  }
  return out;
}

describe('the words', () => {
  it('keeps every visible string in nl.ts', () => {
    const offenders: string[] = [];

    for (const full of componentFiles(join(ROOT, 'src'))) {
      const file = relative(ROOT, full).split(sep).join('/');
      if (NOT_COPY.has(file)) continue;

      readFileSync(full, 'utf8')
        .split('\n')
        .forEach((line, index) => {
          const trimmed = line.trim();
          if (/^(\/\/|\/\*|\*|\{\/\*)/.test(trimmed)) return;

          for (const match of trimmed.matchAll(LABELLED_ATTRIBUTES)) {
            offenders.push(`${file}:${index + 1} ${match[1]}="${match[2]}"`);
          }
          for (const match of trimmed.matchAll(JSX_TEXT)) {
            const text = (match[1] ?? '').trim();
            // Punctuation and separators are typography, not copy.
            if (!text || /^[\s/·—–|]+$/.test(text)) continue;
            offenders.push(`${file}:${index + 1} text "${text}"`);
          }
        });
    }

    expect(offenders, 'move these into src/i18n/nl.ts and read them with t()').toEqual([]);
  });

  it('has retired the words that meant the same thing three ways', () => {
    // Word boundaries on both sides: "vasteland" is a coastline, not a claim
    // about what a child remembers, and the Waddenzee weetje is allowed to say
    // it. The point is the standalone word.
    const retired = [/\bvast\b/i, /\bbeheersing\b/i, /\bblijft zitten\b/i];
    const offenders: string[] = [];

    for (const [key, value] of Object.entries(nl)) {
      for (const pattern of retired) {
        if (pattern.test(value)) offenders.push(`${key}: "${value}"`);
      }
    }

    expect(offenders, 'ADR-030: the one word for retention is "onthouden"').toEqual([]);
  });

  it('keeps to the word list in the schrijfwijzer', () => {
    // One concept, one word (docs/SCHRIJFWIJZER.md). "Onthouden" is not on this
    // list: the taal rules use it for learning a spelling by heart, which is
    // not what a child knows. Where it meant that, it now says "kennen".
    const retired = [
      /afzwem/i,
      /af te zwemmen/i,
      /opfris/i,
      /vader of moeder/i,
      /\bjij zei\b/i,
      /\bjij koos\b/i,
      /\bmodules?\b/i,
    ];
    const offenders: string[] = [];

    for (const [key, value] of Object.entries(nl)) {
      for (const pattern of retired) {
        if (pattern.test(value)) offenders.push(`${key}: "${value}"`);
      }
    }

    expect(offenders, 'ADR-197: use the word from docs/SCHRIJFWIJZER.md').toEqual([]);
  });

  it('does not tell a child what to feel', () => {
    const forbidden = [/\bleuk\w*/i, /\bspelenderwijs\b/i, /\bavontuur\w*/i, /\bplezier\w*/i];
    const offenders: string[] = [];

    for (const [key, value] of Object.entries(nl)) {
      for (const pattern of forbidden) {
        if (pattern.test(value)) offenders.push(`${key}: "${value}"`);
      }
    }

    expect(offenders).toEqual([]);
  });

  it('gives "score" exactly one job', () => {
    // The result of one round, and never a word for how much a child knows.
    for (const [key, value] of Object.entries(nl)) {
      if (!/\bscore\w*/i.test(value)) continue;
      expect(key, `"score" belongs to a round's result, not to ${key}`).toMatch(/^result\./);
    }
  });

  it('writes numbers the Dutch way', () => {
    for (const [key, value] of Object.entries(nl)) {
      // A percentage never takes a space before its sign.
      expect(value, `${key} puts a space before %`).not.toMatch(/\d\s%/);
      // Thousands take a point and decimals a comma, so a digit group of three
      // after a comma is the English habit showing through.
      expect(value, `${key} groups thousands with a comma`).not.toMatch(/\d,\d{3}\b/);
    }
  });

  it('never uses the ĳ ligature', () => {
    for (const [key, value] of Object.entries(nl)) {
      expect(value, `${key} carries a ĳ ligature`).not.toMatch(/[ĳĲ]/);
    }
  });

  it("uses the typographer's apostrophe, not the typewriter's", () => {
    for (const [key, value] of Object.entries(nl)) {
      // Inside a word: "'s ochtends" and "je naam's" would both be wrong with a
      // straight quote. Between words it is usually a quotation, which wants „ ”.
      expect(value, `${key} uses a straight apostrophe`).not.toMatch(/\w'\w/);
    }
  });

  /**
   * The other direction, and the one nothing was watching.
   *
   * The rule above keeps copy out of components; nothing kept copy that no
   * component reads out of nl.ts. Three reward programmes came and went in as
   * many weeks and left twenty-one sentences behind — phrases for a prijzenkast
   * and a weekdoel screen that no longer exist. Dead copy is worse than dead
   * code: it is read as the product's voice, so a review argues about a line
   * that nobody can reach.
   *
   * A key is used when its name appears somewhere outside nl.ts, in src or in
   * e2e. That is coarse on purpose — it is cheaper to be reminded of a key that
   * is only named in a test than to let another twenty pile up.
   */
  it('keeps no sentence that nothing says', () => {
    const genoemd = new Set<string>();
    for (const full of [
      ...componentFiles(join(ROOT, 'src')),
      ...sourceFiles(join(ROOT, 'src')),
      ...sourceFiles(join(ROOT, 'e2e')),
    ]) {
      if (relative(ROOT, full).split(sep).join('/') === 'src/i18n/nl.ts') continue;
      for (const match of readFileSync(full, 'utf8').matchAll(/[a-zA-Z0-9_.-]+/g)) {
        genoemd.add(match[0]);
      }
    }

    const dood = Object.keys(nl).filter(
      (key) => !genoemd.has(key) && !SAMENGESTELD.some((familie) => familie.test(key)),
    );
    expect(dood, 'niets leest deze sleutels; haal ze weg of gebruik ze').toEqual([]);
  });
});
