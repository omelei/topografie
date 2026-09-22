import { existsSync, readFileSync } from 'node:fs';
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

  it('tekent elke avatar met het geleverde bestand', () => {
    // De set uit de Merk en stijlgids (ADR-182), door tools/merk-uit-leer.mjs
    // in public/avatars gezet. Een id zonder bestand is een lege cirkel in de
    // balk van een kind dat allang gekozen had.
    for (const avatar of AVATARS) {
      const pad = join(process.cwd(), 'public', 'avatars', `${avatar.id}.svg`);
      expect(existsSync(pad), avatar.id).toBe(true);
      expect(readFileSync(pad, 'utf8'), avatar.id).toMatch(/^<svg [^>]*viewBox="0 0 100 100"/);
    }
    expect(bron).toContain('/avatars/${id}.svg');
  });
});
