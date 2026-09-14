/**
 * De kassa als edge function (ADR-123).
 *
 * Het enige bestand in dit project dat Mollie, de database en de mailer echt
 * aanraakt. Alles wat een beslissing is, staat in `kassa.ts` en wordt daar
 * getest; hier staat alleen hoe die beslissingen aan de buitenwereld hangen.
 *
 * Drie ingangen, op één adres:
 *
 *   POST ?actie=start     { email }        → { checkoutUrl }
 *   POST ?actie=webhook   id=tr_…          → 204, en Mollie is tevreden
 *   GET  ?actie=status&betaling=tr_…       → { status, code, geldigTot }
 *
 * De webhook heeft geen handtekening — die geeft Mollie niet — dus er wordt
 * niets geloofd van wat er in het verzoek staat. Het id gaat terug naar Mollie
 * en wat Mollie daarover zegt is het enige dat telt.
 */

import {
  KassaFout,
  leesStatus,
  startBestelling,
  verwerkWebhook,
  type Betaling,
  type Bestelling,
  type Diensten,
} from './kassa.ts';

const MOLLIE = 'https://api.mollie.com/v2';

function nodig(naam: string): string {
  const waarde = Deno.env.get(naam);
  if (waarde === undefined || waarde === '') {
    throw new Error(`De omgevingsvariabele ${naam} ontbreekt.`);
  }
  return waarde;
}

/** Alleen de kassapagina's mogen hierheen praten, en alleen vanaf het eigen adres. */
function cors(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': Deno.env.get('KASSA_HERKOMST') ?? '*',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };
}

function antwoord(inhoud: unknown, status = 200): Response {
  return new Response(JSON.stringify(inhoud), {
    status,
    headers: { ...cors(), 'content-type': 'application/json' },
  });
}

async function mollieVerzoek(
  pad: string,
  opties: RequestInit = {},
): Promise<Record<string, never>> {
  const antwoordVanMollie = await fetch(`${MOLLIE}${pad}`, {
    ...opties,
    headers: {
      ...opties.headers,
      authorization: `Bearer ${nodig('MOLLIE_SLEUTEL')}`,
      'content-type': 'application/json',
    },
  });
  const inhoud = (await antwoordVanMollie.json()) as Record<string, never>;
  if (!antwoordVanMollie.ok) {
    const detail = String((inhoud as { detail?: string }).detail ?? antwoordVanMollie.status);
    throw new KassaFout(502, `mollie: ${detail}`);
  }
  return inhoud;
}

/**
 * Het e-mailadres staat in de metadata van de betaling en niet in een tabel van
 * ons: Mollie moet het voor de transactie toch bewaren, en één plek is er één.
 */
function alsBetaling(ruw: Record<string, never>): Betaling {
  const metadata = (ruw as { metadata?: { email?: string } | null }).metadata ?? null;
  return {
    id: String((ruw as { id?: string }).id ?? ''),
    status: String((ruw as { status?: string }).status ?? ''),
    email: metadata?.email ?? null,
  };
}

/**
 * De database, via de drie functies uit `schema.sql`. De service-sleutel blijft
 * in de edge function en komt nooit in een app terecht; de functies erachter zijn
 * `security definer`, zodat er ook hier niet meer kan dan deze drie dingen.
 */
