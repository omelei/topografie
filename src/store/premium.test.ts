import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  activeer,
  claimPlek,
  controleerOpnieuw,
  dagenGeldig,
  grofLabel,
  toonApparaten,
  vervangPlek,
  isActief,
  isVerlopen,
  leesStand,
  normaliseerCode,
  PREMIUM_SLEUTEL,
  sleutelKoppen,
  verlooptBinnenkort,
  WAARSCHUW_VANAF_DAGEN,
  type PremiumStand,
} from './premium';

/** Premium on this device (ADR-116): what a code is, and how long it counts. */

describe('the key the app sends', () => {
  it('sends a publishable key on apikey only, since it is not a JWT', () => {
    expect(sleutelKoppen('sb_publishable_abc')).toEqual({
      'Content-Type': 'application/json',
      apikey: 'sb_publishable_abc',
    });
  });

  it('sends an older anon key, a JWT, on both headers', () => {
    expect(sleutelKoppen('eyJhbGciOi.x.y').Authorization).toBe('Bearer eyJhbGciOi.x.y');
  });
});

const NU = new Date('2026-09-13T12:00:00');

function stand(over: Partial<PremiumStand> = {}): PremiumStand {
  return {
    code: '7K3MQ9TX',
    geldigTot: '2027-09-13',
    gecontroleerd: NU.toISOString(),
    ...over,
  };
}

afterEach(() => {
  window.localStorage.clear();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

/**
 * Een premiumserver die één antwoord geeft, zonder netwerk. Geeft terug wat er
 * gevraagd is: welke functie, met welke argumenten.
 */
function server(antwoord: unknown) {
  vi.stubEnv('VITE_PREMIUM_URL', 'https://premium.leer.test');
  vi.stubEnv('VITE_PREMIUM_KEY', 'sb_publishable_test');
  const gevraagd: { functie: string; body: Record<string, unknown> }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (adres: string, init: RequestInit) => {
      gevraagd.push({
        functie: adres.split('/').at(-1) ?? '',
        body: JSON.parse(String(init.body)) as Record<string, unknown>,
      });
      return new Response(JSON.stringify(antwoord), { status: 200 });
    }),
  );
  return gevraagd;
}

describe('a premium code', () => {
  it('is the same code however it was typed', () => {
    expect(normaliseerCode('LEER-7K3M-Q9TX')).toBe('7K3MQ9TX');
    expect(normaliseerCode(' leer 7k3m q9tx ')).toBe('7K3MQ9TX');
    expect(normaliseerCode('7k3m-q9tx')).toBe('7K3MQ9TX');
    expect(normaliseerCode('')).toBe('');
  });

  it('counts until the end of its last day', () => {
    expect(isActief(stand(), NU)).toBe(true);
    expect(isActief(stand({ geldigTot: '2026-09-13' }), NU)).toBe(true);
    expect(isActief(stand({ geldigTot: '2026-09-12' }), NU)).toBe(false);
    expect(isActief(null, NU)).toBe(false);
  });

  it('keeps working for two weeks without the server, and not longer', () => {
    const dagen = (n: number) => new Date(NU.getTime() - n * 86_400_000).toISOString();
    expect(isActief(stand({ gecontroleerd: dagen(13) }), NU)).toBe(true);
    expect(isActief(stand({ gecontroleerd: dagen(15) }), NU)).toBe(false);
  });

  it('reads back only what it wrote, and nothing half-formed', () => {
    window.localStorage.setItem(PREMIUM_SLEUTEL, JSON.stringify(stand()));
    expect(leesStand()).toEqual(stand());
    window.localStorage.setItem(PREMIUM_SLEUTEL, '{"code":1}');
    expect(leesStand()).toBeNull();
    window.localStorage.setItem(PREMIUM_SLEUTEL, 'geen json');
    expect(leesStand()).toBeNull();
  });

  it('says so rather than failing when this build has no premium server', async () => {
    expect(await activeer('LEER-7K3M-Q9TX')).toEqual({ ok: false, reden: 'niet-ingesteld' });
    expect(await activeer('   ')).toEqual({ ok: false, reden: 'leeg' });
    expect(leesStand()).toBeNull();
  });
});

