import { isStale, MAX_BOX, ONTHOUDEN_BOX } from './leitner';
import type { ItemState, LeitnerBox } from './types';

/**
 * Het album (ADR-149): elk item is een plaatje dat lagen krijgt.
 *
 * **De laag is de hoogste doos die het item ooit bereikte**, niet de huidige.
 * Nul is leeg, één tot drie is een schets die voller wordt, vier is kleur
 * ("onthoud je") en vijf een lijstje. Een fout zet de motor terug naar doos één
 * en het plaatje niet: wat een kind verdiende, gaat er nooit af. Wat het item nu
 * nodig heeft, staat er als teken bij.
 *
 * **Een plaatje is nooit af.** Na de lijst komt bij elk goed antwoord in doos
 * vijf dat aan de beurt was een stempel, en dat kan hooguit eens per drie weken.
 * Herhalen levert dus altijd iets op, en vaker oefenen levert niet meer op.
 */

/** 0 is leeg; 1–3 schets; 4 kleur; 5 lijst. */
export type Laag = 0 | LeitnerBox;

/** Wat een plaatje met kleur nu nodig heeft. Een schets krijgt geen teken. */
export type Teken = 'opfrissen' | 'lastig';

const DAG_MS = 86_400_000;

/** De laag van een item: de hoogste doos ooit, of nul als het nooit beantwoord is. */
export function laagVan(state: ItemState | undefined): Laag {
  if (!state || state.laatsteReview === null) return 0;
  return Math.max(state.hoogsteDoos ?? 1, state.box) as LeitnerBox;
}

/** De stempels op de achterkant, oudste eerst. */
export function stempelsVan(state: ItemState | undefined): readonly string[] {
  return state?.stempels ?? [];
}

/**
 * Het teken op een plaatje met kleur.
 *
 * _Lastig_ als het na de kleur fout ging: de motor staat dan onder doos vier,
 * en het teken gaat weg zodra hij daar weer is. _Opfrissen_ als het te lang niet
 * gezien is (`isStale`). Lastig gaat voor, want dat is het nieuws.
 */
export function tekenVan(state: ItemState | undefined, now: Date): Teken | null {
  if (!state || laagVan(state) < ONTHOUDEN_BOX) return null;
  if (state.box < ONTHOUDEN_BOX) return 'lastig';
  return isStale(state, now) ? 'opfrissen' : null;
}

/** Hele kalenderdagen van `now` tot `moment`, minstens één. */
export function dagenTot(moment: string, now: Date): number {
  const dan = new Date(moment);
  const begin = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.max(1, Math.round((begin(dan) - begin(now)) / DAG_MS));
}

/** Wat één antwoord met het plaatje deed. */
export interface Stap {
  readonly van: Laag;
  readonly naar: Laag;
  /** Er kwam een stempel bij. */
  readonly stempel: boolean;
  /** Na de kleur fout: het teken lastig kwam erbij. */
  readonly lastig: boolean;
  /** Een lastig plaatje staat weer op kleur: het teken ging eraf. */
  readonly weerGoed: boolean;
  /**
   * Goed, maar niet aan de beurt: over zoveel dagen telt het weer. Null als het
   * antwoord wel telde.
   */
  readonly wachtDagen: number | null;
}

export function stapVan(vorige: ItemState, volgende: ItemState, now: Date): Stap {
  const van = laagVan(vorige);
  const naar = laagVan(volgende);
  const telde = volgende.volgendeReview !== vorige.volgendeReview || vorige.laatsteReview === null;
  const goed = volgende.goedCount > vorige.goedCount;
  return {
    van,
    naar,
    stempel: stempelsVan(volgende).length > stempelsVan(vorige).length,
    lastig: van >= ONTHOUDEN_BOX && vorige.box >= ONTHOUDEN_BOX && volgende.box < ONTHOUDEN_BOX,
    weerGoed: van >= ONTHOUDEN_BOX && vorige.box < ONTHOUDEN_BOX && volgende.box >= ONTHOUDEN_BOX,
    wachtDagen:
      goed && !telde && volgende.volgendeReview !== null
        ? dagenTot(volgende.volgendeReview, now)
        : null,
  };
}

/** Hoe een pagina ervoor staat. */
export interface PaginaStand {
  readonly totaal: number;
  /** Minstens een schets. */
  readonly begonnen: number;
  /** Kleur of meer. */
  readonly kleur: number;
  readonly lijst: number;
  readonly stempels: number;
  readonly opfrissen: number;
  readonly lastig: number;
  /** Elk plaatje heeft kleur. */
  readonly inKleur: boolean;
}

export function paginaStand(
  ids: readonly string[],
  states: ReadonlyMap<string, ItemState>,
  now: Date,
): PaginaStand {
  const uniek = [...new Set(ids)];
  let begonnen = 0;
  let kleur = 0;
  let lijst = 0;
  let stempels = 0;
  let opfrissen = 0;
  let lastig = 0;
  for (const id of uniek) {
    const state = states.get(id);
    const laag = laagVan(state);
    if (laag > 0) begonnen++;
    if (laag >= ONTHOUDEN_BOX) kleur++;
    if (laag === MAX_BOX) lijst++;
    stempels += stempelsVan(state).length;
    const teken = tekenVan(state, now);
    if (teken === 'opfrissen') opfrissen++;
    if (teken === 'lastig') lastig++;
  }
  return {
    totaal: uniek.length,
    begonnen,
    kleur,
    lijst,
    stempels,
    opfrissen,
    lastig,
    inKleur: uniek.length > 0 && kleur === uniek.length,
  };
}

