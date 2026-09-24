import { describe, expect, it } from 'vitest';
import { startbareOnderdelen } from '@/features/module/onderdelen';
import { overOnderwerp } from './over';

/** "Over dit onderwerp" (ADR-213): de inhoud zoals hij is, en de vragen van ouders. */
const deel = (setId: string) => {
  const gevonden = startbareOnderdelen().find((kandidaat) => kandidaat.setId === setId);
  if (!gevonden) throw new Error(setId);
  return gevonden;
};

describe('about a topic', () => {
  it('lists a capital with its province', () => {
    expect(overOnderwerp(deel('nl-hoofdsteden')).lijst).toContain('Groningen (Groningen)');
  });

  it('lists the table in full, the times in words, and the flags by name', () => {
    expect(overOnderwerp(deel('tafel-7')).lijst).toContain('7 × 8 = 56');
    expect(overOnderwerp(deel('klok-half')).lijst.some((regel) => regel.startsWith('half'))).toBe(
      true,
    );
    expect(overOnderwerp(deel('vlag-europa-bekend')).lijst).toContain('Nederland');
  });

  it('keeps a long list short, and says how many more there are', () => {
    const wereld = overOnderwerp(deel('wereld-landen'));
    expect(wereld.lijst.length).toBe(60);
    expect(wereld.meer).toBeGreaterThan(100);
  });

  it('answers the questions a parent asks', () => {
    const vragen = overOnderwerp(deel('nl-provincies')).vragen.map(({ vraag }) => vraag);
    expect(vragen).toEqual([
      'Hoe oefen je Provincies van Nederland?',
      'Voor welke groep is dit?',
      'Kan mijn kind dit ook op papier oefenen?',
      'Is het gratis?',
    ]);
  });
});
