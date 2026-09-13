import { describe, expect, it } from 'vitest';
import { isPremiumOnderwerp, isPremiumVorm, metPremium } from './premium';
import { eersteRegio, regiosVan, regioVraag, TAAL_DELEN, TOPO_REGIOS } from './regios';

/**
 * What will need an account, marked before there is one (ADR-111), and the
 * map each page opens on.
 */
describe('premium', () => {
  it('leaves zoeken, meerkeuze and zelf typen free, and marks every other way', () => {
    // ADR-112: the three ways that ask about one thing at a time are free on
    // every page; the rest is premium.
    const gratis = [
      'wijs-aan',
      'klok-welke-klok',
      'vlag-zoeken',
      'meerkeuze',
      'som-meerkeuze',
      'klok-meerkeuze',
      'vlag-meerkeuze',
      'hoe-heet-dit',
      'som-typen',
      'klok-typen',
      // Taal's choosing and typing (ADR-118).
      'taal-letters',
      'taal-vorm-kiezen',
      'taal-flitsdictee',
      'taal-vorm-typen',
    ];
    for (const vorm of gratis) {
      expect(isPremiumVorm(vorm as Parameters<typeof isPremiumVorm>[0]), vorm).toBe(false);
    }
    for (const vorm of [
      'ontdekken',
      'bliksemronde',
      'overleven',
      'tafeldiploma',
      'vlag-diploma',
      'klok-diploma',
      'topo-diploma',
      'vlag-gemengd',
    ]) {
      expect(isPremiumVorm(vorm as Parameters<typeof isPremiumVorm>[0]), vorm).toBe(true);
    }
  });

  it("marks every module's list of mistakes and nothing else", () => {
    for (const id of ['fouten', 'nl-fouten', 'wereld-fouten', 'klok-fouten', 'taal-sp-fouten']) {
      expect(isPremiumOnderwerp(id), id).toBe(true);
    }
    for (const id of ['tafels', 'nl-mix', 'provincies']) {
      expect(isPremiumOnderwerp(id), id).toBe(false);
    }
  });

  it('puts the word at the end of a name, so the name still leads', () => {
    expect(metPremium('Oefentoets', true)).toBe('Oefentoets. Premium');
    expect(metPremium('Meerkeuze', false)).toBe('Meerkeuze');
  });
});

describe('the map a page opens on', () => {
  it('is Nederland on topography and the world on flags', () => {
    expect(eersteRegio('topo', TOPO_REGIOS)).toBe('nederland');
    expect(eersteRegio('vlaggen', TOPO_REGIOS)).toBe('wereld');
    expect(eersteRegio('tafels', [])).toBeNull();
  });

  it('is Spelling on Taal, whose row asks which part (ADR-118)', () => {
    expect(regiosVan('woorden')).toBe(TAAL_DELEN);
    expect(TAAL_DELEN.map((deel) => deel.id)).toEqual(['spelling', 'werkwoorden']);
    expect(eersteRegio('woorden', TAAL_DELEN)).toBe('spelling');
    expect(regioVraag('woorden')).toBe('deel.title');
    expect(regioVraag('topo')).toBe('regio.title');
  });
});
