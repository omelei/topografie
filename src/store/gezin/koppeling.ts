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
  /**
   * Wanneer er voor het laatst is opgehaald wat andere apparaten stuurden, of
   * null als dat nog nooit gebeurde (ADR-189).
   */
  readonly opgehaaldOp: string | null;
}

/**
 * Hoeveel eerder dan de vorige keer er opnieuw gekeken wordt (ADR-188).
 *
 * Het moment van de vorige keer is genomen vóór er gelezen werd, dus in
 * principe is nul genoeg. Vijf minuten vangt wat daar tussen kan zitten — een
 * ronde die afliep terwijl er verstuurd werd, een klok die even verspringt —
 * en kost niets: wat twee keer aankomt, wordt overgeslagen of samengevoegd.
 */
const MARGE_MS = 5 * 60_000;

/** Vanaf wanneer opnieuw gekeken wordt, of alles als het nog nooit gebeurde. */
export function sindsVan(moment: string | null): string | undefined {
  if (moment === null) return undefined;
  const tijd = new Date(moment).getTime();
  if (Number.isNaN(tijd)) return undefined;
  return new Date(tijd - MARGE_MS).toISOString();
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
      opgehaaldOp: typeof waarde.opgehaaldOp === 'string' ? waarde.opgehaaldOp : null,
    };
  } catch {
    return null;
  }
}

export async function leesKoppeling(lokaalId: string): Promise<Koppeling | null> {
  return lees(lokaalId, await getSetting(`${VOORVOEGSEL}${lokaalId}`));
}

/** Alle koppelingen op dit apparaat, van welke ouder ook. */
export async function alleKoppelingen(): Promise<Koppeling[]> {
  const db = await getDb();
  const rijen = await db.getAll('settings');
  return rijen
    .filter((rij) => rij.key.startsWith(VOORVOEGSEL))
    .map((rij) => lees(rij.key.slice(VOORVOEGSEL.length), rij.value))
    .filter((koppeling): koppeling is Koppeling => koppeling !== null);
}

/** Alle koppelingen op dit apparaat die bij deze ouder horen. */
export async function koppelingenVan(ouderId: string): Promise<Koppeling[]> {
  return (await alleKoppelingen()).filter((koppeling) => koppeling.ouderId === ouderId);
}

export async function schrijfKoppeling(koppeling: Koppeling): Promise<void> {
  const { lokaalId, ...waarde } = koppeling;
  await setSetting(`${VOORVOEGSEL}${lokaalId}`, JSON.stringify(waarde));
}

export async function vergeetKoppeling(lokaalId: string): Promise<void> {
  const db = await getDb();
  await db.delete('settings', `${VOORVOEGSEL}${lokaalId}`);
}
