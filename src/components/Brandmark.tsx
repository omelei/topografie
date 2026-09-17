/**
 * Denker alone: the logo without the name (ADR-154).
 *
 * Drawn from public/denker-sprite.svg, the designer's sprite, so the colours
 * follow --denker-lijf, --denker-oog and --denker-punt from design/kleuren.css.
 * Below 24px the favicon instead: bigger eyes and no dot, as the delivery
 * asks.
 *
 * The expressions are feedback in the app only: never in place of the logo,
 * and at most one on a screen.
 *
 * Silent, always. The name is the logo's job.
 */
export const UITDRUKKINGEN = [
  'onthouden',
  'goed-gedaan',
  'iets-nieuws',
  'oefenen',
  'pauze',
] as const;

export type Uitdrukking = (typeof UITDRUKKINGEN)[number];

/** The smallest Denker is drawn with his dot; below it, the favicon. */
const KLEINSTE_PX = 24;

export function Brandmark({
  size = 32,
  uitdrukking = 'onthouden',
  className,
}: {
  readonly size?: number;
  readonly uitdrukking?: Uitdrukking;
  readonly className?: string;
}) {
  if (size < KLEINSTE_PX) {
    return <img src="/favicon.svg" alt="" width={size} height={size} className={className} />;
  }

  return (
    <svg width={size} height={size} className={className} aria-hidden="true" focusable="false">
      <use href={`/denker-sprite.svg#denker-${uitdrukking}`} />
    </svg>
  );
}
