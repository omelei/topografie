import { describe, expect, it } from 'vitest';
import type { ChildItemState } from '../db';
import { samenDiploma, samenDoos, samenInstelling } from './samenvoegen';
import { diplomaTerug, doosTerug, instellingTerug, pogingTerug, sessieTerug } from './terug';

/**
 * Dezelfde regels als de triggers in `0003_samenvoegen.sql`, en dezelfde
 * gevallen als `supabase/tests/gezin.sql` (ADR-189): wie ze op de ene plek
 * verandert, ziet het hier of daar misgaan.
 */

function doos(box: 1 | 2 | 3 | 4 | 5, laatste: string | null, goed = 5, fout = 1): ChildItemState {
  return {
    kindId: 'me',
    itemId: 'nl-limburg',
    box,
    laatsteReview: laatste,
    volgendeReview: laatste === null ? null : `${laatste.slice(0, 10)}T23:59:00.000Z`,
    goedCount: goed,
    foutCount: fout,
    hoogsteDoos: box,
  };
}

describe('de dozen', () => {
  it('de jongste laatsteReview wint: een oudere rij zet de doos niet terug', () => {
    const hier = doos(3, '2026-09-22T10:00:00.000Z', 5, 1);
    const daar = doos(5, '2026-09-15T10:00:00.000Z', 7, 0);
    expect(samenDoos(hier, daar)).toMatchObject({
      box: 3,
      laatsteReview: '2026-09-22T10:00:00.000Z',
      goedCount: 7,
      foutCount: 1,
      hoogsteDoos: 5,
    });
  });

  it('bij een gelijke tijd wint de lagere doos, van welke kant ook', () => {
    const tijd = '2026-09-22T10:00:00.000Z';
    expect(samenDoos(doos(3, tijd), doos(4, tijd)).box).toBe(3);
    expect(samenDoos(doos(3, tijd), doos(2, tijd)).box).toBe(2);
  });

  it('een jongere rij van de server wint', () => {
    expect(
      samenDoos(doos(2, '2026-09-22T10:00:00.000Z'), doos(4, '2026-09-23T09:00:00.000Z')).box,
    ).toBe(4);
  });

  it('een nieuwe rij komt er gewoon in', () => {
    const daar = doos(2, '2026-09-22T10:00:00.000Z');
    expect(samenDoos(undefined, daar)).toBe(daar);
  });
});

describe('diploma’s en instellingen', () => {
  it('een diploma houdt de dag waarop het voor het eerst gehaald werd', () => {
    const vroeg = { kindId: 'me', badgeId: 'tafel-2', behaaldOp: '2026-09-20T10:00:00.000Z' };
    const laat = { ...vroeg, behaaldOp: '2026-09-22T10:00:00.000Z' };
    expect(samenDiploma(laat, vroeg)).toBe(vroeg);
    expect(samenDiploma(vroeg, laat)).toBe(vroeg);
  });

  it('van een instelling wint de jongste schrijver', () => {
    const nieuw = { key: 'weekdoel:me', value: 'nieuw', gewijzigdOp: '2026-09-22T10:00:00.000Z' };
    const oud = { key: 'weekdoel:me', value: 'oud', gewijzigdOp: '2026-09-20T10:00:00.000Z' };
    expect(samenInstelling(nieuw, oud)).toBe(nieuw);
    expect(samenInstelling(oud, nieuw)).toBe(nieuw);
    // Een rij hier zonder moment is van vóór ADR-175, en dus ouder.
    expect(samenInstelling({ key: 'weekdoel:me', value: 'heel oud' }, oud)).toBe(oud);
  });
});

describe('van de server terug naar dit apparaat', () => {
  it('maakt van een doos een doos, onder de lokale id', () => {
    expect(
      doosTerug(
        {
          kind_id: 'server-noor',
          item_id: 'nl-limburg',
          box: 3,
          laatste_review: '2026-09-22T10:00:00+00:00',
          volgende_review: null,
          goed_count: 4,
          fout_count: 1,
          hoogste_doos: 4,
        },
        'me',
      ),
    ).toEqual({
      kindId: 'me',
      itemId: 'nl-limburg',
      box: 3,
      laatsteReview: '2026-09-22T10:00:00.000Z',
      volgendeReview: null,
      goedCount: 4,
      foutCount: 1,
      hoogsteDoos: 4,
    });
  });

  it('slaat een kapotte rij over in plaats van hem half weg te schrijven', () => {
    expect(
      doosTerug({ item_id: 'x', box: 9, goed_count: 1, fout_count: 0 } as never, 'me'),
    ).toBeNull();
    expect(sessieTerug({ id: 's', mode: 'meerkeuze', gestart: 'gisteren' }, 'me')).toBeNull();
    expect(pogingTerug({ id: 'p' }, 'me')).toBeNull();
    expect(diplomaTerug({ badge_id: 'x' }, 'me')).toBeNull();
  });

  it('neemt geen ronde over die nog zou lopen', () => {
    expect(
      sessieTerug(
        { id: 's', mode: 'meerkeuze', gestart: '2026-09-22T10:00:00Z', geeindigd: null },
        'me',
      ),
    ).toBeNull();
  });

  it('zet een instelling terug onder de lokale sleutel, en alleen een die de server hoort te kennen', () => {
    expect(
      instellingTerug(
        { sleutel: 'weekdoel', waarde: '{}', gewijzigd_op: '2026-09-22T10:00:00Z' },
        'me',
      ),
    ).toEqual({ key: 'weekdoel:me', value: '{}', gewijzigdOp: '2026-09-22T10:00:00.000Z' });
    expect(
      instellingTerug(
        { sleutel: 'actiefKind', waarde: 'x', gewijzigd_op: '2026-09-22T10:00:00Z' },
        'me',
      ),
    ).toBeNull();
  });
});
