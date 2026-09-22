import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/* eslint-disable no-restricted-syntax -- the one place a hex is quoted on
   purpose: the palette's table, to hold the stylesheet to it letter for letter. */

/**
 * The house style, held in place (ADR-109, ADR-179, docs/HUISSTIJL.md).
 *
 * Colour and type are the Merk en stijlgids's (docs/leer.nu Merk en
 * stijlgids.dc.html, ADR-179), with its deeper tone wherever its own pair
 * falls short of AA; the six subjects are still Leisteen's until the guide's
 * own set arrives, and the rest of the tokens are design_handoff_leernu's. This
 * file is what makes that true for the next page as well as for this one: a new
 * screen that reaches for a literal colour, a shadow, a third typeface or one of
 * the old token names fails here, with the file and the line, before anyone has
 * to notice it in a screenshot.
 *
 * Every hex below is the guide's own, or — where the comment in index.css
 * says so — the guide's deeper edge of the same colour.
 */

const ROOT = process.cwd();
const css = readFileSync(join(ROOT, 'src', 'index.css'), 'utf8');
const cssCode = css.replace(/\/\*[\s\S]*?\*\//g, '');

/** The declarations of `:root`, which has no nested braces. */
const rootStart = css.indexOf(':root {');
const rootBlock = css.slice(rootStart, css.indexOf('}', rootStart));

function rootValue(name: string): string | undefined {
  return new RegExp(`(?<![\\w-])--${name}:\\s*([^;]+);`).exec(rootBlock)?.[1]?.trim();
}

function sourceFiles(dir: string, pattern: RegExp, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) sourceFiles(full, pattern, out);
    else if (pattern.test(entry) && !/\.test\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}

function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

/** Offending lines as `file:line text`, for a failure that says where. */
function offenders(pattern: RegExp, files: string[]): string[] {
  const found: string[] = [];
  for (const full of files) {
    const file = relative(ROOT, full).split('\\').join('/');
    withoutComments(readFileSync(full, 'utf8'))
      .split('\n')
      .forEach((line, index) => {
        if (pattern.test(line)) found.push(`${file}:${index + 1} ${line.trim()}`);
      });
  }
  return found;
}

describe('the tokens are the styleguide’s', () => {
  it.each([
    ['canvas', '#f3e6d8'],
    ['papier', '#fff3e6'],
    ['kaart', '#ffffff'],
    ['inkt', '#2a1e17'],
    ['tekst-secundair', '#5e4a3e'],
    ['tekst-tertiair', '#6b5548'],
    ['rand-licht', '#f0dcc8'],
    ['rand-sterk', '#e6d6c6'],
    ['balk-leeg', '#efe2d4'],
    ['koraal', '#ff6a4d'],
    ['actie', '#e34a2c'],
    ['actie-hover', '#a8331d'],
    ['actie-tint', '#ffe9e1'],
    ['actie-tekst', '#a8331d'],
    // Goed and framboos are the guide's deeper edges: its fills are 3.46 and
    // 4.37 under white, and these are read as text and carry a white tick.
    ['nadruk', '#147a3f'],
    ['nadruk-vlak', '#dcf5e6'],
    ['nadruk-tekst', '#0f5e30'],
    ['fout', '#b81d3b'],
    ['fout-vlak', '#fde2e7'],
    ['teal', '#0b7468'],
    ['teal-tint', '#ddf6f1'],
  ])('--%s is %s', (name, hex) => {
    expect(rootValue(name)?.toLowerCase()).toBe(hex);
  });

  /**
   * The six subjects, §03: one hue each, at equal lightness and chroma, in
   * three strengths — the light tile, the full colour and the dark tone that
   * names the subject in words. The styleguide draws five and says a sixth
   * belongs on hue 25 or 105; tijdvakken takes 105, because 25 is the red that
   * means wrong.
   */
  it.each([
    ['topo-tint', '#c9e0ff'],
    ['topo', '#3072c1'],
    ['topo-text', '#004b96'],
    ['tafels-tint', '#c9f0d5'],
    ['tafels', '#00884d'],
    ['tafels-text', '#005d33'],
    ['klok-tint', '#ffddc7'],
    ['klok', '#b75f0b'],
    ['klok-text', '#834100'],
    ['woorden-tint', '#edd8fd'],
    ['woorden', '#8a57ae'],
    ['woorden-text', '#643185'],
    ['tijdvakken-tint', '#e9e7bd'],
    ['tijdvakken', '#7c7400'],
    ['tijdvakken-text', '#554f00'],
    ['vlaggen-tint', '#b7edf0'],
    ['vlaggen', '#008287'],
    ['vlaggen-text', '#00585c'],
  ])('--%s is %s', (name, hex) => {
    expect(rootValue(name)?.toLowerCase()).toBe(hex);
  });

  /**
   * And no page stands on a subject tint any more (§01, which takes ADR-120
   * back): the tint made white cards look grey, and every screen now carries
   * the same neutral ground. The tokens stay so a screen need not know.
   */
  it.each([
    ['topo-grond'],
    ['tafels-grond'],
    ['klok-grond'],
    ['woorden-grond'],
    ['tijdvakken-grond'],
    ['vlaggen-grond'],
    ['vandaag-grond'],
  ])('--%s is the one ground', (name) => {
    expect(rootValue(name)).toBe('var(--papier)');
  });

  it.each([
    // Type, PO: size / line height in rem at a 16px root, as the guide's px.
    ['type-paginakop', '2.75rem'],
    ['type-paginakop-lh', '3rem'],
    ['type-paginakop-ls', '-0.01em'],
    ['type-paginakop-weight', '800'],
    ['type-sectiekop', '1.75rem'],
    ['type-sectiekop-lh', '2rem'],
    ['type-sectiekop-weight', '700'],
    ['type-kaartkop', '1.25rem'],
    ['type-kaartkop-lh', '1.625rem'],
    ['type-kaartkop-weight', '700'],
    ['type-vraag', '2.25rem'],
    ['type-vraag-lh', '2.5rem'],
    ['type-vraag-weight', '800'],
    ['type-getal', '2.75rem'],
    ['type-getal-groot', '3rem'],
    ['type-lopend', '1.125rem'],
    ['type-lopend-lh', '1.6875rem'],
    ['type-knop', '1.25rem'],
    ['type-knop-lh', '1.5rem'],
    ['type-knop-weight', '700'],
    ['type-vlaklabel', '0.8125rem'],
    ['type-vlaklabel-lh', '1rem'],
    ['type-vlaklabel-ls', '0.08em'],
    ['type-vlaklabel-weight', '700'],
    ['type-bijschrift', '0.9375rem'],
    ['type-bijschrift-lh', '1.375rem'],
    // Shape and space.
    ['radius-chip', '6px'],
    ['radius-chip-groot', '8px'],
    ['radius-kaart-vo', '10px'],
    ['radius-kaart', '12px'],
    ['radius-kaart-telefoon', '14px'],
    ['radius-rondevlak', '16px'],
    ['padding-paneel', '32px'],
    ['padding-kaart', '24px'],
    ['padding-kaart-telefoon', '20px'],
    ['padding-kaart-vo', '16px'],
    ['gap-sectie', '64px'],
    ['stroke-hair', '1px'],
    ['stroke-active', '2px'],
    // Hit targets.
    ['touch-wijzer', '44px'],
    ['touch-tablet', '48px'],
    ['touch-duim', '56px'],
    ['touch-ronde', '56px'],
    ['touch-vo', '44px'],
    // The one shadow, on the ink's own channels.
    ['schaduw-beloning', '0 10px 18px rgb(42 30 23 / 22%)'],
  ])('--%s is %s', (name, value) => {
    expect(rootValue(name)).toBe(value);
  });

  it('sets headings and numbers in Baloo 2, and everything else in Atkinson Hyperlegible', () => {
    expect(rootValue('font-kop')).toMatch(/^'Baloo 2'/);
    expect(rootValue('font-tekst')).toMatch(/^'Atkinson Hyperlegible'/);
    const faces = [...css.matchAll(/@font-face\s*\{[^}]*font-family:\s*'([^']+)'/g)].map(
      (match) => match[1],
    );
    expect(new Set(faces)).toEqual(new Set(['Baloo 2', 'Atkinson Hyperlegible']));
    // And only their files are shipped: an unused face in public/ is a face
    // someone will reach for.
    expect(readdirSync(join(ROOT, 'public', 'fonts')).sort()).toEqual([
      'atkinson-hyperlegible-latin-400.woff2',
      'atkinson-hyperlegible-latin-700.woff2',
      'baloo-2-latin-wght.woff2',
    ]);
  });

  it('keeps a button’s words large enough for white on koraal', () => {
    // White on koraal knop is 3.98: AA for large text only, which is 14pt
    // bold — 18.67px at a weight of 700. A smaller button fails a child who
    // reads slowly, in every guise that can be switched on.
    const px = (name: string) => parseFloat(rootValue(name) ?? '0') * 16;
    expect(px('type-knop')).toBeGreaterThanOrEqual(18.67);
    expect(Number(rootValue('type-knop-weight'))).toBeGreaterThanOrEqual(700);
    const vo = css.slice(css.indexOf("[data-guise='vo'] {"));
    const voKnop = /--type-knop:\s*([\d.]+)rem/.exec(vo.slice(0, vo.indexOf('}')))?.[1];
    expect(Number(voKnop ?? '2') * 16).toBeGreaterThanOrEqual(18.67);
    const button = cssCode.slice(cssCode.indexOf('.tk-button {'));
    const rule = button.slice(0, button.indexOf('}'));
    expect(rule).toContain('font-family: var(--font-kop)');
    expect(rule).toContain('font-size: var(--type-knop)');
    expect(rule).toContain('font-weight: var(--type-knop-weight)');
  });
});

