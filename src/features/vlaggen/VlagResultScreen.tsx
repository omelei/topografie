import { vlagdiplomaDrempel } from '@/game-core';
import { t, type TranslationKey } from '@/i18n';
import { RondeKlaar } from '@/features/round/RondeKlaar';
import { Vlag } from './Vlag';
import type { VlagRoundState } from './useVlagRound';

/**
 * "Ronde klaar" for flags (`RondeKlaar`, ADR-112).
 *
 * The flags still to practise are shown as well as named, for the clock's
 * reason — a flag can be looked at, and a child who has just chosen Roemenië
 * for Tsjaad should see the flag that was meant.
 *
 * After a vlaggendiploma the diploma is what the round earned, or how far off
 * it was, in the only unit that means anything here: right answers (ADR-104).
 */
export function VlagResultScreen({
  state,
  setId,
  onHome,
  onAgain,
  onHerhaal,
}: {
  readonly state: VlagRoundState;
  readonly setId: string;
  readonly onHome: () => void;
  readonly onAgain: () => void;
  readonly onHerhaal: (ids: readonly string[]) => void;
}) {
  const reward = state.reward;
  const gehaald = reward?.vlagDiploma ?? null;
  const diploma =
    state.mode === 'vlag-diploma' && gehaald
      ? t('vlag.diplomaEarned', { deel: t(`regio.${gehaald}` as TranslationKey) })
      : null;
  const melding =
    state.mode === 'vlag-diploma' && reward && !gehaald
      ? t('vlag.diplomaMissed', {
          goed: state.correctCount,
          totaal: state.total,
          nodig: vlagdiplomaDrempel(state.total),
        })
      : null;

  return (
    <RondeKlaar
      moduleId="vlaggen"
      setId={setId}
      mode={state.mode}
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
      reward={reward}
      diploma={diploma}
      melding={melding}
      oefenTitel={t('vlag.practiceMore')}
      missed={state.missed}
      onAgain={onAgain}
      onHerhaal={onHerhaal}
      onHome={onHome}
    >
      <ul className="tk-lijst">
        {state.missed.map((vlag) => (
          <li key={vlag.id}>
            <div className="tk-lijstrij">
              {/* Decorative here: the name beside it says the same thing. */}
              <span className="tk-lijstrij-beeld">
                <Vlag vlag={vlag} alt="" />
              </span>
              <span className="tk-lijstrij-tekst">
                <span className="tk-lijstrij-titel">{vlag.naam}</span>
              </span>
            </div>
          </li>
        ))}
      </ul>
    </RondeKlaar>
  );
}
