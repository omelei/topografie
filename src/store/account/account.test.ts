import { describe, expect, it } from 'vitest';
import { maakNepAccount } from './nepAccount';
import {
  VERVERS_MARGE_MS,
  WACHTWOORD_MINIMUM,
  foutVanAntwoord,
  invoerFout,
  isEmail,
  moetVernieuwen,
  normaliseerEmail,
  verlooptOp,
  wachtwoordKort,
} from './oordeel';
import { leesSessie, schrijfSessie } from './bewaren';
import type { Sessie } from './types';

const NU = new Date('2026-09-18T12:00:00.000Z');

function sessie(over: Partial<Sessie> = {}): Sessie {
  return {
    gebruikerId: 'ouder-1',
    email: 'ouder@example.nl',
    token: 'token-1',
    vernieuwToken: 'vernieuw-1',
    verlooptOp: '2026-09-18T13:00:00.000Z',
    ...over,
  };
}

describe('het adres', () => {
  it('leest een adres zoals iemand het intikt', () => {
    expect(normaliseerEmail('  Ouder@Example.NL ')).toBe('ouder@example.nl');
  });

  it('vangt een typefout en niet meer dan dat', () => {
    expect(isEmail('ouder@example.nl')).toBe(true);
    expect(isEmail('ouder+kind@example.co.uk')).toBe(true);
    expect(isEmail('ouder@example')).toBe(false);
    expect(isEmail('ouder.example.nl')).toBe(false);
    expect(isEmail('')).toBe(false);
    expect(isEmail(`${'a'.repeat(250)}@example.nl`)).toBe(false);
  });
});

describe('het wachtwoord van een ouder', () => {
  /**
   * Acht waar een kind er zes mag. Het wachtwoord van een ouder opent alles van
   * al zijn kinderen en zit achter een adres dat te raden is; dat van een kind
   * opent één omgeving en zit achter een inlogcode die er ook bij moet.
   */
  it('vraagt er acht, twee meer dan bij een kind', () => {
    expect(WACHTWOORD_MINIMUM).toBe(8);
    expect(wachtwoordKort('zeven12')).toBe(true);
    expect(wachtwoordKort('achttien')).toBe(false);
  });
});

describe('de invoer, voordat er iets de deur uit gaat', () => {
  it('zegt "leeg" als er niets staat', () => {
    expect(invoerFout('', 'wachtwoord')).toBe('leeg');
    expect(invoerFout('ouder@example.nl', '')).toBe('leeg');
    expect(invoerFout('   ', 'wachtwoord')).toBe('leeg');
  });

  it('zegt "geen-email" als het geen adres is', () => {
    expect(invoerFout('ouder', 'wachtwoord')).toBe('geen-email');
  });

  it('laat het door als het klopt', () => {
    expect(invoerFout('ouder@example.nl', 'wachtwoord')).toBeNull();
  });
});

describe('verlopen en verversen', () => {
  it('ververst een minuut voor tijd, en niet eerder', () => {
    expect(VERVERS_MARGE_MS).toBe(60_000);
    expect(moetVernieuwen(sessie({ verlooptOp: '2026-09-18T12:02:00.000Z' }), NU)).toBe(false);
    expect(moetVernieuwen(sessie({ verlooptOp: '2026-09-18T12:00:30.000Z' }), NU)).toBe(true);
    expect(moetVernieuwen(sessie({ verlooptOp: '2026-09-18T11:00:00.000Z' }), NU)).toBe(true);
  });

  it('ververst ook als er onzin in de datum staat', () => {
    expect(moetVernieuwen(sessie({ verlooptOp: 'gisteren' }), NU)).toBe(true);
  });

  it('rekent uit wanneer een token om is', () => {
    expect(verlooptOp(3600, NU)).toBe('2026-09-18T13:00:00.000Z');
  });
});

describe('wat Supabase zei, in één woord', () => {
  it('houdt "bevestig eerst je mail" uit elkaar van "dit klopt niet"', () => {
    expect(foutVanAntwoord(400, 'email_not_confirmed', '')).toBe('bevestig-email');
    expect(foutVanAntwoord(400, 'invalid_credentials', 'Invalid login credentials')).toBe(
      'onjuist',
    );
  });

  it('herkent een adres dat er al is', () => {
    expect(foutVanAntwoord(422, 'user_already_exists', '')).toBe('bestaat-al');
    expect(foutVanAntwoord(400, '', 'User already registered')).toBe('bestaat-al');
  });

  it('herkent te vaak proberen, met code of met tekst', () => {
    expect(foutVanAntwoord(429, '', '')).toBe('te-vaak');
    expect(foutVanAntwoord(400, 'over_email_send_rate_limit', '')).toBe('te-vaak');
  });

  it('noemt een kapotte server geen fout wachtwoord', () => {
    expect(foutVanAntwoord(500, '', '')).toBe('geen-verbinding');
    expect(foutVanAntwoord(503, '', '')).toBe('geen-verbinding');
  });

  it('valt terug op "onjuist" als het niets herkent', () => {
    expect(foutVanAntwoord(400, 'iets_nieuws', 'wat dan ook')).toBe('onjuist');
  });
});

