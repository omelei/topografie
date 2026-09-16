import { brand } from '@/config/brand';
import {
  WOORDBEELD,
  WOORDBEELD_LEER,
  WOORDBEELD_MIN_PX,
  WOORDBEELD_NU,
  WOORDBEELD_X_HOOGTE,
} from '@/design/woordbeeld';

/**
 * The wordmark: leernu, with "nu" in the colour of the mark (ADR-147).
 *
 * Drawn, not set. The letters are the designer's own outlines of Hanken
 * Grotesk 500 (docs/logo/svg/leernu-woordbeeld-positief.svg), so the name is
 * the same on every machine and the app ships no third typeface.
 *
 *   height        set the height, the width follows
 *   clear space   the x-height of the letters, on all four sides
 *   case          always lower, including at the start of a sentence
 *
 * On paper "leer" is ink and "nu" the brand's own colour, the positive of the
 * delivery. Reversed out of ink both are the light, the delivery's white
 * variant. The mark never takes a module accent: what a module changes is the
 * path behind the name — leer.nu/topo — and nothing about the mark itself.
 */

/** The letters' x-height, as a share of the height from baseline to the top of the l. */
const X_HEIGHT = WOORDBEELD_X_HOOGTE / WOORDBEELD.top;
/** Public Sans's x-height, 1034 units of 2000. */
const QUIET_X_HEIGHT = 1034 / 2000;

export interface WordmarkProps {
  /** Height in px from the baseline to the top of the l. */
  readonly height?: number;
  /** The mark on paper, or paper on ink. Never an accent. */
  readonly tone?: 'ink' | 'paper';
  /**
   * The clear space the logo asks for: the x-height on all four sides. On by
   * default, because a rule that has to be remembered at every call site is a
   * rule that gets forgotten at one of them.
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
  const drawn = Math.max(WOORDBEELD_MIN_PX, height);
  const nu = tone === 'ink' ? 'var(--merk)' : 'currentColor';

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        lineHeight: 1,
        color: tone === 'ink' ? 'var(--inkt)' : 'var(--kaart)',
        padding: clearSpace ? `${drawn * X_HEIGHT}px` : undefined,
      }}
    >
      {/* One accessible name for the whole mark. The drawing is hidden, so the
          name is read as a word and not as a picture of one. The domain is
          always written leer.nu; only the drawing is leernu. */}
      <span className="tk-sr-only">{path ? `${brand.name}/${path}` : brand.name}</span>

      {/* An SVG's baseline is its bottom edge, and the box ends on the letters'
          baseline, so the path behind the name lines up on the same baseline.
          The overshoot of the round letters below it is drawn outside the box. */}
      <svg
        width={(WOORDBEELD.width / WOORDBEELD.top) * drawn}
        height={drawn}
        viewBox={`0 -${WOORDBEELD.top} ${WOORDBEELD.width} ${WOORDBEELD.top}`}
        fill="currentColor"
        overflow="visible"
        aria-hidden="true"
        focusable="false"
      >
        <path d={WOORDBEELD_LEER} />
        <path d={WOORDBEELD_NU} fill={nu} />
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
