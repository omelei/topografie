import {
  diplomaFor,
  isDiplomaVorm,
  kaartVanDiploma,
  klokDiplomaFor,
  klokVanDiploma,
  rekenDiplomaFor,
  rekenSetVanDiploma,
  taalDiplomaFor,
  taalSetVanDiploma,
  tableOfDiploma,
  topoDiplomaFor,
  vlagDiplomaFor,
  werelddeelVanDiploma,
  type DiplomaWerelddeel,
  type KlokDiplomaSet,
  type RewardSnapshot,
  type TopoDiplomaSet,
} from '@/game-core';
import { getDb } from './db';
import { activeChildId, ensureProgressPerChild } from './children';

/**
 * Diploma's, on the device.
 *
 * The object store is still called `kindBadges` and its key is still `badgeId`.
 * Badges shared it until ADR-149 took them out; a child who earned one still
 * has the row, and nothing reads it. A schema rename to tidy up a word would be
 * a migration risking real rows for no gain a child can see.
 *
 * Nothing here can be bought, granted by waiting, or decided by chance.
 */

export interface RoundOutcome {
  /** The table this round earned a diploma for, or null. */
  readonly diploma: number | null;
  /** De rekenset waar dit diploma over ging, als set-id, of null (ADR-168). */
  readonly rekenDiploma: string | null;
  /** De taalset waar dit diploma over ging, als set-id, of null (ADR-168). */
  readonly taalDiploma: string | null;
  /** The werelddeel this round earned a vlaggendiploma for, or null (ADR-104). */
  readonly vlagDiploma: DiplomaWerelddeel | null;
  /** The step of the clock this round earned a klokdiploma for, or null (ADR-117). */
  readonly klokDiploma: KlokDiplomaSet | null;
  /** The map this round earned a topodiploma for, or null (ADR-117). */
  readonly topoDiploma: TopoDiplomaSet | null;
  /**
   * A diploma round on a page that was not ripe yet (ADR-149): proefzwemmen.
   * `gehaald` when the round itself was good enough, `niet` when it was not,
   * null for every other round and for a diploma sat on a ripe page.
   */
  readonly proef: 'gehaald' | 'niet' | null;
}

/** A diploma this child holds, and the day it was first earned. */
export interface DiplomaRij {
  readonly id: string;
  readonly behaaldOp: string;
}

/** Every diploma this child holds, oldest first. Old badge rows are left out. */
export async function loadDiplomaRijen(): Promise<DiplomaRij[]> {
  await ensureProgressPerChild();

  const db = await getDb();
  const kindId = await activeChildId();
  const rows = await db.getAll('kindBadges', IDBKeyRange.bound([kindId], [kindId, []]));
  return rows
    .filter((row) => row.badgeId.startsWith('diploma-'))
    .map((row) => ({ id: row.badgeId, behaaldOp: row.behaaldOp }))
    .sort((a, b) => a.behaaldOp.localeCompare(b.behaaldOp));
}

/** The ids of every diploma this child holds. */
export async function loadBehaald(): Promise<Set<string>> {
  return new Set((await loadDiplomaRijen()).map((rij) => rij.id));
}

/** The tables this child has a diploma for, by the shape of the id. */
export async function loadDiplomas(): Promise<Set<number>> {
  const tafels = new Set<number>();
  for (const id of await loadBehaald()) {
    const tafel = tableOfDiploma(id);
    if (tafel !== null) tafels.add(tafel);
  }
  return tafels;
}

/** The werelddelen this child has a vlaggendiploma for. */
export async function loadVlagDiplomas(): Promise<Set<DiplomaWerelddeel>> {
  const delen = new Set<DiplomaWerelddeel>();
  for (const id of await loadBehaald()) {
    const deel = werelddeelVanDiploma(id);
    if (deel !== null) delen.add(deel);
  }
  return delen;
}

/** The steps of the clock this child has a klokdiploma for. */
export async function loadKlokDiplomas(): Promise<Set<KlokDiplomaSet>> {
  const stappen = new Set<KlokDiplomaSet>();
  for (const id of await loadBehaald()) {
    const stap = klokVanDiploma(id);
    if (stap !== null) stappen.add(stap);
  }
  return stappen;
}

/** The maps this child has a topodiploma for. */
export async function loadTopoDiplomas(): Promise<Set<TopoDiplomaSet>> {
  const kaarten = new Set<TopoDiplomaSet>();
  for (const id of await loadBehaald()) {
    const kaart = kaartVanDiploma(id);
    if (kaart !== null) kaarten.add(kaart);
  }
  return kaarten;
}

/**
 * Applies a finished round: writes any diploma it earned and reports it.
 *
 * **Only on a ripe page** (ADR-149). A diploma used to be one round, which a
 * child could cram for in ten minutes and hold for ever. Now the page has to
 * be ripe when the round starts — nine in ten of it remembered, a table all of
 * it (ADR-141) — and the round is the afzwemmen on top. A round sat before
 * that is proefzwemmen: it says how it went and writes nothing.
 *
 * **The first day stays** (ADR-149). A child who sits a diploma again and
 * passes again has passed again, and the result screen says so; but the date
 * on the diploma is the day it was first earned, which is also the season its
 * bijhoudstempels count from. Writing the row again overwrote that date.
 */
export async function applyRoundRewards(params: {
  readonly snapshot: RewardSnapshot;
  /** Whether the page of this round was ripe when the round began. */
  readonly rijp: boolean;
}): Promise<RoundOutcome> {
  const db = await getDb();
  const kindId = await activeChildId();
  const behaaldOp = new Date().toISOString();

  const bewaar = async (badgeId: string | null) => {
    if (badgeId === null) return;
    if (await db.get('kindBadges', [kindId, badgeId])) return;
    await db.put('kindBadges', { kindId, badgeId, behaaldOp });
  };

  const diplomaId = diplomaFor(params.snapshot);
  const rekenDiplomaId = rekenDiplomaFor(params.snapshot);
  const vlagDiplomaId = vlagDiplomaFor(params.snapshot);
  const klokDiplomaId = klokDiplomaFor(params.snapshot);
  const topoDiplomaId = topoDiplomaFor(params.snapshot);
  const taalDiplomaId = taalDiplomaFor(params.snapshot);
  const alle = [
    diplomaId,
    rekenDiplomaId,
    vlagDiplomaId,
    klokDiplomaId,
    topoDiplomaId,
    taalDiplomaId,
  ];

  if (!params.rijp && isDiplomaVorm(params.snapshot.mode)) {
    return {
      diploma: null,
      rekenDiploma: null,
      vlagDiploma: null,
      klokDiploma: null,
      topoDiploma: null,
      taalDiploma: null,
      proef: alle.some((id) => id !== null) ? 'gehaald' : 'niet',
    };
  }

  for (const id of alle) await bewaar(id);

  return {
    diploma: diplomaId === null ? null : tableOfDiploma(diplomaId),
    rekenDiploma: rekenDiplomaId === null ? null : rekenSetVanDiploma(rekenDiplomaId),
    vlagDiploma: vlagDiplomaId === null ? null : werelddeelVanDiploma(vlagDiplomaId),
    klokDiploma: klokDiplomaId === null ? null : klokVanDiploma(klokDiplomaId),
    topoDiploma: topoDiplomaId === null ? null : kaartVanDiploma(topoDiplomaId),
    taalDiploma: taalDiplomaId === null ? null : taalSetVanDiploma(taalDiplomaId),
    proef: null,
  };
}