describe('de sessie op dit apparaat', () => {
  it('schrijft en leest er een terug', () => {
    schrijfSessie(sessie());
    expect(leesSessie()).toEqual(sessie());
    schrijfSessie(null);
    expect(leesSessie()).toBeNull();
  });

  it('leest rommel als "niemand ingelogd" in plaats van stuk te gaan', () => {
    expect(leesSessie('{')).toBeNull();
    expect(leesSessie('null')).toBeNull();
    expect(leesSessie(JSON.stringify({ email: 'ouder@example.nl' }))).toBeNull();
  });
});

describe('aanmelden en inloggen', () => {
  it('maakt een ouder aan en logt hem meteen in', async () => {
    const account = maakNepAccount();
    const uitkomst = await account.aanmelden('Ouder@example.nl', 'geheimwoord');
    expect(uitkomst.ok).toBe(true);
    expect(account.bewaard()?.email).toBe('ouder@example.nl');
  });

  it('laat een ouder met bevestiging per mail nog niet binnen', async () => {
    const account = maakNepAccount({ bevestigingNodig: true });
    const uitkomst = await account.aanmelden('ouder@example.nl', 'geheimwoord');
    expect(uitkomst).toEqual({ ok: true, sessie: null });
    expect(account.bewaard()).toBeNull();
  });

  it('weigert een te kort wachtwoord bij aanmelden', async () => {
    const account = maakNepAccount();
    expect(await account.aanmelden('ouder@example.nl', 'zeven12')).toEqual({
      ok: false,
      reden: 'te-kort',
    });
  });

  it('zegt het als het adres er al is', async () => {
    const account = maakNepAccount();
    await account.aanmelden('ouder@example.nl', 'geheimwoord');
    expect(await account.aanmelden('Ouder@Example.nl', 'anderwoord')).toEqual({
      ok: false,
      reden: 'bestaat-al',
    });
  });

  /**
   * Bij inloggen wél één antwoord voor allebei. Bij aanmelden kan dat niet —
   * daar ís "dit adres bestaat al" het antwoord — en dat verschil is de reden
   * dat Supabase zelf bevestiging per mail aanraadt.
   */
  it('zegt hetzelfde bij een onbekend adres als bij een fout wachtwoord', async () => {
    const account = maakNepAccount();
    await account.aanmelden('ouder@example.nl', 'geheimwoord');

    const onbekend = await account.inloggen('niemand@example.nl', 'geheimwoord');
    const foutWachtwoord = await account.inloggen('ouder@example.nl', 'ietsanders');

    expect(onbekend).toEqual({ ok: false, reden: 'onjuist' });
    expect(foutWachtwoord).toEqual(onbekend);
  });

  it('vraagt niets aan niemand als er niets is ingevuld', async () => {
    const account = maakNepAccount();
    expect(await account.inloggen('', '')).toEqual({ ok: false, reden: 'leeg' });
    expect(await account.inloggen('ouder', 'geheimwoord')).toEqual({
      ok: false,
      reden: 'geen-email',
    });
  });

  it('zegt dat er niets ingesteld is als de bouw geen adres heeft', async () => {
    const account = maakNepAccount({ nietIngesteld: true });
    expect(await account.inloggen('ouder@example.nl', 'geheimwoord')).toEqual({
      ok: false,
      reden: 'niet-ingesteld',
    });
  });

  it('noemt geen verbinding geen fout wachtwoord', async () => {
    const account = maakNepAccount({ offline: true });
    expect(await account.inloggen('ouder@example.nl', 'geheimwoord')).toEqual({
      ok: false,
      reden: 'geen-verbinding',
    });
  });
});

describe('uitloggen en verversen', () => {
  it('laat na uitloggen niets staan', async () => {
    const account = maakNepAccount();
    await account.aanmelden('ouder@example.nl', 'geheimwoord');
    await account.uitloggen();
    expect(account.bewaard()).toBeNull();
    expect(await account.sessie()).toBeNull();
  });

  it('geeft de sessie ongewijzigd terug zolang hij ruim geldig is', async () => {
    const account = maakNepAccount();
    await account.aanmelden('ouder@example.nl', 'geheimwoord');
    const eerst = await account.sessie();
    expect(await account.sessie()).toEqual(eerst);
    expect(account.verversingen()).toBe(0);
  });

  it('ververst hem als hij bijna om is', async () => {
    const account = maakNepAccount({ tokenSeconden: 30 });
    await account.aanmelden('ouder@example.nl', 'geheimwoord');
    const verse = await account.sessie();
    expect(account.verversingen()).toBe(1);
    expect(verse?.token).not.toBe('token-1');
  });

  /**
   * Een ingetrokken sessie is weg en niet stuk. `kind-beheer` trekt ze met opzet
   * in bij een nieuw wachtwoord, en dan is uitloggen het juiste antwoord.
   */
  it('logt uit als de server de sessie heeft ingetrokken', async () => {
    const account = maakNepAccount({ tokenSeconden: 30 });
    await account.aanmelden('ouder@example.nl', 'geheimwoord');
    account.trekIn();
    expect(await account.sessie()).toBeNull();
  });

  /**
   * Zonder verbinding blijft de sessie staan. Een tunnel of een schoolwifi hoort
   * niemand uit te loggen — dat is hetzelfde uitgangspunt als premium, dat twee
   * weken zonder antwoord blijft werken.
   */
  it('logt niemand uit omdat er even geen verbinding is', async () => {
    const account = maakNepAccount({ tokenSeconden: 30 });
    await account.aanmelden('ouder@example.nl', 'geheimwoord');
    account.zetOffline();
    expect(await account.sessie()).not.toBeNull();
    expect(account.verversingen()).toBe(0);
  });
});
