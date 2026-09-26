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

/**
 * Hoeveel kinderen er op dit apparaat kunnen staan (ADR-173).
 *
 * Drie, en het is een productkeuze en geen technische grens: een gezin met drie
 * kinderen is wat één code dekt, en een wisselaar met acht namen erin is geen
 * wisselaar meer. Zodra er een gezinsaccount is, hoort dit getal bij het gezin
 * en niet bij het apparaat — twee apparaten met elk drie zouden er zes zijn, en
 * dan betekent de grens niets. Tot die tijd is dit apparaat het gezin.
 *
 * Het staat hier en niet in een scherm, zodat het waar is en niet alleen
 * getekend: een knop verbergen is geen grens.
 */
export const MAX_KINDEREN = 3;

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

/** Of er nog een kind bij kan (ADR-173). */
export async function magErKindBij(): Promise<boolean> {
  return (await listChildren()).length < MAX_KINDEREN;
}

/**
 * A new child on this device.
 *
 * The first keeps the old singleton key so that everything already written
 * under it — a streak, a level, a set of boxes — belongs to them without being
 * moved. Everyone after that gets a uuid.
 *
 * `null` betekent: er is geen plek meer (ADR-173). Geen uitzondering, want de
 * ouderpagina biedt de knop dan niet eens aan; dit is het vangnet eronder, en
 * een vangnet dat gooit laat een scherm achter dat half is bijgewerkt.
 */
export async function createChild(naam: string, groep?: Groep): Promise<ProfileRecord | null> {
  const existing = await listChildren();
  if (existing.length >= MAX_KINDEREN) return null;
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
 * De vraag stond op de voordeur, en een keuze of "Niet nu" zette deze vlag.
 * Sinds ADR-229 staat hij daar niet meer: de groep kies je op Jij. De vlag
 * wordt nog gezet, want het gezinsaccount stuurt hem mee (`gezin/rijen.ts`),
 * en een apparaat met een oudere versie leest hem nog. Per kind, zoals
 * `doel:<kindId>`.
 */
function groepGevraagdSleutel(kindId: string): string {
  return `groepGevraagd:${kindId}`;
}

/** Een keuze, "Zeg ik niet" of "Niet nu": dit kind is gevraagd. */
export async function zetGroepGevraagd(kindId: string): Promise<void> {
  await setSetting(groepGevraagdSleutel(kindId), 'ja');
}

/**
 * Of een kind zonder naam de uitnodiging op Vandaag al wegklikte (ADR-229).
 *
 * Eén keer, zoals de vraag naar de groep: wie "Niet nu" zegt, ziet hem niet
 * terug. De naam kan daarna nog op Jij, en het diploma vraagt hem vanzelf.
 */
function naamGevraagdSleutel(kindId: string): string {
  return `naamGevraagd:${kindId}`;
}

export async function naamAlGevraagd(kindId: string): Promise<boolean> {
  return (await getSetting(naamGevraagdSleutel(kindId))) === 'ja';
}

export async function zetNaamGevraagd(kindId: string): Promise<void> {
  await setSetting(naamGevraagdSleutel(kindId), 'ja');
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

/** Waar de keuze van het kind in `avatarConfig` staat. */
export const AVATAR_SLEUTEL = 'avatar';

/**
 * De avatar die dit kind koos, geschreven waar het schema er al een plek voor
 * had (ADR-177).
 *
 * `avatarConfig` staat sinds de eerste versie op `ProfileRecord` en was sindsdien
 * altijd een leeg object. Dit is waar het voor is: hoe een kind getoond wil
 * worden, naast de naam die het typte en verder nergens heen.
 *
 * Het hoort bij het kind en niet bij het apparaat, en daarom staat het hier en
 * niet in `settings`. Twee kinderen op één iPad zijn twee avatars; dat is zo
 * ongeveer de hele reden om ze te laten kiezen.
 *
 * Er stond hier `setSticker`, met dezelfde vorm en zonder één aanroeper. Het
 * veld is nooit geschreven, dus er valt niets te migreren — en één woord voor
 * één ding is de goedkoopste tijd om dat recht te zetten.
 */
export async function setAvatar(avatar: string): Promise<ProfileRecord | undefined> {
  const db = await getDb();
  const profile = await getActiveChild();
  if (!profile) return undefined;

  const updated: ProfileRecord = {
    ...profile,
    avatarConfig: { ...profile.avatarConfig, [AVATAR_SLEUTEL]: avatar },
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
