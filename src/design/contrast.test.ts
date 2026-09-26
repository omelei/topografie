import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Contrast, checked against the real stylesheet rather than a copy of it, so
 * this test cannot drift away from the tokens it is checking — change a colour
 * and the check follows it.
 *
 * Getting the file took two attempts, both worth recording. `import.meta.url`
 * is not a file URL under Vitest, so `fileURLToPath` throws. Vite's `?raw`
 * import looks like the idiomatic answer but returns an empty string, because
 * Vitest stubs CSS imports by default and the stub wins. Reading from the
 * project root is the boring option that actually works, in CI as well.
 *
 * That this matters more here than in most products is the point. The interface
 * is a map, where colour does nearly all the work, and a palette that slips
 * below AA is invisible to everyone who can already read it.
 */

const CSS_PATH = join(process.cwd(), 'src', 'index.css');
const css = readFileSync(CSS_PATH, 'utf8');

/**
 * The one theme there is: `:root`. A round used to redefine the roles with the
 * dark values (ADR-109); since ADR-112 it is light like the rest of the app —
 * and the styleguide's own dark half (§08) is not carried either — so every
 * colour is measured once, where it is declared. The root block has no nested
 * braces, so it ends at the first `}`.
 */
const rootStart = css.indexOf(':root {');
if (rootStart < 0) throw new Error(`No :root block in ${CSS_PATH}`);
const root = css.slice(rootStart, css.indexOf('}', rootStart));

/** One token's declaration. The lookbehind keeps `--kaart` from matching `--padding-kaart`. */
function declarationOf(name: string): string {
  const here = new RegExp(`(?<![\\w-])--${name}:\\s*([^;]+);`).exec(root);
  if (here?.[1]) return here[1].trim();
  throw new Error(`Token --${name} not found in ${CSS_PATH}`);
}

/** A token's value, resolved through var() references to a hex. */
function token(name: string, seen: string[] = []): string {
  if (seen.includes(name))
    throw new Error(`Token --${name} refers to itself: ${seen.join(' -> ')}`);

  const value = declarationOf(name);
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value;

  const reference = /^var\(\s*--([a-z0-9-]+)\s*\)$/.exec(value);
  if (reference?.[1]) return token(reference[1], [...seen, name]);

  // A mixed token is measured as the browser mixes it rather than trusted from
  // the comment beside it.
  const mengsel =
    /^color-mix\(in srgb,\s*var\(--([a-z0-9-]+)\)\s+(\d+)%,\s*var\(--([a-z0-9-]+)\)\s*\)$/.exec(
      value,
    );
  if (mengsel?.[1] && mengsel[2] && mengsel[3]) {
    const eerste = token(mengsel[1], [...seen, name]);
    const tweede = token(mengsel[3], [...seen, name]);
    return mix(eerste, Number(mengsel[2]) / 100, tweede);
  }

  throw new Error(`Token --${name} is not a colour: ${value}`);
}

