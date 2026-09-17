import { bijhoudstempel, type ItemState } from '@/game-core';
import { doelwitten, doelwitVan, standVan } from '@/features/home/doel';
import { onderdelen } from '@/features/module/onderdelen';
import { leesBijhouden, voegBijhoudstempelsToe } from '@/store/bijhoudStore';
import { loadDiplomaRijen } from '@/store/rewardStore';
import { leesWeek } from '@/store/weekStore';

/**
 * Of de pagina van deze set rijp is om af te zwemmen (ADR-141, ADR-149).
 *
 * Met de standen van vóór de ronde: wat een diplomaronde zelf goed maakt, telt
 * niet mee voor de vraag of hij mocht. Een set zonder diploma is nooit rijp.
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

/**
 * Wat er na elke afgemaakte ronde aan het album wordt bijgewerkt (ADR-149).
 *
 * **De weekkaart**: `leesWeek` zet de zegel van deze week zodra het doel
 * gehaald is, ook als niemand de kaart deze week opent.
 *
 * **De bijhoudstempels**: elk diploma dat dit kind heeft, krijgt in een later
 * seizoen één stempel als zijn pagina nu nog rijp is (`bijhoudstempel`). Over
 * alle diploma's en niet alleen dat van de set die net geoefend werd: een kind
 * dat de provincies bijhoudt via de Topomix, houdt ze ook bij.
 *
 * Niets hiervan mag een ronde laten haperen, dus alles achter een `catch`.
 */
export async function naRonde(states: ReadonlyMap<string, ItemState>): Promise<void> {
  const now = new Date();
  try {
    await leesWeek(now);
    const [rijen, stand] = await Promise.all([loadDiplomaRijen(), leesBijhouden()]);
    if (rijen.length === 0) return;
    const witten = doelwitten(onderdelen(), true);
    const nieuw: { id: string; seizoen: string }[] = [];
    for (const rij of rijen) {
      const doelwit = witten.find((kandidaat) => kandidaat.id === rij.id);
      if (!doelwit) continue;
      const seizoen = bijhoudstempel(
        rij.behaaldOp,
        stand[rij.id] ?? [],
        standVan(doelwit, states, now).rijp,
        now,
      );
      if (seizoen !== null) nieuw.push({ id: rij.id, seizoen });
    }
    await voegBijhoudstempelsToe(nieuw);
  } catch {
    // Het album bijwerken is nooit de reden dat een ronde vastloopt.
  }
}
