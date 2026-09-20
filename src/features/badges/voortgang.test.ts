import { describe, expect, it } from 'vitest';
import type { ItemState, LeitnerBox, Schedulable } from '@/game-core';
import type { Onderdeel } from '@/features/module/onderdelen';
import { doelwitVan } from '@/features/home/doel';
import { kaartStandVan, voortgangVan, vulling, type Voortgang } from './voortgang';

const NU = new Date('2026-09-20T09:00:00');
const DAG = 86_400_000;

function deel(setId: string, moduleId: Onderdeel['moduleId'], items: number): Onderdeel {
  return {
    moduleId,
    setId,
    naam: null,
    literalNaam: setId,
    kortNaam: null,
    mix: false,
    items: Array.from({ length: items }, (_, i): Schedulable => ({ id: `${setId}-${i}` })),
    roundSize: 10,
  };
}

function standen(
  ids: readonly string[],
  box: LeitnerBox,
  gezienOp: Date = NU,
): Map<string, ItemState> {
  const map = new Map<string, ItemState>();
  for (const id of ids) {
    map.set(id, {
      itemId: id,
      box,
      laatsteReview: gezienOp.toISOString(),
      volgendeReview: gezienOp.toISOString(),
      goedCount: box,
      foutCount: 0,
    });
  }
  return map;
}

function doelwitVoor(setId: string, moduleId: Onderdeel['moduleId'], items: number) {
  const doelwit = doelwitVan(deel(setId, moduleId, items));
  if (doelwit === null) throw new Error(`geen diploma voor ${setId}`);
  return doelwit;
}

describe('wat de ring telt', () => {
  const tafel = doelwitVoor('tafel-7', 'tafels', 10);
  const ids = tafel.deel.items.map((item) => item.id);

  it('telt niets voor één goed antwoord: doos twee is geen onthouden', () => {
    expect(voortgangVan(tafel, standen(ids, 2), NU).bewezen).toBe(0);
  });

  it('telt niets voor twee goede antwoorden', () => {
    expect(voortgangVan(tafel, standen(ids, 3), NU).bewezen).toBe(0);
  });

  it('telt vanaf doos vier: drie goede antwoorden op drie dagen', () => {
    expect(voortgangVan(tafel, standen(ids, 4), NU).bewezen).toBe(10);
  });

  it('telt alleen de onderdelen die er zijn', () => {
    const half = new Map([...standen(ids.slice(0, 4), 4), ...standen(ids.slice(4), 2)]);
    expect(voortgangVan(tafel, half, NU).bewezen).toBe(4);
  });
});

describe('de ring loopt nooit terug', () => {
  const tafel = doelwitVoor('tafel-7', 'tafels', 10);
  const ids = tafel.deel.items.map((item) => item.id);
  // Ver voorbij het eigen interval van doos vier (acht dagen), dus `isStale`.
  const langGeleden = new Date(NU.getTime() - 40 * DAG);

  it('telt ook wat lang niet gezien is', () => {
    expect(voortgangVan(tafel, standen(ids, 4, langGeleden), NU).bewezen).toBe(10);
  });

  it('maar de lat telt dat niet meer mee, en dan staat er "even opfrissen"', () => {
    const voortgang = voortgangVan(tafel, standen(ids, 4, langGeleden), NU);
    expect(voortgang.rijp).toBe(false);
    expect(kaartStandVan(false, voortgang)).toBe('opfrissen');
  });
});

describe('de drempel komt uit één plek', () => {
  it('een tafel vraagt de hele tafel', () => {
    const tafel = doelwitVoor('tafel-7', 'tafels', 10);
    expect(voortgangVan(tafel, new Map(), NU).nodig).toBe(10);
  });

  it('de andere drie vragen negen op de tien van de hele set', () => {
    const europa = doelwitVoor('vlag-europa-alle', 'vlaggen', 46);
    expect(voortgangVan(europa, new Map(), NU).nodig).toBe(42);
  });
});

describe('hoe vol de ring staat', () => {
  const van = (bewezen: number, nodig: number): Voortgang => ({
    bewezen,
    totaal: nodig,
    nodig,
    rijp: bewezen >= nodig,
  });

  it('loopt naar de drempel en niet naar het totaal', () => {
    expect(vulling(van(0, 10))).toBe(0);
    expect(vulling(van(5, 10))).toBe(50);
    expect(vulling(van(10, 10))).toBe(100);
  });

  it('gaat nooit boven de honderd', () => {
    expect(vulling(van(46, 42))).toBe(100);
  });

  it('is nul als er niets te halen valt', () => {
    expect(vulling(van(0, 0))).toBe(0);
  });
});

describe('welke van de vijf dingen een kaart zegt', () => {
  const van = (bewezen: number, nodig: number, rijp: boolean): Voortgang => ({
    bewezen,
    totaal: nodig,
    nodig,
    rijp,
  });

  it('gehaald wint van alles', () => {
    expect(kaartStandVan(true, van(0, 10, false))).toBe('gehaald');
    expect(kaartStandVan(true, null)).toBe('gehaald');
  });

  it('nog niets onthouden is een eigen stand, want daar hoort de regel', () => {
    expect(kaartStandVan(false, van(0, 10, false))).toBe('nietsNog');
  });

  it('onderweg', () => {
    expect(kaartStandVan(false, van(4, 10, false))).toBe('bezig');
  });

  it('rijp', () => {
    expect(kaartStandVan(false, van(10, 10, true))).toBe('rijp');
  });

  it('zonder standen valt hij terug op onderweg en nooit op een nul', () => {
    expect(kaartStandVan(false, null)).toBe('bezig');
  });
});
