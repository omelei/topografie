import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The accent colours what is chosen, and nothing else.
 *
 * The accent is the action colour now: indigo, everywhere, in every module
 * (index.css, styleguide §02). A module's own colour is `--module` and is not
 * an accent — it denotes a subject on its tile and in its bar, and a subject is
 * not a state. Neither of them ever touches the mark: the dot is ink on paper
 * or paper on ink in every module.
 *
 * The reason it is worth enforcing rather than agreeing is that an accent is
 * always the tempting colour. It is the one that looks like the brand, so it
 * creeps onto the primary button, then onto the number that matters, then onto
 * a badge — and each step looks like an improvement on its own. What it costs
 * is the thing the rule protects: a child learns to look for a colour instead
 * of for a word.
 *
 * So: every use of an accent in the source has to be named here, with a reason.
 * Adding one is deliberate and shows up in a diff as what it is.
 */

const ROOT = process.cwd();

/** CSS rules that may paint with an accent, and why. */
const ALLOWED_SELECTORS: ReadonlyMap<string, string> = new Map([
  ['.tk-shape-asked', 'the highlight on the image'],
  // The answer a child has already given (ADR-089, ADR-095), on a page that is
  // nothing but questions. Every question on a module page is answered by a
  // chip, a tile or a square, and the chosen one of each is the only thing
  // worth finding again after looking away. Each also changes its rule or
  // carries a tick, because §A does not let a hue carry a state on its own.
  [".tk-keuze[aria-pressed='true']", 'the answer already given, as a chip'],
  [".tk-tegel[aria-pressed='true']", 'the answer already given, as a tile'],
  [".tk-tegel[aria-pressed='true'] .tk-plaat", 'the answer already given, as a tile'],
  ['.tk-tegel-vink', 'the answer already given: its tick'],
  // Ontdekken: the name being looked at, in a list of eighty (ADR-112). It
  // carries a tick as well, so the tint is not the only thing that says so.
  [".tk-verken-item[aria-current='true']", 'the answer already given, in a list'],
  [".tk-tafel[aria-pressed='true']", 'the answer already given, as a square'],
  [".tk-tafel[aria-pressed='true'] .tk-plaat", 'the answer already given, as a square'],
  // De startbalk is al die antwoorden tegelijk, met de accentkleur langs de
  // voorste rand (ADR-095), en hij is ook de weg verder — dus de kleur die
  // "hier druk je op" zegt hoort er precies. De chips erop blijven inkt.
  // Vandaag (ADR-126): de voordeur had geen primaire actie, en dit is hem. Het
  // is dezelfde vorm als de startbalk om dezelfde reden: hier begint een ronde.
  ['.tk-vandaag', 'the one thing to do today'],
  ['.tk-startbalk', 'the answers already given, together'],
  ['.tk-startbalk-label', 'the answers already given, together'],
]);

/**
 * Where an accent may be *defined* rather than used: the root, and nowhere
 * else. ADR-112 let `data-accent="module"` point it at the module's own colour;
 * the styleguide takes that back, and the accent is one colour in every module.
 */
const DEFINITION_SELECTORS = /^:root$/;

/** Lines in components that may name an accent, and why. */
const ALLOWED_LINES: readonly { file: string; snippet: string; why: string }[] = [
  {
    file: 'src/features/practice/MapCanvas.tsx',
    snippet: 'var(--accent',
    why: 'the highlight on the map',
  },
  {
    file: 'src/features/practice/ResultScreen.tsx',
    snippet: 'var(--accent',
    why: 'the highlight on the map',
  },
];

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) sourceFiles(full, out);
    else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}

/** Comments talk about the rule; they do not break it. */
function isComment(line: string): boolean {
  return /^\s*(\/\/|\/\*|\*)/.test(line.trim()) || line.trim().startsWith('{/*');
}

describe('the accent colours what is chosen and nothing else', () => {
  it('paints with an accent only in rules that are allowed to', () => {
    const css = readFileSync(join(ROOT, 'src', 'index.css'), 'utf8').replace(
      /\/\*[\s\S]*?\*\//g,
      '',
    );

    const offenders: string[] = [];
    let selector = '';

    for (const raw of css.split('\n')) {
      const line = raw.trim();
      if (line.endsWith('{')) {
        const named = line.slice(0, -1).trim();
        // Only track real selectors, not @media or @layer wrappers.
        if (named && !named.startsWith('@')) selector = named;
        continue;
      }

      if (!line.includes('--accent')) continue;

      // A declaration whose *property* is an accent is a definition.
      const property = /^(--[a-z-]+)\s*:/.exec(line)?.[1];
      if (property?.startsWith('--accent')) {
        if (!DEFINITION_SELECTORS.test(selector)) {
          offenders.push(`${selector} defines ${property}`);
        }
        continue;
      }

      if (!ALLOWED_SELECTORS.has(selector)) offenders.push(`${selector} uses ${line}`);
    }

    expect(offenders, 'add the rule to ALLOWED_SELECTORS, with a reason, or use ink').toEqual([]);
  });

  it('names an accent in a component only where it is listed, with a reason', () => {
    const offenders: string[] = [];

    for (const full of sourceFiles(join(ROOT, 'src'))) {
      const file = relative(ROOT, full).split('\\').join('/');
      const lines = readFileSync(full, 'utf8').split('\n');

      lines.forEach((line, index) => {
        if (!/\b(bg|text|border|fill|stroke)-accent|var\(--accent/.test(line)) return;
        if (isComment(line)) return;

        const allowed = ALLOWED_LINES.some(
          (entry) => entry.file === file && line.includes(entry.snippet),
        );
        if (!allowed) offenders.push(`${file}:${index + 1} ${line.trim()}`);
      });
    }

    expect(offenders, 'add it to ALLOWED_LINES with a reason, or use ink').toEqual([]);
  });

  it('keeps the mark out of it entirely', () => {
    // The logo and the dot are identical in every module. If either ever
    // learns about accents, the brand has seven versions of itself.
    for (const name of ['Dot.tsx', 'Wordmark.tsx', 'Brandmark.tsx']) {
      const source = readFileSync(join(ROOT, 'src', 'components', name), 'utf8');
      const code = source
        .split('\n')
        .filter((line) => !isComment(line))
        .join('\n');
      expect(code, `${name} must not know about accents`).not.toMatch(/var\(--accent/);
    }
  });
});
