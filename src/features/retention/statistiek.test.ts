import { describe, expect, it } from 'vitest';
import { emptyState, review, type ItemState } from '@/game-core';
import { geheugen, geoefend, perVak, perWeek, procentGoedVan } from './statistiek';

const FROM = new Date('2026-09-01T10:00:00');
const DAY = 86_400_000;

/** Right `times` times, each a month apart: box four from the third. */
function goed(id: string, times: number): ItemState {
  let state = emptyState(id);
  for (let n = 0; n < times; n++) {
    state = review(state, true, new Date(FROM.getTime() + n * DAY * 30));
  }
  return state;
}

/** Just after the third answer, so nothing has gone stale yet. */
const NU = new Date(FROM.getTime() + 2 * DAY * 30 + 60_000);

function standen(...states: ItemState[]): Map<string, ItemState> {
  return new Map(states.map((state) => [state.itemId, state]));
}

describe('het geheugen over alles', () => {
  it('telt onthouden en nog aan het oefenen, en laat nooit geoefend weg', () => {
    const states = standen(goed('a', 3), goed('b', 3), goed('c', 1), emptyState('d'));
    const stand = geheugen(states, NU);

    expect(stand.onthouden).toBe(2);
    expect(stand.oefenen).toBe(1);
    expect(stand.opfrissen).toBe(0);
    expect(geoefend(stand)).toBe(3);
  });

  it('noemt wat lang niet gezien is even opfrissen', () => {
    const states = standen(goed('a', 3));
    const lang = new Date(NU.getTime() + 200 * DAY);
    expect(geheugen(states, lang).opfrissen).toBe(1);
  });

  it('voorspelt niets zolang er niets geoefend is', () => {
    expect(geheugen(new Map(), NU).overDrieWeken).toBeNull();
    expect(geheugen(standen(emptyState('a')), NU).overDrieWeken).toBeNull();
  });

  it('voorspelt over drie weken een getal tussen nul en honderd', () => {
    const procent = geheugen(standen(goed('a', 3), goed('b', 1)), NU).overDrieWeken;
    expect(procent).toBeGreaterThan(0);
    expect(procent).toBeLessThan(100);
  });
});

describe('per vak', () => {
  it('telt een onderdeel dat in twee sets staat één keer', () => {
    const sets = [
      { moduleId: 'topo', items: [{ id: 'a' }, { id: 'b' }] },
      { moduleId: 'topo', items: [{ id: 'b' }, { id: 'c' }] },
      { moduleId: 'klok', items: [{ id: 'k' }] },
    ];
    const vakken = perVak(sets, standen(goed('a', 3), goed('b', 1)), NU);

    expect(vakken.map((vak) => vak.moduleId)).toEqual(['topo', 'klok']);
    expect(vakken[0]).toEqual({
      moduleId: 'topo',
      totaal: 3,
      onthouden: 1,
      opfrissen: 0,
      oefenen: 1,
    });
    expect(vakken[1]?.totaal).toBe(1);
    expect(geoefend(vakken[1] ?? { onthouden: 9, opfrissen: 9, oefenen: 9 })).toBe(0);
  });
});

describe('week na week', () => {
  // Woensdag 16 september 2026, in week 38.
  const woensdag = new Date(2026, 8, 16, 12);

  it('eindigt op deze week en laat lege weken staan', () => {
    const weken = perWeek(
      [
        { tijdstip: new Date(2026, 8, 14, 9).toISOString(), correct: true },
        { tijdstip: new Date(2026, 8, 16, 9).toISOString(), correct: false },
        { tijdstip: new Date(2026, 8, 3, 9).toISOString(), correct: true },
      ],
      woensdag,
      4,
    );

    expect(weken.map((week) => week.nummer)).toEqual([35, 36, 37, 38]);
    expect(weken.map((week) => week.deze)).toEqual([false, false, false, true]);
    expect(weken[3]).toMatchObject({ goed: 1, fout: 1 });
    expect(weken[2]).toMatchObject({ goed: 0, fout: 0 });
    expect(weken[1]).toMatchObject({ goed: 1, fout: 0 });
  });

  it('rekent een antwoord op zondagavond nog tot die week', () => {
    const weken = perWeek(
      [{ tijdstip: new Date(2026, 8, 13, 23, 30).toISOString(), correct: true }],
      woensdag,
      2,
    );
    expect(weken[0]).toMatchObject({ nummer: 37, goed: 1 });
    expect(weken[1]).toMatchObject({ nummer: 38, goed: 0 });
  });

  it('geeft het deel goed als heel percentage, en niets zonder antwoorden', () => {
    expect(procentGoedVan([])).toBeNull();
    expect(
      procentGoedVan([
        { tijdstip: '', correct: true },
        { tijdstip: '', correct: true },
        { tijdstip: '', correct: false },
      ]),
    ).toBe(67);
  });
});
