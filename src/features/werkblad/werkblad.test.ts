import { describe, expect, it } from 'vitest';
import { startbareOnderdelen, type Onderdeel } from '@/features/module/onderdelen';
import { heeftWerkblad, werkbladVoor, zaadVan } from './werkblad';

/**
 * Een werkblad om te printen (ADR-211): welk onderwerp er een heeft, dat
 * hetzelfde zaad hetzelfde blad geeft, en dat elke vraag een antwoord heeft
 * voor de tweede pagina.
 */
const deel = (setId: string): Onderdeel => {
  const gevonden = startbareOnderdelen().find((kandidaat) => kandidaat.setId === setId);
  if (!gevonden) throw new Error(setId);
  return gevonden;
};

describe('worksheets', () => {
  it('exist for a topic, and not for a mix or a list of mistakes', () => {
    for (const setId of [
      'nl-provincies',
      'nl-hoofdsteden',
      'tafel-7',
      'klok-half',
      'vlag-europa-bekend',
      'taal-sp-eiij',
      'taal-ww-vt',
    ]) {
      expect(heeftWerkblad(deel(setId)), setId).toBe(true);
    }
    for (const setId of ['nl-mix', 'rekenmix', 'klok-mix', 'fouten', 'taal-sp-mix']) {
      expect(heeftWerkblad(deel(setId)), setId).toBe(false);
    }
  });

  it('gives every topic that has one at least one question, each with an answer', () => {
    for (const onderdeel of startbareOnderdelen().filter(heeftWerkblad)) {
      const blad = werkbladVoor(onderdeel, zaadVan(onderdeel.setId));
      expect(blad?.vragen.length ?? 0, onderdeel.setId).toBeGreaterThan(0);
      for (const vraag of blad?.vragen ?? []) {
        expect(vraag.antwoord.length, onderdeel.setId).toBeGreaterThan(0);
      }
    }
  });

  it('keeps one sheet to what fits on a page', () => {
    expect(werkbladVoor(deel('keer-100'), 1)?.vragen.length).toBeLessThanOrEqual(30);
    expect(werkbladVoor(deel('klok-vijf'), 1)?.vragen.length).toBeLessThanOrEqual(12);
    expect(werkbladVoor(deel('vlag-wereld-alle'), 1)?.vragen.length).toBeLessThanOrEqual(20);
    expect(werkbladVoor(deel('wereld-landen'), 1)?.vragen.length).toBeLessThanOrEqual(25);
  });

  it('gives the same sheet for the same seed, and another for another', () => {
    const een = werkbladVoor(deel('keer-100'), 7);
    expect(werkbladVoor(deel('keer-100'), 7)).toEqual(een);
    expect(werkbladVoor(deel('keer-100'), 8)).not.toEqual(een);
  });

  it('writes a sum with a line to fill in', () => {
    const vraag = werkbladVoor(deel('tafel-7'), 1)?.vragen[0];
    expect(vraag?.soort).toBe('som');
    if (vraag?.soort === 'som') {
      expect(vraag.tekst).toMatch(/× 7 = _+$|7 × \d+ = _+$|\d+ × \d+ = _+$/);
      expect(vraag.antwoord).toMatch(/=/);
    }
  });

  it('leaves the letters to fill in open, and says which to choose from', () => {
    const vraag = werkbladVoor(deel('taal-sp-eiij'), 1)?.vragen[0];
    expect(vraag?.soort).toBe('zin');
    if (vraag?.soort === 'zin') {
      expect(vraag.gat).toContain('__');
      expect(vraag.hint).toBe('(ei / ij)');
      expect(`${vraag.voor}${vraag.antwoord}${vraag.na}`.length).toBeGreaterThan(
        vraag.antwoord.length,
      );
    }
  });
});
