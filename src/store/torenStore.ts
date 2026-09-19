import { beginToren, standVan, stenenErbij, type TorenOpslag, type TorenStand, type Vak } from '@/game-core';
import { activeChildId } from './children';
import { loadItemStates } from './progress';
import { getSetting, setSetting } from './settings';

/**
 * De toren per kind (ADR-158), in `settings` zoals het doel en de dagstand.
 *
 * **Append-only.** Er komen stenen bij en er gaat nooit iets af, dus dit bestand
 * kent alleen lezen en toevoegen. Bewaard wordt het fundament, de volle
 * verdiepingen met hun datum en kleuren, en de verdieping in aanbouw — en niet
 * het totaal, want dat is er de som van en twee tellingen worden het ooit oneens.
 *
 * **Gelezen alsof een vreemde het schreef.** Wat er niet is, en wat er staat maar
 * geen toren is, geven allebei `null`: het verschil tussen "nog nooit geschreven"
 * en "kapot" bestaat hier niet, want in allebei de gevallen is de enige goede
 * volgende stap dezelfde — opnieuw beginnen uit wat het kind al had.
 *
 * Geen schemawijziging: `hoogsteDoos` en `stempels` blijven op de voortgangsrijen
 * staan en worden door niets meer gelezen (ADR-130, ADR-149).
 */

const sleutel = (kindId: string) => `toren:${kindId}`;

function getal(waarde: unknown): number | null {
  return typeof waarde === 'number' && Number.isFinite(waarde) && waarde >= 0
    ? Math.floor(waarde)
    : null;
}

function vakken(waarde: unknown): readonly (Vak | null)[] | null {
  if (!Array.isArray(waarde)) return null;
  return waarde.every((vak) => vak === null || typeof vak === 'string')
    ? (waarde as (Vak | null)[])
    : null;
}

function torenUit(ruw: string | undefined): TorenOpslag | null {
  if (ruw === undefined) return null;
  try {
    const waarde: unknown = JSON.parse(ruw);
    if (typeof waarde !== 'object' || waarde === null) return null;
    const { fundament, verdiepingen, aanbouw } = waarde as Record<string, unknown>;

    const basis = getal(fundament);
    const bouw = vakken(aanbouw);
    if (basis === null || bouw === null || !Array.isArray(verdiepingen)) return null;

    const volle = verdiepingen.flatMap((rij: unknown) => {
      if (typeof rij !== 'object' || rij === null) return [];
      const { nummer, datum, vakken: stenen } = rij as Record<string, unknown>;
      const n = getal(nummer);
      const kleuren = vakken(stenen);
      if (n === null || typeof datum !== 'string' || kleuren === null) return [];
      return [{ nummer: n, datum, vakken: kleuren }];
    });

    return { fundament: basis, verdiepingen: volle, aanbouw: bouw };
  } catch {
    return null;
  }
}

/**
 * De toren van het kind dat nu speelt.
 *
 * Staat er nog niets, dan begint hij op alles wat dit kind ooit goed had. Dat is
 * royaal met opzet: de overgang van het album naar de toren mag nooit als verlies
 * voelen. Die eerste toren wordt meteen weggeschreven, zodat het fundament niet
 * meegroeit met elk volgend goed antwoord.
 */
export async function leesToren(): Promise<TorenOpslag> {
  const kindId = await activeChildId();
  const bewaard = torenUit(await getSetting(sleutel(kindId)));
  if (bewaard !== null) return bewaard;

  const states = await loadItemStates();
  let goed = 0;
  for (const state of states.values()) goed += state.goedCount;

  const eerste = beginToren(goed);
  await setSetting(sleutel(kindId), JSON.stringify(eerste));
  return eerste;
}

/** Wat een ronde aan de toren deed: de stand ervoor en erna. */
export interface TorenGroei {
  readonly voor: TorenStand;
  readonly na: TorenStand;
}

/**
 * De stenen van een ronde erbij.
 *
 * Geeft de stand van vóór en van ná terug, want de uitslag wil allebei: hoeveel
 * er bij kwamen, en of er een verdieping vol raakte.
 */
export async function voegStenenToe(
  gewonnen: readonly Vak[],
  now: Date = new Date(),
): Promise<TorenGroei> {
  const kindId = await activeChildId();
  const voor = await leesToren();
  if (gewonnen.length === 0) return { voor: standVan(voor), na: standVan(voor) };

  const na = stenenErbij(voor, gewonnen, now);
  await setSetting(sleutel(kindId), JSON.stringify(na));
  return { voor: standVan(voor), na: standVan(na) };
}
