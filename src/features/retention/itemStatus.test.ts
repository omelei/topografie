import { describe, expect, it } from 'vitest';
import { emptyState, review, type ItemState } from '@/game-core';
import { aantalAntwoorden, dagenGeleden, procentGoed, retentionOf, statusOf } from './itemStatus';

/**
 * The mapping ADR-042 settled and ADR-114 redefined, checked against the
 * scheduler rather than against a table of boxes — so that if the Leitner
 * intervals ever move, this either follows them or fails loudly.
 */

const FROM = new Date('2026-09-01T10:00:00');
const DAY = 86_400_000;

/** Walks an item up the boxes the only way a child can: by being right when it is due. */
function correctTimes(times: number, from = FROM): ItemState {
  let state = emptyState('nl-prov-drenthe');
  for (let n = 0; n < times; n++) {
    state = review(state, true, new Date(from.getTime() + n * DAY * 30));
  }
  return state;
}

/** The moment just after the last of those answers. */
function vlakNa(times: number): Date {
  return new Date(FROM.getTime() + (times - 1) * DAY * 30 + 60_000);
}

describe('what one item is doing', () => {
  it('calls an item nobody has seen new, not wrong', () => {
    expect(statusOf(undefined, FROM)).toBe('new');
    expect(statusOf(emptyState('nl-prov-drenthe'), FROM)).toBe('new');
    // An empty dot, so the shape says the same thing as the word.
    expect(retentionOf(undefined)).toBe(0);
  });

  it('calls it remembered from the third answer given when it was due', () => {
    expect(statusOf(correctTimes(1), vlakNa(1))).toBe('practising');
    expect(statusOf(correctTimes(2), vlakNa(2))).toBe('practising');
    expect(statusOf(correctTimes(3), vlakNa(3))).toBe('remembered');
    expect(statusOf(correctTimes(4), vlakNa(4))).toBe('remembered');
    expect(statusOf(correctTimes(9), vlakNa(9))).toBe('remembered');
  });

  it('asks for a refresher when a remembered item has gone long unseen', () => {
    // Box five comes back after 21 days; unseen for 21 more it is stale.
    const onthouden = correctTimes(4);
    const laatNa = new Date(FROM.getTime() + 3 * DAY * 30 + 43 * DAY);
    expect(statusOf(onthouden, laatNa)).toBe('refresh');

    // And one correct answer puts it back: it was due, so it moves on.
    expect(statusOf(review(onthouden, true, laatNa), laatNa)).toBe('remembered');
  });

  it('fills the dot in step with the box', () => {
    expect(retentionOf(correctTimes(1))).toBe(0.25);
    expect(retentionOf(correctTimes(2))).toBe(0.5);
    expect(retentionOf(correctTimes(3))).toBe(0.75);
    expect(retentionOf(correctTimes(4))).toBe(1);
  });

  it('sends one wrong answer all the way back to the start', () => {
    // Leitner here is strict, and this test exists to say so out loud: a wrong
    // answer returns an item to box one whatever box it was in. What matters
    // here is that the label follows the box rather than softening it, so the
    // screen never claims a child remembers something the scheduler has already
    // decided to ask them again tomorrow.
    const moment = new Date('2026-12-15T10:00:00');
    const slipped = review(correctTimes(4), false, moment);
    expect(slipped.box).toBe(1);
    expect(statusOf(slipped, moment)).toBe('practising');
    expect(retentionOf(slipped)).toBe(0);
  });
});

describe('the table on the Onthouden page', () => {
  it('counts every answer, and the share of them that was right', () => {
    const state: ItemState = { ...emptyState('x'), goedCount: 3, foutCount: 1 };
    expect(aantalAntwoorden(state)).toBe(4);
    expect(procentGoed(state)).toBe(75);
    // Nought answers is no percentage at all rather than nought per cent.
    expect(aantalAntwoorden(undefined)).toBe(0);
    expect(procentGoed(undefined)).toBeNull();
    expect(procentGoed(emptyState('x'))).toBeNull();
  });

  it('says how many calendar days ago it was last answered', () => {
    const avond = review(emptyState('x'), true, new Date('2026-09-10T21:30:00'));
    expect(dagenGeleden(avond, new Date('2026-09-10T22:00:00'))).toBe(0);
    // Yesterday evening is a day ago, however few hours have passed.
    expect(dagenGeleden(avond, new Date('2026-09-11T08:00:00'))).toBe(1);
    expect(dagenGeleden(avond, new Date('2026-09-17T08:00:00'))).toBe(7);
    expect(dagenGeleden(undefined, new Date('2026-09-17T08:00:00'))).toBeNull();
  });
});
