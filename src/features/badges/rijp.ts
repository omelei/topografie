import type { ItemState } from '@/game-core';
import { doelwitVan, standVan } from '@/features/home/doel';
import { startbareOnderdelen } from '@/features/module/onderdelen';

/**
 * Of de pagina van deze set rijp is om af te zwemmen (ADR-141).
 *
 * Met de standen van vóór de ronde: wat een diplomaronde zelf goed maakt, telt
 * niet mee voor de vraag of hij mocht. Een set zonder diploma is nooit rijp.
 *
 * Stond in `features/album/naRonde.ts` tot ADR-158 het album ophief. Het diploma
 * bleef, dus deze lat bleef ook — hij hoort alleen niet meer bij het album.
 *
 * **`startbareOnderdelen()` en niet `onderdelen()`**, om de reden die
 * `kast.test.ts` uitschrijft: `onderdelen()` kent maar twee vlaggensets, dus
 * een ronde op de vlaggen van Europa vond hier geen onderdeel en hoorde aan het
 * eind nooit dat het diploma openstond. Alles wat over álle diploma's gaat,
 * leest de startbare lijst.
 */
export function rijpVoorDiploma(
  setId: string,
  states: ReadonlyMap<string, ItemState>,
  now: Date,
): boolean {
  const deel = startbareOnderdelen().find((kandidaat) => kandidaat.setId === setId);
  const doelwit = deel ? doelwitVan(deel) : null;
  return doelwit !== null && standVan(doelwit, states, now).rijp;
}
