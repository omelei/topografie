import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProfileRecord } from '../db';
import type { Koppeling } from './koppeling';
import {
  gezinsstand,
  haalUitAccount,
  neemMee,
  verstuurOpnieuw,
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

vi.mock('./koppeling', () => ({
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

const NOOR = { id: 'me', naam: 'Noor', groep: 5, groepSchooljaar: 2026 } as ProfileRecord;
const NU = new Date('2026-09-23T12:00:00.000Z');

function diensten(vervoer: Partial<Vervoer> = {}, ouderId: string | null = 'ouder-1') {
  const echt: Vervoer = {
    kinderen: vi.fn(async () => ({ ok: true as const, waarde: [] })),
    neemOp: vi.fn(async () => ({
      ok: true as const,
      waarde: { id: 'server-noor', voornaam: 'Noor', inlogcode: 'ABCD2345' },
    })),
    haalWeg: vi.fn(async () => ({ ok: true as const, waarde: null })),
    stuur: vi.fn(async () => ({ ok: true as const, waarde: null })),
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
        waarde: [{ id: 'server-noor', voornaam: 'Noor', inlogcode: 'ABCD2345' }],
      })),
    });
    expect(await gezinsstand(d)).toEqual({
      ok: true,
      ouderId: 'ouder-1',
      inAccount: [{ id: 'server-noor', voornaam: 'Noor', inlogcode: 'ABCD2345' }],
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
