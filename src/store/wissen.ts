import { DB_NAME, getDb, vergeetDb } from './db';
import { vergeetOuder } from './ouder';
import { meldAf, PREMIUM_SLEUTEL } from './premium';

/**
 * Alles van dit apparaat halen (ADR-166).
 *
 * Dit product zegt op elke pagina dat de voortgang op het apparaat blijft en
 * nergens heen gaat, en sinds ADR-164 staat er op de premiumpagina bij dat we
 * geen namen van kinderen opslaan. Wat er niet was, is de knop waarmee je daar
 * iets aan hebt: er was geen enkele weg om het weer weg te krijgen. De enige
 * uitweg was de site-data van de browser wissen — een menu dat de meeste ouders
 * niet vinden, dat ook de premiumcode meeneemt, en dat op een gedeelde iPad
 * bovendien veel meer wist dan leer.nu.
 *
 * Een belofte over waar iets staat, is pas iets waard als je er ook bij kunt.
 *
 * **De volgorde is het hele werk.** Eerst de code van dit apparaat afmelden,
 * dán de database weggooien. Andersom is de plek die de code op de server bezet
 * houdt niet meer terug te geven: de code stond in `localStorage` en die is dan
 * al weg, en een gezin dat drie apparaten mag gebruiken raakt er een kwijt aan
 * een apparaat dat niets meer weet. Mislukt het afmelden — geen verbinding, of
 * geen kassa — dan gaat het wissen gewoon door: een ouder die op deze knop
 * drukt, wil dat er niets achterblijft, en de server merkt het verlopen van de
 * code vanzelf.
 *
 * **De verbinding wordt eerst gesloten.** IndexedDB blokkeert een `deleteDatabase`
 * zolang er een open verbinding is, en dan gebeurt er niets, zonder fout. Dus
 * gaat de database dicht en wordt de cache in `db.ts` leeggemaakt, zodat een
 * volgende `getDb()` er een nieuwe en lege opent.
 */

/** Alle sleutels die dit product in `localStorage` zet. Er zijn er drie. */
const LOKALE_SLEUTELS: readonly string[] = [
  PREMIUM_SLEUTEL,
  'leernu.apparaat',
  'leernu.bestelling',
];

export async function wisAlles(): Promise<void> {
  // Eerst de plek op de server vrijgeven, zolang de code er nog is.
  try {
    await meldAf();
  } catch {
    // Geen verbinding is geen reden om het wissen niet te doen.
  }

  try {
    const db = await getDb();
    db.close();
  } catch {
    // Een database die niet eens opengaat, hoeft ook niet gesloten te worden.
  }
  vergeetDb();

  await new Promise<void>((klaar) => {
    const verzoek = indexedDB.deleteDatabase(DB_NAME);
    // Alle drie de aflopen eindigen hier. `blocked` betekent dat een ander
    // tabblad de database nog open heeft: dan is er hier niets meer te doen, en
    // de herlaadbeurt hieronder sluit dit tabblad af. Wachten zou de knop laten
    // hangen tot iemand een tabblad sluit dat hij misschien niet kan vinden.
    verzoek.onsuccess = () => klaar();
    verzoek.onerror = () => klaar();
    verzoek.onblocked = () => klaar();
  });

  for (const sleutel of LOKALE_SLEUTELS) {
    try {
      window.localStorage.removeItem(sleutel);
    } catch {
      // Een browser die niets wil bewaren, heeft ook niets te wissen.
    }
  }

  // En de ouder van dit apparaat: de pincode, de pauze en de sessie (ADR-173).
  // Dit is ook de enige weg terug voor wie zijn pincode kwijt is, en daarom
  // levert hij niets op: wie hem neemt, houdt een leeg apparaat over.
  vergeetOuder();
}
