import { describe, expect, it } from 'vitest';
import { bereikt, gepasseerd, IJKPUNTEN, ijkpuntenVoor, meterVoor, volgende } from './ijkpunten';
import { METER_PER_VERDIEPING } from './toren';

describe('de lijst', () => {
  it('loopt van laag naar hoog', () => {
    const hoogtes = IJKPUNTEN.map((punt) => punt.verdiepingen);
    expect(hoogtes).toEqual([...hoogtes].sort((a, b) => a - b));
  });

  it('geeft elk ijkpunt een eigen id', () => {
    expect(new Set(IJKPUNTEN.map((punt) => punt.id)).size).toBe(IJKPUNTEN.length);
  });

  it('haalt elke echte hoogte, en niet met meer dan een verdieping over', () => {
    // "Hoger dan de Domtoren" moet waar zijn op het moment dat het er staat, en
    // het moet ook niet veel eerder waar zijn dan nodig.
    for (const punt of IJKPUNTEN) {
      if (punt.echt === null) continue;
      const hoogte = meterVoor(punt.verdiepingen);
      expect(hoogte).toBeGreaterThanOrEqual(punt.echt);
      expect(hoogte - punt.echt).toBeLessThanOrEqual(METER_PER_VERDIEPING);
    }
  });
});

describe('de twee registers', () => {
  it('geeft de giraf en de boom alleen aan het beeldregister', () => {
    const beeld = ijkpuntenVoor('beeld').map((punt) => punt.id);
    const getal = ijkpuntenVoor('getal').map((punt) => punt.id);
    expect(beeld).toContain('giraf');
    expect(beeld).toContain('boom');
    expect(getal.includes('giraf')).toBe(false);
    expect(getal.includes('boom')).toBe(false);
  });

  it('geeft de twee hoogste alleen aan het getallenregister', () => {
    const beeld = ijkpuntenVoor('beeld').map((punt) => punt.id);
    const getal = ijkpuntenVoor('getal').map((punt) => punt.id);
    expect(getal).toContain('burjkhalifa');
    expect(getal).toContain('tienkilometer');
    expect(beeld.includes('burjkhalifa')).toBe(false);
  });

  it('deelt alles daartussen', () => {
    expect(ijkpuntenVoor('beeld')).toHaveLength(11);
    expect(ijkpuntenVoor('getal')).toHaveLength(11);
  });
});

describe('waar de toren staat', () => {
  it('noemt het hoogste dat gehaald is', () => {
    expect(bereikt(1, 'beeld')).toBeNull();
    expect(bereikt(2, 'beeld')?.id).toBe('giraf');
    expect(bereikt(6, 'beeld')?.id).toBe('huis');
    expect(bereikt(6, 'getal')?.id).toBe('huis');
  });

  it('noemt alleen een passage van deze ronde', () => {
    expect(gepasseerd(1, 2, 'beeld')?.id).toBe('giraf');
    expect(gepasseerd(2, 3, 'beeld')).toBeNull();
    expect(gepasseerd(2, 2, 'beeld')).toBeNull();
  });

  it('noemt het verste als er twee in een ronde gehaald worden', () => {
    expect(gepasseerd(1, 5, 'beeld')?.id).toBe('huis');
  });

  it('wijst vooruit naar het eerstvolgende', () => {
    expect(volgende(0, 'beeld')?.id).toBe('giraf');
    expect(volgende(2, 'beeld')?.id).toBe('huis');
    expect(volgende(0, 'getal')?.id).toBe('huis');
    expect(volgende(99_999, 'getal')).toBeNull();
  });
});
