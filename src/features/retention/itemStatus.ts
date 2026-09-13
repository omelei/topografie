import { isStale, masteryPercent, ONTHOUDEN_BOX, type ItemState } from '@/game-core';
import type { ItemStatus } from '@/components/StatusLabel';

/**
 * What one item is doing, from its Leitner box (ADR-042, ADR-114).
 *
 * The dot and the label answer different questions on purpose. The dot says how
 * much of this you hold — straight from `masteryPercent`, and the same shape as
 * everywhere else in the product. The label says where it stands against the
 * one definition the product has of remembering something: **right three
 * times, each time when it was due, over at least a week** (`isOnthouden`).
 *
 * Four words, in the order a child moves through them. Nog niet geoefend;
 * nog niet onthouden, which is everything between the first answer and the
 * week; onthouden; and even opfrissen, for something that was remembered and
 * has gone unseen for longer than its own interval twice over. The last one is
 * not a demotion — the box is where it was, and one correct answer puts it back
 * — it is the honest word for a fact nobody has checked in a month.
 *
 * "In de vriezer" is gone as a label. Box five was both the fullest dot and the
 * freezer, and with remembering starting at box four the two would have been
 * two words for one fact.
 */
export function statusOf(state: ItemState | undefined, now: Date = new Date()): ItemStatus {
  if (!state || state.laatsteReview === null) return 'new';
  if (state.box < ONTHOUDEN_BOX) return 'practising';
  return isStale(state, now) ? 'refresh' : 'remembered';
}

/** How full the dot is: 0, 0.25, 0.5, 0.75 or 1. */
export function retentionOf(state: ItemState | undefined): number {
  return masteryPercent(state) / 100;
}

const DAY_MS = 86_400_000;

/**
 * How many days ago the item was last answered, counted in calendar days on
 * this device's clock: yesterday evening is one day ago however few hours have
 * passed, and a clock change does not make a day of twenty-three hours round
 * to nought. Null for something never answered.
 */
export function dagenGeleden(state: ItemState | undefined, now: Date): number | null {
  if (!state || state.laatsteReview === null) return null;
  const toen = new Date(state.laatsteReview);
  const dag = (moment: Date) =>
    Date.UTC(moment.getFullYear(), moment.getMonth(), moment.getDate());
  return Math.max(0, Math.round((dag(now) - dag(toen)) / DAY_MS));
}

/** Every answer this item has had, right and wrong. */
export function aantalAntwoorden(state: ItemState | undefined): number {
  return state ? state.goedCount + state.foutCount : 0;
}

/**
 * The share of those answers that was right, as a whole percentage. Null where
 * there have been none: nought per cent would be a mark for something nobody
 * has been asked.
 */
export function procentGoed(state: ItemState | undefined): number | null {
  const aantal = aantalAntwoorden(state);
  if (!state || aantal === 0) return null;
  return Math.round((state.goedCount / aantal) * 100);
}
