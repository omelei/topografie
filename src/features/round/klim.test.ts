import { describe, expect, it } from 'vitest';
import { klimVan } from './klim';
import { emptyState, MAX_BOX, ONTHOUDEN_BOX, review, type ItemState } from '@/game-core';

const nu = new Date('2026-09-14T10:00:00');

function inDoos(box: ItemState['box']): ItemState {
  return {
    itemId: 'x',
    box,
    laatsteReview: '2026-09-01T10:00:00.000Z',
    volgendeReview: '2026-09-02T10:00:00.000Z',
    goedCount: 0,
    foutCount: 0,
  };
}

describe('de stap omhoog', () => {
  /**
   * De belangrijkste regel: een val is niet te zien. ADR-048 maakt het niet
   * weten overal goedkoop, en een zichtbare demotie draait dat in één beeld
   * terug.
   */
  it('toont niets bij een fout antwoord', () => {
    const vorige = inDoos(3);
    expect(klimVan(vorige, review(vorige, false, nu), false)).toBeNull();
  });

  it('telt een eerste goede beurt vanaf de grond en niet vanaf doos één', () => {
    const leeg = emptyState('x');
    const klim = klimVan(leeg, review(leeg, true, nu), true);
    expect(klim?.van).toBe(0);
    expect(klim?.naar).toBe(2);
  });

  it('schuift één trede op', () => {
    const vorige = inDoos(2);
    const klim = klimVan(vorige, review(vorige, true, nu), true);
    expect(klim).toMatchObject({ van: 2, naar: 3, onthouden: false, treden: MAX_BOX });
  });

  /** Doos vier is de grens waar dit product al "dit onthoud je" zei. */
  it('markeert het passeren van de grens van onthouden', () => {
    const vorige = inDoos((ONTHOUDEN_BOX - 1) as ItemState['box']);
    expect(klimVan(vorige, review(vorige, true, nu), true)?.onthouden).toBe(true);

    const alOnthouden = inDoos(ONTHOUDEN_BOX);
    expect(klimVan(alOnthouden, review(alOnthouden, true, nu), true)?.onthouden).toBe(false);
  });

  /** Bovenaan is er niets meer te klimmen, en dan hoort er niets te staan. */
  it('toont niets als er niets beweegt', () => {
    const bovenaan = inDoos(MAX_BOX);
    expect(klimVan(bovenaan, review(bovenaan, true, nu), true)).toBeNull();
  });
});
