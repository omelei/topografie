import { MERK, MERK_KLEIN, MERK_NAALD_VANAF_PX } from '@/design/logo';

/**
 * The beeldmerk: the logo without the name (ADR-113).
 *
 * A ring with a needle pointing down into it — the same mark that stands
 * between the words in the wordmark (docs/logo/svg/beeldmerk-inkt.svg). Below
 * 20px the needle goes and the ring is drawn heavier, as the designer's
 * favicon of 16 is: at that size a needle is a smudge, and a ring is still a
 * ring.
 *
 * Drawn rather than fetched. The delivered SVGs carry a C2PA manifest larger
 * than the drawing inside it, and an `<img>` is one more request and one more
 * thing that renders as a broken box on a school network that blocks it. This
 * is a circle and a triangle.
 *
 * Silent, always. It is only used where the wordmark is a step away, and a
 * screen reader that reads the brand name twice on one page is worse than one
 * that reads it once. A mark that needs a name is the wordmark's job.
 */
export function Brandmark({
  size = 32,
  tone = 'ink',
  className,
}: {
  readonly size?: number;
  /** Ink on paper, or paper on ink. Never a module accent. */
  readonly tone?: 'ink' | 'paper';
  readonly className?: string;
}) {
  const klein = size < MERK_NAALD_VANAF_PX;
  const kleur = tone === 'ink' ? 'var(--inkt)' : 'var(--kaart)';

  return (
    <span className={className} aria-hidden="true">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${MERK.size} ${MERK.size}`}
        fill="none"
        focusable="false"
      >
        <circle
          cx={MERK.cx}
          cy={MERK.cy}
          r={klein ? MERK_KLEIN.r : MERK.r}
          stroke={kleur}
          strokeWidth={klein ? MERK_KLEIN.stroke : MERK.stroke}
        />
        {klein ? null : <path d={MERK.naald} fill={kleur} />}
      </svg>
    </span>
  );
}
