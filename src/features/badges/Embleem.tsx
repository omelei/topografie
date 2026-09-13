import type { ComponentType } from 'react';
import type { IconProps } from '@/components/Icon';
import type { Module } from '@/features/shell/modules';

/**
 * The round emblem a badge and a diploma both wear (ADR-112).
 *
 * One shape for everything a child can earn, so a diploma and a badge read as
 * the same kind of thing. Earned, it is a closed circle in the colour of the
 * module it belongs to — or the green, where it belongs to none — with the
 * drawing on it. Not yet, it is a dashed ring round a quiet drawing: a shape
 * rather than a tint says "nog niet", so it survives grey.
 *
 * Decorative: the words beside it are what a screen reader hears.
 */
export function Embleem({
  icon: Tekening,
  module,
  gehaald,
  klein = false,
}: {
  readonly icon: ComponentType<Omit<IconProps, 'children'>>;
  /** The module it belongs to, or null for one that belongs to all of them. */
  readonly module: Module['id'] | null;
  readonly gehaald: boolean;
  /** In a row of a list, where the plate beside it is 44. */
  readonly klein?: boolean;
}) {
  return (
    <span
      className={klein ? 'tk-embleem tk-embleem-klein' : 'tk-embleem'}
      data-module={module ?? undefined}
      data-gehaald={gehaald ? 'ja' : undefined}
      aria-hidden="true"
    >
      <Tekening size={klein ? 20 : 24} />
    </span>
  );
}
