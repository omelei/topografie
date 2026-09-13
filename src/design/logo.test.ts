import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LOCKUP, LOCKUP_GLYPHS, LOCKUP_MERK, MERK, MERK_KLEIN, MERK_NAALD_VANAF_PX } from './logo';

const svg = (name: string) =>
  readFileSync(join(process.cwd(), 'docs', 'logo', 'svg', name), 'utf8');

/**
 * The logo, checked against the files in docs/logo rather than against itself
 * (ADR-113).
 *
 * The beeldmerk and the app icon are the designer's own SVGs. The wordmark was
 * delivered as a picture only, so tools/logo/maak-logo.py cuts it to outlines
 * from the font in the designer's uitwerking and writes both
 * woordbeeld-inkt.svg and logo.ts. If one of these fails, either a file in
 * docs/logo changed and the script has to run again, or logo.ts was edited by
 * hand — and the logo is the one thing nobody should be retouching in a code
 * review.
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

  it('copies the wordmark path for path from its outlined file', () => {
    const file = svg('woordbeeld-inkt.svg');
    expect(file).toContain(`viewBox="0 0 ${LOCKUP.width} `);
    // l, e, e, r, n, u.
    expect(LOCKUP_GLYPHS).toHaveLength(6);
    for (const d of LOCKUP_GLYPHS) expect(file).toContain(`<path d="${d}"/>`);
    expect(file).toContain(
      `<circle cx="${LOCKUP_MERK.cx}" cy="${LOCKUP_MERK.cy}" r="${LOCKUP_MERK.r}"`,
    );
    expect(file).toContain(`stroke-width="${LOCKUP_MERK.stroke}"`);
    expect(file).toContain(`<path d="${LOCKUP_MERK.naald}"/>`);
  });

  it('keeps the ring between the words in the proportions of the mark on its own', () => {
    // The same drawing at another size: ring to stroke as 38 to 13.
    expect(LOCKUP_MERK.r / LOCKUP_MERK.stroke).toBeCloseTo(MERK.r / MERK.stroke, 1);
    // And it stands inside the box, off the baseline, as the uitwerking lifts it.
    expect(LOCKUP_MERK.cy + LOCKUP_MERK.r + LOCKUP_MERK.stroke / 2).toBeLessThan(LOCKUP.height);
  });

  it('drops the needle below 20px, as the favicon of 16 does', () => {
    expect(MERK_NAALD_VANAF_PX).toBe(20);
    const favicon = svg('favicon.svg');
    expect(favicon).not.toContain('<path');
    expect(MERK_KLEIN.stroke).toBeGreaterThan(MERK.stroke);
  });
});
