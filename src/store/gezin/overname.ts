import { huidigeGroep } from '@/game-core';
import type { ProfileRecord } from '../db';
import {
  koppelingenVan,
  leesKoppeling,
  schrijfKoppeling,
  vergeetKoppeling,
  type Koppeling,
} from './koppeling';
import { leesPakket } from './pakket';
import type { ServerKind, Vervoer, VervoerFout } from './vervoer';

/**
 * Een kind dat al op dit apparaat oefende, meenemen naar het account van zijn
 * ouder (ADR-187, `ouder-en-kind.md` §9).
 *
 * Drie stappen, in deze volgorde, en elk op zichzelf veilig om te herhalen:
 *
 * 1. Het kind in het account zetten (`kind-beheer`, actie `opnemen`).
 * 2. De koppeling op dit apparaat schrijven, meteen, vóór er iets verstuurd
 *    wordt. Gaat stap 3 mis, dan weet dit apparaat dat het kind er al staat, en
 *    maakt de volgende poging er geen tweede van.
 * 3. Alles versturen wat er van dit kind staat. Dat mag vaker: sessies en
 *    pogingen die er al zijn worden overgeslagen, de rest wordt bijgewerkt.
 *
 * Wat hier niet gebeurt: iets omschrijven op dit apparaat. Het kind houdt zijn
 * lokale sleutel (ADR-175); de koppeling is het enige wat erbij komt.
 */

export type OvernameFout = VervoerFout | 'niet-ingelogd';

export type OvernameUitkomst =
  | { readonly ok: true; readonly koppeling: Koppeling }
  | { readonly ok: false; readonly reden: OvernameFout };

export interface OvernameDiensten {
  readonly vervoer: Vervoer;
  /** Het token en de id van de ingelogde ouder, ververst; null als er niemand is. */
  readonly ouder: () => Promise<{ readonly token: string; readonly ouderId: string } | null>;
}

/** De groep die de server kent, of geen: `kinderen.groep` staat 3 tot en met 8 toe. */
function groepVoorServer(kind: ProfileRecord, nu: Date): number | null {
  return huidigeGroep(kind, nu) ?? null;
}

export async function neemMee(
  kind: ProfileRecord,
  diensten: OvernameDiensten,
  nu = new Date(),
): Promise<OvernameUitkomst> {
  const ouder = await diensten.ouder();
  if (ouder === null) return { ok: false, reden: 'niet-ingelogd' };

  let koppeling = await leesKoppeling(kind.id);
  if (koppeling === null || koppeling.ouderId !== ouder.ouderId) {
    const nieuw = await diensten.vervoer.neemOp(ouder.token, {
      voornaam: kind.naam,
      groep: groepVoorServer(kind, nu),
    });
    if (!nieuw.ok) return nieuw;
    koppeling = {
      lokaalId: kind.id,
      kindId: nieuw.waarde.id,
      ouderId: ouder.ouderId,
      verstuurdOp: null,
    };
    await schrijfKoppeling(koppeling);
  }

  return verstuur(koppeling, ouder.token, diensten, nu);
}

/**
 * Versturen voor een kind dat al gekoppeld is: na een hapering, en na elke
 * ronde (`bijhouden.ts`). Alleen wat er sinds de vorige keer bij kwam.
 */
export async function verstuurOpnieuw(
  koppeling: Koppeling,
  diensten: OvernameDiensten,
  nu = new Date(),
): Promise<OvernameUitkomst> {
  const ouder = await diensten.ouder();
  if (ouder === null) return { ok: false, reden: 'niet-ingelogd' };
  return verstuur(koppeling, ouder.token, diensten, nu);
}

/**
 * Hoeveel eerder dan de vorige keer er opnieuw gekeken wordt (ADR-188).
 *
 * Het moment van de vorige keer is genomen vóór er gelezen werd, dus in
 * principe is nul genoeg. Vijf minuten vangt wat daar tussen kan zitten — een
 * ronde die afliep terwijl er verstuurd werd, een klok die even verspringt —
 * en kost niets: wat twee keer aankomt, wordt op de server overgeslagen of
 * samengevoegd.
 */
