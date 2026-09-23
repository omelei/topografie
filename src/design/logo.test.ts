import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { UITDRUKKINGEN } from '@/components/Brandmark';

const ROOT = process.cwd();
const lees = (...pad: string[]) => readFileSync(join(ROOT, ...pad));

/**
 * The logo is Denker, as delivered in docs/logo (ADR-154) — since ADR-182
 * the delivery v2 that tools/merk-uit-leer.mjs draws from docs/leer.js.
 *
 * The app serves copies of the designer's files from public. If one of these
 * fails, either a new delivery went into docs/logo and has to be copied over
 * again, or a copy was edited by hand — and the logo is the one thing nobody
 * should be retouching in a code review.
 */
describe('the logo is the one in docs/logo', () => {
  it('serves the app icons exactly as delivered', () => {
    for (const naam of readdirSync(join(ROOT, 'docs', 'logo', 'app-icoon'))) {
      expect(lees('public', naam).equals(lees('docs', 'logo', 'app-icoon', naam)), naam).toBe(true);
    }
  });

  it('serves the logos and Denker exactly as delivered', () => {
    for (const naam of readdirSync(join(ROOT, 'docs', 'logo', 'logo'))) {
      const kopie = lees('public', 'logo', naam);
      expect(kopie.equals(lees('docs', 'logo', 'logo', naam)), naam).toBe(true);
    }
    const uitdrukkingen = join('docs', 'logo', 'beeldmerk', 'uitdrukkingen');
    for (const naam of readdirSync(join(ROOT, uitdrukkingen))) {
      const kopie = lees('src', 'assets', 'denker', naam);
      expect(kopie.equals(lees(uitdrukkingen, naam)), naam).toBe(true);
    }
  });

  it('draws every expression the delivery has, and no other', () => {
    // Each in two drawings: the whole Denker, and the simple one below 36px.
    const namen = readdirSync(join(ROOT, 'docs', 'logo', 'beeldmerk', 'uitdrukkingen')).sort();
    const verwacht = UITDRUKKINGEN.flatMap((uitdrukking) => [
      `denker-${uitdrukking}-klein.svg`,
      `denker-${uitdrukking}.svg`,
    ]).sort();
    expect(namen).toEqual(verwacht);
  });

  it('keeps the colours of the delivery', () => {
    // Prettier writes the hexes in lower case; the delivery has them in upper.
    const css = (...pad: string[]) =>
      lees(...pad)
        .toString('utf8')
        .toLowerCase();
    expect(css('src', 'design', 'kleuren.css')).toBe(css('docs', 'logo', 'code', 'kleuren.css'));
  });

  it('points the page head only at files that exist', () => {
    const pages = ['index.html', 'public/kopen/index.html', 'public/kopen/klaar/index.html'];
    for (const page of pages) {
      const html = lees(page).toString('utf8');
      const links = /<link rel="(?:icon|apple-touch-icon|manifest)" href="([^"]+)"/g;
      const hrefs = [...html.matchAll(links)].map((match) => match[1] ?? '');
      expect(hrefs.length, page).toBeGreaterThan(0);
      for (const href of hrefs) expect(existsSync(join(ROOT, 'public', href)), href).toBe(true);
    }
    const manifest = JSON.parse(lees('public', 'site.webmanifest').toString('utf8')) as {
      icons: { src: string }[];
    };
    for (const { src } of manifest.icons) {
      expect(existsSync(join(ROOT, 'public', src)), src).toBe(true);
    }
  });
});
