import { afterEach, describe, expect, it } from 'vitest';
import {
  importeer,
  itemId,
  leesLijsten,
  LIJSTEN_SLEUTEL,
  MAX_LIJSTEN,
  MAX_WOORDEN,
  ontleed,
  schoonWoord,
  schrijfLijsten,
  vergeetLijsten,
  woordSleutel,
} from './woordlijsten';

afterEach(() => {
  window.localStorage.clear();
  vergeetLijsten();
});

describe('een eigen woordenlijst', () => {
  it('leest niets uit niets', () => {
    expect(ontleed(null)).toEqual([]);
    expect(ontleed('geen json')).toEqual([]);
    expect(ontleed('{"niet":"een lijst"}')).toEqual([]);
  });

  it('laat een rij zonder naam of woorden vallen in plaats van te gooien', () => {
    const uit = ontleed('[{"id":"a"},{"id":"b","naam":"Week 3","woorden":["trein"]}]');
    expect(uit).toHaveLength(1);
    expect(uit[0]?.naam).toBe('Week 3');
  });

  /**
   * De belangrijkste regel van dit bestand. Twee keer hetzelfde woord zou twee
   * onderdelen met hetzelfde id geven, en dan deelt het ene de Leitner-doos van
   * het andere.
   */
  it('houdt hetzelfde woord maar één keer', () => {
    const uit = ontleed('[{"id":"a","naam":"Week 3","woorden":["trein","Trein"," trein "]}]');
    expect(uit[0]?.woorden).toEqual(['trein']);
  });

  it('laat lege woorden weg', () => {
    const uit = ontleed('[{"id":"a","naam":"W","woorden":["trein","","   ","!!!"]}]');
    expect(uit[0]?.woorden).toEqual(['trein']);
  });

  it('knipt een lijst af die te lang is', () => {
    const woorden = Array.from({ length: MAX_WOORDEN + 10 }, (_, i) => `woord${i}`);
    const uit = ontleed(JSON.stringify([{ id: 'a', naam: 'W', woorden }]));
    expect(uit[0]?.woorden).toHaveLength(MAX_WOORDEN);
  });

  it('laat de hoofdletter staan die de ouder typte', () => {
    expect(schoonWoord('  Amsterdam ')).toBe('Amsterdam');
  });

  /**
   * Het id hangt aan het wóórd en niet aan de plek in de lijst. Haalt een ouder
   * er een woord tussenuit, dan zou anders elke doos eronder verschuiven en
   * droeg "fiets" ineens de voortgang van "trein".
   */
  it('geeft een woord een id dat niet verschuift als de lijst verandert', () => {
    expect(itemId('l1', 'trein')).toBe('taal-eigen-l1-trein');
    expect(itemId('l1', 'Trein')).toBe(itemId('l1', 'trein'));
    expect(itemId('l1', 'één')).toBe('taal-eigen-l1-een');
  });

  it('maakt van een woord met leestekens een bruikbare sleutel', () => {
    expect(woordSleutel("'s ochtends")).toBe('s-ochtends');
    expect(woordSleutel('!!!')).toBe('');
  });

  it('schrijft en leest terug', () => {
    schrijfLijsten([{ id: 'l1', naam: 'Week 3', woorden: ['trein', 'fiets'] }]);
    expect(window.localStorage.getItem(LIJSTEN_SLEUTEL)).toContain('trein');
    expect(leesLijsten()).toHaveLength(1);
    expect(leesLijsten()[0]?.woorden).toEqual(['trein', 'fiets']);
  });

  it('merkt dat de waarde veranderd is', () => {
    schrijfLijsten([{ id: 'l1', naam: 'Week 3', woorden: ['trein'] }]);
    expect(leesLijsten()[0]?.woorden).toEqual(['trein']);
    schrijfLijsten([{ id: 'l1', naam: 'Week 3', woorden: ['trein', 'fiets'] }]);
    expect(leesLijsten()[0]?.woorden).toEqual(['trein', 'fiets']);
  });
});

/**
 * Importeren uit een bestand (ADR-145). Wat een ouder uit Excel opslaat, en wat
 * er uit een mail van school geplakt wordt.
 */
describe('een bestand importeren', () => {
  let teller = 0;
  const id = () => `n${++teller}`;

  afterEach(() => {
    teller = 0;
  });

  it('zet één woord per regel in een lijst die naar het bestand heet', () => {
    const uit = importeer('fiets\r\ntrein\n\nbus\n', 'Week 12', [], id);
    expect(uit.lijsten).toEqual([
      { id: 'n1', naam: 'Week 12', woorden: ['fiets', 'trein', 'bus'] },
    ]);
    expect(uit.woorden).toBe(3);
    expect(uit.geraakt).toBe(1);
    expect(uit.overgeslagen).toBe(0);
  });

  it('leest een lijstnaam in de eerste kolom, met puntkomma, komma of tab', () => {
    const uit = importeer('lijst;woord\nWeek 1;fiets\nWeek 2,trein\nWeek 1\tbus', 'x', [], id);
    expect(uit.lijsten.map((lijst) => [lijst.naam, lijst.woorden])).toEqual([
      ['Week 1', ['fiets', 'bus']],
      ['Week 2', ['trein']],
    ]);
    expect(uit.geraakt).toBe(2);
  });

  it('slaat de BOM en de aanhalingstekens van Excel over', () => {
    const uit = importeer('﻿"Week 3";"de ""kat"""', 'x', [], id);
    expect(uit.lijsten[0]?.naam).toBe('Week 3');
    expect(uit.lijsten[0]?.woorden).toEqual(['de "kat"']);
  });

  it('vult een bestaande lijst aan in plaats van hem te verdubbelen', () => {
    const bestaand = [{ id: 'l1', naam: 'Week 3', woorden: ['trein'] }];
    const uit = importeer('week 3;Trein\nweek 3;fiets', 'x', bestaand, id);
    expect(uit.lijsten).toEqual([{ id: 'l1', naam: 'Week 3', woorden: ['trein', 'fiets'] }]);
    expect(uit.overgeslagen).toBe(1);
    expect(bestaand[0]?.woorden).toEqual(['trein']);
  });

  it('kapt een te lang woord niet af maar laat het weg', () => {
    const uit = importeer('onafhankelijkheidsverklaringen\nfiets', 'x', [], id);
    expect(uit.lijsten[0]?.woorden).toEqual(['fiets']);
    expect(uit.overgeslagen).toBe(1);
  });

  it('stopt bij een volle lijst en bij het maximum aantal lijsten', () => {
    const veel = Array.from({ length: MAX_WOORDEN + 2 }, (_, i) => `woord${i}`).join('\n');
    expect(importeer(veel, 'x', [], id).overgeslagen).toBe(2);

    const vol = Array.from({ length: MAX_LIJSTEN }, (_, i) => ({
      id: `l${i}`,
      naam: `Lijst ${i}`,
      woorden: [],
    }));
    const uit = importeer('Nieuw;fiets', 'x', vol, id);
    expect(uit.lijsten).toHaveLength(MAX_LIJSTEN);
    expect(uit.overgeslagen).toBe(1);
  });

  it('voegt een nieuwe lijst zonder bruikbare woorden niet toe', () => {
    const uit = importeer('!!!\n', 'Leeg', [], id);
    expect(uit.lijsten).toEqual([]);
    expect(uit.woorden).toBe(0);
  });
});
