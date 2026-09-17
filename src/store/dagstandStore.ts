import { activeChildId } from './children';
import { getSetting, setSetting } from './settings';
import type { Dagstand } from '@/features/home/dagstand';

/**
 * Waar de dag mee begon, per kind (ADR-139).
 *
 * In `settings` onder een sleutel met het kind erin, zoals het weekdoel en de
 * zegels (ADR-149): die rijen zijn van het apparaat en dit is van één kind,
 * want het hangt aan zijn Leitner-standen.
 *
 * Gelezen zoals alles hier gelezen wordt — alsof een vreemde het schreef. Een
 * halve rij mag de voordeur niet meenemen, en het eerlijke antwoord op onleesbaar
 * is "vandaag is nog niet begonnen".
 */

const sleutel = (kindId: string) => `dagstand:${kindId}`;

function parse(ruw: string | undefined): Dagstand | null {
  if (!ruw) return null;

  try {
    const waarde: unknown = JSON.parse(ruw);
    if (typeof waarde !== 'object' || waarde === null) return null;
    const rij = waarde as Record<string, unknown>;
    if (typeof rij.dag !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(rij.dag)) return null;
    if (!Array.isArray(rij.sets)) return null;
    return { dag: rij.dag, sets: rij.sets.filter((set): set is string => typeof set === 'string') };
  } catch {
    return null;
  }
}

export async function leesDagstand(): Promise<Dagstand | null> {
  return parse(await getSetting(sleutel(await activeChildId())));
}

export async function schrijfDagstand(stand: Dagstand): Promise<void> {
  await setSetting(sleutel(await activeChildId()), JSON.stringify(stand));
}
