/**
 * `kind-beheer` als edge function (ADR-155).
 *
 * Wat een ouder met een kind doet, op één adres:
 *
 *   POST /kind-beheer   { actie: 'aanmaken', voornaam, wachtwoord, groep? }
 *   POST /kind-beheer   { actie: 'opnemen', voornaam, groep? }
 *   POST /kind-beheer   { actie: 'nieuwe-code', kindId }
 *   POST /kind-beheer   { actie: 'wachtwoord', kindId, wachtwoord }
 *   POST /kind-beheer   { actie: 'verwijderen', kindId }
 *
 * Altijd met het token van de ouder in `Authorization`. Alles wat een
 * beslissing is staat in `beheer.ts`; hier staat alleen hoe het aan Deno en
 * Supabase hangt.
 *
 * Deze functie heeft de service-sleutel nodig — een kind aanmaken is een
 * gebruiker aanmaken — en dus controleert ze zelf wat RLS anders gedaan had:
 * het token wordt bij Supabase nagevraagd, en bij elk kind wordt gekeken of het
 * van déze ouder is.
 */

import { leesAntwoord } from '../_gezin/antwoord.ts';
import { BeheerProbleem, behandel, type Diensten } from './beheer.ts';

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
    'Access-Control-Allow-Headers': 'content-type, authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

function antwoord(inhoud: unknown, status = 200): Response {
  return new Response(JSON.stringify(inhoud), {
    status,
    headers: { ...cors(), 'content-type': 'application/json' },
  });
}

function dienstKoppen(): Record<string, string> {
  const sleutel = nodig('SUPABASE_SERVICE_ROLE_KEY');
  return {
    apikey: sleutel,
    authorization: `Bearer ${sleutel}`,
    'content-type': 'application/json',
  };
}

interface Opties {
  readonly method?: string;
  readonly body?: string;
}

async function vanSupabase(pad: string, opties: Opties = {}): Promise<unknown> {
  const reactie = await fetch(`${nodig('SUPABASE_URL')}${pad}`, {
    ...opties,
    headers: dienstKoppen(),
  });
  return leesAntwoord(reactie, pad);
}

function veld(bron: unknown, naam: string): string | null {
  if (bron === null || typeof bron !== 'object') return null;
  const waarde = (bron as Record<string, unknown>)[naam];
  return typeof waarde === 'string' ? waarde : null;
}

const diensten: Diensten = {
  /**
   * Het token laten nakijken door Supabase zelf, en dan controleren dat het bij
   * een ouder hoort. Een kind heeft ook een geldig token, en dat mag hier niets.
   */
  ouderVoorToken: async (token) => {
    if (token.length === 0) return null;
    const reactie = await fetch(`${nodig('SUPABASE_URL')}/auth/v1/user`, {
      headers: { apikey: nodig('SUPABASE_SERVICE_ROLE_KEY'), authorization: `Bearer ${token}` },
    });
    if (!reactie.ok) return null;
    const id = veld(await reactie.json(), 'id');
    if (id === null) return null;
    const rijen = await vanSupabase(`/rest/v1/ouders?id=eq.${id}&select=id`);
    return Array.isArray(rijen) && rijen.length === 1 ? id : null;
  },

  // 24 willekeurige bytes als hex: 192 bits, en niemand die hem ooit ziet. Het
  // kind logt op zijn eigen apparaat in zonder wachtwoord (ADR-187); dit is
  // alleen wat Supabase nodig heeft om een gebruiker te kunnen maken.
  geheimWachtwoord: () =>
    Array.from(crypto.getRandomValues(new Uint8Array(24)), (byte) =>
      byte.toString(16).padStart(2, '0'),
    ).join(''),

  maakGebruiker: async (wachtwoord) => {
    // Een tijdelijk adres, omdat het echte uit de id komt en die er nog niet is.
    // Ook dit adres staat op `.invalid`, dus ook tussenin kan er geen post heen.
    const tijdelijk = `nieuw-${crypto.randomUUID()}@kind.invalid`;
    const gemaakt = await vanSupabase('/auth/v1/admin/users', {
      method: 'POST',
      body: JSON.stringify({ email: tijdelijk, password: wachtwoord, email_confirm: true }),
    });
    const id = veld(gemaakt, 'id');
    if (id === null) throw new Error('Supabase gaf geen id terug voor de nieuwe gebruiker.');
    return id;
  },

  zetAdres: async (gebruikerId, adres) => {
    await vanSupabase(`/auth/v1/admin/users/${gebruikerId}`, {
      method: 'PUT',
      body: JSON.stringify({ email: adres, email_confirm: true }),
    });
  },

  zetWachtwoord: async (gebruikerId, wachtwoord) => {
    await vanSupabase(`/auth/v1/admin/users/${gebruikerId}`, {
      method: 'PUT',
      body: JSON.stringify({ password: wachtwoord }),
    });
  },

  verwijderGebruiker: async (gebruikerId) => {
    await vanSupabase(`/auth/v1/admin/users/${gebruikerId}`, { method: 'DELETE' });
  },

  trekSessiesIn: async (gebruikerId) => {
    await vanSupabase(`/auth/v1/admin/users/${gebruikerId}/sessions`, { method: 'DELETE' });
  },

  bewaarKind: async (kind) => {
    await vanSupabase('/rest/v1/kinderen', {
      method: 'POST',
      body: JSON.stringify({
        id: kind.id,
        ouder_id: kind.ouderId,
        voornaam: kind.voornaam,
        groep: kind.groep,
        // Een plaatshouder die aan de vorm voldoet; `gezin_code_uitgeven`
        // vervangt hem meteen door een code die gegarandeerd vrij is.
        inlogcode: 'AAAAAAAA',
      }),
    });
  },

  codeUitgeven: async (kindId) => {
    const code = await vanSupabase('/rest/v1/rpc/gezin_code_uitgeven', {
      method: 'POST',
      body: JSON.stringify({ p_kind: kindId }),
    });
    if (typeof code !== 'string') throw new Error('gezin_code_uitgeven gaf geen code terug.');
    return code;
  },

  kind: async (kindId) => {
    const rijen = await vanSupabase(
      `/rest/v1/kinderen?id=eq.${encodeURIComponent(kindId)}&select=ouder_id,voornaam`,
    );
    if (!Array.isArray(rijen) || rijen.length !== 1) return null;
    const ouderId = veld(rijen[0], 'ouder_id');
    const voornaam = veld(rijen[0], 'voornaam');
    return ouderId === null || voornaam === null ? null : { ouderId, voornaam };
  },
};

Deno.serve(async (verzoek: Request): Promise<Response> => {
  if (verzoek.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors() });
  if (verzoek.method !== 'POST') return antwoord({ fout: 'methode' }, 405);

  let inhoud: Record<string, unknown>;
  try {
    inhoud = (await verzoek.json()) as Record<string, unknown>;
  } catch {
    return antwoord({ fout: 'onbekende-actie' }, 400);
  }

  const token = (verzoek.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');

  try {
    return antwoord(
      await behandel(
        {
          token,
          actie: inhoud.actie,
          kindId: inhoud.kindId,
          voornaam: inhoud.voornaam,
          wachtwoord: inhoud.wachtwoord,
          groep: inhoud.groep,
        },
        diensten,
      ),
    );
  } catch (fout) {
    if (fout instanceof BeheerProbleem) {
      return antwoord({ fout: fout.reden }, fout.reden === 'geen-ouder' ? 401 : 400);
    }
    throw fout;
  }
});
