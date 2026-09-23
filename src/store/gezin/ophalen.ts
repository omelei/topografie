import { getDb } from '../db';
import { samenDiploma, samenDoos, samenInstelling } from './samenvoegen';
import { diplomaTerug, doosTerug, instellingTerug, pogingTerug, sessieTerug } from './terug';
import type { ServerPakket } from './vervoer';

/**
 * Wat de server van een kind heeft, op dit apparaat zetten (ADR-189).
 *
 * In één transactie over de vijf winkels: halverwege stukgaan laat dan niets
 * half achter, en de volgende keer begint het gewoon opnieuw. Per rij wordt
 * gelezen wat er hier al staat en samengevoegd met de regels van
 * `samenvoegen.ts`; een ronde of een antwoord dat er al is, blijft zoals het is.
 *
 * Wat hier binnenkomt, draagt de momenten van de server. Daardoor gaat het bij
 * de volgende keer versturen niet opnieuw de deur uit, tenzij het hier daarna
 * veranderde.
 */
export async function zetOpApparaat(pakket: ServerPakket, lokaalId: string): Promise<void> {
  const dozen = pakket.voortgang.map((rij) => doosTerug(rij as never, lokaalId));
  const sessies = pakket.sessies.map((rij) => sessieTerug(rij as never, lokaalId));
  const pogingen = pakket.pogingen.map((rij) => pogingTerug(rij as never, lokaalId));
  const diplomas = pakket.diplomas.map((rij) => diplomaTerug(rij as never, lokaalId));
  const instellingen = pakket.instellingen.map((rij) => instellingTerug(rij as never, lokaalId));

  const db = await getDb();
  const tx = db.transaction(
    ['progress', 'sessions', 'attempts', 'kindBadges', 'settings'],
    'readwrite',
  );
  const werk: Promise<unknown>[] = [];

  for (const doos of dozen) {
    if (doos === null) continue;
    const winkel = tx.objectStore('progress');
    werk.push(
      winkel.get([lokaalId, doos.itemId]).then((hier) => winkel.put(samenDoos(hier, doos))),
    );
  }
  for (const sessie of sessies) {
    if (sessie === null) continue;
    const winkel = tx.objectStore('sessions');
    werk.push(winkel.get(sessie.id).then((hier) => (hier ? undefined : winkel.put(sessie))));
  }
  for (const poging of pogingen) {
    if (poging === null || typeof poging.id !== 'string') continue;
    const winkel = tx.objectStore('attempts');
    const id = poging.id;
    werk.push(winkel.get(id).then((hier) => (hier ? undefined : winkel.put(poging))));
  }
  for (const diploma of diplomas) {
    if (diploma === null) continue;
    const winkel = tx.objectStore('kindBadges');
    werk.push(
      winkel
        .get([lokaalId, diploma.badgeId])
        .then((hier) => winkel.put(samenDiploma(hier, diploma))),
    );
  }
  for (const instelling of instellingen) {
    if (instelling === null) continue;
    const winkel = tx.objectStore('settings');
    werk.push(
      winkel.get(instelling.key).then((hier) => winkel.put(samenInstelling(hier, instelling))),
    );
  }

  await Promise.all([...werk, tx.done]);
}