/** Het einde van een jaar zien aankomen (ADR-129). */
describe('een code die afloopt', () => {
  function stand(geldigTot: string, gecontroleerd: string): PremiumStand {
    return { code: '7K3MQ9TX', geldigTot, gecontroleerd };
  }

  const nu = new Date('2027-09-14T10:00:00');

  it('telt de laatste dag als nul en niet als verlopen', () => {
    const vandaagLaatste = stand('2027-09-14', nu.toISOString());
    expect(dagenGeldig(vandaagLaatste, nu)).toBe(0);
    expect(isVerlopen(vandaagLaatste, nu)).toBe(false);
    expect(verlooptBinnenkort(vandaagLaatste, nu)).toBe(true);
  });

  it('is verlopen vanaf de dag erna', () => {
    const gisteren = stand('2027-09-13', nu.toISOString());
    expect(dagenGeldig(gisteren, nu)).toBe(-1);
    expect(isVerlopen(gisteren, nu)).toBe(true);
    expect(verlooptBinnenkort(gisteren, nu)).toBe(false);
  });

  it('waarschuwt binnen een maand en daarvoor niet', () => {
    const net = stand('2027-10-14', nu.toISOString());
    expect(dagenGeldig(net, nu)).toBe(WAARSCHUW_VANAF_DAGEN);
    expect(verlooptBinnenkort(net, nu)).toBe(true);

    const nogNiet = stand('2027-10-15', nu.toISOString());
    expect(verlooptBinnenkort(nogNiet, nu)).toBe(false);
  });

  /**
   * De belangrijkste. `isActief` staat ook uit als de server twee weken niet
   * bereikbaar was, en dat is geen verlopen abonnement. Tegen een ouder zeggen
   * dat zijn code verlopen is terwijl hij nog een half jaar loopt, is erger dan
   * niets zeggen.
   */
  it('verwart een onbereikbare server niet met een verlopen code', () => {
    const langGeleden = stand('2028-09-14', '2027-08-01T10:00:00.000Z');
    expect(isActief(langGeleden, nu)).toBe(false);
    expect(isVerlopen(langGeleden, nu)).toBe(false);
    expect(verlooptBinnenkort(langGeleden, nu)).toBe(false);
  });

  it('zegt niets zonder code, en niet over een onleesbare datum', () => {
    expect(dagenGeldig(null, nu)).toBeNull();
    expect(isVerlopen(null, nu)).toBe(false);
    expect(dagenGeldig(stand('geen datum', nu.toISOString()), nu)).toBeNull();
  });
});

describe('een code die nog niet ingaat (ADR-225)', () => {
  it('zegt op welke dag hij ingaat, en wordt niet bewaard', async () => {
    server({ geldig: false, reden: 'nog-niet', geldig_van: '2027-09-01' });
    expect(await activeer('LEER-7K3M-Q9TX')).toEqual({
      ok: false,
      reden: 'nog-niet',
      geldigVan: '2027-09-01',
    });
    expect(leesStand()).toBeNull();
  });

  it('gaat open op de dag dat hij ingaat', async () => {
    server({ geldig: true, geldig_tot: '2028-08-31' });
    expect(await activeer('LEER-7K3M-Q9TX', NU)).toEqual({ ok: true, geldigTot: '2028-08-31' });
    expect(leesStand()?.geldigTot).toBe('2028-08-31');
  });
});

describe('een plek op de code (ADR-226)', () => {
  it('een ouder die de code invult, vraagt geen plek', async () => {
    const gevraagd = server({ geldig: true, geldig_tot: '2027-09-13', plek: false });
    expect(await activeer('LEER-7K3M-Q9TX', NU)).toEqual({
      ok: true,
      geldigTot: '2027-09-13',
      plek: false,
    });
    expect(gevraagd[0]?.body.p_claim).toBe(false);
    expect(leesStand()?.plek).toBe(false);
  });

  it('de eerste premiumstart vraagt er een, en daarna niet meer', async () => {
    window.localStorage.setItem(PREMIUM_SLEUTEL, JSON.stringify(stand({ plek: false })));
    const gevraagd = server({ geldig: true, geldig_tot: '2027-09-13', plek: true });
    expect(await claimPlek(NU)).toBe('ok');
    expect(gevraagd).toHaveLength(1);
    expect(gevraagd[0]?.body.p_claim).toBe(true);
    expect(typeof gevraagd[0]?.body.p_label).toBe('string');
    expect(leesStand()?.plek).toBe(true);

    expect(await claimPlek(NU)).toBe('ok');
    expect(gevraagd).toHaveLength(1);
  });

  it('een volle code houdt de code, maar zonder plek', async () => {
    window.localStorage.setItem(PREMIUM_SLEUTEL, JSON.stringify(stand({ plek: false })));
    server({ geldig: false, reden: 'vol', bezet: 3, plekken: 3 });
    expect(await claimPlek(NU)).toBe('vol');
    expect(leesStand()).toEqual(stand({ plek: false }));
  });

  it('zonder verbinding kan het kind toch beginnen', async () => {
    window.localStorage.setItem(PREMIUM_SLEUTEL, JSON.stringify(stand()));
    vi.stubEnv('VITE_PREMIUM_URL', 'https://premium.leer.test');
    vi.stubEnv('VITE_PREMIUM_KEY', 'sb_publishable_test');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('offline');
      }),
    );
    expect(await claimPlek(NU)).toBe('ok');
    expect(leesStand()?.plek).toBeUndefined();
  });

  it('een code die niet meer geldt, gaat eraf', async () => {
    window.localStorage.setItem(PREMIUM_SLEUTEL, JSON.stringify(stand()));
    server({ geldig: false, reden: 'onbekend' });
    expect(await claimPlek(NU)).toBe('weg');
    expect(leesStand()).toBeNull();
  });

  it('het wekelijkse nakijken vraagt een plek alleen terug als het er een had', async () => {
    const week = new Date(NU.getTime() + 8 * 86_400_000);
    window.localStorage.setItem(PREMIUM_SLEUTEL, JSON.stringify(stand({ plek: true })));
    let gevraagd = server({ geldig: false, reden: 'vol' });
    await controleerOpnieuw(week);
    expect(gevraagd[0]?.body.p_claim).toBe(true);
    // Vervangen of vrijgegeven, en de code is vol: de code blijft, de plek niet.
    expect(leesStand()?.plek).toBe(false);
    expect(leesStand()?.code).toBe('7K3MQ9TX');

    window.localStorage.setItem(PREMIUM_SLEUTEL, JSON.stringify(stand({ plek: false })));
    gevraagd = server({ geldig: true, geldig_tot: '2027-09-13', plek: false });
    await controleerOpnieuw(week);
    expect(gevraagd[0]?.body.p_claim).toBe(false);
  });
});

