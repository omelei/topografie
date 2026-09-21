import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AVATARS, avatarVan } from '@/features/player/avatars';
import { nl } from '@/i18n/nl';

/**
 * De avatars, als regel in plaats van als tekening (ADR-177).
 *
 * Dit is de tijdelijke set: de eigenaar levert de echte later aan, en dan
 * verandert `avatars.tsx` en niets anders. Wat hier bewaakt wordt is precies
 * wat bij die ruil mis kan gaan.
 *
 * **De ids zijn de bewaarde waarde.** Ze staan in `avatarConfig.avatar` op het
 * profiel van een kind. Een id dat verdwijnt of van betekenis wisselt, geeft
 * een kind dat allang gekozen had een andere avatar — of geen.
 *
 * Wat dit niet kan toetsen, is of de tekening klopt. Daar zijn de
 * schermafdrukken van `screens.spec.ts` voor, en een paar ogen.
 */
const bron = readFileSync(join(process.cwd(), 'src', 'features', 'player', 'avatars.tsx'), 'utf8');

describe('de avatars', () => {
  it('heeft er acht, met ids die de vorm beschrijven en niet de volgorde', () => {
    expect(AVATARS).toHaveLength(8);
    // Geen `avatar-3`: dat wordt bij de eerste herschikking de verkeerde
    // tekening voor een kind dat allang gekozen had.
    for (const avatar of AVATARS) expect(avatar.id).not.toMatch(/\d/);
  });

  it('geeft elke avatar een eigen id en een eigen naam', () => {
    expect(new Set(AVATARS.map((avatar) => avatar.id)).size).toBe(AVATARS.length);
    const namen = AVATARS.map((avatar) => nl[avatar.naam]);
    expect(new Set(namen).size).toBe(AVATARS.length);
  });

  it('vindt een bewaarde keuze terug, en valt anders netjes om', () => {
    expect(avatarVan('raket')?.id).toBe('raket');
    // Een id uit een oudere bouw, of geen keuze: allebei de voorletter.
    expect(avatarVan('bestaat-niet')).toBeNull();
    expect(avatarVan(undefined)).toBeNull();
  });

  it('tekent ze op hetzelfde raster als de pictogrammen', () => {
    // Ze betekenen niets — dat is het verschil met styleguide §E — maar ze
    // staan er wel naast, en een eigen <svg> zou een eigen streekdikte en een
    // eigen raster meebrengen.
    expect(bron).not.toContain('<svg');
    expect(bron.match(/<Icon \{\.\.\.props\}>/g)).toHaveLength(AVATARS.length);

    for (const match of bron.matchAll(/(?:cx|cy|r|x|y|width|height)="(-?[\d.]+)"/g)) {
      const waarde = Number(match[1]);
      expect(waarde, match[0]).toBeGreaterThanOrEqual(0);
      expect(waarde, match[0]).toBeLessThanOrEqual(24);
    }
  });

  it('laat geen avatar een eigen kleur dragen', () => {
    // Het palet is bezet: groen zegt "goed", gearceerd rood zegt "fout",
    // koraal is het merk en de zes vakkleuren zeggen welk vak je voor je hebt
    // (ADR-159). Avatars verschillen daarom in vorm en niet in kleur — wat ze
    // ook leesbaar houdt voor een kind dat kleuren niet onderscheidt.
    for (const match of bron.matchAll(/fill="([^"]*)"/g)) {
      expect(['none', 'currentColor'], match[0]).toContain(match[1]);
    }
    expect(bron).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(bron).not.toMatch(/\b(?:rgb|hsl|oklch)\(/);
  });

  it('geeft elke silhouet een eigen tekening', () => {
    const paden = [...bron.matchAll(/ d="([^"]+)"/g)].map((match) => match[1]);
    expect(new Set(paden).size, 'twee avatars delen een pad').toBe(paden.length);
  });
});
