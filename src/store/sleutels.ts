import { getDb } from './db';
import { getSetting, setSetting } from './settings';

/**
 * De sleutel van een poging wordt een uuid (ADR-175).
 *
 * **Waarom dit vóór het netwerk gaat.** Een poging werd tot nu toe genummerd
 * door IndexedDB zelf, oplopend vanaf één, per apparaat. Dat is prima zolang er
 * één apparaat is. Zodra hetzelfde kind op de iPad én op de laptop oefent,
 * bestaat poging 7 twee keer, voor twee verschillende antwoorden — en bij de
 * eerste sync wint er willekeurig één. Het andere antwoord verdwijnt, zonder
 * fout en zonder dat iemand het merkt.
 *
 * ADR-155 noemde deze migratie daarom een voorwaarde voor de sync en niet iets
 * wat erbij hoort. Dit is hem, en hij staat los van elk verzoek naar wie dan
 * ook: hij draait op een apparaat dat nooit inlogt precies zo goed.
 *
 * **Geen nieuwe `DB_VERSION`.** De opslag verandert niet: `autoIncrement` vult
 * alleen aan waar geen sleutel staat, dus een rij die zelf een uuid meebrengt
 * krijgt die gewoon. Wat er verandert zijn de rijen die er al liggen, en die
 * worden hier omgeschreven.
 *
 * **En niet in een versietransactie.** Dat is de regel die `db.ts` zelf stelt
 * en die `ensureProgressPerChild` al volgt: een migratie die tijdens een
 * `upgrade` stukgaat, laat de voortgang van een kind onbereikbaar achter zonder
 * dat er ergens een fout verschijnt, en ze is vanaf deze machine niet te
 * beproeven. Deze draait in een gewone transactie, is opnieuw te draaien — elke
 * schrijfactie heeft een sleutel — en mag mislukken: dan gebeurt het de
 * volgende keer.
 */

/** Gezet zodra elke poging op dit apparaat een uuid draagt. */
const OMGEZET = 'pogingenUuid';

/** Of een sleutel al de nieuwe vorm heeft. Oude rijen dragen een nummer. */
function isUuid(id: unknown): id is string {
  return typeof id === 'string';
}

/**
 * Elke poging met een genummerde sleutel krijgt een uuid.
 *
 * Toevoegen en weghalen, in die volgorde en in één transactie: zou het
 * omgekeerd gaan en breekt het ertussenin, dan is het antwoord weg in plaats
 * van dubbel. Dubbel is hier bovendien onmogelijk — de nieuwe sleutel is vers —
 * dus het ergste wat een halve migratie oplevert, is een rij die de volgende
 * keer opnieuw langskomt.
 */
export async function zorgVoorUniekePogingen(): Promise<void> {
  if ((await getSetting(OMGEZET)) === 'ja') return;

  const db = await getDb();
  const pogingen = await db.getAll('attempts');
  const oud = pogingen.filter((poging) => !isUuid(poging.id));

  for (const poging of oud) {
    const nummer = poging.id;
    if (nummer === undefined) continue;

    const tx = db.transaction('attempts', 'readwrite');
    await tx.store.put({ ...poging, id: crypto.randomUUID() });
    await tx.store.delete(nummer);
    await tx.done;
  }

  await setSetting(OMGEZET, 'ja');
}
