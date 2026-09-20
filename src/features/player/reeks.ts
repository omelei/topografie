import { useEffect, useState } from 'react';
import { dagenGeoefend, reeksVan, type Reeks } from '@/game-core';
import { loadPlayedRounds } from '@/store/progress';

/**
 * De reeks, gelezen en niet bewaard (ADR-158).
 *
 * De dagen staan al op papier: elke afgemaakte ronde draagt het moment waarop
 * hij eindigde. Twee boekhoudingen over dezelfde dagen worden het een keer
 * oneens, dus er is er één.
 *
 * Dat betekent ook dat de reeks zo ver teruggaat als de rondes op dít apparaat.
 * Een kind dat op een tweede apparaat begint, begint daar met een lege reeks —
 * dezelfde beperking die de weekkaart had, en die hier niet met een tweede
 * opslag gerepareerd wordt.
 */
export async function leesReeks(now: Date = new Date()): Promise<Reeks> {
  const rondes = await loadPlayedRounds();
  return reeksVan(dagenGeoefend(rondes.map((ronde) => ronde.at)), now);
}

export function useReeks(): Reeks | null {
  const [reeks, setReeks] = useState<Reeks | null>(null);

  useEffect(() => {
    let levend = true;
    void leesReeks().then((stand) => {
      if (levend) setReeks(stand);
    });
    return () => {
      levend = false;
    };
  }, []);

  return reeks;
}
