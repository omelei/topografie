import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import {
  ALFABET,
  LENGTE,
  adresVoorKind,
  codeVoorMens,
  isCode,
  normaliseerCode,
  wachtwoordOordeel,
} from '../_gezin/code';
import { MINIMUM_MS, inloggen, type Diensten, type Sessie } from './inloggen';

const SESSIE: Sessie = {
  access_token: 'a',
  refresh_token: 'r',
  expires_in: 3600,
  token_type: 'bearer',
};

/**
 * Diensten die niets doen behalve wat de test wil, met een klok die stilstaat
 * tenzij de test hem verzet. `gewacht` telt op wat de code aan uitstel vroeg.
 */
function nepDiensten(overschrijf: Partial<Diensten> = {}) {
  const gemeld: string[] = [];
  let klok = 0;
  let gewacht = 0;
  const diensten: Diensten = {
    magInloggen: async () => true,
    meldMislukt: async (codeHash) => {
      gemeld.push(codeHash);
    },
    kindVoorCode: async () => null,
    inloggenMetWachtwoord: async () => null,
    digest: async (waarde) => `digest(${waarde})`,
    nu: () => klok,
    wacht: async (ms) => {
      gewacht += ms;
      klok += ms;
    },
    ...overschrijf,
  };
  return {
    diensten,
    gemeld,
    /** Hoeveel uitstel de code bij elkaar vroeg. */
    ver: () => gewacht,
    /** De klok vooruit, alsof het verzoek zelf tijd kostte. */
    verzet: (ms: number) => {
      klok += ms;
    },
  };
}

const GOED = { code: 'ABCD2345', wachtwoord: 'geheimpje', ip: '203.0.113.9' };

describe('de code', () => {
  it('leest wat een kind intikt, hoe het ook getikt is', () => {
    expect(normaliseerCode('kind-abcd-2345')).toBe('ABCD2345');
    expect(normaliseerCode('ABCD 2345')).toBe('ABCD2345');
    expect(normaliseerCode('  abcd2345 ')).toBe('ABCD2345');
    expect(normaliseerCode('ABCD2345')).toBe('ABCD2345');
  });

  it('laat de tekens weg die van een scherm verkeerd overgetypt worden', () => {
    for (const teken of ['0', 'O', '1', 'I', 'L']) {
      expect(ALFABET).not.toContain(teken);
    }
    expect(isCode('ABCD234O')).toBe(false);
    expect(isCode('ABCD2340')).toBe(false);
    expect(isCode('ABCD234L')).toBe(false);
  });

  it('wil er precies acht', () => {
    expect(isCode('ABCD234')).toBe(false);
    expect(isCode('ABCD23456')).toBe(false);
    expect(isCode('ABCD2345')).toBe(true);
    expect(LENGTE).toBe(8);
  });

  it('spelt hem zoals een ouder hem voorleest', () => {
    expect(codeVoorMens('ABCD2345')).toBe('KIND-ABCD-2345');
  });

  /**
   * Het alfabet staat op drie plekken: hier, in de migratie die de code uitgeeft,
   * en in de premiumcode waar het vandaan komt. Uit elkaar lopen zou pas opvallen
   * als een ouder een code voorleest die niet bestaat.
   */
  it('is hetzelfde alfabet als in de migratie en bij premium', () => {
    const migratie = readFileSync('supabase/migrations/0001_gezin.sql', 'utf8');
    expect(migratie).toContain(`'${ALFABET}'`);
    expect(migratie).toContain(`{${LENGTE}}$'`);

    const premium = readFileSync('tools/premium/maak-codes.mjs', 'utf8');
    expect(premium).toContain(`'${ALFABET}'`);
  });

  it('maakt een adres dat nooit post kan ontvangen', () => {
    expect(adresVoorKind('11111111-2222-3333-4444-555555555555')).toBe(
      '11111111-2222-3333-4444-555555555555@kind.invalid',
    );
  });
});

describe('het wachtwoord van een kind', () => {
  it('vraagt zes tekens en verder niets', () => {
    expect(wachtwoordOordeel('konijn', 'Sofie')).toBeNull();
    expect(wachtwoordOordeel('kat', 'Sofie')).toBe('te-kort');
    expect(wachtwoordOordeel('mijn kat heet joep', 'Sofie')).toBeNull();
  });

  it('weigert het eerste dat iemand intikt', () => {
    expect(wachtwoordOordeel('123456', 'Sofie')).toBe('te-simpel');
    expect(wachtwoordOordeel('WachtWoord', 'Sofie')).toBe('te-simpel');
  });

  it('weigert de eigen naam', () => {
    expect(wachtwoordOordeel('sofie1', 'Sofie1')).toBe('eigen-naam');
    expect(wachtwoordOordeel('sofietje', 'Sofie')).toBeNull();
  });
});

