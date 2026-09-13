import { Heldplaat } from '@/components/Heldplaat';
import { reeksVan, useHelden } from '@/features/reis/useHelden';
import type { ProfileRecord } from '@/store/db';

/**
 * The right-hand end of the app bar: who is practising.
 *
 * It belongs to the frame rather than the page, because it is true on every
 * screen. The streak used to stand here as a pill as well; it is gone from the
 * bar (ADR-112). Days in a row are the streak block's business, in the child's
 * own column, where the week behind the number is drawn too — a number in the
 * bar said the same thing a second time, without the days.
 */
export function TopBar({
  profile,
  onProfile,
}: {
  readonly profile: ProfileRecord;
  readonly onProfile?: (() => void) | undefined;
}) {
  const helden = useHelden();
  const sticker = profile.avatarConfig.sticker;

  return (
    <div className="ml-auto flex min-w-0 items-center gap-3">
      {/* The profile switch. It is the way to a sibling's turn (ADR-046), so it
          is a control and not a label. On a phone it is the avatar alone and
          the name is said rather than shown — the button keeps it as its
          accessible name, so it is still the child's own button. */}
      <button type="button" className="tk-profiel" onClick={onProfile}>
        {/* The hero they chose, on its plate — or, until they choose, the
            first one. A child always has one (ADR-067). At this size there are
            no rings; the plate's tone carries the reeks. */}
        <Heldplaat sticker={sticker} reeks={reeksVan(helden, sticker)} size={30} />
        <span className="tk-profiel-naam">{profile.naam}</span>
      </button>
    </div>
  );
}
