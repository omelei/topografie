import { isOnthouden } from './leitner';
import type { ItemState, LeitnerBox } from './types';

/**
 * How much of a set a child will still know on a given day.
 *
 * This is the number the home screen shows — "67%, weet je hier over drie weken
 * nog van" — and it is a better thing to show than mastery. Mastery says where
 * you are; retention says what happens if you do nothing, which is the only
 * fact that argues for practising today.
 *
 * The model is deliberately the simplest one that is defensible, for the same
 * reason Leitner beat SM-2 (ADR-005): a teacher has to be able to be told how it
 * works in one sentence. That sentence is **"after one box interval you still
 * know about nine tenths of it, and it falls off at the same rate after that."**
 *
 * It is a forecast, not a measurement, and the copy around it must never imply
 * otherwise.
 */

/** Retention still standing one step after a review. */
const RETENTION_AT_INTERVAL = 0.9;

/**
 * How long one step is, per box: the days a child in that box holds on to
 * roughly nine tenths of it.
 *
 * Until ADR-160 this was `INTERVAL_DAYS`, the scheduler's own table, and the
 * two were one number because they happened to agree. They do not any more:
 * ADR-160 brings the first three boxes back the next day, so that three
 * answers on three days are enough to call something remembered. Reading the
 * forecast off that table would have said a child who practises on Monday,
 * Tuesday and Wednesday forgets six times faster than one who did the same
 * work last month — which is a statement about our scheduling, not about
 * their memory.
 *
 * So the curve keeps the ladder it was measured on. It is the schedule that
 * changed its mind, not the child.
 */
const GEHEUGEN_DAGEN: Readonly<Record<LeitnerBox, number>> = {
  1: 1,
  2: 2,
  3: 5,
  4: 8,
  5: 21,
};

const DAY_MS = 86_400_000;

function daysBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / DAY_MS;
}

/**
 * Probability, between 0 and 1, that one item is still known `on` a date.
 *
 * An item that has never been answered returns 0: not knowing it yet and
 * forgetting it are different things, but for "what will you know in three
 * weeks" they come to the same number, and a hopeful guess here would make the
 * whole figure a lie.
 */
export function itemRetention(state: ItemState | undefined, on: Date): number {
  if (!state || state.laatsteReview === null) return 0;

  const elapsed = daysBetween(new Date(state.laatsteReview), on);
  if (elapsed <= 0) return 1;

  const interval = GEHEUGEN_DAGEN[state.box];
  return Math.pow(RETENTION_AT_INTERVAL, elapsed / interval);
}

/**
 * The average across a set, as a whole percentage.
 *
 * An average rather than a product: the question a child is answering is "how
 * much of this will I still know", not "will I know all of it", and a product
 * over twelve provinces would read as near zero however well they were doing.
 */
export function setRetention(
  states: ReadonlyMap<string, ItemState>,
  itemIds: readonly string[],
  on: Date,
): number {
  if (itemIds.length === 0) return 0;

  let total = 0;
  for (const id of itemIds) total += itemRetention(states.get(id), on);
  return Math.round((total / itemIds.length) * 100);
}

/**
 * What today's round would be worth: the same forecast, but with every item due
 * now answered correctly and rescheduled.
 *
 * This drives the second line on the home screen — "Eén ronde vandaag houdt het
 * op 80%." It is an honest best case and the copy says "houdt het op", not
 * "brengt het op": it is what practising protects, not what it adds.
 */
export function retentionAfterRound(
  states: ReadonlyMap<string, ItemState>,
  itemIds: readonly string[],
  on: Date,
  now: Date,
): number {
  if (itemIds.length === 0) return 0;

  let total = 0;
  for (const id of itemIds) {
    const state = states.get(id);
    const due = !state || state.volgendeReview === null || new Date(state.volgendeReview) <= now;

    if (!due && state) {
      total += itemRetention(state, on);
      continue;
    }

    // Answered correctly today: one box up, reviewed now.
    const box = state ? (Math.min(state.box + 1, 5) as ItemState['box']) : 2;
    total += itemRetention(
      {
        itemId: id,
        box,
        laatsteReview: now.toISOString(),
        volgendeReview: null,
        goedCount: 0,
        foutCount: 0,
      },
      on,
    );
  }

  return Math.round((total / itemIds.length) * 100);
}

/**
 * How many items in a set are remembered — "8 van de 12 onthoud je" — by the
 * one definition the product has (ADR-114, `isOnthouden`): box four or five.
 *
 * With `now`, an item that has gone so long unseen that it needs a refresher is
 * left out, which is what the Onthouden page and the module page show. Without
 * it, what was proven, which is what a round's rewards count.
 */
export function countMastered(
  states: ReadonlyMap<string, ItemState>,
  itemIds: readonly string[],
  now?: Date,
): number {
  let count = 0;
  for (const id of itemIds) {
    if (isOnthouden(states.get(id), now)) count++;
  }
  return count;
}
