import type { ProfileRecord } from '@/store/db';

/**
 * The right-hand end of the app bar: who is practising.
 *
 * It belongs to the frame rather than the page, because it is true on every
 * screen. The streak used to stand here as a pill as well; it is gone from the
 * bar (ADR-112). Days in a row are the streak block's business, in the child's
 * own column, where the week behind the number is drawn too — a number in the
 * bar said the same thing a second time, without the days.
 *
 * De groene premiumknop stond hier ook (ADR-126), als de enige vaste weg naar
 * premium. Die weg is nu een bestemming in de navigatie (ADR-171), en twee
 * knoppen naar dezelfde pagina naast elkaar is er één te veel.
 */
export function TopBar({
  profile,
  onProfile,
}: {
  readonly profile: ProfileRecord;
  readonly onProfile?: (() => void) | undefined;
}) {
  return (
    <div className="ml-auto flex min-w-0 items-center gap-3">
      {/* The profile switch. It is the way to a sibling's turn (ADR-046), so it
          is a control and not a label. On a phone it is the avatar alone and
          the name is said rather than shown — the button keeps it as its
          accessible name, so it is still the child's own button. */}
      <button type="button" className="tk-profiel" onClick={onProfile}>
        {/* De voorletter is de avatar, en alleen daar waar de naam niet past:
            op een telefoon. Zodra de naam er staat, staat hij er alleen (ADR-168).
            Een letter naast dezelfde naam zegt niets wat de naam niet al zegt —
            het is dezelfde informatie, twee keer, in de smalste balk van de app.
            Onder 768 is er geen naam om te lezen, en dan is de letter wél het
            enige wat twee kinderen op één apparaat uit elkaar houdt. */}
        <span className="tk-profiel-letter" aria-hidden="true">
          {profile.naam.slice(0, 1).toLocaleUpperCase('nl-NL')}
        </span>
        <span className="tk-profiel-naam">{profile.naam}</span>
      </button>
    </div>
  );
}
