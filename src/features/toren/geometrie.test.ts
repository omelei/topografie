import { describe, expect, it } from 'vitest';
import { STENEN_PER_VERDIEPING } from '@/game-core';
import {
  INHOUD_BREED,
  maatvoering,
  MAX_GETEKEND,
  PER_RIJ,
  RIJEN_PER_VERDIEPING,
  SCHACHT,
  STEEN,
  steenPlek,
  TONEEL,
  VERDIEPING_HOOG,
} from './geometrie';

describe('de maten zelf', () => {
  it('tekent precies de tien stenen die een verdieping is', () => {
    expect(PER_RIJ * RIJEN_PER_VERDIEPING).toBe(STENEN_PER_VERDIEPING);
  });

  it('legt de onderste rij eerst en houdt de schacht gecentreerd', () => {
    expect(steenPlek(0).y).toBe(-STEEN.hoog);
    expect(steenPlek(5).y).toBe(-2 * STEEN.hoog);
    expect(steenPlek(0).x).toBe(-SCHACHT / 2);
    expect(steenPlek(4).x + STEEN.breed).toBe(SCHACHT / 2);
  });
});

describe('passen in hetzelfde kader', () => {
  it('blaast een toren van een verdieping niet op tot een staal', () => {
    const maat = maatvoering(1);
    expect(maat.schaal).toBe(1);
    expect(maat.getekend).toBe(1);
    expect(maat.inFundament).toBe(0);
    // Een steen van 24 bij 15, en een schacht van 126 in een kader van 320.
    expect(SCHACHT * maat.schaal).toBeLessThan(TONEEL.breed);
  });

  it('laat de toren zichtbaar groeien tot hij het kader vult', () => {
    // Tot tien verdiepingen groeit de toren; daarna krimpt de steen.
    expect(maatvoering(1).schaal).toBe(maatvoering(9).schaal);
    expect(maatvoering(20).schaal).toBeLessThan(maatvoering(9).schaal);
  });

  it('houdt een toren van veertig binnen het kader, met een fundament', () => {
    const maat = maatvoering(40);
    expect(maat.getekend).toBe(MAX_GETEKEND);
    expect(maat.inFundament).toBe(20);
    expect(maat.inhoudHoog * maat.schaal).toBeLessThanOrEqual(TONEEL.hoog + 0.001);
    expect(INHOUD_BREED * maat.schaal).toBeLessThanOrEqual(TONEEL.breed + 0.001);
  });

  it('houdt elke toren binnen het kader, hoe hoog ook', () => {
    for (const verdiepingen of [0, 1, 2, 5, 10, 19, 20, 21, 100, 3334]) {
      const maat = maatvoering(verdiepingen);
      expect(maat.inhoudHoog * maat.schaal).toBeLessThanOrEqual(TONEEL.hoog + 0.001);
      expect(INHOUD_BREED * maat.schaal).toBeLessThanOrEqual(TONEEL.breed + 0.001);
      expect(maat.getekend + maat.inFundament).toBe(verdiepingen);
    }
  });

  it('houdt een rij stenen leesbaar zolang hij los getekend wordt', () => {
    // De reden dat er twintig los getekend worden en niet veertig: onder de vier
    // eenheden per rij is een steen een korrel en is vijf niet meer na te tellen.
    const maat = maatvoering(MAX_GETEKEND);
    expect(STEEN.hoog * maat.schaal).toBeGreaterThanOrEqual(4);
    expect(STEEN.breed * maat.schaal).toBeGreaterThanOrEqual(6);
  });

  it('geeft een breed kader de veertig die de opdracht vroeg', () => {
    const maat = maatvoering(40, 40);
    expect(maat.getekend).toBe(40);
    expect(maat.inFundament).toBe(0);
    expect(maat.inhoudHoog).toBe(40 * VERDIEPING_HOOG + 2 * VERDIEPING_HOOG);
  });
});
