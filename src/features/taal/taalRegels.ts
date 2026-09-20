import { DIPLOMA_VRAGEN, type RoundRule, type TaalDeel } from '@/game-core';

/**
 * How a round of Taal ends, per way of practising (ADR-118).
 *
 * Which ways a page offers, in which order and with what said about each,
 * lives in `features/module/forms.ts`; what stays here is the rule, the way the
 * other modules keep theirs beside their round.
 *
 * Ten questions, like the clock and the flags: ten words is a round and forty
 * is an afternoon. Three lives for overleven. No minute: a clock on spelling
 * teaches guessing (businessplan v6 §5.8), so there is no bliksemronde here.
 */
export type TaalMode =
  | 'taal-letters'
  | 'taal-flitsdictee'
  | 'taal-vorm-kiezen'
  | 'taal-vorm-typen'
  | 'overleven'
  | 'taal-diploma';

export const TAAL_ROUND_RULE: Record<TaalMode, RoundRule> = {
  'taal-letters': { kind: 'fixed', aantal: 10 },
  'taal-flitsdictee': { kind: 'fixed', aantal: 10 },
  'taal-vorm-kiezen': { kind: 'fixed', aantal: 10 },
  'taal-vorm-typen': { kind: 'fixed', aantal: 10 },
  overleven: { kind: 'levens', levens: 3 },
  // Twintig woorden of vormen, of de hele set waar die kleiner is (ADR-168).
  'taal-diploma': { kind: 'fixed', aantal: DIPLOMA_VRAGEN },
};

/** The way each part chooses in. Overleven asks this way, over three lives. */
export const KIES_VORM: Readonly<Record<TaalDeel, TaalMode>> = {
  spelling: 'taal-letters',
  werkwoorden: 'taal-vorm-kiezen',
};

/** Whether a way asks for the word or the form typed, rather than chosen. */
export function typtHet(mode: TaalMode): boolean {
  return mode === 'taal-flitsdictee' || mode === 'taal-vorm-typen' || mode === 'taal-diploma';
}
