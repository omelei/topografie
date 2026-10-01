import { describe, expect, it } from 'vitest';
import { balkStand, openStap, scrollAfstand, segmenten, type StapStand } from './stappen';

/** Topo: kaart, onderwerp, spelvorm, en zodra die er zijn hoeveel vragen. */
function stand(...gekozen: boolean[]): StapStand[] {
  const ids = ['regio', 'wat', 'hoe', 'aantal'] as const;
  return gekozen.map((ja, plek) => ({ id: ids[plek] ?? 'aantal', gekozen: ja }));
}

describe('de stappen op een telefoon (ADR-252)', () => {
  it('opent met niets gekozen stap 1', () => {
    expect(openStap(stand(false, false, false), 'auto')).toBe('regio');
  });

  it('gaat na een keuze vanzelf door naar de volgende stap', () => {
    expect(openStap(stand(true, false, false), 'auto')).toBe('wat');
    expect(openStap(stand(true, true, false), 'auto')).toBe('hoe');
  });

  it('zet na de laatste keuze alles dicht', () => {
    const alles = stand(true, true, true, true);
    expect(openStap(alles, 'auto')).toBeNull();
    expect(balkStand(alles, null)).toBe('start');
  });

  it('opent met Wijzig die stap, en daarna de eerste stap die nog leeg is', () => {
    // Wijzig op de kaart, met alles gekozen.
    expect(openStap(stand(true, true, true, true), 'regio')).toBe('regio');
    expect(balkStand(stand(true, true, true, true), 'regio')).toBe('allesGekozen');
    // Een andere kaart wist het onderwerp: na de keuze gaat het daar verder,
    // en niet bij de stap na de kaart die toevallig ook leeg zou zijn.
    expect(openStap(stand(true, false, true, true), 'auto')).toBe('wat');
    // Dezelfde kaart nog eens: niets leeg, alles dicht.
    expect(openStap(stand(true, true, true, true), 'auto')).toBeNull();
  });

  it('vergeet een geopende stap die er niet meer is', () => {
    // "Hoeveel vragen?" was open, en de spelvorm heeft geen lengte meer.
    expect(openStap(stand(true, true, false), 'aantal')).toBe('hoe');
  });

  it('kleurt de segmenten: gekozen, open en nog', () => {
    expect(segmenten(stand(true, false, false), 'wat')).toEqual(['gekozen', 'open', 'nog']);
    expect(segmenten(stand(true, true, true), 'regio')).toEqual(['open', 'gekozen', 'gekozen']);
    expect(balkStand(stand(true, false, false), 'wat')).toBe('kiezen');
  });

  it('scrolt alleen als de stap niet al bovenin staat, met 80 pixels lucht', () => {
    expect(scrollAfstand(100, 800)).toBe(0);
    expect(scrollAfstand(360, 800)).toBe(0);
    expect(scrollAfstand(500, 800)).toBe(420);
    expect(scrollAfstand(-200, 800)).toBe(-280);
  });
});
