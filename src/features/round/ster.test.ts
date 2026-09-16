import { describe, expect, it } from 'vitest';
import { sterstandVan } from './ster';

describe('sterstandVan', () => {
  it('telt de treden van de lopende ster', () => {
    expect(sterstandVan(3).vol).toBe(3);
    expect(sterstandVan(3).voltooid).toBe(false);
    expect(sterstandVan(9).vol).toBe(9);
    expect(sterstandVan(9).voltooid).toBe(false);
  });

  it('laat een volle ster vol staan in plaats van hem te laten terugvallen', () => {
    // Het tiende goede antwoord is modulo tien nul. Zou de rij dat volgen, dan
    // liep hij leeg op precies het moment dat de ster verdiend was.
    const stand = sterstandVan(10);
    expect(stand.voltooid).toBe(true);
    expect(stand.vol).toBe(10);
    expect(stand.treden).toBe(10);
  });

  it('begint weer bij nul zodra er een antwoord op volgt', () => {
    expect(sterstandVan(11).vol).toBe(1);
    expect(sterstandVan(11).voltooid).toBe(false);
  });

  it('noemt de hoeveelste ster van de kist dit is', () => {
    expect(sterstandVan(10).ster).toBe(1);
    expect(sterstandVan(20).ster).toBe(2);
    expect(sterstandVan(50).ster).toBe(5);
    // En de eerste van de kist erna, niet de zesde van deze.
    expect(sterstandVan(60).ster).toBe(1);
  });

  it('noemt tijdens het werken naar een ster toe de ster waar het naartoe gaat', () => {
    expect(sterstandVan(0).ster).toBe(1);
    expect(sterstandVan(9).ster).toBe(1);
    expect(sterstandVan(11).ster).toBe(2);
    expect(sterstandVan(49).ster).toBe(5);
  });

  it('telt af naar de kist, en nooit naar nul', () => {
    expect(sterstandVan(0).totKist).toBe(50);
    expect(sterstandVan(38).totKist).toBe(12);
    expect(sterstandVan(49).totKist).toBe(1);
    // Op de kist zelf telt hij alweer naar de volgende: vijftig, geen nul.
    expect(sterstandVan(50).totKist).toBe(50);
  });

  it('breekt niet op een stand die er niet zou moeten zijn', () => {
    const stand = sterstandVan(-5);
    expect(stand.totaal).toBe(0);
    expect(stand.vol).toBe(0);
    expect(stand.voltooid).toBe(false);
  });
});
