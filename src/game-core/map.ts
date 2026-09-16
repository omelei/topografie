/**
 * The geometry a map renderer needs, with no DOM in sight.
 *
 * All of it exists to answer one question the spec asks and no map library
 * answers for you: **can a child actually hit this?** Vlieland is roughly a
 * thousandth of the Netherlands. Rendered on a Chromebook it is four pixels
 * wide, and four pixels is not a target, it is a taunt. Spec section 8 asks for
 * 44px and this product uses 48, so anything smaller needs help.
 *
 * Pure and DOM-free on purpose (ADR-015): a hit target that is only correct
 * inside a browser cannot be tested, and this is exactly the kind of arithmetic
 * that is wrong by a factor of two without anyone noticing.
 */

/** [minX, minY, maxX, maxY] in view-box units. */
export type BoundingBox = readonly [number, number, number, number];

export const MIN_TOUCH_PX = 48;

export interface ViewFit {
  /** View-box units per CSS pixel. */
  readonly unitsPerPixel: number;
  /** CSS pixels per view-box unit. */
  readonly pixelsPerUnit: number;
  readonly renderedPx: number;
}

/**
 * How a square view box maps onto a square of screen.
 *
 * The map is always rendered square and uniformly scaled — the shape of a
 * country is not ours to stretch, and a child who learns a squashed Netherlands
 * has learned something false.
 */
export function fitView(viewBoxSize: number, renderedPx: number): ViewFit {
  return {
    unitsPerPixel: viewBoxSize / renderedPx,
    pixelsPerUnit: renderedPx / viewBoxSize,
    renderedPx,
  };
}

export function boxWidth(box: BoundingBox): number {
  return box[2] - box[0];
}

export function boxHeight(box: BoundingBox): number {
  return box[3] - box[1];
}

export function boxCentre(box: BoundingBox): readonly [number, number] {
  return [(box[0] + box[2]) / 2, (box[1] + box[3]) / 2];
}

/**
 * The shape's **smallest** on-screen dimension, in CSS pixels.
 *
 * The smallest, not the largest, and the difference is not academic: Ameland is
 * 72 units long and 16 wide, so on a school laptop it is a 50-pixel streak of
 * land that is 11 pixels tall. Measuring the long side calls that comfortable.
 * A finger aiming at it disagrees, and so does WCAG 2.5.8, which asks for a
 * minimum in both directions.
 */
export function smallestSidePx(box: BoundingBox, fit: ViewFit): number {
  return Math.min(boxWidth(box), boxHeight(box)) * fit.pixelsPerUnit;
}

export function needsHelpTarget(box: BoundingBox, fit: ViewFit, minPx = MIN_TOUCH_PX): boolean {
  return smallestSidePx(box, fit) < minPx;
}

export interface HelpTarget {
  readonly cx: number;
  readonly cy: number;
  /** Radius in view-box units, so it stays 48px however the map is scaled. */
  readonly r: number;
}

/**
 * An invisible circle that makes a small shape reachable.
 *
 * Centred on the label point rather than the bounding-box centre where one
 * exists: for a shape like Zeeland the box centre sits in open water, and a
 * target centred there would let a child hit the province by tapping the sea.
 * That is the same error as the IJsselmeer inside Noord-Holland (ADR-019) —
 * rewarding a click that is geographically wrong.
 */
export function helpTargetFor(
  box: BoundingBox,
  fit: ViewFit,
  labelPoint?: readonly [number, number] | null,
  minPx = MIN_TOUCH_PX,
): HelpTarget | null {
  if (!needsHelpTarget(box, fit, minPx)) return null;

  const [cx, cy] = labelPoint ?? boxCentre(box);
  return { cx, cy, r: (minPx / 2) * fit.unitsPerPixel };
}

/**
 * Orders shapes for keyboard navigation: north to south, then west to east.
 *
 * Reading order over source order, because tabbing through a map should feel
 * like reading one. Source order is whatever the data provider happened to
 * choose, which for a child using only a keyboard is no order at all.
 */
export function keyboardOrder<T extends { readonly bbox: BoundingBox }>(shapes: readonly T[]): T[] {
  return [...shapes].sort((a, b) => {
    const [ax, ay] = boxCentre(a.bbox);
    const [bx, by] = boxCentre(b.bbox);
    // A band of 60 units counts as "the same latitude", so provinces that sit
    // side by side are not interleaved by a few units of vertical drift.
    if (Math.abs(ay - by) > 60) return ay - by;
    return ax - bx;
  });
}

/**
 * Which detail level to load for a given rendered size.
 *
 * Deliberately conservative: the cost of too much detail is a slow map on a
 * school Chromebook, and the cost of too little is a coastline that looks wrong.
 * On the devices in spec section 8 the map is rarely above 700px, so `region` is
 * the working default and `detail` is for zooming in.
 */
