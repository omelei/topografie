import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { dayKey, isSchoolDay, weekKey, type HolidayPeriod } from './kalender';

/** All weekdays verified: 7 Sept 2026 is a Monday, 12–13 Sept a weekend. */
const day = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
};

const KERST: HolidayPeriod[] = [{ naam: 'Kerstvakantie', start: '2026-12-19', eind: '2027-01-03' }];

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
   * parent whose weekbericht counts a holiday nobody told the app about. This
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
