import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The accent colours what is chosen, and nothing else.
 *
 * Inside a subject the accent is the subject's colour, as the Merk en
 * stijlgids draws its chosen tile (ADR-180); where no subject is named it is
 * nacht (ADR-238). It is never koraal, the colour of what you press. Neither the accent
 * nor a module's colour ever touches the mark: the dot is ink on paper or
 * paper on ink in every module.
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
  [".tk-avatarkeuze[aria-pressed='true']", 'the avatar already chosen, as a chip (ADR-202)'],
  [".tk-tegel[aria-pressed='true']", 'the answer already given, as a tile'],
  [".tk-tegel[aria-pressed='true'] .tk-plaat", 'the answer already given, as a tile'],
  ['.tk-tegel-vink', 'the answer already given: its tick'],
  // ADR-252: on a phone the steps already answered stand together at the top,
  // each with a tick, and the bar at the foot has a segment per step — the
  // answered ones in the subject's colour. Both say "chosen" and nothing else.
  ['.tk-stapgekozen-vink', 'a step already answered: its tick'],
  // The same chip, tile and tick on a phone, drawn as the design has them:
  // the subject's tint with its rule, rather than filled (ADR-252).
  [".tk-kiespagina .tk-keuze[aria-pressed='true']", 'the answer already given, as a chip'],
  [".tk-kiespagina .tk-tegel[aria-pressed='true']", 'the answer already given, as a tile'],
  [
    ".tk-kiespagina .tk-tegel[aria-pressed='true'] .tk-plaat",
    'the answer already given, as a tile',
  ],
  ['.tk-kiespagina .tk-tegel-vink', 'the answer already given: its tick'],
  [".tk-stapvoortgang-segment[data-stand='gekozen']", 'a step already answered, in the bar'],
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
 * Where an accent may be *defined* rather than used: the root, and
 * `data-accent="module"`, which points it at the subject's own colour. ADR-112
 * did that, Leisteen took it back, and the Merk en stijlgids draws its chosen
 * tile in the subject's colour again (ADR-180).
 */
const DEFINITION_SELECTORS = /^(:root|\[data-accent='module'\])$/;

/**
 * Kleur erin (ADR-239): where the subject's colour stands on something that
 * is *not* chosen. Children found the app grey, so a subject's card, tile,
 * chip, header and row in the cupboard now wear its light tone, and its plate
 * its tint. This is not the accent — `--accent` still means "chosen" and only
 * the rules above paint with it — but it is the same colour, so every place is
 * named here, with a reason. What still says "chosen" is the deep tone, the
 * double rule and the tick; the light tone never carries a state alone.
 */
const SUBJECT_SELECTORS: ReadonlyMap<string, string> = new Map([
  ['.tk-kaart', 'a card on Vandaag is a door into one subject'],
  ['.tk-kaart:hover', 'the same card under the pointer'],
  ['.tk-kaart-voet', 'the line the card is about, in its subject'],
  ['.tk-maakaf .tk-progress-fill', 'progress through that subject'],
  [
    '.tk-lijstrij[data-module]:not(.tk-weekdoel-rij) .tk-lijstrij-pijl',
    'the way into a subject, from a row that names it',
  ],
  ['.tk-stap-nummer', 'the page’s own order, told in its subject'],
  ['.tk-keuze', 'a chip on a subject’s page, not yet chosen'],
  [".tk-keuze:not(:disabled):not([aria-pressed='true']):hover", 'the same chip under the pointer'],
  ['.tk-tegel', 'a tile on a subject’s page, not yet chosen'],
  [".tk-tegel:not([aria-pressed='true']):hover", 'the same tile under the pointer'],
  // ADR-240: every tile a child presses has the same rule and lower edge as a
  // card on Vandaag.
  ['.tk-tafel', 'a square on a subject’s page, not yet chosen'],
  [".tk-tafel:not([aria-pressed='true']):hover", 'the same square under the pointer'],
  ['.tk-vaktegel', 'a subject’s tile on Vandaag, a door into it'],
  ['.tk-vaktegel:hover', 'the same tile under the pointer'],
  ['.tk-eerste', 'the first round, in its subject'],
  ['.tk-nudoen', 'the one thing to do now, in its subject (ADR-250)'],
  ['.tk-diploma', 'a diploma of that subject, not yet earned'],
  ['.tk-diploma-vlak', 'its drawings, in the subject'],
  ['.tk-diploma-voortgang', 'how far along it is'],
  ['.tk-diploma-soort', 'what kind of diploma, in its subject'],
  ['.tk-diploma-stand', 'where it stands, in its subject'],
  ['.tk-startbalk-mobiel .tk-hulp', 'its help line'],
  // ADR-247: a step still waiting, in the start bar, takes you to it.
  ['.tk-nogstap', 'a step still to answer, in the start bar'],
  ['.tk-vakrij[data-module]', 'a subject in the cupboard on Jij'],
  ['.tk-vakrij[data-module]:hover', 'the same row under the pointer'],
  ['.tk-vakrij[data-module] .tk-vakrij-naam', 'its name'],
  ['.tk-vakrij[data-module] .tk-vakrij-meta', 'how many diplomas it has'],
]);