export function detailFor(renderedPx: number): 'overview' | 'region' | 'detail' {
  if (renderedPx < 420) return 'overview';
  if (renderedPx < 900) return 'region';
  return 'detail';
}

/**
 * Which answer points may be drawn at once, so every one of them is reachable.
 *
 * Eighty cities on a map of the Netherlands is not a map, it is a smear.
 * Beverwijk and Heemskerk land six pixels apart on a phone; measured over the
 * whole set, 77 of the 80 have a neighbour closer than a fingertip, and a round
 * of fifteen drawn at random contains an unhittable pair 99.9% of the time. A
 * child who taps the right place and is told they are wrong has been failed by
 * the interface, not by their knowledge.
 *
 * So the rule that already governs shapes governs points too: nothing that can
 * be answered is drawn closer to another answer than {@link MIN_TOUCH_PX}. The
 * target is always kept — it must be answerable — and the rest are taken in
 * input order, which for the cities is descending population. That gives the
 * pleasant side effect that the neighbour who survives is the better-known one:
 * a child choosing near Rotterdam is offered Rotterdam, not Schiedam.
 *
 * For the twelve capitals and the six bodies of water this changes nothing —
 * they already clear the threshold — which is the point: one rule, no set-specific
 * branch, and the sparse sets keep showing every option.
 *
 * The result comes back in **input order**, not target-first. Which point is the
 * answer must not be visible in the order they are drawn: a renderer that puts
 * the target first hands it to the first child who presses Tab.
 */
export function reachablePoints<
  T extends { readonly id: string; readonly punt: readonly [number, number] },
>(points: readonly T[], fit: ViewFit, targetId: string | null, minPx: number = MIN_TOUCH_PX): T[] {
  const minUnits = minPx * fit.unitsPerPixel;
  const target = points.find((point) => point.id === targetId);
  const rest = points.filter((point) => point.id !== targetId);
  const kept: T[] = target ? [target] : [];

  for (const point of rest) {
    const clashes = kept.some((other) => {
      const dx = point.punt[0] - other.punt[0];
      const dy = point.punt[1] - other.punt[1];
      return Math.hypot(dx, dy) < minUnits;
    });
    if (!clashes) kept.push(point);
  }

  const order = new Map(points.map((point, index) => [point.id, index]));
  return kept.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

/**
 * The help targets a map may actually draw: shrunk so that no two of them
 * touch, and dropped where shrinking left nothing worth pressing.
 *
 * A ring round a shape too small to hit does two things at once. It says "there
 * is more room here than the coastline suggests", and it *takes over* as the
 * target — the shape underneath stops being pressable, because two overlapping
 * hit areas would be worse than one small one.
 *
 * That is exactly right on the Wadden islands: five specks, far apart, each with
 * a ring of its own reaching nothing else. It goes wrong the moment the specks
 * are crowded. On a map of the world on a phone almost every country is too
 * small by the same measure, and full-size rings would pack together — a child
 * aiming at Togo landing inside Ghana's, which is a wrong answer the map handed
 * them.
 *
 * Two rules, in this order.
 *
 * **Shrink, do not drop.** Each ring is pulled in to half the distance to its
 * nearest neighbour, so the Vatican and San Marino end up with a ring each at
 * two thirds size rather than one overlapping pair or nothing at all. A smaller
 * target is still a hundred times the Vatican's own outline.
 *
 * **Then drop what shrinking ruined.** Below half the minimum touch size a ring
 * is no longer something a finger can aim at, and the shape's own coastline is
 * as good — so it goes, and the outline becomes the target again. On a world
 * map at phone size that is nearly all of them, which is the honest answer: a
 * country three pixels wide is hard to hit, exactly as it is on paper
 * (ADR-086).
 *
 * Keyed by shape id, so a caller looks up rather than recomputes.
 *
 * **`ringOnderPx`: vanaf welke maat een vorm een ring krijgt** (ADR-146).
 * Standaard dezelfde 48 als de ring zelf. Op een landenkaart is dat de helft:
 * een land van dertig pixels is zelf te raken — WCAG 2.5.8 vraagt 24 — en gaf
 * het toch een ring, dan kromp de ring van zijn kleine buurman mee. Zo verloor
 * Luxemburg zijn ring aan België, dat er geen nodig had.
 */
export function helpTargets<T extends { readonly id: string; readonly bbox: BoundingBox }>(
  shapes: readonly T[],
  fit: ViewFit,
  labelOf: (shape: T) => readonly [number, number] | null | undefined,
  minPx = MIN_TOUCH_PX,
  ringOnderPx = minPx,
): Map<string, HelpTarget> {
  const wanted: HelpTarget[] = [];
  const ids: string[] = [];
  for (const shape of shapes) {
    if (!needsHelpTarget(shape.bbox, fit, ringOnderPx)) continue;
    const target = helpTargetFor(shape.bbox, fit, labelOf(shape), minPx);
    if (target !== null) {
      wanted.push(target);
      ids.push(shape.id);
    }
  }

  const floor = (minPx / 2) * fit.unitsPerPixel;

  const kept = new Map<string, HelpTarget>();
  for (let i = 0; i < wanted.length; i++) {
    const mine = wanted[i] as HelpTarget;
    let r = mine.r;
    for (let k = 0; k < wanted.length; k++) {
      if (k === i) continue;
      const other = wanted[k] as HelpTarget;
      r = Math.min(r, Math.hypot(other.cx - mine.cx, other.cy - mine.cy) / 2);
    }
    // The diameter, against half the minimum: a ring narrower than that is not
    // a target, it is a decoration on top of one.
    if (r * 2 >= floor) kept.set(ids[i] as string, { cx: mine.cx, cy: mine.cy, r });
  }
  return kept;
}

/**
 * De ringen van een SVG-pad, als lijsten punten.
 *
 * De kaarten van dit product schrijven alleen absolute M, L en Z
 * (`tools/content/simplify.mjs`), dus meer hoeft dit niet te lezen. Een pad met
 * iets anders erin levert minder punten op en geen fout: dan is een land iets
 * moeilijker te benaderen, en dat is geen reden voor een kaart die niet laadt.
 */
export function padPunten(d: string): (readonly [number, number])[][] {
  const ringen: (readonly [number, number])[][] = [];
  let huidig: (readonly [number, number])[] = [];
  for (const deel of d.matchAll(/([MLZ])\s*(-?[\d.]+)?[\s,]*(-?[\d.]+)?/g)) {
    const [, opdracht, x, y] = deel;
    if (opdracht === 'Z') continue;
    if (opdracht === 'M' && huidig.length > 0) {
      ringen.push(huidig);
      huidig = [];
    }
    if (x !== undefined && y !== undefined) huidig.push([Number(x), Number(y)]);
  }
  if (huidig.length > 0) ringen.push(huidig);
  return ringen;
}

/** De afstand van een punt tot een lijnstuk, in view-box-eenheden. */
function afstandTotLijn(
  p: readonly [number, number],
  a: readonly [number, number],
  b: readonly [number, number],
): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const lengte = dx * dx + dy * dy;
  const t =
    lengte === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lengte));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

