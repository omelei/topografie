import { describe, expect, it } from 'vitest';
import { sumDistractors } from '@/game-core/sums';
import { loadSumSet, loadSumSets, MIX_IDS, sumPool } from './loadSums';

/**
 * Rekenen is generated (tools/content/build-rekenen.mjs), and this is what
 * stands in for the editor the geography sets get.
 *
 * A province's name and its weetje are judgements someone has to make and
 * defend, so a person reads them. 7 × 8 = 56 is not a judgement — it is either
 * right or it is a bug that would teach a child something false — so every one
 * of the thousand is worked back out here instead. That trade is available
 * exactly once in this content pipeline and this is the place.
 *
 * What it cannot check is the other half of that file: **which** sums to
 * practise. That is a judgement, it is written out in the generator with the
 * rule that chose it, and a teacher disagreeing with it is a conversation
 * rather than a failing test. What is checked here is that the choice stayed
 * inside the range it claims.
 */

const sets = loadSumSets();
const tafels = sets.filter((set) => set.op === 'keer' && set.tafel !== null);
const keersommen = sets.filter((set) => set.op === 'keer' && set.tafel === null);
const delen = sets.filter((set) => set.op === 'delen');
const plusMin = sets.filter((set) => set.op === 'plus' || set.op === 'min');
const splitsen = sets.filter((set) => set.op === 'splitsen');
const halveren = sets.filter((set) => set.op === 'halveren');
const verdubbelen = sets.filter((set) => set.op === 'verdubbelen');
/** Every set that is a range rather than a table: "tot 100" and its kind. */
const bereiken = sets.filter((set) => set.tafel === null);

/** Every sum there is, counted once. */
const TOTAAL = 1025;

/** The ceiling a range's name promises: 100 of `delen-100`. */
const grensVan = (id: string) => Number(id.split('-')[1]);

/** The biggest number in a sum, which is what "tot 100" is a promise about. */
const grootste = (sum: { links: number; rechts: number; antwoord: number }) =>
  Math.max(sum.links, sum.rechts, sum.antwoord);

