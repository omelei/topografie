import type { ItemState, ModeId } from '@/game-core';
import { getDb, SINGLETON_KEY, type AttemptRecord, type SessionRecord } from './db';
import { activeChildId, ensureProgressPerChild } from './children';
import { recordAnswerFlawless } from './streakStore';

/**
 * Reading and writing what a child has learned.
 *
 * Everything here writes to the device and nowhere else. The shapes match the
 * future server tables (DATAMODEL part A), so adding accounts one day is an
 * upload rather than a migration — including `sessions.itemSet`, which nothing
 * validates yet but which the server will need to re-score against (ADR-003).
 *
 * Which child is answering is resolved here and not by the caller. Every screen
 * asks for "the boxes" and gets the ones belonging to whoever is practising,
 * which is the only version of this that cannot be got wrong by forgetting.
 */

export async function loadItemStates(): Promise<Map<string, ItemState>> {
  await ensureProgressPerChild();

  const db = await getDb();
  const kindId = await activeChildId();
  const rows = await db.getAll('progress', IDBKeyRange.bound([kindId], [kindId, []]));
  return new Map(rows.map((row) => [row.itemId, row]));
}

export async function saveItemState(state: ItemState): Promise<void> {
  const db = await getDb();
  await db.put('progress', { ...state, kindId: await activeChildId() });
}

export async function startSession(
  mode: ModeId,
  itemIds: readonly string[],
  setId: string,
): Promise<string> {
  const db = await getDb();
  const session: SessionRecord = {
    id: crypto.randomUUID(),
    kindId: await activeChildId(),
    mode,
    setId,
    itemSet: [...itemIds],
    score: null,
    gestart: new Date().toISOString(),
    geeindigd: null,
  };
  await db.put('sessions', session);
  return session.id;
}

/**
 * @param score     how many were right
 * @param answered  how many were asked and answered, which is not the same as
 *                  how many the round set out to ask — a round can be stopped
 *                  early. Without it a mark cannot be worked out afterwards.
 */
export async function finishSession(id: string, score: number, answered: number): Promise<void> {
  const db = await getDb();
  const existing = await db.get('sessions', id);
  if (!existing) return;
  await db.put('sessions', {
    ...existing,
    score,
    beantwoord: answered,
    geeindigd: new Date().toISOString(),
  });
}

/** One finished round, as K1's history and its favourites read it back. */
export interface PlayedRound {
  readonly mode: ModeId;
  /** Which set it was about, or null on a round played before ADR-063. */
  readonly setId: string | null;
  /** The questions it asked, so a caller can work out which set they came from. */
  readonly itemIds: readonly string[];
  readonly correct: number;
  readonly answered: number;
  readonly at: string;
}

/**
 * Every finished round this child has played, newest first.
 *
 * Rounds nobody answered a question in are left out. They happened — a child
 * opened a round and closed it — but they are not practice, and a history that
 * counted them would report a mark for a round that was never played.
 *
 * The whole list rather than a page of it: this is one device's own rounds, it
 * is read once when the front door opens, and every caller wants a different
 * slice of it — the last three, or the most-played four. Cutting it here would
 * mean cutting it twice.
 */
export async function loadPlayedRounds(): Promise<PlayedRound[]> {
  const db = await getDb();
  const kindId = await activeChildId();

  const played: PlayedRound[] = [];

  for (const session of await db.getAll('sessions')) {
    // Rows written before ADR-046 carry no child at all, and they belong to
    // the first one — the same fallback activeChildId() makes.
    if ((session.kindId ?? SINGLETON_KEY) !== kindId) continue;
    if (session.geeindigd === null || session.score === null) continue;

    const itemIds: readonly string[] = Array.isArray(session.itemSet)
      ? (session.itemSet as string[])
      : [];
    const answered = session.beantwoord ?? itemIds.length;
    if (answered === 0) continue;

    played.push({
      mode: session.mode,
      setId: session.setId ?? null,
      itemIds,
      correct: session.score,
      answered,
      at: session.geeindigd,
    });
  }

  return played.sort((a, b) => b.at.localeCompare(a.at));
}

/**
 * A round that was started and not finished: stopped halfway, or left when the
 * tab closed (ADR-115). What the front door's "Maak af" row offers.
 */
export interface OpenRound {
  readonly mode: ModeId;
  readonly setId: string | null;
  /** Everything the round set out to ask, in its order. */
  readonly itemIds: readonly string[];
  /** What it had not asked yet — which is what "maak af" asks. */
  readonly rest: readonly string[];
  readonly beantwoord: number;
  readonly totaal: number;
  /** When the last of its answers was given. */
  readonly at: string;
}

/**
 * The ways that cannot be finished later, because they have no end to reach or
 * because finishing them later would be a different thing. A minute and three
 * lives end when they end. Exploring asks nothing. A diploma sat in two halves
 * on two days is not the test it certifies, and the tafeldiploma stops at the
 * first mistake on purpose — a stopped one is a finished one.
 */
export const NIET_AF_TE_MAKEN: ReadonlySet<ModeId> = new Set<ModeId>([
  'bliksemronde',
  'overleven',
  'ontdekken',
  'tafeldiploma',
  'vlag-diploma',
  'klok-diploma',
  'topo-diploma',
]);

/** A round left longer ago than this is not unfinished any more; it is over. */
export const OPEN_DAGEN = 30;

