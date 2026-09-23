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
vi.mock('./koppeling', () => ({
  koppelingenVan: async (ouderId: string) =>
    koppelingen.waarde.filter((koppeling) => koppeling.ouderId === ouderId),
}));
vi.mock('./overname', () => ({
  werkBij,
  laadOvernameDiensten: vi.fn(),
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
});
