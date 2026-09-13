import { PremiumLabel } from '@/features/module/PremiumLabel';
import { t } from '@/i18n';
import { useNaarPremium } from './usePremium';

/**
 * What stands where a premium block would be, without a code (ADR-116).
 *
 * The block's own title stays above it, so a child can see what there is; this
 * says in one line that it belongs to premium and offers the one way on. It is
 * not a teaser: nothing of the block is drawn behind it, blurred or otherwise,
 * because a picture of a reward a child cannot have is a small cruelty.
 */
/**
 * A whole section that is premium — the badges, a wall of diplomas, the
 * children — without a code: its heading, and the slot under it.
 */
export function PremiumSectie({ titel }: { readonly titel: string }) {
  return (
    <section className="flex flex-col gap-3" aria-label={titel}>
      <h2 className="tk-sectie">{titel}</h2>
      <PremiumSlot />
    </section>
  );
}

export function PremiumSlot({ kaal = false }: { readonly kaal?: boolean }) {
  const naarPremium = useNaarPremium();

  return (
    <div className={kaal ? 'flex flex-col gap-3' : 'tk-card flex flex-col gap-3'}>
      <p className="flex flex-wrap items-center gap-2 text-tekst-secundair">
        <PremiumLabel hoorbaar />
        {t('premium.slot')}
      </p>
      <button
        type="button"
        className="tk-button tk-button-secondary self-start"
        onClick={naarPremium}
      >
        {t('premium.slotKnop')}
      </button>
    </div>
  );
}
