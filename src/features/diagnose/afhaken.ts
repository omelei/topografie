import { dayKey, type ModeId } from '@/game-core';

/**
 * Waar een kind afhaakt, uit wat er al op het apparaat staat (ADR-128).
 *
 * Dit product heeft met opzet geen analytics: er wordt niets gemeten over een
 * kind dat het apparaat verlaat, en dat blijft zo. Het gevolg is wel dat de
 * enige vraag die over het voortbestaan gaat — *waarom stoppen ze?* — tot nu
 * toe alleen te beantwoorden was met een onderbuikgevoel.
 *
 * Maar het staat er al. Elke ronde schrijft `gestart`, elk antwoord schrijft
 * `tijdstip`, `correct` en `responseMs`. Dat is genoeg om de vraag te stellen
 * zonder iemand te volgen: dit rekent over één apparaat, voor wie dat apparaat
 * vasthoudt, en er gaat niets weg.
 *
 * **Het gaat om de vórm, niet om één getal.** "Veertig procent afgebroken" zegt
 * niets over waarom. Wat het onderscheidt is wat er vlak vóór het stoppen
 * gebeurde: gaat het mis in de laatste drie vragen, dan is het te moeilijk;
 * gaat het juist goed, dan is de ronde te lang. Daarom staan die twee getallen
 * hier naast hun eigen vergelijking, en nooit alleen.
 *
 * Puur, en zo getest. Het leest geen klok, geen database en geen toeval: wat
 * er in gaat zijn rondes met hun antwoorden, wat er uit komt zijn getallen.
 */

export interface DiagnoseAntwoord {
  readonly correct: boolean;
  readonly responseMs: number;
  /** ISO 8601. */
  readonly tijdstip: string;
}

export interface DiagnoseRonde {
  readonly mode: ModeId;
  /** Hoeveel vragen de ronde zich voornam te stellen. */
  readonly gevraagd: number;
  /** ISO 8601. */
  readonly gestart: string;
  /** De antwoorden die gegeven zijn, op volgorde van tijd. */
  readonly antwoorden: readonly DiagnoseAntwoord[];
}

/** Hoeveel antwoorden vóór het afbreken meetellen als "vlak ervoor". */
export const LAATSTE = 3;

/** In hoeveel stukken de ronde verdeeld wordt om te zien waar het stopt. */
export const STUKKEN = 3;

export interface Diagnose {
  /** Rondes met een vast einde en minstens één antwoord: de noemer. */
  readonly rondes: number;
  readonly afgemaakt: number;
  readonly afgebroken: number;
  /** Afgebroken als percentage van `rondes`, of null als er geen rondes zijn. */
  readonly afbreekPercentage: number | null;
  /** Mediaan van hoeveel vragen er beantwoord waren toen het stopte. */
  readonly stopBijVraag: number | null;
  /** Waar in de ronde het stopte: begin, midden, eind. Telt op tot `afgebroken`. */
  readonly stopVerdeling: readonly number[];
  /** Aandeel fout (0-1) in de laatste antwoorden vóór een afbreking. */
  readonly foutVoorStop: number | null;
  /** Aandeel fout (0-1) over alle antwoorden. Waar `foutVoorStop` tegen afgezet wordt. */
  readonly foutAlgemeen: number | null;
  /** Mediane responstijd in ms, over alle antwoorden. */
  readonly tempoAlgemeen: number | null;
  /** Mediane responstijd in ms vlak vóór een afbreking. */
  readonly tempoVoorStop: number | null;
  /** Mediaan van hoeveel vragen een afgemaakte ronde stelde. */
  readonly lengteAfgemaakt: number | null;
  /** Op hoeveel losse dagen er geoefend is. */
  readonly oefendagen: number;
  /** Mediaan aantal dagen tussen twee opeenvolgende oefendagen. */
  readonly gatTussenDagen: number | null;
}

const DAG_MS = 86_400_000;

function mediaan(waarden: readonly number[]): number | null {
  if (waarden.length === 0) return null;
  const op = [...waarden].sort((een, ander) => een - ander);
  const midden = Math.floor(op.length / 2);
  if (op.length % 2 === 1) return op[midden] ?? null;
  const links = op[midden - 1];
  const rechts = op[midden];
  if (links === undefined || rechts === undefined) return null;
  return (links + rechts) / 2;
}

function deel(teller: number, noemer: number): number | null {
  return noemer === 0 ? null : teller / noemer;
}

/**
 * In welk stuk van de ronde het stopte, 0 voor het begin.
 *
 * Verhoudingsgewijs en niet op vraagnummer, zodat een ronde van tien en een
 * ronde van vijftien in hetzelfde vakje kunnen vallen als ze op dezelfde plek
 * stuklopen. `stopBijVraag` geeft het absolute getal ernaast, want dát is wat
 * een besluit over rondelengte nodig heeft.
 */
export function stukVan(beantwoord: number, gevraagd: number): number {
  if (gevraagd <= 0) return 0;
  const stuk = Math.floor((beantwoord / gevraagd) * STUKKEN);
  return Math.min(Math.max(stuk, 0), STUKKEN - 1);
}

