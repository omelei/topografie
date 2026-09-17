import { useEffect, useState } from 'react';
import { schooljaarVan, SEIZOENEN, type Seizoen } from '@/game-core';
import { doelwitten, standVan } from '@/features/home/doel';
import { onderdelen } from '@/features/module/onderdelen';
import { leesBijhouden, type Bijhouden } from '@/store/bijhoudStore';
import { loadItemStates } from '@/store/progress';

/**
 * Wat een diplomamuur naast "gehaald" nog weet (ADR-149): of een diploma rijp
 * is om af te zwemmen, en in welke seizoenen van dit schooljaar het een
 * bijhoudstempel kreeg.
 *
 * Rijp is de lat van ADR-141, dezelfde die het doelblok gebruikt: negen op de
 * tien plaatjes van de pagina onthoud je nu, bij een tafel allemaal.
 */
export interface DiplomaStand {
  readonly rijp: (diplomaId: string) => boolean;
  /** De seizoenen van dit schooljaar, met of zonder stempel voor dit diploma. */
  readonly seizoenen: (diplomaId: string) => readonly { seizoen: Seizoen; stempel: boolean }[];
}

export function useDiplomaStand(): DiplomaStand | null {
  const [stand, setStand] = useState<DiplomaStand | null>(null);

  useEffect(() => {
    let levend = true;
    void Promise.all([loadItemStates(), leesBijhouden()]).then(([states, bijhouden]) => {
      if (!levend) return;
      setStand(maakStand(states, bijhouden, new Date()));
    });
    return () => {
      levend = false;
    };
  }, []);

  return stand;
}

function maakStand(
  states: Awaited<ReturnType<typeof loadItemStates>>,
  bijhouden: Bijhouden,
  now: Date,
): DiplomaStand {
  const witten = doelwitten(onderdelen(), true);
  const jaar = schooljaarVan(now);
  return {
    rijp: (diplomaId) => {
      const doelwit = witten.find((kandidaat) => kandidaat.id === diplomaId);
      return doelwit ? standVan(doelwit, states, now).rijp : false;
    },
    seizoenen: (diplomaId) =>
      SEIZOENEN.map((seizoen) => ({
        seizoen,
        stempel: (bijhouden[diplomaId] ?? []).includes(`${jaar}-${seizoen}`),
      })),
  };
}
