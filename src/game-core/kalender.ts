/**
 * Kalenderdagen: waar de weekkaart en het weekbericht in rekenen.
 *
 * Dit bestand heette `streak.ts` en hield de dagreeks bij. Die is weg (ADR-149):
 * een reeks breekt op elke lege dag, en een lege dag is precies wat spreiden
 * nodig heeft. De weekkaart telt dagen in plaats van reeksen. Wat bleef, zijn
 * de dagen zelf.
 *
 * All dates here are calendar days in local time, formatted as YYYY-MM-DD. A
 * day a child lived through is not a number of hours elapsed, and timestamps
 * invite a bug where practising at 23:59 and again at 00:01 counts as one day.
 */

export interface HolidayPeriod {
  readonly naam: string;
  /** Inclusive, YYYY-MM-DD. */
  readonly start: string;
  /** Inclusive, YYYY-MM-DD. */
  readonly eind: string;
}

/** YYYY-MM-DD in local time. Not toISOString, which is UTC and shifts the day. */
export function dayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** ISO week key, YYYY-Www: Monday to Sunday, as a school calendar is drawn. */
export function weekKey(date: Date): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  // ISO weeks run Monday to Sunday and belong to the year of their Thursday.
  const dayOfWeek = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dayOfWeek + 3);
  const firstThursday = new Date(d.getFullYear(), 0, 4);
  const firstDayOfWeek = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstDayOfWeek + 3);
  const week = 1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * 86_400_000));
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function isHoliday(date: Date, holidays: readonly HolidayPeriod[]): boolean {
  const key = dayKey(date);
  return holidays.some((period) => key >= period.start && key <= period.eind);
}

/** A day the child was expected to practise: not a weekend, not a holiday. */
export function isSchoolDay(date: Date, holidays: readonly HolidayPeriod[]): boolean {
  return !isWeekend(date) && !isHoliday(date, holidays);
}
