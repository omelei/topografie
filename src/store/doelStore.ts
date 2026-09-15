import { activeChildId } from './children';
import { getSetting, setSetting } from './settings';

/**
 * Waar dit kind voor gaat, per kind (ADR-141).
 *
 * In `settings` onder een sleutel met het kind erin, zoals de dagstand en de
 * heldenstand: een doel hangt aan de diploma's van één kind, niet aan het
 * apparaat.
 *
 * Bewaard wordt alleen de id van het diploma. Niet de naam, niet de voortgang,
 * niet de datum: dat is allemaal elders af te leiden en een tweede kopie gaat
 * scheelopen. En gelezen alsof een vreemde het schreef — een id die nergens meer
 * bij hoort levert gewoon "nog geen doel" op, want `doelwitMet` vindt hem dan
 * niet terug.
 */

const sleutel = (kindId: string) => `doel:${kindId}`;

/** Alleen wat er als diploma uit kan zien; de rest is een halve rij. */
const DIPLOMA = /^diploma-[a-z0-9-]{1,40}$/;

export async function leesDoel(): Promise<string | null> {
  const ruw = await getSetting(sleutel(await activeChildId()));
  return ruw !== undefined && DIPLOMA.test(ruw) ? ruw : null;
}

/** Een doel zetten, of het weghalen met null. */
export async function schrijfDoel(id: string | null): Promise<void> {
  await setSetting(sleutel(await activeChildId()), id ?? '');
}
