import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Pakket } from './pakket';
import { PER_BLADZIJDE, PER_VERZOEK, vervoer } from './vervoer';

/**
 * Het transport naar het gezinsproject (ADR-187), tegen een nagemaakte `fetch`.
 * Wat hier vastligt: de volgorde van de tabellen, hoe een botsing behandeld
 * wordt, het opknippen in stukken, en dat een fout stopt in plaats van
 * doorloopt.
 */

const LEEG: Pakket = { sessies: [], pogingen: [], voortgang: [], diplomas: [], instellingen: [] };

type Verzoek = { url: string; init: RequestInit };

function nepFetch(status: (verzoek: Verzoek) => number = () => 201, inhoud: unknown = null) {
  const verzoeken: Verzoek[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit) => {
      verzoeken.push({ url, init });
      const code = status({ url, init });
      return new Response(inhoud === null ? null : JSON.stringify(inhoud), { status: code });
    }),
  );
  return verzoeken;
}

beforeEach(() => {
  vi.stubEnv('VITE_GEZIN_URL', 'https://gezin.test');
  vi.stubEnv('VITE_GEZIN_KEY', 'sb_publishable_x');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('versturen', () => {
  it('stuurt de sessies vóór de pogingen, en slaat een botsing daar over', async () => {
    const verzoeken = nepFetch();
    const pakket: Pakket = {
      ...LEEG,
      sessies: [{ id: 's' } as never],
      pogingen: [{ id: 'p' } as never],
      voortgang: [{ item_id: 'x' } as never],
      diplomas: [{ badge_id: 'd' } as never],
      instellingen: [{ sleutel: 'weekdoel' } as never],
    };

    expect(await vervoer.stuur('token-ouder', pakket)).toEqual({ ok: true, waarde: null });
    expect(verzoeken.map((v) => v.url)).toEqual([
      'https://gezin.test/rest/v1/sessies',
      'https://gezin.test/rest/v1/pogingen',
      'https://gezin.test/rest/v1/voortgang',
      'https://gezin.test/rest/v1/kind_diplomas',
      'https://gezin.test/rest/v1/instellingen',
    ]);
    const prefer = verzoeken.map((v) => (v.init.headers as Record<string, string>).Prefer);
    expect(prefer.slice(0, 2)).toEqual([
      'resolution=ignore-duplicates,return=minimal',
      'resolution=ignore-duplicates,return=minimal',
    ]);
    expect(prefer[2]).toBe('resolution=merge-duplicates,return=minimal');
    expect((verzoeken[0]?.init.headers as Record<string, string>).Authorization).toBe(
      'Bearer token-ouder',
    );
  });

  it('slaat een lege tabel over', async () => {
    const verzoeken = nepFetch();
    await vervoer.stuur('t', LEEG);
    expect(verzoeken).toHaveLength(0);
  });

  it('knipt een grote tabel in stukken', async () => {
    const verzoeken = nepFetch();
    const pogingen = Array.from({ length: PER_VERZOEK * 2 + 1 }, (_, i) => ({ id: `p${i}` }));
    await vervoer.stuur('t', { ...LEEG, pogingen: pogingen as never });
    expect(verzoeken).toHaveLength(3);
    expect(JSON.parse(String(verzoeken[2]?.init.body))).toHaveLength(1);
  });

  it('stopt bij de eerste fout, en zegt wat voor fout', async () => {
    const verzoeken = nepFetch(() => 401);
    const pakket = { ...LEEG, sessies: [{} as never], pogingen: [{} as never] };
    expect(await vervoer.stuur('t', pakket)).toEqual({ ok: false, reden: 'geweigerd' });
    expect(verzoeken).toHaveLength(1);

    nepFetch(() => 503);
    expect(await vervoer.stuur('t', pakket)).toEqual({ ok: false, reden: 'geen-verbinding' });
  });

  it('noemt geen verbinding geen verbinding', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    );
    expect(await vervoer.stuur('t', { ...LEEG, sessies: [{} as never] })).toEqual({
      ok: false,
      reden: 'geen-verbinding',
    });
  });
});

