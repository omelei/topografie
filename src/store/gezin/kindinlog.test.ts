import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Koppeling } from './koppeling';
import type { Vervoer } from './vervoer';

/**
 * Een kind logt zelf in (ADR-190): code en wachtwoord worden een sessie, het
 * kind komt erbij of wordt het actieve kind, en alles wordt opgehaald.
 */

const koppelingen = vi.hoisted(() => ({ waarde: [] as Koppeling[] }));
const profielen = vi.hoisted(() => new Map<string, { id: string; naam: string }>());
const sessies = vi.hoisted(() => new Map<string, unknown>());
const werkBij = vi.hoisted(() => vi.fn(async () => ({ ok: true })));
const createProfile = vi.hoisted(() => vi.fn());
const switchChild = vi.hoisted(() => vi.fn(async () => undefined));

vi.mock('./koppeling', () => ({
  alleKoppelingen: async () => koppelingen.waarde,
  schrijfKoppeling: async (koppeling: Koppeling) => {
    koppelingen.waarde = [
      ...koppelingen.waarde.filter((k) => k.lokaalId !== koppeling.lokaalId),
      koppeling,
    ];
  },
}));
vi.mock('./kindsessie', () => ({
  bewaarKindsessie: (kindId: string, sessie: unknown) => sessies.set(kindId, sessie),
}));
vi.mock('./overname', () => ({
  werkBij,
  dienstenVoorKind: (vervoer: unknown, token: () => Promise<string>) => ({ vervoer, token }),
}));
vi.mock('../profile', () => ({ createProfile }));
vi.mock('../children', () => ({ switchChild }));
vi.mock('../db', () => ({
  getDb: async () => ({ get: async (_winkel: string, id: string) => profielen.get(id) }),
}));

const { logInAlsKind } = await import('./kindinlog');
const NU = new Date('2026-09-23T12:00:00.000Z');

function vervoer(overschrijf: Partial<Vervoer> = {}): Vervoer {
  return {
    inloggenAlsKind: vi.fn(async () => ({
      ok: true as const,
      sessie: { token: 'token-kind', vernieuwToken: 'vernieuw-kind', seconden: 3600 },
    })),
    ikZelf: vi.fn(async () => ({
      ok: true as const,
      waarde: { id: 'server-noor', ouderId: 'ouder-1', voornaam: 'Noor', groep: 6 },
    })),
    ...overschrijf,
  } as Vervoer;
}

beforeEach(() => {
  koppelingen.waarde = [];
  profielen.clear();
  sessies.clear();
  werkBij.mockClear();
  createProfile.mockReset();
  switchChild.mockClear();
});

describe('een kind logt zelf in', () => {
  it('komt erbij, met sessie en koppeling, en haalt alles op', async () => {
    createProfile.mockResolvedValue({ id: 'me', naam: 'Noor' });
    const uit = await logInAlsKind('KIND-ABCD-2345', 'konijn', vervoer(), NU);

    expect(uit).toEqual({ ok: true, profiel: { id: 'me', naam: 'Noor' } });
    expect(createProfile).toHaveBeenCalledWith('Noor', 6);
    expect(koppelingen.waarde).toEqual([
      {
        lokaalId: 'me',
        kindId: 'server-noor',
        ouderId: 'ouder-1',
        verstuurdOp: NU.toISOString(),
        opgehaaldOp: null,
      },
    ]);
    expect(sessies.get('server-noor')).toMatchObject({
      token: 'token-kind',
      email: '',
      verlooptOp: '2026-09-23T13:00:00.000Z',
    });
    expect(werkBij).toHaveBeenCalledTimes(1);
  });

  it('wordt het actieve kind als het hier al staat, in plaats van er een tweede te maken', async () => {
    koppelingen.waarde = [
      {
        lokaalId: 'lokaal-noor',
        kindId: 'server-noor',
        ouderId: 'ouder-1',
        verstuurdOp: null,
        opgehaaldOp: null,
      },
    ];
    profielen.set('lokaal-noor', { id: 'lokaal-noor', naam: 'Noor' });
    const uit = await logInAlsKind('KIND-ABCD-2345', 'konijn', vervoer(), NU);
    expect(uit.ok && uit.profiel.id).toBe('lokaal-noor');
    expect(createProfile).not.toHaveBeenCalled();
    expect(switchChild).toHaveBeenCalledWith('lokaal-noor');
  });

  it('geeft het antwoord van de inlog door, en bewaart dan niets', async () => {
    const uit = await logInAlsKind(
      'KIND-ABCD-2345',
      'fout',
      vervoer({
        inloggenAlsKind: vi.fn(async () => ({ ok: false as const, reden: 'onjuist' as const })),
      }),
      NU,
    );
    expect(uit).toEqual({ ok: false, reden: 'onjuist' });
    expect(sessies.size).toBe(0);
    expect(koppelingen.waarde).toEqual([]);
  });

  it('zegt het als er hier geen kind meer bij kan', async () => {
    createProfile.mockResolvedValue(null);
    expect(await logInAlsKind('KIND-ABCD-2345', 'konijn', vervoer(), NU)).toEqual({
      ok: false,
      reden: 'vol',
    });
    expect(sessies.size).toBe(0);
  });

  it('is er toch als het ophalen daarna mislukt', async () => {
    createProfile.mockResolvedValue({ id: 'me', naam: 'Noor' });
    werkBij.mockRejectedValueOnce(new Error('weg'));
    expect((await logInAlsKind('KIND-ABCD-2345', 'konijn', vervoer(), NU)).ok).toBe(true);
  });
});
