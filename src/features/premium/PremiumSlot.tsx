import { PremiumLabel } from '@/features/module/PremiumLabel';
import { t, type TranslationKey } from '@/i18n';
import { useNaarPremium } from './usePremium';

/**
 * What stands where a premium block would be, without a code (ADR-116, ADR-124).
 *
 * The block's own title stays above it, so a child can see what there is; this
 * says what would be in it and offers the one way on. It is not a teaser:
 * nothing of the block is drawn behind it, blurred or otherwise, because a
 * picture of a reward a child cannot have is a small cruelty.
 *
 * ADR-124 changed two things about it, both about repetition.
 *
 * **It says what this block is, not that premium exists.** Every slot used to
 * carry the same sentence — "Dit hoort bij premium" — and on Jij there were
 * seven of them under seven different headings. Seven copies of one sentence
 * tell a reader nothing seven times and teach them to stop reading. Each place
 * now passes its own line: what would stand here, and what it is for.
 *
 * **One button per region.** A call to action repeated down a page is nagging,
 * and it was the same call every time. The first lock in a column carries the
 * button; the rest are a line under their heading — same words, same label, no
 * second door. The page always has one.
 */
export function PremiumSlot({
  wat = 'premium.slot',
  kaal = false,
  knop = true,
}: {
  /** What would stand here, in one line. The generic sentence is the fallback. */
  readonly wat?: TranslationKey;
  /** Inside a block that is already a card, so this draws none of its own. */
  readonly kaal?: boolean;
  /** Whether this is the lock in its region that carries the way to premium. */
  readonly knop?: boolean;
}) {
  const naarPremium = useNaarPremium();

  // The word itself, unless the block around this already carries it: on a
  // block titled "Premium" holding a line that starts "Met premium", a third
  // copy of the word is noise (ADR-124).
  const regel = (
    <p className="flex flex-wrap items-center gap-2 text-tekst-secundair">
      {kaal ? null : <PremiumLabel hoorbaar />}
      {t(wat)}
    </p>
  );

  // Without a button it is a line, not a card: a lock that cannot be acted on
  // should not take a card's weight on a page that has one that can.
  if (!knop) return regel;

  return (
    <div className={kaal ? 'flex flex-col gap-3' : 'tk-card flex flex-col gap-3'}>
      {regel}
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

/**
 * A whole section that is premium — the badges, a wall of diplomas, the
 * children — without a code: its heading, and the slot under it.
 */
export function PremiumSectie({
  titel,
  wat = 'premium.slot',
  knop = true,
}: {
  readonly titel: string;
  readonly wat?: TranslationKey;
  readonly knop?: boolean;
}) {
  return (
    <section className="flex flex-col gap-3" aria-label={titel}>
      <h2 className="tk-sectie">{titel}</h2>
      <PremiumSlot wat={wat} knop={knop} />
    </section>
  );
}
