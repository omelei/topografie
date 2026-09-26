import type { Groep } from '@/game-core';
import type { ProfileRecord } from './db';
import {
  createChild,
  getActiveChild,
  listChildren,
  renameChild,
  setGroep,
  switchChild,
  zetGroepGevraagd,
} from './children';

/**
 * Who is practising, and the settings that belong to the device.
 *
 * A profile is not an account: no e-mail, no password, no sign-in. A name is
 * asked for so the app can greet the child by it, and that is the entire reason
 * it exists (ADR-008).
 *
 * **Sinds ADR-229 is er altijd een kind, en de naam komt later.** Wie de app
 * opent, oefent meteen als een kind zonder naam. De naam wordt pas gevraagd
 * waar hij iets doet: op het diploma, bij een tweede kind en op de ouderpagina.
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

/** Of dit kind een naam heeft (ADR-229). Zonder naam is het nog niemand in het bijzonder. */
export function heeftNaam(kind: ProfileRecord): boolean {
  return kind.naam.trim() !== '';
}

/**
 * Wie er oefent, en anders een kind zonder naam (ADR-229).
 *
 * Er was een naamveld vóór alles, en een app zonder profiel. Nu is er vanaf
 * het eerste bezoek een kind: het eerste krijgt `SINGLETON_KEY`, zodat alles
 * wat het oefent bij hem blijft als het later een naam typt — dezelfde sleutel
 * waar ADR-208 al onder schreef. Staat het gekozen kind er niet meer, dan is
 * het eerste de beurt, en pas als er helemaal niemand is komt er een bij.
 */
export async function zorgVoorKind(): Promise<ProfileRecord> {
  const actief = await getActiveChild();
  if (actief) return actief;

  const eerste = (await listChildren())[0];
  if (eerste) {
    await switchChild(eerste.id);
    return eerste;
  }

  // Zonder kinderen weigert `createChild` nooit: de grens ligt op drie.
  const nieuw = await createChild('');
  if (nieuw === null) throw new Error('Er kon geen kind bij, terwijl er geen was.');
  return nieuw;
}

/**
 * Het kind dat nu oefent een naam geven (ADR-229). Alleen de naam: het id
 * blijft, dus alles wat het zonder naam oefende, hoort er al bij.
 */
export async function geefNaam(naam: string): Promise<ProfileRecord | undefined> {
  const kind = await getActiveChild();
  if (!kind) return undefined;
  return renameChild(kind.id, naam);
}

/**
 * Een kind met een naam, van buiten deze app: inloggen met een code (ADR-190).
 *
 * Staat er een kind zonder naam, dan wordt dat het (ADR-229): wat er zonder
 * naam geoefend is, hoort bij wie als eerste een naam heeft, zoals ADR-208 het
 * al zei. Anders komt er een kind bij. De groep is dan bekend of bewust leeg,
 * dus de voordeur vraagt hem niet nog eens (ADR-151).
 */
export async function createProfile(naam: string, groep?: Groep): Promise<ProfileRecord | null> {
  const naamloos = (await listChildren()).find((kind) => !heeftNaam(kind));
  let kind: ProfileRecord | null | undefined;
  if (naamloos) {
    kind = await renameChild(naamloos.id, naam);
    if (kind && groep !== undefined) kind = (await setGroep(kind.id, groep)) ?? kind;
    if (kind) await switchChild(kind.id);
  } else {
    kind = await createChild(naam, groep);
  }
  if (!kind) return null;
  await zetGroepGevraagd(kind.id);
  return kind;
}

/** Re-exported so the screens that ask for a setting keep one import. */
export { getSetting, setSetting } from './settings';
export {
  groepAlGevraagd,
  groepVanActiefKind,
  naamAlGevraagd,
  renameChild,
  setAvatar,
  setGroep,
  zetNaamGevraagd,
} from './children';
