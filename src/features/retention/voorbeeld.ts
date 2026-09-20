import type { ItemState, LeitnerBox, Schedulable } from '@/game-core';

/**
 * Een verzonnen kind, voor wie er nog geen eigen cijfers heeft (ADR-165).
 *
 * "Alles in één blik" liet zonder code de eigen stand van het kind zien, en dat
 * was de goede keuze (ADR-124): het inzicht is gratis, het bijhouden is betaald.
 * Alleen: wie deze pagina voor het eerst opent, heeft nog niets geoefend, en
 * dan bestaat dat inzicht uit vier nullen en een muur van lege stippen. Dat is
 * eerlijk en het laat precies niets zien van waar je voor betaalt.
 *
 * Dus staat er een tweede kaart bij, met de stand van een kind dat een paar
 * weken oefent. Hij staat **onder** de eigen kaart en niet ervoor, en hij is
 * gemerkt als voorbeeld — in woorden, niet alleen in kleur. Een voorbeeld dat
 * voor de echte cijfers van een kind langs gaat staan, of dat ervoor door kan
 * gaan, is een leugen; een voorbeeld ernaast is een plaatje van later.
 *
 * **Puur en vast.** Dezelfde onderdelen leveren altijd dezelfde standen op, dus
 * de kaart springt niet bij elke render en een schermafdruk van de pagina is
 * twee keer dezelfde. Er wordt niets weggeschreven: dit komt nooit in de buurt
 * van `progress`.
 */

/**
 * De verdeling, over tien onderdelen geteld: zes onthouden, één even opfrissen,
 * twee nog aan het oefenen, één nog niet geoefend.
 *
 * Geen tien van de tien. Een voorbeeldkind dat alles kent, laat zien wat het
 * eindpunt is en niet wat de pagina doet — en de pagina gaat juist over het
 * verschil tussen die vier woorden.
 */
const PATROON: readonly LeitnerBox[] = [5, 4, 5, 3, 5, 4, 2, 5, 5, 1];

/**
 * Welke plek in het patroon "even opfrissen" wordt. Die staat op doos vier en
 * krijgt een laatste antwoord van twee maanden terug: opfrissen is doos vier of
 * vijf die langer dan twee intervallen ongezien bleef (`isStale`), en niet een
 * doos op zichzelf.
 */
const OPFRIS_PLEK = 1;

const DAG_MS = 86_400_000;

/**
 * De standen van het voorbeeldkind voor deze onderdelen.
 *
 * `now` gaat erin omdat "even opfrissen" een vergelijking met vandaag is
 * (`isStale`): één onderdeel krijgt een `volgendeReview` die ruim voorbij is,
 * de rest een die nog komt.
 */
export function voorbeeldStanden(
  items: readonly Schedulable[],
  now: Date,
): ReadonlyMap<string, ItemState> {
  const standen = new Map<string, ItemState>();

  items.forEach((item, plek) => {
    const box = PATROON[plek % PATROON.length] ?? 1;
    // Doos één is "nog niet geoefend" in dit voorbeeld: geen laatste review,
    // en dan zegt `statusOf` precies dat.
    if (box === 1) {
      standen.set(item.id, {
        itemId: item.id,
        box: 1,
        laatsteReview: null,
        volgendeReview: null,
        goedCount: 0,
        foutCount: 0,
      });
      return;
    }

    const opfrissen = plek % PATROON.length === OPFRIS_PLEK % PATROON.length && box >= 4;
    const dagenTerug = opfrissen ? 60 : 2 + (plek % 5);
    const laatste = new Date(now.getTime() - dagenTerug * DAG_MS);
    const volgende = new Date(laatste.getTime() + (opfrissen ? 8 : 21) * DAG_MS);

    standen.set(item.id, {
      itemId: item.id,
      box,
      laatsteReview: laatste.toISOString(),
      volgendeReview: volgende.toISOString(),
      goedCount: box + 1,
      foutCount: plek % 3 === 0 ? 1 : 0,
      hoogsteDoos: box,
    });
  });

  return standen;
}