const MARGE_MS = 5 * 60_000;

function sindsVan(koppeling: Koppeling): string | undefined {
  if (koppeling.verstuurdOp === null) return undefined;
  const moment = new Date(koppeling.verstuurdOp).getTime();
  if (Number.isNaN(moment)) return undefined;
  return new Date(moment - MARGE_MS).toISOString();
}

async function verstuur(
  koppeling: Koppeling,
  token: string,
  diensten: OvernameDiensten,
  nu: Date,
): Promise<OvernameUitkomst> {
  // Is het nog nooit helemaal gelukt, dan alles; anders wat er sindsdien bij
  // kwam (ADR-188).
  const pakket = await leesPakket(koppeling, nu, sindsVan(koppeling));
  const gestuurd = await diensten.vervoer.stuur(token, pakket);
  if (!gestuurd.ok) return gestuurd;

  const klaar = { ...koppeling, verstuurdOp: nu.toISOString() };
  await schrijfKoppeling(klaar);
  return { ok: true, koppeling: klaar };
}

/**
 * Een kind uit het account halen.
 *
 * Op de server verdwijnt alles van dit kind (`on delete cascade`, ADR-155); op
 * dit apparaat blijft alles staan, want dat is waar het vandaan kwam. Alleen de
 * koppeling gaat weg, en daarmee is het kind hier weer wat het was vóór de
 * opname. Dat is "een account verwijderen en de gegevens meenemen" (§9), voor
 * één kind.
 */
export async function haalUitAccount(
  koppeling: Koppeling,
  diensten: OvernameDiensten,
): Promise<{ readonly ok: true } | { readonly ok: false; readonly reden: OvernameFout }> {
  const ouder = await diensten.ouder();
  if (ouder === null) return { ok: false, reden: 'niet-ingelogd' };
  const weg = await diensten.vervoer.haalWeg(ouder.token, koppeling.kindId);
  if (!weg.ok) return weg;
  await vergeetKoppeling(koppeling.lokaalId);
  return { ok: true };
}

/**
 * Wat er van het gezin te zien is: de kinderen in het account, en welke
 * daarvan op dit apparaat staan.
 */
export async function gezinsstand(diensten: OvernameDiensten): Promise<
  | {
      readonly ok: true;
      readonly ouderId: string;
      readonly inAccount: readonly ServerKind[];
      readonly koppelingen: readonly Koppeling[];
    }
  | { readonly ok: false; readonly reden: OvernameFout }
> {
  const ouder = await diensten.ouder();
  if (ouder === null) return { ok: false, reden: 'niet-ingelogd' };
  const lijst = await diensten.vervoer.kinderen(ouder.token);
  if (!lijst.ok) return lijst;

  // Een koppeling naar een kind dat niet meer in het account staat — weggehaald
  // op een ander apparaat — is een koppeling naar niets. Die gaat hier weg, zodat
  // het kind op dit apparaat weer mee te nemen is in plaats van vast te zitten
  // aan een id die de server niet meer kent.
  const bestaat = new Set(lijst.waarde.map((kind) => kind.id));
  const koppelingen: Koppeling[] = [];
  for (const koppeling of await koppelingenVan(ouder.ouderId)) {
    if (bestaat.has(koppeling.kindId)) koppelingen.push(koppeling);
    else await vergeetKoppeling(koppeling.lokaalId);
  }

  return { ok: true, ouderId: ouder.ouderId, inAccount: lijst.waarde, koppelingen };
}

let echt: Promise<OvernameDiensten> | null = null;

/**
 * De echte diensten, lui geladen: het transport en de accountlaag komen pas
 * binnen als een ouder op de ouderpagina iets met zijn account doet.
 */
export function laadOvernameDiensten(): Promise<OvernameDiensten> {
  echt ??= Promise.all([import('./vervoer'), import('../account')]).then(
    ([{ vervoer }, { laadAccount }]) => ({
      vervoer,
      ouder: async () => {
        const account = await laadAccount();
        const sessie = await account.sessie();
        return sessie === null ? null : { token: sessie.token, ouderId: sessie.gebruikerId };
      },
    }),
  );
  return echt;
}
