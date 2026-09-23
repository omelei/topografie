import { describe, expect, it } from 'vitest';
import { leesTerugkeer } from './terugkeer';

const NU = new Date('2026-09-23T12:00:00.000Z');

/** Een JWT zoals Supabase hem uitgeeft, in UTF-8; de handtekening leest de app niet. */
function jwt(inhoud: Record<string, unknown>): string {
  const deel = (waarde: unknown) =>
    btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(waarde))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  return `${deel({ alg: 'HS256', typ: 'JWT' })}.${deel(inhoud)}.handtekening`;
}

function link(velden: Record<string, string>): string {
  return `#${new URLSearchParams(velden).toString()}`;
}

describe('de link uit een herstelmail', () => {
  it('leest de sessie en wie het is', () => {
    const token = jwt({ sub: 'ouder-1', email: 'ouder@example.nl' });
    const uit = leesTerugkeer(
      link({
        access_token: token,
        refresh_token: 'vernieuw-1',
        expires_in: '3600',
        token_type: 'bearer',
        type: 'recovery',
      }),
      NU,
    );
    expect(uit).toEqual({
      soort: 'herstel',
      sessie: {
        gebruikerId: 'ouder-1',
        email: 'ouder@example.nl',
        token,
        vernieuwToken: 'vernieuw-1',
        verlooptOp: '2026-09-23T13:00:00.000Z',
      },
    });
  });

  it('leest ook een adres met tekens buiten ASCII', () => {
    const token = jwt({ sub: 'ouder-2', email: 'zoë@example.nl' });
    const uit = leesTerugkeer(
      link({ access_token: token, refresh_token: 'v', expires_in: '3600', type: 'recovery' }),
      NU,
    );
    expect(uit?.soort === 'herstel' && uit.sessie.email).toBe('zoë@example.nl');
  });

  it('noemt een verlopen of gebruikte link verlopen', () => {
    expect(
      leesTerugkeer(
        link({
          error: 'access_denied',
          error_code: 'otp_expired',
          error_description: 'Email link is invalid or has expired',
        }),
        NU,
      ),
    ).toEqual({ soort: 'verlopen' });
  });

  it('noemt een link die niet te lezen is ook verlopen, en niet een sessie', () => {
    const kapot = link({
      access_token: 'geen-jwt',
      refresh_token: 'v',
      expires_in: '3600',
      type: 'recovery',
    });
    expect(leesTerugkeer(kapot, NU)).toEqual({ soort: 'verlopen' });
    const zonderVernieuw = link({
      access_token: jwt({ sub: 'x', email: 'x@example.nl' }),
      expires_in: '3600',
      type: 'recovery',
    });
    expect(leesTerugkeer(zonderVernieuw, NU)).toEqual({ soort: 'verlopen' });
  });

  /**
   * De link in een bevestigingsmail brengt ook een sessie mee. Die wordt niet
   * gelezen: de ouder logt daarna gewoon in, en een tweede weg naar binnen zou
   * er ook een zijn voor een link die iemand anders heeft gemaakt.
   */
  it('laat alles liggen wat geen herstellink is', () => {
    expect(leesTerugkeer('', NU)).toBeNull();
    expect(leesTerugkeer('#diagnose', NU)).toBeNull();
    expect(
      leesTerugkeer(
        link({
          access_token: jwt({ sub: 'x', email: 'x@example.nl' }),
          refresh_token: 'v',
          expires_in: '3600',
          type: 'signup',
        }),
        NU,
      ),
    ).toBeNull();
  });
});
