import { leesSessie } from '../account/bewaren';
import { geldigeKindsessie, kinderenMetSessie } from './kindsessie';
import { alleKoppelingen } from './koppeling';
import { dienstenVoorKind, laadOvernameDiensten, werkBij, type OvernameDiensten } from './overname';

/**
 * Wat een kind in een account oefent, gaat vanzelf mee (ADR-188).
 *
 * Na elke ronde en bij het openen van de app: per kind op dit apparaat dat in
 * het account van de ingelogde ouder staat, wat er sinds de vorige keer bij
 * kwam — beide kanten op: eerst versturen, dan ophalen wat een ander apparaat
 * stuurde (ADR-189). Het kind merkt er niets van. Er is geen knop, geen melding en geen
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
  // Twee soorten kinderen op dit apparaat: die van de ingelogde ouder, en die
  // zelf ingelogd zijn met hun code (ADR-190). Een kind van een ouder die hier
  // niet is ingelogd en dat zelf ook niet is ingelogd, wacht tot een van
  // beiden er is.
  const ouder = leesSessie();
  const metSessie = new Set(kinderenMetSessie());
  const alle = await alleKoppelingen();
  const vanOuder = ouder === null ? [] : alle.filter((k) => k.ouderId === ouder.gebruikerId);
  const vanKind = alle.filter((k) => !vanOuder.includes(k) && metSessie.has(k.kindId));
  if (vanOuder.length === 0 && vanKind.length === 0) return;

  const echt = diensten ?? (await laadOvernameDiensten());
  // Faalt het voor één kind, dan het volgende toch; wat faalde, komt de
  // volgende keer vanzelf opnieuw.
  for (const koppeling of vanOuder) {
    await werkBij(koppeling, echt).catch(() => undefined);
  }
  for (const koppeling of vanKind) {
    const alsKind = dienstenVoorKind(echt.vervoer, async () => {
      const sessie = await geldigeKindsessie(koppeling.kindId);
      return sessie?.token ?? null;
    });
    await werkBij(koppeling, alsKind).catch(() => undefined);
  }
}
