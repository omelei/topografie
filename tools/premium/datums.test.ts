import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { geldigheid, isDatum, schooljaarVan } from './datums.mjs';

/** Van wanneer tot wanneer een code uit maak-codes.mjs geldt (ADR-225). */

const dag = (tekst: string) => new Date(`${tekst}T12:00:00`);

describe('het schooljaar van een dag', () => {
  it('begint op 1 september', () => {
    expect(schooljaarVan(dag('2026-09-01'))).toBe(2026);
    expect(schooljaarVan(dag('2026-12-31'))).toBe(2026);
    expect(schooljaarVan(dag('2027-01-01'))).toBe(2026);
    expect(schooljaarVan(dag('2027-08-31'))).toBe(2026);
  });
});

describe('de klaspas', () => {
  it('is zonder jaar het schooljaar van vandaag: 1 september tot en met 31 augustus', () => {
    expect(geldigheid({ klaspas: true }, dag('2026-09-26'))).toEqual({
      van: '2026-09-01',
      tot: '2027-08-31',
    });
    // In juni is het nog het schooljaar dat vorig jaar begon.
    expect(geldigheid({ klaspas: true }, dag('2027-06-15'))).toEqual({
      van: '2026-09-01',
      tot: '2027-08-31',
    });
  });

  it('is met een jaar het schooljaar dat in dat jaar begint', () => {
    expect(geldigheid({ klaspas: 2027 }, dag('2027-06-15'))).toEqual({
      van: '2027-09-01',
      tot: '2028-08-31',
    });
  });

  it('weigert een jaar dat geen jaartal is', () => {
    expect(geldigheid({ klaspas: 27 }, dag('2026-09-26'))).toHaveProperty('fout');
  });
});

describe('opgegeven datums', () => {
  it('gaan voor de klaspas, elk voor zich', () => {
    expect(geldigheid({ klaspas: 2027, tot: '2028-07-17' }, dag('2027-06-15'))).toEqual({
      van: '2027-09-01',
      tot: '2028-07-17',
    });
    expect(geldigheid({ klaspas: 2027, van: '2027-08-25' }, dag('2027-06-15'))).toEqual({
      van: '2027-08-25',
      tot: '2028-08-31',
    });
    expect(
      geldigheid({ klaspas: true, van: '2026-10-01', tot: '2026-12-31' }, dag('2026-09-26')),
    ).toEqual({ van: '2026-10-01', tot: '2026-12-31' });
  });

  it('zonder klaspas: vanaf vandaag, een jaar lang, zoals altijd', () => {
    expect(geldigheid({}, dag('2026-09-26'))).toEqual({ van: '2026-09-26', tot: '2027-09-26' });
    expect(geldigheid({ tot: '2027-09-30' }, dag('2026-09-26'))).toEqual({
      van: '2026-09-26',
      tot: '2027-09-30',
    });
    expect(geldigheid({ van: '2026-10-01' }, dag('2026-09-26'))).toEqual({
      van: '2026-10-01',
      tot: '2027-09-26',
    });
  });

  it('weigeren een code die eindigt voordat hij begint', () => {
    expect(geldigheid({ van: '2027-01-01', tot: '2026-12-31' }, dag('2026-09-26'))).toHaveProperty(
      'fout',
    );
  });

  it('zijn echte dagen', () => {
    expect(isDatum('2027-02-29')).toBe(false);
    expect(isDatum('2028-02-29')).toBe(true);
    expect(isDatum('30-09-2027')).toBe(false);
    expect(geldigheid({ tot: '2027-13-01' }, dag('2026-09-26'))).toHaveProperty('fout');
  });
});

describe('het script', () => {
  const maak = (...argumenten: string[]) =>
    execFileSync('node', ['tools/premium/maak-codes.mjs', ...argumenten], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

  it('zet de begindatum in de SQL, en de opgegeven datums gaan voor de klaspas', () => {
    const uit = maak(
      '--plekken',
      '40',
      '--klaspas',
      '2027',
      '--tot',
      '2028-07-17',
      '2',
      '',
      'klas 6b',
    );
    expect(uit).toContain('(code_hash, geldig_van, geldig_tot, max_apparaten, notitie)');
    expect(uit.match(/'2027-09-01', '2028-07-17', 40, 'klas 6b'\)/g)).toHaveLength(2);
  });

  it('weigert twee keer "geldig tot"', () => {
    expect(() => maak('--tot', '2027-09-30', '1', '2027-10-31')).toThrow();
  });
});
