import { useMemo, useSyncExternalStore } from 'react';
import { pathFor } from '@/features/shell/routes';
import { abonneer, isActief, leesRuw, leesStand, type PremiumStand } from '@/store/premium';
import { abonneerProef, leesProefRuw, proefBegin, proefStand, type ProefStand } from '@/store/proef';

/**
 * Whether premium is on, for whichever screen asks (ADR-116).
 *
 * Every screen asks the same store and every one of them hears the moment a
 * code is entered — on this tab or another — so a block that was locked opens
 * without a reload.
 *
 * `actief` is a code or the trial (ADR-193): every lock asks only that, so the
 * fourteen days open everything a code opens. `metCode` is the code alone, for
 * the few places that talk about the code itself; `proef` is where the trial
 * stands, and is `geen` whenever a code is on.
 */
export function usePremium(): {
  readonly actief: boolean;
  readonly metCode: boolean;
  readonly stand: PremiumStand | null;
  readonly proef: ProefStand;
} {
  const ruw = useSyncExternalStore(abonneer, leesRuw, () => null);
  const proefRuw = useSyncExternalStore(abonneerProef, leesProefRuw, () => null);
  const stand = useMemo(() => leesStand(ruw), [ruw]);
  const now = new Date();
  const metCode = isActief(stand, now);
  const proef: ProefStand = metCode ? { soort: 'geen' } : proefStand(proefBegin(proefRuw), now);
  return { actief: metCode || proef.soort === 'loopt', metCode, stand, proef };
}

/**
 * To the premium page, from a lock anywhere inside the app.
 *
 * The locks are deep — a block in the child's own column, a diploma wall, a
 * tile on a module page — so rather than threading a callback through each of
 * them, this does what the back button does: it changes the address and says
 * so, and the router (`useRoute`) follows.
 */
export function naarPremium(): void {
  const doel = pathFor({ name: 'premium' });
  if (window.location.pathname !== doel) window.history.pushState(null, '', doel);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function useNaarPremium(): () => void {
  return naarPremium;
}

/** "13 september 2027": the last day of a code, as a parent reads a date. */
export function leesbareDatum(dag: string): string {
  return new Intl.DateTimeFormat('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${dag}T12:00:00`));
}
