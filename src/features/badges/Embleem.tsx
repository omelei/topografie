import type { ComponentType, CSSProperties } from 'react';
import type { IconProps } from '@/components/Icon';
import type { Module } from '@/features/shell/modules';

/**
 * The round emblem a badge and a diploma both wear (ADR-112).
 *
 * One shape for everything a child can earn, so a diploma and a badge read as
 * the same kind of thing. Earned, it is a gold disc in a ring of the colour of
 * the module it belongs to (ADR-182), with the drawing on it. Not yet, it is a
 * dashed ring round a quiet drawing: a shape rather than a tint says "nog
 * niet", so it survives grey.
 *
 * Sinds de diploma's het hele beloningsprogramma zijn, kan de rand ook
 * **meelopen**: geef `vul` mee en de gestippelde ring wordt een boog die voor
 * dat deel dichtloopt. Dat is één cirkel en geen tweede eromheen, zodat het één
 * vorm blijft voor alles wat je kunt verdienen. De stand is nooit alleen die
 * boog — de woorden ernaast zeggen hetzelfde.
 *
 * Decorative: the words beside it are what a screen reader hears.
 */
export function Embleem({
  icon: Tekening,
  module,
  gehaald,
  klein = false,
  groot = false,
  vul,
}: {
  readonly icon: ComponentType<Omit<IconProps, 'children'>>;
  /** The module it belongs to, or null for one that belongs to all of them. */
  readonly module: Module['id'] | null;
  readonly gehaald: boolean;
  /** In a row of a list, where the plate beside it is 44. */
  readonly klein?: boolean;
  /** Op het grote diploma, waar het embleem het zegel is: 88. */
  readonly groot?: boolean;
  /**
   * Hoe vol de rand staat, 0 tot 100. Weglaten voor een embleem dat niet
   * meeloopt; bij `gehaald` doet hij niets, want dan is de cirkel al dicht.
   */
  readonly vul?: number | undefined;
}) {
  const loopt = !gehaald && vul !== undefined;
  const procent = loopt ? Math.max(0, Math.min(100, vul)) : 0;
  return (
    <span
      className={
        klein ? 'tk-embleem tk-embleem-klein' : groot ? 'tk-embleem tk-embleem-groot' : 'tk-embleem'
      }
      data-module={module ?? undefined}
      data-gehaald={gehaald ? 'ja' : undefined}
      data-vul={loopt ? (procent === 0 ? 'leeg' : 'ja') : undefined}
      style={loopt ? ({ '--vul': `${String(procent)}%` } as CSSProperties) : undefined}
      aria-hidden="true"
    >
      <Tekening size={klein ? 20 : groot ? 40 : 24} />
    </span>
  );
}
