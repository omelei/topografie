import { describe, expect, it } from 'vitest';
import {
  meestGeoefend,
  onderdelen,
  onderwerpenVan,
  POPULAR_SHOWN,
  starters,
  startbareOnderdelen,
  voorGroep,
  type Gespeeld,
  type Onderdeel,
} from './onderdelen';
import { GROEPEN, type ModeId } from '@/game-core';
import { groepenVan, indelingVoor } from './groepen';
import { TOPO_REGIOS } from './regios';

/**
 * The two things on the front door that are worked out rather than read.
 *
 * "Meest geoefend" is a count over this device's own history (ADR-082), and it
 * is the one block on the screen where getting the arithmetic wrong would put a
 * number in front of a child that is not true about them. So the arithmetic is
 * tested here rather than through the browser: which sets come first, how many
 * times each was played, and which way in a tile takes.
 */

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

const ronde = (setId: string, mode: ModeId, at: string): Gespeeld => ({
  deel: deel(setId),
  ronde: { mode, setId, itemIds: [], correct: 1, answered: 1, at },
});

describe('what a child goes back to most', () => {
  it('counts rounds per set, most first', () => {
    const lijst = meestGeoefend([
      ronde('tafel-3', 'som-typen', '2026-09-09T12:00:00.000Z'),
      ronde('nl-provincies', 'wijs-aan', '2026-09-09T11:00:00.000Z'),
      ronde('nl-provincies', 'wijs-aan', '2026-09-08T11:00:00.000Z'),
      ronde('nl-provincies', 'meerkeuze', '2026-09-07T11:00:00.000Z'),
    ]);

    expect(lijst.map((entry) => [entry.deel.setId, entry.keer])).toEqual([
      ['nl-provincies', 3],
      ['tafel-3', 1],
    ]);
  });

  /**
   * One tile per set, not one per set and way. That is the difference between
   * this block: a shortcut back
   * in is about the afternoon you had, a tile on the front door is about the
   * exercise. So the tile takes the way this child chose most.
   */
  it('gives a set one tile, in the way it was answered most', () => {
    const lijst = meestGeoefend([
      ronde('nl-provincies', 'meerkeuze', '2026-09-09T11:00:00.000Z'),
      ronde('nl-provincies', 'wijs-aan', '2026-09-08T11:00:00.000Z'),
      ronde('nl-provincies', 'wijs-aan', '2026-09-07T11:00:00.000Z'),
    ]);

    expect(lijst).toHaveLength(1);
    expect(lijst[0]?.mode).toBe('wijs-aan');
  });

  it('holds five, however many were played', () => {
    const veel = ['a', 'b', 'c', 'd', 'e', 'f'].map((id, at) =>
      ronde(id, 'som-typen', `2026-09-0${at + 1}T11:00:00.000Z`),
    );

    expect(meestGeoefend(veel)).toHaveLength(POPULAR_SHOWN);
  });

  /**
   * Nought rather than a guess. There is no server to ask what is popular with
   * anybody else, so a child with no rounds behind them gets the five to start
   * with and a count that says so.
   */
  it('falls back to a starting list that is real and unplayed', () => {
    expect(meestGeoefend([])).toEqual([]);

    const begin = starters();
    const bestaat = new Set(startbareOnderdelen().map((set) => set.setId));

    expect(begin).toHaveLength(POPULAR_SHOWN);
    for (const entry of begin) {
      expect(bestaat.has(entry.deel.setId), entry.deel.setId).toBe(true);
      expect(entry.keer).toBe(0);
    }
  });
});

/**
 * Waarmee een nieuw kind begint, met een groep (ADR-151): nog steeds één kaart
 * per module, maar de set die bij de groep past. Zonder groep precies de lijst
 * van altijd.
 */
