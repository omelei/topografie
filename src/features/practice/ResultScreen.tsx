import { t } from '@/i18n';
import type { GeoSet } from '@/content/loadGeo';
import { MODULE_ICON } from '@/features/shell/moduleIcons';
import { RondeKlaar } from '@/features/round/RondeKlaar';
import type { AnswerLayer } from './MapCanvas';
import { setsInRound, type RoundState } from './useRound';

/**
 * "Ronde klaar" for the map (`RondeKlaar`, ADR-112).
 *
 * What is still to practise is a list, and beside it the same places lit up on
 * the map. That map is the part that does the teaching: a list of names a child
 * got wrong is a list of words; the same names lit up are the thing they were
 * actually failing to picture. Reading "Drenthe" tells them nothing they did
 * not already know — seeing where Drenthe is does.
 */
export function ResultScreen({
  state,
  onHome,
  onAgain,
  onHerhaal,
}: {
  readonly state: RoundState;
  readonly onHome: () => void;
  readonly onAgain: () => void;
  readonly onHerhaal: (ids: readonly string[]) => void;
}) {
  const missedIds = new Set(
    state.missed.map((item) => item.geometrieRef).filter((id): id is string => id !== undefined),
  );
  const ModuleIcon = MODULE_ICON.topo;

  // The map is absent after a Topomix, and that is the honest thing. A mix asks
  // about provinces, capitals, islands and seas in one round; one map can light
  // up one of those layers, so a review map here would show a child four of
  // their eight misses and quietly drop the rest. The list beside it names all
  // of them. The same is true of Nederland's list of mistakes, which spans the
  // same five layers (ADR-103).
  const kaart = state.geo !== null && setsInRound(state.setId).length === 1 ? state.geo : null;

  return (
    <RondeKlaar
      moduleId="topo"
      setId={state.setId}
      mode={state.practiceMode}
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
      oefenTitel={t('result.practiceMore')}
      missed={state.missed}
      onAgain={onAgain}
      onHerhaal={onHerhaal}
      onHome={onHome}
    >
      <div className={kaart ? 'tk-uitslag-duo' : undefined}>
        <ul className="tk-lijst">
          {state.missed.map((item) => (
            <li key={item.id}>
              <div className="tk-lijstrij">
                <span className="tk-plaat">
                  <ModuleIcon size={24} />
                </span>
                <span className="tk-lijstrij-tekst">
                  <span className="tk-lijstrij-titel">{item.naam}</span>
                  {item.weetje !== undefined ? (
                    <span className="tk-lijstrij-regel">{item.weetje}</span>
                  ) : null}
                </span>
              </div>
            </li>
          ))}
        </ul>

        {kaart ? (
          <section className="flex flex-col gap-2" aria-label={t('result.mapLabel')}>
            <div className="tk-card flex justify-center">
              <ReviewMap background={kaart} answers={state.answers} highlighted={missedIds} />
            </div>
            <p className="tk-hulp">{t('result.mapHelp')}</p>
          </section>
        ) : null}
      </div>
    </RondeKlaar>
  );
}

/**
 * A map with nothing to click: the shapes or cities a child missed, lit up
 * together in the module's colour. Decorative for a screen reader — the same
 * information is already in the list beside it, and a second reading of twelve
 * province names is noise.
 */
function ReviewMap({
  background,
  answers,
  highlighted,
}: {
  readonly background: GeoSet;
  readonly answers: AnswerLayer | null;
  readonly highlighted: ReadonlySet<string>;
}) {
  const [, , viewWidth, viewHeight] = background.viewBox;
  const litShapes =
    answers?.kind === 'background'
      ? background.vormen
      : answers?.kind === 'shapes'
        ? answers.set.vormen
        : [];

  return (
    <svg
      viewBox={background.viewBox.join(' ')}
      className="h-auto w-full max-w-sm"
      style={{ aspectRatio: `${viewWidth} / ${viewHeight}` }}
      role="img"
      aria-hidden="true"
    >
      {background.vormen.map((vorm) => (
        <path
          key={vorm.id}
          d={vorm.d}
          fill="var(--papier)"
          stroke="var(--tekst-tertiair)"
          strokeWidth={1}
          strokeLinejoin="round"
        />
      ))}

      {litShapes
        .filter((vorm) => highlighted.has(vorm.id))
        .map((vorm) => (
          <path
            key={vorm.id}
            d={vorm.d}
            fill="var(--accent-tint)"
            stroke="var(--accent)"
            strokeWidth={3}
            strokeLinejoin="round"
          />
        ))}

      {answers?.kind === 'points' &&
        answers.set.punten
          .filter((point) => highlighted.has(point.id))
          .map((point) => (
            <circle
              key={point.id}
              cx={point.punt[0]}
              cy={point.punt[1]}
              r={9}
              fill="var(--accent-tint)"
              stroke="var(--accent)"
              strokeWidth={3}
            />
          ))}
    </svg>
  );
}
