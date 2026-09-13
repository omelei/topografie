import { brand } from '@/config/brand';
import { LOCKUP, LOCKUP_GLYPHS, LOCKUP_MERK, LOCKUP_MIN_PX, LOCKUP_X_HOOGTE } from '@/design/logo';

/**
 * The wordmark: leer, the ring with its needle, nu (ADR-113).
 *
 * Drawn, not set. The letters are Hanken Grotesk 600 cut to outlines from the
 * font in the designer's own uitwerking (docs/logo, tools/logo/maak-logo.py),
 * so the name is the same on every machine and the app ships no third
 * typeface. Between the words stands the beeldmerk, lifted just off the
 * baseline, as the uitwerking draws it.
 *
 *   height        set the height, the width follows
 *   clear space   the diameter of the ring, on all four sides
 *   case          always lower, including at the start of a sentence
 *
 * The mark never takes a module accent. What a module changes is the path behind
 * the name — leer.nu/topo — and nothing about the mark itself.
 */

/** The ring's outer diameter, as a share of the box's height. */
const CLEAR_SPACE = (2 * LOCKUP_MERK.r + LOCKUP_MERK.stroke) / LOCKUP.height;
/** The drawn letters' x-height, as a share of the box's height. */
const X_HEIGHT = LOCKUP_X_HOOGTE / LOCKUP.height;
/** Public Sans's x-height, 1034 units of 2000. */
const QUIET_X_HEIGHT = 1034 / 2000;

export interface WordmarkProps {
  /** Height in px of the letters' box, from the baseline to the top of the l. */
  readonly height?: number;
  /** Ink on paper, or paper on ink. Never an accent. */
  readonly tone?: 'ink' | 'paper';
  /**
   * The clear space the logo asks for: the ring's diameter on all four sides.
   * On by default, because a rule that has to be remembered at every call site
   * is a rule that gets forgotten at one of them.
   */
  readonly clearSpace?: boolean;
  /**
   * The module path behind the name, without the slash — "topo" renders
   * leer.nu/topo. Only inside the module itself and in navigation: never on a
   * website header, an app icon or an invoice.
   */
  readonly path?: string;
  readonly className?: string;
}

export function Wordmark({
  height = 32,
  tone = 'ink',
  clearSpace = true,
  path,
  className,
}: WordmarkProps) {
  const drawn = Math.max(LOCKUP_MIN_PX, height);

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        lineHeight: 1,
        color: tone === 'ink' ? 'var(--inkt)' : 'var(--kaart)',
        padding: clearSpace ? `${drawn * CLEAR_SPACE}px` : undefined,
      }}
    >
      {/* One accessible name for the whole mark. The drawing is hidden, so the
          name is read as a word and not as a picture of one. */}
      <span className="tk-sr-only">{path ? `${brand.name}/${path}` : brand.name}</span>

      {/* An SVG's baseline is its bottom edge, which is where the letters stand,
          so the path behind the name lines up on the same baseline. The
          overshoot of the round letters below it is drawn outside the box. */}
      <svg
        width={(LOCKUP.width / LOCKUP.height) * drawn}
        height={drawn}
        viewBox={`0 0 ${LOCKUP.width} ${LOCKUP.height}`}
        fill="currentColor"
        overflow="visible"
        aria-hidden="true"
        focusable="false"
      >
        {LOCKUP_GLYPHS.map((d) => (
          <path key={d} d={d} />
        ))}
        <circle
          cx={LOCKUP_MERK.cx}
          cy={LOCKUP_MERK.cy}
          r={LOCKUP_MERK.r}
          fill="none"
          stroke="currentColor"
          strokeWidth={LOCKUP_MERK.stroke}
        />
        <path d={LOCKUP_MERK.naald} />
      </svg>

      {path ? (
        // The quiet family at 400 in tertiary ink, with its x-height matched to
        // the drawn letters, so the name keeps the emphasis and "leer.nu/topo"
        // still reads as one line.
        <span
          aria-hidden="true"
          style={{
            fontFamily: 'var(--font-tekst)',
            fontWeight: 400,
            fontSize: `${(drawn * X_HEIGHT) / QUIET_X_HEIGHT}px`,
            color: 'var(--tekst-tertiair)',
          }}
        >
          /{path}
        </span>
      ) : null}
    </span>
  );
}
