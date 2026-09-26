import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  activeer,
  dagenGeldig,
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

/** Een premiumserver die één antwoord geeft, zonder netwerk. */
function server(antwoord: unknown) {
  vi.stubEnv('VITE_PREMIUM_URL', 'https://premium.leer.test');
  vi.stubEnv('VITE_PREMIUM_KEY', 'sb_publishable_test');
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify(antwoord), { status: 200 })),
  );
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
