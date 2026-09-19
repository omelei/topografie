import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  emptyState,
  levertSteen,
  review,
  steenStapVan,
  type ItemState,
  type ModeId,
  type RoundRule,
  type Schedulable,
  type SteenStap,
  type Vak,
} from '@/game-core';
import { finishSession, loadItemStates, saveAnswer, startSession } from '@/store/progress';
import { usePreferences } from '@/features/player/settings';
import { rijpVoorDiploma } from '@/features/badges/rijp';
import { voegStenenToe, type TorenGroei } from '@/store/torenStore';
import { speelUitkomst } from './geluid';
import { applyRoundRewards, type RoundOutcome } from '@/store/rewardStore';

/**
 * The bookkeeping of a round, once, for every module that asks one question at
 * a time on a stage of its own.
 *
 * ADR-092 wrote this down as owed: the tables and the clock each carried the
 * same hundred lines between composing a round and handing out its rewards —
 * the index, the phase, the counts, the lives, the clock, the
 * toetsstand, the session record — and a fourth module would have made it four.
 * What a module still owns is the question: which items, in which order, with
 * which options, and how an answer is judged. It hands the core a composed
 * round and a verdict per answer; the core does the rest the same way for all
 * of them (ADR-101).
 *
 * The map's round is not on it, and that is a decision rather than a gap. It
 * answers on layers, judges near misses and draws a mix across sets, and those
 * are threaded through its bookkeeping rather than beside it. Moving it here
 * would be a change to the most-used round in the product for no child-visible
 * gain.
 */

export type RondeFase = 'loading' | 'asking' | 'revealed' | 'finished';

/** What a module hands the core once it knows what the round will ask. */
export interface RondeOpzet<S, Q> {
  readonly set: S;
  /**
   * The set's own items. "Gained" and the rewards count over these and never
   * over a wider pool: a minute of tables that reached into all twelve still
   * reports what moved in the one that was chosen.
   */
  readonly itemIds: readonly string[];
  readonly questions: readonly Q[];
}

export interface RondeKernOpties<S, Q, T extends Schedulable> {
  readonly setId: string;
  /** Het vak, want een steen draagt de kleur van zijn vak (ADR-158). */
  readonly moduleId: string;
  readonly mode: ModeId;
  /**
   * How a round of this way ends when nobody chooses a length. Must be a stable
   * object — a value from a module's rule table — because the round is composed
   * again whenever it changes.
   */
  readonly basisRegel: RoundRule;
  /** The length a child chose, or null. Only replaces a fixed round's own. */
  readonly aantal: number | null;
  readonly toetsstand: boolean;
  /**
   * Composes the round from the boxes. Called once per set, way and rule; may
   * throw, and what it throws is shown rather than crashing the screen.
   */
  readonly stel: (
    states: ReadonlyMap<string, ItemState>,
    rule: RoundRule,
  ) => RondeOpzet<S, Q> | Promise<RondeOpzet<S, Q>>;
  /** The item a question is about. Must be stable: a function at module level. */
  readonly itemVan: (question: Q) => T;
  /** True where one wrong answer ends the round, which is the tafeldiploma. */
  readonly stoptBijFout?: boolean;
}

/** One answer, as the module judged it. */
export interface Beoordeeld<A> {
  readonly correct: boolean;
  /** What the screen quotes back, or null for "ik weet het niet". */
  readonly given: A | null;
  /** What the attempt record stores: null when right, 'weet-niet', or the answer. */
  readonly recorded: string | null;
  /**
   * False only for "ik weet het niet". Every other wrong answer costs a life:
   * three of them are what makes overleven a survival round (ADR-048).
   */
  readonly spendsALife?: boolean;
}

export interface RondeKern<S, Q, T, A> {
  readonly phase: RondeFase;
  readonly set: S | null;
  readonly question: Q | null;
  readonly index: number;
  readonly total: number;
  readonly correctCount: number;
  readonly answeredCount: number;
  readonly given: A | null;
  readonly lastCorrect: boolean;
  /** Wat dit antwoord opleverde: een steen, of niet (ADR-158). */
  readonly steen: SteenStap | null;
  /** De stenen die deze ronde tot nu toe opleverde, op volgorde. */
  readonly stenen: readonly Vak[];
  /** Wat de ronde met de toren deed. Pas gevuld als de ronde klaar is. */
  readonly groei: TorenGroei | null;
  readonly missed: readonly T[];
  readonly rule: RoundRule;
  /** Bliksemronde only: whole seconds left. */
  readonly secondsLeft: number | null;
  /** Overleven only: lives remaining. */
  readonly livesLeft: number | null;
  readonly reward: RoundOutcome | null;
  readonly itemIds: readonly string[];
  /** The boxes as the round found them, and as they are now. */
  readonly statesVoor: ReadonlyMap<string, ItemState>;
  readonly states: ReadonlyMap<string, ItemState>;
  /** Whether this round keeps its answers to itself until the end (ADR-085). */
  readonly toetsstand: boolean;
  readonly error: string | null;
}

