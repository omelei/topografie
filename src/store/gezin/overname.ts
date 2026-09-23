import { huidigeGroep } from '@/game-core';
import type { ProfileRecord } from '../db';
import {
  koppelingenVan,
  leesKoppeling,
  schrijfKoppeling,
  sindsVan,
  vergeetKoppeling,
  type Koppeling,
} from './koppeling';
import { createChild } from '../children';
import { zetOpApparaat } from './ophalen';
import { leesPakket } from './pakket';
import type { ServerKind, Vervoer, VervoerFout, WachtwoordFout } from './vervoer';

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

export type OvernameFout =
  | VervoerFout
  | 'niet-ingelogd'
  /** Er kan op dit apparaat geen kind meer bij (ADR-173). */
  | 'vol';

export type OvernameUitkomst =
  | { readonly ok: true; readonly koppeling: Koppeling }
  | { readonly ok: false; readonly reden: OvernameFout };

/**
 * Eén handeling van een scherm, met een naam: `copy.test.ts` zoekt zichtbare
 * tekst met een regex die `=> Promise<…>` in een `.tsx` aanziet voor tekst
 * tussen twee tags (zie `useAccount.ts`). Hier, in een `.ts`, is dat geen tekst.
 */
export type OvernameStap = () => Promise<OvernameUitkomst>;

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
      // Een kind dat net nieuw in het account staat, heeft daar niets wat hier
      // ontbreekt: ophalen hoeft pas vanaf nu.
      opgehaaldOp: nu.toISOString(),
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

async function verstuur(
  koppeling: Koppeling,
  token: string,
  diensten: OvernameDiensten,
  nu: Date,
): Promise<OvernameUitkomst> {
  // Is het nog nooit helemaal gelukt, dan alles; anders wat er sindsdien bij
  // kwam (ADR-188).
  const pakket = await leesPakket(koppeling, nu, sindsVan(koppeling.verstuurdOp));
  const gestuurd = await diensten.vervoer.stuur(token, pakket);
  if (!gestuurd.ok) return gestuurd;

  const klaar = { ...koppeling, verstuurdOp: nu.toISOString() };
  await schrijfKoppeling(klaar);
  return { ok: true, koppeling: klaar };
}

/**
 * Ophalen wat andere apparaten van dit kind stuurden, en het hier samenvoegen
 * (ADR-189). Alleen wat er sinds de vorige keer veranderde.
 */
async function haalOp(
  koppeling: Koppeling,
  token: string,
  diensten: OvernameDiensten,
  nu: Date,
): Promise<OvernameUitkomst> {
  const gehaald = await diensten.vervoer.haal(
    token,
    koppeling.kindId,
    sindsVan(koppeling.opgehaaldOp),
  );
  if (!gehaald.ok) return gehaald;
  await zetOpApparaat(gehaald.waarde, koppeling.lokaalId);

  const klaar = { ...koppeling, opgehaaldOp: nu.toISOString() };
  await schrijfKoppeling(klaar);
  return { ok: true, koppeling: klaar };
}

/**
 * Bijwerken, beide kanten op (ADR-188, ADR-189): eerst versturen wat hier bij
 * kwam, dan ophalen wat elders bij kwam. Na elke ronde en bij het openen van
 * de app, vanuit `bijhouden.ts`.
 */
export async function werkBij(
  koppeling: Koppeling,
  diensten: OvernameDiensten,
  nu = new Date(),
): Promise<OvernameUitkomst> {
  const ouder = await diensten.ouder();
  if (ouder === null) return { ok: false, reden: 'niet-ingelogd' };
  const gestuurd = await verstuur(koppeling, ouder.token, diensten, nu);
  if (!gestuurd.ok) return gestuurd;
  return haalOp(gestuurd.koppeling, ouder.token, diensten, nu);
}

/**
 * Een kind uit het account op dit apparaat zetten, als nieuw kind hier
 * (ADR-189). Het tweede apparaat van een gezin: de laptop naast de iPad.
 */
export async function zetKindHier(
  kind: ServerKind,
  diensten: OvernameDiensten,
  nu = new Date(),
): Promise<OvernameUitkomst> {
  const ouder = await diensten.ouder();
  if (ouder === null) return { ok: false, reden: 'niet-ingelogd' };

  const groep = kind.groep !== null && kind.groep >= 3 && kind.groep <= 8 ? kind.groep : undefined;
  const hier = await createChild(kind.voornaam, groep as Parameters<typeof createChild>[1]);
  if (hier === null) return { ok: false, reden: 'vol' };

  const koppeling: Koppeling = {
    lokaalId: hier.id,
    kindId: kind.id,
    ouderId: ouder.ouderId,
    // Hier stond nog niets, dus er is niets te versturen.
    verstuurdOp: nu.toISOString(),
    opgehaaldOp: null,
  };
  await schrijfKoppeling(koppeling);
  return haalOp(koppeling, ouder.token, diensten, nu);
}

/**
 * Een kind dat hier al oefent, koppelen aan een kind dat al in het account
 * staat (ADR-189, §9: "samenvoegen met een bestaand kind").
 *
 * Nooit vanzelf: twee keer Noor is niet per se één Noor, dus de ouder kiest.
 * Eerst ophalen en hier samenvoegen, dan alles van hier versturen; op de server
 * voegen de triggers van `0003` het samen. Daarna is het één kind met één stel
 * dozen, op beide apparaten.
 */
export async function koppelAan(
  hier: ProfileRecord,
  kind: ServerKind,
  diensten: OvernameDiensten,
  nu = new Date(),
): Promise<OvernameUitkomst> {
  const ouder = await diensten.ouder();
  if (ouder === null) return { ok: false, reden: 'niet-ingelogd' };

  const koppeling: Koppeling = {
    lokaalId: hier.id,
    kindId: kind.id,
    ouderId: ouder.ouderId,
    verstuurdOp: null,
    opgehaaldOp: null,
  };
  await schrijfKoppeling(koppeling);
  const gehaald = await haalOp(koppeling, ouder.token, diensten, nu);
  if (!gehaald.ok) return gehaald;
  return verstuur(gehaald.koppeling, ouder.token, diensten, nu);
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

/**
 * Een wachtwoord zetten waarmee een kind zelf inlogt (ADR-190), met het token
 * van de ouder. `kind-beheer` kijkt na of het kind van deze ouder is.
 */
export async function zetWachtwoordVoorKind(
  kindId: string,
  wachtwoord: string,
  diensten: OvernameDiensten,
): Promise<
  { readonly ok: true } | { readonly ok: false; readonly reden: WachtwoordFout | 'niet-ingelogd' }
> {
  const ouder = await diensten.ouder();
  if (ouder === null) return { ok: false, reden: 'niet-ingelogd' };
  return diensten.vervoer.zetWachtwoord(ouder.token, kindId, wachtwoord);
}

/**
 * Diensten voor een kind dat zelf ingelogd is (ADR-190): hetzelfde transport,
 * met het token van het kind in plaats van dat van een ouder. `werkBij` heeft
 * alleen het token nodig; de policy laat een kind zijn eigen rijen schrijven.
 */
export function dienstenVoorKind(
  vervoer: Vervoer,
  token: () => Promise<string | null>,
): OvernameDiensten {
  return {
    vervoer,
    ouder: async () => {
      const waarde = await token();
      return waarde === null ? null : { token: waarde, ouderId: '' };
    },
  };
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