const DAG_MS = 86_400_000;

/**
 * Every round this child started and did not finish, newest first.
 *
 * What was answered is read from the attempts, not from the session: a round
 * left by closing the tab never wrote how far it got, and every answer it did
 * get is already on the device (see `saveAnswer`).
 *
 * **Only the latest round of each set and way counts.** A child who stopped the
 * provinces halfway on Monday and pointed at all twelve on Tuesday has nothing
 * left to finish, and a round picked up again from here is itself the latest.
 * A round nobody answered a question in was opened, not started, and it does
 * not hide an older one that was.
 */
export async function loadOpenRounds(now: Date = new Date()): Promise<OpenRound[]> {
  const db = await getDb();
  const kindId = await activeChildId();

  const perSessie = new Map<string, { readonly ids: Set<string>; laatste: string }>();
  for (const attempt of await db.getAll('attempts')) {
    if ((attempt.kindId ?? SINGLETON_KEY) !== kindId) continue;
    const gezien = perSessie.get(attempt.sessionId) ?? { ids: new Set<string>(), laatste: '' };
    gezien.ids.add(attempt.itemId);
    if (attempt.tijdstip > gezien.laatste) gezien.laatste = attempt.tijdstip;
    perSessie.set(attempt.sessionId, gezien);
  }

  const sessies = (await db.getAll('sessions'))
    .filter((session) => (session.kindId ?? SINGLETON_KEY) === kindId)
    .sort((a, b) => b.gestart.localeCompare(a.gestart));

  const grens = now.getTime() - OPEN_DAGEN * DAG_MS;
  const gehad = new Set<string>();
  const open: OpenRound[] = [];

  for (const session of sessies) {
    const antwoorden = perSessie.get(session.id);
    if (!antwoorden || antwoorden.ids.size === 0) continue;

    const sleutel = `${session.setId ?? ''}|${session.mode}`;
    if (gehad.has(sleutel)) continue;
    gehad.add(sleutel);

    if (NIET_AF_TE_MAKEN.has(session.mode)) continue;
    if (new Date(antwoorden.laatste).getTime() < grens) continue;

    const itemIds: readonly string[] = Array.isArray(session.itemSet)
      ? (session.itemSet as string[])
      : [];
    const rest = itemIds.filter((id) => !antwoorden.ids.has(id));
    if (rest.length === 0) continue;

    open.push({
      mode: session.mode,
      setId: session.setId ?? null,
      itemIds,
      rest,
      beantwoord: itemIds.length - rest.length,
      totaal: itemIds.length,
      at: antwoorden.laatste,
    });
  }

  return open.sort((a, b) => b.at.localeCompare(a.at));
}

/**
 * Every answer this child has ever given, as one fraction.
 *
 * Counted over attempts rather than over rounds, because that is where an
 * answer is actually recorded and it is the only version that stays true when
 * a round is stopped early.
 *
 * It is not a retention figure and must never be worded as one: this is what
 * has been answered correctly, over everything, ever. It goes up slowly, it
 * never resets, and that is the point — it is the one number on K1 that is
 * about the whole of the work rather than about today.
 */
export interface Accuracy {
  readonly correct: number;
  readonly answered: number;
}

export async function loadAccuracy(): Promise<Accuracy> {
  const db = await getDb();
  const kindId = await activeChildId();

  let correct = 0;
  let answered = 0;

  for (const attempt of await db.getAll('attempts')) {
    if ((attempt.kindId ?? SINGLETON_KEY) !== kindId) continue;
    answered++;
    if (attempt.correct) correct++;
  }

  return { correct, answered };
}

/**
 * Every answer this child gave, as when and whether it was right: what the
 * Onthouden page draws week by week (ADR-148). Nothing else of the attempt —
 * not what was chosen, not how long it took.
 */
export async function loadAntwoorden(): Promise<{ tijdstip: string; correct: boolean }[]> {
  const db = await getDb();
  const kindId = await activeChildId();

  return (await db.getAll('attempts'))
    .filter((attempt) => (attempt.kindId ?? SINGLETON_KEY) === kindId)
    .map((attempt) => ({ tijdstip: attempt.tijdstip, correct: attempt.correct }));
}

export async function recordAttempt(attempt: Omit<AttemptRecord, 'id'>): Promise<void> {
  const db = await getDb();
  await db.add('attempts', attempt as AttemptRecord);
}

/**
 * One answer, written as one unit: the attempt for the report, and the item's
 * new Leitner state for the next round. They are saved together because a
 * scheduler that disagrees with the history is worse than either alone.
 */
export async function saveAnswer(params: {
  readonly sessionId: string;
  readonly mode: ModeId;
  readonly itemId: string;
  readonly correct: boolean;
  readonly responseMs: number;
  readonly chosen: string | null;
  readonly nextState: ItemState;
}): Promise<void> {
  await recordAttempt({
    sessionId: params.sessionId,
    kindId: await activeChildId(),
    itemId: params.itemId,
    mode: params.mode,
    correct: params.correct,
    responseMs: params.responseMs,
    gekozenAntwoord: params.chosen,
    tijdstip: new Date().toISOString(),
  });
  await saveItemState(params.nextState);
  // Every answer in the product passes through here, which is why the run of
  // correct answers is counted here and not in the two round hooks (ADR-072).
  // Counting it in both would be two places to forget the third module.
  await recordAnswerFlawless(params.correct);
}
