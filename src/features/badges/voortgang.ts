import { countBewezen } from '@/game-core';
import { nodigVoor, standVan, type Doelwit } from '@/features/home/doel';
import type { ItemState } from '@/game-core';

/**
 * Hoe ver een diploma is, voor de ring op zijn kaart.
 *
 * Twee getallen die met opzet niet hetzelfde meten, en het verschil is het hele
 * ontwerp:
 *
 * - **`bewezen`** telt elk onderdeel dat óóit doos vier haalde: `countBewezen`,
 *   dat de hoogste doos leest en niet de doos van vandaag. Daardoor kan de ring
 *   nooit teruglopen. Een kind dat twee weken ziek is, komt terug bij een ring
 *   die staat waar hij stond; een kind dat er één fout maakt ook, want een fout
 *   zet het item terug naar doos één en dát is precies wat hier niet meetelt.
 *   Er gaat in dit beloningsprogramma nooit iets af.
 * - **`rijp`** is de lat van ADR-141, ongewijzigd, en die telt wél met `now`:
 *   een diploma waarvan je de helft weer kwijt bent, is geen diploma dat bijna
 *   af is.
 *
 * Die twee lopen na ruim twee weken wegblijven uiteen, en dan staat de ring vol
 * terwijl de toets dicht is. Dat is geen fout maar de prijs van "de ring loopt
 * nooit terug", en de kaart zegt het dan met zoveel woorden: even opfrissen.
 *
 * Puur, zodat de ring te toetsen is zonder store en zonder DOM.
 */
export interface Voortgang {
  /** Onderdelen die ooit doos vier haalden. Loopt nooit terug. */
  readonly bewezen: number;
  readonly totaal: number;
  /** De diplomadrempel: de hele set bij een tafel, negen op de tien elders. */
  readonly nodig: number;
  /** De lat van ADR-141, met `now`: wordt de toets aangeboden? */
  readonly rijp: boolean;
}

export function voortgangVan(
  doelwit: Doelwit,
  states: ReadonlyMap<string, ItemState>,
  now: Date,
): Voortgang {
  const ids = doelwit.deel.items.map((item) => item.id);
  const totaal = ids.length;
  return {
    bewezen: countBewezen(states, ids),
    totaal,
    nodig: nodigVoor(doelwit, totaal),
    rijp: standVan(doelwit, states, now).rijp,
  };
}

/** Hoe vol de ring staat, in procenten. Nooit boven de honderd. */
export function vulling(voortgang: Voortgang): number {
  if (voortgang.nodig <= 0) return 0;
  return Math.min(100, Math.round((voortgang.bewezen / voortgang.nodig) * 100));
}

export type KaartStand = 'gehaald' | 'rijp' | 'opfrissen' | 'bezig' | 'nietsNog';

/**
 * Welke van de vijf dingen een kaart zegt. Volgorde is de beslisvolgorde:
 * gehaald wint van alles, en "even opfrissen" bestaat alleen als de ring vol is
 * maar de lat niet gehaald wordt.
 */
export function kaartStandVan(gehaald: boolean, voortgang: Voortgang | null): KaartStand {
  if (gehaald) return 'gehaald';
  if (voortgang === null) return 'bezig';
  if (voortgang.rijp) return 'rijp';
  if (voortgang.bewezen >= voortgang.nodig && voortgang.nodig > 0) return 'opfrissen';
  if (voortgang.bewezen === 0) return 'nietsNog';
  return 'bezig';
}
