import { t } from '@/i18n';
import { naamVanSet } from '@/features/module/onderdelen';
import { RondeKlaar } from '@/features/round/RondeKlaar';
import type { TaalRoundState } from './useTaalRound';

/**
 * "Ronde klaar" for Taal (`RondeKlaar`, ADR-112).
 *
 * What is still to practise is the word as it is written, with the sentence
 * it was asked in beside it — the sentence is what makes "wij" and "wei" two
 * different words, so it comes along to the list (ADR-118).
 */
export function TaalResultScreen({
  state,
  setId,
  onHome,
  onVandaagVerder,
  onNieuwePlaatjes,
  onAgain,
  onHerhaal,
}: {
  readonly state: TaalRoundState;
  readonly setId: string;
  readonly onHome: () => void;
  /** Naar de volgende ronde van vandaag (ADR-139). */
  readonly onVandaagVerder?: (() => void) | undefined;
  /** Een ronde met nieuwe plaatjes, als vandaag klaar is (ADR-149). */
  readonly onNieuwePlaatjes?: (() => void) | undefined;
  readonly onAgain: () => void;
  readonly onHerhaal: (ids: readonly string[]) => void;
}) {
  const werkwoorden = state.set?.deel === 'werkwoorden';
  // Het taaldiploma (ADR-168), zoals de klok en de vlaggen het zeggen: wat het
  // opleverde, of hoe ver het ernaast zat.
  const diploma = state.reward?.taalDiploma ?? null;

  return (
    <RondeKlaar
      moduleId="woorden"
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
      na={state.states}
      stenen={state.stenen}
      groei={state.groei}
      reward={state.reward}
      diploma={diploma ? t('taal.diplomaEarned', { naam: naamVanSet(setId) }) : null}
      melding={
        state.mode === 'taal-diploma' && state.reward && !diploma ? t('taal.diplomaMissed') : null
      }
      oefenTitel={t(werkwoorden ? 'taal.practiceMoreVormen' : 'taal.practiceMore')}
      missed={state.missed}
      onAgain={onAgain}
      onHerhaal={onHerhaal}
      onHome={onHome}
      onVandaagVerder={onVandaagVerder}
      onNieuwePlaatjes={onNieuwePlaatjes}
    >
      <ul className="tk-lijst">
        {state.missed.map((item) => (
          <li key={item.id}>
            <div className="tk-lijstrij">
              <span className="tk-lijstrij-tekst">
                <span className="tk-lijstrij-titel">
                  {'woord' in item ? item.woord : item.antwoord}
                </span>
                <span className="tk-lijstrij-regel">{item.zin}</span>
              </span>
            </div>
          </li>
        ))}
      </ul>
    </RondeKlaar>
  );
}