export function useRoundCore<S, Q, T extends Schedulable, A>(opties: RondeKernOpties<S, Q, T>) {
  const {
    setId,
    moduleId,
    mode,
    basisRegel,
    aantal,
    toetsstand,
    itemVan,
    stoptBijFout = false,
  } = opties;

  const [set, setSet] = useState<S | null>(null);
  const [itemIds, setItemIds] = useState<readonly string[]>([]);
  const [questions, setQuestions] = useState<readonly Q[]>([]);
  const [states, setStates] = useState<Map<string, ItemState>>(new Map());
  const [statesVoor, setStatesVoor] = useState<ReadonlyMap<string, ItemState>>(new Map());
  const { geluid: geluidAan } = usePreferences();
  const [phase, setPhase] = useState<RondeFase>('loading');
  const [index, setIndex] = useState(0);
  const [given, setGiven] = useState<A | null>(null);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [steen, setSteen] = useState<SteenStap | null>(null);
  const [stenen, setStenen] = useState<readonly Vak[]>([]);
  const [groei, setGroei] = useState<TorenGroei | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [answeredCount, setAnswered] = useState(0);
  const [missed, setMissed] = useState<T[]>([]);
  const [reward, setReward] = useState<RoundOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Memoised: `rule` is a dependency of the effect that composes the round, so
  // a fresh object every render would start a new round on every render.
  const rule = useMemo<RoundRule>(
    () => (aantal !== null && basisRegel.kind === 'fixed' ? { kind: 'fixed', aantal } : basisRegel),
    [basisRegel, aantal],
  );
  const [secondsLeft, setSecondsLeft] = useState(rule.kind === 'tijd' ? rule.seconden : 0);
  const [livesLeft, setLivesLeft] = useState(rule.kind === 'levens' ? rule.levens : 0);

  const sessionId = useRef<string | null>(null);
  const askedAt = useRef(0);
  /**
   * Wall-clock end of a timed round, set once. Counting down on a tick loses
   * whatever each tick was late by, and over sixty seconds on a school
   * Chromebook that is not nothing.
   */
  const deadline = useRef<number | null>(null);

  // The composer is a closure over the module's own arguments and is new every
  // render. It is read at the moment the round is composed rather than being a
  // reason to compose it again.
  const stel = useRef(opties.stel);
  useLayoutEffect(() => {
    stel.current = opties.stel;
  });

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        const loadedStates = await loadItemStates();
        if (cancelled) return;

        const opzet = await stel.current(loadedStates, rule);
        if (cancelled) return;

        sessionId.current = await startSession(
          mode,
          opzet.questions.map((question) => itemVan(question).id),
          setId,
        );
        if (cancelled) return;

        setSet(opzet.set);
        setItemIds(opzet.itemIds);
        setStates(loadedStates);
        setStatesVoor(new Map(loadedStates));
        setQuestions(opzet.questions);
        setPhase(opzet.questions.length > 0 ? 'asking' : 'finished');
        askedAt.current = performance.now();
        if (rule.kind === 'tijd') deadline.current = Date.now() + rule.seconden * 1000;
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause));
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [setId, mode, rule, itemVan]);

  const question = questions[index] ?? null;

  /** One answer, however it arrived: typed, chosen, or not given at all. */
  const settle = useCallback(
    (antwoord: Beoordeeld<A>) => {
      if (phase !== 'asking' || question === null || !sessionId.current) return;

      const item = itemVan(question);
      const { correct } = antwoord;
      const responseMs = Math.round(performance.now() - askedAt.current);
      const previous = states.get(item.id) ?? emptyState(item.id);
      const now = new Date();
      const nextState = review(previous, correct, now);

      setGiven(antwoord.given);
      setLastCorrect(correct);
      // Wat dit antwoord opleverde (ADR-158). De steen wordt hier geteld en niet
      // achteraf uit het verschil afgeleid: een item dat eerst fout was en drie
      // vragen later goed, ziet er in dat verschil uit als een steen terwijl het
      // er geen is — na de fout was het niet meer aan de beurt.
      setSteen(steenStapVan(previous, nextState, correct, now, moduleId));
      if (levertSteen(previous, correct, now)) setStenen((eerdere) => [...eerdere, moduleId]);
      // De snelste terugkoppeling die er is, sneller dan lezen (ADR-134). Niet
      // in een toets: die zegt niets tot het einde, ook niet met een toon.
      speelUitkomst(correct, geluidAan && !toetsstand);
      setPhase('revealed');

      setAnswered(answeredCount + 1);
      if (correct) setCorrectCount(correctCount + 1);
      else setMissed([...missed, item]);

      setStates(new Map(states).set(item.id, nextState));

      if (!correct && antwoord.spendsALife !== false && rule.kind === 'levens') {
        setLivesLeft(livesLeft - 1);
      }

      void saveAnswer({
        sessionId: sessionId.current,
        mode,
        itemId: item.id,
        correct,
        responseMs,
        chosen: antwoord.recorded,
        nextState,
      });
    },
    [
      phase,
      question,
      itemVan,
      states,
      geluidAan,
      toetsstand,
      answeredCount,
      correctCount,
      missed,
      mode,
      rule,
      livesLeft,
      moduleId,
    ],
  );

  const finish = useCallback(() => {
    // The clock, the last life and the stop button can all arrive at once.
    if (phase === 'finished') return;
    setPhase('finished');
    // A round counts even when it was stopped early: the child turned up and
    // did the work. De reeks leest de rondes terug, dus de sessie gaat eerst op
    // papier en pas daarna groeit de toren (ADR-158).
    const opgeslagen = sessionId.current
      ? finishSession(sessionId.current, correctCount, answeredCount)
      : Promise.resolve();
    // De stenen van deze ronde erbij. Dit mag een ronde nooit laten haperen,
    // dus het faalt stil: de toren is de volgende keer weer bij.
    void opgeslagen.then(() => voegStenenToe(stenen)).then(setGroei, () => {});

    void applyRoundRewards({
      snapshot: {
        setId,
        perfectRound: answeredCount > 0 && correctCount === answeredCount,
        completeRound: answeredCount === questions.length,
        setSize: itemIds.length,
        mode,
        correct: correctCount,
      },
      rijp: rijpVoorDiploma(setId, statesVoor, new Date()),
    }).then(setReward);
  }, [phase, correctCount, answeredCount, setId, questions, stenen, statesVoor, itemIds, mode]);

  const next = useCallback(() => {
    if (phase !== 'revealed') return;

    // Out of lives, out of questions, or — where one mistake ends it — out of
    // the attempt. A timed round ends on the clock instead, below.
    if (
      (rule.kind === 'levens' && livesLeft <= 0) ||
      (stoptBijFout && !lastCorrect) ||
      index + 1 >= questions.length
    ) {
      finish();
      return;
    }

    setIndex(index + 1);
    setGiven(null);
    setPhase('asking');
    askedAt.current = performance.now();
  }, [phase, rule, livesLeft, stoptBijFout, lastCorrect, index, questions, finish]);

  /**
   * The clock. Four ticks a second so the number is not up to a second behind
   * what it claims, and it reads the deadline rather than counting down, so a
   * busy frame costs no time.
   *
   * WCAG 2.2.1 wants time limits adjustable, with an exception where the limit
   * is the activity. Here it is: a bliksemronde without a clock is just
   * answering. The ways that teach have no clock at all.
   */
  useEffect(() => {
    if (rule.kind !== 'tijd') return;
    if (phase === 'loading' || phase === 'finished') return;

    const tick = () => {
      const over = Math.max(0, Math.ceil(((deadline.current ?? 0) - Date.now()) / 1000));
      setSecondsLeft(over);
      if (over === 0) finish();
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [rule, phase, finish]);

  /**
   * A timed round moves on by itself: making a child press Volgende while a
   * clock runs is charging them for the button. A wrong answer gets twice as
   * long, because the thing worth seeing is what it actually was.
   */
  useEffect(() => {
    if (toetsstand || rule.kind !== 'tijd' || phase !== 'revealed') return;
    const id = setTimeout(next, lastCorrect ? 900 : 1800);
    return () => clearTimeout(id);
  }, [toetsstand, rule, phase, lastCorrect, next]);

  /**
   * And a toetsstand moves on at once, with nothing shown in between. Before
   * the paint rather than after it: `useEffect` would let the revealed frame
   * reach the screen for a sixtieth of a second, and a green flash nobody can
   * read is worse than either telling a child or not telling them.
   */
  useLayoutEffect(() => {
    if (!toetsstand || phase !== 'revealed') return;
    next();
  }, [toetsstand, phase, next]);

  const kern: RondeKern<S, Q, T, A> = {
    phase,
    set,
    question,
    index,
    total: questions.length,
    correctCount,
    answeredCount,
    given,
    lastCorrect,
    steen,
    stenen,
    groei,
    missed,
    rule,
    secondsLeft: rule.kind === 'tijd' ? secondsLeft : null,
    livesLeft: rule.kind === 'levens' ? livesLeft : null,
    reward,
    itemIds,
    statesVoor,
    states,
    toetsstand,
    error,
  };

  return { kern, settle, next, stop: finish };
}
