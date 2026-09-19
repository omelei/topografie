import type { ItemState } from '@/game-core';
import { doelwitVan, standVan } from '@/features/home/doel';
import { onderdelen } from '@/features/module/onderdelen';

/**
 * Of de pagina van deze set rijp is om af te zwemmen (ADR-141).
 *
 * Met de standen van vóór de ronde: wat een diplomaronde zelf goed maakt, telt
 * niet mee voor de vraag of hij mocht. Een set zonder diploma is nooit rijp.
 *
 * Stond in `features/album/naRonde.ts` tot ADR-158 het album ophief. Het diploma
 * bleef, dus deze lat bleef ook — hij hoort alleen niet meer bij het album.
 */
export function rijpVoorDiploma(
  setId: string,
  states: ReadonlyMap<string, ItemState>,
  now: Date,
): boolean {
  const deel = onderdelen().find((kandidaat) => kandidaat.setId === setId);
  const doelwit = deel ? doelwitVan(deel) : null;
  return doelwit !== null && standVan(doelwit, states, now).rijp;
}
