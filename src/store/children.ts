import { huidigeGroep, groepsjaarVan, type Groep } from '@/game-core';
import { getDb, SINGLETON_KEY, type ProfileRecord } from './db';
import { getSetting, setSetting } from './settings';

/**
 * Who is practising.
 *
 * ADR-046: a family shares a device far more often than it shares an account,
 * and until now the device shared one set of Leitner boxes. Three children on
 * one iPad were one learner as far as the scheduler was concerned — the
 * youngest kept meeting the eldest's provinces, and nobody's forecast meant
 * anything.
 *
 * A child here is still not an account. There is no password, no e-mail and no
 * way to sign in as one; it is a name on a device, which is what ADR-008
 * allows and all this needs. The parent account of ADR-050 sits above these
 * and syncs them; it does not replace them.
 */

/** Which child is practising, by id. */
const ACTIVE = 'actiefKind';
/** Set once the pre-family rows have been copied across. */
const COPIED = 'voortgangPerKind';

export async function listChildren(): Promise<ProfileRecord[]> {
  const db = await getDb();
  const rows = await db.getAll('profile');
  // Oldest first, which on a family device is very nearly always the order
  // they were added in and never surprises anyone.
  return rows.sort((a, b) => a.aangemaaktOp.localeCompare(b.aangemaaktOp));
}

/**
 * The child whose work is being read and written.
 *
 * Falls back to the first child rather than to nothing. A device that has been
 * practising since before there were children has one profile under the old
 * singleton key, and it is theirs.
 */
export async function activeChildId(): Promise<string> {
  const chosen = await getSetting(ACTIVE);
  if (chosen) return chosen;

  const children = await listChildren();
  return children[0]?.id ?? SINGLETON_KEY;
}

export async function getActiveChild(): Promise<ProfileRecord | undefined> {
  const db = await getDb();
  return db.get('profile', await activeChildId());
}

export async function switchChild(id: string): Promise<void> {
  await setSetting(ACTIVE, id);
}

/**
 * A new child on this device.
 *
 * The first keeps the old singleton key so that everything already written
 * under it — a streak, a level, a set of boxes — belongs to them without being
 * moved. Everyone after that gets a uuid.
 */
export async function createChild(naam: string, groep?: Groep): Promise<ProfileRecord> {
  const existing = await listChildren();
  const now = new Date();

  const child: ProfileRecord = {
    id: existing.length === 0 ? SINGLETON_KEY : crypto.randomUUID(),
    naam: naam.trim(),
    avatarConfig: {},
    niveau: 1,
    ...metGroep(groep, now),
    aangemaaktOp: now.toISOString(),
  };

  const db = await getDb();
  await db.put('profile', child);
  await switchChild(child.id);
  return child;
}

/** De twee velden van een groep, of geen van beide. */
function metGroep(
  groep: Groep | undefined,
  now: Date,
): Pick<ProfileRecord, 'groep' | 'groepSchooljaar'> {
  return groep === undefined ? {} : { groep, groepSchooljaar: groepsjaarVan(now) };
}

/**
 * De groep van een kind zetten of weghalen (ADR-151).
 *
 * Het schooljaar gaat mee: wie in maart "groep 6" kiest, bedoelt groep 6 van
 * dit schooljaar, en `huidigeGroep` telt vanaf hier verder. `undefined` haalt
 * beide velden weg, zodat het kind weer is wat het vóór de vraag was.
 */
export async function setGroep(
  id: string,
  groep: Groep | undefined,
  now: Date = new Date(),
): Promise<ProfileRecord | undefined> {
  const db = await getDb();
  const kind = await db.get('profile', id);
  if (!kind) return undefined;

  const bijgewerkt: ProfileRecord = { ...kind, ...metGroep(groep, now) };
  if (groep === undefined) {
    delete bijgewerkt.groep;
    delete bijgewerkt.groepSchooljaar;
  }
  await db.put('profile', bijgewerkt);
  await setSetting(groepGevraagdSleutel(id), 'ja');
  return bijgewerkt;
}

