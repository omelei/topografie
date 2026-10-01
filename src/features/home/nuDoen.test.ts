import { describe, expect, it } from 'vitest';
import type { ModeId } from '@/game-core';
import type { Gespeeld, Onderdeel } from '@/features/module/onderdelen';
import type { OpenRound } from '@/store/progress';
import { halfAf, kiesNuDoen, verderOefenen, type NuDoenStand } from './nuDoen';

/**
 * Nu doen en Verder oefenen (ADR-250): welke kaart bovenaan Vandaag staat, en
 * dat elk onderwerp er daaronder één keer staat.
 */

const niets: NuDoenStand = {
  terug: false,
  herhalen: false,
  maakAf: false,
  check: false,
  verder: false,
};

describe('welke kaart Nu doen is', () => {
  it('is niets voor een kind dat nog niets deed', () => {
    expect(kiesNuDoen(niets)).toBeNull();
  });

  it('is verder met wat je het laatst deed als er niets anders is', () => {
    expect(kiesNuDoen({ ...niets, verder: true })).toBe('verder');
  });

  it('zet de geheugencheck voor verder, en achter een ronde die half af is', () => {
    expect(kiesNuDoen({ ...niets, check: true, verder: true })).toBe('check');
    expect(kiesNuDoen({ ...niets, maakAf: true, check: true, verder: true })).toBe('maakAf');
  });

  it('zet herhalen voor een ronde die half af is', () => {
    expect(kiesNuDoen({ ...niets, herhalen: true, maakAf: true, verder: true })).toBe('herhalen');
  });

  it('begint wie twee weken weg was met de ronde terug, voor alles', () => {
    const alles: NuDoenStand = {
      terug: true,
      herhalen: true,
      maakAf: true,
      check: true,
      verder: true,
    };
    expect(kiesNuDoen(alles)).toBe('terug');
  });

  // Welkom terug heeft "Later" (ADR-250): dan wordt de volgende Nu doen.
  it('valt na Later terug op de volgende in de rij', () => {
    expect(kiesNuDoen({ ...niets, terug: false, maakAf: true, verder: true })).toBe('maakAf');
  });
});

const deel = (setId: string): Onderdeel => ({
  moduleId: setId.startsWith('nl-') ? 'topo' : 'tafels',
  setId,
  naam: null,
  literalNaam: setId,
  kortNaam: null,
  mix: false,
  items: [],
  roundSize: 10,
});

const alles = ['nl-provincies', 'nl-steden', 'tafel-3', 'tafel-7'].map(deel);

const gespeeld = (setId: string, at: string, mode: ModeId = 'meerkeuze'): Gespeeld => ({
  deel: deel(setId),
  ronde: { mode, setId, itemIds: [], correct: 1, answered: 1, at },
});

const open = (setId: string | null, at: string): OpenRound => ({
  mode: 'meerkeuze',
  setId,
  itemIds: ['a', 'b', 'c'],
  rest: ['b', 'c'],
  beantwoord: 1,
  totaal: 3,
  at,
});

describe('Verder oefenen', () => {
  it('zet wat half af is vooraan, en daarna wat gespeeld is, het nieuwste eerst', () => {
    const rij = verderOefenen(
      [open('tafel-7', '2026-10-01T10:00:00Z')],
      [gespeeld('nl-steden', '2026-10-01T11:00:00Z'), gespeeld('tafel-3', '2026-09-30T11:00:00Z')],
      alles,
      null,
    );
    expect(rij.map((kaart) => [kaart.soort, kaart.deel.setId])).toEqual([
      ['half', 'tafel-7'],
      ['gespeeld', 'nl-steden'],
      ['gespeeld', 'tafel-3'],
    ]);
  });

  it('zet elk onderwerp er één keer in', () => {
    const rij = verderOefenen(
      [open('nl-provincies', '2026-10-01T10:00:00Z')],
      [
        gespeeld('nl-provincies', '2026-10-01T09:00:00Z'),
        gespeeld('nl-provincies', '2026-09-30T09:00:00Z', 'wijs-aan'),
        gespeeld('tafel-3', '2026-09-29T09:00:00Z'),
      ],
      alles,
      null,
    );
    expect(rij.map((kaart) => kaart.deel.setId)).toEqual(['nl-provincies', 'tafel-3']);
    expect(rij[0]?.soort).toBe('half');
  });

  it('laat het onderwerp van Nu doen weg', () => {
    const rij = verderOefenen(
      [],
      [
        gespeeld('nl-provincies', '2026-10-01T09:00:00Z'),
        gespeeld('tafel-3', '2026-09-29T09:00:00Z'),
      ],
      alles,
      'nl-provincies',
    );
    expect(rij.map((kaart) => kaart.deel.setId)).toEqual(['tafel-3']);
  });

  it('slaat een ronde over die bij geen onderwerp hoort', () => {
    const rij = verderOefenen([open(null, '2026-10-01T10:00:00Z')], [], alles, null);
    expect(rij).toEqual([]);
  });

  it('houdt op bij het maximum', () => {
    const veel = alles.map((onderdeel, plek) =>
      gespeeld(onderdeel.setId, `2026-09-2${plek}T09:00:00Z`),
    );
    expect(verderOefenen([], veel, alles, null, 2)).toHaveLength(2);
  });
});

describe('de ronde die half af is', () => {
  it('is de nieuwste die bij een onderwerp hoort', () => {
    const gevonden = halfAf(
      [open(null, '2026-10-01T12:00:00Z'), open('tafel-3', '2026-10-01T10:00:00Z')],
      alles,
    );
    expect(gevonden?.deel.setId).toBe('tafel-3');
  });

  it('is er niet als niets half af is', () => {
    expect(halfAf([], alles)).toBeNull();
  });
});
