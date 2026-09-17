import { describe, expect, it } from 'vitest';
import { diplomaFor, tableOfDiploma, type RewardSnapshot } from './rewards';

const snapshot = (over: Partial<RewardSnapshot> = {}): RewardSnapshot => ({
  setId: 'nl-provincies',
  perfectRound: false,
  completeRound: true,
  setSize: 12,
  mode: 'wijs-aan',
  correct: 0,
  ...over,
});

describe('the tafeldiploma', () => {
  const diploma = (over: Partial<RewardSnapshot> = {}) =>
    diplomaFor(
      snapshot({
        setId: 'tafel-7',
        mode: 'tafeldiploma',
        perfectRound: true,
        completeRound: true,
        ...over,
      }),
    );

  it('is earned by the whole table, flawless, in one attempt', () => {
    expect(diploma()).toBe('diploma-tafel-7');
  });

  it('is not earned by stopping while ahead, or by one mistake', () => {
    expect(diploma({ completeRound: false })).toBeNull();
    expect(diploma({ perfectRound: false })).toBeNull();
  });

  it('exists for a table and for nothing else', () => {
    // There is no diploma for "alle tafels door elkaar" and none for a mix:
    // that would be a certificate no school hands out.
    for (const setId of ['tafels-alle', 'rekenmix', 'delen-100', 'plus-100', 'nl-provincies']) {
      expect(diploma({ setId }), setId).toBeNull();
    }
  });

  it('is not handed out by an ordinary flawless round', () => {
    expect(diploma({ mode: 'som-typen' })).toBeNull();
  });

  it('reads back the table it belongs to, and refuses a row that is not one', () => {
    expect(tableOfDiploma('diploma-tafel-7')).toBe(7);
    expect(tableOfDiploma('diploma-tafel-12')).toBe(12);
    // A thirteenth table is a typo, and a row of another shape is not a diploma.
    expect(tableOfDiploma('diploma-tafel-13')).toBeNull();
    expect(tableOfDiploma('week-op-rij')).toBeNull();
  });
});
