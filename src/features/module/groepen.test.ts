import { describe, expect, it } from 'vitest';
import { GROEPEN, type Schedulable } from '@/game-core';
import { indelingVanOnderwerp, indelingVoor, voorrangVoor } from './groepen';
import type { Onderdeel, Onderwerp } from './onderdelen';

/**
 * Wat past, zoals de schermen het vragen (ADR-151): een set of een onderwerp,
 * en de groep van het kind. De content is hier echt — de koppeltabel en de
 * leerdoelen — en de sets zijn nagemaakt, zodat dit zonder loaders draait.
 */

function deel(setId: string, items: readonly object[] = [], mix = false): Onderdeel {
  return {
    moduleId: 'tafels',
    setId,
    naam: null,
    literalNaam: setId,
    kortNaam: null,
    mix,
    items: items as readonly Schedulable[],
    roundSize: 10,
  };
}

function vak(id: string, sets: readonly Onderdeel[]): Onderwerp {
  return { moduleId: 'tafels', id, naam: 'onderwerp.keer', uitleg: null, keuze: null, regio: null, sets };
}

describe('indelingVoor', () => {
  it('leest een set uit de koppeltabel', () => {
    expect(indelingVoor(deel('plus-20'), 3)).toBe('nu');
    expect(indelingVoor(deel('plus-20'), 6)).toBe('herhaling');
    expect(indelingVoor(deel('keer-1000'), 5)).toBe('later');
  });

  it('leest een set van Taal uit de groep van zijn woorden', () => {
    const gch = deel('taal-sp-gch', [{ id: 'a', groep: 7 }, { id: 'b', groep: 7 }]);
    expect(indelingVoor(gch, 7)).toBe('nu');
    expect(indelingVoor(gch, 5)).toBe('later');
  });

  it('leest een set van topografie uit de leerdoelen van zijn plaatsen', () => {
    const provincies = deel('nl-provincies', [{ id: 'a', leerdoelen: ['ak-nl-provincies-aanwijzen'] }]);
    expect(indelingVoor(provincies, 6)).toBe('nu');
    expect(indelingVoor(provincies, 4)).toBe('later');
    expect(indelingVoor(provincies, 8)).toBe('herhaling');
  });

  it('is zonder groep voor elke set neutraal', () => {
    for (const setId of ['plus-20', 'keer-1000', 'klok-vijf', 'vlag-europa-bekend']) {
      expect(indelingVoor(deel(setId), undefined)).toBe('neutraal');
    }
  });

  it('is voor content zonder metadata neutraal, in elke groep', () => {
    const eigen = deel('taal-eigen-1', [{ id: 'fiets', woord: 'fiets' }]);
    const mix = deel('rekenmix', [], true);
    const fouten = deel('nl-fouten', [{ id: 'a', leerdoelen: ['ak-nl-provincies-aanwijzen'] }]);
    for (const groep of GROEPEN) {
      expect(indelingVoor(eigen, groep)).toBe('neutraal');
      expect(indelingVoor(mix, groep)).toBe('neutraal');
      expect(indelingVoor(fouten, groep)).toBe('neutraal');
    }
  });
});

describe('indelingVanOnderwerp', () => {
  const keer = vak('keer', [deel('keer-10', [], true), deel('keer-100'), deel('keer-1000')]);

  it('past zoals zijn best passende set', () => {
    expect(indelingVanOnderwerp(keer, 6)).toBe('nu');
    expect(indelingVanOnderwerp(keer, 8)).toBe('nu');
    expect(indelingVanOnderwerp(keer, 3)).toBe('later');
    expect(indelingVanOnderwerp(keer, undefined)).toBe('neutraal');
  });
});

describe('voorrangVoor', () => {
  it('geeft zonder groep elke set dezelfde rang', () => {
    const rang = voorrangVoor(undefined);
    expect(new Set(['plus-20', 'keer-1000', 'klok-heel'].map((id) => rang(deel(id))))).toEqual(
      new Set([0]),
    );
  });

  it('geeft met een groep wat past de laagste rang', () => {
    const rang = voorrangVoor(4);
    expect(rang(deel('plus-20'))).toBeLessThan(rang(deel('plus-1000')));
  });
});
