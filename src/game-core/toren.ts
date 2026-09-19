import { dagenTot } from './album';
import { isDue } from './leitner';
import type { ItemState } from './types';

/**
 * De toren (ADR-158): één steen voor wat je nog wist.
 *
 * **De regel is één zin.** Een antwoord levert één steen op als het goed is, het
 * item aan de beurt was, en het item eerder al eens beantwoord is. Alles
 * daarbuiten levert nul op, en er gaat nooit iets af — niet bij een fout, niet na
 * een week niets doen, nooit.
 *
 * Dat is strenger dan de doosstap van Leitner, met opzet. Een nieuw item is per
 * definitie aan de beurt en gaat bij een goed antwoord van doos één naar twee,
 * maar het levert geen steen op: je wist het nog niet, je leerde het net. De steen
 * is er voor het moment dat iets terugkwam en je het nóg wist, want dat is het
 * enige moment waarop er bewijs is dat er iets blijft hangen.
 *
 * Het begrip bestond al in `leitner.ts` als `stempels`, alleen beperkt tot doos
 * vijf. De steen is hetzelfde voor alle dozen. Eén boekhouding, geen tweede, en
 * `leitner.ts` verandert er geen letter voor.
 */

/** Wat een steen aan een vak koppelt. Null is een steen uit het fundament. */
export type Vak = string;

/** Tien stenen is een verdieping, en die drempel loopt nooit op. */
export const STENEN_PER_VERDIEPING = 10;

/** Een verdieping is drie meter. */
export const METER_PER_VERDIEPING = 3;

/**
 * De enige regel.
 *
 * `vorige` is de stand zoals de ronde het item vond, dus vóór `review`. Daarna is
 * `isDue` niet meer te beantwoorden: een goed antwoord heeft de planning dan al
 * verzet.
 */
export function levertSteen(vorige: ItemState, correct: boolean, now: Date): boolean {
  return correct && vorige.laatsteReview !== null && isDue(vorige, now);
}

/** Een volle verdieping: hij heeft een nummer, een datum en tien stenen. */
export interface Verdieping {
  readonly nummer: number;
  /** ISO 8601, de dag waarop hij vol raakte. */
  readonly datum: string;
  /** De vakken van de tien stenen, op volgorde. Null is een steen uit het fundament. */
  readonly vakken: readonly (Vak | null)[];
}

/**
 * Wat er van een toren bewaard wordt.
 *
 * `fundament` is altijd een veelvoud van tien: wat een kind al had toen de toren
 * begon, afgerond op hele verdiepingen, en de rest is bij het begin meteen in de
 * aanbouw gezet (zie `beginToren`). Zo betekent `fundament` altijd precies
 * "zoveel verdiepingen zonder datum", en hoeft nergens anders gerekend te worden.
 */
export interface TorenOpslag {
  readonly fundament: number;
  readonly verdiepingen: readonly Verdieping[];
  readonly aanbouw: readonly (Vak | null)[];
}

/** Een lege toren, voor een kind dat nog nooit een antwoord gaf. */
export const LEGE_TOREN: TorenOpslag = { fundament: 0, verdiepingen: [], aanbouw: [] };

/**
 * De toren waarmee een bestaand kind begint (ADR-158).
 *
 * Alles wat het ooit goed had, wordt fundament. Royaal met opzet: de overgang van
 * het album naar de toren mag nooit als verlies voelen, en dit telt dus ook
 * antwoorden mee die onder de nieuwe regel geen steen zouden zijn geweest. Daarom
 * dragen die verdiepingen geen datum en staan ze onder één label.
 *
 * De rest onder de tien gaat meteen in de aanbouw, zodat `fundament` een veelvoud
 * van tien blijft en een kind met 87 goede antwoorden acht verdiepingen ziet met
 * zeven stenen erbovenop — en niet acht verdiepingen en een zoekgeraakte rest.
 */
export function beginToren(goedTotaal: number): TorenOpslag {
  const heel = Math.max(0, Math.floor(goedTotaal));
  const rest = heel % STENEN_PER_VERDIEPING;
  return {
    fundament: heel - rest,
    verdiepingen: [],
    aanbouw: Array.from({ length: rest }, () => null),
  };
}

