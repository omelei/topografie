import { describe, expect, it } from 'vitest';
import {
  beoordeelWoord,
  berekendAntwoord,
  ENGELS_VOORAF,
  engelsOpties,
  gatLetters,
  keerInZin,
  werkwoordOpties,
  werkwoordVormen,
  zinDelen,
  type WerkwoordItem,
} from '@/game-core';
import {
  loadTaalSet,
  loadTaalSets,
  sterkeWerkwoorden,
  TAAL_MIX,
  type EngelsSet,
  type SpellingSet,
  type WerkwoordSet,
} from './loadTaal';

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

const werkwoorden = sets.filter((set): set is WerkwoordSet => set.deel === 'werkwoorden');
const vormen = werkwoorden.flatMap((set) => set.items);
const sterk = sterkeWerkwoorden();

/** The form the list of strong verbs gives for this item's tense and person. */
function sterkeVorm(item: WerkwoordItem): string | undefined {
  const lijst = sterk[item.infinitief];
  if (!lijst || item.tijd === 'tt') return undefined;
  if (item.tijd === 'vd') return lijst.vd;
  return item.persoon === 'wij' ? lijst.vtMv : lijst.vt;
}

describe('the verb sets', () => {
  it('are the three tenses, at the sizes AFBAKENING.md gives', () => {
    const omvang = Object.fromEntries(werkwoorden.map((set) => [set.id, set.items.length]));
    expect(omvang).toEqual({ 'taal-ww-tt': 40, 'taal-ww-vt': 30, 'taal-ww-vd': 30 });
  });

  it('asks each set in its own tense, in the school year it belongs to', () => {
    // The tegenwoordige tijd is groep 6; the verleden tijd and the voltooid
    // deelwoord are groep 7.
    for (const set of werkwoorden) {
      for (const item of set.items) {
        expect(set.id, item.id).toBe(`taal-ww-${item.tijd}`);
        expect(item.groep, item.id).toBe(item.tijd === 'tt' ? 6 : 7);
        expect(item.id.startsWith(`${set.id}-${item.infinitief}-${item.persoon}`), item.id).toBe(
          true,
        );
      }
    }
    expect(new Set(vormen.map((item) => item.id)).size).toBe(vormen.length);
  });

  it('works every weak form out again: a mistake in the content fails the build', () => {
    for (const item of vormen) {
      if (item.sterk) continue;
      expect(berekendAntwoord(item), item.id).toBe(item.antwoord);
      // A verb on the strong list is only weak here where the list agrees.
      const lijst = sterkeVorm(item);
      if (lijst !== undefined) expect(lijst, item.id).toBe(item.antwoord);
    }
  });

  it('marks as strong only the forms no rule makes, and knows every one of them', () => {
    for (const item of vormen) {
      if (!item.sterk) continue;
      expect(item.tijd, item.id).not.toBe('tt');
      expect(sterkeVorm(item), item.id).toBe(item.antwoord);
      expect(berekendAntwoord(item), item.id).not.toBe(item.antwoord);
    }
    for (const [infinitief, lijst] of Object.entries(sterk)) {
      expect(
        vormen.some((item) => item.infinitief === infinitief),
        infinitief,
      ).toBe(true);
      for (const vorm of [lijst.vt, lijst.vtMv, lijst.vd])
        expect(vorm.trim(), infinitief).not.toBe('');
    }
  });

  it('puts the form in its sentence once, and writes it in small letters', () => {
    for (const item of vormen) {
      expect(keerInZin(item.zin, item.antwoord), item.id).toBe(1);
      expect(item.antwoord, item.id).toBe(item.antwoord.toLocaleLowerCase('nl-NL'));
    }
  });

  it('puts jij after the verb only where the sentence starts with the verb', () => {
    for (const item of vormen) {
      if (!item.achter) continue;
      expect(item.persoon, item.id).toBe('jij');
      expect(zinDelen(item.zin, item.antwoord)?.voor, item.id).toBe('');
    }
  });

  it('offers three different real forms of the verb, the right one among them', () => {
    for (const item of vormen) {
      const echt = Object.values(werkwoordVormen(item.infinitief, sterk));
      const opties = werkwoordOpties(item, sterk, () => 0);
      expect(opties, item.id).toHaveLength(3);
      expect(new Set(opties).size, item.id).toBe(3);
      expect(opties, item.id).toContain(item.antwoord);
      for (const optie of opties) expect(echt, `${item.id}: ${optie}`).toContain(optie);
    }
  });
});

