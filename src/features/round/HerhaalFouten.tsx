import { t } from '@/i18n';

/**
 * "Herhaal je fouten", on every result screen that has a miss to repeat.
 *
 * Beside "Nog een ronde" rather than instead of it, and secondary: another
 * round is still the way on, and this is the shorter way back over what just
 * went wrong — exactly those, straight away, while the child still remembers
 * getting them wrong (ADR-111).
 *
 * Free since ADR-121. It was premium, with the collected list of mistakes on
 * the module page; the two were separated because this one asks only about the
 * round that has just ended. Locking it put the paywall on the exact moment a
 * child is most able to learn something, which is the opposite of what the
 * product promises.
 */
export function HerhaalFouten({
  missed,
  onHerhaal,
}: {
  readonly missed: readonly { readonly id: string }[];
  readonly onHerhaal: (ids: readonly string[]) => void;
}) {
  if (missed.length === 0) return null;

  return (
    <button
      type="button"
      className="tk-button tk-button-secondary"
      onClick={() => onHerhaal(missed.map((item) => item.id))}
    >
      {t('result.herhaalFouten')}
    </button>
  );
}