/** Wat een ronde met het album deed, voor de uitslag. */
export interface RondeAlbum {
  /** Plaatjes die een laag erbij kregen. */
  readonly verder: number;
  /** Plaatjes die deze ronde voor het eerst kleur kregen. */
  readonly kleur: number;
  readonly lijst: number;
  readonly stempels: number;
  readonly weerGoed: number;
  readonly lastig: number;
  /** De plaatjes waar iets aan veranderde, om op de pagina aan te wijzen. */
  readonly veranderd: readonly string[];
  /** De pagina is deze ronde helemaal in kleur gekomen. */
  readonly paginaInKleur: boolean;
}

export function rondeAlbum(
  ids: readonly string[],
  voor: ReadonlyMap<string, ItemState>,
  na: ReadonlyMap<string, ItemState>,
  now: Date,
): RondeAlbum {
  const uniek = [...new Set(ids)];
  let verder = 0;
  let kleur = 0;
  let lijst = 0;
  let stempels = 0;
  let weerGoed = 0;
  let lastig = 0;
  const veranderd: string[] = [];
  for (const id of uniek) {
    const v = voor.get(id);
    const n = na.get(id);
    const van = laagVan(v);
    const naar = laagVan(n);
    const vBox = v?.box ?? 1;
    const nBox = n?.box ?? 1;
    const extraStempels = stempelsVan(n).length - stempelsVan(v).length;
    const wasLastig = van >= ONTHOUDEN_BOX && vBox < ONTHOUDEN_BOX;
    const isLastig = naar >= ONTHOUDEN_BOX && nBox < ONTHOUDEN_BOX;
    let iets = false;
    if (naar > van) {
      verder++;
      iets = true;
      if (van < ONTHOUDEN_BOX && naar >= ONTHOUDEN_BOX) kleur++;
      if (van < MAX_BOX && naar === MAX_BOX) lijst++;
    }
    if (extraStempels > 0) {
      stempels += extraStempels;
      iets = true;
    }
    if (wasLastig && !isLastig) {
      weerGoed++;
      iets = true;
    }
    if (!wasLastig && isLastig) {
      lastig++;
      iets = true;
    }
    if (iets) veranderd.push(id);
  }
  const standVoor = paginaStand(uniek, voor, now);
  const standNa = paginaStand(uniek, na, now);
  return {
    verder,
    kleur,
    lijst,
    stempels,
    weerGoed,
    lastig,
    veranderd,
    paginaInKleur: !standVoor.inKleur && standNa.inKleur,
  };
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

/** Een seizoen van een schooljaar: waar een bijhoudstempel bij hoort. */
export type Seizoen = 'herfst' | 'winter' | 'lente' | 'zomer';

export const SEIZOENEN: readonly Seizoen[] = ['herfst', 'winter', 'lente', 'zomer'];

/**
 * Het schooljaar van een datum, als het jaar waarin het begon: september 2026
 * tot en met augustus 2027 is 2026.
 */
export function schooljaarVan(date: Date): number {
  return date.getMonth() >= 8 ? date.getFullYear() : date.getFullYear() - 1;
}

/**
 * Het seizoen van een datum, meteorologisch: herfst is september tot en met
 * november. De sleutel noemt het schooljaar, zodat de winter van december en
 * die van februari dezelfde winter zijn.
 */
export function seizoenVan(date: Date): { readonly seizoen: Seizoen; readonly sleutel: string } {
  const maand = date.getMonth();
  const seizoen: Seizoen =
    maand >= 8 && maand <= 10
      ? 'herfst'
      : maand === 11 || maand <= 1
        ? 'winter'
        : maand <= 4
          ? 'lente'
          : 'zomer';
  return { seizoen, sleutel: `${schooljaarVan(date)}-${seizoen}` };
}

/**
 * De bijhoudstempel die een diploma nu verdient, of null (ADR-149).
 *
 * Een diploma is het begin van bijhouden, niet het eind. In elk seizoen na het
 * seizoen waarin het gehaald is, krijgt het één stempel als de pagina op dat
 * moment nog rijp is: dezelfde lat als het afzwemmen zelf (ADR-141). Dat vraagt
 * dat de plaatjes recent genoeg gezien zijn om niet te hoeven opfrissen, en is
 * dus te verdienen door bij te houden en niet door één keer veel te oefenen.
 */
export function bijhoudstempel(
  behaaldOp: string,
  eerdere: readonly string[],
  rijp: boolean,
  now: Date,
): string | null {
  if (!rijp) return null;
  const behaald = new Date(behaaldOp);
  if (Number.isNaN(behaald.getTime()) || behaald.getTime() > now.getTime()) return null;
  const { sleutel } = seizoenVan(now);
  if (sleutel === seizoenVan(behaald).sleutel || eerdere.includes(sleutel)) return null;
  return sleutel;
}

/** Na zoveel dagen zonder ronde begroet de voordeur een kind als iemand die terugkomt. */
export const TERUGKOMST_DAGEN = 14;

/** Een vraag duurt met terugkoppeling ongeveer zoveel seconden (aanname, ADR-149). */
export const SECONDEN_PER_VRAAG = 22;

/** Hoeveel minuten `aantal` vragen ongeveer duren, minstens één. */
export function minutenVoor(aantal: number): number {
  return Math.max(1, Math.round((aantal * SECONDEN_PER_VRAAG) / 60));
}
