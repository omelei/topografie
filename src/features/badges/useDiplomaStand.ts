import { useEffect, useState } from 'react';
import { doelwitten } from '@/features/home/doel';
import { startbareOnderdelen } from '@/features/module/onderdelen';
import { loadItemStates } from '@/store/progress';
import { voortgangVan, type Voortgang } from './voortgang';

/**
 * Wat een diplomakaart naast "gehaald" nog weet: hoe ver hij is.
 *
 * Eén keer de Leitner-standen lezen voor alle achtenzestig diploma's, want een
 * raster tekent er twaalf tegelijk en dat mag geen twaalf uitlezingen zijn.
 *
 * `rijp` is de lat van ADR-141, ongewijzigd. `voortgang` is nieuw en telt wat
 * ooit bewezen is in plaats van wat vers is — waarom dat twee verschillende
 * getallen zijn, staat in `voortgang.ts`.
 *
 * **`startbareOnderdelen()` en niet `onderdelen()`**, en dat was een stille
 * fout. `onderdelen()` kent maar twee vlaggensets — de wereld en de provincies
 * — want de zes werelddelen worden pas door `loadVlagSets()` opgebouwd. Deze
 * hook stond op `onderdelen()`, dus voor de zes vlaggendiploma's gaf `rijp`
 * altijd `false` en stond "Klaar om af te zwemmen" daar nooit, hoe goed een
 * kind de vlaggen ook kende.
 */
export interface DiplomaStand {
  readonly rijp: (diplomaId: string) => boolean;
  /** `null` voor een set zonder diploma, of een diploma dat deze speler niet heeft. */
  readonly voortgang: (diplomaId: string) => Voortgang | null;
}

export function useDiplomaStand(): DiplomaStand | null {
  const [stand, setStand] = useState<DiplomaStand | null>(null);

  useEffect(() => {
    let levend = true;
    void loadItemStates().then((states) => {
      if (!levend) return;
      setStand(maakStand(states, new Date()));
    });
    return () => {
      levend = false;
    };
  }, []);

  return stand;
}

function maakStand(states: Awaited<ReturnType<typeof loadItemStates>>, now: Date): DiplomaStand {
  const witten = doelwitten(startbareOnderdelen(), true);
  const perId = new Map(witten.map((doelwit) => [doelwit.id, doelwit]));
  // Eén keer uitrekenen: een raster vraagt het per kaart, en de standen liggen
  // er toch al.
  const cache = new Map<string, Voortgang>();

  const voortgang = (diplomaId: string): Voortgang | null => {
    const klaar = cache.get(diplomaId);
    if (klaar) return klaar;
    const doelwit = perId.get(diplomaId);
    if (!doelwit) return null;
    const verse = voortgangVan(doelwit, states, now);
    cache.set(diplomaId, verse);
    return verse;
  };

  return {
    voortgang,
    rijp: (diplomaId) => voortgang(diplomaId)?.rijp ?? false,
  };
}
