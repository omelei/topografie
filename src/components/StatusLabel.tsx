import { t } from '@/i18n';
import { Dot } from './Dot';

/**
 * What one item is doing, on K9.
 *
 * A label and deliberately not a chip: no border, no background and no hit
 * target, because it is a fact about a row rather than something you can press.
 * Give it a border and it looks tappable, and a child will tap it.
 *
 * Colour never carries it alone. Each status has a shape as well as a word, and
 * the shape is the same dot as everywhere else — full, three quarters, half,
 * empty — so the table and the map are saying the same thing in the same
 * language.
 *
 * **None of them is green.** Green is an answer state. A status that borrowed
 * it would tell a child they had just got something right when all it means is
 * that they knew it last Tuesday.
 *
 * Since ADR-114 the four are the product's one definition of remembering: not
 * yet practised, not yet remembered, remembered, and remembered but long
 * unseen. The freezer label went with it — see `itemStatus.ts`.
 */

export type ItemStatus = 'refresh' | 'remembered' | 'practising' | 'new';

const COPY = {
  refresh: 'status.refresh',
  remembered: 'status.remembered',
  practising: 'status.practising',
  new: 'status.new',
} as const;

/**
 * How full the dot is for each status. Opfrissen is a dot not quite full: it
 * was remembered, and the quarter that is missing is the time since.
 *
 * Exported because K9 draws the same four dots without the words beside them —
 * on its tiles and in its wall of dots — and two tables of these numbers would
 * be two pictures of one idea.
 */
export const STATUS_FILL = {
  refresh: 0.75,
  remembered: 1,
  practising: 0.5,
  new: 0,
} as const;

export interface StatusLabelProps {
  readonly status: ItemStatus;
  readonly className?: string;
}

export function StatusLabel({ status, className }: StatusLabelProps) {
  const emphasis = status === 'remembered' ? ' tk-status-remembered' : '';
  const extra = className ? ` ${className}` : '';

  return (
    <span className={`tk-status${emphasis}${extra}`}>
      {/* 24 and not smaller: below 21 the dot drops its fill for a solid core
          (§A), at which point full, half and empty are the same picture and
          the shape stops carrying anything.

          Decorative, because the word beside it says the same thing, and a
          screen reader announcing both would say everything twice down a
          column of twelve provinces. */}
      <Dot size={24} fill={STATUS_FILL[status]} tone="inherit" />
      {t(COPY[status])}
    </span>
  );
}
