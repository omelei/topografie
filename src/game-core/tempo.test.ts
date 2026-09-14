import { describe, expect, it } from 'vitest';
import {
  gemiddeldeDoos,
  mixVoor,
  TEMPO_MIN_GEZIEN,
  TEMPO_MIX,
  tempoVoor,
  type Tempo,
} from './tempo';
import { composeRound, roundPreview } from './leitner';
import type { ItemState, LeitnerBox } from './types';

function state(box: LeitnerBox, gezien = true): ItemState {
  return {
    itemId: 'x',
    box,
    laatsteReview: gezien ? '2026-09-01T10:00:00.000Z' : null,
    volgendeReview: '2026-09-02T10:00:00.000Z',
    goedCount: 0,
    foutCount: 0,
  };
}

/** `n` onderdelen, elk in de doos die `dozen` op die plek noemt. */
function setMet(dozen: readonly (LeitnerBox | null)[]) {
  const items = dozen.map((_, i) => ({ id: `i${i}` }));
  const states = new Map<string, ItemState>();
  dozen.forEach((doos, i) => {
    if (doos !== null) states.set(`i${i}`, { ...state(doos), itemId: `i${i}` });
  });
  return { items, states };
}

describe('hoe het met een set gaat', () => {
  it('zegt niets over een set die dit kind nauwelijks gezien heeft', () => {
    const { items, states } = setMet([1, 1, 1, null, null]);
    expect(gemiddeldeDoos(states, items)).toBeNull();
    expect(tempoVoor(null)).toBe('gewoon');
  });

  /**
   * De belangrijkste: ongeziene onderdelen tellen niet mee. Zouden ze als doos
   * één meetellen, dan zou elke grote set altijd "rustiger" zijn en zou het
   * gemiddelde vooral meten hoe vol de set is.
   */
  it('telt alleen wat gezien is', () => {
    const { items, states } = setMet([5, 5, 5, 5, 5, null, null, null, null, null]);
    expect(gemiddeldeDoos(states, items)).toBe(5);
    expect(tempoVoor(gemiddeldeDoos(states, items))).toBe('sneller');
  });

  it('heeft precies genoeg aan het minimum', () => {
    const net = setMet(Array.from({ length: TEMPO_MIN_GEZIEN }, () => 1 as LeitnerBox));
    expect(gemiddeldeDoos(net.states, net.items)).toBe(1);

    const eenTeWeinig = setMet(Array.from({ length: TEMPO_MIN_GEZIEN - 1 }, () => 1 as LeitnerBox));
    expect(gemiddeldeDoos(eenTeWeinig.states, eenTeWeinig.items)).toBeNull();
  });
});

describe('welk tempo daarbij hoort', () => {
  const gevallen: readonly (readonly [number, Tempo])[] = [
    [1, 'rustiger'],
    [1.9, 'rustiger'],
    [2, 'gewoon'],
    [3.5, 'gewoon'],
    [3.6, 'sneller'],
    [5, 'sneller'],
  ];

  it.each(gevallen)('gemiddelde doos %s is %s', (doos, verwacht) => {
    expect(tempoVoor(doos)).toBe(verwacht);
  });

  /**
   * Laag betekent mínder nieuw, niet minder. Een kind dat nog vecht met wat het
   * heeft, is niet geholpen met meer onbekende vragen — en een kind dat alles
   * in doos vier heeft, is niet geholpen met nog een rondje bekende stof.
   */
  it('verlaagt het nieuwe werk als het zwaar gaat en verhoogt het als het vlot gaat', () => {
    expect(TEMPO_MIX.rustiger.nieuw).toBeLessThan(TEMPO_MIX.gewoon.nieuw);
    expect(TEMPO_MIX.sneller.nieuw).toBeGreaterThan(TEMPO_MIX.gewoon.nieuw);
    expect(TEMPO_MIX.rustiger.opfris).toBeGreaterThan(TEMPO_MIX.gewoon.opfris);
  });

  it('houdt elke verhouding op één geheel', () => {
    for (const mix of Object.values(TEMPO_MIX)) {
      expect(mix.due + mix.nieuw + mix.opfris).toBeCloseTo(1, 10);
    }
  });

  it('geeft een nieuw kind gewoon de middelste verhouding', () => {
    expect(mixVoor(new Map(), [{ id: 'a' }])).toEqual(TEMPO_MIX.gewoon);
  });
});

/**
 * De tabel hierboven is een tabel. Dit is waar het om gaat: dat een échte ronde
 * meebeweegt, en dat de voorspelling ernaast hetzelfde zegt.
 */
describe('een ronde die meebeweegt', () => {
  /** Twaalf geziene onderdelen, allemaal aan de beurt, plus twintig nieuwe. */
  function set(doos: LeitnerBox) {
    const gezien = Array.from({ length: 12 }, (_, i) => ({ id: `oud${i}` }));
    const nieuw = Array.from({ length: 20 }, (_, i) => ({ id: `nieuw${i}` }));
    const states = new Map<string, ItemState>();
    for (const item of gezien) {
      states.set(item.id, {
        itemId: item.id,
        box: doos,
        laatsteReview: '2026-08-01T10:00:00.000Z',
        volgendeReview: '2026-08-02T10:00:00.000Z',
        goedCount: 0,
        foutCount: 0,
      });
    }
    return { items: [...gezien, ...nieuw], states };
  }

  const now = new Date('2026-09-01T10:00:00.000Z');
  const nieuwe = (gekozen: readonly { readonly id: string }[]) =>
    gekozen.filter((item) => item.id.startsWith('nieuw')).length;

  it('geeft een kind dat worstelt minder nieuwe vragen dan een kind dat vlot gaat', () => {
    const zwaar = set(1);
    const vlot = set(5);

    const rustig = composeRound({ ...zwaar, size: 10, now, rng: () => 0 });
    const snel = composeRound({ ...vlot, size: 10, now, rng: () => 0 });

    expect(nieuwe(rustig)).toBeLessThan(nieuwe(snel));
    expect(rustig).toHaveLength(10);
    expect(snel).toHaveLength(10);
  });

  /**
   * De voorspelling en de ronde moeten het eens zijn. Zou `roundPreview` de
   * oude vaste verhouding houden, dan belooft het scherm een ronde die het kind
   * niet krijgt — en dat is precies de zin waarmee dit product zijn eigen
   * methode uitlegt.
   */
  it('laat de voorspelling hetzelfde zeggen als de ronde doet', () => {
    for (const doos of [1, 5] as const) {
      const { items, states } = set(doos);
      const gekozen = composeRound({ items, states, size: 10, now, rng: () => 0 });
      const vooraf = roundPreview({ items, states, size: 10, now });

      expect(vooraf.total).toBe(gekozen.length);
      expect(vooraf.seen).toBe(gekozen.length - nieuwe(gekozen));
    }
  });
});
