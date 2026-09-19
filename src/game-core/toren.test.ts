import { describe, expect, it } from 'vitest';
import { emptyState, review } from './leitner';
import {
  beginToren,
  LEGE_TOREN,
  levertSteen,
  METER_PER_VERDIEPING,
  standVan,
  stenenErbij,
  STENEN_PER_VERDIEPING,
} from './toren';
import type { ItemState } from './types';

const DAG = 86_400_000;
const START = new Date(2026, 8, 7, 10);
const na = (dagen: number) => new Date(START.getTime() + dagen * DAG);

/** Een item dat eerder beantwoord is en nu aan de beurt staat. */
function aanDeBeurt(): { vorige: ItemState; nu: Date } {
  const eerste = review(emptyState('x'), true, START);
  return { vorige: eerste, nu: new Date(eerste.volgendeReview as string) };
}

describe('levertSteen', () => {
  it('geeft een steen voor goed, aan de beurt, en eerder gezien', () => {
    const { vorige, nu } = aanDeBeurt();
    expect(levertSteen(vorige, true, nu)).toBe(true);
  });

  it('geeft niets voor een nieuw item, ook al is het aan de beurt', () => {
    // Een nieuw item is per definitie aan de beurt en gaat bij goed van doos een
    // naar twee. Dat is de doosstap, en de steen is strenger: je wist het nog
    // niet, je leerde het net.
    expect(levertSteen(emptyState('nieuw'), true, START)).toBe(false);
  });

  it('geeft niets voor goed dat niet aan de beurt was', () => {
    const { vorige } = aanDeBeurt();
    expect(levertSteen(vorige, true, na(0.5))).toBe(false);
  });

  it('geeft niets voor een fout, wanneer het ook komt', () => {
    const { vorige, nu } = aanDeBeurt();
    expect(levertSteen(vorige, false, nu)).toBe(false);
    expect(levertSteen(emptyState('x'), false, START)).toBe(false);
  });

  it('geeft niets voor het herstel van een fout in dezelfde ronde', () => {
    // Dit is het geval waarom het rondetotaal per antwoord geteld wordt en niet
    // uit het verschil tussen begin- en eindstand: na de fout staat het item in
    // doos een met een nieuwe datum, dus het tweede antwoord is niet aan de
    // beurt — terwijl het verschil er als een steen uitziet.
    const { vorige, nu } = aanDeBeurt();
    const naFout = review(vorige, false, nu);
    const eenMinuutLater = new Date(nu.getTime() + 60_000);

    expect(levertSteen(naFout, true, eenMinuutLater)).toBe(false);
    expect(naFout.goedCount).toBe(vorige.goedCount);
    // En het verschil liegt inderdaad: goedCount loopt op en de planning verzet.
    const naHerstel = review(naFout, true, eenMinuutLater);
    expect(naHerstel.goedCount).toBeGreaterThan(vorige.goedCount);
    expect(naHerstel.volgendeReview).not.toBe(vorige.volgendeReview);
  });

  it('blijft geven zolang een item terugkomt, ook in de hoogste doos', () => {
    let state = emptyState('x');
    let now = START;
    let stenen = 0;
    for (let beurt = 0; beurt < 8; beurt++) {
      if (levertSteen(state, true, now)) stenen++;
      state = review(state, true, now);
      now = new Date(state.volgendeReview as string);
    }
    // Acht beurten, en alleen de eerste was het leren zelf.
    expect(stenen).toBe(7);
  });
});

describe('beginToren', () => {
  it('maakt van wat een kind al had hele verdiepingen plus een rest', () => {
    const toren = beginToren(87);
    expect(toren.fundament).toBe(80);
    expect(toren.aanbouw).toHaveLength(7);
    expect(toren.aanbouw.every((vak) => vak === null)).toBe(true);
    expect(standVan(toren).stenen).toBe(87);
    expect(standVan(toren).verdiepingen).toBe(8);
  });

  it('begint leeg bij een kind dat nog niets deed', () => {
    expect(beginToren(0)).toEqual(LEGE_TOREN);
  });
});

describe('stenenErbij', () => {
  it('maakt een verdieping vol bij tien en telt door boven het fundament', () => {
    const toren = stenenErbij(beginToren(80), Array(10).fill('topo'), na(1));
    expect(toren.verdiepingen).toHaveLength(1);
    expect(toren.verdiepingen[0]?.nummer).toBe(9);
    expect(toren.verdiepingen[0]?.vakken).toHaveLength(STENEN_PER_VERDIEPING);
    expect(toren.aanbouw).toHaveLength(0);
  });

  it('vult de rest van het fundament aan tot een hele verdieping', () => {
    // 87 stenen: nog drie tot verdieping negen af is, en die drie dragen de
    // kleur van hun vak terwijl de zeven eronder geen kleur hebben.
    const toren = stenenErbij(beginToren(87), ['topo', 'tafels', 'klok'], na(1));
    expect(toren.verdiepingen).toHaveLength(1);
    expect(toren.verdiepingen[0]?.vakken.filter((vak) => vak === null)).toHaveLength(7);
    expect(standVan(toren).stenen).toBe(90);
  });

  it('maakt meer dan een verdieping in een keer', () => {
    const toren = stenenErbij(LEGE_TOREN, Array(23).fill('vlaggen'), na(1));
    expect(toren.verdiepingen.map((v) => v.nummer)).toEqual([1, 2]);
    expect(toren.aanbouw).toHaveLength(3);
  });

  it('laat de toren met rust als er niets verdiend is', () => {
    expect(stenenErbij(LEGE_TOREN, [], na(1))).toBe(LEGE_TOREN);
  });
});

describe('standVan', () => {
  it('rekent stenen, verdiepingen en meters door', () => {
    const stand = standVan(stenenErbij(beginToren(80), Array(14).fill('taal'), na(1)));
    expect(stand.stenen).toBe(94);
    expect(stand.verdiepingen).toBe(9);
    expect(stand.meter).toBe(9 * METER_PER_VERDIEPING);
    expect(stand.fundament).toBe(8);
    expect(stand.inAanbouw).toBe(10);
    expect(stand.rest).toBe(6);
  });
});
