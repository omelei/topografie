import { describe, expect, it } from 'vitest';
import type { ItemState } from '@/game-core';
import { doelwitten } from '@/features/home/doel';
import { onderdelen, startbareOnderdelen } from '@/features/module/onderdelen';
import { rijpVoorDiploma } from './rijp';

/**
 * De lat van ADR-141 moet te halen zijn voor élk diploma dat de kast toont.
 *
 * `kast.test.ts` schrijft de valkuil uit: `onderdelen()` kent maar twee
 * vlaggensets, dus wie daarop zoekt vindt de zes werelddelen niet. Deze lat
 * stond op die lijst, en dat was stil: een kind dat de vlaggen van Europa
 * kende, kreeg aan het eind van een ronde nooit te horen dat het diploma
 * openstond. Er ging niets stuk — er gebeurde alleen niets.
 */
describe('rijp voor een diploma', () => {
  /** Alles onthouden: doos vier, net nagekeken, niets over tijd. */
  function alGeleerd(ids: readonly string[]): Map<string, ItemState> {
    const nu = new Date().toISOString();
    return new Map(
      ids.map((id) => [
        id,
        {
          itemId: id,
          box: 4,
          laatsteReview: nu,
          volgendeReview: nu,
          goedCount: 4,
          foutCount: 0,
        } satisfies ItemState,
      ]),
    );
  }

  /** Elk diploma dat `onderdelen()` niet kan vinden: de zes werelddelen. */
  function buitenDeSmalleLijst() {
    const smal = new Set(onderdelen().map((deel) => deel.setId));
    return doelwitten(startbareOnderdelen(), true).filter(
      (doelwit) => !smal.has(doelwit.deel.setId),
    );
  }

  it('gaat over diploma’s die `onderdelen()` niet kent', () => {
    // Zonder dit verschil toetst de rest van dit bestand niets.
    expect(buitenDeSmalleLijst().length).toBeGreaterThan(0);
  });

  it('zegt ja voor elk van hen zodra de set onthouden is', () => {
    for (const doelwit of buitenDeSmalleLijst()) {
      const states = alGeleerd(doelwit.deel.items.map((item) => item.id));
      expect(rijpVoorDiploma(doelwit.deel.setId, states, new Date()), doelwit.id).toBe(true);
    }
  });

  it('zegt nee zolang er nog niets onthouden is', () => {
    const doelwit = buitenDeSmalleLijst()[0];
    expect(doelwit).toBeDefined();
    if (!doelwit) return;
    expect(rijpVoorDiploma(doelwit.deel.setId, new Map(), new Date())).toBe(false);
  });

  it('zegt nee voor een set zonder diploma', () => {
    expect(rijpVoorDiploma('bestaat-niet', new Map(), new Date())).toBe(false);
  });
});
