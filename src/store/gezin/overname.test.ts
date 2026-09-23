import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProfileRecord } from '../db';
import type { Koppeling } from './koppeling';
import {
  gezinsstand,
  haalUitAccount,
  koppelAan,
  neemMee,
  verstuurOpnieuw,
  werkBij,
  zetKindHier,
  type OvernameDiensten,
} from './overname';
import type { Pakket } from './pakket';
import type { Vervoer } from './vervoer';

/**
 * De overname (ADR-187): een kind in het account zetten, de koppeling bewaren,
 * en dan versturen. Wat hier vastligt is dat elke stap te herhalen is zonder
 * dat er een tweede kind of een halve koppeling ontstaat.
 */

const opgeslagen = new Map<string, Koppeling>();

vi.mock('./koppeling', async (echt) => ({
  sindsVan: (await echt<typeof import('./koppeling')>()).sindsVan,
  leesKoppeling: async (lokaalId: string) => opgeslagen.get(lokaalId) ?? null,
  schrijfKoppeling: async (koppeling: Koppeling) => {
    opgeslagen.set(koppeling.lokaalId, koppeling);
  },
  vergeetKoppeling: async (lokaalId: string) => {
    opgeslagen.delete(lokaalId);
  },
  koppelingenVan: async (ouderId: string) =>
    [...opgeslagen.values()].filter((koppeling) => koppeling.ouderId === ouderId),
}));

const PAKKET: Pakket = { sessies: [], pogingen: [], voortgang: [], diplomas: [], instellingen: [] };
vi.mock('./pakket', () => ({ leesPakket: vi.fn(async () => PAKKET) }));

// Wat er op dit apparaat gezet wordt, en welke kinderen er hier bij komen.
const opApparaat = vi.hoisted(() => vi.fn(async () => undefined));
vi.mock('./ophalen', () => ({ zetOpApparaat: opApparaat }));
const nieuwHier = vi.hoisted(() => vi.fn());
vi.mock('../children', () => ({ createChild: nieuwHier }));

const NOOR = { id: 'me', naam: 'Noor', groep: 5, groepSchooljaar: 2026 } as ProfileRecord;
const NU = new Date('2026-09-23T12:00:00.000Z');

function diensten(vervoer: Partial<Vervoer> = {}, ouderId: string | null = 'ouder-1') {
  const echt: Vervoer = {
    kinderen: vi.fn(async () => ({ ok: true as const, waarde: [] })),
    neemOp: vi.fn(async () => ({
      ok: true as const,
      waarde: { id: 'server-noor', voornaam: 'Noor', inlogcode: 'ABCD2345', groep: null },
    })),
    haalWeg: vi.fn(async () => ({ ok: true as const, waarde: null })),
    stuur: vi.fn(async () => ({ ok: true as const, waarde: null })),
    haal: vi.fn(async () => ({
      ok: true as const,
      waarde: { voortgang: [], sessies: [], pogingen: [], diplomas: [], instellingen: [] },
    })),
    ...vervoer,
  };
  const d: OvernameDiensten = {
    vervoer: echt,
    ouder: async () => (ouderId === null ? null : { token: 'token', ouderId }),
  };
  return { d, vervoer: echt };
}

beforeEach(() => opgeslagen.clear());

