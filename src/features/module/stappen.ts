/**
 * De stappen van een vakpagina op een telefoon, als accordeon (ADR-252).
 *
 * Precies één stap staat open. Welke, volgt uit één regel: **de eerste stap
 * zonder antwoord**, tenzij het kind zelf op een gekozen stap drukte om hem te
 * wijzigen. Na elke keuze geldt de regel weer. Zo opent na stap 1 vanzelf stap
 * 2; na de laatste keuze is alles dicht en staat de startknop er; en na
 * "Wijzig" en een keuze gaat het verder bij de eerste stap die nog leeg is —
 * ook als die keuze een latere stap leegmaakte, zoals een andere kaart het
 * onderwerp.
 *
 * Hier staat alleen de regel, zonder React, zodat hij te testen is zonder een
 * pagina.
 */

/** Welke vraag een stap stelt: waar, wat, welke, hoe en hoeveel. */
export type StapId = 'regio' | 'wat' | 'keuze' | 'hoe' | 'aantal';

/** Een stap zoals de pagina hem nu heeft: in volgorde, met of zonder antwoord. */
export interface StapStand {
  readonly id: StapId;
  readonly gekozen: boolean;
}

/** Wat het kind wil zien: een stap die het opende, of de regel ('auto'). */
export type OpenWens = StapId | 'auto';

/** De stap die openstaat, of null als alles gekozen is en niets geopend. */
export function openStap(stappen: readonly StapStand[], wens: OpenWens): StapId | null {
  if (wens !== 'auto' && stappen.some((stap) => stap.id === wens)) return wens;
  return stappen.find((stap) => !stap.gekozen)?.id ?? null;
}

/**
 * Wat de balk onderaan toont: zolang er iets te kiezen is de voortgang; als
 * alles gekozen is maar er een stap openstaat een kleine startknop; en als
 * alles dicht is het grote startblok.
 */
export type BalkStand = 'kiezen' | 'allesGekozen' | 'start';

export function balkStand(stappen: readonly StapStand[], open: StapId | null): BalkStand {
  if (!stappen.every((stap) => stap.gekozen)) return 'kiezen';
  return open === null ? 'start' : 'allesGekozen';
}

/** Eén segment van de voortgang: gekozen, open, of nog te doen. */
export type Segment = 'gekozen' | 'open' | 'nog';

export function segmenten(stappen: readonly StapStand[], open: StapId | null): Segment[] {
  return stappen.map((stap) => (stap.id === open ? 'open' : stap.gekozen ? 'gekozen' : 'nog'));
}

/**
 * Of de open stap in beeld gebracht moet worden: niet als zijn bovenkant al in
 * het bovenste deel van het scherm staat (45%), anders wel, met 80 pixels lucht
 * erboven. `top` is gemeten vanaf de bovenrand van wat scrolt.
 */
export const IN_BEELD = 0.45;
export const LUCHT_BOVEN = 80;

export function scrollAfstand(top: number, hoogte: number): number {
  if (top >= 0 && top <= hoogte * IN_BEELD) return 0;
  return top - LUCHT_BOVEN;
}