describe('the ones to start with, for a group', () => {
  const sets = (groep?: Parameters<typeof starters>[0]) =>
    starters(groep).map((entry) => entry.deel.setId);

  it('is the usual list without a group', () => {
    expect(sets(undefined)).toEqual(sets());
    expect(sets()).toEqual([
      'nl-provincies',
      'tafel-2',
      'klok-heel',
      'vlag-europa-bekend',
      'taal-sp-eiij',
    ]);
  });

  it('keeps one card per module for every group', () => {
    for (const groep of [3, 4, 5, 6, 7, 8] as const) {
      const modules = starters(groep).map((entry) => entry.deel.moduleId);
      expect(new Set(modules).size, `groep ${groep}`).toBe(POPULAR_SHOWN);
    }
  });

  it('starts groep 3 on sums to twenty, with what is for later behind it', () => {
    // Voor groep 3 zijn topografie, vlaggen en Taal allemaal voor later. Ze
    // blijven in de rij, in hun eigen volgorde, achter rekenen en de klok.
    const lijst = sets(3);
    expect(lijst.slice(0, 2)).toEqual(['plus-20', 'klok-heel']);
    expect(lijst.slice(2)).toEqual(['nl-provincies', 'vlag-europa-bekend', 'taal-sp-eiij']);
  });

  /**
   * Per groep de stof van dat jaar (ADR-206). Past er in een module niets, dan
   * de set die het laatst ophoudt: de klok voor groep 7 en 8 is vijf minuten,
   * niet de hele uren van groep 3.
   */
  it('picks what fits the group, or else what was last in the years before', () => {
    const alles = startbareOnderdelen().filter((set) => !set.mix && groepenVan(set) !== undefined);
    for (const groep of GROEPEN) {
      for (const { deel: kaart } of starters(groep)) {
        const module = alles.filter((set) => set.moduleId === kaart.moduleId);
        const pastIets = module.some((set) => indelingVoor(set, groep) === 'nu');
        const indeling = indelingVoor(kaart, groep);
        if (pastIets) {
          expect(indeling, `groep ${groep}: ${kaart.setId}`).toBe('nu');
        } else if (indeling === 'herhaling') {
          const hoogste = (set: Onderdeel) => Math.max(...(groepenVan(set) ?? []));
          const eerder = module.filter((set) => indelingVoor(set, groep) === 'herhaling');
          expect(hoogste(kaart), `groep ${groep}: ${kaart.setId}`).toBe(
            Math.max(...eerder.map(hoogste)),
          );
        }
      }
    }
  });

  it('gives groep 7 and 8 harder work, and puts a subject they are past at the back', () => {
    expect(sets(7)).toEqual([
      'nl-hoofdsteden',
      'keer-1000',
      'vlag-europa-alle',
      'taal-ww-vt',
      'klok-vijf',
    ]);
    expect(sets(8)).toEqual([
      'europa-landen',
      'delen-1000',
      'vlag-wereld-alle',
      'taal-en-school',
      'klok-vijf',
    ]);
  });

  it('does not give two groups the same row', () => {
    const rijen = GROEPEN.map((groep) => sets(groep).join());
    expect(new Set(rijen).size).toBe(GROEPEN.length);
  });

  it('asks a verb the way verbs are asked', () => {
    const taal = starters(7).find((entry) => entry.deel.moduleId === 'woorden');
    expect(taal?.deel.setId).toBe('taal-ww-vt');
    expect(taal?.mode).toBe('taal-vorm-kiezen');
    // En Engels op de manier van Engels (ADR-217).
    const engels = starters(8).find((entry) => entry.deel.moduleId === 'woorden');
    expect(engels?.mode).toBe('taal-engels-kiezen');
  });
});

/**
 * "Past bij groep 6" op Vandaag, voor wie al geoefend heeft (ADR-206): per vak
 * één set die bij de groep past en die dit kind nog niet deed.
 */
describe('what fits the group and is not done yet', () => {
  it('is nothing without a group', () => {
    expect(voorGroep(undefined, new Set())).toEqual([]);
  });

  it('starts from the group row, one card per subject, and all of it fits', () => {
    const lijst = voorGroep(6, new Set());
    expect(lijst.map((kaart) => kaart.deel.setId)).toEqual(
      starters(6).map((kaart) => kaart.deel.setId),
    );
    for (const { deel: kaart } of lijst) expect(indelingVoor(kaart, 6)).toBe('nu');
  });

  it('leaves out what was done, and moves on to the next that fits', () => {
    const lijst = voorGroep(6, new Set(['nl-provincies', 'keer-100']));
    const ids = lijst.map((kaart) => kaart.deel.setId);
    expect(ids).not.toContain('nl-provincies');
    expect(ids).not.toContain('keer-100');
    // Voor rekenen is er meer stof van groep 6; voor topografie niet.
    expect(lijst.find((kaart) => kaart.deel.moduleId === 'tafels')).toBeDefined();
    expect(lijst.find((kaart) => kaart.deel.moduleId === 'topo')).toBeUndefined();
  });

  it('drops a subject that has nothing for the group', () => {
    expect(voorGroep(8, new Set()).map((kaart) => kaart.deel.moduleId)).not.toContain('klok');
  });

  it('is empty once everything that fits is done', () => {
    const alles = new Set(startbareOnderdelen().map((set) => set.setId));
    expect(voorGroep(7, alles)).toEqual([]);
  });

  it('asks a verb the way verbs are asked', () => {
    const taal = voorGroep(7, new Set()).find((kaart) => kaart.deel.moduleId === 'woorden');
    expect(taal?.deel.setId).toBe('taal-ww-vt');
    expect(taal?.mode).toBe('taal-vorm-kiezen');
  });
});

