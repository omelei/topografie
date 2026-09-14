import type { ItemState } from './types';

/**
 * Hoe zwaar een ronde mag zijn, gegeven hoe het met deze set gaat (ADR-132).
 *
 * Leitner beantwoordt één vraag — *wanneer* moet dit terugkomen — en die vraag
 * is niet de enige die een ronde stelt. De tweede is *hoe moeilijk mag het nu
 * zijn*, en daar had dit product geen antwoord op: `ROUND_MIX` was één vaste
 * verhouding, voor elk kind, elke ronde, hoe het ook ging. Dat is precies het
 * gat met de aanpassende producten waar leer.nu naast staat.
 *
 * **Het signaal is de gemiddelde doos**, en met opzet niet het percentage goed
 * over alles. Die laatste is een levenslange teller: een kind dat een half jaar
 * worstelde en nu vlot is, blijft er maanden laag in staan. Een doos beweegt bij
 * élk antwoord, dus zegt het gemiddelde hoe het er *nu* voor staat.
 *
 * **Laag betekent minder nieuw, niet minder.** Een kind dat nog vecht met wat
 * het heeft, wordt niet geholpen door een ronde met meer onbekende vragen; het
 * wordt geholpen door herhaling en door vragen die het al kent. Omgekeerd is een
 * kind dat alles in doos vier heeft niet gebaat bij nóg een rondje bekende stof:
 * dat is de saaie kant van hetzelfde probleem.
 *
 * Dit is ook waarom de voorspelling en de ronde dezelfde functie gebruiken:
 * `roundPreview` zegt vooraf hoeveel vragen een kind eerder heeft gehad, en dat
 * moet waar blijven als de verhouding meebeweegt.
 */

export type Tempo = 'rustiger' | 'gewoon' | 'sneller';

export interface RoundMix {
  readonly due: number;
  readonly nieuw: number;
  readonly opfris: number;
}

/**
 * De drie verhoudingen. `gewoon` is de oude vaste verhouding, onveranderd: wie
 * gemiddeld in het midden zit, merkt van deze beslissing niets. `leitner.ts`
 * exporteert hem als `ROUND_MIX`, en deze module is met opzet de onderste van
 * de twee — andersom zouden ze elkaar importeren en zou deze tabel leeg kunnen
 * zijn op het moment dat hij gelezen wordt.
 */
export const TEMPO_MIX: Readonly<Record<Tempo, RoundMix>> = {
  rustiger: { due: 0.65, nieuw: 0.05, opfris: 0.3 },
  gewoon: { due: 0.7, nieuw: 0.2, opfris: 0.1 },
  sneller: { due: 0.6, nieuw: 0.35, opfris: 0.05 },
};

/**
 * Hoeveel onderdelen een kind gezien moet hebben voordat het gemiddelde iets
 * zegt. Onder dit aantal is één slechte dag het hele signaal, en dan is
 * "gewoon" het eerlijkste antwoord — ook omdat een kind dat net begint juist
 * nieuwe stof nodig heeft.
 */
export const TEMPO_MIN_GEZIEN = 5;

/** Onder deze gemiddelde doos gaat het nieuwe werk omlaag. */
export const TEMPO_MOEITE = 2;
/** Boven deze gemiddelde doos gaat het omhoog. */
export const TEMPO_VLOT = 3.5;

/**
 * De gemiddelde doos over de onderdelen van deze set die dit kind gezien heeft,
 * of null als dat er te weinig zijn.
 *
 * Alleen geziene onderdelen tellen. Zouden de ongeziene als doos één meetellen,
 * dan zou elke grote set altijd "rustiger" zijn — het gemiddelde zou vooral
 * meten hoe vol de set is en niet hoe het gaat.
 */
export function gemiddeldeDoos(
  states: ReadonlyMap<string, ItemState>,
  items: readonly { readonly id: string }[],
): number | null {
  let som = 0;
  let gezien = 0;

  for (const item of items) {
    const state = states.get(item.id);
    if (!state || state.laatsteReview === null) continue;
    som += state.box;
    gezien++;
  }

  return gezien < TEMPO_MIN_GEZIEN ? null : som / gezien;
}

export function tempoVoor(doos: number | null): Tempo {
  if (doos === null) return 'gewoon';
  if (doos < TEMPO_MOEITE) return 'rustiger';
  if (doos > TEMPO_VLOT) return 'sneller';
  return 'gewoon';
}

/** De verhouding waarmee een ronde over deze set samengesteld wordt. */
export function mixVoor(
  states: ReadonlyMap<string, ItemState>,
  items: readonly { readonly id: string }[],
): RoundMix {
  return TEMPO_MIX[tempoVoor(gemiddeldeDoos(states, items))];
}
