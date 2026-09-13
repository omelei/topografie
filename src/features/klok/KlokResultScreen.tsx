import { t } from '@/i18n';
import { RondeKlaar } from '@/features/round/RondeKlaar';
import { KlokFace } from './KlokFace';
import { klokVoluit } from './klokTaal';
import type { KlokMode, KlokRoundState } from './useKlokRound';

/**
 * "Ronde klaar" for the clock (`RondeKlaar`, ADR-112).
 *
 * The times still to practise are **shown as well as told**, which is the one
 * place this page differs from rekenen's. A sum cannot be pointed at, so
 * reading "7 × 8 = 56" is what looking at it does; a clock can, and a child who
 * has just misread half past seven should see the hands that say it beside the
 * words.
 */
export function KlokResultScreen({
  state,
  setId,
  mode,
  onHome,
  onAgain,
  onHerhaal,
}: {
  readonly state: KlokRoundState;
  readonly setId: string;
  readonly mode: KlokMode;
  readonly onHome: () => void;
  readonly onAgain: () => void;
  readonly onHerhaal: (ids: readonly string[]) => void;
}) {
  return (
    <RondeKlaar
      moduleId="klok"
      setId={setId}
      mode={mode}
      toetsstand={state.toetsstand}
      goed={state.correctCount}
      beantwoord={state.answeredCount}
      gestopt={
        state.rule.kind === 'fixed' && state.answeredCount < state.total
          ? { gedaan: state.answeredCount, totaal: state.total }
          : null
      }
      gained={state.gained}
      streak={state.streak}
      reward={state.reward}
      oefenTitel={t('klok.practiceMore')}
      missed={state.missed}
      onAgain={onAgain}
      onHerhaal={onHerhaal}
      onHome={onHome}
    >
      <ul className="tk-lijst">
        {state.missed.map((tijd) => (
          <li key={tijd.id}>
            <div className="tk-lijstrij">
              {/* The face is decorative here and deliberately so: the words
                  beside it say the same thing, and a screen reader that read
                  both would hear half past seven twice. */}
              <span className="tk-lijstrij-beeld">
                <KlokFace item={tijd} cijfers={false} />
              </span>
              <span className="tk-lijstrij-tekst">
                <span className="tk-lijstrij-titel">{klokVoluit(tijd)}</span>
              </span>
            </div>
          </li>
        ))}
      </ul>
    </RondeKlaar>
  );
}
