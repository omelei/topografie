import type { BoundingBox } from './map';

/**
 * Inzoomen op de wereldkaart (ADR-146).
 *
 * Op een telefoon is de wereldkaart zo'n 345 pixels breed, en dan is
 * Luxemburg een halve pixel. ADR-087 rekende uit dat 160 van de 167 landen daar
 * niet aan te wijzen zijn, en liet aanwijzen daarom achteraan staan. Deze
 * gebieden zijn het andere antwoord: een knop die de kaart vergroot tot een
 * deel van de wereld, zoals Lizard Point een vergrootglas op de wereldkaart
 * legt. Wisselen van gebied is geen antwoord en kost dus niets.
 *
 * **Twee niveaus, omdat één niet genoeg is.** Een werelddeel vergroot vijf keer,
 * en in Europa blijven op een telefoon dan nog negentien landen te klein. Daarom
 * heeft een werelddeel waar dat nodig is een paar delen, die tien tot twintig
 * keer vergroten. Gemeten, niet gegokt: `wereldRegios.test.ts` rekent voor elk
 * land uit of het in minstens één gebied te raken is, met dezelfde regels als de
 * kaart zelf.
 *
 * **Een venster in graden, zoals een atlas zijn bladzijde kiest.** De
 * wereldkaart is Miller-cilindrisch, met de passing van
 * `tools/content/build-countries.mjs` (1000 breed, rand van 10). Die passing is
 * hier nagerekend in plaats van opgeslagen, zodat een venster te lezen is als
 * "van 11° west tot 20° oost" en niet als vier getallen zonder betekenis.
 */

export type RegioId =
  | 'europa'
  | 'europa-west'
  | 'europa-noord'
  | 'europa-balkan'
  | 'europa-oost'
  | 'afrika'
  | 'afrika-noord'
  | 'afrika-west'
  | 'afrika-midden-oost'
  | 'afrika-zuid'
  | 'azie'
  | 'azie-midden-oosten'
  | 'azie-zuid-centraal'
  | 'azie-oost'
  | 'azie-zuidoost'
  | 'noord-amerika'
  | 'noord-amerika-midden'
  | 'zuid-amerika'
  | 'oceanie';

export interface WereldRegio {
  readonly id: RegioId;
  /** Het werelddeel waar dit een deel van is, of null voor een werelddeel zelf. */
  readonly ouder: RegioId | null;
  /** West, oost, zuid en noord, in graden. */
  readonly venster: readonly [number, number, number, number];
}

export const WERELD_REGIOS: readonly WereldRegio[] = [
  { id: 'europa', ouder: null, venster: [-25, 45, 34, 71] },
  { id: 'europa-west', ouder: 'europa', venster: [-11, 20, 36, 58] },
  { id: 'europa-noord', ouder: 'europa', venster: [4, 32, 53, 71] },
  { id: 'europa-balkan', ouder: 'europa', venster: [13, 30, 38, 48] },
  { id: 'europa-oost', ouder: 'europa', venster: [14, 42, 43, 60] },
  { id: 'afrika', ouder: null, venster: [-26, 52, -36, 38] },
  { id: 'afrika-noord', ouder: 'afrika', venster: [-18, 37, 15, 38] },
  { id: 'afrika-west', ouder: 'afrika', venster: [-18, 16, 3, 18] },
  { id: 'afrika-midden-oost', ouder: 'afrika', venster: [5, 52, -12, 16] },
  { id: 'afrika-zuid', ouder: 'afrika', venster: [10, 41, -35, -8] },
  { id: 'azie', ouder: null, venster: [25, 150, -11, 56] },
  { id: 'azie-midden-oosten', ouder: 'azie', venster: [25, 63, 12, 42] },
  { id: 'azie-zuid-centraal', ouder: 'azie', venster: [58, 98, 5, 45] },
  { id: 'azie-oost', ouder: 'azie', venster: [98, 146, 20, 46] },
  { id: 'azie-zuidoost', ouder: 'azie', venster: [88, 128, -11, 25] },
  { id: 'noord-amerika', ouder: null, venster: [-170, -50, 7, 84] },
  { id: 'noord-amerika-midden', ouder: 'noord-amerika', venster: [-93, -59, 7, 27] },
  { id: 'zuid-amerika', ouder: null, venster: [-82, -34, -56, 13] },
  { id: 'oceanie', ouder: null, venster: [110, 180, -48, 0] },
];

