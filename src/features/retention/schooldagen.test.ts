import { describe, expect, it } from 'vitest';
import { schooldagen } from './schooldagen';

/** Maandag 14 september 2026, tien uur 's ochtends. */
const now = new Date('2026-09-14T10:00:00');

describe('de schooldagen van deze week', () => {
  /**
   * Tegen schooldagen afgezet en niet tegen zeven dagen: een weekend is geen dag
   * waarop een kind iets naliet. Zeven dagen terug vanaf maandag 14 september
   * bevat één zaterdag en één zondag, dus vijf schooldagen.
   */
  it('rekent tegen schooldagen en niet tegen zeven dagen', () => {
    expect(schooldagen(now)).toBe(5);
  });

  it('is vijf op elke dag van de week', () => {
    for (let dag = 0; dag < 7; dag++) {
      expect(schooldagen(new Date(2026, 8, 14 + dag, 10))).toBe(5);
    }
  });

  it('laat een vakantie buiten de week', () => {
    const herfst = [{ naam: 'Vrij', start: '2026-09-10', eind: '2026-09-11' }];
    expect(schooldagen(now, herfst)).toBe(3);
  });
});
