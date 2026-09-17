import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  currentStreak,
  dayKey,
  emptyStreak,
  isSchoolDay,
  missedSchoolDays,
  recordActivity,
  weekKey,
  type HolidayPeriod,
  type StreakState,
} from './streak';

/** All weekdays verified: 7 Sept 2026 is a Monday, 12–13 Sept a weekend. */
const day = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
};

const KERST: HolidayPeriod[] = [{ naam: 'Kerstvakantie', start: '2026-12-19', eind: '2027-01-03' }];

function after(state: StreakState, key: string) {
  return recordActivity(state, day(key)).state;
}

describe('dayKey', () => {
  it('uses the local calendar day, not UTC', () => {
    // Late in the evening in a positive offset, toISOString would say tomorrow.
    expect(dayKey(new Date(2026, 8, 7, 23, 30))).toBe('2026-09-07');
  });
});

describe('weekKey', () => {
  it('groups a week from Monday to Sunday', () => {
    expect(weekKey(day('2026-09-07'))).toBe(weekKey(day('2026-09-13')));
    expect(weekKey(day('2026-09-13'))).not.toBe(weekKey(day('2026-09-14')));
  });
});

describe('isSchoolDay', () => {
  it('is false at the weekend', () => {
    expect(isSchoolDay(day('2026-09-12'), [])).toBe(false);
    expect(isSchoolDay(day('2026-09-13'), [])).toBe(false);
  });

  it('is false during a holiday', () => {
    expect(isSchoolDay(day('2026-12-21'), KERST)).toBe(false);
  });

  it('is true on an ordinary weekday', () => {
    expect(isSchoolDay(day('2026-09-08'), KERST)).toBe(true);
  });
});

describe('missedSchoolDays', () => {
  it('is zero between consecutive days', () => {
    expect(missedSchoolDays('2026-09-07', '2026-09-08', [])).toBe(0);
  });

  it('is zero across a weekend', () => {
    // Friday to Monday: nothing was missed, because nothing was asked.
    expect(missedSchoolDays('2026-09-11', '2026-09-14', [])).toBe(0);
  });

  it('counts the school days actually skipped', () => {
    // Monday to Thursday: Tuesday and Wednesday.
    expect(missedSchoolDays('2026-09-07', '2026-09-10', [])).toBe(2);
  });

  it('counts nothing across a holiday', () => {
    expect(missedSchoolDays('2026-12-18', '2027-01-04', KERST)).toBe(0);
  });
});

