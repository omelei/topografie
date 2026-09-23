import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Koppeling } from './koppeling';
import type { OvernameDiensten } from './overname';

/**
 * Na elke ronde gaat mee wat er bij kwam (ADR-188) — maar alleen als er een
 * ouder is ingelogd en er een kind gekoppeld is, en nooit twee keer tegelijk.
 */

const sessie = vi.hoisted(() => ({ waarde: null as { gebruikerId: string } | null }));
const koppelingen = vi.hoisted(() => ({ waarde: [] as Koppeling[] }));
const werkBij = vi.hoisted(() => vi.fn());

vi.mock('../account/bewaren', () => ({ leesSessie: () => sessie.waarde }));
const kindsessies = vi.hoisted(() => ({ waarde: [] as string[] }));
vi.mock('./koppeling', () => ({ alleKoppelingen: async () => koppelingen.waarde }));
vi.mock('./kindsessie', () => ({
  kinderenMetSessie: () => kindsessies.waarde,
  geldigeKindsessie: async (kindId: string) => ({ token: `token-${kindId}` }),
}));
vi.mock('./overname', () => ({
  werkBij,
  laadOvernameDiensten: vi.fn(),
  dienstenVoorKind: (vervoer: unknown, token: () => Promise<string | null>) => ({
    vervoer,
    ouder: async () => ({ token: await token(), ouderId: '' }),
  }),
}));

const { houBij } = await import('./bijhouden');
const DIENSTEN = {} as OvernameDiensten;

function koppeling(lokaalId: string, ouderId = 'ouder-1'): Koppeling {
  return {
    lokaalId,
    kindId: `server-${lokaalId}`,
    ouderId,
    verstuurdOp: '2026-09-22T10:00:00.000Z',
    opgehaaldOp: '2026-09-22T10:00:00.000Z',
  };
}

beforeEach(() => {
  sessie.waarde = null;
  koppelingen.waarde = [];
  kindsessies.waarde = [];
  werkBij.mockReset();
  werkBij.mockResolvedValue({ ok: true });
});

describe('bijhouden', () => {
  it('doet niets zonder ingelogde ouder', async () => {
    koppelingen.waarde = [koppeling('me')];
    await houBij(DIENSTEN);
    expect(werkBij).not.toHaveBeenCalled();
  });

  it('doet niets zonder gekoppeld kind van deze ouder', async () => {
    sessie.waarde = { gebruikerId: 'ouder-1' };
    koppelingen.waarde = [koppeling('me', 'ouder-2')];
    await houBij(DIENSTEN);
    expect(werkBij).not.toHaveBeenCalled();
  });

  it('verstuurt voor elk gekoppeld kind, ook als er één mislukt', async () => {
    sessie.waarde = { gebruikerId: 'ouder-1' };
    koppelingen.waarde = [koppeling('me'), koppeling('sem')];
    werkBij.mockRejectedValueOnce(new Error('weg'));
    await houBij(DIENSTEN);
    expect(werkBij).toHaveBeenCalledTimes(2);
    expect(werkBij.mock.calls.map((aanroep) => aanroep[0].lokaalId)).toEqual(['me', 'sem']);
  });

  it('maakt van twee aanleidingen tegelijk één keer versturen', async () => {
    sessie.waarde = { gebruikerId: 'ouder-1' };
    koppelingen.waarde = [koppeling('me')];
    await Promise.all([houBij(DIENSTEN), houBij(DIENSTEN)]);
    expect(werkBij).toHaveBeenCalledTimes(1);

    // En daarna mag het gewoon weer.
    await houBij(DIENSTEN);
    expect(werkBij).toHaveBeenCalledTimes(2);
  });

  /** Een kind dat zelf inlogde, op een apparaat zonder ouder (ADR-190). */
  it('werkt een zelf ingelogd kind bij met zijn eigen token', async () => {
    koppelingen.waarde = [koppeling('me', 'ouder-elders')];
    kindsessies.waarde = ['server-me'];
    await houBij(DIENSTEN);
    expect(werkBij).toHaveBeenCalledTimes(1);
    const diensten = werkBij.mock.calls[0]?.[1] as OvernameDiensten;
    expect(await diensten.ouder()).toEqual({ token: 'token-server-me', ouderId: '' });
  });

  it('laat een kind met een ouder hier niet ook nog als zichzelf bijwerken', async () => {
    sessie.waarde = { gebruikerId: 'ouder-1' };
    koppelingen.waarde = [koppeling('me')];
    kindsessies.waarde = ['server-me'];
    await houBij(DIENSTEN);
    expect(werkBij).toHaveBeenCalledTimes(1);
  });
});
