import { type ItemState } from './types';

/**
 * Wanneer iets terugkomt, en wat dat waard is om te zeggen (ADR-158).
 *
 * Dit was `album.ts`. Wat er over is, is wat niets met het album te maken had:
 * de vraag hoeveel er vandaag of morgen aan de beurt is, en hoe lang een ronde
 * ongeveer duurt. De lagen, de stempels en de tekens zijn met het album zelf
 * vervallen — wat een antwoord oplevert, staat nu in `toren.ts`.
 */

const DAG_MS = 86_400_000;

/** Hele kalenderdagen van `now` tot `moment`, minstens één. */
export function dagenTot(moment: string, now: Date): number {
  const dan = new Date(moment);
  const begin = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.max(1, Math.round((begin(dan) - begin(now)) / DAG_MS));
}

/** Wat terugkomen oplevert: de derde regel van de uitslag. */
export interface Vooruitblik {
  /** Plaatjes die morgen aan de beurt zijn (vandaag meegeteld). */
  readonly morgenTerug: number;
  /** Daarvan: plaatjes die dan voor het eerst kleur kunnen krijgen. */
  readonly morgenKleur: number;
  /** Anders: over zoveel dagen komt het eerste plaatje terug. */
  readonly eerstVolgende: number | null;
}

export function vooruitblik(
  ids: readonly string[],
  states: ReadonlyMap<string, ItemState>,
  now: Date,
): Vooruitblik {
  const overmorgen = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2).getTime();
  let morgenTerug = 0;
  let morgenKleur = 0;
  let eerst: string | null = null;
  for (const id of new Set(ids)) {
    const state = states.get(id);
    if (!state || state.laatsteReview === null || state.volgendeReview === null) continue;
    const wanneer = new Date(state.volgendeReview).getTime();
    if (wanneer < overmorgen) {
      morgenTerug++;
      if (state.box === ONTHOUDEN_BOX - 1 && laagVan(state) === ONTHOUDEN_BOX - 1) morgenKleur++;
    } else if (eerst === null || state.volgendeReview < eerst) {
      eerst = state.volgendeReview;
    }
  }
  return {
    morgenTerug,
    morgenKleur,
    eerstVolgende: morgenTerug === 0 && eerst !== null ? dagenTot(eerst, now) : null,
  };
}

/** Hoeveel items van deze lijst nu aan de beurt zijn: wat "vandaag klaar" telt. */
export function aanDeBeurt(
  ids: readonly string[],
  states: ReadonlyMap<string, ItemState>,
  now: Date,
): number {
  let aantal = 0;
  for (const id of new Set(ids)) {
    const state = states.get(id);
    if (!state || state.laatsteReview === null || state.volgendeReview === null) continue;
    if (new Date(state.volgendeReview).getTime() <= now.getTime()) aantal++;
  }
  return aantal;
}

/**
 * Het schooljaar van een datum, als het jaar waarin het begon: september 2026
 * tot en met augustus 2027 is 2026.
 */
export function schooljaarVan(date: Date): number {
  return date.getMonth() >= 8 ? date.getFullYear() : date.getFullYear() - 1;
}

/** Na zoveel dagen zonder ronde begroet de voordeur een kind als iemand die terugkomt. */
export const TERUGKOMST_DAGEN = 14;

/** Een vraag duurt met terugkoppeling ongeveer zoveel seconden (aanname). */
export const SECONDEN_PER_VRAAG = 22;

/** Hoeveel minuten `aantal` vragen ongeveer duren, minstens één. */
export function minutenVoor(aantal: number): number {
  return Math.max(1, Math.round((aantal * SECONDEN_PER_VRAAG) / 60));
}
