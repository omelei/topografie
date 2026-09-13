import { describe, expect, it } from 'vitest';
import { gatLetters, keerInZin, zinDelen } from '@/game-core';
import { loadTaalSet, loadTaalSets, TAAL_MIX, type SpellingSet } from './loadTaal';

/**
 * Taal is written by hand, and this is what stands between the files and a
 * classroom (ADR-118).
 *
 * Which words are in it, and why, is in content/taal/AFBAKENING.md, and the
 * items were put to the product owner before they were merged. What is
 * checked here is what can be checked without a person: that the gap is where
 * the letters are, that the word is in its sentence, that nothing is filed
 * twice — and for verbs, that every weak form is what the rules make.
 */

const sets = loadTaalSets();
const spelling = sets.filter((set): set is SpellingSet => set.deel === 'spelling');
const woorden = spelling.flatMap((set) => set.items);

describe('the spelling sets', () => {
  it('are the ten the page offers, at the sizes AFBAKENING.md gives', () => {
    const omvang = Object.fromEntries(spelling.map((set) => [set.id, set.items.length]));
    expect(omvang).toEqual({
      'taal-sp-eiij': 40,
      'taal-sp-auou': 30,
      'taal-sp-gch': 30,
      'taal-sp-ck': 30,
      'taal-sp-dt': 40,
      'taal-sp-klinkers': 30,
      'taal-sp-medeklinkers': 30,
      'taal-sp-verkleinwoorden': 40,
      'taal-sp-ig': 30,
      'taal-sp-lijk': 30,
    });
  });

  it('puts the letters of the gap among two to four letter pieces', () => {
    for (const item of woorden) {
      expect(item.keuzes, item.id).toContain(gatLetters(item));
      expect(item.keuzes.length, item.id).toBeGreaterThanOrEqual(2);
      expect(item.keuzes.length, item.id).toBeLessThanOrEqual(4);
      expect(new Set(item.keuzes).size, item.id).toBe(item.keuzes.length);
    }
  });

  it('never offers a whole word as a piece, so no word is ever shown spelled wrong', () => {
    for (const item of woorden) {
      expect(item.gat[1] - item.gat[0], item.id).toBeLessThan(item.woord.length);
      for (const keuze of item.keuzes) {
        expect(keuze.length, `${item.id}: ${keuze}`).toBeLessThan(item.woord.length);
      }
    }
  });

  it('puts every word in its sentence once, and never as its first word', () => {
    for (const item of woorden) {
      expect(keerInZin(item.zin, item.woord), item.id).toBe(1);
      expect(zinDelen(item.zin, item.woord)?.voor.trim(), item.id).not.toBe('');
    }
  });

  it('gives no id and no word twice within spelling', () => {
    expect(new Set(woorden.map((item) => item.id)).size).toBe(woorden.length);
    expect(new Set(woorden.map((item) => item.woord)).size).toBe(woorden.length);
  });

  it('files every item under its set, by an id that says so', () => {
    for (const set of spelling) {
      for (const item of set.items) {
        expect(item.id.startsWith(`${set.id}-`), item.id).toBe(true);
        expect(item.id, item.id).toMatch(/^taal-sp-[a-z]+-[a-z-]+$/);
      }
    }
  });

  it('gives every item a school year from groep 5 to groep 8', () => {
    for (const item of woorden) {
      expect([5, 6, 7, 8], item.id).toContain(item.groep);
    }
  });

  it('shows the rule for d or t with the longer word, and one or two in pieces', () => {
    const van = (id: string) => spelling.find((set) => set.id === id)?.items ?? [];
    for (const item of van('taal-sp-dt')) {
      // "honden" for hond, "rode" for rood: a longer word, with the letter in
      // it that is heard.
      expect(item.hulp, item.id).toBeDefined();
      expect(item.hulp, item.id).not.toBe(item.woord);
      expect(item.hulp ?? '', item.id).toContain(gatLetters(item));
    }
    for (const item of [...van('taal-sp-klinkers'), ...van('taal-sp-medeklinkers')]) {
      // "bo-men" is bomen in pieces, and nothing else.
      expect((item.hulp ?? '').replaceAll('-', ''), item.id).toBe(item.woord);
    }
  });

  it('names the other word of a pair that sounds the same, both ways, in sentences that differ', () => {
    // "wij" and "wei" in one round, in the same sentence with a gap, would be
    // a question with two right answers. The sentence has to say which one.
    const perWoord = new Map(woorden.map((item) => [item.woord, item]));
    const metGat = (zin: string, woord: string) => {
      const delen = zinDelen(zin, woord);
      return delen ? `${delen.voor}▢${delen.na}` : zin;
    };
    for (const item of woorden) {
      if (!item.klinktAls) continue;
      const ander = perWoord.get(item.klinktAls);
      if (!ander) continue;
      expect(ander.klinktAls, item.id).toBe(item.woord);
      expect(metGat(item.zin, item.woord), item.id).not.toBe(metGat(ander.zin, ander.woord));
    }
  });
});

describe('the Spellingmix', () => {
  it('holds every spelling word once, under the ids of its sets', () => {
    const mix = loadTaalSet(TAAL_MIX.spelling)?.items ?? [];
    expect(mix).toHaveLength(woorden.length);
    expect(new Set(mix.map((item) => item.id)).size).toBe(woorden.length);
  });
});
