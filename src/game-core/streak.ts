/**
 * The day streak: days in a row on which a round was finished.
 *
 * **Every day counts, and every day missed ends it** (ADR-148). Weekends and
 * school holidays used to pause the streak, and a missed school day spent a
 * rest day. Both made the number disagree with the week drawn under it — "4
 * dagen op rij" above a row with empty days in it — so both are gone. "Op rij"
 * is what it says: every calendar day since the streak began had a round.
 *
 * All dates here are calendar days in local time, formatted as YYYY-MM-DD. A
 * streak is about days a child lived through, not about hours elapsed, and
 * timestamps invite a bug where practising at 23:59 and again at 00:01 counts
 * as two days — which it is, and as one day, which it feels like.
 */

export interface HolidayPeriod {
  readonly naam: string;
  /** Inclusive, YYYY-MM-DD. */
  readonly start: string;
  /** Inclusive, YYYY-MM-DD. */
  readonly eind: string;
}

export interface StreakState {
  readonly huidigeStreak: number;
  readonly langsteStreak: number;
  /** YYYY-MM-DD of the last day a round was finished, or null. */
  readonly laatsteActieveDag: string | null;
}

export function emptyStreak(): StreakState {
  return {
    huidigeStreak: 0,
    langsteStreak: 0,
    laatsteActieveDag: null,
  };
}

/** YYYY-MM-DD in local time. Not toISOString, which is UTC and shifts the day. */
export function dayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDay(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
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

/**
 * School days strictly between two dates — the days that were missed.
 *
 * Exclusive at both ends on purpose: the day last practised was not missed, and
 * the day being counted is being practised right now.
 */
export function missedSchoolDays(
  from: string,
  to: string,
  holidays: readonly HolidayPeriod[],
): number {
  let missed = 0;
  const cursor = parseDay(from);
  const end = parseDay(to);

  cursor.setDate(cursor.getDate() + 1);
  // A guard rather than a while(true): a corrupt date should not hang the app,
  // and nobody's streak spans two years of daily practice yet.
  for (let guard = 0; cursor < end && guard < 3650; guard++) {
    if (isSchoolDay(cursor, holidays)) missed++;
    cursor.setDate(cursor.getDate() + 1);
  }

  return missed;
}

/** Calendar days strictly between two dates: the days without a round. */
export function missedDays(from: string, to: string): number {
  const tussen = Math.round((parseDay(to).getTime() - parseDay(from).getTime()) / 86_400_000);
  return Math.max(0, tussen - 1);
}

export interface StreakChange {
  readonly state: StreakState;
  /** True when this round was the first of a new day. */
  readonly counted: boolean;
  /** True when the streak restarted because a day was missed. */
  readonly broken: boolean;
}

/**
 * Applies one finished round.
 *
 * Idempotent within a day: a child who does four rounds on Tuesday has a streak
 * of one, not four. The number counts days, and saying so plainly is the only
 * way a child can predict it.
 */
export function recordActivity(state: StreakState, on: Date): StreakChange {
  const today = dayKey(on);

  if (state.laatsteActieveDag === today) {
    return { state, counted: false, broken: false };
  }

  const broken = state.laatsteActieveDag !== null && missedDays(state.laatsteActieveDag, today) > 0;
  const streak = state.laatsteActieveDag === null || broken ? 1 : state.huidigeStreak + 1;

  return {
    state: {
      huidigeStreak: streak,
      langsteStreak: Math.max(state.langsteStreak, streak),
      laatsteActieveDag: today,
    },
    counted: true,
    broken,
  };
}

/**
 * What the streak is worth right now, without recording anything.
 *
 * A streak shown as a number the child has already lost is worse than no
 * streak: they open the app, see 12, practise, and watch it become 1. This
 * reports what a round today would actually be joining.
 */
export function currentStreak(state: StreakState, now: Date): number {
  if (state.laatsteActieveDag === null) return 0;

  const today = dayKey(now);
  if (state.laatsteActieveDag === today) return state.huidigeStreak;

  return missedDays(state.laatsteActieveDag, today) === 0 ? state.huidigeStreak : 0;
}

// ---------------------------------------------------------------------------

/**
 * The other streak: correct answers in a row, with no day in it.
 *
 * The day streak above measures turning up. This one measures getting it right,
 * and it is the only number in the product that a single wrong answer takes
 * away — which is exactly why it is not allowed to be the one a child is shown
 * first (ADR-072). It sits under the day streak in the child's own column, it
 * keeps its best alongside its current, and losing it costs nothing else: no
 * coins, no level, no stamp.
 *
 * It runs across rounds and across modules on purpose. "Twaalf goed op rij" is
 * a thing a child says about themselves, not about one round of one table, and
 * a counter that reset at the end of every round would be reporting the round.
 */
export interface FlawlessRun {
  /** How many correct answers in a row, right now. */
  readonly nu: number;
  /** The longest run there has ever been. Never goes down. */
  readonly beste: number;
}

export function emptyRun(): FlawlessRun {
  return { nu: 0, beste: 0 };
}

/**
 * One answer, counted.
 *
 * "Ik weet het niet" is a wrong answer here, the same as any other: the run is
 * about knowing, and ADR-048 makes not knowing cheap everywhere it costs
 * something real — a life, a box, a mark. A run is none of those.
 */
export function recordAnswerRun(run: FlawlessRun, correct: boolean): FlawlessRun {
  if (!correct) return { nu: 0, beste: run.beste };
  const nu = run.nu + 1;
  return { nu, beste: Math.max(nu, run.beste) };
}
