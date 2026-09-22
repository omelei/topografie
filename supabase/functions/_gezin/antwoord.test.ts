import { describe, expect, it } from 'vitest';
import { leesAntwoord } from './antwoord';

/**
 * Wat een leeg antwoord is, en waarom dat geen fout is (ADR-155).
 *
 * Het eerste geval hieronder is de bug die `kind-inloggen` in productie 500 liet
 * geven: `gezin_inlog_mislukt` geeft `void` terug, PostgREST maakt daar 204 van,
 * en `Response.json()` gooit op een leeg lijf. Dat is nooit opgevallen omdat de
 * adapterlaag geen toetsen heeft — die staat er met opzet buiten, want alles wat
 * een beslissing is hoort in `inloggen.ts`. Maar dit ís een beslissing: wat je
 * doet met een antwoord dat geen inhoud heeft.
 */
describe('het antwoord van PostgREST lezen', () => {
  it('leest een leeg 204-antwoord als niets, en gooit niet', async () => {
    await expect(leesAntwoord(new Response(null, { status: 204 }), 'test')).resolves.toBeNull();
  });

  it('leest ook een 200 zonder inhoud als niets', async () => {
    const leeg = new Response('', { status: 200, headers: { 'content-length': '0' } });
    await expect(leesAntwoord(leeg, 'test')).resolves.toBeNull();
  });

  it('geeft terug wat er wél staat', async () => {
    const vol = new Response(JSON.stringify({ ja: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
    await expect(leesAntwoord(vol, 'test')).resolves.toEqual({ ja: true });
  });

  it('leest een enkele waarde, want een RPC geeft er zo een terug', async () => {
    const waar = new Response('true', {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
    await expect(leesAntwoord(waar, 'gezin_inlog_mag')).resolves.toBe(true);
  });

  it('gooit bij een foutstatus, met erbij waar het misging', async () => {
    const stuk = new Response('{}', { status: 500 });
    await expect(leesAntwoord(stuk, 'gezin_inlog_mag')).rejects.toThrow('gezin_inlog_mag gaf 500');
  });
});
