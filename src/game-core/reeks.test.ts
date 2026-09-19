import { describe, expect, it } from 'vitest';
import { dayKey } from './kalender';
import { reeksVan } from './reeks';

const NU = new Date(2026, 8, 18, 16);
const DAG = 86_400_000;

/** De dagsleutels van zoveel dagen terug, gerekend vanaf vandaag. */
function dagen(...terug: number[]): ReadonlySet<string> {
  return new Set(terug.map((t) => dayKey(new Date(NU.getTime() - t * DAG))));
}

describe('reeksVan', () => {
  it('telt dagen op rij tot en met vandaag', () => {
    const reeks = reeksVan(dagen(0, 1, 2, 3), NU);
    expect(reeks.dagen).toBe(4);
    expect(reeks.vandaagTelt).toBe(true);
    expect(reeks.opHetSpel).toBe(false);
  });

  it('laat een reeks staan op een dag die nog leeg is', () => {
    // Hij breekt vannacht en niet vanochtend: wie vandaag nog gaat oefenen,
    // heeft zijn reeks niet verloren.
    const reeks = reeksVan(dagen(1, 2, 3), NU);
    expect(reeks.dagen).toBe(3);
    expect(reeks.vandaagTelt).toBe(false);
    expect(reeks.opHetSpel).toBe(true);
  });

  it('breekt op een gemiste dag', () => {
    // Gisteren niets, eergisteren wel: de reeks van eergisteren is voorbij.
    const reeks = reeksVan(dagen(0, 2, 3, 4), NU);
    expect(reeks.dagen).toBe(1);
  });

  it('telt het weekend gewoon mee', () => {
    // 18-09-2026 is een vrijdag, dus 12 t/m 18 loopt over een heel weekend.
    expect(NU.getDay()).toBe(5);
    const reeks = reeksVan(dagen(0, 1, 2, 3, 4, 5, 6), NU);
    expect(reeks.dagen).toBe(7);
  });

  it('houdt het record ook als de reeks gebroken is', () => {
    const reeks = reeksVan(dagen(0, 5, 6, 7, 8, 9), NU);
    expect(reeks.dagen).toBe(1);
    expect(reeks.record).toBe(5);
  });

  it('telt de lopende reeks mee voor het record', () => {
    const reeks = reeksVan(dagen(0, 1, 2), NU);
    expect(reeks.record).toBe(3);
  });

  it('zegt niets bij een kind dat nog nooit oefende', () => {
    const reeks = reeksVan(new Set(), NU);
    expect(reeks).toEqual({ dagen: 0, record: 0, vandaagTelt: false, opHetSpel: false });
  });

  it('zet niets op het spel als er nog geen reeks is', () => {
    // Gisteren en vandaag leeg: er valt niets te verliezen, dus ook niets te zeggen.
    expect(reeksVan(dagen(4, 5), NU).opHetSpel).toBe(false);
  });
});