/**
 * Topography's subjects, after the region row took the place-name off them
 * (ADR-083) and then got two more regions to point at (ADR-086). Six is still
 * the ceiling a section may hold, and one word is the whole point of the
 * change — but the six is per region now, because that is what the page draws.
 */
describe('what topography offers', () => {
  const per = (regio: string) => onderwerpenVan('topo').filter((vak) => vak.regio === regio);

  it('offers five subjects under Nederland, in one word each', () => {
    expect(per('nederland').map((vak) => vak.id)).toEqual([
      'provincies',
      'steden',
      'wateren',
      'eilanden',
      'nl-mix',
    ]);
  });

  it('offers the countries, and only the countries, further out', () => {
    // One subject each, and that is not a placeholder: a continent has one
    // thing on it a child is asked to find (ADR-086).
    for (const regio of [
      'europa',
      'afrika',
      'azie',
      'noord-amerika',
      'zuid-amerika',
      'oceanie',
      'wereld',
    ]) {
      expect(
        per(regio).map((vak) => vak.id),
        regio,
      ).toEqual([`${regio}-landen`]);
    }
  });

  it('never puts more than six cards in front of a child at once', () => {
    // The ceiling is per region, because a region is what step 1 draws.
    for (const regio of TOPO_REGIOS.map((r) => r.id)) {
      expect(per(regio).length, regio).toBeLessThanOrEqual(6);
    }
    // And every subject belongs to a region, so none can go missing from the
    // page by having no row to sit under.
    expect(onderwerpenVan('topo').filter((vak) => vak.regio === null)).toEqual([]);
  });

  it('puts the two city sets under one subject, with a chip each', () => {
    const steden = onderwerpenVan('topo').find((vak) => vak.id === 'steden');

    expect(steden?.sets.map((set) => set.setId)).toEqual(['nl-hoofdsteden', 'nl-steden']);
    // A chip needs a short label; without one it would fall back to the full
    // set name and the row would be two sentences wide.
    expect(steden?.sets.every((set) => set.kortNaam !== null)).toBe(true);
    expect(steden?.keuze).not.toBeNull();
  });
});

/**
 * Klokkijken's subjects: the shape topography's Nederland row has rather than
 * the shape rekenen has. Four steps and a mix, one set each, no second question
 * underneath and no region row above — which is what makes the module page
 * number its steps one and two rather than one, two and three.
 */
describe('what the clock offers', () => {
  const vakken = onderwerpenVan('klok');

  it('offers the four steps a classroom teaches, and a mix of them', () => {
    expect(vakken.map((vak) => vak.id)).toEqual([
      'hele-uren',
      'halve-uren',
      'kwartieren',
      'vijf-minuten',
      'klok-mix',
    ]);
  });

  it('gives every subject exactly one set, so there is nothing to choose under it', () => {
    for (const vak of vakken) {
      expect(vak.sets.length, vak.id).toBe(1);
      expect(vak.keuze, vak.id).toBeNull();
      // No regions: a clock is not anywhere.
      expect(vak.regio, vak.id).toBeNull();
    }
  });

  it('never puts more than six cards in front of a child at once', () => {
    expect(vakken.length).toBeLessThanOrEqual(6);
  });

  it('counts every face once over the four steps, and never the mix as well', () => {
    // The mix holds all hundred and forty-four; the four steps hold them
    // between them. A total that added both would tell a child there are two
    // hundred and eighty-eight times on a clock.
    const stappen = vakken.filter((vak) => vak.id !== 'klok-mix');
    const faces = stappen.flatMap((vak) => vak.sets.flatMap((deel) => deel.items));

    expect(faces).toHaveLength(144);
    expect(new Set(faces.map((item) => item.id)).size).toBe(144);
    expect(vakken.find((vak) => vak.id === 'klok-mix')?.sets[0]?.mix).toBe(true);
  });

  it('leaves the mix out of what progress is counted over', () => {
    const klok = onderdelen().filter((deel) => deel.moduleId === 'klok');
    expect(klok.map((deel) => deel.setId)).toEqual([
      'klok-heel',
      'klok-half',
      'klok-kwart',
      'klok-vijf',
    ]);

    // And it is startable all the same, because it has an address and a tile.
    expect(startbareOnderdelen().map((deel) => deel.setId)).toContain('klok-mix');
  });
});