/** De kortste afstand van een punt tot de kustlijn van een vorm. */
export function afstandTotVorm(p: readonly [number, number], d: string): number {
  let kortst = Infinity;
  for (const ring of padPunten(d)) {
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i] as readonly [number, number];
      const b = ring[(i + 1) % ring.length] as readonly [number, number];
      kortst = Math.min(kortst, afstandTotLijn(p, a, b));
    }
  }
  return kortst;
}

/**
 * Het land dat bedoeld was, bij een tik in zee (ADR-146).
 *
 * Een tik die geen land raakt deed niets. Op de wereldkaart is dat de tik die
 * het vaakst gebeurt: een eiland van drie pixels mis je met je vinger, en je
 * landt in het water ernaast. Nu telt zo'n tik voor het dichtstbijzijnde land,
 * zolang dat binnen `maxEenheden` ligt — een halve vingertop.
 *
 * **Alleen in zee.** Een tik óp een land blijft dat land, ook als er een klein
 * land vlakbij ligt: wie op België drukt, bedoelt België. En alleen op een
 * landenkaart, niet op Nederland: daar is een tik in het IJsselmeer bewust geen
 * Noord-Holland (ADR-019).
 *
 * Eerst op de bounding box gefilterd, zodat een tik niet 167 kustlijnen hoeft af
 * te lopen om er vier te vinden die in de buurt komen.
 */
export function dichtstbijzijndeVorm<
  T extends { readonly id: string; readonly d: string; readonly bbox: BoundingBox },
>(p: readonly [number, number], vormen: readonly T[], maxEenheden: number): string | null {
  let beste: { id: string; afstand: number } | null = null;
  for (const vorm of vormen) {
    const [minX, minY, maxX, maxY] = vorm.bbox;
    const ver =
      p[0] < minX - maxEenheden ||
      p[0] > maxX + maxEenheden ||
      p[1] < minY - maxEenheden ||
      p[1] > maxY + maxEenheden;
    if (ver) continue;
    const afstand = afstandTotVorm(p, vorm.d);
    if (afstand <= maxEenheden && (beste === null || afstand < beste.afstand)) {
      beste = { id: vorm.id, afstand };
    }
  }
  return beste?.id ?? null;
}
