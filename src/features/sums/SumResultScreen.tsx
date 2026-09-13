import { t } from '@/i18n';
import { sumText } from '@/game-core';
import { MODULE_ICON } from '@/features/shell/moduleIcons';
import { RondeKlaar } from '@/features/round/RondeKlaar';
import type { SumRoundState } from './useSumRound';

/**
 * "Ronde klaar" for the tables (`RondeKlaar`, ADR-112).
 *
 * The sums still to practise are listed with their answers. On the map they are
 * shown as places rather than told, because a map can show; a sum cannot be
 * pointed at, and reading "7 × 8 = 56" is what looking at it does.
 *
 * A diploma is the one thing on this page that is not about today: a table you
 * have a diploma for is a table you have finished, so it is what the round
 * earned. One not earned is said as what it takes.
 */
export function SumResultScreen({
  state,
  setId,
  onHome,
  onAgain,
  onHerhaal,
}: {
  readonly state: SumRoundState;
  readonly setId: string;
  readonly onHome: () => void;
  readonly onAgain: () => void;
  readonly onHerhaal: (ids: readonly string[]) => void;
}) {
  const ModuleIcon = MODULE_ICON.tafels;
  const diploma = state.reward?.diploma ?? null;

  return (
    <RondeKlaar
      moduleId="tafels"
      setId={setId}
      mode={state.mode}
      toetsstand={state.toetsstand}
      goed={state.correctCount}
      beantwoord={state.answeredCount}
      // Only a fixed round has a total to fall short of. "Je stopte na 3 van de
      // 120" would be a lie about a round that was never going to ask 120.
      gestopt={
        state.rule.kind === 'fixed' && state.answeredCount < state.total
          ? { gedaan: state.answeredCount, totaal: state.total }
          : null
      }
      gained={state.gained}
      streak={state.streak}
      reward={state.reward}
      diploma={diploma ? t('sums.diplomaEarned', { tafel: diploma }) : null}
      melding={state.mode === 'tafeldiploma' && !diploma ? t('sums.diplomaMissed') : null}
      oefenTitel={t('sums.practiceMore')}
      missed={state.missed}
      onAgain={onAgain}
      onHerhaal={onHerhaal}
      onHome={onHome}
    >
      <ul className="tk-lijst">
        {state.missed.map((sum) => (
          <li key={sum.id}>
            <div className="tk-lijstrij">
              <span className="tk-plaat">
                <ModuleIcon size={24} />
              </span>
              <span className="tk-lijstrij-tekst">
                <span className="tk-lijstrij-titel tabular-nums">
                  {`${sumText(sum)} = ${sum.antwoord}`}
                </span>
              </span>
            </div>
          </li>
        ))}
      </ul>
    </RondeKlaar>
  );
}
