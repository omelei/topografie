import { useId } from 'react';

/**
 * Denker, the mascot: the logo without the name (ADR-154, ADR-182).
 *
 * The drawings are the delivery's own (docs/logo/beeldmerk/uitdrukkingen),
 * written by tools/merk-uit-leer.mjs from the Merk en stijlgids's leer.js and
 * copied to src/assets/denker. They are drawn inline rather than as an image,
 * so index.css can make Denker blink, let the dot float and let him wave —
 * and switch all of it off where motion is (ADR-181).
 *
 * Below 36px the simple drawing: the eyes and the dot stay, the mouth, the
 * brows and the cheeks go, as the guide says.
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
] as const;

export type Uitdrukking = (typeof UITDRUKKINGEN)[number];

/** Below this Denker is drawn without mouth, brows and cheeks. */
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
  // One gradient per Denker on the page: two that shared an id would both
  // lose it the moment the first one is hidden.
  const verloop = `denker-verloop-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`;
  const svg = tekening(uitdrukking, size < SIMPEL_ONDER_PX).replaceAll('denker-verloop', verloop);

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
