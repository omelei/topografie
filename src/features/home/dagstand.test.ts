import { describe, expect, it } from 'vitest';
import { standVoor, volgendeSet, voortgangVan, type Dagstand } from './dagstand';

const maandag = new Date('2026-09-14T09:00:00');
const dinsdag = new Date('2026-09-15T09:00:00');

describe('wat vandaag is', () => {
  it('legt vast waar de dag mee begint', () => {
    const stand = standVoor(null, ['tafel-3', 'nl-provincies'], maandag);
    expect(stand).toEqual({ dag: '2026-09-14', sets: ['tafel-3', 'nl-provincies'] });
  });

  /**
   * De kern van de keuze: wat later op de dag vervalt, komt morgen. Een dag die
   * gaandeweg groeit is nooit af, en afmaken is het hele punt.
   */
  it('groeit niet mee als er later op de dag iets bij komt', () => {
    const ochtend = standVoor(null, ['tafel-3'], maandag);
    const middag = standVoor(ochtend, ['tafel-3', 'nl-provincies', 'vlag-europa'], maandag);
    expect(middag?.sets).toEqual(['tafel-3']);
  });

  it('begint morgen opnieuw', () => {
    const gisteren = standVoor(null, ['tafel-3'], maandag);
    const vandaag = standVoor(gisteren, ['nl-provincies'], dinsdag);
    expect(vandaag).toEqual({ dag: '2026-09-15', sets: ['nl-provincies'] });
  });

  /**
   * De regel die het meest kan misgaan. Zou een lege dag wél worden vastgelegd,
   * dan zet de eerste ronde van de ochtend — toen er nog niets aan de beurt was
   * — de dag vast op niets, en telt alles wat er die dag nog vervalt niet meer
   * mee. Een dag begint pas als er iets te doen is.
   */
  it('legt een lege dag niet vast', () => {
    expect(standVoor(null, [], maandag)).toBeNull();
  });

  it('houdt een dag die begonnen is, ook als er niets meer openstaat', () => {
    const ochtend = standVoor(null, ['tafel-3'], maandag);
    expect(standVoor(ochtend, [], maandag)).toEqual(ochtend);
  });
});

describe('hoe ver vandaag is', () => {
  const stand: Dagstand = { dag: '2026-09-14', sets: ['tafel-3', 'nl-provincies', 'vlag-europa'] };

  it('telt wat er nog open staat', () => {
    expect(voortgangVan(stand, ['nl-provincies'])).toEqual({
      over: 1,
      gedaan: 2,
      totaal: 3,
      klaar: false,
    });
  });

  it('is klaar als er niets van vandaag meer open staat', () => {
    expect(voortgangVan(stand, []).klaar).toBe(true);
  });

  /** Een set die vandaag niet in het plan zat, maakt de dag niet onaf. */
  it('kijkt niet naar sets die vandaag niet meetelden', () => {
    expect(voortgangVan(stand, ['taal-sp-dt']).klaar).toBe(true);
  });

  /**
   * Een dag die leeg begon is niet "klaar": er viel niets af te maken, en dat
   * vieren zou een compliment zijn voor niets doen.
   */
  it('viert een dag zonder werk niet', () => {
    const leeg: Dagstand = { dag: '2026-09-14', sets: [] };
    expect(voortgangVan(leeg, []).klaar).toBe(false);
  });
});

describe('welke set als volgende', () => {
  const stand: Dagstand = { dag: '2026-09-14', sets: ['tafel-3', 'nl-provincies'] };

  /** De volgorde van nu, want het plan zet het langst verlopen vooraan. */
  it('volgt de volgorde van het plan van nu', () => {
    expect(volgendeSet(stand, ['nl-provincies', 'tafel-3'])).toBe('nl-provincies');
  });

  it('slaat over wat vandaag niet meetelde', () => {
    expect(volgendeSet(stand, ['taal-sp-dt', 'tafel-3'])).toBe('tafel-3');
  });

  it('geeft niets als vandaag klaar is', () => {
    expect(volgendeSet(stand, [])).toBeNull();
  });
});
