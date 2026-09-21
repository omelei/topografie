import { useEffect, useSyncExternalStore } from 'react';
import { pathFor } from '@/features/shell/routes';
import { abonneer, isPinGezet, leesRuw, leesSessie, sluit } from '@/store/ouder';

/**
 * Of de ouder aan zet is, voor een scherm (ADR-173).
 *
 * Twee dingen in één momentopname, want beide kunnen veranderen terwijl een
 * scherm openstaat: of er op dit apparaat een pincode is, en tot wanneer de
 * ouder aan zet is. Het is een **string** en geen object, om de reden die
 * `usePremium` er ook voor geeft — React vergelijkt momentopnames met
 * `Object.is`, en twee gelijke strings zijn dat, terwijl twee gelijke objecten
 * het niet zijn en dus elke render opnieuw een render zouden vragen.
 */
function momentopname(): string {
  return `${isPinGezet() ? 'pin' : 'geen'}|${leesRuw() ?? ''}`;
}

export interface Ouderstand {
  /** Of de ouder nu aan zet is. */
  readonly ouder: boolean;
  /** Of er op dit apparaat al een ouder bestaat. */
  readonly pinGezet: boolean;
}

export function useOuder(): Ouderstand {
  const stand = useSyncExternalStore(abonneer, momentopname, () => 'geen|');
  const [pin = 'geen', sessieRuw = ''] = stand.split('|');
  const tot = leesSessie(sessieRuw === '' ? null : sessieRuw);
  const over = tot === null ? 0 : tot.getTime() - Date.now();

  /**
   * De sessie loopt af zonder dat er iets gebeurt, en dan moet er tóch iets
   * gebeuren: een pagina die openblijft staan als het slot dichtvalt, is het
   * slot niet.
   *
   * Eén timer op het moment zelf, en geen tikker die elke seconde kijkt. Dat is
   * exact, het kost niets terwijl er niemand wacht, en `sluit` meldt het aan
   * iedereen die luistert — dus ook aan het scherm dat daarna dicht moet.
   */
  useEffect(() => {
    if (over <= 0) return;
    const timer = window.setTimeout(() => sluit(), over);
    return () => window.clearTimeout(timer);
  }, [over]);

  return { ouder: over > 0, pinGezet: pin === 'pin' };
}

/**
 * Naar de ouderpagina, vanaf een venster dat geen adres heeft.
 *
 * Hetzelfde middel als `naarPremium`, en om dezelfde reden: de wisselaar staat
 * in de toplaag naast de app en niet in een scherm, dus hij heeft geen `go` uit
 * `useRoute` bij de hand. Het adres veranderen en de router laten volgen is
 * eerlijker dan een callback door de hele boom rijgen.
 */
export function naarOuder(): void {
  const doel = pathFor({ name: 'ouder' });
  if (window.location.pathname !== doel) window.history.pushState(null, '', doel);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
