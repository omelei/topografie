/**
 * De maten van de toren (ADR-158), als getallen en niet als CSS.
 *
 * Apart van de tekening omdat "een toren van één verdieping en een toren van
 * veertig passen allebei in hetzelfde kader" een bewering over getallen is, en
 * dus te toetsen zonder iets te tekenen.
 *
 * **Eén vaste viewBox voor elke toren.** Het passend maken is een schaal die
 * hier uitgerekend wordt, niet een viewBox die met het aantal verdiepingen
 * meebeweegt. Dat scheelt niet alleen meten in de browser: bij een meebewegende
 * viewBox weet de code niet meer hoe groot een letter op het scherm wordt, en
 * het getal in het fundamentblok zou dan bij een hoge toren onleesbaar klein
 * zijn en bij een lage toren beeldvullend.
 */

/** Het toneel, in eenheden. Op 393px is één eenheid ongeveer één pixel. */
export const TONEEL = { breed: 320, hoog: 360 } as const;

/** Eén steen, liggend: breder dan hoog, zoals metselwerk. */
export const STEEN = { breed: 24, hoog: 15 } as const;

/** De voeg tussen twee stenen. Wordt getekend als lijn die niet meeschaalt. */
export const VOEG = 1.5;

/** Vijf naast elkaar en twee op elkaar: tien, en na te tellen als 5 + 5. */
export const PER_RIJ = 5;
export const RIJEN_PER_VERDIEPING = 2;

/** De breedte van de schacht, en de ruimte die de tekening in de breedte vraagt. */
export const SCHACHT = PER_RIJ * STEEN.breed + (PER_RIJ - 1) * VOEG;
export const INHOUD_BREED = SCHACHT + 10;

/** Drie meter, in eenheden. */
export const VERDIEPING_HOOG = RIJEN_PER_VERDIEPING * STEEN.hoog;

/**
 * De toren staat één verdieping ín de grond, en er is één verdieping lucht.
 *
 * Het begraven deel is wat het pannen veilig maakt: er is altijd metselwerk
 * onder de rand, dus een camera die een verdieping zakt, legt nooit een einde
 * bloot. De lucht erboven is waar de stenen van deze ronde vandaan komen.
 */
export const BEGRAVEN = VERDIEPING_HOOG;
export const LUCHT = VERDIEPING_HOOG;

/** Het fundamentblok: één blok met het aantal erin, hoe diep je begin ook is. */
export const FUNDAMENT_HOOG = 60;

/**
 * Hoeveel verdiepingen er los getekend worden.
 *
 * **Twintig, en niet veertig.** Veertig verdiepingen zijn tachtig rijen stenen;
 * in een kader van 360 eenheden is dat 4,5 eenheid per rij en een steen van
 * 6,6 bij 4,5. Op 393px is dat geen steen meer maar een korrel: vijf naast
 * elkaar is dan niet meer na te tellen en een kleurvlakje van zes pixels leest
 * niet meer als een kleur. Veertig kan wel op een breed kader, en daarom is dit
 * een waarde en geen wet.
 */
export const MAX_GETEKEND = 20;

/**
 * De hoogte die een toren minstens krijgt toebedeeld.
 *
 * Zonder dit zou een toren van één verdieping worden opgeblazen tot hij het hele
 * kader vult — een staal in plaats van een toren. Mét dit groeit een toren
 * zichtbaar van zijn eerste tot zijn tiende verdieping, en daarna krimpt de
 * steen in plaats van dat de toren groeit.
 */
export const MIN_INHOUD_HOOG = TONEEL.hoog;

export interface Maatvoering {
  /** Waarmee de tekening vermenigvuldigd wordt om in het kader te passen. */
  readonly schaal: number;
  /** Hoeveel verdiepingen er los getekend worden, bovenaan. */
  readonly getekend: number;
  /** Hoeveel verdiepingen er in het fundamentblok zitten. */
  readonly inFundament: number;
  /** De hoogte van het fundamentblok, nul als er geen is. */
  readonly fundamentHoog: number;
  /** De hoogte die de tekening in eenheden vraagt, met de bodem meegerekend. */
  readonly inhoudHoog: number;
  /**
   * Hoeveel van het toneel er te zien is, in eenheden.
   *
   * Zonder dit staat een toren van één verdieping onderin een kader van 360 met
   * driehonderd eenheden lege lucht erboven — en dat is precies het beeld dat
   * elk kind de eerste twee dagen ziet. Het kader groeit dus met de toren mee
   * tot het vol is, en daarna niet meer: vanaf tien verdiepingen heeft elke
   * toren hetzelfde kader en zijn twee torens niet meer met het oog te
   * vergelijken.
   */
  readonly zichtbaar: number;
}

/** Zoveel is er altijd te zien, ook bij een toren die nog niet bestaat. */
export const MIN_ZICHTBAAR = 150;

export function maatvoering(verdiepingen: number, max: number = MAX_GETEKEND): Maatvoering {
  const heel = Math.max(0, Math.floor(verdiepingen));
  const getekend = Math.min(heel, max);
  const inFundament = heel - getekend;
  const fundamentHoog = inFundament > 0 ? FUNDAMENT_HOOG : 0;

  // De verdieping in aanbouw staat in de lucht erboven, dus die telt niet apart.
  const gemetseld = BEGRAVEN + fundamentHoog + getekend * VERDIEPING_HOOG + LUCHT;
  const inhoudHoog = Math.max(MIN_INHOUD_HOOG, gemetseld);
  const schaal = Math.min(TONEEL.breed / INHOUD_BREED, TONEEL.hoog / inhoudHoog);

  return {
    schaal,
    getekend,
    inFundament,
    fundamentHoog,
    inhoudHoog,
    zichtbaar: Math.min(TONEEL.hoog, Math.max(MIN_ZICHTBAAR, gemetseld * schaal)),
  };
}

/**
 * Waar steen `index` van een verdieping staat, ten opzichte van de onderkant
 * van die verdieping. De x loopt vanaf het midden, de y is negatief omhoog.
 *
 * De onderste rij eerst: een verdieping wordt gemetseld en niet gevuld.
 */
export function steenPlek(index: number): { readonly x: number; readonly y: number } {
  const rij = Math.floor(index / PER_RIJ);
  const kolom = index % PER_RIJ;
  return {
    x: -SCHACHT / 2 + kolom * (STEEN.breed + VOEG),
    y: -(rij + 1) * STEEN.hoog,
  };
}

/** De onderkant van de `rang`-ste getekende verdieping, nul is de onderste. */
export function verdiepingY(rang: number, maat: Maatvoering): number {
  return -(maat.fundamentHoog + rang * VERDIEPING_HOOG);
}
