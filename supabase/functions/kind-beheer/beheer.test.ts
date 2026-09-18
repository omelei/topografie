import { describe, expect, it, vi } from 'vitest';
import { BeheerProbleem, behandel, type Diensten, type Verzoek } from './beheer';

function nepDiensten(overschrijf: Partial<Diensten> = {}) {
  const gedaan: string[] = [];
  const diensten: Diensten = {
    ouderVoorToken: async (token) => (token === 'ouder-token' ? 'ouder-1' : null),
    maakGebruiker: async () => {
      gedaan.push('maakGebruiker');
      return 'kind-nieuw';
    },
    zetAdres: async (id, adres) => {
      gedaan.push(`zetAdres:${id}:${adres}`);
    },
    zetWachtwoord: async (id) => {
      gedaan.push(`zetWachtwoord:${id}`);
    },
    verwijderGebruiker: async (id) => {
      gedaan.push(`verwijderGebruiker:${id}`);
    },
    trekSessiesIn: async (id) => {
      gedaan.push(`trekSessiesIn:${id}`);
    },
    bewaarKind: async (kind) => {
      gedaan.push(`bewaarKind:${kind.id}:${kind.voornaam}:${kind.groep}`);
    },
    codeUitgeven: async (id) => {
      gedaan.push(`codeUitgeven:${id}`);
      return 'ABCD2345';
    },
    kind: async (id) => (id === 'kind-1' ? { ouderId: 'ouder-1', voornaam: 'Sofie' } : null),
    ...overschrijf,
  };
  return { diensten, gedaan };
}

const BASIS: Verzoek = {
  token: 'ouder-token',
  actie: 'aanmaken',
  kindId: null,
  voornaam: 'Sofie',
  wachtwoord: 'konijn',
  groep: 5,
};

async function reden(belofte: Promise<unknown>): Promise<string> {
  try {
    await belofte;
  } catch (fout) {
    if (fout instanceof BeheerProbleem) return fout.reden;
    throw fout;
  }
  throw new Error('er ging niets mis, en dat was wel de bedoeling');
}

describe('wie er mag', () => {
  it('laat niemand zonder geldig token binnen', async () => {
    const { diensten, gedaan } = nepDiensten();
    expect(await reden(behandel({ ...BASIS, token: 'rommel' }, diensten))).toBe('geen-ouder');
    expect(gedaan).toEqual([]);
  });

  /**
   * Eén antwoord voor "dit kind bestaat niet" en "dit kind is niet van jou".
   * Twee antwoorden zouden vertellen welke kind-ids bestaan.
   */
  it('zegt hetzelfde over een onbekend kind als over dat van een ander', async () => {
    const onbekend = nepDiensten();
    const vanEenAnder = nepDiensten({
      kind: async () => ({ ouderId: 'ouder-2', voornaam: 'Joep' }),
    });
    const verzoek = { ...BASIS, actie: 'nieuwe-code', kindId: 'kind-9' };

    expect(await reden(behandel(verzoek, onbekend.diensten))).toBe('niet-jouw-kind');
    expect(await reden(behandel(verzoek, vanEenAnder.diensten))).toBe('niet-jouw-kind');
  });

  it('kent alleen de vier handelingen die er zijn', async () => {
    const { diensten } = nepDiensten();
    expect(await reden(behandel({ ...BASIS, actie: 'promoveren' }, diensten))).toBe(
      'onbekende-actie',
    );
  });
});

