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
 * handoff's dark values (ADR-109); since ADR-112 it is light like the rest of
 * the app, so every colour is measured once, where it is declared. The root
 * block has no nested braces, so it ends at the first `}`.
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

  // A ground is two tokens mixed (ADR-120), and is measured as the browser
  // mixes it rather than trusted from the comment beside it.
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
const REEKSEN = ['brons', 'zilver', 'goud', 'platina', 'ultra'] as const;

describe('contrast', () => {
  it.each([
    ['inkt', 'kaart'],
    ['inkt', 'papier'],
    ['tekst-secundair', 'kaart'],
    ['tekst-secundair', 'papier'],
    // The handoff made the third ink a text colour, and it is one: 5.15 on a
    // card and 4.58 on the ground, just over the line.
    ['tekst-tertiair', 'kaart'],
    ['tekst-tertiair', 'papier'],
    // The primary button, and the tick on the one solid fill there is.
    ['kaart', 'inkt'],
    ['kaart', 'nadruk'],
    // Green as text on a card. Not on the ground, where it reaches 4.20 —
    // there it is nadruk-tekst, which is measured on both.
    ['nadruk', 'kaart'],
    ['nadruk-tekst', 'nadruk-vlak'],
    ['nadruk-tekst', 'papier'],
    ['accent-text', 'accent-tint'],
    // Wrong as text sits on a card (4.72); on the ground it reaches 4.21 and
    // is only ever an edge there, measured below.
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
   * need 3:1. The light rule does not clear it (1.40) and is never the only
   * thing that shows where a control is — which is why every field, option and
   * secondary button is drawn in rand-bediening, as the screens draw them.
   */
  it.each([
    ['rand-bediening', 'kaart'],
    ['rand-bediening', 'papier'],
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

  it('is light in a round too: a round redefines no colour', () => {
    const start = css.indexOf("[data-thema='ronde'] {");
    const ronde = css.slice(start, css.indexOf('}', start));
    expect(ronde).not.toMatch(/--(papier|kaart|inkt|tekst|rand|nadruk|fout|accent|map)[\w-]*:/);
  });
});

describe('the colours outside the handoff table', () => {
  /**
   * A module's pictogram on its own tint: the plate, the one place a module
   * still has a colour of its own. Text on it is the module's text colour.
   */
  it.each(MODULES.map((name) => [name] as const))('%s-text clears 4.5:1 on its tint', (name) => {
    expect(ratio(`${name}-text`, `${name}-tint`)).toBeGreaterThanOrEqual(4.5);
  });

  /**
   * The plate itself since ADR-142: the module's own colour filled solid, with
   * the pictogram drawn on it in the card's light. A drawing rather than text,
   * so the floor is three — all six clear four, which is what let the plate go
   * saturated in the first place.
   */
  it.each(MODULES.map((name) => [name] as const))('draws a pictogram on %s', (name) => {
    expect(ratio('kaart', name)).toBeGreaterThanOrEqual(3);
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

  /**
   * The collection's five materials (ADR-071). They carry a drawing rather
   * than text, so the floor is three.
   */
  it.each(REEKSEN.map((reeks) => [reeks] as const))('draws %s legibly on a card', (reeks) => {
    expect(ratio(`reeks-${reeks}`, 'kaart')).toBeGreaterThanOrEqual(3);
  });

  it.each(REEKSEN.map((reeks) => [reeks] as const))(
    'names %s legibly in its deep tone, and draws on it in the light',
    (reeks) => {
      expect(ratio(`reeks-${reeks}-diep`, 'kaart'), 'deep tone').toBeGreaterThanOrEqual(4.5);
      expect(ratio('reeks-licht', `reeks-${reeks}`), 'drawing').toBeGreaterThanOrEqual(3);
    },
  );

  it('gives every rung of the ladder a colour of its own', () => {
    const waarden = REEKSEN.map((reeks) => token(`reeks-${reeks}`));
    expect(new Set(waarden).size).toBe(waarden.length);
  });
});

/**
 * The ground a page stands on (ADR-120): a module's page on a soft version of
 * its tint, the front door on a soft version of the green. Every ink that
 * stands on papier has to stand on each of them too, and a card has to stay a
 * card on it.
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

  it.each(GRONDEN.map((grond) => [grond] as const))('is neither a card nor paper: %s', (grond) => {
    expect(token(grond)).not.toBe(token('kaart'));
    expect(token(grond)).not.toBe(token('papier'));
  });
});