/** De groep van wie er nu oefent, doorgeschoven naar vandaag. */
export async function groepVanActiefKind(now: Date = new Date()): Promise<Groep | undefined> {
  const kind = await getActiveChild();
  return kind ? huidigeGroep(kind, now) : undefined;
}

/**
 * Of een kind de vraag naar de groep al zag (ADR-151).
 *
 * Een kind dat bestond vóór die vraag, krijgt hem één keer op de voordeur. Een
 * keuze, en ook "Niet nu", zet deze vlag; daarna gaat het alleen nog via Voor
 * ouders. Per kind, zoals `doel:<kindId>`, want het tweede kind op dezelfde
 * iPad is niet gevraagd omdat het eerste antwoord gaf.
 */
function groepGevraagdSleutel(kindId: string): string {
  return `groepGevraagd:${kindId}`;
}

export async function groepAlGevraagd(kindId: string): Promise<boolean> {
  return (await getSetting(groepGevraagdSleutel(kindId))) === 'ja';
}

/** Een keuze, "Zeg ik niet" of "Niet nu": dit kind is gevraagd. */
export async function zetGroepGevraagd(kindId: string): Promise<void> {
  await setSetting(groepGevraagdSleutel(kindId), 'ja');
}

/**
 * Een kind hernoemen (ADR-126).
 *
 * Tot nu toe kon dat niet: `createChild` schreef de naam één keer en er was
 * geen weg terug. Een kind dat zijn naam verkeerd typt — en dat is het eerste
 * wat er van hem gevraagd wordt, op het eerste scherm — zat er voorgoed aan
 * vast, en de enige uitweg was de site-data wissen, wat ook alle voortgang
 * weggooit. Dat is geen ontbrekende functie maar een val.
 *
 * Alleen de naam verandert. Het id blijft, en daarmee blijft elke Leitner-doos,
 * elk diploma en elke dag van de reeks bij het kind waar hij bij hoort.
 */
export async function renameChild(id: string, naam: string): Promise<ProfileRecord | undefined> {
  const schoon = naam.trim();
  if (schoon === '') return undefined;

  const db = await getDb();
  const kind = await db.get('profile', id);
  if (!kind) return undefined;

  const hernoemd: ProfileRecord = { ...kind, naam: schoon };
  await db.put('profile', hernoemd);
  return hernoemd;
}

/**
 * The sticker this child chose, written where the schema already had a place
 * for it.
 *
 * `avatarConfig` has been on `ProfileRecord` since the first version and has
 * been an empty object ever since. This is what it is for: how a child wants to
 * be shown, kept beside the name they typed and going nowhere else.
 *
 * It belongs to the child rather than to the device, which is why it is here
 * and not in `settings`. Two children on one iPad are two animals; that is
 * nearly the whole point of letting them choose.
 */
export async function setSticker(sticker: string): Promise<ProfileRecord | undefined> {
  const db = await getDb();
  const profile = await getActiveChild();
  if (!profile) return undefined;

  const updated: ProfileRecord = {
    ...profile,
    avatarConfig: { ...profile.avatarConfig, sticker },
  };
  await db.put('profile', updated);
  return updated;
}

/**
 * Moves what a device learned before it knew about children onto the first of
 * them.
 *
 * Run on first read rather than inside the version-change transaction. A
 * migration that runs during an upgrade cannot be tested from a machine with no
 * toolchain and fails by making a child's work unreachable with no error; this
 * one runs in an ordinary transaction, is idempotent — every write is keyed —
 * and can simply be tried again on the next read.
 *
 * It copies rather than moves. The old stores are left exactly as they were, so
 * a version that goes wrong can still be rolled back to one that reads them.
 */
export async function ensureProgressPerChild(): Promise<void> {
  if ((await getSetting(COPIED)) === 'ja') return;

  const db = await getDb();
  const kindId = SINGLETON_KEY;

  const states = await db.getAll('itemStates');
  for (const state of states) await db.put('progress', { ...state, kindId });

  const badges = await db.getAll('badges');
  for (const badge of badges) await db.put('kindBadges', { ...badge, kindId });

  await setSetting(COPIED, 'ja');
}
