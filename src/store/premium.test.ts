import { afterEach, describe, expect, it } from 'vitest';
import {
  activeer,
  isActief,
  leesStand,
  normaliseerCode,
  PREMIUM_SLEUTEL,
  sleutelKoppen,
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
});

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
