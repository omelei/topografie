import type { Groep } from '@/game-core';
import type { ProfileRecord } from './db';
import { createChild, getActiveChild, zetGroepGevraagd } from './children';

/**
 * Who is practising, and the settings that belong to the device.
 *
 * A profile is not an account: no e-mail, no password, no sign-in. A name is
 * asked for so the app can greet the child by it, and that is the entire reason
 * it exists (ADR-008).
 *
 * There used to be exactly one per device. There are now as many as the family
 * has children (ADR-046) — `store/children.ts` holds that, and these two stay
 * as the front door for the screens that only ever want whoever is practising.
 *
 * The settings below are the device's, not a child's: which switches are on is
 * a property of the iPad in the kitchen, not of who is holding it.
 */

export async function getProfile(): Promise<ProfileRecord | undefined> {
  return getActiveChild();
}

/**
 * Het kind van het eerste scherm. Daar is de groep al gevraagd (ADR-151), ook
 * als het antwoord "Zeg ik niet" was, dus de voordeur vraagt het niet nog
 * eens. Een kind dat later op Jij wordt toegevoegd, krijgt de vraag wel.
 */
export async function createProfile(naam: string, groep?: Groep): Promise<ProfileRecord> {
  const kind = await createChild(naam, groep);
  await zetGroepGevraagd(kind.id);
  return kind;
}

/** Re-exported so the screens that ask for a setting keep one import. */
export { getSetting, setSetting } from './settings';
export { groepAlGevraagd, groepVanActiefKind, renameChild, setGroep, setSticker } from './children';