describe('opnemen en weghalen', () => {
  it('neemt een kind op langs kind-beheer, zonder wachtwoord', async () => {
    const verzoeken = nepFetch(() => 200, {
      kind: { id: 'server-noor', voornaam: 'Noor', inlogcode: 'ABCD2345' },
    });
    expect(await vervoer.neemOp('t', { voornaam: 'Noor', groep: 5 })).toEqual({
      ok: true,
      waarde: { id: 'server-noor', voornaam: 'Noor', inlogcode: 'ABCD2345', groep: null },
    });
    expect(verzoeken[0]?.url).toBe('https://gezin.test/functions/v1/kind-beheer');
    expect(JSON.parse(String(verzoeken[0]?.init.body))).toEqual({
      actie: 'opnemen',
      voornaam: 'Noor',
      groep: 5,
    });
  });

  it('haalt een kind weg langs kind-beheer', async () => {
    const verzoeken = nepFetch(() => 200, { ok: true });
    expect(await vervoer.haalWeg('t', 'server-noor')).toEqual({ ok: true, waarde: null });
    expect(JSON.parse(String(verzoeken[0]?.init.body))).toEqual({
      actie: 'verwijderen',
      kindId: 'server-noor',
    });
  });

  it('leest de kinderen in het account', async () => {
    nepFetch(() => 200, [{ id: 'a', voornaam: 'Noor', inlogcode: 'ABCD2345' }, { rommel: true }]);
    expect(await vervoer.kinderen('t')).toEqual({
      ok: true,
      waarde: [{ id: 'a', voornaam: 'Noor', inlogcode: 'ABCD2345', groep: null }],
    });
  });

  it('doet niets op een bouw zonder gezinsproject', async () => {
    vi.stubEnv('VITE_GEZIN_URL', '');
    const verzoeken = nepFetch();
    expect(await vervoer.kinderen('t')).toEqual({ ok: false, reden: 'niet-ingesteld' });
    expect(verzoeken).toHaveLength(0);
  });
});

describe('ophalen', () => {
  it('haalt per tabel alles van één kind, op volgorde', async () => {
    const verzoeken = nepFetch(() => 200, []);
    const uit = await vervoer.haal('t', 'server-noor');
    expect(uit).toEqual({
      ok: true,
      waarde: { voortgang: [], sessies: [], pogingen: [], diplomas: [], instellingen: [] },
    });
    expect(verzoeken.map((v) => new URL(v.url).pathname)).toEqual([
      '/rest/v1/voortgang',
      '/rest/v1/sessies',
      '/rest/v1/pogingen',
      '/rest/v1/kind_diplomas',
      '/rest/v1/instellingen',
    ]);
    const eerste = new URL(verzoeken[0]?.url ?? '');
    expect(eerste.searchParams.get('kind_id')).toBe('eq.server-noor');
    expect(eerste.searchParams.get('laatste_review')).toBeNull();
  });

  it('haalt sinds een moment, en pogingen twee uur eerder', async () => {
    const verzoeken = nepFetch(() => 200, []);
    await vervoer.haal('t', 'k', '2026-09-22T12:00:00.000Z');
    const url = (i: number) => new URL(verzoeken[i]?.url ?? '');
    expect(url(0).searchParams.get('laatste_review')).toBe('gte.2026-09-22T12:00:00.000Z');
    expect(url(1).searchParams.get('geeindigd')).toBe('gte.2026-09-22T12:00:00.000Z');
    expect(url(2).searchParams.get('tijdstip')).toBe('gte.2026-09-22T10:00:00.000Z');
  });

  it('bladert door tot er minder dan een volle bladzijde komt', async () => {
    let keer = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const pad = new URL(url).pathname;
        const vol = pad === '/rest/v1/pogingen' && keer++ < 2;
        const rijen = Array.from({ length: vol ? PER_BLADZIJDE : 3 }, (_, i) => ({
          id: `${keer}-${i}`,
        }));
        return new Response(JSON.stringify(rijen), { status: 200 });
      }),
    );
    const uit = await vervoer.haal('t', 'k');
    expect(uit.ok && uit.waarde.pogingen).toHaveLength(PER_BLADZIJDE * 2 + 3);
  });
});
