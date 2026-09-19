import { useEffect, useState } from 'react';
import { doelwitten, standVan } from '@/features/home/doel';
import { onderdelen } from '@/features/module/onderdelen';
import { loadItemStates } from '@/store/progress';

/**
 * Wat een diplomamuur naast "gehaald" nog weet: of een diploma rijp is om af te
 * zwemmen.
 *
 * Rijp is de lat van ADR-141, dezelfde die het doelblok gebruikt: negen op de
 * tien onderdelen van de set onthoud je nu, bij een tafel allemaal.
 *
 * De bijhoudstempels stonden hier ook. Die zijn met het album vervallen
 * (ADR-158): een diploma is een toets en geen beloning, en wat bijhouden
 * oplevert staat nu in de toren.
 */
export interface DiplomaStand {
  readonly rijp: (diplomaId: string) => boolean;
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
  const witten = doelwitten(onderdelen(), true);
  return {
    rijp: (diplomaId) => {
      const doelwit = witten.find((kandidaat) => kandidaat.id === diplomaId);
      return doelwit ? standVan(doelwit, states, now).rijp : false;
    },
  };
}
