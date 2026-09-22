/**
 * Het lijf van een antwoord van PostgREST lezen (ADR-155).
 *
 * Eén regel maakt dit de moeite van een eigen bestand waard, en die regel is
 * duur betaald: **PostgREST antwoordt op een functie die `void` teruggeeft met
 * 204 en een leeg lijf**, en `Response.json()` gooit daarop `Unexpected end of
 * JSON input`. Dat is geen randgeval maar het gewone antwoord van
 * `gezin_inlog_mislukt`, die niets anders doet dan een rij bijschrijven.
 *
 * `kind-beheer` wist dat en `kind-inloggen` niet, want ze hadden elk hun eigen
 * kopie van dezelfde vier regels. Gevolg: elke mislukte inlog gaf 500 in plaats
 * van "dat klopt niet" — de deur waarlangs een kind binnenkomt, kapot op precies
 * de plek waar een kind zich vergist.
 *
 * Daarom staat het hier, naast `code.ts`, om dezelfde reden als dat bestand: wat
 * twee functies allebei moeten weten, hoort op één plek te staan. Een opmerking
 * met "houd deze twee gelijk" zou hetzelfde nog eens laten gebeuren.
 */

export async function leesAntwoord(reactie: Response, wat: string): Promise<unknown> {
  if (!reactie.ok) throw new Error(`${wat} gaf ${reactie.status}`);
  if (reactie.status === 204 || reactie.headers.get('content-length') === '0') return null;
  return reactie.json();
}
