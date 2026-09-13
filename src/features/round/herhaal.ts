import { ROUND_RULE, type PracticeMode } from '@/features/practice/useRound';
import { SUM_ROUND_RULE, type SumMode } from '@/features/sums/useSumRound';
import { KLOK_ROUND_RULE, type KlokMode } from '@/features/klok/useKlokRound';
import { VLAG_ROUND_RULE, type VlagMode } from '@/features/vlaggen/useVlagRound';
import { KIES_VORM, TAAL_ROUND_RULE, type TaalMode } from '@/features/taal/taalRegels';
import type { TaalDeel } from '@/game-core';

/**
 * Which way "Herhaal je fouten" asks in (ADR-111).
 *
 * The same way the round was asked, if that way has a length: three misses
 * are three questions. A minute and three lives have no length, and a diploma
 * or an oefentoets asked over three sums is neither — it is practice, so it is
 * asked as practice, with the answers shown (the toetsstand is dropped by the
 * caller). Those come back as each module's multiple choice or, on rekenen, as
 * typing, which is where a table is practised.
 */
export function herhaalKaartVorm(mode: PracticeMode): PracticeMode {
  return ROUND_RULE[mode].kind === 'fixed' && mode !== 'topo-diploma' ? mode : 'meerkeuze';
}

export function herhaalSomVorm(mode: SumMode): SumMode {
  return SUM_ROUND_RULE[mode].kind === 'fixed' && mode !== 'tafeldiploma' ? mode : 'som-typen';
}

export function herhaalKlokVorm(mode: KlokMode): KlokMode {
  return KLOK_ROUND_RULE[mode].kind === 'fixed' && mode !== 'klok-diploma'
    ? mode
    : 'klok-meerkeuze';
}

export function herhaalVlagVorm(mode: VlagMode): VlagMode {
  return VLAG_ROUND_RULE[mode].kind === 'fixed' && mode !== 'vlag-diploma'
    ? mode
    : 'vlag-meerkeuze';
}

/** Taal has no diploma; overleven comes back as the part's way of choosing. */
export function herhaalTaalVorm(mode: TaalMode, deel: TaalDeel): TaalMode {
  return TAAL_ROUND_RULE[mode].kind === 'fixed' ? mode : KIES_VORM[deel];
}