export function diagnose(rondes: readonly DiagnoseRonde[]): Diagnose {
  const meetbaar = rondes.filter((ronde) => ronde.gevraagd > 0 && ronde.antwoorden.length > 0);

  const stopPosities: number[] = [];
  const stopVerdeling = Array.from({ length: STUKKEN }, () => 0);
  const lengtes: number[] = [];
  const tempoAlles: number[] = [];
  const tempoStop: number[] = [];
  const dagen = new Set<string>();

  let afgemaakt = 0;
  let afgebroken = 0;
  let foutAlles = 0;
  let antwoordenAlles = 0;
  let foutStop = 0;
  let antwoordenStop = 0;

  for (const ronde of meetbaar) {
    dagen.add(dayKey(new Date(ronde.gestart)));

    for (const antwoord of ronde.antwoorden) {
      antwoordenAlles++;
      if (!antwoord.correct) foutAlles++;
      tempoAlles.push(antwoord.responseMs);
    }

    const beantwoord = ronde.antwoorden.length;
    if (beantwoord >= ronde.gevraagd) {
      afgemaakt++;
      lengtes.push(beantwoord);
      continue;
    }

    afgebroken++;
    stopPosities.push(beantwoord);
    const stuk = stukVan(beantwoord, ronde.gevraagd);
    stopVerdeling[stuk] = (stopVerdeling[stuk] ?? 0) + 1;

    // Wat er vlak vóór het stoppen gebeurde. Dit is het getal dat de twee
    // verklaringen uit elkaar houdt, dus het telt alleen over afgebroken
    // rondes: de laatste drie van een afgemaakte ronde zijn het einde, niet
    // het afhaken.
    for (const antwoord of ronde.antwoorden.slice(-LAATSTE)) {
      antwoordenStop++;
      if (!antwoord.correct) foutStop++;
      tempoStop.push(antwoord.responseMs);
    }
  }

  return {
    rondes: meetbaar.length,
    afgemaakt,
    afgebroken,
    afbreekPercentage: deel(afgebroken * 100, meetbaar.length),
    stopBijVraag: mediaan(stopPosities),
    stopVerdeling,
    foutVoorStop: deel(foutStop, antwoordenStop),
    foutAlgemeen: deel(foutAlles, antwoordenAlles),
    tempoAlgemeen: mediaan(tempoAlles),
    tempoVoorStop: mediaan(tempoStop),
    lengteAfgemaakt: mediaan(lengtes),
    oefendagen: dagen.size,
    gatTussenDagen: mediaan(gaten(dagen)),
  };
}

/** Hoeveel dagen er tussen twee opeenvolgende oefendagen zaten. */
function gaten(dagen: ReadonlySet<string>): number[] {
  const op = [...dagen].sort();
  const uit: number[] = [];
  for (let i = 1; i < op.length; i++) {
    const vorige = op[i - 1];
    const deze = op[i];
    if (vorige === undefined || deze === undefined) continue;
    uit.push(Math.round((new Date(deze).getTime() - new Date(vorige).getTime()) / DAG_MS));
  }
  return uit;
}

/**
 * Welke verklaring de cijfers steunen.
 *
 * Dit is waar het instrument voor bestaat. "Veertig procent afgebroken" laat de
 * lezer zelf gissen, en dan is het weer een onderbuikgevoel — alleen eentje met
 * een getal ernaast. Dus trekt dit de conclusie, of het zegt dat het er nog
 * geen kan trekken.
 *
 * De drempels hieronder zijn een **oordeel en geen meting**. Ze zijn gekozen om
 * de twee verklaringen uit elkaar te houden bij de aantallen van één gezin, niet
 * om een grens te trekken die ergens anders vandaan komt. Wie ze verschuift,
 * verschuift de uitkomst; ze staan daarom hier bij elkaar en niet verspreid
 * door een scherm.
 */
export type Duiding = 'weinig' | 'gaatGoed' | 'teMoeilijk' | 'teLang' | 'onduidelijk';

/** Onder dit aantal rondes is elk percentage één kind met een slechte ochtend. */
export const GENOEG_RONDES = 10;
/** Tot hier is afbreken gewoon hoe kinderen een app gebruiken. */
export const AFBREKEN_NORMAAL = 20;
/** Hoeveel hoger het foutpercentage vlak voor het stoppen moet zijn om iets te zeggen. */
export const FOUT_FACTOR = 1.5;
export const FOUT_MARGE = 0.15;

export function duiding(uit: Diagnose): Duiding {
  if (uit.rondes < GENOEG_RONDES) return 'weinig';
  if (uit.afbreekPercentage !== null && uit.afbreekPercentage <= AFBREKEN_NORMAAL) {
    return 'gaatGoed';
  }

  const { foutVoorStop, foutAlgemeen } = uit;
  if (foutVoorStop !== null && foutAlgemeen !== null) {
    // Het ging vlak voor het stoppen duidelijk vaker mis dan gemiddeld: dan is
    // het niet de lengte maar de moeilijkheid die ze wegjaagt.
    if (foutVoorStop >= foutAlgemeen * FOUT_FACTOR && foutVoorStop >= foutAlgemeen + FOUT_MARGE) {
      return 'teMoeilijk';
    }
    // Het ging niet slechter dan anders en ze stoppen toch — en niet meteen aan
    // het begin, want dan waren ze er alleen even in. Dat is een ronde die meer
    // vraagt dan ze te geven hebben.
    const laat = (uit.stopVerdeling[1] ?? 0) + (uit.stopVerdeling[2] ?? 0);
    if (laat > (uit.stopVerdeling[0] ?? 0)) return 'teLang';
  }

  return 'onduidelijk';
}
