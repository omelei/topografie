import { leesSessie } from '../account/bewaren';
import { koppelingenVan } from './koppeling';
import { laadOvernameDiensten, verstuurOpnieuw, type OvernameDiensten } from './overname';

/**
 * Wat een kind in een account oefent, gaat vanzelf mee (ADR-188).
 *
 * Na elke ronde en bij het openen van de app: per kind op dit apparaat dat in
 * het account van de ingelogde ouder staat, wat er sinds de vorige keer bij
 * kwam. Het kind merkt er niets van. Er is geen knop, geen melding en geen
 * wachten: lukt het niet — geen verbinding, een verlopen sessie — dan blijft
 * het moment van de vorige keer staan, en gaat het de volgende keer mee.
 *
 * **Nooit tijdens een ronde.** `finishSession` roept dit aan als de ronde af
 * is; de vraag en het antwoord gaan nooit op een verzoek wachten, en
 * `e2e/network.spec.ts` houdt vast dat er onder het oefenen niets vertrekt.
 *
 * **Alleen als er iets te doen is.** Zonder sessie van een ouder, of zonder
 * gekoppeld kind, gebeurt er niets en wordt er niets geladen: de sessie staat
 * in `localStorage` en de koppelingen staan op dit apparaat.
 */

let bezig: Promise<void> | null = null;

export function houBij(diensten?: OvernameDiensten): Promise<void> {
  // Twee aanleidingen tegelijk — een ronde die afloopt terwijl de app net
  // opende — worden één keer versturen.
  bezig ??= werk(diensten).finally(() => {
    bezig = null;
  });
  return bezig;
}

async function werk(diensten?: OvernameDiensten): Promise<void> {
  const sessie = leesSessie();
  if (sessie === null) return;
  const koppelingen = await koppelingenVan(sessie.gebruikerId);
  if (koppelingen.length === 0) return;

  const echt = diensten ?? (await laadOvernameDiensten());
  for (const koppeling of koppelingen) {
    // Faalt het voor één kind, dan het volgende toch; wat faalde, komt de
    // volgende keer vanzelf opnieuw.
    await verstuurOpnieuw(koppeling, echt).catch(() => undefined);
  }
}
