import { dayKey, GEHEUGENCHECK_MIN } from '@/game-core';
import { getSetting, setSetting } from './settings';

/**
 * De geheugencheck van een kind: of hij gedaan is, en hoe (ADR-228).
 *
 * **Eén keer per kind.** De uitslag staat onder `geheugencheck:<kindId>`, op
 * dit apparaat. Staat hij er, dan komt de check niet meer terug. Hij gaat niet
 * mee naar een account: het is geen voortgang, het is één meting.
 *
 * **Geen invloed op de dozen.** De ronde van de check is een stille ronde: hij
 * schrijft geen sessie, geen poging en geen Leitner-stand, alleen deze uitslag.
 * Zo meet hij wat er nog zit, zonder dat meten het plan verschuift. Welke ronde
 * stil is, staat in de id van de sessie (`STIL`), en alleen de volgende sessie
 * die begint nadat de check is aangezet, wordt stil.
 */

export interface GeheugencheckUitslag {
  /** YYYY-MM-DD. */
  readonly dag: string;
  readonly setId: string;
  readonly goed: number;
  readonly gevraagd: number;
}

const SLEUTEL = 'geheugencheck:';

/** Het voorvoegsel van een stille sessie: niets ervan komt in de winkels. */
export const STIL = 'geheugencheck-';

export async function leesGeheugencheck(kindId: string): Promise<GeheugencheckUitslag | null> {
  const ruw = await getSetting(`${SLEUTEL}${kindId}`);
  if (ruw === undefined) return null;
  try {
    const waarde = JSON.parse(ruw) as Partial<GeheugencheckUitslag>;
    if (
      typeof waarde.dag !== 'string' ||
      typeof waarde.setId !== 'string' ||
      typeof waarde.goed !== 'number' ||
      typeof waarde.gevraagd !== 'number'
    ) {
      return null;
    }
    return { dag: waarde.dag, setId: waarde.setId, goed: waarde.goed, gevraagd: waarde.gevraagd };
  } catch {
    return null;
  }
}

let klaar: { readonly kindId: string; readonly setId: string } | null = null;

/** De volgende ronde die begint, is de check van dit kind. */
export function zetGeheugencheckKlaar(kindId: string, setId: string): void {
  klaar = { kindId, setId };
}

/** Niet meer: het kind ging terug, of begon iets anders. */
export function vergeetGeheugencheck(): void {
  klaar = null;
}

/**
 * Of de sessie die nu begint de check is. Zo ja, dan krijgt hij een stille id,
 * en is de schakelaar meteen weer om: een tweede ronde na de check is gewoon
 * oefenen.
 */
export function neemStilleSessie(): string | null {
  if (klaar === null) return null;
  const id = `${STIL}${klaar.kindId}:${klaar.setId}:${crypto.randomUUID()}`;
  klaar = null;
  return id;
}

/**
 * Het einde van de stille ronde: de uitslag, als er genoeg gevraagd is. Een
 * check die na drie vragen gestopt werd, is geen meting; dan komt hij terug.
 */
export async function bewaarStilleSessie(
  sessionId: string,
  goed: number,
  gevraagd: number,
  now = new Date(),
): Promise<void> {
  // kind:set:uuid. Een uuid heeft geen dubbele punt, een setId misschien wel.
  const rest = sessionId.slice(STIL.length);
  const kindId = rest.slice(0, rest.indexOf(':'));
  const setId = rest.slice(rest.indexOf(':') + 1, rest.lastIndexOf(':'));
  if (kindId === '' || setId === '' || gevraagd < GEHEUGENCHECK_MIN) return;
  const uitslag: GeheugencheckUitslag = { dag: dayKey(now), setId, goed, gevraagd };
  await setSetting(`${SLEUTEL}${kindId}`, JSON.stringify(uitslag));
}
