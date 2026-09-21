import { isSchoolDay, type HolidayPeriod } from '@/game-core';

/** Hoeveel dagen "deze week" is, in de tegels van Hoe vaak oefen je? */
export const WEEK_DAGEN = 7;

/**
 * Hoeveel schooldagen er in de laatste zeven dagen zaten, vandaag meegeteld.
 *
 * De noemer onder "Dagen geoefend" (ADR-172). Hij stond in het weekbericht
 * (ADR-133), dat premium was; het is een feit over de week van het eigen kind,
 * en die zijn gratis (ADR-124). Tegen schooldagen en niet tegen zeven dagen: een
 * weekend is geen dag waarop een kind iets naliet (`kalender.ts`).
 *
 * Zonder vakanties zijn het er altijd vijf — zeven dagen op rij bevatten precies
 * één zaterdag en één zondag. De vakanties zitten erin voor de dag dat het
 * product ze kent.
 */
export function schooldagen(now: Date, vakanties: readonly HolidayPeriod[] = []): number {
  let aantal = 0;
  for (let terug = 0; terug < WEEK_DAGEN; terug++) {
    const dag = new Date(now.getFullYear(), now.getMonth(), now.getDate() - terug);
    if (isSchoolDay(dag, vakanties)) aantal++;
  }
  return aantal;
}
