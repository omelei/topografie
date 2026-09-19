/**
 * Waar het gezinsproject staat, volgens deze bouw (ADR-155, ADR-157).
 *
 * Apart, en niet in `supabaseAccount.ts`, omdat het op twee momenten nodig is:
 * meteen, om te weten óf er ingelogd kan worden, en later, om ergens heen te
 * praten. Het eerste mag de hele accountlaag niet meeslepen — dat is de reden
 * dat `index.ts` bijna leeg is — en het tweede hoort niet zijn eigen waarheid
 * over hetzelfde te hebben.
 */

/**
 * Het adres en de publieke sleutel, gezet bij de build. Een bouw zonder die
 * twee heeft niets om in te loggen en zegt dat, in plaats van stuk te gaan —
 * dezelfde vorm als `server()` voor premium (ADR-116).
 */
export function server(): { readonly url: string; readonly sleutel: string } | null {
  const url = String(import.meta.env.VITE_GEZIN_URL ?? '').replace(/\/+$/, '');
  const sleutel = String(import.meta.env.VITE_GEZIN_KEY ?? '');
  return url === '' || sleutel === '' ? null : { url, sleutel };
}

/**
 * Of deze bouw een account heeft om mee te praten.
 *
 * Dezelfde vorm als `isTeKoop` voor premium (ADR-116): zonder adres en sleutel
 * staat er één regel in plaats van een formulier dat nergens heen gaat.
 *
 * Met opzet niet achter `features.accounts` in `config/brand.ts`. Die vlag
 * belooft volgens zijn eigen commentaar dat de code erachter áf is, en dat is
 * dit pas na F7. En wat een bouw wél of niet kan, hangt hier niet aan een
 * constante maar aan twee variabelen die per omgeving verschillen: leeg in CI,
 * een adres dat niet bestaat in de e2e-bouw, en het echte in productie.
 */
export function isIngesteld(): boolean {
  return server() !== null;
}
