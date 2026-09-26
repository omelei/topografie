import { useSyncExternalStore } from 'react';
import { onthoudWens, type Wens } from '@/store/wensen';

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
let huidig: Wens | null = null;
/** Het venster gaat over een volle code, niet over iets wat bij premium hoort (ADR-226). */
let omPlek = false;
const luisteraars = new Set<() => void>();

function meld(): void {
  for (const luisteraar of luisteraars) luisteraar();
}

/**
 * Vraag het even aan je ouders: de pop-up, in plaats van de premiumpagina.
 *
 * Met een wens noemt het venster wat het kind wilde, en onthoudt dit apparaat
 * het voor de ouderpagina (ADR-193). Het gaat niet mee in wat er doorgestuurd
 * wordt (ADR-174).
 */
export function vraagOuders(wens?: Wens): void {
  if (open) return;
  huidig = wens ?? null;
  omPlek = false;
  open = true;
  meld();
  if (wens) void onthoudWens(wens);
}

/**
 * Alle plekken van de code zijn in gebruik (ADR-226). Het venster zegt dat de
 * ouders het kunnen regelen, en niets anders: geen code, geen prijs, geen knop
 * om te kopen. Er valt niets te kopen; er moet een plek vrij (R-11).
 */
export function vraagOudersOmPlek(): void {
  if (open) return;
  huidig = null;
  omPlek = true;
  open = true;
  meld();
}

/** Of het open venster over een volle code gaat. */
export function isVraagOmPlek(): boolean {
  return open && omPlek;
}

/** Wat het kind wilde, zolang het venster openstaat. */
export function huidigeWens(): Wens | null {
  return open ? huidig : null;
}

export function sluitOuderVraag(): void {
  if (!open) return;
  open = false;
  huidig = null;
  omPlek = false;
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
