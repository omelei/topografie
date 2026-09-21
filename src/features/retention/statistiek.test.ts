import { describe, expect, it } from 'vitest';
import { emptyState, review, type ItemState } from '@/game-core';
import { geheugen, geoefend, perDag, perVak, perWeek, procentGoedVan } from './statistiek';

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

  it('telt over een leeg apparaat nul, en niet niets', () => {
    // De voorspelling over drie weken stond hier en is weg (ADR-177): op Jij
    // was hij een percentage als kop, en dat is een model met een gekozen
    // constante, gepresenteerd als feit — en stof van groep 7 op een pagina
    // die bij zes begint. Wat blijft is wat geteld is.
    expect(geheugen(new Map(), NU)).toEqual({ onthouden: 0, opfrissen: 0, oefenen: 0 });
    expect(geoefend(geheugen(standen(emptyState('a')), NU))).toBe(0);
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

/**
 * De strook van zeven dagen onder "Hoe vaak oefen je?" (ADR-177).
 *
 * Wat hier bewezen wordt is het venster en de volgorde, want dat is waar de
 * oude kop de plank missloeg: er stond "Deze week" boven een telling van de
 * laatste zeven dagen, wat op woensdag bij vorige week donderdag begint.
 */
describe('de laatste zeven dagen', () => {
  const WOENSDAG = new Date('2026-09-16T15:00:00');

  it('geeft er zeven, met vandaag als laatste', () => {
    const dagen = perDag([], WOENSDAG);
    expect(dagen).toHaveLength(7);
    expect(dagen.at(-1)?.vandaag).toBe(true);
    expect(dagen.filter((dag) => dag.vandaag)).toHaveLength(1);
  });

  it('begint zes dagen terug en niet op maandag', () => {
    // De hele reden dat de kop veranderde: dit venster is rollend.
    expect(perDag([], WOENSDAG).at(0)?.sleutel).toBe('2026-09-10');
    expect(perDag([], WOENSDAG).at(-1)?.sleutel).toBe('2026-09-16');
  });

  it('telt de rondes van een dag bij elkaar op', () => {
    const rondes = [
      { at: '2026-09-16T09:00:00' },
      { at: '2026-09-16T18:00:00' },
      { at: '2026-09-14T09:00:00' },
    ];
    const per = new Map(perDag(rondes, WOENSDAG).map((dag) => [dag.sleutel, dag.rondes]));
    expect(per.get('2026-09-16')).toBe(2);
    expect(per.get('2026-09-14')).toBe(1);
    expect(per.get('2026-09-15')).toBe(0);
  });

  it('laat een ronde van buiten het venster buiten', () => {
    const dagen = perDag([{ at: '2026-09-09T09:00:00' }], WOENSDAG);
    expect(dagen.reduce((som, dag) => som + dag.rondes, 0)).toBe(0);
  });

  it('geeft elke dag een naam om te tonen en een om voor te lezen', () => {
    const dag = perDag([], WOENSDAG).at(-1);
    expect(dag?.kort).toBe('wo');
    expect(dag?.voluit).toContain('woensdag');
  });
});
