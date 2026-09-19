import { describe, expect, it } from 'vitest';
import type { Weekdoel } from '@/store/weekdoelStore';
import { maandagVan, standen, weekTelling, weekZin, zondagVan } from './weekdoel';

/**
 * De doelen van deze week (ADR-162).
 *
 * Wat hier vastligt is de grens van de week, want dat is het enige aan dit blok
 * dat stil kan gaan liegen: een doel dat op zondagavond nog "3 van de 4" zegt
 * en op maandagochtend nog steeds, is geen weekdoel meer.
 */

/** Maandag 14 september 2026, en de zondag erna. Dezelfde week als dagstand.test. */
const maandag = new Date('2026-09-14T09:00:00');
const donderdag = new Date('2026-09-17T20:00:00');
const zondagAvond = new Date('2026-09-20T23:30:00');

/** Een ronde afgemaakt op dit moment, zoals `PlayedRound.at` het bewaart. */
const op = (iso: string) => new Date(iso).toISOString();

describe('de week', () => {
  it('loopt van maandag tot en met zondag, ook midden in de week', () => {
    for (const moment of [maandag, donderdag, zondagAvond]) {
      expect(maandagVan(moment).toDateString()).toBe(new Date(2026, 8, 14).toDateString());
      expect(zondagVan(moment).toDateString()).toBe(new Date(2026, 8, 20).toDateString());
    }
  });

  it('begint op maandag opnieuw', () => {
    const volgende = new Date('2026-09-21T07:00:00');
    expect(maandagVan(volgende).toDateString()).toBe(new Date(2026, 8, 21).toDateString());
  });

  /**
   * De reden dat de zin er staat: op donderdag wil een kind weten hoeveel
   * dagen het nog heeft, en dat kan alleen als het einde genoemd wordt.
   */
  it('noemt de maand één keer binnen een maand en twee keer eroverheen', () => {
    expect(weekZin(donderdag)).toBe('14 t/m 20 september');
    expect(weekZin(new Date('2026-09-30T09:00:00'))).toBe('28 september t/m 4 oktober');
  });
});

describe('wat er deze week gedaan is', () => {
  it('telt alleen rondes binnen deze week', () => {
    const rondes = [
      op('2026-09-13T22:00:00'), // zondag ervoor
      op('2026-09-14T08:00:00'),
      op('2026-09-17T19:00:00'),
      op('2026-09-20T23:59:00'),
      op('2026-09-21T00:01:00'), // maandag erna
    ];
    expect(weekTelling(rondes, donderdag)).toEqual({ rondes: 3, dagen: 3 });
  });

  /** Twee rondes op één avond zijn twee rondes en één dag. */
  it('telt dagen op de kalenderdag en niet op de klok', () => {
    const rondes = [op('2026-09-15T18:00:00'), op('2026-09-15T18:40:00')];
    expect(weekTelling(rondes, donderdag)).toEqual({ rondes: 2, dagen: 1 });
  });

  it('negeert een stempel die geen datum is', () => {
    expect(weekTelling(['niet een datum', op('2026-09-16T09:00:00')], donderdag)).toEqual({
      rondes: 1,
      dagen: 1,
    });
  });
});

describe('hoe ver een doel is', () => {
  const rondesDoel: Weekdoel = { id: 'a', soort: 'rondes', aantal: 4, diplomaId: null };
  const dagenDoel: Weekdoel = { id: 'b', soort: 'dagen', aantal: 3, diplomaId: null };
  const diplomaDoel: Weekdoel = {
    id: 'c',
    soort: 'diploma',
    aantal: 1,
    diplomaId: 'diploma-tafel-7',
  };
  const rondes = [
    op('2026-09-14T08:00:00'),
    op('2026-09-15T08:00:00'),
    op('2026-09-15T09:00:00'),
  ];

  it('rekent rondes en dagen apart', () => {
    const uit = standen([rondesDoel, dagenDoel], rondes, new Set(), donderdag);
    expect(uit.map(({ gedaan, nodig, gehaald }) => ({ gedaan, nodig, gehaald }))).toEqual([
      { gedaan: 3, nodig: 4, gehaald: false },
      { gedaan: 2, nodig: 3, gehaald: false },
    ]);
  });

  /** Een diploma is geslaagd of niet geslaagd: er bestaat geen 60% van. */
  it('telt een diploma als nul of één', () => {
    const [nog] = standen([diplomaDoel], rondes, new Set(), donderdag);
    expect(nog).toMatchObject({ gedaan: 0, nodig: 1, gehaald: false });

    const [wel] = standen([diplomaDoel], rondes, new Set(['diploma-tafel-7']), donderdag);
    expect(wel).toMatchObject({ gedaan: 1, nodig: 1, gehaald: true });
  });

  it('is gehaald zodra het aantal erboven komt en blijft dat', () => {
    const veel = [...rondes, op('2026-09-16T08:00:00'), op('2026-09-17T08:00:00')];
    const [uit] = standen([rondesDoel], veel, new Set(), donderdag);
    expect(uit).toMatchObject({ gedaan: 5, nodig: 4, gehaald: true });
  });

  /** Maandagochtend staat alles weer op nul, zonder dat er iets gewist is. */
  it('staat de week erna weer op nul', () => {
    const volgende = new Date('2026-09-21T07:00:00');
    const [uit] = standen([rondesDoel], rondes, new Set(), volgende);
    expect(uit).toMatchObject({ gedaan: 0, gehaald: false });
  });
});
