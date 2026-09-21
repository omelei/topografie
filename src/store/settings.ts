import { getDb, type SettingRecord } from './db';

/**
 * Settings that belong to the device rather than to a child.
 *
 * Which switches are on is a property of the iPad in the kitchen: read-aloud
 * being on is about the speaker and the room, not about who is holding it. The
 * one exception is which child is practising, and that is a device fact too —
 * it is where the iPad was put down, not something a child owns.
 *
 * Its own module because `children.ts` needs it and `profile.ts` needs
 * `children.ts`; leaving all three in one file made a cycle that only a dynamic
 * import could hide.
 */

export async function getSetting(key: string): Promise<string | undefined> {
  const db = await getDb();
  const record: SettingRecord | undefined = await db.get('settings', key);
  return record?.value;
}

/**
 * Een instelling, met het moment erbij (ADR-175).
 *
 * `gewijzigdOp` is er omdat twee apparaten anders niet kunnen zien welke van
 * twee waarden de nieuwste is: `weekdoel:`, `doel:` en `bijhouden:` worden bij
 * het samenvoegen door de jongste schrijver gewonnen (ADR-155). Het staat hier
 * en niet bij de sync, zodat elke schrijver hem meekrijgt zonder het te weten —
 * ook de schrijvers die er vandaag al zijn.
 */
export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.put('settings', { key, value, gewijzigdOp: new Date().toISOString() });
}
