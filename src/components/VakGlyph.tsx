import { useId, type ReactNode } from 'react';
import type { IconProps } from './Icon';

/**
 * The six subject glyphs of the Merk en stijlgids (docs/leer.js, ADR-185).
 *
 * A subject's mark is the brand speaking, not a control: filled and round, as
 * the guide draws it on the subject's tile, where the rest of the interface
 * keeps the line icons of §E (Icon.tsx). That is why these live in a file of
 * their own and do not follow §E's one stroke weight.
 *
 * leer.js cuts the details out of each glyph in the tile's colour. Here they
 * are real holes — an even-odd path, or a mask where the hole is a pair of
 * clock hands or the letters Aa — so a glyph is one colour, `currentColor`,
 * and reads on the bright tile, on a quiet plate and on an emblem alike.
 *
 * Drawn on leer.js's own 48 grid, and shown cropped to its middle 38: on the
 * guide's tile the glyph fills the tile, and at 20px the margin of the full
 * grid made it a speck. Decorative unless given a label: the name of the
 * subject stands beside it wherever it appears.
 */
function Glyph({
  size = 24,
  label,
  children,
}: {
  readonly size?: number | undefined;
  readonly label?: string | undefined;
  readonly children: ReactNode;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="5 5 38 38"
      fill="currentColor"
      focusable="false"
      role={label ? 'img' : undefined}
      aria-hidden={label ? undefined : true}
    >
      {label ? <title>{label}</title> : null}
      {children}
    </svg>
  );
}

type GlyphProps = Omit<IconProps, 'children'>;

/** Topografie: a map pin, with its hole. */
export function TopoGlyph({ size, label }: GlyphProps) {
  return (
    <Glyph size={size} label={label}>
      <path
        fillRule="evenodd"
        d="M24 7C16 7 11 13 11 20.5C11 30 24 41 24 41S37 30 37 20.5C37 13 32 7 24 7ZM29.5 20A5.5 5.5 0 1 0 18.5 20A5.5 5.5 0 1 0 29.5 20Z"
      />
    </Glyph>
  );
}

/** Rekenen: a plus and a times, the two sums a child meets first. */
export function RekenenGlyph({ size, label }: GlyphProps) {
  return (
    <Glyph size={size} label={label}>
      <rect x="9" y="19" width="20" height="6" rx="3" />
      <rect x="16" y="12" width="6" height="20" rx="3" />
      <rect x="28" y="30" width="12" height="4.6" rx="2.3" transform="rotate(45 34 32.3)" />
      <rect x="28" y="30" width="12" height="4.6" rx="2.3" transform="rotate(-45 34 32.3)" />
    </Glyph>
  );
}

