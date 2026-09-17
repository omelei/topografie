import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { isGroep } from '@/game-core';
import { loadVlagSets } from './loadVlaggen';
import { groepenVanSet, setsInTabel } from './schoolgroepen';
import tabel from '../../content/schoolgroepen.json';

/**
 * Elke set hoort bij een groep (ADR-151).
 *
 * Een set die nergens bij hoort, is voor elk kind neutraal. Dat is geen fout
 * die iemand ziet: hij staat gewoon tussen de rest, en niemand merkt dat een
 * nieuw gegenereerde set nooit bovenaan komt. Daarom faalt dit, en niet de
 * pagina.
 *
 * De bestanden worden hier van schijf gelezen in plaats van via de loaders,
 * zodat een set die als bestand bestaat maar door een loader wordt
 * overgeslagen ook meetelt.
 */

const CONTENT = join(process.cwd(), 'content');

interface Bestand {
  readonly id: string;
  readonly items: readonly object[];
}

function bestanden(map: string): Bestand[] {
  return readdirSync(join(CONTENT, map))
    .filter((naam) => naam.endsWith('.json'))
    .map((naam) => JSON.parse(readFileSync(join(CONTENT, map, naam), 'utf8')) as Bestand);
}

const reken = [...bestanden('tafels'), ...bestanden('sommen')].map((set) => set.id);
// Keersommen tot 10 is een samengestelde set met een eigen keuze op de pagina.
const rekenKeuzes = [...reken, 'keer-10'];
const klok = bestanden('klok').map((set) => set.id);
const vlaggen = loadVlagSets()
  .filter((set) => set.onderwerp !== 'fouten' && set.onderwerp !== 'mix')
  .map((set) => set.id);
const topo = bestanden('sets');
const taal = [...bestanden('taal/spelling'), ...bestanden('taal/werkwoorden')];

describe('de koppeltabel', () => {
  it('zegt dat het onze eigen indeling is, en geen kerndoel (ADR-011)', () => {
    expect(tabel._toelichting).toMatch(/eigen indeling/);
    expect(tabel._toelichting).toMatch(/geen kerndoel/);
  });

  it('heeft een groep voor elke set van rekenen, klokkijken en vlaggen', () => {
    const zonder = [...rekenKeuzes, ...klok, ...vlaggen].filter(
      (id) => !setsInTabel().includes(id),
    );
    expect(zonder).toEqual([]);
  });

  it('noemt geen set die niet bestaat', () => {
    const bekend = new Set([...rekenKeuzes, ...klok, ...vlaggen]);
    expect(setsInTabel().filter((id) => !bekend.has(id))).toEqual([]);
  });

  it('noemt alleen groep 3 tot en met 8, oplopend en elk één keer', () => {
    for (const [id, groepen] of Object.entries(tabel.sets)) {
      expect(groepen.length, id).toBeGreaterThan(0);
      for (const groep of groepen) expect(isGroep(groep), `${id}: ${groep}`).toBe(true);
      expect([...new Set(groepen)].sort((a, b) => a - b), id).toEqual(groepen);
    }
  });
});

describe('de sets die hun groep zelf dragen', () => {
  it('geven bij topografie elk een groep, via hun leerdoelen', () => {
    const zonder = topo.filter((set) => groepenVanSet(set.id, set.items) === undefined);
    expect(zonder.map((set) => set.id)).toEqual([]);
  });

  it('geven bij Taal elk een groep, via hun woorden', () => {
    const zonder = taal.filter((set) => groepenVanSet(set.id, set.items) === undefined);
    expect(zonder.map((set) => set.id)).toEqual([]);
  });

  it('staan niet ook in de tabel, zodat er één bron per set is', () => {
    const dubbel = [...topo, ...taal].filter((set) => setsInTabel().includes(set.id));
    expect(dubbel.map((set) => set.id)).toEqual([]);
  });

  it('lezen de groep zoals de content hem geeft', () => {
    const van = (id: string) => {
      const set = [...topo, ...taal].find((kandidaat) => kandidaat.id === id);
      return set ? groepenVanSet(set.id, set.items) : undefined;
    };
    expect(van('nl-provincies')).toEqual([6, 7]);
    expect(van('europa-landen')).toEqual([7, 8]);
    expect(van('taal-sp-gch')).toEqual([7]);
    expect(van('taal-ww-tt')).toEqual([6]);
  });
});

describe('wat geen groep heeft', () => {
  it('is een mix of een foutenlijst, tenzij de tabel hem noemt', () => {
    expect(groepenVanSet('rekenmix', [], true)).toBeUndefined();
    expect(groepenVanSet('klok-fouten', [])).toBeUndefined();
    expect(groepenVanSet('nl-fouten', [{ leerdoelen: ['ak-nl-provincies-aanwijzen'] }])).toBe(
      undefined,
    );
    expect(groepenVanSet('keer-10', [], true)).toEqual([4, 5]);
  });

  it('is content zonder metadata, zoals een eigen lijst', () => {
    expect(groepenVanSet('eigen-dictee', [{ id: 'a', woord: 'fiets' }])).toBeUndefined();
    expect(groepenVanSet('onbekend', [])).toBeUndefined();
  });
});
