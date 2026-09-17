import { pastBijGroep, rangVoorGroep, samen, type Groep, type Indeling } from '@/game-core';
import { groepenVanSet } from '@/content/schoolgroepen';
import type { Onderdeel, Onderwerp } from './onderdelen';

/**
 * Wat bij de groep van een kind past, voor een set en voor een onderwerp
 * (ADR-151).
 *
 * De schermen vragen het hier, en alleen hier: Vandaag, de rij om mee te
 * beginnen op de voordeur en de tegels van een modulepagina. Hoe een groep
 * naast een set wordt gelegd, staat in `game-core/groep.ts`; waar de groepen
 * van een set staan, in `content/schoolgroepen.ts`. Een component rekent niets
 * zelf uit.
 */

export function groepenVan(deel: Onderdeel): readonly Groep[] | undefined {
  return groepenVanSet(deel.setId, deel.items, deel.mix);
}

export function indelingVoor(deel: Onderdeel, groep: Groep | undefined): Indeling {
  if (groep === undefined) return 'neutraal';
  return pastBijGroep(groepenVan(deel), groep);
}

export function indelingVanOnderwerp(vak: Onderwerp, groep: Groep | undefined): Indeling {
  if (groep === undefined) return 'neutraal';
  return samen(vak.sets.map((deel) => indelingVoor(deel, groep)));
}

/** De rang die het dagplan als voorrang meekrijgt: lager is eerder. */
export function voorrangVoor(groep: Groep | undefined): (deel: Onderdeel) => number {
  return (deel) => rangVoorGroep(indelingVoor(deel, groep));
}
