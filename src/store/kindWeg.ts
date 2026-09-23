import { activeChildId, listChildren, switchChild } from './children';
import { getDb, SINGLETON_KEY } from './db';
import { vergeetKindsessie } from './gezin/kindsessie';
import { vergeetWensenVan } from './wensen';

/**
 * Eén kind van dit apparaat halen, met alles wat eronder hangt (ADR-198).
 *
 * Het profiel, de dozen, de diploma's, elke ronde en elk antwoord, en de
 * instellingen die per kind bestaan: die heten `<soort>:<kindId>`
 * (`dagstand:`, `weekdoelen:`, `groepGevraagd:`, `gezin:`), dus wat op
 * `:<kindId>` eindigt, hoort bij dit kind. Een ronde of antwoord zonder
 * `kindId` is van vóór ADR-046 en hoort bij het eerste kind, `SINGLETON_KEY`,
 * precies zoals `progress.ts` het leest.
 *
 * **Het laatste kind blijft.** De app heeft altijd iemand die oefent
 * (ADR-161); wie alles weg wil, heeft "Alles van dit apparaat halen".
 *
 * Wat in het gezinsaccount staat, blijft daar: dit haalt het kind alleen van
 * dit apparaat. Een ingelogd kind wordt hier uitgelogd.
 *
 * `false` betekent: niets gedaan (het laatste kind, of een onbekend id).
 */
export async function verwijderKind(id: string): Promise<boolean> {
  const kinderen = await listChildren();
  if (kinderen.length <= 1 || !kinderen.some((kind) => kind.id === id)) return false;

  const vanDitKind = (kindId: string | undefined) => (kindId ?? SINGLETON_KEY) === id;
  const db = await getDb();
  const tx = db.transaction(
    ['profile', 'progress', 'kindBadges', 'sessions', 'attempts', 'settings'],
    'readwrite',
  );

  await tx.objectStore('profile').delete(id);
  await tx.objectStore('progress').delete(IDBKeyRange.bound([id], [id, []]));
  await tx.objectStore('kindBadges').delete(IDBKeyRange.bound([id], [id, []]));

  for (const naam of ['sessions', 'attempts'] as const) {
    let cursor = await tx.objectStore(naam).openCursor();
    while (cursor) {
      if (vanDitKind(cursor.value.kindId)) await cursor.delete();
      cursor = await cursor.continue();
    }
  }

  let instelling = await tx.objectStore('settings').openCursor();
  while (instelling) {
    if (instelling.key.endsWith(`:${id}`)) await instelling.delete();
    instelling = await instelling.continue();
  }
  await tx.done;

  vergeetKindsessie(id);
  vergeetWensenVan(id);

  if ((await activeChildId()) === id) {
    const eerste = kinderen.find((kind) => kind.id !== id);
    if (eerste) await switchChild(eerste.id);
  }
  return true;
}
