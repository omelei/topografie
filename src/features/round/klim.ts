import { MAX_BOX, ONTHOUDEN_BOX, type ItemState, type LeitnerBox } from '@/game-core';

/**
 * De stap omhoog die een goed antwoord oplevert (ADR-137).
 *
 * Dit product draait op Leitner-dozen: elk onderdeel schuift bij een goed
 * antwoord een doos op en komt daardoor later terug. Dat is de hele motor, en
 * een kind heeft hem nog nooit gezien. Alles wat het product toont is een
 * *stand* — hoeveel je onthoudt, wat er klaarstaat, hoe de week ging — en
 * nergens een *verandering*. Dat is waarom het stil aanvoelt: er gebeurt van
 * alles en er beweegt niets.
 *
 * **Alleen omhoog.** Een fout antwoord zet een onderdeel terug naar doos één, en
 * dat is te zien geven zou straffen. ADR-048 maakt het niet weten overal
 * goedkoop — geen leven, geen doos, geen stempel — en een zichtbare val zou dat
 * in één beeld terugdraaien. Het uitkomstteken en het goede antwoord zijn de
 * terugkoppeling die daar hoort.
 *
 * **Doos vier is een grens die al bestond.** `ONTHOUDEN_BOX` is waar dit product
 * "dit onthoud je" zegt, op de onthoudpagina en op de modulepagina. De klim
 * markeert die grens dus niet als een nieuw beloninkje maar als het moment
 * waarop een woord dat al gold, waar wordt.
 *
 * Puur: er gaat een stand in en er komt een stap uit.
 */

export interface Klim {
  /** De trede waar het vandaan kwam. Nul voor een onderdeel dat nog nooit gezien was. */
  readonly van: number;
  readonly naar: LeitnerBox;
  /** Of deze stap de grens van onthouden passeert. */
  readonly onthouden: boolean;
  /** Hoeveel treden er in totaal zijn. */
  readonly treden: number;
}

export function klimVan(vorige: ItemState, volgende: ItemState, correct: boolean): Klim | null {
  if (!correct) return null;

  // Een onderdeel dat nog nooit is gezien komt van de grond af, niet uit doos
  // één: `emptyState` zet de doos alvast op één, en dan zou de eerste goede
  // beurt een stap van één naar twee lijken terwijl het er twee zijn.
  const van = vorige.laatsteReview === null ? 0 : vorige.box;
  if (volgende.box <= van) return null;

  return {
    van,
    naar: volgende.box,
    onthouden: van < ONTHOUDEN_BOX && volgende.box >= ONTHOUDEN_BOX,
    treden: MAX_BOX,
  };
}
