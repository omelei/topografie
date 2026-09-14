import { describe, expect, it } from 'vitest';
import { weekbericht } from './weekbericht';
import type { ItemState } from '@/game-core';

/** Maandag 14 september 2026, tien uur 's ochtends. */
const now = new Date('2026-09-14T10:00:00');

function state(volgendeReview: string | null): ItemState {
  return {
    itemId: 'x',
    box: 2,
    laatsteReview: '2026-09-01T10:00:00.000Z',
    volgendeReview,
    goedCount: 0,
    foutCount: 0,
  };
}

function setMet(naam: string, ids: readonly string[]) {
  return { set: naam, items: ids.map((id) => ({ id })) };
}

describe('het weekbericht', () => {
  it('zegt niets over een week waarin niets gebeurde', () => {
    const uit = weekbericht({
      afgemaakt: [],
      sets: [],
      states: new Map(),
      onthouden: null,
      now,
    });
    expect(uit.geoefend).toBe(0);
    expect(uit.rondes).toBe(0);
    expect(uit.wankelt).toBeNull();
  });

  /**
   * Tegen schooldagen afgezet en niet tegen zeven dagen: een weekend is geen dag
   * waarop een kind iets naliet. Zeven dagen terug vanaf maandag 14 september
   * bevat één zaterdag en één zondag, dus vijf schooldagen.
   */
  it('rekent tegen schooldagen en niet tegen zeven dagen', () => {
    const uit = weekbericht({
      afgemaakt: [],
      sets: [],
      states: new Map(),
      onthouden: null,
      now,
    });
    expect(uit.schooldagen).toBe(5);
  });

  it('telt een dag één keer, hoeveel rondes er ook op staan', () => {
    const uit = weekbericht({
      afgemaakt: ['2026-09-14T08:00:00', '2026-09-14T18:00:00', '2026-09-11T08:00:00'],
      sets: [],
      states: new Map(),
      onthouden: null,
      now,
    });
    expect(uit.geoefend).toBe(2);
    expect(uit.rondes).toBe(3);
  });

  it('laat rondes van vorige week buiten de week', () => {
    const uit = weekbericht({
      afgemaakt: ['2026-09-14T08:00:00', '2026-09-01T08:00:00'],
      sets: [],
      states: new Map(),
      onthouden: null,
      now,
    });
    expect(uit.rondes).toBe(1);
  });

  /** Werk doen telt altijd, ook op zaterdag — alleen het nalaten wordt op een schooldag geteld. */
  it('telt een zaterdag mee als er geoefend is', () => {
    const uit = weekbericht({
      afgemaakt: ['2026-09-12T10:00:00'],
      sets: [],
      states: new Map(),
      onthouden: null,
      now,
    });
    expect(uit.geoefend).toBe(1);
    expect(uit.schooldagen).toBe(5);
  });

  it('wijst de set aan die het langst over tijd is', () => {
    const states = new Map<string, ItemState>([
      ['a1', state('2026-09-12T10:00:00')],
      ['a2', state('2026-09-12T10:00:00')],
      ['b1', state('2026-09-05T10:00:00')],
    ]);

    const uit = weekbericht({
      afgemaakt: [],
      sets: [setMet('Tafel van 3', ['a1', 'a2']), setMet('Tafel van 7', ['b1'])],
      states,
      onthouden: null,
      now,
    });

    expect(uit.wankelt?.set).toBe('Tafel van 7');
    expect(uit.wankelt?.wacht).toBe(9);
    expect(uit.wankelt?.aantal).toBe(1);
  });

  it('noemt niets dat nog niet aan de beurt is', () => {
    const states = new Map<string, ItemState>([['a1', state('2026-12-01T10:00:00')]]);
    const uit = weekbericht({
      afgemaakt: [],
      sets: [setMet('Tafel van 3', ['a1'])],
      states,
      onthouden: null,
      now,
    });
    expect(uit.wankelt).toBeNull();
  });

  it('negeert een onderdeel dat nooit gezien is', () => {
    const uit = weekbericht({
      afgemaakt: [],
      sets: [setMet('Tafel van 3', ['nooit'])],
      states: new Map(),
      onthouden: null,
      now,
    });
    expect(uit.wankelt).toBeNull();
  });
});
