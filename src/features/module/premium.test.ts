import { describe, expect, it } from 'vitest';
import { isPremiumOnderwerp, isPremiumVorm, metPremium } from './premium';
import { eersteRegio, regiosVan, regioVraag, TAAL_DELEN, TOPO_REGIOS } from './regios';

/**
 * What will need an account, marked before there is one (ADR-111), and the
 * map each page opens on.
 */
describe('premium', () => {
  it('leaves ontdekken and meerkeuze free, and marks everything else (ADR-192)', () => {
    const gratis = [
      'ontdekken',
      'meerkeuze',
      'som-meerkeuze',
      'klok-meerkeuze',
      'vlag-meerkeuze',
      // Taal's choosing (ADR-118).
      'taal-letters',
      'taal-vorm-kiezen',
    ];
    for (const vorm of gratis) {
      expect(isPremiumVorm(vorm as Parameters<typeof isPremiumVorm>[0]), vorm).toBe(false);
    }
    for (const vorm of [
      // Zoeken and typen, free until ADR-192.
      'wijs-aan',
      'klok-welke-klok',
      'vlag-zoeken',
      'hoe-heet-dit',
      'som-typen',
      'klok-typen',
      'taal-flitsdictee',
      'taal-vorm-typen',
      // Every diploma, the tafeldiploma too.
      'tafeldiploma',
      'reken-diploma',
      'vlag-diploma',
      'klok-diploma',
      'topo-diploma',
      'bliksemronde',
      'overleven',
      'vlag-gemengd',
    ]) {
      expect(isPremiumVorm(vorm as Parameters<typeof isPremiumVorm>[0]), vorm).toBe(true);
    }
  });

  it("marks every module's collected list of mistakes and nothing else", () => {
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

  it('says what a locked tile does, because pressing it is not choosing', () => {
    // ADR-125, ADR-163. Een premiumtegel is niet uitgeschakeld: hij opent de
    // vraag aan de ouders, en een naam die eindigt op het kale woord "Premium"
    // kondigde dat niet aan.
    expect(metPremium('Oefentoets', true, false)).toBe(
      'Oefentoets. Premium. Je krijgt eerst een vraag voor je ouders.',
    );
    // Met code is er nergens heen te sturen, dus staat het woord er weer alleen.
    expect(metPremium('Oefentoets', true, true)).toBe('Oefentoets. Premium');
    expect(metPremium('Meerkeuze', false, false)).toBe('Meerkeuze');
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
