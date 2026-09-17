import { brand } from '@/config/brand';

/**
 * The logo: Denker and the name, lying (ADR-154).
 *
 * The designer's own file from docs/logo/logo, served from public/logo. Only
 * shapes, so it needs no typeface. Its name is the picture's alt text, which is
 * why Denker alone (Brandmark) stays silent.
 *
 *   height   set the height, the width follows
 *   tone     the colour version on room or white, the white one on ink
 *
 * Never smaller than 88px wide: below that, Denker alone.
 */

/** Width over height of leernu-logo-liggend-*.svg (viewBox 4231.13 × 936.75). */
const VERHOUDING = 4231.13 / 936.75;

const BESTAND = {
  ink: '/logo/leernu-logo-liggend-kleur.svg',
  paper: '/logo/leernu-logo-liggend-wit.svg',
} as const;

export interface WordmarkProps {
  /** Height in px. Leave it out when a class sets it, as `tk-logo` does. */
  readonly height?: number;
  /** The colour version, or the white one on a dark surface. */
  readonly tone?: 'ink' | 'paper';
  readonly className?: string;
}

export function Wordmark({ height, tone = 'ink', className }: WordmarkProps) {
  return (
    <img
      src={BESTAND[tone]}
      alt={brand.name}
      height={height}
      width={height === undefined ? undefined : Math.round(height * VERHOUDING)}
      className={className}
    />
  );
}