describe('the stylesheet uses them and nothing else', () => {
  it('names a colour only where a token is declared', () => {
    // A literal hex in a rule is a colour the round cannot switch and the next
    // palette change will miss.
    const lines = cssCode
      .split('\n')
      .filter((line) => /#[0-9a-fA-F]{3,8}\b/.test(line))
      .filter((line) => !/^\s*--[a-z0-9-]+:\s*#[0-9a-fA-F]{3,8};/.test(line));
    expect(lines).toEqual([]);
  });

  it('names a typeface only through its token', () => {
    const lines = cssCode
      .split('\n')
      .filter((line) => /font-family:/.test(line))
      .filter(
        (line) =>
          !/font-family:\s*(var\(--font-(kop|tekst)\)|inherit|'(Baloo 2|Atkinson Hyperlegible)')/.test(
            line,
          ),
      );
    expect(lines).toEqual([]);
  });

  it('draws no shadow except on a reward image', () => {
    expect(cssCode).not.toMatch(/box-shadow/);
    const filters = [...cssCode.matchAll(/drop-shadow\(([^;]*)\)/g)].map((match) => match[1]);
    for (const filter of filters) {
      // The flag's hairline is an edge that follows the flag's own outline,
      // not a shadow: no offset, one pixel, in the tertiary ink.
      if (filter === '0 0 1px var(--tekst-tertiair)') continue;
      expect(filter).toBe('var(--schaduw-beloning)');
    }
  });

  it('keeps running text pretty', () => {
    expect(/(^|\n)\s*p\s*\{[^}]*text-wrap:\s*pretty/.test(cssCode)).toBe(true);
  });

  it('keeps a round on the app’s own colours and takes the hit targets up to 56', () => {
    // ADR-112: a round is light like every other screen. It redefines no
    // colour — only how big a control is.
    const start = css.indexOf("[data-thema='ronde'] {");
    const ronde = css.slice(start, css.indexOf('}', start));
    expect(ronde).toContain('--raak: var(--touch-ronde)');
    expect(ronde).toContain('--knop-hoogte: var(--touch-ronde)');
    expect(ronde).not.toMatch(/--(papier|kaart|inkt|nadruk|accent)[\w-]*:/);
    expect(cssCode).not.toMatch(/--donker-/);
  });
});

/**
 * Koraal is the brand and the button, and nothing else (ADR-179).
 *
 * Since ADR-179 koraal is the colour you press and the surface a page opens
 * on. It is still twenty degrees of hue from framboos, the red that means
 * wrong, and seventeen from mandarijn, so it may not pick up a third meaning on
 * the way past: not an answer, not progress, not a subject, not what is
 * chosen. The logo's own values stay in the delivery's file.
 */
describe('koraal stays the brand’s and the button’s', () => {
  const KORAAL = new Set(['#ff6a4d', '#e34a2c', '#a8331d', '#ffe9e1', '#c8412a']);

  /** A token's value, followed through var() to the hex it lands on. */
  function resolved(name: string): string | undefined {
    const value = rootValue(name);
    const reference = value && /^var\(--([a-z0-9-]+)\)$/.exec(value);
    return reference?.[1] ? resolved(reference[1]) : value?.toLowerCase();
  }

  it.each([
    ['accent'],
    ['accent-text'],
    ['accent-tint'],
    ['module'],
    ['module-tekst'],
    ['module-tint'],
    ['nadruk'],
    ['nadruk-vlak'],
    ['nadruk-tekst'],
    ['fout'],
    ['fout-vlak'],
    ['fout-arcering-streep'],
    ['topo'],
    ['tafels'],
    ['klok'],
    ['woorden'],
    ['tijdvakken'],
    ['vlaggen'],
  ])('is not --%s', (name) => {
    expect(KORAAL.has(resolved(name) ?? '')).toBe(false);
  });

  it('leaves the logo’s tokens to the delivery’s own file', () => {
    expect(cssCode).not.toMatch(/--leernu-/);
    expect(cssCode).not.toMatch(/--denker-/);
  });

  it('is the only stylesheet beside index.css', () => {
    // A third stylesheet is where a second palette starts: index.css holds the
    // app's colours, kleuren.css holds the logo's, and there is no third
    // opinion.
    const sheets = sourceFiles(join(ROOT, 'src'), /\.css$/)
      .map((full) => relative(ROOT, full).split('\\').join('/'))
      .sort();
    expect(sheets).toEqual(['src/design/kleuren.css', 'src/index.css']);
  });

  it('is not reached for by a component through the logo’s tokens', () => {
    expect(offenders(/--leernu-|--denker-/, sourceFiles(join(ROOT, 'src'), /\.tsx?$/))).toEqual([]);
  });

  it('left no --merk token behind', () => {
    // It pointed at the action colour, for a wordmark that was drawn in code
    // (ADR-147). The logo is a picture now and colours itself.
    expect(rootValue('merk')).toBe(undefined);
  });
});

/** The names the handoff replaced (docs/MIGRATIE-STATUS.md), gone for good. */
const OLD_TOKENS =
  /(?<![\w-])--(paper|surface|sunken|grond|line|line-strong|ink|ink-2|ink-3|good|good-text|bad|attention|attention-text|neutral|shadow-1|shadow-2|shadow-menu|shadow-held|touch|touch-min|touch-board|control-height|card-radius|card-padding|row-gap|radius-card|radius-control|radius-field|radius-full|radius-flat|radius-plaat|radius-klein|radius-balk|type-(?:h1|h2|h3|body|label|small|score)(?:-lh|-ls)?)(?![\w-])/;

describe('the old vocabulary is gone', () => {
  it('from the stylesheet', () => {
    expect(cssCode.split('\n').filter((line) => OLD_TOKENS.test(line))).toEqual([]);
  });

  it('from the components', () => {
    expect(offenders(OLD_TOKENS, sourceFiles(join(ROOT, 'src'), /\.tsx?$/))).toEqual([]);
  });

  it('and no component reaches past the tokens', () => {
    // Tailwind's own palette, shadows, radii, families and type sizes do not
    // exist in this project (tailwind.config.ts), so a class like these renders
    // nothing at all. Saying so here turns a silent miss into a failure.
    const stray =
      /(?<![\w-])(?:[a-z0-9-]+:)*(?:(?:bg|text|border|fill|stroke|ring|outline|divide|decoration|placeholder|caret)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black|paper|surface|sunken|grond|line|line-strong|ink|ink-2|good|good-text|bad|attention|topo|tafels|klok|woorden|spelling|tijdvakken|vlaggen)(?:-\d{2,3})?|shadow(?:-(?:sm|md|lg|xl|2xl|inner|1|2))?|rounded(?:-(?:sm|md|lg|xl|2xl|3xl|full|control|card|field|flat))?|font-(?:sans|serif|mono|display)|text-(?:xs|sm|base|lg|xl|[2-9]xl|h1|h2|h3|body|label|small|score|eyebrow)|[hw]-touch(?:-min|-board)?)(?![\w-])/;
    expect(offenders(stray, sourceFiles(join(ROOT, 'src'), /\.tsx$/))).toEqual([]);
  });

  it('and a heading takes its weight from its role', () => {
    // text-paginakop and .tk-titel carry 700, a card's heading 600. A
    // font-semibold beside them wins in the cascade and quietly sets a page
    // heading at the wrong weight — which is how four of them first shipped.
    const role = String.raw`(?:tk-titel|text-(?:paginakop|sectiekop|vraag|getal|getal-groot))\b`;
    const weight = String.raw`\bfont-(?:semibold|bold)\b`;
    const doubled = new RegExp(`${role}[^'"\`]*${weight}|${weight}[^'"\`]*${role}`);
    expect(offenders(doubled, sourceFiles(join(ROOT, 'src'), /\.tsx$/))).toEqual([]);
  });

  it('and no inline style picks its own typeface', () => {
    const inline = /fontFamily:\s*['"`](?!var\(--font-(?:kop|tekst)\))/;
    expect(offenders(inline, sourceFiles(join(ROOT, 'src'), /\.tsx$/))).toEqual([]);
  });
});

describe('a round switches its hit targets on in every module', () => {
  it.each([
    ['src/features/practice/PracticeScreen.tsx'],
    ['src/features/sums/SumScreen.tsx'],
    ['src/features/klok/KlokScreen.tsx'],
    ['src/features/vlaggen/VlagScreen.tsx'],
    ['src/features/explore/ExploreScreen.tsx'],
    ['src/features/vlaggen/VlagExploreScreen.tsx'],
    ['src/features/taal/TaalScreen.tsx'],
    ['src/features/taal/TaalExploreScreen.tsx'],
  ])('%s switches the round theme on', (file) => {
    expect(readFileSync(join(ROOT, file), 'utf8')).toContain('data-thema="ronde"');
  });
});
