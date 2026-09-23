import { afterEach, describe, expect, it } from 'vitest';
import {
  dagVan,
  leesProefRuw,
  PROEF_DAGEN,
  PROEF_SLEUTEL,
  proefBegin,
  proefStand,
  startProef,
} from './proef';

/** Midden op een dag, zodat een tijdzone er niets aan verschuift. */
const op = (dag: string) => new Date(`${dag}T12:00:00`);

afterEach(() => {
  window.localStorage.clear();
});

describe('proefStand (ADR-193)', () => {
  it('is er niet zonder begin', () => {
    expect(proefStand(null, op('2026-09-23'))).toEqual({ soort: 'geen' });
  });

  it('staat veertien dagen open, de dag van beginnen meegeteld', () => {
    const eerste = proefStand('2026-09-23', op('2026-09-23'));
    expect(eerste).toEqual({
      soort: 'loopt',
      dagenOver: PROEF_DAGEN,
      laatsteDag: '2026-10-06',
      eersteDagen: true,
    });

    const laatste = proefStand('2026-09-23', op('2026-10-06'));
    expect(laatste).toMatchObject({ soort: 'loopt', dagenOver: 1, laatsteDag: '2026-10-06' });

    expect(proefStand('2026-09-23', op('2026-10-07'))).toEqual({
      soort: 'voorbij',
      dagenGeleden: 1,
    });
  });

  it('zegt de eerste drie dagen wat er open staat, en daarna niet meer', () => {
    const dagen = ['2026-09-23', '2026-09-24', '2026-09-25', '2026-09-26'].map((dag) =>
      proefStand('2026-09-23', op(dag)),
    );
    expect(dagen.map((stand) => stand.soort === 'loopt' && stand.eersteDagen)).toEqual([
      true,
      true,
      true,
      false,
    ]);
  });

  it('telt over een zomertijdwissel heen in dagen, niet in uren', () => {
    expect(proefStand('2026-10-20', op('2026-10-26'))).toMatchObject({ dagenOver: 8 });
  });

  it('geeft een klok die achteruit staat geen proef van meer dan veertien dagen', () => {
    expect(proefStand('2026-09-23', op('2026-09-01'))).toMatchObject({
      soort: 'loopt',
      dagenOver: PROEF_DAGEN,
    });
  });
});

describe('startProef', () => {
  it('begint één keer, op de dag van vandaag', () => {
    startProef(op('2026-09-23'), true);
    startProef(op('2026-09-30'), true);
    expect(leesProefRuw()).toBe('2026-09-23');
    expect(proefBegin()).toBe('2026-09-23');
  });

  it('begint niet als het niet mag: geen premium te koop, of al een code', () => {
    startProef(op('2026-09-23'), false);
    expect(leesProefRuw()).toBeNull();
  });

  it('negeert wat geen datum is', () => {
    window.localStorage.setItem(PROEF_SLEUTEL, 'morgen');
    expect(proefBegin()).toBeNull();
  });

  it('schrijft de dag in de eigen tijdzone', () => {
    expect(dagVan(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
  });
});
