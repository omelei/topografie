/**
 * Wat de link uit een herstelmail meebrengt (ADR-186).
 *
 * Supabase stuurt wie op die link klikt terug naar de app, met de sessie achter
 * het hekje: `#access_token=…&refresh_token=…&expires_in=3600&type=recovery`.
 * Is de link verlopen of al gebruikt, dan staat er een fout:
 * `#error=access_denied&error_code=otp_expired&error_description=…`.
 *
 * Dit leest dat, zonder netwerk en zonder opslag, zodat het te toetsen is. Het
 * bewaart niets: de sessie wordt pas bewaard als het nieuwe wachtwoord gezet is
 * (`supabaseAccount.ts`).
 *
 * Alleen `type=recovery` wordt gelezen. De link in een bevestigingsmail brengt
 * ook een sessie mee (`type=signup`), en die blijft liggen zoals hij lag: de
 * ouder logt daarna gewoon in, en wie hier een tweede weg naar binnen opent,
 * opent hem ook voor een link die iemand anders heeft gemaakt.
 */

import { verlooptOp } from './oordeel';
import type { Sessie } from './types';

export type Terugkeer =
  /** Een geldige herstellink: kies een nieuw wachtwoord. */
  | { readonly soort: 'herstel'; readonly sessie: Sessie }
  /** Een link die verlopen is, al gebruikt, of niet te lezen. */
  | { readonly soort: 'verlopen' };

/** Het midden van een JWT, gelezen en niet gecontroleerd: dat doet de server bij gebruik. */
function inhoud(token: string): { readonly sub?: unknown; readonly email?: unknown } | null {
  const deel = token.split('.')[1];
  if (deel === undefined || deel === '') return null;
  try {
    const base64 = deel.replace(/-/g, '+').replace(/_/g, '/');
    const opgevuld = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const tekst = new TextDecoder().decode(Uint8Array.from(atob(opgevuld), (c) => c.charCodeAt(0)));
    const waarde: unknown = JSON.parse(tekst);
    return waarde !== null && typeof waarde === 'object' ? waarde : null;
  } catch {
    return null;
  }
}

export function leesTerugkeer(hash: string, now: Date): Terugkeer | null {
  if (!hash.startsWith('#') || hash.length < 2) return null;
  const velden = new URLSearchParams(hash.slice(1));

  if (velden.has('error_code') || velden.has('error_description')) return { soort: 'verlopen' };
  if (velden.get('type') !== 'recovery') return null;

  const token = velden.get('access_token') ?? '';
  const vernieuwToken = velden.get('refresh_token') ?? '';
  const seconden = Number(velden.get('expires_in'));
  const wie = inhoud(token);
  if (
    vernieuwToken === '' ||
    !Number.isFinite(seconden) ||
    seconden <= 0 ||
    typeof wie?.sub !== 'string' ||
    typeof wie.email !== 'string'
  ) {
    return { soort: 'verlopen' };
  }

  return {
    soort: 'herstel',
    sessie: {
      gebruikerId: wie.sub,
      email: wie.email,
      token,
      vernieuwToken,
      verlooptOp: verlooptOp(seconden, now),
    },
  };
}
