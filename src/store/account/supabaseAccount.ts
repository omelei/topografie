/**
 * Het account van een ouder, tegen Supabase (ADR-155, ADR-156).
 *
 * Met kale `fetch`, zoals `store/premium.ts` het al doet, en dus zónder
 * `@supabase/supabase-js`. Dat is niet alleen zuinig maar nodig: de shell van
 * 300 kB mag niet groeien voor een kind dat nooit inlogt, en
 * `tools/report-bundle-size.mjs` telt élk bestand in `dist/assets` op — een lui
 * geladen brok zou daar gewoon in meetellen. Zonder bibliotheek is er niets om
 * uit te zonderen.
 *
 * Dit bestand wordt zelf lui geladen, vanuit `index.ts`. Wie nooit op "Voor
 * ouders" komt, downloadt het niet.
 *
 * **Niets hiervan is in CI bewezen.** Er is geen project en er zijn geen
 * sleutels; wat hier staat draait pas echt tegen een dashboard dat iemand met
 * de hand heeft ingericht (`docs/SUPABASE.md`).
 */

import { leesSessie, schrijfSessie } from './bewaren';
import {
  foutVanAntwoord,
  invoerFout,
  moetVernieuwen,
  normaliseerEmail,
  verlooptOp,
} from './oordeel';
import { isIngesteld, server } from './omgeving';
import type { Account, AccountUitkomst, Sessie } from './types';

/** Zoals `sleutelKoppen` in premium.ts: een oude anon key (`eyJ…`) wil er ook een Bearer bij. */
function koppen(sleutel: string, token?: string): Record<string, string> {
  const uit: Record<string, string> = { 'Content-Type': 'application/json', apikey: sleutel };
  const bearer = token ?? (sleutel.startsWith('eyJ') ? sleutel : '');
  if (bearer !== '') uit.Authorization = `Bearer ${bearer}`;
  return uit;
}

interface RuweSessie {
  readonly access_token?: unknown;
  readonly refresh_token?: unknown;
  readonly expires_in?: unknown;
  readonly user?: { readonly id?: unknown; readonly email?: unknown } | null;
}

/**
 * Wat Supabase teruggeeft, als sessie — of niets.
 *
 * Niets betekent hier iets echts en is geen defensief gebaar: bij aanmelden met
 * bevestiging per mail antwoordt Supabase met een gebruiker en zónder tokens.
 */
function alsSessie(ruw: unknown, now: Date): Sessie | null {
  const s = ruw as RuweSessie | null;
  if (
    typeof s?.access_token !== 'string' ||
    typeof s.refresh_token !== 'string' ||
    typeof s.expires_in !== 'number' ||
    typeof s.user?.id !== 'string'
  ) {
    return null;
  }
  return {
    gebruikerId: s.user.id,
    email: typeof s.user.email === 'string' ? s.user.email : '',
    token: s.access_token,
    vernieuwToken: s.refresh_token,
    verlooptOp: verlooptOp(s.expires_in, now),
  };
}

function tekstVeld(bron: unknown, naam: string): string {
  if (bron === null || typeof bron !== 'object') return '';
  const waarde = (bron as Record<string, unknown>)[naam];
  return typeof waarde === 'string' ? waarde : '';
}

async function praat(
  pad: string,
  body: unknown,
  token?: string,
): Promise<{ readonly status: number; readonly inhoud: unknown } | null> {
  const doel = server();
  if (doel === null) return null;
  try {
    const reactie = await fetch(`${doel.url}${pad}`, {
      method: 'POST',
      headers: koppen(doel.sleutel, token),
      body: JSON.stringify(body),
    });
    const inhoud: unknown = await reactie.json().catch(() => null);
    return { status: reactie.status, inhoud };
  } catch {
    // Geen verbinding. Dat is iets anders dan een fout wachtwoord, en de ouder
    // hoort het verschil te lezen.
    return null;
  }
}

async function metWachtwoord(
  pad: string,
  email: string,
  wachtwoord: string,
  now: Date,
): Promise<AccountUitkomst> {
  const fout = invoerFout(email, wachtwoord);
  if (fout !== null) return { ok: false, reden: fout };
  if (!isIngesteld()) return { ok: false, reden: 'niet-ingesteld' };

  const antwoord = await praat(pad, { email: normaliseerEmail(email), password: wachtwoord });
  if (antwoord === null) return { ok: false, reden: 'geen-verbinding' };

  if (antwoord.status >= 400) {
    const code = tekstVeld(antwoord.inhoud, 'error_code') || tekstVeld(antwoord.inhoud, 'error');
    const tekst =
      tekstVeld(antwoord.inhoud, 'msg') ||
      tekstVeld(antwoord.inhoud, 'message') ||
      tekstVeld(antwoord.inhoud, 'error_description');
    return { ok: false, reden: foutVanAntwoord(antwoord.status, code, tekst) };
  }

  const sessie = alsSessie(antwoord.inhoud, now);
  if (sessie !== null) schrijfSessie(sessie);
  return { ok: true, sessie };
}

/**
 * De sessie verversen. Lukt dat niet, dan is hij weg en niet stuk.
 *
 * Een geweigerd vernieuwtoken betekent dat de sessie aan de andere kant is
 * ingetrokken — na een nieuw wachtwoord bijvoorbeeld, wat `kind-beheer` met
 * opzet doet. Dan is uitloggen het juiste antwoord en niet blijven proberen.
 */
async function vernieuw(sessie: Sessie, now: Date): Promise<Sessie | null> {
  const antwoord = await praat('/auth/v1/token?grant_type=refresh_token', {
    refresh_token: sessie.vernieuwToken,
  });
  if (antwoord === null) {
    // Geen verbinding: de sessie blijft staan, zodat een tunnel of een
    // schoolwifi niemand uitlogt. Het token is dan wel te oud om iets mee te
    // doen, en de aanroeper merkt dat aan het verzoek dat erop volgt.
    return sessie;
  }
  if (antwoord.status >= 400) {
    schrijfSessie(null);
    return null;
  }
  const nieuw = alsSessie(antwoord.inhoud, now);
  if (nieuw === null) {
    schrijfSessie(null);
    return null;
  }
  schrijfSessie(nieuw);
  return nieuw;
}

export const supabaseAccount: Account = {
  aanmelden: (email, wachtwoord) => metWachtwoord('/auth/v1/signup', email, wachtwoord, new Date()),

  inloggen: (email, wachtwoord) =>
    metWachtwoord('/auth/v1/token?grant_type=password', email, wachtwoord, new Date()),

  uitloggen: async () => {
    const sessie = leesSessie();
    // Eerst hier weg, dan pas aan de server vertellen. Andersom zou een
    // mislukt verzoek iemand ingelogd laten die op uitloggen heeft gedrukt, en
    // dat is de ene kant op waar het niet fout mag gaan.
    schrijfSessie(null);
    if (sessie !== null) await praat('/auth/v1/logout', {}, sessie.token);
  },

  sessie: async (now = new Date()) => {
    const bewaard = leesSessie();
    if (bewaard === null) return null;
    if (!moetVernieuwen(bewaard, now)) return bewaard;
    return vernieuw(bewaard, now);
  },
};
