import { describe, expect, it } from 'vitest';
import {
  judgeSum,
  sumDistractors,
  sumInWoorden,
  sumText,
  sumUitgewerkt,
  type SumItem,
  type SumOp,
} from './sums';

const som = (op: SumOp, links: number, rechts: number, antwoord: number): SumItem => ({
  id: `${op}-${links}-${rechts}`,
  op,
  links,
  rechts,
  antwoord,
});

const keer = (table: number, by: number) => som('keer', table, by, table * by);

describe('reading a sum', () => {
  it('uses the signs a schoolbook uses', () => {
    // Not the letter x, not an asterisk, not a hyphen, and not the obelus: a
    // child reads these beside the ones in their book, and the lookalikes are
    // exactly the detail that makes a product feel like nobody was paying
    // attention. Dutch primary school divides with a colon.
    expect(sumText(keer(7, 8))).toBe('7 × 8');
    expect(sumText(som('delen', 56, 7, 8))).toBe('56 : 7');
    expect(sumText(som('plus', 8, 7, 15))).toBe('8 + 7');
    expect(sumText(som('min', 15, 8, 7))).toBe('15 − 8');
  });

  it('writes splitsen as the splitsbeen, and halving and doubling in words', () => {
    // ADR-120. "14 : 2" and "7 × 2" would read as a table, which is not what
    // is being asked; the words are what a schoolbook writes above them.
    expect(sumText(som('splitsen', 10, 7, 3))).toBe('10 = 7 + ?');
    expect(sumText(som('halveren', 14, 2, 7))).toBe('helft van 14');
    expect(sumText(som('verdubbelen', 7, 2, 14))).toBe('dubbel van 7');
    expect(sumInWoorden(som('halveren', 14, 2, 7))).toBe(true);
    expect(sumInWoorden(som('splitsen', 10, 7, 3))).toBe(false);
  });

  it('puts the answer where it belongs once it is given', () => {
    expect(sumUitgewerkt(keer(7, 8))).toBe('7 × 8 = 56');
    // Splitsen already has its equals sign; the answer takes the question mark's place.
    expect(sumUitgewerkt(som('splitsen', 10, 7, 3))).toBe('10 = 7 + 3');
    expect(sumUitgewerkt(som('halveren', 14, 2, 7))).toBe('helft van 14 = 7');
  });
});

describe('judging an answer', () => {
  it('accepts the number', () => {
    expect(judgeSum('56', keer(7, 8))).toBe(true);
  });

  it('forgives the keyboard, not the table', () => {
    // A stray space or a newline is the phone, not the child.
    expect(judgeSum('  56 ', keer(7, 8))).toBe(true);
    expect(judgeSum('5 6', keer(7, 8))).toBe(true);
    expect(judgeSum('54', keer(7, 8))).toBe(false);
  });

  it('treats anything that is not a number as wrong, not as an error', () => {
    // The screen asked for a number. Throwing here would end the round.
    for (const typed of ['', '   ', 'zesenvijftig', '56a', '5.6', '5,6', '+56']) {
      expect(judgeSum(typed, keer(7, 8)), typed).toBe(false);
    }
  });
});

describe('the wrong answers', () => {
  it('offers three of them, all different and none of them right', () => {
    for (let table = 1; table <= 12; table++) {
      for (let by = 1; by <= 10; by++) {
        const sum = keer(table, by);
        const wrong = sumDistractors(sum);

        expect(wrong, sum.id).toHaveLength(3);
        expect(new Set(wrong).size, sum.id).toBe(3);
        expect(wrong, sum.id).not.toContain(sum.antwoord);
      }
    }
  });

  it('never offers zero or a negative, whatever the operation', () => {
    const sommen = [
      keer(1, 1),
      som('delen', 3, 3, 1),
      som('plus', 1, 1, 2),
      som('min', 10, 9, 1),
      som('min', 11, 9, 2),
      som('splitsen', 2, 1, 1),
      som('halveren', 2, 2, 1),
      som('verdubbelen', 1, 2, 2),
    ];

    for (const sum of sommen) {
      for (const wrong of sumDistractors(sum)) {
        expect(wrong, `${sumText(sum)} → ${wrong}`).toBeGreaterThan(0);
      }
    }
  });

  it('leads with the row above and the row below, for a table', () => {
    // The mistake a child actually makes is one step along the table, not a
    // number from somewhere else entirely.
    const wrong = sumDistractors(keer(7, 8));
    expect(wrong).toContain(49);
    expect(wrong).toContain(63);
  });

  it('leads with a forgotten carry, for plus and minus', () => {
    // Ten out is the mistake of the whole operation. Nothing here is ten out
    // for a division: nobody divides and lands a decade away.
    expect(sumDistractors(som('plus', 34, 9, 43))).toContain(53);
    expect(sumDistractors(som('min', 84, 7, 77))).toContain(67);
    expect(sumDistractors(som('delen', 56, 7, 8))).toEqual([9, 7, 10]);
  });

  it('offers only even near misses for a double, which is always even', () => {
    // An odd number beside the answer would give it away (ADR-120).
    for (const wrong of sumDistractors(som('verdubbelen', 7, 2, 14)).slice(0, 2)) {
      expect(wrong % 2).toBe(0);
    }
  });
});
