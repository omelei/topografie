import { getDb, type ProfileRecord } from '../db';
import { switchChild } from '../children';
import { createProfile } from '../profile';
import { verlooptOp } from '../account/oordeel';
import { bewaarKindsessie } from './kindsessie';
import { alleKoppelingen, schrijfKoppeling } from './koppeling';
import { dienstenVoorKind, werkBij } from './overname';
import type { KindInlogFout, Vervoer } from './vervoer';

/**
 * Een kind logt zelf in, met zijn inlogcode en een wachtwoord dat de ouder
 * zette (ADR-190). Voor een apparaat zonder ouder erbij: de chromebook van
 * school, de laptop bij opa.
 *
 * Vier stappen:
 *
 * 1. `kind-inloggen` zet code en wachtwoord om in een sessie. Daar zit de
 *    begrenzer, en daar wordt niet verteld of een code bestaat (ADR-155).
 * 2. Met die sessie leest het kind zijn eigen rij: de policy laat precies één
 *    rij zien.
 * 3. Staat het kind hier al (een koppeling met zijn id), dan wordt dat het
 *    actieve kind. Anders komt het erbij, binnen de grens van drie.
 * 4. De sessie en de koppeling worden bewaard, en alles wordt opgehaald.
 *
 * Mislukt dat laatste, dan is het kind er toch: de volgende ronde of het
 * volgende opstarten haalt het alsnog op (`bijhouden.ts`).
 */

export type KindInlogUitkomst =
  | { readonly ok: true; readonly profiel: ProfileRecord }
  | { readonly ok: false; readonly reden: KindInlogFout | 'vol' };

export async function logInAlsKind(
  code: string,
  wachtwoord: string,
  vervoer: Vervoer,
  nu = new Date(),
): Promise<KindInlogUitkomst> {
  const ingelogd = await vervoer.inloggenAlsKind(code, wachtwoord);
  if (!ingelogd.ok) return ingelogd;
  const { token, vernieuwToken, seconden } = ingelogd.sessie;

  const zelf = await vervoer.ikZelf(token);
  if (!zelf.ok)
    return { ok: false, reden: zelf.reden === 'geen-verbinding' ? 'geen-verbinding' : 'storing' };
  const kind = zelf.waarde;

  const al = (await alleKoppelingen()).find((koppeling) => koppeling.kindId === kind.id);
  let profiel: ProfileRecord | null | undefined;
  if (al !== undefined) {
    profiel = await (await getDb()).get('profile', al.lokaalId);
    if (profiel !== undefined) await switchChild(profiel.id);
  }
  if (profiel === undefined || profiel === null) {
    const groep =
      kind.groep !== null && kind.groep >= 3 && kind.groep <= 8 ? kind.groep : undefined;
    profiel = await createProfile(kind.voornaam, groep as Parameters<typeof createProfile>[1]);
  }
  if (profiel === null) return { ok: false, reden: 'vol' };

  bewaarKindsessie(kind.id, {
    gebruikerId: kind.id,
    // Een kind heeft geen adres (ADR-155); dit veld is van de ouder.
    email: '',
    token,
    vernieuwToken,
    verlooptOp: verlooptOp(seconden, nu),
  });

  const koppeling = al ?? {
    lokaalId: profiel.id,
    kindId: kind.id,
    ouderId: kind.ouderId,
    // Wat hier stond, is van een nieuw kind: niets. Ophalen is alles.
    verstuurdOp: nu.toISOString(),
    opgehaaldOp: null,
  };
  await schrijfKoppeling(koppeling);
  await werkBij(
    koppeling,
    dienstenVoorKind(vervoer, async () => token),
    nu,
  ).catch(() => undefined);

  return { ok: true, profiel };
}
