import { describe, expect, it } from 'vitest';
import type { PlanSet } from './dagplan';
import { emptyState, type Schedulable } from './leitner';
import type { ItemState } from './types';
import { weekOverzicht } from './weekoverzicht';

/** Wat het dagplan deze week stil deed (ADR-227). */

// Een donderdag. De week begon maandag 21 september.
const NU = new Date(2026, 8, 24, 16, 0);

function op(dag: number, uur = 12): string {
  return new Date(2026, 8, dag, uur).toISOString();
}

function stand(id: string, laatst: string | null, volgende: string | null): ItemState {
  return { ...emptyState(id), box: 2, laatsteReview: laatst, volgendeReview: volgende };
}

function set(ids: readonly string[]): PlanSet<string> {
  return { sleutel: 's', set: 's', items: ids.map((id) => ({ id }) as Schedulable) };
}

describe('het weekoverzicht', () => {
  it('telt de onderdelen die sinds maandag geoefend zijn, elk één keer', () => {
    const states = new Map([
      ['a', stand('a', op(21, 0), op(22))],
      ['b', stand('b', op(24), op(25))],
      ['c', stand('c', op(20, 23), op(28))],
    ]);
    expect(weekOverzicht([set(['a', 'b', 'c'])], states, NU).geoefend).toBe(2);
  });

  it('noemt de eerstvolgende twee dagen, en wat over tijd is staat vandaag klaar', () => {
    const states = new Map([
      ['a', stand('a', op(21), op(22))],
      ['b', stand('b', op(24), op(29))],
      ['c', stand('c', op(24), op(27))],
      ['d', stand('d', op(24), op(27, 18))],
    ]);
    expect(weekOverzicht([set(['a', 'b', 'c', 'd'])], states, NU).herhaaldagen).toEqual([
      '2026-09-24',
      '2026-09-27',
    ]);
  });

  it('gaat alleen over wat het plan plant, en niet over wat nooit geoefend is', () => {
    const states = new Map([
      ['a', stand('a', op(24), op(25))],
      ['buiten', stand('buiten', op(24), op(24))],
      ['nieuw', stand('nieuw', null, null)],
    ]);
    expect(weekOverzicht([set(['a', 'nieuw'])], states, NU)).toEqual({
      geoefend: 1,
      herhaaldagen: ['2026-09-25'],
    });
  });

  it('begint op maandag opnieuw', () => {
    const maandag = new Date(2026, 8, 28, 9);
    const states = new Map([['a', stand('a', op(27), op(30))]]);
    expect(weekOverzicht([set(['a'])], states, maandag).geoefend).toBe(0);
  });
});
