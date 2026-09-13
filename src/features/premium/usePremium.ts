import { useMemo, useSyncExternalStore } from 'react';
import { pathFor } from '@/features/shell/routes';
import { abonneer, isActief, leesRuw, leesStand, type PremiumStand } from '@/store/premium';

/**
 * Whether premium is on, for whichever screen asks (ADR-116).
 *
 * Every screen asks the same store and every one of them hears the moment a
 * code is entered — on this tab or another — so a block that was locked opens
 * without a reload.
 */
export function usePremium(): { readonly actief: boolean; readonly stand: PremiumStand | null } {
  const ruw = useSyncExternalStore(abonneer, leesRuw, () => null);
  const stand = useMemo(() => leesStand(ruw), [ruw]);
  return { actief: isActief(stand, new Date()), stand };
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
