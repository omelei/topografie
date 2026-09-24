import { describe, expect, it } from 'vitest';
import { routeFor } from '@/features/shell/routes';
import { groepenTekst, seoPaginas, titelVoor } from './paginas';

/**
 * Wat Google van leer.nu leest (ADR-207). Een pagina die naar een ander
 * onderwerp opent dan zijn titel zegt, of twee pagina's met dezelfde titel,
 * kost meer dan hij oplevert.
 */
describe('the pages Google reads', () => {
  const paginas = seoPaginas();

  it('has the front door, every subject and every topic, once', () => {
    const paden = paginas.map((pagina) => pagina.pad);
    expect(new Set(paden).size).toBe(paden.length);
    expect(paden).toContain('/');
    expect(paden).toContain('/topografie');
    expect(paden).toContain('/topografie/provincies');
    expect(paden).toContain('/rekenen/tafel-7');
    expect(paden).toContain('/taal/voltooid-deelwoord');
    expect(paden).toContain('/vlaggen/europa-bekend');
    // En het werkblad van elk onderwerp (ADR-211).
    expect(paden).toContain('/topografie/provincies/werkblad');
    expect(paden).toContain('/rekenen/tafel-7/werkblad');
    // Een mix en jouw fouten zijn geen onderwerp om op te zoeken.
    expect(paden.some((pad) => /mix|fouten/.test(pad))).toBe(false);
  });

  it('opens each address on what its title says', () => {
    for (const pagina of paginas) {
      const route = routeFor(pagina.pad);
      if (pagina.pad === '/') expect(route.name).toBe('home');
      else if (pagina.pad.endsWith('/werkblad')) expect(route.name, pagina.pad).toBe('werkblad');
      else if (pagina.pad === '/voor-ouders') expect(route.name).toBe('voorOuders');
      else expect(route.name, pagina.pad).toBe('module');
    }
    const provincies = routeFor('/topografie/provincies');
    expect(provincies.name === 'module' && provincies.setId).toBe('nl-provincies');
  });

  it('gives every page its own title, and a line that fits under it in Google', () => {
    const titels = paginas.map((pagina) => pagina.titel);
    expect(new Set(titels).size).toBe(titels.length);
    for (const pagina of paginas) {
      expect(pagina.titel, pagina.pad).toMatch(/leer\.nu$/);
      expect(pagina.beschrijving.length, pagina.pad).toBeLessThanOrEqual(160);
      expect(pagina.links.length, pagina.pad).toBeGreaterThan(0);
    }
  });

  it('names the group the way a parent says it', () => {
    expect(groepenTekst([6])).toBe('groep 6');
    expect(groepenTekst([6, 7])).toBe('groep 6 en 7');
    expect(groepenTekst([5, 6, 7, 8])).toBe('groep 5 tot en met 8');
  });

  it('puts the same title in the tab, and leer.nu where there is no page', () => {
    expect(titelVoor('/topografie/provincies')).toBe('Provincies van Nederland oefenen · leer.nu');
    expect(titelVoor('/topografie/provincies/')).toBe('Provincies van Nederland oefenen · leer.nu');
    expect(titelVoor('/jij')).toBe('leer.nu');
  });
});