describe('een kind meenemen', () => {
  it('zet het kind in het account, koppelt het, en verstuurt', async () => {
    const { d, vervoer } = diensten();
    const uit = await neemMee(NOOR, d, NU);
    expect(uit).toEqual({
      ok: true,
      koppeling: {
        lokaalId: 'me',
        kindId: 'server-noor',
        ouderId: 'ouder-1',
        verstuurdOp: NU.toISOString(),
        opgehaaldOp: NU.toISOString(),
      },
    });
    expect(vervoer.neemOp).toHaveBeenCalledWith('token', { voornaam: 'Noor', groep: 5 });
    expect(vervoer.stuur).toHaveBeenCalledWith('token', PAKKET);
  });

  it('bewaart de koppeling ook als het versturen mislukt, en maakt dan geen tweede kind', async () => {
    const mislukt = vi.fn(async () => ({ ok: false as const, reden: 'geen-verbinding' as const }));
    const eerst = diensten({ stuur: mislukt });
    expect(await neemMee(NOOR, eerst.d, NU)).toEqual({ ok: false, reden: 'geen-verbinding' });
    expect(opgeslagen.get('me')).toMatchObject({ kindId: 'server-noor', verstuurdOp: null });

    const daarna = diensten();
    expect((await neemMee(NOOR, daarna.d, NU)).ok).toBe(true);
    expect(daarna.vervoer.neemOp).not.toHaveBeenCalled();
    expect(opgeslagen.get('me')?.verstuurdOp).toBe(NU.toISOString());
  });

  it('maakt niets als het opnemen zelf mislukt', async () => {
    const { d, vervoer } = diensten({
      neemOp: vi.fn(async () => ({ ok: false as const, reden: 'geweigerd' as const })),
    });
    expect(await neemMee(NOOR, d, NU)).toEqual({ ok: false, reden: 'geweigerd' });
    expect(opgeslagen.size).toBe(0);
    expect(vervoer.stuur).not.toHaveBeenCalled();
  });

  it('neemt een kind van een andere ouder op dit apparaat opnieuw op, voor deze ouder', async () => {
    opgeslagen.set('me', {
      lokaalId: 'me',
      kindId: 'van-een-ander',
      ouderId: 'ouder-2',
      verstuurdOp: '2026-01-01T00:00:00.000Z',
      opgehaaldOp: null,
    });
    const { d, vervoer } = diensten();
    await neemMee(NOOR, d, NU);
    expect(vervoer.neemOp).toHaveBeenCalled();
    expect(opgeslagen.get('me')?.ouderId).toBe('ouder-1');
  });

  it('vraagt niets als er niemand is ingelogd', async () => {
    const { d, vervoer } = diensten({}, null);
    expect(await neemMee(NOOR, d, NU)).toEqual({ ok: false, reden: 'niet-ingelogd' });
    expect(vervoer.neemOp).not.toHaveBeenCalled();
  });

  it('stuurt geen groep die de server niet kent', async () => {
    const { d, vervoer } = diensten();
    await neemMee({ id: 'me', naam: 'Noor' } as ProfileRecord, d, NU);
    expect(vervoer.neemOp).toHaveBeenCalledWith('token', { voornaam: 'Noor', groep: null });
  });
});

describe('opnieuw versturen en weghalen', () => {
  const KOPPELING: Koppeling = {
    lokaalId: 'me',
    kindId: 'server-noor',
    ouderId: 'ouder-1',
    verstuurdOp: null,
    opgehaaldOp: null,
  };

  it('verstuurt opnieuw zonder een kind te maken', async () => {
    const { d, vervoer } = diensten();
    expect((await verstuurOpnieuw(KOPPELING, d, NU)).ok).toBe(true);
    expect(vervoer.neemOp).not.toHaveBeenCalled();
  });

  it('haalt een kind uit het account, en laat op dit apparaat alleen de koppeling los', async () => {
    opgeslagen.set('me', KOPPELING);
    const { d, vervoer } = diensten();
    expect(await haalUitAccount(KOPPELING, d)).toEqual({ ok: true });
    expect(vervoer.haalWeg).toHaveBeenCalledWith('token', 'server-noor');
    expect(opgeslagen.has('me')).toBe(false);
  });

  it('houdt de koppeling als weghalen mislukt', async () => {
    opgeslagen.set('me', KOPPELING);
    const { d } = diensten({
      haalWeg: vi.fn(async () => ({ ok: false as const, reden: 'geen-verbinding' as const })),
    });
    expect(await haalUitAccount(KOPPELING, d)).toEqual({ ok: false, reden: 'geen-verbinding' });
    expect(opgeslagen.has('me')).toBe(true);
  });

  it('laat zien wat er in het account staat en wat hier gekoppeld is', async () => {
    opgeslagen.set('me', KOPPELING);
    const { d } = diensten({
      kinderen: vi.fn(async () => ({
        ok: true as const,
        waarde: [{ id: 'server-noor', voornaam: 'Noor', inlogcode: 'ABCD2345', groep: null }],
      })),
    });
    expect(await gezinsstand(d)).toEqual({
      ok: true,
      ouderId: 'ouder-1',
      inAccount: [{ id: 'server-noor', voornaam: 'Noor', inlogcode: 'ABCD2345', groep: null }],
      koppelingen: [KOPPELING],
    });
  });

  it('vergeet een koppeling naar een kind dat niet meer in het account staat', async () => {
    opgeslagen.set('me', KOPPELING);
    const { d } = diensten();
    const stand = await gezinsstand(d);
    expect(stand.ok && stand.koppelingen).toEqual([]);
    expect(opgeslagen.has('me')).toBe(false);
  });
});