async function rpc(naam: string, argumenten: Record<string, unknown>): Promise<unknown> {
  const url = `${nodig('SUPABASE_URL')}/rest/v1/rpc/${naam}`;
  const sleutel = nodig('SUPABASE_SERVICE_ROLE_KEY');
  const antwoordVanDb = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: sleutel,
      authorization: `Bearer ${sleutel}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(argumenten),
  });
  if (!antwoordVanDb.ok) {
    throw new KassaFout(502, `database: ${antwoordVanDb.status} ${await antwoordVanDb.text()}`);
  }
  return antwoordVanDb.json();
}

function alsBestelling(ruw: unknown): Bestelling | null {
  if (ruw === null || typeof ruw !== 'object') return null;
  const rij = ruw as {
    nieuw?: boolean;
    code?: string | null;
    geldig_tot?: string;
    gemaild?: boolean;
  };
  if (typeof rij.geldig_tot !== 'string') return null;
  return {
    nieuw: rij.nieuw === true,
    code: typeof rij.code === 'string' ? rij.code : null,
    geldigTot: rij.geldig_tot,
    gemaild: rij.gemaild === true,
  };
}

/**
 * De mail, via Resend. Eén functie, zodat een andere verzender één verandering is:
 * wat de kassa ervan wil weten is of hij aankwam.
 */
async function stuurMail(input: {
  aan: string;
  onderwerp: string;
  tekst: string;
  html: string;
}): Promise<void> {
  const antwoordVanMailer = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${nodig('RESEND_SLEUTEL')}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: nodig('KASSA_AFZENDER'),
      to: [input.aan],
      subject: input.onderwerp,
      text: input.tekst,
      html: input.html,
    }),
  });
  if (!antwoordVanMailer.ok) {
    throw new KassaFout(502, `mail: ${antwoordVanMailer.status} ${await antwoordVanMailer.text()}`);
  }
}

function diensten(): Diensten {
  return {
    mollie: {
      async maakBetaling(input) {
        const ruw = await mollieVerzoek('/payments', {
          method: 'POST',
          body: JSON.stringify({
            amount: { currency: input.valuta, value: input.bedrag },
            description: input.omschrijving,
            redirectUrl: input.terugUrl,
            webhookUrl: input.webhookUrl,
            locale: 'nl_NL',
            metadata: { email: input.email },
          }),
        });
        const links = (ruw as { _links?: { checkout?: { href?: string } } })._links;
        const checkoutUrl = links?.checkout?.href;
        if (typeof checkoutUrl !== 'string') throw new KassaFout(502, 'mollie: geen checkout-url');
        return { id: String((ruw as { id?: string }).id ?? ''), checkoutUrl };
      },
      async leesBetaling(id) {
        return alsBetaling(await mollieVerzoek(`/payments/${encodeURIComponent(id)}`));
      },
    },
    db: {
      async legVast(input) {
        const rij = alsBestelling(
          await rpc('premium_bestelling_vastleggen', {
            p_betaling: input.betaling,
            p_code_hash: input.codeHash,
            p_code: input.code,
            p_geldig_tot: input.geldigTot,
          }),
        );
        if (rij === null) throw new KassaFout(502, 'database: geen bestelling terug');
        return rij;
      },
      async lees(betaling) {
        return alsBestelling(await rpc('premium_bestelling_lezen', { p_betaling: betaling }));
      },
      async noteerGemaild(betaling) {
        await rpc('premium_bestelling_gemaild', { p_betaling: betaling });
      },
    },
    mail: { stuur: stuurMail },
    nu: () => new Date(),
    willekeur: (lengte) => crypto.getRandomValues(new Uint8Array(lengte)),
    premiumUrl: nodig('KASSA_PREMIUM_URL'),
    terugUrl: nodig('KASSA_TERUG_URL'),
    webhookUrl: nodig('KASSA_WEBHOOK_URL'),
  };
}

Deno.serve(async (verzoek) => {
  if (verzoek.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors() });

  const adres = new URL(verzoek.url);
  const actie = adres.searchParams.get('actie');

  try {
    if (actie === 'start' && verzoek.method === 'POST') {
      const inhoud = (await verzoek.json()) as { email?: unknown };
      const uitkomst = await startBestelling(String(inhoud.email ?? ''), diensten());
      return antwoord(uitkomst);
    }

    if (actie === 'webhook' && verzoek.method === 'POST') {
      // Mollie post als formulier, niet als JSON, en verwacht een leeg antwoord.
      const velden = new URLSearchParams(await verzoek.text());
      await verwerkWebhook(velden.get('id') ?? '', diensten());
      return new Response(null, { status: 204 });
    }

    if (actie === 'status' && verzoek.method === 'GET') {
      const uitkomst = await leesStatus(adres.searchParams.get('betaling') ?? '', diensten());
      return antwoord(uitkomst);
    }

    return antwoord({ fout: 'onbekende-actie' }, 404);
  } catch (fout) {
    if (fout instanceof KassaFout) {
      // Een webhook die faalt moet falen: Mollie probeert het dan opnieuw, en dat
      // is precies wat een mail die niet aankwam nodig heeft.
      console.error(`kassa ${actie}: ${fout.reden}`);
      return antwoord({ fout: fout.reden }, fout.code);
    }
    console.error(`kassa ${actie}:`, fout);
    return antwoord({ fout: 'onbekend' }, 500);
  }
});
