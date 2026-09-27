import { useId } from 'react';

/**
 * Denker, the mascot: the logo without the name (ADR-154, ADR-182), drawn in
 * the Strip style since ADR-237: big white eyes with a pupil in nacht, and no
 * loose dot any more.
 *
 * The drawings are the delivery's own (docs/logo/beeldmerk/uitdrukkingen),
 * written by tools/merk-uit-leer.mjs from the Merk en stijlgids's leer.js and
 * copied to src/assets/denker. They are drawn inline rather than as an image,
 * so index.css can make Denker blink and give every expression its gesture —
 * and switch all of it off where motion is (ADR-181).
 *
 * Below 36px the simple drawing: the shine, the cheeks, the shadow and the
 * glints in the eyes go; the eyes, the mouth and the arms stay.
 *
 * The expressions are feedback in the app only: never in place of the logo,
 * and at most one on a screen. And never the answer itself — Denker stands
 * beside a result, the shapes of HUISSTIJL §8 say what it was.
 *
 * Silent, always. The name is the logo's job.
 */
export const UITDRUKKINGEN = [
  'denken',
  'blij',
  'juichen',
  'bemoedigend',
  'trots',
  'slapen',
  'zwaaien',
  'verdrietig',
  'jaloers',
  'verbaasd',
  'verward',
] as const;

export type Uitdrukking = (typeof UITDRUKKINGEN)[number];

/** Below this Denker is drawn without shine, cheeks, shadow and glints. */
const SIMPEL_ONDER_PX = 36;

const TEKENINGEN = import.meta.glob<string>('../assets/denker/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});

function tekening(uitdrukking: Uitdrukking, simpel: boolean): string {
  const naam = `../assets/denker/denker-${uitdrukking}${simpel ? '-klein' : ''}.svg`;
  return TEKENINGEN[naam] ?? '';
}

export function Brandmark({
  size = 32,
  uitdrukking = 'denken',
  className,
}: {
  readonly size?: number;
  readonly uitdrukking?: Uitdrukking;
  readonly className?: string;
}) {
  // Ids of its own per Denker on the page, for the gradient and the clip of
  // each eye: two that shared one would both lose it the moment the first one
  // is hidden.
  const eigen = `denker-${useId().replace(/[^a-zA-Z0-9-]/g, '')}-`;
  const svg = tekening(uitdrukking, size < SIMPEL_ONDER_PX).replace(
    /(id="|url\(#)denker-/g,
    `$1${eigen}`,
  );

  return (
    <span
      className={className ? `tk-denker ${className}` : 'tk-denker'}
      data-uitdrukking={uitdrukking}
      style={{ width: size, height: size }}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
