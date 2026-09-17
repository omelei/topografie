import { describe, expect, it } from 'vitest';
import { dagplan, PLAN_RONDES, PLAN_RONDE_MAX, type PlanSet } from './dagplan';
import { emptyState, type Schedulable } from './leitner';
import type { ItemState } from './types';

/**
 * Het dagplan (ADR-126): wat er vandaag klaarstaat om te herhalen.
 */

const NU = new Date('2026-09-14T10:00:00Z');
const DAG = 86_400_000;

function item(id: string): Schedulable {
  return { id } as Schedulable;
}

/** Een onderdeel dat `dagen` geleden aan de beurt kwam. Negatief is nog niet. */
function stand(id: string, dagen: number): ItemState {
  return {
    ...emptyState(id),
    box: 2,
    laatsteReview: new Date(NU.getTime() - dagen * DAG).toISOString(),
    volgendeReview: new Date(NU.getTime() - dagen * DAG).toISOString(),
  };
}

function set(naam: string, ids: readonly string[]): PlanSet<string> {
  return { sleutel: naam, set: naam, items: ids.map(item) };
}

describe('dagplan', () => {
  it('is leeg zolang er niets geoefend is', () => {
    // Het geval dat het meest telt: een kind dat vandaag begint hoort geen plan
    // van duizend vragen te zien. Een lege Leitner-stand is per definitie
    // verlopen, dus zonder deze regel stond er alles in.
    const plan = dagplan([set('provincies', ['a', 'b', 'c'])], new Map(), NU);
    expect(plan.rondes).toEqual([]);
    expect(plan.vragen).toBe(0);
  });

  it('neemt alleen wat geoefend is én aan de beurt is', () => {
    const states = new Map([
      ['a', stand('a', 2)],
      ['b', stand('b', -3)],
    ]);
    const plan = dagplan([set('provincies', ['a', 'b', 'c'])], states, NU);

    expect(plan.vragen).toBe(1);
    expect(plan.rondes[0]?.ids).toEqual(['a']);
  });

  it('zet het langst verlopen onderdeel vooraan', () => {
    const states = new Map([
      ['a', stand('a', 1)],
      ['b', stand('b', 9)],
      ['c', stand('c', 4)],
    ]);
    const plan = dagplan([set('provincies', ['a', 'b', 'c'])], states, NU);
    expect(plan.rondes[0]?.ids).toEqual(['b', 'c', 'a']);
    expect(plan.rondes[0]?.wacht).toBe(9);
  });

  it('zet de set die het langst wacht bovenaan', () => {
    const states = new Map([
      ['p1', stand('p1', 1)],
      ['t1', stand('t1', 8)],
    ]);
    const plan = dagplan([set('provincies', ['p1']), set('tafels', ['t1'])], states, NU);
    expect(plan.rondes.map((ronde) => ronde.set)).toEqual(['tafels', 'provincies']);
  });

  it('houdt een plan een plan: hoogstens vier rondes, maar telt alles', () => {
    const states = new Map<string, ItemState>();
    const sets: PlanSet<string>[] = [];
    for (let nummer = 0; nummer < 6; nummer++) {
      const id = `s${nummer}`;
      states.set(id, stand(id, nummer));
      sets.push(set(`set${nummer}`, [id]));
    }

    const plan = dagplan(sets, states, NU);
    expect(plan.rondes).toHaveLength(PLAN_RONDES);
    // De teller gaat over alles wat klaarstaat, ook wat niet getoond wordt:
    // anders klopt "er staan 6 vragen klaar" niet met wat eronder staat.
    expect(plan.vragen).toBe(6);
  });

  it('maakt van één set nooit een oneindige ronde', () => {
    const states = new Map<string, ItemState>();
    const ids: string[] = [];
    for (let nummer = 0; nummer < 40; nummer++) {
      const id = `v${nummer}`;
      ids.push(id);
      states.set(id, stand(id, 1));
    }

    const plan = dagplan([set('vlaggen', ids)], states, NU);
    expect(plan.rondes[0]?.ids).toHaveLength(PLAN_RONDE_MAX);
    expect(plan.vragen).toBe(40);
  });
});

describe('dagplan met voorrang voor de groep (ADR-151)', () => {
  // Klok past bij deze groep (rang 0), provincies is voor later (rang 2).
  const rang = (naam: string) => (naam === 'provincies' ? 2 : 0);

  it('is zonder voorrang precies het plan van altijd', () => {
    const states = new Map([
      ['p1', stand('p1', 3)],
      ['p2', stand('p2', 3)],
      ['k1', stand('k1', 3)],
    ]);
    const sets = [set('provincies', ['p1', 'p2']), set('klok', ['k1'])];
    expect(dagplan(sets, states, NU)).toEqual(dagplan(sets, states, NU, () => 0));
    expect(dagplan(sets, states, NU).rondes.map((ronde) => ronde.set)).toEqual([
      'provincies',
      'klok',
    ]);
  });

  it('zet bij gelijk wachten wat bij de groep past eerst', () => {
    const states = new Map([
      ['p1', stand('p1', 3)],
      ['p2', stand('p2', 3)],
      ['k1', stand('k1', 3)],
    ]);
    const sets = [set('provincies', ['p1', 'p2']), set('klok', ['k1'])];
    const plan = dagplan(sets, states, NU, rang);
    expect(plan.rondes.map((ronde) => ronde.set)).toEqual(['klok', 'provincies']);
  });

  it('laat wat langer wacht voorgaan, ook als het niet bij de groep past', () => {
    // Het onthouden gaat voor het voorstel: een provincie die een week over
    // tijd is, is dichter bij vergeten dan een klok van vandaag.
    const states = new Map([
      ['p1', stand('p1', 7)],
      ['k1', stand('k1', 0)],
    ]);
    const sets = [set('provincies', ['p1']), set('klok', ['k1'])];
    const plan = dagplan(sets, states, NU, rang);
    expect(plan.rondes.map((ronde) => ronde.set)).toEqual(['provincies', 'klok']);
  });

  it('haalt niets weg: wat buiten de groep valt, telt en staat er nog', () => {
    const states = new Map([
      ['p1', stand('p1', 1)],
      ['k1', stand('k1', 1)],
    ]);
    const sets = [set('provincies', ['p1']), set('klok', ['k1'])];
    const plan = dagplan(sets, states, NU, rang);
    expect(plan.rondes).toHaveLength(2);
    expect(plan.vragen).toBe(2);
  });
});
