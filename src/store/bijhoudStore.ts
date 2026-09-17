import { activeChildId } from './children';
import { getSetting, setSetting } from './settings';

/**
 * De bijhoudstempels op de diploma's per kind (ADR-149).
 *
 * Eén JSON-rij in `settings`: per diploma-id de seizoenen waarin het een stempel
 * kreeg, als `2026-winter`. Alleen toevoegen, nooit weghalen. Gelezen alsof een
 * vreemde het schreef: wat niet op een seizoen lijkt, valt weg.
 */

const sleutel = (kindId: string) => `bijhouden:${kindId}`;
const SEIZOEN = /^\d{4}-(herfst|winter|lente|zomer)$/;

export type Bijhouden = Readonly<Record<string, readonly string[]>>;

function bijhoudenUit(ruw: string | undefined): Record<string, string[]> {
  if (ruw === undefined) return {};
  try {
    const waarde: unknown = JSON.parse(ruw);
    if (waarde === null || typeof waarde !== 'object' || Array.isArray(waarde)) return {};
    const uit: Record<string, string[]> = {};
    for (const [id, lijst] of Object.entries(waarde)) {
      if (!id.startsWith('diploma-') || !Array.isArray(lijst)) continue;
      uit[id] = lijst.filter((s): s is string => typeof s === 'string' && SEIZOEN.test(s));
    }
    return uit;
  } catch {
    return {};
  }
}

export async function leesBijhouden(): Promise<Bijhouden> {
  return bijhoudenUit(await getSetting(sleutel(await activeChildId())));
}

/** Zet nieuwe stempels erbij. Geeft terug wat er echt nieuw was. */
export async function voegBijhoudstempelsToe(
  nieuw: readonly { readonly id: string; readonly seizoen: string }[],
): Promise<readonly { readonly id: string; readonly seizoen: string }[]> {
  if (nieuw.length === 0) return [];
  const kindId = await activeChildId();
  const stand = bijhoudenUit(await getSetting(sleutel(kindId)));
  const erbij = nieuw.filter(({ id, seizoen }) => {
    if (!SEIZOEN.test(seizoen) || (stand[id] ?? []).includes(seizoen)) return false;
    stand[id] = [...(stand[id] ?? []), seizoen];
    return true;
  });
  if (erbij.length > 0) await setSetting(sleutel(kindId), JSON.stringify(stand));
  return erbij;
}
