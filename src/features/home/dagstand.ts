import { dayKey } from '@/game-core';

/**
 * Wat vandaag was, zodat afmaken bestaat (ADR-139).
 *
 * Het dagplan wordt elke keer opnieuw uit de Leitner-standen gerekend, dus het
 * slinkt vanzelf: je doet een ronde en die rij is kleiner of weg. Wat ontbrak is
 * het tegenovergestelde van slinken — **de bodem**. Was alles gedaan, dan gaf
 * `VandaagBlok` `null` terug en verdween het blok zonder een woord. De beloning
 * voor precies op schema zijn, het enige dat een product met spaced repetition
 * een kind eerlijk kan vertellen, was dat er iets ophield te bestaan.
 *
 * Om "klaar voor vandaag" te kunnen zeggen moet je weten dát er iets was. Dat is
 * niet uit de standen af te leiden: een kind dat een vrije ronde speelt duwt
 * onderdelen vooruit die nooit in het plan zaten, en dan telt "gedaan" te hoog.
 * Dus ligt vast waar de dag mee begon.
 *
 * **Vandaag ligt vast zodra er iets te doen is.** Wat daarna nog vervalt, komt
 * morgen. Een dag die af kan zijn is het hele punt: `PLAN_RONDES` begrenst het
 * plan al tot vier rondes ("meer is geen plan maar een lijst"), en daarmee is
 * een dag een portie in plaats van een bodemloze lijst.
 *
 * **Een lege dag wordt niet vastgelegd**, en dat is geen detail. Zou dat wel
 * gebeuren, dan zet de eerste ronde van de ochtend — toen er nog niets aan de
 * beurt was — de dag vast op niets, en telt alles wat er die dag nog vervalt
 * niet meer mee. Een dag begint pas als er iets te doen is.
 *
 * **De sets liggen vast, de vragen niet.** Er wordt bijgehouden wélke sets er
 * vanochtend open stonden, niet welke onderdelen. Wat een ronde vraagt, komt
 * altijd vers uit de standen, dus er wordt nooit iets gevraagd dat net
 * beantwoord is.
 *
 * Puur: er gaat een bewaarde stand en een plan in, er komt een stand en een
 * voortgang uit.
 */

export interface Dagstand {
  /** YYYY-MM-DD, lokaal. */
  readonly dag: string;
  /** De sets waar deze dag mee begon. */
  readonly sets: readonly string[];
}

export interface Voortgang {
  /** Hoeveel sets van vandaag er nog open staan. */
  readonly over: number;
  /** Hoeveel er gedaan zijn. */
  readonly gedaan: number;
  /** Hoeveel het er vanochtend waren. */
  readonly totaal: number;
  /** Alles van vandaag is gedaan, en er was iets te doen. */
  readonly klaar: boolean;
}

/**
 * De stand van vandaag: de bewaarde als die van vandaag is, anders een nieuwe —
 * en null zolang er niets te doen is.
 */
export function standVoor(
  bewaard: Dagstand | null,
  planSets: readonly string[],
  now: Date,
): Dagstand | null {
  const dag = dayKey(now);
  if (bewaard !== null && bewaard.dag === dag) return bewaard;
  if (planSets.length === 0) return null;
  return { dag, sets: [...planSets] };
}

/**
 * Hoe ver vandaag is, gemeten langs wat er nu nog open staat.
 *
 * Een set van vanochtend die nu niets meer open heeft staan is gedaan — of dat
 * nu via het dagplan ging of doordat het kind die set uit zichzelf oefende. Dat
 * tweede is geen valsspelen maar precies het punt: het werk is gedaan.
 */
export function voortgangVan(stand: Dagstand, openNu: readonly string[]): Voortgang {
  const open = new Set(openNu);
  const over = stand.sets.filter((setId) => open.has(setId)).length;
  const totaal = stand.sets.length;

  return {
    over,
    gedaan: totaal - over,
    totaal,
    // Een dag die leeg begon is niet "klaar": er viel niets af te maken, en dat
    // vieren zou een compliment zijn voor niets doen.
    klaar: totaal > 0 && over === 0,
  };
}

/** De eerstvolgende set van vandaag die nog open staat, of null. */
export function volgendeSet(stand: Dagstand, openNu: readonly string[]): string | null {
  // De volgorde van nu en niet die van vanochtend: het plan zet het langst
  // verlopen vooraan, en dat is een dag later nog steeds de juiste eerste.
  return openNu.find((setId) => stand.sets.includes(setId)) ?? null;
}
