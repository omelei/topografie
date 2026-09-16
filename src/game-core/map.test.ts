import { describe, expect, it } from 'vitest';
import {
  afstandTotVorm,
  boxCentre,
  detailFor,
  dichtstbijzijndeVorm,
  fitView,
  helpTargetFor,
  helpTargets,
  keyboardOrder,
  padPunten,
  reachablePoints,
  MIN_TOUCH_PX,
  needsHelpTarget,
  smallestSidePx,
  type BoundingBox,
} from './map';

const VIEW = 1000;

describe('fitView', () => {
  it('relates view-box units and pixels both ways', () => {
    const fit = fitView(VIEW, 500);
    expect(fit.unitsPerPixel).toBe(2);
    expect(fit.pixelsPerUnit).toBe(0.5);
  });
});

describe('smallestSidePx', () => {
  it('measures the narrow side, because that is what limits a finger', () => {
    const fit = fitView(VIEW, 500);
    // 200 units wide and 40 tall, at half a pixel per unit: a long thin strip
    // that is 20 pixels across however far it stretches.
    expect(smallestSidePx([0, 0, 200, 40], fit)).toBe(20);
  });
});

describe('needsHelpTarget', () => {
  const fit = fitView(VIEW, 640);

  it('leaves a province alone', () => {
    // Utrecht, the smallest province, measured from the real data.
    expect(needsHelpTarget([0, 0, 179, 155], fit)).toBe(false);
  });

  it('helps an island', () => {
    // Vlieland, measured from the built content: 66 by 36 units.
    expect(needsHelpTarget([0, 0, 66, 36], fit)).toBe(true);
  });

  /**
   * Ameland is 72 units long and 16 wide. Judged on its longest side it looks
   * like a comfortable 50-pixel target; judged on the side a finger actually
   * has to land within, it is 11. Real content found this, not a unit test.
   */
  it('helps a long thin island that looks big enough', () => {
    expect(needsHelpTarget([0, 0, 72, 16], fit)).toBe(true);
  });

  it('helps a point, which has no size at all', () => {
    expect(needsHelpTarget([500, 500, 500, 500], fit)).toBe(true);
  });

  it('is a function of the screen, not the shape alone', () => {
    const shape: BoundingBox = [0, 0, 60, 60];
    // The same shape is fine on a digibord and too small on a phone.
    expect(needsHelpTarget(shape, fitView(VIEW, 1200))).toBe(false);
    expect(needsHelpTarget(shape, fitView(VIEW, 320))).toBe(true);
  });
});

describe('helpTargetFor', () => {
  const fit = fitView(VIEW, 500);

  it('returns nothing when the shape is already big enough', () => {
    expect(helpTargetFor([0, 0, 400, 400], fit)).toBeNull();
  });

  it('is exactly the minimum touch target across, whatever the scale', () => {
    for (const px of [320, 500, 1024, 1920]) {
      const target = helpTargetFor([500, 500, 502, 502], fitView(VIEW, px));
      expect(target).not.toBeNull();
      // Diameter in units, converted back to pixels, is the minimum.
      const diameterPx = (target as { r: number }).r * 2 * fitView(VIEW, px).pixelsPerUnit;
      expect(diameterPx).toBeCloseTo(MIN_TOUCH_PX, 6);
    }
  });

  it('sits on the label point rather than the box centre when there is one', () => {
    // A crescent-shaped province: the box centre is in open water, so a target
    // there would let a child hit the province by tapping the sea (ADR-019).
    const box: BoundingBox = [0, 0, 20, 20];
    expect(boxCentre(box)).toEqual([10, 10]);

    const target = helpTargetFor(box, fit, [3, 17]);
    expect(target?.cx).toBe(3);
    expect(target?.cy).toBe(17);
  });

  it('falls back to the box centre when no label point exists', () => {
    const target = helpTargetFor([0, 0, 20, 20], fit, null);
    expect(target?.cx).toBe(10);
    expect(target?.cy).toBe(10);
  });
});

describe('keyboardOrder', () => {
  it('reads north to south, then west to east', () => {
    const shapes = [
      { id: 'zuid-west', bbox: [0, 800, 100, 900] as BoundingBox },
      { id: 'noord-oost', bbox: [800, 0, 900, 100] as BoundingBox },
      { id: 'noord-west', bbox: [0, 0, 100, 100] as BoundingBox },
      { id: 'zuid-oost', bbox: [800, 800, 900, 900] as BoundingBox },
    ];

    expect(keyboardOrder(shapes).map((s) => s.id)).toEqual([
      'noord-west',
      'noord-oost',
      'zuid-west',
      'zuid-oost',
    ]);
  });

  it('treats a small vertical difference as the same row', () => {
    // Twenty units apart vertically is not a reason to reorder two provinces
    // that a reader would see as side by side.
    const shapes = [
      { id: 'rechts', bbox: [800, 0, 900, 100] as BoundingBox },
      { id: 'links', bbox: [0, 20, 100, 120] as BoundingBox },
    ];

    expect(keyboardOrder(shapes).map((s) => s.id)).toEqual(['links', 'rechts']);
  });

  it('does not mutate the array it is given', () => {
    const shapes = [
      { id: 'b', bbox: [0, 500, 10, 510] as BoundingBox },
      { id: 'a', bbox: [0, 0, 10, 10] as BoundingBox },
    ];
    keyboardOrder(shapes);
    expect(shapes.map((s) => s.id)).toEqual(['b', 'a']);
  });
});