describe('recordActivity', () => {
  it('starts at one', () => {
    const change = recordActivity(emptyStreak(), day('2026-09-07'));
    expect(change.state.huidigeStreak).toBe(1);
    expect(change.counted).toBe(true);
  });

  it('counts days, not rounds', () => {
    const first = after(emptyStreak(), '2026-09-07');
    const again = recordActivity(first, day('2026-09-07'));

    expect(again.counted).toBe(false);
    expect(again.state.huidigeStreak).toBe(1);
  });

  it('grows on consecutive school days', () => {
    let state = after(emptyStreak(), '2026-09-07');
    state = after(state, '2026-09-08');
    state = after(state, '2026-09-09');
    expect(state.huidigeStreak).toBe(3);
  });

  // ADR-148: a weekend or a holiday is a day like any other.
  it('restarts after a weekend without a round', () => {
    const friday = after(emptyStreak(), '2026-09-11');
    const change = recordActivity(friday, day('2026-09-14'));

    expect(change.state.huidigeStreak).toBe(1);
    expect(change.broken).toBe(true);
  });

  it('keeps growing through a weekend with a round every day', () => {
    let state = after(emptyStreak(), '2026-09-11');
    state = after(state, '2026-09-12');
    state = after(state, '2026-09-13');
    expect(after(state, '2026-09-14').huidigeStreak).toBe(4);
  });

  it('restarts after a holiday without a round', () => {
    const before = after(emptyStreak(), '2026-12-18');
    const change = recordActivity(before, day('2027-01-04'));

    expect(change.broken).toBe(true);
    expect(change.state.huidigeStreak).toBe(1);
  });

  it('counts across a month and a year boundary', () => {
    const oud = after(emptyStreak(), '2026-12-31');
    expect(recordActivity(oud, day('2027-01-01')).state.huidigeStreak).toBe(2);
  });

  // ADR-148: there is no rest day any more. "Op rij" means every school day.
  it('restarts after one missed school day', () => {
    const state = after(emptyStreak(), '2026-09-07');
    // Skips Tuesday, comes back Wednesday.
    const change = recordActivity(state, day('2026-09-09'));

    expect(change.broken).toBe(true);
    expect(change.state.huidigeStreak).toBe(1);
  });

  it('restarts on a Tuesday after a weekend and a missed Monday', () => {
    let state = after(emptyStreak(), '2026-09-10');
    state = after(state, '2026-09-11');
    const change = recordActivity(state, day('2026-09-15'));

    expect(change.broken).toBe(true);
    expect(change.state.huidigeStreak).toBe(1);
    expect(change.state).toEqual({
      huidigeStreak: 1,
      langsteStreak: 2,
      laatsteActieveDag: '2026-09-15',
    });
  });

  it('remembers the longest run even after a break', () => {
    let state = after(emptyStreak(), '2026-09-07');
    state = after(state, '2026-09-08');
    state = after(state, '2026-09-09');
    expect(state.langsteStreak).toBe(3);

    const broken = recordActivity(state, day('2026-09-21')).state;
    expect(broken.huidigeStreak).toBe(1);
    expect(broken.langsteStreak).toBe(3);
  });
});

describe('currentStreak', () => {
  it('is zero before anything happens', () => {
    expect(currentStreak(emptyStreak(), day('2026-09-07'))).toBe(0);
  });

  it('is gone on Sunday after a Friday round and no Saturday', () => {
    const friday = after(emptyStreak(), '2026-09-11');
    expect(currentStreak(friday, day('2026-09-12'))).toBe(1);
    expect(currentStreak(friday, day('2026-09-13'))).toBe(0);
  });

  /**
   * A streak shown as a number the child has already lost is worse than no
   * streak at all: they open the app on 12, practise, and watch it become 1.
   * This reports what a round today would actually be joining.
   */
  it('reports zero once a school day has gone by without a round', () => {
    const state = after(emptyStreak(), '2026-09-07');
    expect(currentStreak(state, day('2026-09-08'))).toBe(1); // today is still open
    expect(currentStreak(state, day('2026-09-09'))).toBe(0); // Tuesday was missed
  });
});

describe('the holiday calendar', () => {
  const calendar = JSON.parse(
    readFileSync(join(process.cwd(), 'content', 'vakanties.json'), 'utf8'),
  ) as { vakanties: HolidayPeriod[]; bronUrl: string; geraadpleegd: string };

  it('records where it came from and when', () => {
    // Spec section 12: nothing goes in without a source and a date.
    expect(calendar.bronUrl).toContain('rijksoverheid.nl');
    expect(calendar.geraadpleegd).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('has periods that start before they end', () => {
    for (const period of calendar.vakanties) {
      expect(period.start <= period.eind, period.naam).toBe(true);
    }
  });

  /**
   * A holiday calendar expires quietly, and the failure lands a year later on a
   * child who loses a streak during a holiday nobody told the app about. This
   * fails while there is still time to extend it, which is the only moment
   * anyone would act.
   */
  it('has at least a hundred days left before it runs out', () => {
    const last =
      calendar.vakanties
        .map((period) => period.eind)
        .sort()
        .at(-1) ?? '';
    const daysLeft = Math.round((new Date(last).getTime() - Date.now()) / 86_400_000);

    expect(
      daysLeft,
      `content/vakanties.json ends on ${last}. Extend it from ${calendar.bronUrl}.`,
    ).toBeGreaterThan(100);
  });
});
