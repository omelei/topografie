import { useCallback } from 'react';
import {
  alleenDeze,
  beoordeelWoord,
  isDiplomaVorm,
  composeRound,
  gatLetters,
  letterOpties,
  metFouten,
  werkwoordOpties,
  type ItemState,
  type RoundRule,
  type Schedulable,
  type SpellingItem,
  type WerkwoordItem,
} from '@/game-core';
import { isTaalFouten, loadTaalSet, sterkeWerkwoorden, type TaalSet } from '@/content/loadTaal';
import { useRoundCore, type RondeFase, type RondeKern } from '@/features/round/useRoundCore';
import { TAAL_ROUND_RULE, typtHet, type TaalMode } from './taalRegels';

/**
 * One round of Taal (ADR-118).
 *
 * The bookkeeping is `useRoundCore`'s (ADR-101); what is here is Taal's own:
 * which words or verbs, which letter pieces or forms beside each, and how an
 * answer is judged — strictly, by `beoordeelWoord`, because the letter is the
 * answer here.
 *
 * A round of one part asks that part's kind of item: a spelling set asks words
 * in sentences, a verb set asks verbs in sentences. Overleven draws from the
 * chosen set itself, over three lives; there is no second kind of thing in a
 * set of ei and ij to reach for, and a round that strayed into d or t would be
 * a different exercise.
 *
 * A wrong answer is kept for the result screen and not asked again in the same
 * round, as everywhere (ADR-101).
 */

export type TaalItem = SpellingItem | WerkwoordItem;

export type TaalVraag =
  | {
      readonly soort: 'spelling';
      readonly item: SpellingItem;
      /** The letter pieces, in the order shown. Null when the word is typed. */
      readonly opties: readonly string[] | null;
    }
  | {
      readonly soort: 'werkwoord';
      readonly item: WerkwoordItem;
      /** Three real forms of the verb, in the order shown. Null when typed. */
      readonly opties: readonly string[] | null;
    };

export type TaalPhase = RondeFase;

/** `given` is what the child chose or typed, or null for "ik weet het niet". */
export type TaalRoundState = RondeKern<TaalSet, TaalVraag, TaalItem, string> & {
  readonly mode: TaalMode;
};

/** The item a question is about, for the core. At module level so it is stable. */
const itemVan = (vraag: TaalVraag): TaalItem => vraag.item;

/**
 * What counts as the answer: the letters of the gap when they are chosen, the
 * whole word when it is typed, and the form of a verb either way.
 */
export function goedAntwoord(vraag: TaalVraag, typen: boolean): string {
  if (vraag.soort === 'werkwoord') return vraag.item.antwoord;
  return typen ? vraag.item.woord : gatLetters(vraag.item);
}

/**
 * @param alleen "Herhaal je fouten": the ids of the items the last round got
 *   wrong, which are then the whole round (ADR-111). Null for a normal round.
 */
export function useTaalRound(
  setId: string,
  mode: TaalMode,
  aantal: number | null = null,
  toetsstand = false,
  alleen: readonly string[] | null = null,
) {
  const typen = typtHet(mode);

  const { kern, settle, next, stop } = useRoundCore<TaalSet, TaalVraag, TaalItem, string>({
    setId,
    moduleId: 'woorden',
    mode,
    basisRegel: TAAL_ROUND_RULE[mode],
    // Een diploma heeft zijn eigen lengte en zegt niets tot het eind: het is
    // de toets aan het eind van het oefenen (ADR-168).
    aantal: isDiplomaVorm(mode) ? null : aantal,
    toetsstand: toetsstand || isDiplomaVorm(mode),
    itemVan,
    stel: (states, rule) => {
      const set = loadTaalSet(setId);
      if (!set) throw new Error(`Onbekende taalset: ${setId}`);

      const kies = <T extends Schedulable>(items: readonly T[]): T[] =>
        kiesVragen(items, states, rule, alleen, isTaalFouten(setId));

      const questions: TaalVraag[] =
        set.deel === 'spelling'
          ? kies(set.items).map((item): TaalVraag => ({
              soort: 'spelling',
              item,
              opties: typen ? null : letterOpties(item),
            }))
          : kies(set.items).map((item): TaalVraag => ({
              soort: 'werkwoord',
              item,
              opties: typen ? null : werkwoordOpties(item, sterkeWerkwoorden()),
            }));

      const items: readonly TaalItem[] = set.items;
      return { set, itemIds: items.map((item) => item.id), questions };
    },
  });

  const vraag = kern.question;

  /** A letter piece or a form, chosen. Either way it is one of the options. */
  const choose = useCallback(
    (optie: string) => {
      if (!vraag) return;
      const correct = optie === goedAntwoord(vraag, false);
      settle({ correct, given: optie, recorded: correct ? null : optie });
    },
    [vraag, settle],
  );

  /** A word or a form, typed, and judged strictly (ADR-118). */
  const submit = useCallback(
    (getypt: string) => {
      if (!vraag) return;
      const oordeel = beoordeelWoord(getypt, goedAntwoord(vraag, true));
      settle({
        correct: oordeel.goed,
        given: oordeel.getypt,
        recorded: oordeel.goed ? null : oordeel.getypt,
      });
    },
    [vraag, settle],
  );

  /** "Ik weet het niet": scored as not known, and it costs no life (ADR-048). */
  const giveUp = useCallback(
    () => settle({ correct: false, given: null, recorded: 'weet-niet', spendsALife: false }),
    [settle],
  );

  const state: TaalRoundState = { ...kern, mode };
  return { state, choose, submit, giveUp, next, stop };
}

/**
 * Which items a round asks: the last round's misses where it repeats them, the
 * child's own mistakes on "Oefen je fouten", and otherwise the scheduler's
 * pick from the set — due work first (ADR-005).
 */
function kiesVragen<T extends Schedulable>(
  items: readonly T[],
  states: ReadonlyMap<string, ItemState>,
  rule: RoundRule,
  alleen: readonly string[] | null,
  fouten: boolean,
): T[] {
  const basis = alleen ? alleenDeze(alleen, items) : items;
  const pool = fouten && !alleen ? metFouten(basis, states) : basis;
  return composeRound({
    items: pool,
    states,
    size: rule.kind === 'fixed' ? rule.aantal : pool.length,
    now: new Date(),
  });
}