describe('the tables', () => {
  it('runs from one to twelve, in order', () => {
    // The app design says so in as many words: "Tafels en klok · Van 1 tot 12".
    expect(tafels.map((set) => set.tafel)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it('gives every table ten sums, which is where a table ends', () => {
    for (const set of tafels) {
      expect(
        set.items.map((sum) => sum.rechts),
        set.id,
      ).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    }
  });

  it('has the right answer to every one of them', () => {
    for (const set of tafels) {
      for (const sum of set.items) {
        expect(sum.antwoord, `${sum.links} × ${sum.rechts}`).toBe(sum.links * sum.rechts);
        expect(sum.links, sum.id).toBe(set.tafel);
        expect(sum.id, sum.id).toBe(`tafel-${sum.links}x${sum.rechts}`);
      }
    }
  });

  it('offers the easiest tables first and the hardest last', () => {
    // The level decides the order the sets are shown in and nothing else.
    const level = (tafel: number) => tafels.find((set) => set.tafel === tafel)?.niveau;

    for (const tafel of [1, 2, 5, 10]) expect(level(tafel), `tafel ${tafel}`).toBe(1);
    for (const tafel of [7, 9, 11, 12]) expect(level(tafel), `tafel ${tafel}`).toBe(3);
  });
});

describe('the keersommen', () => {
  it('comes in two ranges past the tables, as files', () => {
    expect(keersommen.map((set) => set.id)).toEqual(['keer-100', 'keer-1000']);
    expect(keersommen.map((set) => set.items.length)).toEqual([50, 45]);
  });

  it('has a range to ten made of the tables’ own sums, never of copies', () => {
    // 2 × 3 already has a Leitner box under `tafel-2x3`. "Keersommen tot 10"
    // is every table sum with an answer of ten at most, under those ids
    // (ADR-120), so practising it fills the same boxes the tables do.
    const totTien = loadSumSet('keer-10');
    const verwacht = tafels.flatMap((set) => set.items).filter((sum) => sum.antwoord <= 10);

    expect(totTien?.op).toBe('keer');
    expect(totTien?.items.map((sum) => sum.id)).toEqual(verwacht.map((sum) => sum.id));
    expect(totTien?.items).toHaveLength(27);
    for (const sum of totTien?.items ?? []) {
      expect(sum.id.startsWith('tafel-'), sum.id).toBe(true);
      expect(grootste(sum), sum.id).toBeLessThanOrEqual(10);
    }
  });

  it('multiplies every one of them back out', () => {
    for (const set of keersommen) {
      for (const sum of set.items) {
        expect(sum.antwoord, `${sum.links} × ${sum.rechts}`).toBe(sum.links * sum.rechts);
      }
    }
  });

  it('is a number under ten times one past it, and never a table', () => {
    // The small number first, as a schoolbook writes it. A sum that fitted in
    // a table would be a second id for a sum a child already has a box for.
    for (const set of keersommen) {
      for (const sum of set.items) {
        expect(sum.links, sum.id).toBeGreaterThanOrEqual(3);
        expect(sum.links, sum.id).toBeLessThanOrEqual(9);
        expect(sum.rechts, sum.id).toBeGreaterThan(10);
      }
    }
  });
});

describe('the deelsommen', () => {
  it('comes in the keersommen’s three ranges', () => {
    // They were twelve sets, "delen door 7", until ADR-120.
    expect(delen.map((set) => set.id)).toEqual(['delen-10', 'delen-100', 'delen-1000']);
    expect(delen.map((set) => set.items.length)).toEqual([27, 140, 48]);
  });

  it('divides every one of them back out, with nothing left over', () => {
    for (const set of delen) {
      for (const sum of set.items) {
        expect(sum.antwoord * sum.rechts, `${sum.links} : ${sum.rechts}`).toBe(sum.links);
        // Never a remainder and never a division by nothing: both are sums
        // this product has not taught yet and must not hand a child anyway.
        expect(sum.links % sum.rechts, sum.id).toBe(0);
        expect(sum.rechts, sum.id).toBeGreaterThan(0);
      }
    }
  });

  it('keeps every division the tables had, under the id it always had', () => {
    // `deel-56-7` is in the Leitner box of every child who ever divided. The
    // sets were regrouped by the number that is divided; the sums were not
    // renamed, so nothing a child has learned is lost.
    const waar = new Map<string, string[]>();
    for (const set of delen) {
      for (const sum of set.items) waar.set(sum.id, [...(waar.get(sum.id) ?? []), set.id]);
    }

    for (let tafel = 1; tafel <= 12; tafel++) {
      for (let uitkomst = 1; uitkomst <= 10; uitkomst++) {
        const id = `deel-${tafel * uitkomst}-${tafel}`;
        expect(waar.get(id), id).toHaveLength(1);
      }
    }
  });

  it('is every keersom the other way round', () => {
    // 6 × 14 = 84 becomes 84 : 6 = 14, in the range with the same ceiling.
    for (const [keer, deel] of [
      ['keer-100', 'delen-100'],
      ['keer-1000', 'delen-1000'],
    ] as const) {
      const ids = new Set(loadSumSet(deel)?.items.map((sum) => sum.id));
      for (const sum of loadSumSet(keer)?.items ?? []) {
        const naam = deel === 'delen-100' ? 'deel100' : 'deel1000';
        expect(ids.has(`${naam}-${sum.antwoord}-${sum.links}`), sum.id).toBe(true);
      }
    }
  });
});

describe('plus and minus', () => {
  it('comes in three ranges each', () => {
    expect(plusMin.map((set) => set.id)).toEqual([
      'plus-20',
      'plus-100',
      'plus-1000',
      'min-20',
      'min-100',
      'min-1000',
    ]);
  });

  it('adds and subtracts every one of them back out', () => {
    for (const set of plusMin) {
      for (const sum of set.items) {
        const uit = set.op === 'plus' ? sum.links + sum.rechts : sum.links - sum.rechts;
        expect(sum.antwoord, `${sum.links} ${set.op} ${sum.rechts}`).toBe(uit);
      }
    }
  });
});

describe('splitsen', () => {
  it('comes in three ranges', () => {
    expect(splitsen.map((set) => set.id)).toEqual(['splitsen-10', 'splitsen-20', 'splitsen-100']);
    expect(splitsen.map((set) => set.items.length)).toEqual([45, 45, 45]);
  });

  it('puts the whole on the left, and the two parts add back up to it', () => {
    // "10 = 7 + ?": links is 10, rechts the 7 that is there, the answer 3.
    for (const set of splitsen) {
      for (const sum of set.items) {
        expect(sum.rechts + sum.antwoord, `${sum.links} = ${sum.rechts} + ?`).toBe(sum.links);
        expect(sum.rechts, sum.id).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('has every way there is to split two to ten, once', () => {
    const paren = loadSumSet('splitsen-10')?.items.map((sum) => `${sum.links}=${sum.rechts}`);
    expect(new Set(paren).size).toBe(45);
    for (let heel = 2; heel <= 10; heel++) {
      for (let deel = 1; deel < heel; deel++) expect(paren).toContain(`${heel}=${deel}`);
    }
  });
});

describe('halveren and verdubbelen', () => {
  it('comes in three ranges each', () => {
    expect(halveren.map((set) => set.id)).toEqual(['halveren-20', 'halveren-100', 'halveren-1000']);
    expect(verdubbelen.map((set) => set.id)).toEqual([
      'verdubbelen-20',
      'verdubbelen-100',
      'verdubbelen-1000',
    ]);
    expect(halveren.map((set) => set.items.length)).toEqual([10, 40, 45]);
  });

  it('halves only even numbers, so the answer is always whole', () => {
    for (const set of halveren) {
      for (const sum of set.items) {
        expect(sum.links % 2, sum.id).toBe(0);
        expect(sum.antwoord * 2, sum.id).toBe(sum.links);
        expect(sum.rechts, sum.id).toBe(2);
      }
    }
  });

  it('doubles every one of them back out', () => {
    for (const set of verdubbelen) {
      for (const sum of set.items) {
        expect(sum.links * 2, sum.id).toBe(sum.antwoord);
        expect(sum.rechts, sum.id).toBe(2);
      }
    }
  });

  it('is halveren the other way round, range by range', () => {
    // The way delen is the tables the other way round: the same numbers.
    for (const grens of [20, 100, 1000]) {
      const helften = loadSumSet(`halveren-${grens}`)?.items.map((sum) => sum.links);
      const dubbelen = loadSumSet(`verdubbelen-${grens}`)?.items.map((sum) => sum.antwoord);
      expect(dubbelen, String(grens)).toEqual(helften);
    }
  });
});

describe('every range', () => {
  it('stays inside what its name claims, for every number in the sum', () => {
    // "Deelsommen tot 100" is a promise on a card a child presses. A sum with
    // a 104 in it would break it silently, on the one screen where nobody is
    // checking — and the number that breaks it is the biggest one in the sum,
    // which is the answer for plus and the number on the left for delen.
    for (const set of bereiken) {
      const grens = grensVan(set.id);
      for (const sum of set.items) {
        expect(sum.antwoord, sum.id).toBeGreaterThanOrEqual(1);
        expect(Number.isInteger(sum.antwoord), sum.id).toBe(true);
        expect(grootste(sum), sum.id).toBeLessThanOrEqual(grens);
      }
    }
  });

  it('is offered smallest first', () => {
    for (const op of ['keer', 'delen', 'plus', 'min', 'splitsen', 'halveren', 'verdubbelen']) {
      const grenzen = bereiken.filter((set) => set.op === op).map((set) => grensVan(set.id));
      expect(grenzen, op).toEqual([...grenzen].sort((a, b) => a - b));
    }
  });
});

describe('every sum there is', () => {
  it('has an id of its own', () => {
    const seen = new Set<string>();
    for (const set of sets) {
      for (const sum of set.items) {
        expect(seen.has(sum.id), `${sum.id} twice`).toBe(false);
        seen.add(sum.id);
      }
    }
    expect(seen.size).toBe(TOTAAL);
  });

  it('never collides with a geography item', () => {
    // Item states are keyed by id alone and every module writes to the same
    // store, so a shared id would make a child's tables and their provinces the
    // same Leitner box. The prefix is what keeps them apart.
    for (const set of sets) {
      for (const sum of set.items) {
        expect(sum.id, sum.id).toMatch(/^(?:tafel|keer|deel|plus|min|splits|halveer|verdubbel)/);
        expect(sum.id.startsWith('nl-'), sum.id).toBe(false);
      }
    }
  });

  it('has three wrong answers to offer, all different, none right and none below one', () => {
    for (const set of sets) {
      for (const sum of set.items) {
        const fout = sumDistractors(sum);
        expect(fout, sum.id).toHaveLength(3);
        expect(new Set(fout).size, sum.id).toBe(3);
        expect(fout, sum.id).not.toContain(sum.antwoord);
        for (const antwoord of fout) expect(antwoord, sum.id).toBeGreaterThan(0);
      }
    }
  });
});

describe('the mixes', () => {
  it('is made of the same items, never of copies of them', () => {
    // The whole reason a mix is not a file. If the Rekenmix held its own sums
    // with their own ids, a child would have to learn every table twice over
    // to fill both sets of Leitner boxes.
    const echt = new Set(sets.flatMap((set) => set.items.map((sum) => sum.id)));

    for (const id of MIX_IDS) {
      const mix = loadSumSet(id);
      expect(mix, id).toBeDefined();
      for (const sum of mix?.items ?? []) expect(echt.has(sum.id), `${id}: ${sum.id}`).toBe(true);
    }
  });

  it('holds what its name says and nothing else', () => {
    // "Alle tafels" is the tables, not the keersommen past them (ADR-100).
    expect(loadSumSet('tafels-alle')?.items).toHaveLength(120);
    expect(loadSumSet('deel-alle')?.items).toHaveLength(215);
    expect(loadSumSet('rekenmix')?.items).toHaveLength(TOTAAL);
  });

  it('splits the Rekenmix by the level every set already carried', () => {
    // A hundred and seventy each until the keersommen came in at levels two
    // and three (ADR-073, ADR-100), and more since every kind came in ranges
    // (ADR-120).
    for (const [id, niveau, aantal] of [
      ['rekenmix-1', 1, 267],
      ['rekenmix-2', 2, 445],
      ['rekenmix-3', 3, 313],
    ] as const) {
      const mix = loadSumSet(id);
      expect(mix?.items, id).toHaveLength(aantal);

      // Every sum in it comes from a set of that level and no other.
      const ids = new Set(
        sets.filter((set) => set.niveau === niveau).flatMap((set) => set.items.map((s) => s.id)),
      );
      for (const sum of mix?.items ?? []) expect(ids.has(sum.id), `${id}: ${sum.id}`).toBe(true);
    }

    // And together they are the whole of it: no sum is in two levels, none is
    // in none.
    const perLevel = [1, 2, 3].reduce(
      (total, niveau) => total + (loadSumSet(`rekenmix-${niveau}`)?.items.length ?? 0),
      0,
    );
    expect(perLevel).toBe(TOTAAL);
  });

  it('carries every sum in the mistakes set, and narrows it in the round', () => {
    // It holds them all here because a set is a list of sums and a child's
    // mistakes are not a property of the content. `useSumRound` reads the
    // boxes and filters (ADR-078).
    expect(loadSumSet('fouten')?.items).toHaveLength(TOTAAL);
  });
});

describe('the pool a timed round draws from', () => {
  it('reaches the other tables from a table, and no further', () => {
    // A minute of tables is a minute of tables. Ten sums run out long before
    // sixty seconds do, so it reaches past the chosen table — but a child who
    // asked for the table of seven should not be handed "845 − 140" halfway,
    // nor "9 × 96", which is `keer` too (ADR-100).
    expect(sumPool('tafel-7')).toHaveLength(120);
    expect(sumPool('tafel-7').every((sum) => sum.id.startsWith('tafel-'))).toBe(true);
  });

  it('reaches the ranges below a range, and never past its own ceiling', () => {
    // "Tot 100" is a promise about every sum on the card, and a minute of it
    // is still on that card (ADR-120).
    expect(sumPool('keer-100')).toHaveLength(50);
    expect(sumPool('keer-1000')).toHaveLength(95);
    expect(sumPool('delen-10')).toHaveLength(27);
    expect(sumPool('delen-100')).toHaveLength(167);
    expect(sumPool('plus-20')).toHaveLength(45);
    expect(sumPool('min-100').every((sum) => sum.op === 'min')).toBe(true);

    for (const set of bereiken) {
      for (const sum of sumPool(set.id)) {
        expect(sum.op, `${set.id}: ${sum.id}`).toBe(set.op);
        expect(grootste(sum), `${set.id}: ${sum.id}`).toBeLessThanOrEqual(grensVan(set.id));
      }
    }
  });

  it('lets a mix draw from itself, which is already everything it means', () => {
    expect(sumPool('rekenmix')).toHaveLength(TOTAAL);
    expect(sumPool('keer-10')).toHaveLength(27);
  });
});