/** `color-mix(in srgb, a p%, b)`: channel by channel, in sRGB, as a browser mixes it. */
function mix(a: string, p: number, b: string): string {
  const onder = channels(b);
  const kanalen = channels(a).map((value, i) => Math.round(value * p + (onder[i] ?? 0) * (1 - p)));
  return `#${kanalen.map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

function channels(hex: string): [number, number, number] {
  const n = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16)) as [number, number, number];
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = channels(hex).map((value) => {
    const s = value / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

function ratio(foreground: string, background: string): number {
  return contrastRatio(token(foreground), token(background));
}

/** The six modules, in the rail order of ADR-029. Spelling is a part of Taal (ADR-118). */
const MODULES = ['topo', 'tafels', 'klok', 'woorden', 'tijdvakken', 'vlaggen'] as const;

describe('contrast', () => {
  it.each([
    ['inkt', 'kaart'],
    ['inkt', 'papier'],
    // The ground is zand since ADR-221; papier (room) still carries text as a
    // fill, so both are measured.
    ['inkt', 'grond'],
    ['tekst-secundair', 'grond'],
    ['tekst-tertiair', 'grond'],
    ['fout', 'grond'],
    ['tekst-secundair', 'kaart'],
    ['tekst-secundair', 'papier'],
    // The third ink is a text colour, and it is one: 6.96 on a card and 6.37 on
    // the ground.
    ['tekst-tertiair', 'kaart'],
    ['tekst-tertiair', 'papier'],
    // The primary button, and the tick on the one solid fill there is.
    ['kaart', 'inkt'],
    ['kaart', 'nadruk'],
    // Green as text on a card, 5.40. On the ground it is 4.95 — still over the
    // line, and nadruk-tekst, which is measured on both, is the safer one.
    ['nadruk', 'kaart'],
    ['nadruk-tekst', 'nadruk-vlak'],
    ['nadruk-tekst', 'papier'],
    ['accent-text', 'accent-tint'],
    // Wrong as text sits on a card (6.41); on the ground it is 5.86.
    ['fout', 'kaart'],
    ['fout-tekst', 'fout-arcering-grond'],
    ['inkt', 'vlak-hover'],
    ['inkt', 'map-land'],
    // A map shape under the pointer, with its name drawn on it.
    ['inkt', 'map-land-hover'],
  ])('%s on %s clears 4.5:1', (foreground, background) => {
    expect(ratio(foreground, background)).toBeGreaterThanOrEqual(4.5);
  });

  /**
   * WCAG 1.4.11: the edge of a control and the marks that identify a state
   * need 3:1. The light rule does not clear it (1.31) and is never the only
   * thing that shows where a control is — which is why every field, option and
   * secondary button is drawn in rand-bediening, as the screens draw them.
   */
  it.each([
    ['rand-bediening', 'kaart'],
    ['rand-bediening', 'papier'],
    ['rand-bediening', 'grond'],
    ['nadruk', 'papier'],
    ['fout', 'papier'],
    ['accent', 'kaart'],
    ['map-grens', 'map-land'],
    ['map-grens', 'map-land-hover'],
    ['fout-kaart-rand', 'map-land'],
    ['tekst-tertiair', 'kaart'],
  ])('%s on %s clears 3:1 as a non-text indicator', (foreground, background) => {
    expect(ratio(foreground, background)).toBeGreaterThanOrEqual(3);
  });

  /**
   * Koraal as the button (ADR-179). White on it is 3.98, which is AA for large
   * text and not for anything smaller — huisstijl.test.ts holds a button's
   * words at 20px Baloo 700 for that reason. Its lower edge and its words on
   * the light tint are real text colours.
   */
  it('lets a button be koraal', () => {
    expect(ratio('kaart', 'actie'), 'large text on the button').toBeGreaterThanOrEqual(3);
    expect(ratio('actie', 'kaart'), 'the button on a card').toBeGreaterThanOrEqual(3);
    expect(ratio('actie', 'grond'), 'the button on the ground').toBeGreaterThanOrEqual(3);
    expect(ratio('actie', 'papier'), 'the button on room').toBeGreaterThanOrEqual(3);
    expect(ratio('kaart', 'actie-hover')).toBeGreaterThanOrEqual(4.5);
    expect(ratio('actie-tekst', 'actie-tint')).toBeGreaterThanOrEqual(4.5);
    expect(ratio('actie-tekst', 'kaart')).toBeGreaterThanOrEqual(4.5);
  });

  it('writes premium in cacao on zon, and in its deep tone on the tint', () => {
    expect(ratio('inkt', 'zon')).toBeGreaterThanOrEqual(4.5);
    expect(ratio('zon-tekst', 'zon-tint')).toBeGreaterThanOrEqual(4.5);
  });

  it('carries every word on a page’s koraal panel in cacao', () => {
    expect(ratio('inkt', 'koraal')).toBeGreaterThanOrEqual(4.5);
  });

  it('is light in a round too: a round redefines no colour', () => {
    const start = css.indexOf("[data-thema='ronde'] {");
    const ronde = css.slice(start, css.indexOf('}', start));
    expect(ronde).not.toMatch(/--(papier|kaart|inkt|tekst|rand|nadruk|fout|accent|map)[\w-]*:/);
  });
});

describe('the colours outside the styleguide’s table', () => {
  /**
   * A module's pictogram on its own tint: the plate, §03's standard strength
   * and the one place a module still has a colour of its own. The glyph on it,
   * and any text beside it that names the module, is the module's text colour.
   */
  it.each(MODULES.map((name) => [name] as const))('%s-text clears 4.5:1 on its tint', (name) => {
    expect(ratio(`${name}-text`, `${name}-tint`)).toBeGreaterThanOrEqual(4.5);
  });

  /**
   * The full strength, §03: a progress bar against its empty track, and the
   * plate of the subject you are in — filled solid, with the pictogram on it in
   * the card's light. Drawings rather than text, so the floor is three.
   */
  it.each(MODULES.map((name) => [name] as const))('fills a bar and a plate in %s', (name) => {
    expect(ratio(name, 'balk-leeg'), 'a bar against its track').toBeGreaterThanOrEqual(3);
    expect(ratio('kaart', name), 'the pictogram on the plate').toBeGreaterThanOrEqual(3);
    expect(ratio(name, `${name}-tint`), 'the plate against a quiet one').toBeGreaterThanOrEqual(3);
  });

  /**
   * Inside a module the accent is the module's colour (ADR-112), so its colour
   * is the double rule round a chosen tile and the fill of a round's dots: a
   * non-text indicator, on a card and on the ground.
   */
  it.each(MODULES.map((name) => [name] as const))('%s clears 3:1 as a chosen rule', (name) => {
    expect(ratio(name, 'kaart')).toBeGreaterThanOrEqual(3);
    expect(ratio(name, 'papier')).toBeGreaterThanOrEqual(3);
    expect(ratio(`${name}-text`, 'papier')).toBeGreaterThanOrEqual(4.5);
  });
});

/** The hue of a colour, in degrees round the wheel. */
function hue(hex: string): number {
  const [r, g, b] = channels(hex).map((value) => value / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  if (d === 0) return 0;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

/**
 * A subject may not wear the red that means wrong (ADR-184). Inside a subject
 * the chosen tile is the subject's colour, so a subject within 30 degrees of
 * fout would make "chosen" and "wrong" one colour apart from their shapes.
 * The first tijdvakken pink sat 16 degrees away; its magenta sits 40.
 */
describe('the subjects keep clear of wrong', () => {
  it.each(MODULES.map((name) => [name] as const))('%s is 30 degrees or more from fout', (name) => {
    const verschil = Math.abs(hue(token(name)) - hue(token('fout')));
    expect(Math.min(verschil, 360 - verschil)).toBeGreaterThanOrEqual(30);
  });
});

/**
 * The ground a page stands on. ADR-120 gave a module's page a soft version of
 * its own tint; §01 of the styleguide takes that back — a page-wide subject
 * tint is what made the screens look grey — and every page now stands on the
 * one neutral ground. The tokens stay, so a screen still says bg-module-grond,
 * and this is what holds them to it: every ink that stands on the ground stands
 * on each of them, because each of them is the ground — zand since ADR-221,
 * with room (papier) as the warm plane on it rather than under it.
 */
describe('the ground under a page', () => {
  const GRONDEN = [...MODULES.map((name) => `${name}-grond`), 'vandaag-grond'];

  it.each(GRONDEN.map((grond) => [grond] as const))('carries every ink on %s', (grond) => {
    for (const inkt of ['inkt', 'tekst-secundair', 'tekst-tertiair', 'nadruk-tekst']) {
      expect(ratio(inkt, grond), inkt).toBeGreaterThanOrEqual(4.5);
    }
    for (const rand of ['rand-bediening', 'nadruk', 'fout']) {
      expect(ratio(rand, grond), rand).toBeGreaterThanOrEqual(3);
    }
  });

  it.each(MODULES.map((name) => [name] as const))('lets %s speak on its own ground', (name) => {
    expect(ratio(`${name}-text`, `${name}-grond`)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(name, `${name}-grond`)).toBeGreaterThanOrEqual(3);
  });

  it.each(GRONDEN.map((grond) => [grond] as const))('is the one ground: %s', (grond) => {
    expect(token(grond)).toBe(token('grond'));
    expect(token(grond)).not.toBe(token('kaart'));
  });

  it('draws a rule on the ground as the guide draws its rule on a card (ADR-222)', () => {
    // The line under a section heading stands on the ground. The guide's light
    // rule is 1.33 on white and 1.09 on zand, so the ground gets its own.
    expect(ratio('rand-grond', 'grond')).toBeGreaterThanOrEqual(1.3);
    expect(ratio('rand-grond', 'grond')).toBeLessThan(ratio('rand-bediening', 'grond'));
  });

  it('is zand, and room is a plane on it rather than the ground (ADR-221)', () => {
    expect(token('grond')).toBe(token('canvas'));
    expect(token('grond')).not.toBe(token('papier'));
  });
});