/**
 * Het tweede apparaat (ADR-189): een kind uit het account hier zetten, of
 * koppelen aan een kind dat hier al oefent — en daarna beide kanten op bijwerken.
 */
describe('een tweede apparaat', () => {
  const NOOR_DAAR = { id: 'server-noor', voornaam: 'Noor', inlogcode: 'ABCD2345', groep: 6 };

  beforeEach(() => {
    opApparaat.mockClear();
    nieuwHier.mockReset();
  });

  it('zet een kind uit het account hier neer, en haalt alles op', async () => {
    nieuwHier.mockResolvedValue({ id: 'lokaal-noor', naam: 'Noor' });
    const { d, vervoer } = diensten();
    const uit = await zetKindHier(NOOR_DAAR, d, NU);

    expect(nieuwHier).toHaveBeenCalledWith('Noor', 6);
    expect(vervoer.haal).toHaveBeenCalledWith('token', 'server-noor', undefined);
    expect(opApparaat).toHaveBeenCalledWith(expect.anything(), 'lokaal-noor');
    expect(uit).toEqual({
      ok: true,
      koppeling: {
        lokaalId: 'lokaal-noor',
        kindId: 'server-noor',
        ouderId: 'ouder-1',
        verstuurdOp: NU.toISOString(),
        opgehaaldOp: NU.toISOString(),
      },
    });
    // Hier stond niets, dus er ging niets heen.
    expect(vervoer.stuur).not.toHaveBeenCalled();
  });

  it('zegt het als er hier geen kind meer bij kan', async () => {
    nieuwHier.mockResolvedValue(null);
    const { d, vervoer } = diensten();
    expect(await zetKindHier(NOOR_DAAR, d, NU)).toEqual({ ok: false, reden: 'vol' });
    expect(vervoer.haal).not.toHaveBeenCalled();
    expect(opgeslagen.size).toBe(0);
  });

  it('koppelt een kind van hier aan een kind in het account: eerst ophalen, dan alles versturen', async () => {
    const { d, vervoer } = diensten();
    const uit = await koppelAan(NOOR, NOOR_DAAR, d, NU);
    expect(uit.ok).toBe(true);
    expect(opApparaat).toHaveBeenCalledWith(expect.anything(), 'me');
    expect(vervoer.haal).toHaveBeenCalledWith('token', 'server-noor', undefined);
    expect(vervoer.stuur).toHaveBeenCalledWith('token', PAKKET);
    expect(vervoer.neemOp).not.toHaveBeenCalled();
    expect(opgeslagen.get('me')).toMatchObject({
      kindId: 'server-noor',
      verstuurdOp: NU.toISOString(),
      opgehaaldOp: NU.toISOString(),
    });
  });

  it('werkt bij door eerst te versturen en dan op te halen, allebei sinds de vorige keer', async () => {
    const volgorde: string[] = [];
    const { d, vervoer } = diensten({
      stuur: vi.fn(async () => {
        volgorde.push('stuur');
        return { ok: true as const, waarde: null };
      }),
      haal: vi.fn(async () => {
        volgorde.push('haal');
        return {
          ok: true as const,
          waarde: { voortgang: [], sessies: [], pogingen: [], diplomas: [], instellingen: [] },
        };
      }),
    });
    const koppeling = {
      lokaalId: 'me',
      kindId: 'server-noor',
      ouderId: 'ouder-1',
      verstuurdOp: '2026-09-23T10:00:00.000Z',
      opgehaaldOp: '2026-09-23T11:00:00.000Z',
    };
    expect((await werkBij(koppeling, d, NU)).ok).toBe(true);
    expect(volgorde).toEqual(['stuur', 'haal']);
    // Vijf minuten marge, zoals `sindsVan` zegt.
    expect(vervoer.haal).toHaveBeenCalledWith('token', 'server-noor', '2026-09-23T10:55:00.000Z');
  });

  it('haalt niet op als het versturen al misging', async () => {
    const { d, vervoer } = diensten({
      stuur: vi.fn(async () => ({ ok: false as const, reden: 'geen-verbinding' as const })),
    });
    const koppeling = {
      lokaalId: 'me',
      kindId: 'server-noor',
      ouderId: 'ouder-1',
      verstuurdOp: null,
      opgehaaldOp: null,
    };
    expect(await werkBij(koppeling, d, NU)).toEqual({ ok: false, reden: 'geen-verbinding' });
    expect(vervoer.haal).not.toHaveBeenCalled();
  });
});
