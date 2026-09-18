/**
 * Wat er van een adres, een wachtwoord en een antwoord van de server te vinden
 * is — zonder netwerk, zonder klok, zonder opslag (ADR-155).
 *
 * Dit is het deel dat te testen valt, en daarom staat het los van de twee
 * implementaties. `supabaseAccount.ts` haalt de antwoorden op en laat ze hier
 * beoordelen; `nepAccount.ts` gebruikt dezelfde regels, zodat een test die
 * slaagt iets zegt over wat er echt gebeurt.
 */

import type { AccountFout, Sessie } from './types';

/**
 * Streng genoeg om een typefout te vangen, niet strenger. Dezelfde regel als
 * `isEmail` in de kassa (ADR-123), met opzet nog eens opgeschreven: dat bestand
 * draait op Deno in een edge function, en de app ernaartoe laten wijzen zou een
 * bundel aan een server knopen om vier regels te delen.
 */
export function normaliseerEmail(invoer: string): string {
  return invoer.trim().toLowerCase();
}

export function isEmail(invoer: string): boolean {
  const adres = normaliseerEmail(invoer);
  if (adres.length === 0 || adres.length > 254) return false;
  return /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(adres);
}

/**
 * Acht tekens voor een ouder, waar een kind er zes mag (ADR-155).
 *
 * Het verschil is geen slordigheid. Het wachtwoord van een kind opent één
 * omgeving en zit achter een inlogcode die er óók bij moet; dat van een ouder
 * opent alles van al zijn kinderen en zit achter een adres dat iedereen kan
 * raden. En waar acht tekens voor een achtjarige een eis is die de ouder
 * omzeilt, is het voor die ouder zelf gewoon te doen.
 */
export const WACHTWOORD_MINIMUM = 8;

export function wachtwoordKort(wachtwoord: string): boolean {
  return wachtwoord.length < WACHTWOORD_MINIMUM;
}

/** Wat er aan de invoer mankeert, vóór er iets de deur uit gaat. */
export function invoerFout(email: string, wachtwoord: string): AccountFout | null {
  if (normaliseerEmail(email).length === 0 || wachtwoord.length === 0) return 'leeg';
  if (!isEmail(email)) return 'geen-email';
  return null;
}

/**
 * Hoeveel eerder dan het einde er ververst wordt.
 *
 * Een minuut: lang genoeg dat een verzoek dat net begonnen is niet halverwege
 * zijn geldigheid verliest, kort genoeg om niet elke keer te verversen.
 */
export const VERVERS_MARGE_MS = 60_000;

export function moetVernieuwen(sessie: Sessie, now: Date): boolean {
  const einde = new Date(sessie.verlooptOp).getTime();
  if (Number.isNaN(einde)) return true;
  return einde - now.getTime() <= VERVERS_MARGE_MS;
}

/** Wanneer een token dat `seconden` meegaat, verloopt. */
export function verlooptOp(seconden: number, now: Date): string {
  return new Date(now.getTime() + seconden * 1000).toISOString();
}

/**
 * Wat Supabase zei, in één woord.
 *
 * De statuscode alleen is niet genoeg: een 400 is zowel "dit wachtwoord klopt
 * niet" als "bevestig eerst je e-mail", en dat zijn voor een ouder twee heel
 * verschillende dingen om te lezen. Dus wordt er ook naar de foutcode gekeken,
 * en waar die ontbreekt naar de tekst — die laatste is van Supabase en kan
 * veranderen, dus hij is de laatste stap en niet de eerste.
 */
export function foutVanAntwoord(status: number, code: string, tekst: string): AccountFout {
  if (status === 429) return 'te-vaak';
  if (status >= 500) return 'geen-verbinding';

  const bekend = `${code} ${tekst}`.toLowerCase();
  if (bekend.includes('email_not_confirmed') || bekend.includes('not confirmed')) {
    return 'bevestig-email';
  }
  if (bekend.includes('user_already_exists') || bekend.includes('already registered')) {
    return 'bestaat-al';
  }
  if (bekend.includes('weak_password') || bekend.includes('password should be')) return 'te-kort';
  if (bekend.includes('over_email_send_rate_limit') || bekend.includes('rate limit')) {
    return 'te-vaak';
  }
  return 'onjuist';
}
