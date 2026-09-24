import { describe, expect, it } from 'vitest';
import {
  GROEPEN,
  huidigeGroep,
  isGroep,
  opGroep,
  pastBijGroep,
  rangVoorGroep,
  samen,
  groepsjaarVan,
  type Groep,
} from './groep';

/**
 * De groep van een kind en wat daarbij past (ADR-151). Een voorstel, geen slot:
 * wat hier getest wordt is alleen de volgorde, en dat zonder groep niets
 * verandert.
 */

describe('pastBijGroep', () => {
  const vijfZes: readonly Groep[] = [5, 6];

  it.each([
    [3, 'later'],
    [4, 'later'],
    [5, 'nu'],
    [6, 'nu'],
    [7, 'herhaling'],
    [8, 'herhaling'],
  ] as const)('groep %s bij een set van groep 5 en 6 is %s', (groep, indeling) => {
    expect(pastBijGroep(vijfZes, groep)).toBe(indeling);
  });

  it('elke groep past bij een set van precies die groep', () => {
    for (const groep of GROEPEN) expect(pastBijGroep([groep], groep)).toBe('nu');
  });

  it('is neutraal zonder groep, voor elke set', () => {
    expect(pastBijGroep(vijfZes, undefined)).toBe('neutraal');
    expect(pastBijGroep([3], undefined)).toBe('neutraal');
    expect(pastBijGroep(undefined, undefined)).toBe('neutraal');
  });

  it('is neutraal voor content zonder groepen, voor elke groep', () => {
    // Een eigen lijst van een ouder, een mix, een foutenlijst: die hebben geen
    // groep en horen niet onder "Voor later" te zakken.
    for (const groep of GROEPEN) {
      expect(pastBijGroep(undefined, groep)).toBe('neutraal');
      expect(pastBijGroep([], groep)).toBe('neutraal');
    }
  });

  it('kijkt naar de laagste en de hoogste groep, niet naar de volgorde', () => {
    expect(pastBijGroep([7, 5], 6)).toBe('nu');
    expect(pastBijGroep([7, 5], 8)).toBe('herhaling');
    expect(pastBijGroep([8, 7], 6)).toBe('later');
  });
});

describe('rangVoorGroep en opGroep', () => {
  it('zet nu en neutraal voor herhaling, en herhaling voor later', () => {
    expect(rangVoorGroep('nu')).toBe(rangVoorGroep('neutraal'));
    expect(rangVoorGroep('nu')).toBeLessThan(rangVoorGroep('herhaling'));
    expect(rangVoorGroep('herhaling')).toBeLessThan(rangVoorGroep('later'));
  });

  const sets: readonly { id: string; groepen?: readonly Groep[] }[] = [
    { id: 'provincies', groepen: [6, 7] },
    { id: 'plus-20', groepen: [3, 4] },
    { id: 'mix' },
    { id: 'tafel-7', groepen: [5] },
  ];

  it('laat zonder groep de volgorde precies zoals hij was', () => {
    const lijst = opGroep(sets, (set) => pastBijGroep(set.groepen, undefined));
    expect(lijst.map((set) => set.id)).toEqual(['provincies', 'plus-20', 'mix', 'tafel-7']);
  });

  it('zet wat past eerst, en houdt verder de volgorde', () => {
    const lijst = opGroep(sets, (set) => pastBijGroep(set.groepen, 5));
    expect(lijst.map((set) => set.id)).toEqual(['mix', 'tafel-7', 'plus-20', 'provincies']);
  });
});

describe('samen', () => {
  it('past een onderwerp zoals zijn best passende set', () => {
    expect(samen(['herhaling', 'nu', 'later'])).toBe('nu');
    expect(samen(['herhaling', 'neutraal'])).toBe('neutraal');
    expect(samen(['later', 'herhaling'])).toBe('herhaling');
    expect(samen(['later'])).toBe('later');
    expect(samen([])).toBe('neutraal');
  });
});

describe('huidigeGroep', () => {
  it('kent alleen groep 3 tot en met 8', () => {
    expect(isGroep(3)).toBe(true);
    expect(isGroep(8)).toBe(true);
    expect(isGroep(2)).toBe(false);
    expect(isGroep(9)).toBe(false);
    expect(isGroep('5')).toBe(false);
    expect(isGroep(undefined)).toBe(false);
  });

  it('begint een schooljaar op 1 augustus', () => {
    expect(groepsjaarVan(new Date(2027, 6, 31, 23, 59))).toBe(2026);
    expect(groepsjaarVan(new Date(2027, 7, 1, 0, 0))).toBe(2027);
    expect(groepsjaarVan(new Date(2026, 8, 17))).toBe(2026);
    expect(groepsjaarVan(new Date(2027, 0, 5))).toBe(2026);
  });

  const opgegeven = { groep: 5, groepSchooljaar: 2026 };

  it('blijft hetzelfde tot en met 31 juli', () => {
    expect(huidigeGroep(opgegeven, new Date(2026, 8, 17))).toBe(5);
    expect(huidigeGroep(opgegeven, new Date(2027, 6, 31, 12))).toBe(5);
  });

  it('schuift op 1 augustus één groep door, en elk jaar daarna weer', () => {
    expect(huidigeGroep(opgegeven, new Date(2027, 7, 1, 12))).toBe(6);
    expect(huidigeGroep(opgegeven, new Date(2029, 8, 1))).toBe(8);
  });

  it('valt na groep 8 weg', () => {
    expect(huidigeGroep({ groep: 8, groepSchooljaar: 2026 }, new Date(2027, 7, 1, 12))).toBe(
      undefined,
    );
  });

  it('gaat nooit terug, ook niet als de klok van het apparaat achterloopt', () => {
    expect(huidigeGroep(opgegeven, new Date(2025, 8, 1))).toBe(5);
  });

  it('is er niet voor een profiel van vóór ADR-151', () => {
    // Het profiel van een kind dat al bestond, zoals IndexedDB het teruggeeft:
    // geen veld, en dus geen groep.
    const oud: object = JSON.parse(
      '{"id":"me","naam":"Sam","avatarConfig":{},"niveau":1,"aangemaaktOp":"2026-09-01"}',
    );
    expect(huidigeGroep(oud, new Date(2026, 8, 17))).toBe(undefined);
    expect(huidigeGroep({ groep: 'groep6' }, new Date(2026, 8, 17))).toBe(undefined);
  });

  it('neemt een groep zonder schooljaar zoals hij is', () => {
    expect(huidigeGroep({ groep: 7 }, new Date(2030, 8, 1))).toBe(7);
  });
});