/** De passing van de wereldkaart: 980 eenheden voor 360 graden, een rand van 10. */
const RAND = 10;
const SCHAAL = 980 / (2 * Math.PI);
/** Miller-y van de noordrand van de kaart, nagerekend uit de gebouwde vormen. */
const NOORD_Y = 1.959;

function millerY(lat: number): number {
  const phi = (Math.max(-89.5, Math.min(89.5, lat)) * Math.PI) / 180;
  return 1.25 * Math.log(Math.tan(Math.PI / 4 + 0.4 * phi));
}

/** Een punt in graden, op de wereldkaart. */
export function opWereldkaart(lon: number, lat: number): readonly [number, number] {
  return [RAND + ((lon + 180) * Math.PI * SCHAAL) / 180, RAND + (NOORD_Y - millerY(lat)) * SCHAAL];
}

export function regioById(id: RegioId): WereldRegio {
  return WERELD_REGIOS.find((regio) => regio.id === id) as WereldRegio;
}

/** Het venster van een gebied als view box op de wereldkaart: x, y, breedte, hoogte. */
export function regioViewBox(id: RegioId): readonly [number, number, number, number] {
  const [west, oost, zuid, noord] = regioById(id).venster;
  const [x0, y0] = opWereldkaart(west, noord);
  const [x1, y1] = opWereldkaart(oost, zuid);
  return [x0, y0, x1 - x0, y1 - y0];
}

/** De werelddelen, in de volgorde van de knoppen. */
export function werelddelen(): readonly WereldRegio[] {
  return WERELD_REGIOS.filter((regio) => regio.ouder === null);
}

/** De delen van een werelddeel; leeg als het er geen heeft. */
export function delenVan(id: RegioId): readonly WereldRegio[] {
  const top = regioById(id).ouder ?? id;
  return WERELD_REGIOS.filter((regio) => regio.ouder === top);
}

/** Of een punt in een view box ligt. */
export function ligtIn(
  punt: readonly [number, number],
  view: readonly [number, number, number, number],
): boolean {
  const [x, y, w, h] = view;
  return punt[0] >= x && punt[0] <= x + w && punt[1] >= y && punt[1] <= y + h;
}

/** Of een bounding box een view box raakt: wat daarbuiten valt, hoeft niet getekend. */
export function raakt(box: BoundingBox, view: readonly [number, number, number, number]): boolean {
  const [x, y, w, h] = view;
  return box[2] >= x && box[0] <= x + w && box[3] >= y && box[1] <= y + h;
}

/**
 * Het kleinste gebied waarin al deze punten liggen, of null als dat alleen de
 * hele wereld is.
 *
 * Voor het moment na een antwoord: wie ingezoomd op West-Europa Japan zocht en
 * op Frankrijk drukte, moet allebei kunnen zien. Het kleinste gebied, omdat de
 * afstand tussen die twee het hele punt van het uitslagmoment is.
 */
export function kleinsteRegioMet(punten: readonly (readonly [number, number])[]): RegioId | null {
  let beste: { id: RegioId; oppervlak: number } | null = null;
  for (const regio of WERELD_REGIOS) {
    const view = regioViewBox(regio.id);
    if (!punten.every((punt) => ligtIn(punt, view))) continue;
    const oppervlak = view[2] * view[3];
    if (beste === null || oppervlak < beste.oppervlak) beste = { id: regio.id, oppervlak };
  }
  return beste?.id ?? null;
}
