import { t } from '@/i18n';
import { AvatarTeken } from '@/features/player/avatars';
import { AVATAR_SLEUTEL } from '@/store/children';
import type { ProfileRecord } from '@/store/db';
import { heeftNaam } from '@/store/profile';

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
 *
 * **En sinds ADR-173 is dit de wisselaar.** Hij wees naar Jij, wat een tweede
 * weg was naar een pagina die al in de navigatie stond. Wat hij nu opent is de
 * vraag die hoort bij de naam die erop staat: wie zit hier achter het scherm —
 * dit kind, een broer of zus, of de ouder. De naam blijft de toegankelijke
 * naam van de knop, want het is nog steeds de knop van wie er oefent.
 */
export function TopBar({
  profile,
  onProfile,
}: {
  readonly profile: ProfileRecord;
  readonly onProfile?: (() => void) | undefined;
}) {
  // Een kind zonder naam oefent al (ADR-229): de knop staat er, met het
  // poppetje en zonder naam ernaast.
  const naamloos = !heeftNaam(profile);
  return (
    <div className="ml-auto flex min-w-0 items-center gap-3">
      {/* The profile switch. It is the way to a sibling's turn (ADR-046), so it
          is a control and not a label. On a phone it is the avatar alone and
          the name is said rather than shown — the label below keeps the name in
          the accessible name, so it is still the child's own button. */}
      <button
        type="button"
        className="tk-profiel"
        aria-label={
          naamloos ? t('wisselaar.knopZonderNaam') : t('wisselaar.knop', { naam: profile.naam })
        }
        onClick={onProfile}
      >
        {/* De avatar die het kind koos (ADR-177), met de voorletter als
            terugval. Op een telefoon staat hij er alleen, want daar past de
            naam niet; vanaf 768 staat hij naast de naam (ADR-202). */}
        <span className="tk-profiel-letter" aria-hidden="true">
          <AvatarTeken id={profile.avatarConfig[AVATAR_SLEUTEL]} naam={profile.naam} size={32} />
        </span>
        {naamloos ? null : <span className="tk-profiel-naam">{profile.naam}</span>}
      </button>
    </div>
  );
}