describe('een kind aanmaken', () => {
  it('maakt een gebruiker, geeft hem zijn adres, en dan pas een code', async () => {
    const { diensten, gedaan } = nepDiensten();
    const antwoord = await behandel(BASIS, diensten);
    expect(antwoord).toEqual({
      kind: { id: 'kind-nieuw', voornaam: 'Sofie', inlogcode: 'ABCD2345' },
    });
    expect(gedaan).toEqual([
      'maakGebruiker',
      'zetAdres:kind-nieuw:kind-nieuw@kind.invalid',
      'bewaarKind:kind-nieuw:Sofie:5',
      'codeUitgeven:kind-nieuw',
    ]);
  });

  it('mag zonder groep', async () => {
    const { diensten, gedaan } = nepDiensten();
    await behandel({ ...BASIS, groep: null }, diensten);
    expect(gedaan).toContain('bewaarKind:kind-nieuw:Sofie:null');
  });

  it('weigert een groep die niet bestaat', async () => {
    const { diensten } = nepDiensten();
    expect(await reden(behandel({ ...BASIS, groep: 2 }, diensten))).toBe('groep-onbekend');
    expect(await reden(behandel({ ...BASIS, groep: 9 }, diensten))).toBe('groep-onbekend');
  });

  it('wil een naam', async () => {
    const { diensten } = nepDiensten();
    expect(await reden(behandel({ ...BASIS, voornaam: '   ' }, diensten))).toBe('naam-leeg');
  });

  it('geeft het wachtwoordoordeel door', async () => {
    const { diensten, gedaan } = nepDiensten();
    expect(await reden(behandel({ ...BASIS, wachtwoord: 'kat' }, diensten))).toBe('te-kort');
    expect(await reden(behandel({ ...BASIS, wachtwoord: 'sofie' }, diensten))).toBe('te-kort');
    expect(await reden(behandel({ ...BASIS, wachtwoord: '123456' }, diensten))).toBe('te-simpel');
    expect(gedaan).toEqual([]);
  });
});

describe('herstel', () => {
  it('geeft een nieuwe code uit voor het eigen kind', async () => {
    const { diensten, gedaan } = nepDiensten();
    const antwoord = await behandel(
      { ...BASIS, actie: 'nieuwe-code', kindId: 'kind-1' },
      diensten,
    );
    expect(antwoord).toEqual({ inlogcode: 'ABCD2345' });
    expect(gedaan).toEqual(['codeUitgeven:kind-1']);
  });

  /**
   * Wie het wachtwoord opnieuw zet, doet dat meestal omdat iemand anders het
   * kende. Een sessie die gewoon doorloopt maakt dat ongedaan.
   */
  it('zet het wachtwoord en logt het kind overal uit', async () => {
    const { diensten, gedaan } = nepDiensten();
    await behandel(
      { ...BASIS, actie: 'wachtwoord', kindId: 'kind-1', wachtwoord: 'nieuwwoord' },
      diensten,
    );
    expect(gedaan).toEqual(['zetWachtwoord:kind-1', 'trekSessiesIn:kind-1']);
  });

  it('weegt het nieuwe wachtwoord tegen de naam van dát kind', async () => {
    const { diensten, gedaan } = nepDiensten();
    expect(
      await reden(
        behandel({ ...BASIS, actie: 'wachtwoord', kindId: 'kind-1', wachtwoord: 'Sofie' }, diensten),
      ),
    ).toBe('eigen-naam');
    expect(gedaan).toEqual([]);
  });

  it('haalt een kind weg met één handeling, en laat de rest cascaderen', async () => {
    const { diensten, gedaan } = nepDiensten();
    await behandel({ ...BASIS, actie: 'verwijderen', kindId: 'kind-1' }, diensten);
    expect(gedaan).toEqual(['verwijderGebruiker:kind-1']);
  });

  it('laat een ouder het kind van een ander niet weghalen', async () => {
    const verwijderGebruiker = vi.fn(async () => {});
    const { diensten } = nepDiensten({
      kind: async () => ({ ouderId: 'ouder-2', voornaam: 'Joep' }),
      verwijderGebruiker,
    });
    expect(
      await reden(behandel({ ...BASIS, actie: 'verwijderen', kindId: 'kind-1' }, diensten)),
    ).toBe('niet-jouw-kind');
    expect(verwijderGebruiker).not.toHaveBeenCalled();
  });
});
