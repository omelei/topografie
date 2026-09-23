/**
 * Het transport van het gezin naar de server (ADR-187).
 *
 * Kale `fetch`, zoals `supabaseAccount.ts` en `store/premium.ts` het doen, en
 * lui geladen: een kind dat nooit in een account komt, downloadt dit niet
 * (ADR-155, ADR-050).
 *
 * Twee soorten adres, met een reden. Een kind opnemen of weghalen maakt of
 * verwijdert een gebruiker, en daar is de service-sleutel voor nodig; dat gaat
 * dus langs `kind-beheer`. De rijen zelf gaan rechtstreeks naar de tabellen,
 * met het token van de ouder: de policy van `0001_gezin.sql` laat een ouder de
 * rijen van zijn eigen kinderen schrijven, en een edge function die dat nog eens
 * nadoet, zou een tweede plek zijn die het mis kan hebben.
 */

import { server } from '../account/omgeving';
import type { Pakket } from './pakket';

export type VervoerFout =
  /** Geen verbinding, of de server antwoordde niet. */
  | 'geen-verbinding'
  /** De server wilde niet: een verlopen token, of een rij die hij weigert. */
  | 'geweigerd'
  /** Deze bouw heeft geen gezinsproject. */
  | 'niet-ingesteld';

export type Uitkomst<T> =
  { readonly ok: true; readonly waarde: T } | { readonly ok: false; readonly reden: VervoerFout };

export interface ServerKind {
  readonly id: string;
  readonly voornaam: string;
  readonly inlogcode: string;
}

export interface Vervoer {
  readonly kinderen: (token: string) => Promise<Uitkomst<readonly ServerKind[]>>;
  readonly neemOp: (
    token: string,
    kind: { readonly voornaam: string; readonly groep: number | null },
  ) => Promise<Uitkomst<ServerKind>>;
  readonly haalWeg: (token: string, kindId: string) => Promise<Uitkomst<null>>;
  readonly stuur: (token: string, pakket: Pakket) => Promise<Uitkomst<null>>;
}

/**
 * Hoeveel rijen per verzoek. Een kind dat een jaar oefent, heeft duizenden
 * pogingen; in één verzoek wordt dat een lichaam van megabytes dat bij de
 * eerste hapering helemaal opnieuw moet.
 */
export const PER_VERZOEK = 500;

function koppen(sleutel: string, token: string, extra: Record<string, string> = {}) {
  return {
    'Content-Type': 'application/json',
    apikey: sleutel,
    Authorization: `Bearer ${token}`,
    ...extra,
  };
}

async function vraag(
  pad: string,
  token: string,
  init: { readonly method: string; readonly body?: unknown; readonly prefer?: string },
): Promise<Uitkomst<unknown>> {
  const doel = server();
  if (doel === null) return { ok: false, reden: 'niet-ingesteld' };
  try {
    const reactie = await fetch(`${doel.url}${pad}`, {
      method: init.method,
      headers: koppen(doel.sleutel, token, init.prefer ? { Prefer: init.prefer } : {}),
      body: init.body === undefined ? null : JSON.stringify(init.body),
    });
    if (reactie.status >= 500) return { ok: false, reden: 'geen-verbinding' };
    if (!reactie.ok) return { ok: false, reden: 'geweigerd' };
    const inhoud: unknown = await reactie.json().catch(() => null);
    return { ok: true, waarde: inhoud };
  } catch {
    return { ok: false, reden: 'geen-verbinding' };
  }
}

function alsKind(bron: unknown): ServerKind | null {
  if (bron === null || typeof bron !== 'object') return null;
  const { id, voornaam, inlogcode } = bron as Record<string, unknown>;
  if (typeof id !== 'string' || typeof voornaam !== 'string' || typeof inlogcode !== 'string') {
    return null;
  }
  return { id, voornaam, inlogcode };
}

/**
 * Hoe een tabel botsingen behandelt, en waarom niet overal hetzelfde.
 *
 * `pogingen` en `sessies` veranderen niet meer als ze eenmaal verstuurd zijn:
 * een botsing is dezelfde rij nog een keer, en die wordt overgeslagen. Voor
 * `pogingen` kan het ook niet anders, want die tabel kent geen `update`
 * (0001). De rest wordt bijgewerkt, zodat opnieuw versturen na een haperig
 * begin laat staan wat er nu op dit apparaat staat.
 *
 * Dit is de eerste keer versturen, voor een kind dat nieuw is in het account.
 * Samenvoegen met wat een ander apparaat al schreef — de regels per winkel van
 * ADR-155 — hoort bij het doorlopend synchroniseren en staat hier nog niet.
 */
const TABELLEN: readonly {
  readonly naam: string;
  readonly rijen: (pakket: Pakket) => readonly unknown[];
  readonly bij: 'ignore-duplicates' | 'merge-duplicates';
}[] = [
  // Eerst de sessies: elke poging wijst naar de zijne.
  { naam: 'sessies', rijen: (p) => p.sessies, bij: 'ignore-duplicates' },
  { naam: 'pogingen', rijen: (p) => p.pogingen, bij: 'ignore-duplicates' },
  { naam: 'voortgang', rijen: (p) => p.voortgang, bij: 'merge-duplicates' },
  { naam: 'kind_diplomas', rijen: (p) => p.diplomas, bij: 'merge-duplicates' },
  { naam: 'instellingen', rijen: (p) => p.instellingen, bij: 'merge-duplicates' },
];

export const vervoer: Vervoer = {
  kinderen: async (token) => {
    const antwoord = await vraag(
      '/rest/v1/kinderen?select=id,voornaam,inlogcode&order=created_at',
      token,
      {
        method: 'GET',
      },
    );
    if (!antwoord.ok) return antwoord;
    const lijst = Array.isArray(antwoord.waarde) ? antwoord.waarde : [];
    return {
      ok: true,
      waarde: lijst.map(alsKind).filter((kind): kind is ServerKind => kind !== null),
    };
  },

  neemOp: async (token, kind) => {
    const antwoord = await vraag('/functions/v1/kind-beheer', token, {
      method: 'POST',
      body: { actie: 'opnemen', voornaam: kind.voornaam, groep: kind.groep },
    });
    if (!antwoord.ok) return antwoord;
    const nieuw = alsKind((antwoord.waarde as { readonly kind?: unknown } | null)?.kind);
    return nieuw === null ? { ok: false, reden: 'geweigerd' } : { ok: true, waarde: nieuw };
  },

  haalWeg: async (token, kindId) => {
    const antwoord = await vraag('/functions/v1/kind-beheer', token, {
      method: 'POST',
      body: { actie: 'verwijderen', kindId },
    });
    return antwoord.ok ? { ok: true, waarde: null } : antwoord;
  },

  stuur: async (token, pakket) => {
    for (const tabel of TABELLEN) {
      const rijen = tabel.rijen(pakket);
      for (let van = 0; van < rijen.length; van += PER_VERZOEK) {
        const antwoord = await vraag(`/rest/v1/${tabel.naam}`, token, {
          method: 'POST',
          body: rijen.slice(van, van + PER_VERZOEK),
          prefer: `resolution=${tabel.bij},return=minimal`,
        });
        if (!antwoord.ok) return antwoord;
      }
    }
    return { ok: true, waarde: null };
  },
};
