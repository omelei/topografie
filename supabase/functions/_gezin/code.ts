/**
 * De inlogcode en het wachtwoord van een kind (ADR-155).
 *
 * Gedeeld door de twee edge functions van het gezin, en puur: geen netwerk,
 * geen database, geen klok. De map heet `_gezin` met een liggend streepje
 * ervoor, want Supabase ziet zo'n map niet aan voor een function om te
 * publiceren.
 */

/**
 * Hetzelfde alfabet en dezelfde lengte als `tools/premium/maak-codes.mjs` en
 * `gezin_nieuwe_code()` in de migratie: zonder 0, O, 1, I en L, want dat zijn de
 * tekens die iemand van een scherm verkeerd overtypt. `code.test.ts` houdt deze
 * drie plekken gelijk.
 */
export const ALFABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const LENGTE = 8;

/** Wat een ouder voorleest: `KIND-XXXX-XXXX`. */
export const VOORVOEGSEL = 'KIND';

/**
 * Wat er ook getypt is, terug naar de acht tekens.
 *
 * Een kind van acht typt streepjes mee, of juist niet, en typt kleine letters.
 * Dat is geen fout die het verdient om te horen. Dezelfde normalisatie als
 * `premium_hash` in de database, met hetzelfde voorvoegsel-geval.
 */
export function normaliseerCode(invoer: string): string {
  const schoon = invoer.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (schoon.length === LENGTE + VOORVOEGSEL.length && schoon.startsWith(VOORVOEGSEL)) {
    return schoon.slice(VOORVOEGSEL.length);
  }
  return schoon;
}

export function isCode(invoer: string): boolean {
  const code = normaliseerCode(invoer);
  if (code.length !== LENGTE) return false;
  return [...code].every((teken) => ALFABET.includes(teken));
}

/** Hoe een code eruitziet als hij wordt voorgelezen. */
export function codeVoorMens(code: string): string {
  return `${VOORVOEGSEL}-${code.slice(0, 4)}-${code.slice(4)}`;
}

/**
 * Het adres waarmee een kind bij Supabase bekend staat.
 *
 * `.invalid` is bij RFC 2606 gereserveerd en lost nooit op, dus dit adres kan
 * bij constructie geen post ontvangen. Dat is het hele punt: "een kind heeft
 * geen e-mailadres" wordt er iets van dat te controleren is.
 *
 * Het komt uit de id en niet uit de inlogcode. Wie een code kent, kan daarmee
 * dus niet rechtstreeks bij de inlog van Supabase wachtwoorden gaan proberen —
 * de enige deur is `kind-inloggen`, en daar zit de begrenzer.
 */
export function adresVoorKind(kindId: string): string {
  return `${kindId}@kind.invalid`;
}

export const WACHTWOORD_MINIMUM = 6;

/**
 * De voor de hand liggende wachtwoorden, in het Nederlands en op een toetsenbord.
 *
 * Kort met opzet. Dit is geen woordenlijst die sterkte afdwingt — dat doet de
 * begrenzer — maar een muurtje tegen het allereerste dat iemand intikt.
 */
const TE_VOOR_DE_HAND = [
  '123456',
  '1234567',
  '12345678',
  'wachtwoord',
  'password',
  'qwerty',
  'geheim',
  'welkom',
  'leernu',
  'abcdef',
];

export type WachtwoordFout = 'te-kort' | 'te-simpel' | 'eigen-naam';

/**
 * Zes tekens, en verder niets.
 *
 * Geen hoofdletter, geen cijfer, geen leesteken. Een eis die een kind van acht
 * niet haalt, is een eis die de ouder omzeilt, en dan staat het wachtwoord met
 * stift op de iPad — dat is slechter dan zes tekens. De sterkte hoort hier ook
 * niet te zitten: die zit in de snelheidsbegrenzer, en in het feit dat de
 * inlogcode er óók bij moet.
 */
export function wachtwoordOordeel(wachtwoord: string, voornaam: string): WachtwoordFout | null {
  if (wachtwoord.length < WACHTWOORD_MINIMUM) return 'te-kort';
  const klein = wachtwoord.toLowerCase();
  if (TE_VOOR_DE_HAND.includes(klein)) return 'te-simpel';
  if (voornaam.trim().length > 0 && klein === voornaam.trim().toLowerCase()) return 'eigen-naam';
  return null;
}