/**
 * De stenen van een ronde erbij, en de verdiepingen die hij volmaakte.
 *
 * Append-only: dit voegt toe en gooit nooit iets weg. Een verdieping die vol
 * raakt, krijgt het nummer dat op het fundament en de eerdere verdiepingen volgt,
 * en de datum van dit moment.
 */
export function stenenErbij(
  toren: TorenOpslag,
  vakken: readonly Vak[],
  now: Date,
): TorenOpslag {
  if (vakken.length === 0) return toren;

  const datum = now.toISOString();
  const verdiepingen = [...toren.verdiepingen];
  let aanbouw = [...toren.aanbouw, ...vakken];

  while (aanbouw.length >= STENEN_PER_VERDIEPING) {
    verdiepingen.push({
      nummer: toren.fundament / STENEN_PER_VERDIEPING + verdiepingen.length + 1,
      datum,
      vakken: aanbouw.slice(0, STENEN_PER_VERDIEPING),
    });
    aanbouw = aanbouw.slice(STENEN_PER_VERDIEPING);
  }

  return { fundament: toren.fundament, verdiepingen, aanbouw };
}

/** Hoe een toren ervoor staat: alles wat een scherm erover wil zeggen. */
export interface TorenStand {
  readonly stenen: number;
  /** Volle verdiepingen, het fundament meegeteld. */
  readonly verdiepingen: number;
  readonly meter: number;
  /** Verdiepingen zonder datum, uit wat het kind al had. */
  readonly fundament: number;
  /** De verdiepingen met een datum, oudste eerst. */
  readonly volle: readonly Verdieping[];
  /** De stenen in de verdieping in aanbouw. */
  readonly aanbouw: readonly (Vak | null)[];
  /** Het nummer van de verdieping in aanbouw. */
  readonly inAanbouw: number;
  /** Nog zoveel stenen tot die verdieping af is. */
  readonly rest: number;
}

export function standVan(toren: TorenOpslag): TorenStand {
  const fundament = toren.fundament / STENEN_PER_VERDIEPING;
  const verdiepingen = fundament + toren.verdiepingen.length;
  return {
    stenen: toren.fundament + toren.verdiepingen.length * STENEN_PER_VERDIEPING + toren.aanbouw.length,
    verdiepingen,
    meter: verdiepingen * METER_PER_VERDIEPING,
    fundament,
    volle: toren.verdiepingen,
    aanbouw: toren.aanbouw,
    inAanbouw: verdiepingen + 1,
    rest: STENEN_PER_VERDIEPING - toren.aanbouw.length,
  };
}

/**
 * Wat één antwoord opleverde, voor de terugkoppeling in de ronde.
 *
 * Vier gevallen en niet meer. `fout` zegt met opzet niets over stenen: een kind
 * dat het niet wist, hoeft niet ook nog te horen wat het daardoor niet kreeg.
 */
export type SteenUitkomst = 'steen' | 'alGekend' | 'nieuw' | 'fout';

export interface SteenStap {
  readonly uitkomst: SteenUitkomst;
  /** Het vak, voor de kleur van het blokje. */
  readonly vak: Vak;
  /** Over hoeveel dagen dit item terugkomt. Null bij een fout. */
  readonly dagen: number | null;
}

/**
 * Wat er van één antwoord te zeggen valt.
 *
 * `vorige` is de stand van vóór `review`, want daarna is "was het aan de beurt"
 * niet meer te beantwoorden.
 */
export function steenStapVan(
  vorige: ItemState,
  volgende: ItemState,
  correct: boolean,
  now: Date,
  vak: Vak,
): SteenStap {
  if (!correct) return { uitkomst: 'fout', vak, dagen: null };

  const dagen = volgende.volgendeReview === null ? null : dagenTot(volgende.volgendeReview, now);
  if (vorige.laatsteReview === null) return { uitkomst: 'nieuw', vak, dagen };
  return { uitkomst: levertSteen(vorige, correct, now) ? 'steen' : 'alGekend', vak, dagen };
}
