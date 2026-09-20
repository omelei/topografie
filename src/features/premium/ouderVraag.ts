import { useSyncExternalStore } from 'react';

/**
 * Of de vraag aan de ouders openstaat (ADR-163).
 *
 * Een slot zat diep — een tegel op een modulepagina, een favoriet, een regel in
 * de geschiedenis — en `naarPremium` loste dat op door het adres te veranderen
 * en de router te laten volgen, in plaats van een callback door zeven schermen
 * te rijgen. Deze vraag heeft precies hetzelfde probleem en krijgt daarom
 * precies dezelfde oplossing, één maat kleiner: geen adres maar een schakelaar
 * waar één component naar luistert.
 *
 * Geen adres, met opzet. De pop-up is iets wat over de pagina heen staat waar
 * je was, en wie hem wegklikt hoort daar nog te staan. Een adres zou van
 * wegklikken een stap terug in de geschiedenis maken, en dan zet de
 * systeem-terugknop op een telefoon je twee stappen terug.
 */

let open = false;
const luisteraars = new Set<() => void>();

function meld(): void {
  for (const luisteraar of luisteraars) luisteraar();
}

/** Vraag het even aan je ouders: de pop-up, in plaats van de premiumpagina. */
export function vraagOuders(): void {
  if (open) return;
  open = true;
  meld();
}

export function sluitOuderVraag(): void {
  if (!open) return;
  open = false;
  meld();
}

export function useOuderVraag(): boolean {
  return useSyncExternalStore(
    (luisteraar) => {
      luisteraars.add(luisteraar);
      return () => luisteraars.delete(luisteraar);
    },
    () => open,
    () => false,
  );
}
