import { diplomaDrempel } from '@/game-core';
import { t, type TranslationKey } from '@/i18n';
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
  onVandaagVerder,
  onNieuwePlaatjes,
  onAgain,
  onHerhaal,
}: {
  readonly state: KlokRoundState;
  readonly setId: string;
  readonly mode: KlokMode;
  readonly onHome: () => void;
  /** Naar de volgende ronde van vandaag (ADR-139). */
  readonly onVandaagVerder?: (() => void) | undefined;
  /** Een ronde met nieuwe plaatjes, als vandaag klaar is (ADR-149). */
  readonly onNieuwePlaatjes?: (() => void) | undefined;
  readonly onAgain: () => void;
  readonly onHerhaal: (ids: readonly string[]) => void;
}) {
  // After a klokdiploma: what it earned, or how far off it was, in right
  // answers — the vlaggendiploma's way of saying it (ADR-117).
  const gehaald = state.reward?.klokDiploma ?? null;
  const diploma =
    mode === 'klok-diploma' && gehaald
      ? t('klok.diplomaEarned', { stap: t(`set.${gehaald}` as TranslationKey) })
      : null;
  const melding =
    mode === 'klok-diploma' && state.reward && !gehaald
      ? t('klok.diplomaMissed', {
          goed: state.correctCount,
          totaal: state.total,
          nodig: diplomaDrempel(state.total),
        })
      : null;

  return (
    <RondeKlaar
      diploma={diploma}
      melding={melding}
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
      voor={state.statesVoor}
      na={state.states}
      stenen={state.stenen}
      groei={state.groei}
      reward={state.reward}
      oefenTitel={t('klok.practiceMore')}
      missed={state.missed}
      onAgain={onAgain}
      onHerhaal={onHerhaal}
      onHome={onHome}
      onVandaagVerder={onVandaagVerder}
      onNieuwePlaatjes={onNieuwePlaatjes}
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
