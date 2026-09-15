import {
  diplomaFor,
  kaartVanDiploma,
  klokDiplomaFor,
  klokVanDiploma,
  newStamps,
  tableOfDiploma,
  topoDiplomaFor,
  vlagDiplomaFor,
  werelddeelVanDiploma,
  type DiplomaWerelddeel,
  type KlokDiplomaSet,
  type RewardSnapshot,
  type StampId,
  type TopoDiplomaSet,
} from '@/game-core';
import { getDb } from './db';
import { activeChildId, ensureProgressPerChild } from './children';
import { kistenOpenstaand } from './heldenStore';

/**
 * XP, coins, travel stamps, stars and chests, on the device.
 *
 * The object store is still called `badges` and its key is still `badgeId`.
 * That is the one thing here that does not follow the rename: the storage holds
 * what children have already earned, and a schema rename to tidy up a word
 * would be a migration risking real rows for no gain a child can see.
 *
 * Nothing here can be bought, granted by waiting, or decided by chance, and
 * every one of these is reachable only by practising. ADR-096 made which hero
 * is in a chest a draw; ADR-097 takes it back out, so there is no random number
 * anywhere in this path — see `game-core/helden.ts`.
 */

export interface RoundOutcome {
  readonly stamps: readonly StampId[];
  /** The table this round earned a diploma for, or null. */
  readonly diploma: number | null;
  /** The werelddeel this round earned a vlaggendiploma for, or null (ADR-104). */
  readonly vlagDiploma: DiplomaWerelddeel | null;
  /** The step of the clock this round earned a klokdiploma for, or null (ADR-117). */
  readonly klokDiploma: KlokDiplomaSet | null;
  /** The map this round earned a topodiploma for, or null (ADR-117). */
  readonly topoDiploma: TopoDiplomaSet | null;
  /**
   * Chests this round paid for that nobody has chosen from yet. Almost always
   * none; one when the round crossed a fifty.
   *
   * A count rather than a list of what came out, because since ADR-097 nothing
   * comes out until the child picks one of three — and that happens on the
   * screen this number is handed to, not before it is drawn.
   */
  readonly kistenTeGoed: number;
}

export async function loadStamps(): Promise<Set<string>> {
  await ensureProgressPerChild();

  const db = await getDb();
  const kindId = await activeChildId();
  const rows = await db.getAll('kindBadges', IDBKeyRange.bound([kindId], [kindId, []]));
  return new Set(rows.map((row) => row.badgeId));
}

/**
 * The tables this child has a diploma for.
 *
 * Read from the same store the stamps are in, filtered by the shape of the id
 * rather than by a second store.
 */
export async function loadDiplomas(): Promise<Set<number>> {
  const held = await loadStamps();
  const tafels = new Set<number>();
  for (const id of held) {
    const tafel = tableOfDiploma(id);
    if (tafel !== null) tafels.add(tafel);
  }
  return tafels;
}

/** The werelddelen this child has a vlaggendiploma for, from the same store. */
export async function loadVlagDiplomas(): Promise<Set<DiplomaWerelddeel>> {
  const held = await loadStamps();
  const delen = new Set<DiplomaWerelddeel>();
  for (const id of held) {
    const deel = werelddeelVanDiploma(id);
    if (deel !== null) delen.add(deel);
  }
  return delen;
}

/** The steps of the clock this child has a klokdiploma for, from the same store. */
export async function loadKlokDiplomas(): Promise<Set<KlokDiplomaSet>> {
  const held = await loadStamps();
  const stappen = new Set<KlokDiplomaSet>();
  for (const id of held) {
    const stap = klokVanDiploma(id);
    if (stap !== null) stappen.add(stap);
  }
  return stappen;
}

/** The maps this child has a topodiploma for, from the same store. */
export async function loadTopoDiplomas(): Promise<Set<TopoDiplomaSet>> {
  const held = await loadStamps();
  const kaarten = new Set<TopoDiplomaSet>();
  for (const id of held) {
    const kaart = kaartVanDiploma(id);
    if (kaart !== null) kaarten.add(kaart);
  }
  return kaarten;
}

/**
 * Applies a finished round: adds what was earned, awards any stamp the round
 * newly satisfies, and reports all of it — including any chest the round paid
 * for — so the result screen can say so and lay the chest out.
 */
export async function applyRoundRewards(params: {
  readonly correct: number;
  readonly snapshot: RewardSnapshot;
}): Promise<RoundOutcome> {
  const db = await getDb();
  const kindId = await activeChildId();

  const held = await loadStamps();
  const earned = newStamps(params.snapshot, held);
  const behaaldOp = new Date().toISOString();
  for (const badgeId of earned) {
    await db.put('kindBadges', { kindId, badgeId, behaaldOp });
  }

  // The diploma, if this round was one and it was flawless. Reported even when
  // the child already had it: a child who sits the test again and passes again
  // has passed again.
  const diplomaId = diplomaFor(params.snapshot);
  if (diplomaId !== null) {
    await db.put('kindBadges', { kindId, badgeId: diplomaId, behaaldOp });
  }
  // And the vlaggendiploma, beside it and in the same store (ADR-104).
  const vlagDiplomaId = vlagDiplomaFor(params.snapshot);
  if (vlagDiplomaId !== null) {
    await db.put('kindBadges', { kindId, badgeId: vlagDiplomaId, behaaldOp });
  }
  // The klokdiploma and the topodiploma, the same way (ADR-117).
  const klokDiplomaId = klokDiplomaFor(params.snapshot);
  if (klokDiplomaId !== null) {
    await db.put('kindBadges', { kindId, badgeId: klokDiplomaId, behaaldOp });
  }
  const topoDiplomaId = topoDiplomaFor(params.snapshot);
  if (topoDiplomaId !== null) {
    await db.put('kindBadges', { kindId, badgeId: topoDiplomaId, behaaldOp });
  }

  // De sterren stonden hier ook, als `erbij` en `inKist`, en ze werden door
  // geen enkel scherm gelezen — de derde keer dat dit product iets uitrekende
  // dat nergens terechtkwam, na de munten en de XP van ADR-130. Ze zijn weg.
  // Wat een ster is en wanneer hij valt, staat nu waar het gebeurt: in de ronde
  // zelf (`features/round/ster.ts`) en op het uitslagscherm, waar de kist zijn
  // eigen vooruitzicht rekent uit dezelfde tellerstand.
  return {
    stamps: earned,
    diploma: diplomaId === null ? null : tableOfDiploma(diplomaId),
    vlagDiploma: vlagDiplomaId === null ? null : werelddeelVanDiploma(vlagDiplomaId),
    klokDiploma: klokDiplomaId === null ? null : klokVanDiploma(klokDiplomaId),
    topoDiploma: topoDiplomaId === null ? null : kaartVanDiploma(topoDiplomaId),
    kistenTeGoed: await kistenOpenstaand(),
  };
}