describe('detailFor', () => {
  it('picks a level from the rendered size', () => {
    expect(detailFor(360)).toBe('overview');
    expect(detailFor(640)).toBe('region');
    expect(detailFor(1080)).toBe('detail');
  });
});

describe('reachablePoints', () => {
  const fit = fitView(1000, 640);
  const punt = (id: string, x: number, y: number) => ({ id, punt: [x, y] as const });

  it('leaves a sparse set alone', () => {
    // 200 units is 128 px at this fit: comfortably apart.
    const points = [punt('a', 0, 0), punt('b', 200, 0), punt('c', 400, 0)];

    expect(reachablePoints(points, fit, 'a').map((p) => p.id)).toEqual(['a', 'b', 'c']);
  });

  it('drops a point that would sit under its neighbour', () => {
    const points = [punt('a', 0, 0), punt('b', 10, 0), punt('c', 400, 0)];

    expect(reachablePoints(points, fit, 'a').map((p) => p.id)).toEqual(['a', 'c']);
  });

  /** The child must be able to answer, so the answer is never the one dropped. */
  it('keeps the target even when it is the crowded one', () => {
    const points = [punt('a', 0, 0), punt('b', 10, 0)];

    expect(reachablePoints(points, fit, 'b').map((p) => p.id)).toEqual(['b']);
  });

  /** Target-first selection must not become target-first rendering. */
  it('returns points in input order, so tab order does not reveal the answer', () => {
    const points = [punt('a', 0, 0), punt('b', 400, 0), punt('c', 800, 0)];

    expect(reachablePoints(points, fit, 'c').map((p) => p.id)).toEqual(['a', 'b', 'c']);
  });

  it('measures in pixels, so a smaller map shows fewer points', () => {
    const points = [punt('a', 0, 0), punt('b', 80, 0)];

    expect(reachablePoints(points, fitView(1000, 1200), 'a')).toHaveLength(2);
    expect(reachablePoints(points, fitView(1000, 400), 'a')).toHaveLength(1);
  });
});

/**
 * Een tik in zee, naast een land (ADR-146). Twee vierkante eilanden van tien
 * eenheden, twintig uit elkaar.
 */
describe('dichtstbijzijndeVorm', () => {
  const west = { id: 'west', d: 'M0 0L10 0L10 10L0 10Z', bbox: [0, 0, 10, 10] as BoundingBox };
  const oost = { id: 'oost', d: 'M30 0L40 0L40 10L30 10Z', bbox: [30, 0, 40, 10] as BoundingBox };

  it('leest de ringen van een pad', () => {
    expect(padPunten('M0 0L10 0L10 10ZM20 20L30 20L30 30Z')).toEqual([
      [
        [0, 0],
        [10, 0],
        [10, 10],
      ],
      [
        [20, 20],
        [30, 20],
        [30, 30],
      ],
    ]);
    expect(padPunten('M-5.5 2L3 -4Z')).toEqual([
      [
        [-5.5, 2],
        [3, -4],
      ],
    ]);
  });

  it('meet de afstand tot de kust, niet tot het midden', () => {
    expect(afstandTotVorm([13, 5], west.d)).toBe(3);
    expect(afstandTotVorm([13, 14], west.d)).toBe(5);
  });

  it('kiest het land dat het dichtst bij de tik ligt', () => {
    expect(dichtstbijzijndeVorm([14, 5], [west, oost], 8)).toBe('west');
    expect(dichtstbijzijndeVorm([26, 5], [west, oost], 8)).toBe('oost');
  });

  it('en niets als geen land binnen bereik ligt', () => {
    expect(dichtstbijzijndeVorm([20, 5], [west, oost], 8)).toBeNull();
    expect(dichtstbijzijndeVorm([5, 60], [west, oost], 8)).toBeNull();
  });
});

describe('helpTargets met ringOnderPx', () => {
  /**
   * Een groot land van dertig pixels naast een klein land van vier. Met de
   * standaardregel krijgen ze allebei een ring, en krimpt die van het kleine
   * mee; met de regel van een landenkaart houdt alleen het kleine land er een.
   */
  it('geeft een land dat zelf te raken is geen ring', () => {
    const fit = fitView(100, 100);
    const shapes = [
      { id: 'groot', bbox: [0, 0, 30, 30] as BoundingBox, punt: [15, 15] as const },
      { id: 'klein', bbox: [50, 13, 54, 17] as BoundingBox, punt: [52, 15] as const },
    ];

    const standaard = helpTargets(shapes, fit, (shape) => shape.punt);
    expect([...standaard.keys()].sort()).toEqual(['groot', 'klein']);
    expect(standaard.get('klein')?.r).toBeLessThan(MIN_TOUCH_PX / 2);

    const landen = helpTargets(shapes, fit, (shape) => shape.punt, MIN_TOUCH_PX, MIN_TOUCH_PX / 2);
    expect([...landen.keys()]).toEqual(['klein']);
    expect(landen.get('klein')?.r).toBe(MIN_TOUCH_PX / 2);
  });
});