/**
 * Engels (ADR-217). Checked the way spelling is: the word in its sentence once
 * and never first, nothing filed twice, and a Dutch word that asks for one
 * English word only.
 */
describe('the English sets', () => {
  const engels = sets.filter((set): set is EngelsSet => set.deel === 'engels');
  const items = engels.flatMap((set) => set.items);

  it('are the eleven the page offers, at the sizes AFBAKENING.md gives', () => {
    const omvang = Object.fromEntries(engels.map((set) => [set.id, set.items.length]));
    expect(omvang).toEqual({
      'taal-en-getallen': 16,
      'taal-en-dagen': 18,
      'taal-en-kleuren': 14,
      'taal-en-kleding': 16,
      'taal-en-familie': 16,
      'taal-en-lichaam': 17,
      'taal-en-dieren': 18,
      'taal-en-eten': 17,
      'taal-en-huis': 17,
      'taal-en-school': 16,
      'taal-en-werkwoorden': 18,
    });
  });

  it('files every word under its set, in groep 7 or 8', () => {
    for (const set of engels) {
      for (const item of set.items) {
        expect(item.id.startsWith(`${set.id}-`), item.id).toBe(true);
        expect([7, 8], item.id).toContain(item.groep);
      }
    }
  });

  it('puts every English word in its sentence once, and never as its first word', () => {
    for (const item of items) {
      expect(keerInZin(item.zin, item.en), item.id).toBe(1);
      expect(zinDelen(item.zin, item.en)?.voor.trim(), item.id).not.toBe('');
    }
  });

  it('gives no id, no Dutch word and no English word twice', () => {
    expect(new Set(items.map((item) => item.id)).size).toBe(items.length);
    expect(new Set(items.map((item) => item.nl)).size).toBe(items.length);
    const engelseWoorden = items.flatMap((item) => [item.en, ...(item.aliassen ?? [])]);
    expect(new Set(engelseWoorden.map((woord) => woord.toLowerCase())).size).toBe(
      engelseWoorden.length,
    );
  });

  it('never asks a word that is the same in both languages', () => {
    for (const item of items) expect(item.en.toLowerCase(), item.id).not.toBe(item.nl);
  });

  it('counts "a dog", "to walk" and a second spelling right, and a letter out wrong', () => {
    const opties = (woord: string) => {
      const item = items.find((kandidaat) => kandidaat.en === woord);
      if (!item) throw new Error(woord);
      return { aliassen: item.aliassen ?? [], vooraf: ENGELS_VOORAF };
    };
    expect(beoordeelWoord('a dog', 'dog', opties('dog')).goed).toBe(true);
    expect(beoordeelWoord('to walk', 'walk', opties('walk')).goed).toBe(true);
    expect(beoordeelWoord('color', 'colour', opties('colour')).goed).toBe(true);
    expect(beoordeelWoord('monday', 'Monday', opties('Monday')).goed).toBe(true);
    expect(beoordeelWoord('dogs', 'dog', opties('dog')).goed).toBe(false);
    expect(beoordeelWoord('coulor', 'colour', opties('colour')).goed).toBe(false);
  });

  it('offers four different words from the same set, the right one among them', () => {
    for (const set of engels) {
      for (const item of set.items) {
        const keuzes = engelsOpties(item, set.items);
        expect(keuzes, item.id).toHaveLength(4);
        expect(new Set(keuzes).size, item.id).toBe(4);
        expect(keuzes, item.id).toContain(item.en);
        for (const keuze of keuzes) {
          expect(
            set.items.map((ander) => ander.en),
            item.id,
          ).toContain(keuze);
        }
      }
    }
  });

  it('holds every English word once in the mix', () => {
    const mix = loadTaalSet(TAAL_MIX.engels);
    expect(mix?.items.map((item) => item.id).sort()).toEqual(items.map((item) => item.id).sort());
  });
});
