import { describe, expect, it } from 'vitest';
import { emptyState, type ItemState } from '@/game-core';
import { toetsOnderdelen } from './toetsZicht';
import type { Onderdeel } from '@/features/module/onderdelen';

/** Een set, zo klein als deze functie hem nodig heeft. */
function deel(setId: string, moduleId: string, ids: readonly string[], mix = false): Onderdeel {
  return {
    moduleId,
    setId,
    naam: null,
    literalNaam: setId,
    kortNaam: null,
    mix,
    items: ids.map((id) => ({ id })),
    roundSize: 10,
  } as unknown as Onderdeel;
}

function standen(...ids: readonly string[]): Map<string, ItemState> {
  return new Map(ids.map((id) => [id, emptyState(id)]));
}

describe('waar een toets over gaat', () => {
  const alles = [
    deel('provincies', 'topo', ['p1', 'p2']),
    deel('steden', 'topo', ['s1']),
    deel('nl-mix', 'topo', ['p1', 'p2', 's1'], true),
    deel('nl-fouten', 'topo', ['p1']),
    deel('tafel-2', 'tafels', ['t1']),
  ];

  it('is leeg zonder vak', () => {
    expect(toetsOnderdelen(null, alles, standen('p1'))).toEqual([]);
  });

  it('neemt alleen wat van dat vak is en al geoefend', () => {
    expect([...toetsOnderdelen('topo', alles, standen('p1', 's1', 't1'))].sort()).toEqual([
      'p1',
      's1',
    ]);
  });

  it('telt een onderdeel nooit twee keer via de mix', () => {
    const ids = toetsOnderdelen('topo', alles, standen('p1', 'p2', 's1'));
    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(3);
  });

  it('laat de foutenlijst erbuiten, want dat is een doorsnede en geen set', () => {
    // p1 zit ook in nl-fouten; zonder die regel zou hij dubbel wegen zodra de
    // mix er niet meer was om het te verbergen.
    const enkel = [deel('nl-fouten', 'topo', ['p1'])];
    expect(toetsOnderdelen('topo', enkel, standen('p1'))).toEqual([]);
  });

  it('negeert wat nog nooit geoefend is', () => {
    expect(toetsOnderdelen('topo', alles, new Map())).toEqual([]);
  });
});
