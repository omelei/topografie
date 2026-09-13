import type { SumItem, SumSet } from '@/game-core';

/**
 * Rekenen's content, at build time: twelve tables, and every other kind of sum
 * in ranges — keersommen and deelsommen to 10, 100 and 1000, plus and minus to
 * 20, 100 and 1000, splitsen to 10, 20 and 100, and halveren and verdubbelen to
 * 20, 100 and 1000 (ADR-120).
 *
 * Bundled like the geography sets and unlike the geometry: five hundred sums is
 * a few kilobytes, and a round has to be able to start without waiting for
 * anything.
 *
 * Written by tools/content/build-rekenen.mjs. Generated, so a hand correction
 * here is lost at the next run — and `sums.content.test.ts` works every entry
 * back out, which is what stands in for an editor.
 *
 * **The mixes are not files.** "Alle tafels door elkaar" and the Rekenmix are
 * the union of the sets above, composed here from the same items, so answering
 * 7 × 8 in a mix moves the same Leitner box as answering it in the table. A
 * mix written out as its own file would have had to give those sums second ids,
 * and a child would then have had to learn every table twice over to fill both
 * (ADR-062).
 */

const tafelModules = import.meta.glob<{ default: SumSet }>('../../content/tafels/*.json', {
  eager: true,
});
const somModules = import.meta.glob<{ default: SumSet }>('../../content/sommen/*.json', {
  eager: true,
});

/**
 * The ids of the sets that are unions rather than files.
 *
 * The Rekenmix comes in three difficulties and an everything, and they are not
 * a new idea: every set already carries a `niveau`, which decided the order the
 * tables are offered in and nothing else. It decides this too now — a mix of
 * level one is the tables with a rule you can say out loud, plus and minus to
 * twenty, and the divisions that mirror those tables (ADR-073). A child who
 * picks "makkelijk" gets sums they can do; a child who picks "pittig" asked
 * for it.
 */
export const MIX_IDS = [
  'tafels-alle',
  'deel-alle',
  'rekenmix-1',
  'rekenmix-2',
  'rekenmix-3',
  'rekenmix',
  // Everything, narrowed at the moment a round starts to the sums this child
  // has actually got wrong (ADR-078). It holds them all here because a set is
  // a list of sums and a child's mistakes are not a property of the content —
  // `useSumRound` reads the boxes and filters, which is also the only way the
  // list can be right rather than as right as it was when the page loaded.
  'fouten',
  // "Keersommen tot 10" (ADR-120): the table sums whose answer is ten at most.
  // Those are 2 × 3 and 5 × 2, which already have a Leitner box under their
  // table's id — so this is a union of the same items, like every mix, and
  // never a file that would give 2 × 3 a second box to fill.
  'keer-10',
] as const;
export type MixId = (typeof MIX_IDS)[number];

function bestanden(): SumSet[] {
  return [...Object.values(tafelModules), ...Object.values(somModules)].map(
    (module) => module.default,
  );
}

/**
 * The ceiling of a range — the number at the end of its id, "100" of
 * `delen-100`. Read as a number rather than as text, because "plus-1000" sorts
 * between "plus-100" and "plus-20" in every alphabet there is, and a child
 * offered 100, 1000, 20 in that order is looking at a bug.
 */
function grensVan(set: SumSet): number {
  return Number(/-(\d+)$/.exec(set.id)?.[1] ?? 0);
}

/**
 * Every set that is a file, in the order a child meets them: tables first by
 * table, then every other kind by range, in the order the subjects stand.
 *
 * Ordered here rather than left to the filenames, which sort `tafel-10` before
 * `tafel-2` and would offer a child the tables in an order nobody teaches.
 */
export function loadSumSets(): SumSet[] {
  const rang: Record<string, number> = {
    keer: 0,
    delen: 1,
    plus: 2,
    min: 3,
    splitsen: 4,
    halveren: 5,
    verdubbelen: 6,
  };
  // Which table, or which ceiling.
  const orde = (set: SumSet) => set.tafel ?? grensVan(set);

  return bestanden().sort(
    (a, b) => (rang[a.op ?? ''] ?? 9) - (rang[b.op ?? ''] ?? 9) || orde(a) - orde(b),
  );
}

function unie(id: MixId, sets: readonly SumSet[]): SumSet {
  return {
    id,
    op: null,
    tafel: null,
    niveau: 1,
    contentVersie: sets[0]?.contentVersie ?? '',
    items: sets.flatMap((set) => set.items),
  };
}

/**
 * The sets a mix draws from. `null` for a set that is a file, which draws from
 * itself.
 */
function mixLeden(id: MixId, alles: readonly SumSet[]): SumSet[] {
  // The tables and not the keersommen past them, which are `keer` too. No page
  // offers this mix any more (ADR-100); it is kept so an address and a round
  // played on it still have something to name.
  if (id === 'tafels-alle') return alles.filter((set) => set.op === 'keer' && set.tafel !== null);
  if (id === 'deel-alle') return alles.filter((set) => set.op === 'delen');

  const niveau = /^rekenmix-(\d)$/.exec(id)?.[1];
  if (niveau) return alles.filter((set) => set.niveau === Number(niveau));

  return [...alles];
}

export function isMix(id: string): id is MixId {
  return (MIX_IDS as readonly string[]).includes(id);
}

/** "Keersommen tot 10": every table sum whose answer is ten at most. */
function keerTotTien(alles: readonly SumSet[]): SumSet {
  const tafels = alles.filter((set) => set.op === 'keer' && set.tafel !== null);
  return {
    id: 'keer-10',
    op: 'keer',
    tafel: null,
    niveau: 1,
    contentVersie: tafels[0]?.contentVersie ?? '',
    items: tafels.flatMap((set) => set.items).filter((sum) => sum.antwoord <= 10),
  };
}

export function loadSumSet(id: string): SumSet | undefined {
  const alles = loadSumSets();
  if (id === 'keer-10') return keerTotTien(alles);
  if (isMix(id)) {
    return unie(id, mixLeden(id, alles));
  }
  return alles.find((set) => set.id === id);
}

/**
 * The pool a round without a fixed length draws from: everything of the same
 * kind as the set that was chosen, and never past what its name promises.
 *
 * Ten sums is over long before a minute is, so a lightning round of the table
 * of seven has to reach past those ten. It reaches to the other tables and no
 * further — a child who asks for a minute of tables should not be handed
 * "845 − 140" halfway through, nor "9 × 96", which is `keer` too (ADR-100).
 *
 * A range reaches the ranges of its own kind below it and stops at its own
 * ceiling (ADR-120). "Tot 100" is a promise about every sum on the card, and a
 * minute of it that handed a child "864 : 9" would break it on the one screen
 * where nobody is checking. A mix already spans everything it means to, so it
 * draws from itself — and so does "keersommen tot 10", which is one.
 */
export function sumPool(id: string): readonly SumItem[] {
  const alles = loadSumSets();
  if (isMix(id)) return loadSumSet(id)?.items ?? [];

  const set = alles.find((candidate) => candidate.id === id);
  if (!set) return [];

  const tafel = set.tafel !== null;
  const grens = grensVan(set);
  return alles
    .filter((candidate) => candidate.op === set.op && (candidate.tafel !== null) === tafel)
    .filter((candidate) => tafel || grensVan(candidate) <= grens)
    .flatMap((candidate) => candidate.items);
}