/** Taal: a speech bubble with Aa cut out of it. */
export function TaalGlyph({ size, label }: GlyphProps) {
  const masker = `taal-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`;
  return (
    <Glyph size={size} label={label}>
      <mask id={masker}>
        <rect width="48" height="48" fill="white" />
        {/* Aa in Baloo 2 ExtraBold, as outlines: a <text> here would be read as
            part of every button the glyph sits in. */}
        <path
          fill="black"
          d="M21.26 27.61L18.55 27.61Q18.49 27.80 18.46 27.98Q18.38 28.27 18.32 28.52Q18.25 28.78 18.19 29.02Q18.13 29.26 18.07 29.48Q17.87 29.55 17.63 29.61Q17.39 29.66 17.06 29.66Q16.31 29.66 15.94 29.40Q15.56 29.14 15.56 28.68Q15.56 28.46 15.62 28.25Q15.68 28.05 15.76 27.76Q15.88 27.28 16.12 26.52Q16.36 25.77 16.65 24.89Q16.94 24.01 17.23 23.17Q17.53 22.33 17.77 21.66Q18.01 21 18.13 20.68Q18.38 20.53 18.91 20.39Q19.43 20.26 19.94 20.26Q20.69 20.26 21.28 20.48Q21.86 20.70 22.01 21.18Q22.28 21.94 22.59 22.97Q22.90 24 23.22 25.11Q23.54 26.23 23.84 27.29Q24.14 28.34 24.37 29.18Q24.19 29.38 23.83 29.52Q23.47 29.65 22.97 29.65Q22.24 29.65 21.95 29.40Q21.67 29.16 21.53 28.64L21.26 27.61M20.02 22.62L19.93 22.62Q19.79 23.04 19.63 23.53Q19.46 24.02 19.28 24.57Q19.12 25.06 18.97 25.59L20.84 25.59Q20.69 25.05 20.56 24.54Q20.41 24 20.27 23.51Q20.14 23.02 20.02 22.62M28.52 27.88Q28.78 27.88 29.09 27.83Q29.39 27.77 29.54 27.68L29.54 26.48L28.46 26.57Q28.04 26.61 27.77 26.75Q27.50 26.91 27.50 27.20Q27.50 27.50 27.74 27.69Q27.97 27.88 28.52 27.88M28.40 21.98Q30.04 21.98 31.02 22.65Q32 23.32 32 24.73L32 28.09Q32 28.48 31.79 28.73Q31.57 28.98 31.27 29.16Q30.79 29.44 30.10 29.59Q29.41 29.74 28.52 29.74Q26.95 29.74 26 29.13Q25.04 28.52 25.04 27.30Q25.04 26.26 25.67 25.70Q26.29 25.15 27.56 25.02L29.53 24.80L29.53 24.70Q29.53 24.27 29.15 24.08Q28.76 23.89 28.04 23.89Q27.49 23.89 26.94 24.01Q26.39 24.13 25.96 24.31Q25.76 24.18 25.63 23.90Q25.49 23.62 25.49 23.32Q25.49 22.60 26.26 22.30Q26.69 22.14 27.29 22.06Q27.88 21.98 28.40 21.98"
        />
      </mask>
      <path
        mask={`url(#${masker})`}
        d="M10 11H38A4 4 0 0 1 42 15V31A4 4 0 0 1 38 35H22L14 41V35H10A4 4 0 0 1 6 31V15A4 4 0 0 1 10 11Z"
      />
    </Glyph>
  );
}

/** Klok: a clock face with its hands and centre cut out. */
export function KlokGlyph({ size, label }: GlyphProps) {
  const masker = `klok-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`;
  return (
    <Glyph size={size} label={label}>
      <mask id={masker}>
        <rect width="48" height="48" fill="white" />
        <rect x="22" y="13" width="4" height="13" rx="2" fill="black" />
        <rect
          x="22"
          y="22"
          width="4"
          height="10"
          rx="2"
          transform="rotate(-60 24 24)"
          fill="black"
        />
        <circle cx="24" cy="24" r="3" fill="black" />
      </mask>
      <circle cx="24" cy="24" r="16" mask={`url(#${masker})`} />
    </Glyph>
  );
}

/** Vlaggen: a pole and a flag in the wind. */
export function VlaggenGlyph({ size, label }: GlyphProps) {
  return (
    <Glyph size={size} label={label}>
      <rect x="11" y="7" width="4.5" height="35" rx="2.25" />
      <path d="M15 9C22 6 27 13 38 10V26C27 29 22 22 15 25Z" />
    </Glyph>
  );
}

/** Tijdvakken: an hourglass, with the sand that has run through cut out. */
export function TijdvakkenGlyph({ size, label }: GlyphProps) {
  return (
    <Glyph size={size} label={label}>
      <rect x="11" y="7" width="26" height="5" rx="2.5" />
      <rect x="11" y="36" width="26" height="5" rx="2.5" />
      <path d="M14 12H34L24 24Z" />
      <path fillRule="evenodd" d="M14 36H34L24 24ZM19 36H29L24 31Z" />
    </Glyph>
  );
}