describe('inloggen', () => {
  it('geeft een sessie als code en wachtwoord kloppen', async () => {
    const { diensten, gemeld } = nepDiensten({
      kindVoorCode: async () => 'kind-1',
      inloggenMetWachtwoord: async () => SESSIE,
    });
    const uitkomst = await inloggen(GOED, diensten);
    expect(uitkomst).toEqual({ ok: true, sessie: SESSIE });
    expect(gemeld).toEqual([]);
  });

  it('geeft het kind het adres dat bij zijn id hoort', async () => {
    const inloggenMetWachtwoord = vi.fn(async () => SESSIE);
    const { diensten } = nepDiensten({
      kindVoorCode: async () => 'abc-123',
      inloggenMetWachtwoord,
    });
    await inloggen(GOED, diensten);
    expect(inloggenMetWachtwoord).toHaveBeenCalledWith('abc-123@kind.invalid', 'geheimpje');
  });

  /**
   * Het hart van ADR-155: een onbekende code en een fout wachtwoord zijn van
   * buiten niet uit elkaar te houden. Zou dat wel kunnen, dan is er een ingang
   * die vertelt welke codes bestaan, en dan is de code geen gebruikersnaam meer
   * maar de helft van het slot.
   */
  it('zegt hetzelfde bij een onbekende code als bij een fout wachtwoord', async () => {
    const onbekend = nepDiensten({ kindVoorCode: async () => null });
    const foutWachtwoord = nepDiensten({
      kindVoorCode: async () => 'kind-1',
      inloggenMetWachtwoord: async () => null,
    });

    const a = await inloggen(GOED, onbekend.diensten);
    const b = await inloggen(GOED, foutWachtwoord.diensten);

    expect(a).toEqual({ ok: false, reden: 'onjuist' });
    expect(b).toEqual(a);
  });

  /**
   * De andere helft van "vertel niet of een code bestaat". Een onbekende code is
   * uit zichzelf sneller klaar dan een fout wachtwoord — er is geen hash te
   * controleren — en dat verschil is op zichzelf een antwoord.
   */
  it('laat een mislukte poging altijd even lang duren', async () => {
    const snel = nepDiensten({ kindVoorCode: async () => null });
    await inloggen(GOED, snel.diensten);
    expect(snel.ver()).toBe(MINIMUM_MS);
  });

  it('wacht niet nog eens als het verzoek uit zichzelf al traag was', async () => {
    const traag = nepDiensten();
    const diensten = {
      ...traag.diensten,
      kindVoorCode: async () => {
        traag.verzet(MINIMUM_MS * 2);
        return null;
      },
    };
    await inloggen(GOED, diensten);
    expect(traag.ver()).toBe(0);
  });

  it('telt een fout wachtwoord en een onbekende code mee in de begrenzer', async () => {
    const { diensten, gemeld } = nepDiensten({ kindVoorCode: async () => null });
    await inloggen(GOED, diensten);
    expect(gemeld).toEqual(['digest(code:ABCD2345)']);
  });

  it('zoekt een code die de vorm niet eens heeft niet op, maar rekent hem wel aan', async () => {
    const kindVoorCode = vi.fn(async () => null);
    const { diensten, gemeld } = nepDiensten({ kindVoorCode });
    const uitkomst = await inloggen({ ...GOED, code: 'OOOO0000' }, diensten);
    expect(uitkomst).toEqual({ ok: false, reden: 'onjuist' });
    expect(kindVoorCode).not.toHaveBeenCalled();
    expect(gemeld).toHaveLength(1);
  });

  it('houdt op als er te vaak geprobeerd is, en zoekt dan niets op', async () => {
    const kindVoorCode = vi.fn(async () => 'kind-1');
    const { diensten, gemeld } = nepDiensten({ magInloggen: async () => false, kindVoorCode });
    const uitkomst = await inloggen(GOED, diensten);
    expect(uitkomst).toEqual({ ok: false, reden: 'te-vaak' });
    expect(kindVoorCode).not.toHaveBeenCalled();
    expect(gemeld).toEqual([]);
  });

  it('begrenst op de code én op het adres', async () => {
    const magInloggen = vi.fn(async () => true);
    const { diensten } = nepDiensten({ magInloggen, kindVoorCode: async () => null });
    await inloggen(GOED, diensten);
    expect(magInloggen).toHaveBeenCalledWith('digest(code:ABCD2345)', 'digest(ip:203.0.113.9)');
  });

  it('vraagt niets aan niemand als er niets is ingevuld', async () => {
    const magInloggen = vi.fn(async () => true);
    const { diensten } = nepDiensten({ magInloggen });
    expect(await inloggen({ ...GOED, wachtwoord: '' }, diensten)).toEqual({
      ok: false,
      reden: 'leeg',
    });
    expect(await inloggen({ ...GOED, code: '   ' }, diensten)).toEqual({ ok: false, reden: 'leeg' });
    expect(magInloggen).not.toHaveBeenCalled();
  });

  it('overleeft rommel in plaats van een code', async () => {
    const { diensten } = nepDiensten();
    expect(await inloggen({ ...GOED, code: null }, diensten)).toEqual({ ok: false, reden: 'leeg' });
    expect(await inloggen({ ...GOED, wachtwoord: 42 }, diensten)).toEqual({
      ok: false,
      reden: 'leeg',
    });
  });

  /**
   * Een haperende Supabase is niet de schuld van het kind. Zou een storing als
   * mislukte poging tellen, dan sluit een slechte minuut een kind een uur buiten.
   */
  it('rekent een storing niet aan als poging', async () => {
    const { diensten, gemeld } = nepDiensten({
      kindVoorCode: async () => 'kind-1',
      inloggenMetWachtwoord: async () => {
        throw new Error('502');
      },
    });
    const uitkomst = await inloggen(GOED, diensten);
    expect(uitkomst).toEqual({ ok: false, reden: 'storing' });
    expect(gemeld).toEqual([]);
  });
});
