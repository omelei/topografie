/**
 * De voordeur van de accountlaag (ADR-155).
 *
 * Dit bestand is met opzet bijna leeg, en dat is de hele truc. Wie nooit op
 * "Voor ouders" komt, downloadt alleen dit: twee regels die naar
 * `import.meta.env` kijken. `supabaseAccount.ts` komt er pas bij zodra er
 * werkelijk iets met een account gedaan wordt.
 *
 * Dat de shell van 300 kB niet groeit voor een kind dat nooit inlogt, is eis en
 * geen streven (ADR-050). Er zit geen bibliotheek achter — het transport is kale
 * `fetch` — dus er valt weinig te laden, maar de scheiding staat er zodat dat
 * waar blijft als er ooit wél iets bij komt.
 */

import { abonneer, leesRuw, leesSessie } from './bewaren';
import { isIngesteld } from './omgeving';
import type { Account } from './types';

export type { Account, AccountFout, AccountUitkomst, Sessie } from './types';
export { abonneer, isIngesteld, leesRuw, leesSessie };

let geladen: Promise<Account> | null = null;

/** De echte accountlaag, lui geladen en daarna onthouden. */
export function laadAccount(): Promise<Account> {
  geladen ??= import('./supabaseAccount').then((mod) => mod.supabaseAccount);
  return geladen;
}
