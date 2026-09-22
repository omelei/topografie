/**
 * `kind-inloggen` als edge function (ADR-155).
 *
 * De enige deur waarlangs een kind naar binnen komt. Eén ingang:
 *
 *   POST /kind-inloggen   { code, wachtwoord }   → { sessie } of { fout }
 *
 * Alles wat een beslissing is staat in `inloggen.ts` en wordt daar getest; hier
 * staat alleen hoe die beslissingen aan Deno, Supabase en het net hangen.
 *
 * Waarom dit niet rechtstreeks vanuit de app naar Supabase gaat: dan zou de
 * begrenzer te omzeilen zijn door het adres van het kind zelf samen te stellen.
 * Dat kan niet, want dat adres komt uit de id en niet uit de code — en die id
 * staat achter deze functie.
 */

import { leesAntwoord } from '../_gezin/antwoord.ts';
import { inloggen, type Diensten, type Sessie } from './inloggen.ts';

function nodig(naam: string): string {
  const waarde = Deno.env.get(naam);
  if (waarde === undefined || waarde === '') {
    throw new Error(`De omgevingsvariabele ${naam} ontbreekt.`);
  }
  return waarde;
}

function cors(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': Deno.env.get('GEZIN_HERKOMST') ?? '*',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

function antwoord(inhoud: unknown, status = 200): Response {
  return new Response(JSON.stringify(inhoud), {
    status,
    headers: { ...cors(), 'content-type': 'application/json' },
  });
}

/** Een digest met een peper erin. Zonder peper is een IPv4-adres in seconden terug te rekenen. */
async function digest(waarde: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${nodig('GEZIN_PEPER')}:${waarde}`);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function rpc(naam: string, body: unknown): Promise<unknown> {
  const reactie = await fetch(`${nodig('SUPABASE_URL')}/rest/v1/rpc/${naam}`, {
    method: 'POST',
    headers: {
      apikey: nodig('SUPABASE_SERVICE_ROLE_KEY'),
      authorization: `Bearer ${nodig('SUPABASE_SERVICE_ROLE_KEY')}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return leesAntwoord(reactie, naam);
}

/**
 * Het wachtwoord laten controleren door Supabase zelf.
 *
 * Een 400 is "klopt niet" en geen storing — dat is precies het onderscheid dat
 * `inloggen.ts` nodig heeft om te weten of het een poging moet aanrekenen.
 */
async function inloggenMetWachtwoord(adres: string, wachtwoord: string): Promise<Sessie | null> {
  const reactie = await fetch(`${nodig('SUPABASE_URL')}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: nodig('SUPABASE_SERVICE_ROLE_KEY'), 'content-type': 'application/json' },
    body: JSON.stringify({ email: adres, password: wachtwoord }),
  });
  if (reactie.status === 400) return null;
  if (!reactie.ok) throw new Error(`inloggen gaf ${reactie.status}`);
  return (await reactie.json()) as Sessie;
}

/** Het adres van de bezoeker, zoals de rand van Supabase het meegeeft. */
function afzender(verzoek: Request): string {
  const doorgegeven = verzoek.headers.get('x-forwarded-for') ?? '';
  return doorgegeven.split(',')[0]?.trim() || 'onbekend';
}

const diensten: Diensten = {
  magInloggen: async (codeHash, ipHash) =>
    (await rpc('gezin_inlog_mag', { p_code_hash: codeHash, p_ip_hash: ipHash })) === true,
  meldMislukt: async (codeHash, ipHash) => {
    await rpc('gezin_inlog_mislukt', { p_code_hash: codeHash, p_ip_hash: ipHash });
  },
  kindVoorCode: async (code) => {
    const uitkomst = await rpc('gezin_kind_voor_code', { p_code: code });
    return typeof uitkomst === 'string' ? uitkomst : null;
  },
  inloggenMetWachtwoord,
  digest,
  nu: () => Date.now(),
  wacht: (ms) => new Promise((klaar) => setTimeout(klaar, ms)),
};

Deno.serve(async (verzoek: Request): Promise<Response> => {
  if (verzoek.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors() });
  if (verzoek.method !== 'POST') return antwoord({ fout: 'methode' }, 405);

  let inhoud: Record<string, unknown>;
  try {
    inhoud = (await verzoek.json()) as Record<string, unknown>;
  } catch {
    return antwoord({ fout: 'leeg' }, 400);
  }

  const uitkomst = await inloggen(
    { code: inhoud.code, wachtwoord: inhoud.wachtwoord, ip: afzender(verzoek) },
    diensten,
  );

  // Een mislukte inlog is 200 en geen 401: er valt niets te herhalen met andere
  // koppen, en een 401 laat een browser om een wachtwoord vragen op een plek
  // waar dit product zijn eigen scherm heeft.
  if (!uitkomst.ok) return antwoord({ fout: uitkomst.reden });
  return antwoord({ sessie: uitkomst.sessie });
});
