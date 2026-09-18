/**
 * Inloggen als kind: een code en een wachtwoord, en verder niets (ADR-155).
 *
 * Alles hier is puur. Wat de buitenwereld doet gaat via `Diensten` naar binnen,
 * zodat `inloggen.test.ts` elke uitkomst kan naspelen zonder database en zonder
 * Supabase. `index.ts` is het enige bestand dat Deno echt aanraakt.
 *
 * **Er is geen antwoord dat vertelt of een code bestaat.** Een onbekende code en
 * een fout wachtwoord geven hetzelfde `onjuist` terug. Dat is de helft van het
 * werk; de andere helft is de tijd. Een onbekende code is namelijk sneller klaar
 * dan een fout wachtwoord — geen hash om te controleren — en dat verschil is op
 * zichzelf een antwoord. Daarom duurt élk mislukt verzoek even lang, gemeten
 * vanaf het begin (`MINIMUM_MS`).
 *
 * **De begrenzer telt per code en per IP**, niet per apparaat. Het apparaatnummer
 * waar ADR-116 op telt, verzint de client zelf: goed genoeg voor een premiumslot,
 * en het verkeerde ding om bij inloggen op te tellen, want wie codes wil aflopen
 * verzint elke keer een nieuw nummer.
 */

import { adresVoorKind, isCode, normaliseerCode } from '../_gezin/code.ts';

/** Hoe lang een mislukt verzoek minstens duurt, zodat de tijd niets verraadt. */
export const MINIMUM_MS = 600;

export interface Sessie {
  readonly access_token: string;
  readonly refresh_token: string;
  readonly expires_in: number;
  readonly token_type: string;
}

export type InlogFout =
  /** De code en het wachtwoord horen niet bij elkaar — of de code bestaat niet. */
  | 'onjuist'
  /** Te vaak geprobeerd, op deze code of vanaf dit adres. */
  | 'te-vaak'
  /** Er is niets ingevuld. */
  | 'leeg'
  /** Supabase antwoordde niet zoals het hoort. */
  | 'storing';

export type Uitkomst =
  | { readonly ok: true; readonly sessie: Sessie }
  | { readonly ok: false; readonly reden: InlogFout };

export interface Diensten {
  /** Mag er nog geprobeerd worden op deze code en vanaf dit adres? */
  readonly magInloggen: (codeHash: string, ipHash: string) => Promise<boolean>;
  readonly meldMislukt: (codeHash: string, ipHash: string) => Promise<void>;
  /** De code omzetten in een kind-id, of niets. */
  readonly kindVoorCode: (code: string) => Promise<string | null>;
  /** Het wachtwoord laten controleren door Supabase zelf. */
  readonly inloggenMetWachtwoord: (adres: string, wachtwoord: string) => Promise<Sessie | null>;
  /** De digest die in de begrenzer terechtkomt: met een peper, nooit kaal. */
  readonly digest: (waarde: string) => Promise<string>;
  readonly nu: () => number;
  readonly wacht: (ms: number) => Promise<void>;
}

export interface Invoer {
  readonly code: unknown;
  readonly wachtwoord: unknown;
  /** Het adres waar het verzoek vandaan komt; leeg als de omgeving het niet zegt. */
  readonly ip: string;
}

function tekst(waarde: unknown): string {
  return typeof waarde === 'string' ? waarde : '';
}

export async function inloggen(invoer: Invoer, diensten: Diensten): Promise<Uitkomst> {
  const begin = diensten.nu();

  // Alles wat misgaat, gaat hierlangs naar buiten, zodat er maar één plek is
  // waar de klok gelijkgetrokken wordt en niemand er eentje kan vergeten.
  const mislukt = async (reden: InlogFout): Promise<Uitkomst> => {
    const verstreken = diensten.nu() - begin;
    if (verstreken < MINIMUM_MS) await diensten.wacht(MINIMUM_MS - verstreken);
    return { ok: false, reden };
  };

  const ruwe = tekst(invoer.code);
  const wachtwoord = tekst(invoer.wachtwoord);
  if (ruwe.trim().length === 0 || wachtwoord.length === 0) return mislukt('leeg');

  const code = normaliseerCode(ruwe);
  const [codeHash, ipHash] = await Promise.all([
    diensten.digest(`code:${code}`),
    diensten.digest(`ip:${invoer.ip}`),
  ]);

  if (!(await diensten.magInloggen(codeHash, ipHash))) return mislukt('te-vaak');

  // Een code die niet eens de vorm heeft, wordt niet opgezocht maar telt wél mee
  // in de begrenzer: anders is een script dat rommel stuurt gratis.
  if (!isCode(code)) {
    await diensten.meldMislukt(codeHash, ipHash);
    return mislukt('onjuist');
  }

  const kindId = await diensten.kindVoorCode(code);
  if (kindId === null) {
    await diensten.meldMislukt(codeHash, ipHash);
    return mislukt('onjuist');
  }

  let sessie: Sessie | null;
  try {
    sessie = await diensten.inloggenMetWachtwoord(adresVoorKind(kindId), wachtwoord);
  } catch {
    // Een storing is geen mislukte poging: anders sluit een haperende Supabase
    // een kind een uur lang buiten om iets waar het niets aan kon doen.
    return mislukt('storing');
  }

  if (sessie === null) {
    await diensten.meldMislukt(codeHash, ipHash);
    return mislukt('onjuist');
  }

  return { ok: true, sessie };
}
