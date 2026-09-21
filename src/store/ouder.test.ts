import { afterEach, describe, expect, it } from 'vitest';
import {
  isGeldigePin,
  isOuder,
  isPinGezet,
  leesSlot,
  OUDER_SLEUTEL,
  PAUZE_SECONDEN,
  POGINGEN_VOOR_PAUZE,
  probeer,
  SESSIE_MINUTEN,
  SESSIE_SLEUTEL,
  sluit,
  vergeetOuder,
  verleng,
  wachtSeconden,
  zetPin,
} from './ouder';

/**
 * Het ouderslot op dit apparaat (ADR-173).
 *
 * Wat hier bewezen moet worden is niet dat vier cijfers veilig zijn — dat zijn
 * ze niet, en het ontwerp zegt dat ook — maar drie dingen die het wél moeten
 * doen: de cijfers staan nergens, drie missers kosten tijd, en de sessie gaat
 * vanzelf weer uit.
 */

const NU = new Date('2026-09-21T12:00:00');

afterEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe('een pincode', () => {
  it('is vier cijfers en niets anders', () => {
    expect(isGeldigePin('1234')).toBe(true);
    expect(isGeldigePin('0000')).toBe(true);
    expect(isGeldigePin('123')).toBe(false);
    expect(isGeldigePin('12345')).toBe(false);
    expect(isGeldigePin('12a4')).toBe(false);
    // Spaties worden niet weggepoetst: dan zou "1 2 3 4" een andere code zijn
    // die op hetzelfde neerkomt, en dat is één manier te veel.
    expect(isGeldigePin('1 23')).toBe(false);
    expect(isGeldigePin('')).toBe(false);
  });

  it('wordt alleen gezet als hij twee keer hetzelfde is', async () => {
    expect(await zetPin('1234', '1235')).toEqual({
      ok: false,
      reden: 'ongelijk',
      wachtSeconden: 0,
    });
    expect(isPinGezet()).toBe(false);

    expect(await zetPin('12', '12')).toEqual({
      ok: false,
      reden: 'geen-cijfers',
      wachtSeconden: 0,
    });
    expect(isPinGezet()).toBe(false);
  });

  it('staat nergens in de opslag te lezen', async () => {
    expect(await zetPin('4821', '4821')).toEqual({ ok: true });

    const ruw = window.localStorage.getItem(OUDER_SLEUTEL) ?? '';
    expect(ruw).not.toContain('4821');
    expect(leesSlot()?.hash).toBeTypeOf('string');
    expect(leesSlot()?.salt).toBeTypeOf('string');
  });

  it('geeft twee apparaten met dezelfde code een andere afleiding', async () => {
    await zetPin('1234', '1234');
    const eerste = leesSlot();
    window.localStorage.clear();
    await zetPin('1234', '1234');

    expect(leesSlot()?.salt).not.toBe(eerste?.salt);
    expect(leesSlot()?.hash).not.toBe(eerste?.hash);
  });
});

describe('de deur', () => {
  it('gaat open met de goede pincode en niet met een andere', async () => {
    await zetPin('4821', '4821');

    expect(await probeer('4821', NU)).toEqual({ ok: true });
    expect(isOuder(undefined, NU)).toBe(true);

    sluit();
    expect(await probeer('4822', NU)).toEqual({
      ok: false,
      reden: 'onjuist',
      wachtSeconden: 0,
    });
    expect(isOuder(undefined, NU)).toBe(false);
  });

  it('gaat niet open op een apparaat zonder ouder', async () => {
    expect(await probeer('4821', NU)).toEqual({
      ok: false,
      reden: 'onjuist',
      wachtSeconden: 0,
    });
    expect(isOuder(undefined, NU)).toBe(false);
  });

  it('laat na drie missers even wachten', async () => {
    await zetPin('4821', '4821');

    for (let poging = 1; poging < POGINGEN_VOOR_PAUZE; poging += 1) {
      expect(await probeer('0000', NU)).toMatchObject({ reden: 'onjuist' });
    }
    expect(await probeer('0000', NU)).toEqual({
      ok: false,
      reden: 'te-vaak',
      wachtSeconden: PAUZE_SECONDEN,
    });

    // En dan telt ook de goede code niet meer, tot de pauze om is.
    expect(await probeer('4821', NU)).toMatchObject({ reden: 'te-vaak' });
    expect(isOuder(undefined, NU)).toBe(false);

    const na = new Date(NU.getTime() + (PAUZE_SECONDEN + 1) * 1000);
    expect(wachtSeconden(na)).toBe(0);
    expect(await probeer('4821', na)).toEqual({ ok: true });
  });

  it('vergeet de missers zodra het een keer klopt', async () => {
    await zetPin('4821', '4821');
    await probeer('0000', NU);
    await probeer('4821', NU);
    sluit();

    // De eerdere misser telt niet meer mee, dus er is weer ruimte voor drie.
    for (let poging = 1; poging < POGINGEN_VOOR_PAUZE; poging += 1) {
      expect(await probeer('0000', NU)).toMatchObject({ reden: 'onjuist' });
    }
    expect(wachtSeconden(NU)).toBe(0);
  });
});

describe('de sessie', () => {
  it('loopt af na vijf minuten zonder iets aan te raken', async () => {
    await zetPin('4821', '4821');
    await probeer('4821', NU);

    const bijna = new Date(NU.getTime() + (SESSIE_MINUTEN - 1) * 60_000);
    const erna = new Date(NU.getTime() + (SESSIE_MINUTEN + 1) * 60_000);
    expect(isOuder(undefined, bijna)).toBe(true);
    expect(isOuder(undefined, erna)).toBe(false);

    // Elke handeling zet de klok terug op vijf.
    verleng(bijna);
    expect(isOuder(undefined, erna)).toBe(true);
  });

  it('staat in sessionStorage, zodat een herlaadbeurt hem houdt en sluiten niet', async () => {
    await zetPin('4821', '4821');
    await probeer('4821', NU);

    expect(window.sessionStorage.getItem(SESSIE_SLEUTEL)).toBeTypeOf('string');
    expect(window.localStorage.getItem(SESSIE_SLEUTEL)).toBeNull();
  });

  it('is meteen dicht na terug naar het kind', async () => {
    await zetPin('4821', '4821');
    await probeer('4821', NU);
    sluit();

    expect(isOuder(undefined, NU)).toBe(false);
    // De pincode blijft: terug naar het kind is geen ouder die weggaat.
    expect(isPinGezet()).toBe(true);
  });
});

describe('alles van dit apparaat halen', () => {
  it('haalt de ouder er ook af', async () => {
    await zetPin('4821', '4821');
    await probeer('0000', NU);
    await probeer('4821', NU);

    vergeetOuder();

    expect(isPinGezet()).toBe(false);
    expect(isOuder(undefined, NU)).toBe(false);
    expect(wachtSeconden(NU)).toBe(0);
  });
});