/**
 * Koraal is the button, the page's opening panel and the logo (ADR-179). The
 * rules that may paint with it, and why. Never progress, never what is chosen,
 * never a subject.
 */
const KORAAL_SELECTORS: ReadonlyMap<string, string> = new Map([
  ['.tk-button', 'the button'],
  [
    ":root:not([data-beweging='rustig']) .tk-button:active:not(:disabled):not(.tk-button-tertiary)",
    'the button, pressed',
  ],
  ['.tk-knop-licht', 'a light button'],
  ['.tk-knop-licht:active', 'a light button, pressed'],
  ['.tk-kaartteken', 'the mark before a card you press'],
  ['.tk-etalage', 'the panel a page opens on'],
  ['.tk-welkom-cirkel', 'a shape on that panel'],
  // ADR-239: a setting on Jij and a number tile under "Hoe vaak oefen je?" each
  // have a tint of their own. It is a label's fill, as on the light button,
  // and not progress, not a choice and not a subject.
  ["[data-tint='koraal']", 'the tint of a setting and a number tile'],
  // ADR-242, a choice of the owner: where you are in the tab bar on a phone is
  // the light button's tint with a koraal rule above it, and the word in deep
  // koraal. The one place koraal says where you are; nowhere else.
  ['.tk-tabbar-item[aria-current]', 'where you are in the tab bar on a phone (ADR-242)'],
  ['.tk-tabbar-item[aria-current] .tk-tabbar-teken', 'its icon, in the same deep koraal'],
]);

/** The rules of the stylesheet, without comments, as selector and declarations. */
function cssRules(): { selector: string; line: string }[] {
  const css = readFileSync(join(ROOT, 'src', 'index.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const rules: { selector: string; line: string }[] = [];
  let selector = '';
  for (const raw of css.split('\n')) {
    const line = raw.trim();
    if (line.endsWith('{')) {
      const named = line.slice(0, -1).trim();
      if (named && !named.startsWith('@')) selector = named;
      continue;
    }
    rules.push({ selector, line });
  }
  return rules;
}

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

  it('names every place a subject colours what is not chosen (ADR-239)', () => {
    // The subject's light rule is the token of this change: every rule that
    // draws with it is on the list.
    const offenders = cssRules()
      .filter(({ line }) => line.includes('var(--module-rand)'))
      .map(({ selector }) => selector)
      .filter((selector) => !SUBJECT_SELECTORS.has(selector));
    expect(offenders, 'add the rule to SUBJECT_SELECTORS, with a reason').toEqual([]);

    // And every place on the list is a rule that still colours with the subject.
    const selectors = new Set(
      cssRules()
        .filter(({ line }) => /var\(--module/.test(line))
        .map(({ selector }) => selector),
    );
    const stale = [...SUBJECT_SELECTORS.keys()].filter((selector) => !selectors.has(selector));
    expect(stale, 'remove it from SUBJECT_SELECTORS').toEqual([]);
  });

  it('keeps koraal to the button, the opening panel and the logo', () => {
    const offenders = cssRules()
      .filter(({ line }) => /var\(--(actie|koraal)[\w-]*\)/.test(line))
      .map(({ selector }) => selector)
      .filter((selector) => !KORAAL_SELECTORS.has(selector));
    expect(offenders, 'koraal is the button, not a subject or a state').toEqual([]);

    const subjectKoraal = cssRules()
      .filter(({ selector }) => SUBJECT_SELECTORS.has(selector))
      .filter(({ line }) => /var\(--(actie|koraal)/.test(line));
    expect(subjectKoraal).toEqual([]);
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
