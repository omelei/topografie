import type { Gespeeld, Onderdeel } from '@/features/module/onderdelen';
import type { OpenRound } from '@/store/progress';

/**
 * Nu doen: de ene kaart bovenaan Vandaag voor een kind dat al geoefend heeft
 * (ADR-250).
 *
 * Vijf blokken kozen elk hun eigen plek: Welkom terug, Vandaag herhalen, Maak
 * af, de geheugencheck en Meest geoefend. Op een telefoon stond de knop die de
 * begroeting beloofde daardoor onder de vouw. Nu kiest één regel welke van de
 * vijf bovenaan staat, en de rest is bereikbaar in Verder oefenen eronder.
 *
 * **De volgorde is de voorrang.** Wie twee weken weg was, begint met één korte
 * ronde terug. Met premium gaat wat vandaag terug moet voor: dat is waar een
 * ronde nu het meeste uithaalt. Een ronde die half af is, is de kortste weg
 * naar een ronde die af is. De geheugencheck is één keer per kind en heeft
 * geen haast. En anders: verder met wat je het laatst deed.
 */
export type NuDoenSoort = 'terug' | 'herhalen' | 'maakAf' | 'check' | 'verder';

export const VOORRANG: readonly NuDoenSoort[] = ['terug', 'herhalen', 'maakAf', 'check', 'verder'];

/** Welke van de vijf er nu kunnen. */
export type NuDoenStand = Readonly<Record<NuDoenSoort, boolean>>;

/** De eerste die kan, of null als er niets is (een kind dat nog niets deed). */
export function kiesNuDoen(stand: NuDoenStand): NuDoenSoort | null {
  return VOORRANG.find((soort) => stand[soort]) ?? null;
}

/** Een kaart in Verder oefenen: een ronde die half af is, of een gespeeld onderwerp. */
export type VerderKaart =
  | { readonly soort: 'half'; readonly deel: Onderdeel; readonly ronde: OpenRound }
  | { readonly soort: 'gespeeld'; readonly deel: Onderdeel; readonly gespeeld: Gespeeld };

/** Hoeveel kaarten de rij draagt. Hij scrolt; tien is een week oefenen. */
export const VERDER_GETOOND = 10;

/**
 * Verder oefenen: Meest geoefend, Recent geoefend en Maak af in één rij
 * (ADR-250).
 *
 * Elk onderwerp één keer. Wat half af is, staat vooraan, het nieuwste eerst;
 * daarna wat gespeeld is, ook het nieuwste eerst. Het onderwerp van Nu doen
 * staat er niet nog een keer in.
 */
export function verderOefenen(
  open: readonly OpenRound[],
  gespeeld: readonly Gespeeld[],
  alles: readonly Onderdeel[],
  zonder: string | null,
  hoeveel: number = VERDER_GETOOND,
): VerderKaart[] {
  const gezien = new Set<string>(zonder === null ? [] : [zonder]);
  const kaarten: VerderKaart[] = [];

  for (const ronde of open) {
    const deel = alles.find((kandidaat) => kandidaat.setId === ronde.setId);
    if (!deel || gezien.has(deel.setId)) continue;
    gezien.add(deel.setId);
    kaarten.push({ soort: 'half', deel, ronde });
  }
  for (const ronde of gespeeld) {
    if (gezien.has(ronde.deel.setId)) continue;
    gezien.add(ronde.deel.setId);
    kaarten.push({ soort: 'gespeeld', deel: ronde.deel, gespeeld: ronde });
  }

  return kaarten.slice(0, hoeveel);
}

/** De nieuwste ronde die half af is en bij een onderwerp hoort, of null. */
export function halfAf(
  open: readonly OpenRound[],
  alles: readonly Onderdeel[],
): { readonly deel: Onderdeel; readonly ronde: OpenRound } | null {
  for (const ronde of open) {
    const deel = alles.find((kandidaat) => kandidaat.setId === ronde.setId);
    if (deel) return { deel, ronde };
  }
  return null;
}
