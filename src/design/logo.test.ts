import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MERK, MERK_KLEIN, MERK_NAALD_VANAF_PX } from './logo';
import { WOORDBEELD, WOORDBEELD_LEER, WOORDBEELD_NU, WOORDBEELD_X_HOOGTE } from './woordbeeld';

/* eslint-disable no-restricted-syntax -- the second place a hex is quoted on
   purpose: the logo's own files, to hold the drawing to the colours the
   styleguide gives it. index.css keeps the same two under --inkt and --merk. */

const svg = (name: string) =>
  readFileSync(join(process.cwd(), 'docs', 'logo', 'svg', name), 'utf8');

/**
 * The logo, checked against the files in docs/logo rather than against itself
 * (ADR-113).
 *
 * The beeldmerk, the app icon and the woordbeeld are the designer's own SVGs;
 * tools/logo/maak-logo.py writes logo.ts from the first two, and woordbeeld.ts
 * is the woordbeeld's paths copied over (ADR-147). If one of these fails,
 * either a file in docs/logo changed and has to be carried over again, or a
 * .ts file was edited by hand — and the logo is the one thing nobody should be
 * retouching in a code review.
 */
describe('the logo is the one in docs/logo', () => {
  it('draws the beeldmerk as the designer did: a ring and a needle', () => {
    for (const name of ['beeldmerk-inkt.svg', 'beeldmerk-papier.svg']) {
      const file = svg(name);
      expect(file, name).toContain(`<circle cx="${MERK.cx}" cy="${MERK.cy}" r="${MERK.r}"`);
      expect(file, name).toContain(`stroke-width="${MERK.stroke}"`);
      expect(file, name).toContain(`d="${MERK.naald}"`);
    }
  });

  it('puts the same mark on the app icon', () => {
    const file = svg('app-icoon.svg');
    expect(file).toContain(`r="${MERK.r}"`);
    expect(file).toContain(`d="${MERK.naald}"`);
  });

  it('copies the woordbeeld path for path from the delivered file', () => {
    for (const variant of ['positief', 'negatief', 'inkt', 'wit']) {
      const file = svg(`leernu-woordbeeld-${variant}.svg`);
      expect(file, variant).toContain(`viewBox="0 -${WOORDBEELD.top} ${WOORDBEELD.width} `);
      expect(file, variant).toContain(`d="${WOORDBEELD_LEER}"`);
      expect(file, variant).toContain(`d="${WOORDBEELD_NU}"`);
    }
    // The flat top of the n, which the clear space and the path behind the name use.
    expect(WOORDBEELD_NU).toContain(`V-${WOORDBEELD_X_HOOGTE}H`);
  });

  it('draws leer in ink and nu in the mark’s own colour', () => {
    // --inkt and --merk in index.css are the same two, which is why the
    // wordmark component can hand each word a token and get this drawing.
    const positief = svg('leernu-woordbeeld-positief.svg');
    expect(positief).toContain(`<path fill="#1B2230" d="${WOORDBEELD_LEER}"/>`);
    expect(positief).toContain(`<path fill="#385DB8" d="${WOORDBEELD_NU}"/>`);

    // Reversed out of ink the app draws both words in the light: the white variant.
    const wit = svg('leernu-woordbeeld-wit.svg');
    expect(wit).toContain(`<path fill="#FFFFFF" d="${WOORDBEELD_LEER}"/>`);
    expect(wit).toContain(`<path fill="#FFFFFF" d="${WOORDBEELD_NU}"/>`);
  });

  it('puts the mark’s colour under the favicon and the light on top of it', () => {
    const favicon = svg('favicon.svg');
    expect(favicon).toContain('fill="#385DB8"');
    expect(favicon).toContain('stroke="#FFFFFF"');
  });

  it('drops the needle below 20px, as the favicon of 16 does', () => {
    expect(MERK_NAALD_VANAF_PX).toBe(20);
    const favicon = svg('favicon.svg');
    expect(favicon).not.toContain('<path');
    expect(MERK_KLEIN.stroke).toBeGreaterThan(MERK.stroke);
  });
});
