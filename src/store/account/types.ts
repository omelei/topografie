/**
 * Het account van een ouder, achter één interface (ADR-155).
 *
 * Alles wat de app van accounts weet, loopt hierlangs. Dat is niet netheid maar
 * de enige manier om dit te kunnen testen: er is geen Supabase-project in CI en
 * er zijn geen sleutels, dus draait alles tegen `nepAccount.ts`. Wie hier een
 * tweede weg omheen maakt, maakt iets dat nergens meer te controleren is.
 *
 * Het kind staat hier met opzet niet in. Dat is F3.
 */

export interface Sessie {
  readonly gebruikerId: string;
  /** Het adres waarmee de ouder inlogt. Van een kind staat hier nooit iets. */
  readonly email: string;
  readonly token: string;
  readonly vernieuwToken: string;
  /** Wanneer `token` niet meer geldig is, als ISO-moment. */
  readonly verlooptOp: string;
}

export type AccountFout =
  /** Er is niets ingevuld. */
  | 'leeg'
  /** Wat er staat is geen e-mailadres. */
  | 'geen-email'
  /** Het wachtwoord haalt de ondergrens niet. */
  | 'te-kort'
  /** Adres en wachtwoord horen niet bij elkaar — of het adres bestaat niet. */
  | 'onjuist'
  /** Er is al een account met dit adres. */
  | 'bestaat-al'
  /** Aangemeld, maar er moet eerst op een link in de mail geklikt worden. */
  | 'bevestig-email'
  /** Te vaak geprobeerd. */
  | 'te-vaak'
  /** Geen verbinding, of de server antwoordde niet. */
  | 'geen-verbinding'
  /** Deze build heeft geen adres en geen sleutel; er valt niets in te loggen. */
  | 'niet-ingesteld';

export type AccountUitkomst =
  /**
   * Gelukt. `sessie` is null als er nog niets te gebruiken valt: bij aanmelden
   * met bevestiging per mail is de ouder wél aangemaakt maar nog niet binnen.
   */
  | { readonly ok: true; readonly sessie: Sessie | null }
  | { readonly ok: false; readonly reden: AccountFout };

export interface Account {
  readonly aanmelden: (email: string, wachtwoord: string) => Promise<AccountUitkomst>;
  readonly inloggen: (email: string, wachtwoord: string) => Promise<AccountUitkomst>;
  readonly uitloggen: () => Promise<void>;
  /**
   * De sessie die er is, ververst als hij bijna om is; null als er niemand is
   * ingelogd. Elk scherm vraagt het hieraan en niemand leest de opslag zelf,
   * want dan zou het verversen op twee plekken moeten gebeuren.
   */
  readonly sessie: (now?: Date) => Promise<Sessie | null>;
}
