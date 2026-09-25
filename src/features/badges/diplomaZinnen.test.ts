import { describe, expect, it } from 'vitest';
import { doelwitten } from '@/features/home/doel';
import { startbareOnderdelen } from '@/features/module/onderdelen';
import { t } from '@/i18n';
import { DIPLOMA_ZIN } from './diplomaZinnen';

/** Elk diploma zegt wat je kunt als je hem haalt (ADR-219). */
describe('de zin op het diploma', () => {
  const sets = doelwitten(startbareOnderdelen(), true).map((doelwit) => doelwit.deel.setId);

  it('staat er voor elk diploma, en voor niets anders', () => {
    expect(Object.keys(DIPLOMA_ZIN).sort()).toEqual([...sets].sort());
  });

  it('begint met "Je" en is kort, zoals de schrijfwijzer vraagt', () => {
    for (const set of sets) {
      const sleutel = DIPLOMA_ZIN[set];
      expect(sleutel, set).toBeDefined();
      const zin = t(sleutel!);
      expect(zin.startsWith('Je '), set).toBe(true);
      expect(zin.split(' ').length, set).toBeLessThanOrEqual(14);
    }
  });
});
