import { StarIcon } from '@/components/Icon';
import { useNaarPremium, usePremium } from '@/features/premium/usePremium';
import { isTeKoop } from '@/store/premium';
import { t } from '@/i18n';
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
  return (
    <div className="ml-auto flex min-w-0 items-center gap-3">
      <PremiumKnop />
      {/* The profile switch. It is the way to a sibling's turn (ADR-046), so it
          is a control and not a label. On a phone it is the avatar alone and
          the name is said rather than shown — the button keeps it as its
          accessible name, so it is still the child's own button. */}
      <button type="button" className="tk-profiel" onClick={onProfile}>
        {/* The first letter of their name. It was the hero they chose until
            ADR-149 took the heroes out; a letter is what tells two children on
            one device apart, and it needs nothing to be earned. */}
        <span className="tk-profiel-letter" aria-hidden="true">
          {profile.naam.slice(0, 1).toLocaleUpperCase('nl-NL')}
        </span>
        <span className="tk-profiel-naam">{profile.naam}</span>
      </button>
    </div>
  );
}

/**
 * De weg naar premium, in de balk (ADR-126).
 *
 * Tot nu toe was premium alleen te vinden door ergens tegen een slot te lopen,
 * en sinds ADR-124 staan die sloten er veel minder — precies de goede keuze, met
 * één gevolg dat niemand wilde: een ouder die wil weten wat het kost, moet
 * ernaar zoeken. Dit is de vaste plek, op elke pagina, en de enige knop in de
 * app die opvalt omdat hij verkoopt.
 *
 * **Alleen zonder code.** Wie betaald heeft hoort geen knop te zien die hem
 * vraagt te betalen; daar staat de stand op Jij en op de premiumpagina zelf. En
 * alleen als er iets te verkopen valt (`isTeKoop`): een build zonder
 * premiumserver heeft geen code om te controleren.
 *
 * De groene nadruk, niet `--accent`: dit is geen modulekleur en verandert
 * nergens mee mee. Het is het ene commerciële element in de app, en het heeft de
 * ene kleur die het product voor nadruk heeft. Wit op groen haalt 4.5:1
 * (`contrast.test.ts`).
 */
function PremiumKnop() {
  const { actief } = usePremium();
  const naarPremium = useNaarPremium();

  if (actief || !isTeKoop()) return null;

  return (
    <button type="button" className="tk-premiumknop" onClick={naarPremium}>
      <StarIcon size={18} />
      <span className="tk-premiumknop-woord">{t('premium.titel')}</span>
    </button>
  );
}
