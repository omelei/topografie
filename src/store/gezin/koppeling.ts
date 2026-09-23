import { getDb } from '../db';
import { getSetting, setSetting } from '../settings';

/**
 * Welk kind op dit apparaat welk kind in het account is (ADR-187).
 *
 * Een kind heeft twee identiteiten (ADR-175): op dit apparaat `me` of een
 * lokale uuid, op de server zijn auth-uuid. Wat die twee verbindt, staat hier,
 * als instelling van dit apparaat: `gezin:<lokaalId>`.
 *
 * Het is een apparaatfeit en gaat dus nergens heen. `GEDEELDE_INSTELLINGEN` in
 * `rijen.ts` kent `gezin` niet, en daarmee blijft het hier zonder dat iemand
 * eraan hoeft te denken.
 *
 * `ouderId` staat erbij omdat een apparaat van eigenaar kan wisselen: logt er
 * een andere ouder in, dan zijn deze kinderen niet van hem, en dan telt deze
 * koppeling voor hem niet.
 */

const VOORVOEGSEL = 'gezin:';

export interface Koppeling {
  readonly lokaalId: string;
  readonly kindId: string;
  readonly ouderId: string;
  /**
   * Wanneer alles wat er toen stond verstuurd was, of null als dat nog niet
   * gelukt is. Een opname die halverwege stukgaat, laat het kind wel in het
   * account achter maar niet zijn voortgang; dit is hoe het scherm dat ziet.
   */
  readonly verstuurdOp: string | null;
}

function lees(lokaalId: string, ruw: string | undefined): Koppeling | null {
  if (ruw === undefined) return null;
  try {
    const waarde = JSON.parse(ruw) as Partial<Koppeling> | null;
    if (typeof waarde?.kindId !== 'string' || typeof waarde.ouderId !== 'string') return null;
    return {
      lokaalId,
      kindId: waarde.kindId,
      ouderId: waarde.ouderId,
      verstuurdOp: typeof waarde.verstuurdOp === 'string' ? waarde.verstuurdOp : null,
    };
  } catch {
    return null;
  }
}

export async function leesKoppeling(lokaalId: string): Promise<Koppeling | null> {
  return lees(lokaalId, await getSetting(`${VOORVOEGSEL}${lokaalId}`));
}

/** Alle koppelingen op dit apparaat die bij deze ouder horen. */
export async function koppelingenVan(ouderId: string): Promise<Koppeling[]> {
  const db = await getDb();
  const rijen = await db.getAll('settings');
  return rijen
    .filter((rij) => rij.key.startsWith(VOORVOEGSEL))
    .map((rij) => lees(rij.key.slice(VOORVOEGSEL.length), rij.value))
    .filter((koppeling): koppeling is Koppeling => koppeling?.ouderId === ouderId);
}

export async function schrijfKoppeling(koppeling: Koppeling): Promise<void> {
  const { lokaalId, ...waarde } = koppeling;
  await setSetting(`${VOORVOEGSEL}${lokaalId}`, JSON.stringify(waarde));
}

export async function vergeetKoppeling(lokaalId: string): Promise<void> {
  const db = await getDb();
  await db.delete('settings', `${VOORVOEGSEL}${lokaalId}`);
}
