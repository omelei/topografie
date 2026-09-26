import { dayKey } from './kalender';
import type { PlanSet } from './dagplan';
import type { ItemState } from './types';

/**
 * Wat het dagplan deze week deed, ook zonder code (ADR-227).
 *
 * Het dagplan is premium (ADR-192), maar de dozen eronder lopen in de gratis
 * versie gewoon mee: elk antwoord schuift een onderdeel naar zijn volgende dag.
 * Het plan rekent dus stil mee, en een ouder kan zien wat het zou doen: hoeveel
 * er deze week geoefend is, en op welke dagen het terugkomt.
 *
 * Puur, zoals `dagplan`: er gaan sets, standen en een moment in, en er komen
 * twee getallen en een paar dagen uit.
 */

/** Vanaf hoeveel geoefende onderdelen in een week het blok er staat. */
export const WEEK_DREMPEL = 5;

/** Hoeveel herhaaldagen het blok noemt. */
export const HERHAALDAGEN = 2;

export interface WeekOverzicht {
  /** Hoeveel verschillende onderdelen er sinds maandag geoefend zijn. */
  readonly geoefend: number;
  /**
   * De eerstvolgende dagen waarop het plan iets klaarzet, YYYY-MM-DD, vanaf
   * vandaag. Wat al over tijd is, staat vandaag klaar.
   */
  readonly herhaaldagen: readonly string[];
}

/** De maandag van de week waarin `now` valt, op middernacht plaatselijke tijd. */
function maandag(now: Date): Date {
  const terug = (now.getDay() + 6) % 7;
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - terug);
}

/**
 * Over precies de onderdelen waar het dagplan over gaat: de sets die het plant
 * (geen mix, geen premiumonderwerp; dat filtert de aanroeper met `planSets`),
 * en alleen wat al eens beantwoord is. Nieuw is nooit "aan de beurt" (ADR-126).
 */
export function weekOverzicht<T>(
  sets: readonly PlanSet<T>[],
  states: ReadonlyMap<string, ItemState>,
  now: Date,
): WeekOverzicht {
  const sinds = maandag(now).getTime();
  const vandaag = dayKey(now);
  const gezien = new Set<string>();
  const dagen = new Set<string>();

  for (const { items } of sets) {
    for (const item of items) {
      const state = states.get(item.id);
      if (state === undefined || state.laatsteReview === null) continue;
      if (new Date(state.laatsteReview).getTime() >= sinds) gezien.add(item.id);
      if (state.volgendeReview === null) continue;
      const dag = dayKey(new Date(state.volgendeReview));
      dagen.add(dag < vandaag ? vandaag : dag);
    }
  }

  return {
    geoefend: gezien.size,
    herhaaldagen: [...dagen].sort().slice(0, HERHAALDAGEN),
  };
}
