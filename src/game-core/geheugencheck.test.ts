import { describe, expect, it } from 'vitest';
import type { Schedulable } from './leitner';
import { geheugencheckVoor, type CheckSet } from './geheugencheck';

/** Wanneer de geheugencheck er is, en wat hij vraagt (ADR-228). */

const NU = new Date(2026, 8, 26, 15, 0);

function geleden(dagen: number, uur = 10): string {
  return new Date(2026, 8, 26 - dagen, uur).toISOString();
}

function set(naam: string, ids: readonly string[], mix = false): CheckSet<string> {
  return { set: naam, mix, items: ids.map((id) => ({ id }) as Schedulable) };
}

const ids = (voorvoegsel: string, aantal: number) =>
  Array.from({ length: aantal }, (_, i) => `${voorvoegsel}${i}`);

describe('de geheugencheck', () => {
  it('is er vanaf 8 onderdelen die 21 tot en met 60 dagen geleden voor het eerst geoefend zijn', () => {
    const eerste = new Map(ids('p', 8).map((id, i) => [id, geleden(21 + i * 5)] as const));
    const check = geheugencheckVoor([set('provincies', ids('p', 8))], eerste, NU);
    expect(check?.set).toBe('provincies');
    expect(check?.ids).toHaveLength(8);
    // Het langst geleden eerst.
    expect(check?.ids[0]).toBe('p7');
  });

  it('is er niet met 7', () => {
    const eerste = new Map(ids('p', 7).map((id) => [id, geleden(30)] as const));
    expect(geheugencheckVoor([set('provincies', ids('p', 8))], eerste, NU)).toBeNull();
  });

  it('telt 20 en 61 dagen niet mee', () => {
    const eerste = new Map([
      ...ids('a', 6).map((id) => [id, geleden(30)] as const),
      ['b0', geleden(20)] as const,
      ['b1', geleden(61)] as const,
    ]);
    const alles = [...ids('a', 6), 'b0', 'b1'];
    expect(geheugencheckVoor([set('s', alles)], eerste, NU)).toBeNull();
    eerste.set('b0', geleden(21, 23));
    eerste.set('b1', geleden(60, 0));
    expect(geheugencheckVoor([set('s', alles)], eerste, NU)?.ids).toHaveLength(8);
  });

  it('past in één ronde: per onderwerp, en een mix telt als één', () => {
    const eerste = new Map([
      ...ids('p', 5).map((id) => [id, geleden(30)] as const),
      ...ids('h', 5).map((id) => [id, geleden(30)] as const),
    ]);
    const los = [set('provincies', ids('p', 5)), set('hoofdsteden', ids('h', 5))];
    expect(geheugencheckVoor(los, eerste, NU)).toBeNull();
    const metMix = [...los, set('nl-mix', [...ids('p', 5), ...ids('h', 5)], true)];
    const check = geheugencheckVoor(metMix, eerste, NU);
    expect(check?.set).toBe('nl-mix');
    expect(check?.ids).toHaveLength(10);
  });

  it('vraagt er hooguit 10, en kiest bij gelijk een eigen onderwerp boven een mix', () => {
    const eerste = new Map(ids('p', 14).map((id) => [id, geleden(40)] as const));
    const check = geheugencheckVoor(
      [set('nl-mix', ids('p', 14), true), set('provincies', ids('p', 14))],
      eerste,
      NU,
    );
    expect(check?.set).toBe('provincies');
    expect(check?.ids).toHaveLength(10);
  });
});