describe('het label van een apparaat (ADR-226)', () => {
  it('is grof, en altijd een woord uit de lijst', () => {
    const ua = {
      ipad: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      ipadAlsMac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
      iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      pixel: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) Mobile Safari/537.36',
      tab: 'Mozilla/5.0 (Linux; Android 13; SM-X200) Safari/537.36',
      chromebook: 'Mozilla/5.0 (X11; CrOS x86_64 15633.69.0) Chrome/119.0',
      windows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0',
      linux: 'Mozilla/5.0 (X11; Linux x86_64) Firefox/120.0',
    };
    expect(grofLabel(ua.ipad)).toBe('ipad');
    expect(grofLabel(ua.ipadAlsMac, 5)).toBe('ipad');
    expect(grofLabel(ua.ipadAlsMac, 0)).toBe('mac');
    expect(grofLabel(ua.iphone)).toBe('iphone');
    expect(grofLabel(ua.pixel)).toBe('android-telefoon');
    expect(grofLabel(ua.tab)).toBe('android-tablet');
    expect(grofLabel(ua.chromebook)).toBe('chromebook');
    expect(grofLabel(ua.windows)).toBe('windows');
    expect(grofLabel(ua.linux)).toBe('linux');
    expect(grofLabel('iets')).toBe('onbekend');
  });
});

describe('de apparaten van een code (ADR-226)', () => {
  it('komen als lijst, met dit apparaat erbij gemarkeerd', async () => {
    window.localStorage.setItem(PREMIUM_SLEUTEL, JSON.stringify(stand()));
    server({
      ok: true,
      bezet: 2,
      plekken: 3,
      vervangingen_over: 3,
      apparaten: [
        {
          plek: 'aaaa',
          label: 'ipad',
          toegevoegd: '2026-09-01',
          laatst_gezien: '2026-09-26',
          dit_apparaat: true,
        },
        {
          plek: 'bbbb',
          label: 'een-eigen-naam',
          toegevoegd: '2026-09-02',
          laatst_gezien: '2026-09-20',
          dit_apparaat: false,
        },
      ],
    });
    const lijst = await toonApparaten();
    expect(lijst.ok).toBe(true);
    if (!lijst.ok) return;
    expect(lijst.apparaten.map((apparaat) => apparaat.label)).toEqual(['ipad', 'onbekend']);
    expect(lijst.apparaten[0]?.ditApparaat).toBe(true);
    expect(leesStand()?.plek).toBe(true);
  });

  it('zonder plek alleen hoeveel er bezet zijn', async () => {
    window.localStorage.setItem(PREMIUM_SLEUTEL, JSON.stringify(stand({ plek: true })));
    server({ ok: false, reden: 'geen-plek', bezet: 3, plekken: 3 });
    expect(await toonApparaten()).toEqual({ ok: false, reden: 'geen-plek', bezet: 3, plekken: 3 });
    expect(leesStand()?.plek).toBe(false);
  });

  it('vervangen stopt bij de grens', async () => {
    window.localStorage.setItem(PREMIUM_SLEUTEL, JSON.stringify(stand({ plek: true })));
    const gevraagd = server({ ok: false, reden: 'grens' });
    expect(await vervangPlek('bbbb')).toEqual({ ok: false, reden: 'grens' });
    expect(gevraagd[0]).toMatchObject({
      functie: 'premium_plek_vervangen',
      body: { p_code: '7K3MQ9TX', p_plek: 'bbbb' },
    });
  });
});
