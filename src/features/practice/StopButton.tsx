import { t } from '@/i18n';

/**
 * The way out of a round.
 *
 * A cross rather than the word "stoppen", because it is the one control on this
 * screen that has to read the same to a child who cannot yet read — and because
 * a round is a place you are inside, where the way out is a shape in the corner
 * rather than a sentence competing with the question.
 *
 * The word is still there for anyone using a screen reader, and the shape is
 * drawn rather than set in a font so it does not depend on one.
 *
 * 56, like every control in a round, on white with the control edge round it
 * (Kleurblokken, ADR-238): leaving is not the thing this screen should make
 * easiest, but a child who wants out should not have to aim for it.
 */
export function StopButton({ onStop }: { readonly onStop: () => void }) {
  return (
    <button type="button" className="tk-stop" onClick={onStop} aria-label={t('practice.stop')}>
      <svg width="22" height="22" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <path
          d="M2 2 L14 14 M14 2 L2 14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="butt"
        />
      </svg>
    </button>
  );
}
