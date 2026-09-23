import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { t } from '@/i18n';
import {
  FLITS_KIJKTIJD_MS,
  gatLetters,
  letterVerschil,
  zinDelen,
  type Stuk,
  type ZinDelen,
} from '@/game-core';
import { RoundProgress } from '@/features/practice/RoundProgress';
import { StopButton } from '@/features/practice/StopButton';
import { Counter } from '@/features/round/Teller';
import { RondeDenker } from '@/features/round/RondeDenker';
import { UitkomstTeken } from '@/features/round/UitkomstTeken';
import { typtHet, type TaalMode } from './taalRegels';
import { gespeld, regelVoor } from './taalTaal';
import { TaalResultScreen } from './TaalResultScreen';
import { useTaalRound, type TaalRoundState, type TaalVraag } from './useTaalRound';

/**
 * One round of Taal (ADR-118).
 *
 * The round bar is the same bar, the dots are the same dots, and the feedback
 * appears where the question was, as on every module. What is on the stage is
 * the sentence: the word or the verb is asked where it belongs, never on its
 * own, so a word that sounds like another one is always the one the sentence
 * means.
 *
 * **Kies de letters** opens the letters that decide — "tr▢n" — and offers only
 * letter pieces, never a whole word spelled wrong. **Flitsdictee** shows the
 * word in its sentence for three seconds, takes it away and asks for all of it
 * in the gap; there is no way back to it. **Kies de vorm** and **Typ de vorm**
 * open a gap for the verb and say which verb it is.
 *
 * **No read-aloud button.** The other rounds speak through the browser's own
 * voices; here a voice would say the word the child is asked to spell, and the
 * better voices send the text to a server, which the README promises nothing
 * does. A dictee with a voice is a decision of its own, for later.
 */
export function TaalScreen({
  setId,
  mode,
  aantal = null,
  toetsstand = false,
  onHome,
  onVandaagVerder,
  onNieuwePlaatjes,
  onAgain,
  alleen = null,
  onHerhaal,
}: {
  readonly setId: string;
  readonly mode: TaalMode;
  readonly aantal?: number | null;
  /**
   * Whether the round keeps its answers until the end (ADR-085). A round in
   * toetsstand never rests in the revealed phase, so the feedback below is
   * never reached.
   */
  readonly toetsstand?: boolean;
  readonly onHome: () => void;
  /** Naar de volgende ronde van vandaag (ADR-139). */
  readonly onVandaagVerder?: (() => void) | undefined;
  /** Een ronde met nieuwe plaatjes, als vandaag klaar is (ADR-149). */
  readonly onNieuwePlaatjes?: (() => void) | undefined;
  readonly onAgain: () => void;
  /** "Herhaal je fouten": the ids this round asks and nothing else (ADR-111). */
  readonly alleen?: readonly string[] | null;
  readonly onHerhaal: (ids: readonly string[]) => void;
}) {
  const { state, choose, submit, giveUp, next, stop } = useTaalRound(
    setId,
    mode,
    aantal,
    toetsstand,
    alleen,
  );
  const nextButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (state.phase === 'revealed') nextButton.current?.focus();
  }, [state.phase]);

  if (state.error !== null) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <p className="tk-display text-sectiekop">{t('taal.failed')}</p>
        <button type="button" className="tk-button" onClick={onHome}>
          {t('result.home')}
        </button>
      </main>
    );
  }

  if (state.phase === 'finished') {
    return (
      <TaalResultScreen
        state={state}
        setId={setId}
        onHome={onHome}
        onVandaagVerder={onVandaagVerder}
        onNieuwePlaatjes={onNieuwePlaatjes}
        onAgain={onAgain}
        onHerhaal={onHerhaal}
      />
    );
  }

  if (state.phase === 'loading' || !state.question) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6" aria-busy="true">
        <p className="text-tekst-secundair">{t('taal.loading')}</p>
      </main>
    );
  }

  return (
    <div
      className="flex h-screen flex-col bg-papier"
      data-module="woorden"
      data-accent="module"
      data-thema="ronde"
    >
      <header className="tk-round-bar">
        <StopButton onStop={stop} />
        {state.rule.kind === 'fixed' ? (
          <RoundProgress
            total={state.total}
            index={state.index}
            answered={state.index + (state.phase === 'revealed' ? 1 : 0)}
          />
        ) : null}
        <div className="ml-auto flex items-center gap-4 md:gap-6">
          {state.livesLeft !== null ? (
            <>
              <Counter
                label={t('practice.counterLives')}
                value={String(state.livesLeft)}
                urgent={state.livesLeft <= 1}
              />
              <Counter label={t('practice.counterCorrect')} value={String(state.correctCount)} />
            </>
          ) : null}
        </div>
      </header>

      {/* Keyed on the question, so the look of a flitsdictee starts again for
          every word and nothing typed for one is left in the next. */}
      <Vraag
        key={state.index}
        state={state}
        vraag={state.question}
        mode={mode}
        nextButton={nextButton}
        onChoose={choose}
        onSubmit={submit}
        onGiveUp={giveUp}
        onNext={next}
      />
    </div>
  );
}

/** Where a flitsdictee is: looking at the word, or writing it. */
type FlitsFase = 'kijken' | 'typen';

function Vraag({
  state,
  vraag,
  mode,
  nextButton,
  onChoose,
  onSubmit,
  onGiveUp,
  onNext,
}: {
  readonly state: TaalRoundState;
  readonly vraag: TaalVraag;
  readonly mode: TaalMode;
  readonly nextButton: RefObject<HTMLButtonElement>;
  readonly onChoose: (optie: string) => void;
  readonly onSubmit: (getypt: string) => void;
  readonly onGiveUp: () => void;
  readonly onNext: () => void;
}) {
  const revealed = state.phase === 'revealed';
  const typen = typtHet(mode);
  const flits = mode === 'taal-flitsdictee';
  const werkwoord = vraag.soort === 'werkwoord';
  // What stands in the sentence: the word, or the form of the verb.
  const woord = vraag.soort === 'werkwoord' ? vraag.item.antwoord : vraag.item.woord;
  const delen = zinDelen(vraag.item.zin, woord) ?? { voor: vraag.item.zin, woord, na: '' };

  const [fase, setFase] = useState<FlitsFase>(flits ? 'kijken' : 'typen');
  const zinRef = useRef<HTMLParagraphElement>(null);
  const timer = useRef<number | null>(null);

  /**
   * The look starts when the sentence has been put in front of the child: on
   * the frame it takes focus, which is also the moment a screen reader starts
   * reading it out. So for someone listening the three seconds count from
   * there, and not from a moment they could not see.
   */
  const kijk = useCallback(() => {
    if (timer.current !== null) return;
    timer.current = window.setTimeout(() => setFase('typen'), FLITS_KIJKTIJD_MS);
  }, []);

  useEffect(() => {
    if (!flits || revealed) return;
    const zin = zinRef.current;
    zin?.focus();
    // Where focus could not be put, the look starts anyway.
    if (document.activeElement !== zin) kijk();
  }, [flits, revealed, kijk]);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  const kijken = flits && fase === 'kijken' && !revealed;
  const instruction = kijken
    ? t('taal.flitsKijk')
    : flits
      ? t('taal.flitsTyp')
      : werkwoord
        ? typen
          ? t('taal.vormTyp')
          : t('taal.vormVraag')
        : t('taal.lettersVraag');
  const prompt = kijken
    ? t('taal.flitsKijkPrompt')
    : flits
      ? t('taal.flitsTypPrompt')
      : werkwoord
        ? t('taal.vormPrompt')
        : t('taal.lettersPrompt');

  const given = state.given;
  const correct = state.lastCorrect;
  const regel = revealed && !correct ? regelVoor(vraag) : null;

  const kop = correct
    ? t('taal.goed', { woord })
    : vraag.soort === 'spelling'
      ? t('taal.fout', { woord, letters: gatLetters(vraag.item) })
      : t('taal.foutVorm', { woord });

  // What the child answered, quoted back: the letters they chose, or what they
  // typed with the letters that differ marked.
  const sub: ReactNode = correct
    ? null
    : given === null
      ? t('taal.weetNiet')
      : typen
        ? metInvulling(
            t('taal.jeSchreef'),
            <Stukken stukken={letterVerschil(given, woord).getypt} />,
          )
        : t('taal.jijKoos', { gegeven: given });
  const subGesproken = correct
    ? ''
    : given === null
      ? t('taal.weetNiet')
      : typen
        ? t('taal.jeSchreef', { getypt: given })
        : t('taal.jijKoos', { gegeven: gespeld(given) });

  const gesproken = revealed ? [kop, subGesproken, regel ?? ''].join(' ').trim() : instruction;

  return (
    <>
      {/* Announced separately from the heading, so a screen reader hears every
          new question. Never the word of a flitsdictee: the sentence itself is
          read out when it takes focus, once. */}
      <p className="tk-sr-only" role="status" aria-live="polite">
        {gesproken}
      </p>

      <div className="tk-round-body">
        <div className="tk-round-question">
          {revealed ? (
            <>
              <div className="flex items-start gap-4">
                <UitkomstTeken uitkomst={correct ? 'goed' : 'fout'} />
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="tk-display text-sectiekop">{kop}</p>
                  {sub === null ? null : <p className="text-lopend text-tekst-secundair">{sub}</p>}
                  {regel === null ? null : <p className="text-lopend">{regel}</p>}
                </div>
                <RondeDenker uitkomst={correct ? 'goed' : 'fout'} />
              </div>

              <button ref={nextButton} type="button" className="tk-button mt-4" onClick={onNext}>
                {t('practice.next')}
              </button>
            </>
          ) : (
            <>
              <p className="tk-label">{instruction}</p>
              <h1 className="tk-display mt-1 text-vraag">{prompt}</h1>
              {!typen && vraag.opties ? (
                <div
                  className="tk-options"
                  role="group"
                  aria-label={werkwoord ? t('taal.vormLabel') : t('taal.lettersLabel')}
                >
                  {vraag.opties.map((optie) => (
                    <button
                      key={optie}
                      type="button"
                      className="tk-option"
                      // "ei" and "ij" sound the same; the name spells them.
                      aria-label={werkwoord ? undefined : gespeld(optie)}
                      onClick={() => onChoose(optie)}
                    >
                      {optie}
                    </button>
                  ))}
                </div>
              ) : null}
              <button
                type="button"
                className="tk-button tk-button-secondary mt-4"
                onClick={onGiveUp}
              >
                {t('practice.dontKnow')}
              </button>
            </>
          )}
        </div>

        {/* Where the map is on the map's screen: here, the sentence. */}
        <div className="tk-round-map">
          <div className="tk-zin-podium">
            {revealed ? (
              <p className="tk-zin">
                {delen.voor}
                <Antwoord
                  vraag={vraag}
                  delen={delen}
                  given={given}
                  typen={typen}
                  correct={correct}
                />
                {delen.na}
              </p>
            ) : kijken ? (
              <p ref={zinRef} className="tk-zin" tabIndex={-1} onFocus={kijk}>
                {delen.voor}
                <span className="tk-letters">{delen.woord}</span>
                {delen.na}
              </p>
            ) : typen ? (
              <ZinVeld
                delen={delen}
                label={
                  vraag.soort === 'werkwoord'
                    ? t('taal.vormVeld', { infinitief: vraag.item.infinitief })
                    : t('taal.flitsVeld')
                }
                onSubmit={onSubmit}
              />
            ) : (
              <p className="tk-zin">
                {delen.voor}
                {vraag.soort === 'spelling' ? (
                  <WoordMetGat woord={delen.woord} gat={vraag.item.gat} />
                ) : (
                  <Gat breed />
                )}
                {delen.na}
              </p>
            )}
            {vraag.soort === 'werkwoord' ? (
              <p className="text-lopend text-tekst-secundair">
                {t('taal.infinitief', { infinitief: vraag.item.infinitief })}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * A sentence from the copy with a marked word where its placeholder is: t() leaves
 * `{getypt}` alone when it is given nothing to put there.
 */
function metInvulling(zin: string, invulling: ReactNode): ReactNode {
  const [voor = '', na = ''] = zin.split('{getypt}');
  return (
    <>
      {voor}
      {invulling}
      {na}
    </>
  );
}

/** A word in runs, the runs that differ marked by a wavy rule as well as a tint. */
function Stukken({ stukken }: { readonly stukken: readonly Stuk[] }) {
  return (
    <>
      {stukken.map((stuk, index) =>
        stuk.anders ? (
          <mark key={index} className="tk-verschil">
            {stuk.tekst}
          </mark>
        ) : (
          <span key={index}>{stuk.tekst}</span>
        ),
      )}
    </>
  );
}

/** The gap: a box where letters go, which a screen reader calls what it is. */
function Gat({ breed = false }: { readonly breed?: boolean }) {
  return (
    <span className={breed ? 'tk-gat tk-gat-woord' : 'tk-gat'}>
      <span className="tk-sr-only">{t('taal.gat')}</span>
    </span>
  );
}

/** "tr▢n": the word with the letters that decide taken out. */
function WoordMetGat({
  woord,
  gat,
}: {
  readonly woord: string;
  readonly gat: readonly [number, number];
}) {
  return (
    <span className="whitespace-nowrap">
      {woord.slice(0, gat[0])}
      <Gat />
      {woord.slice(gat[1])}
    </span>
  );
}

/**
 * The word as it should have been, in the sentence, after an answer: the
 * letters that decide marked, or — after a typed answer that was wrong — the
 * letters the child's word did not have.
 */
function Antwoord({
  vraag,
  delen,
  given,
  typen,
  correct,
}: {
  readonly vraag: TaalVraag;
  readonly delen: ZinDelen;
  readonly given: string | null;
  readonly typen: boolean;
  readonly correct: boolean;
}) {
  if (typen && !correct && given !== null) {
    return <Stukken stukken={letterVerschil(given, delen.woord).goed} />;
  }
  if (vraag.soort === 'werkwoord') return <mark className="tk-letters">{delen.woord}</mark>;

  const [begin, eind] = vraag.item.gat;
  return (
    <span className="whitespace-nowrap">
      {delen.woord.slice(0, begin)}
      <mark className="tk-letters">{delen.woord.slice(begin, eind)}</mark>
      {delen.woord.slice(eind)}
    </span>
  );
}

/**
 * The sentence with a field in the gap: the whole word after the flitsdictee's
 * look, or the verb form.
 *
 * Nothing on the device may spell for the child: no autocomplete, no
 * autocorrect, no capital put in for them, no spelling check underlining the
 * word they are asked to spell (ADR-118). The typing itself has no clock.
 */
function ZinVeld({
  delen,
  label,
  onSubmit,
}: {
  readonly delen: ZinDelen;
  readonly label: string;
  readonly onSubmit: (value: string) => void;
}) {
  const [value, setValue] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const zinId = useId();

  useEffect(() => {
    input.current?.focus();
  }, []);

  function handle(event: FormEvent) {
    event.preventDefault();
    if (value.trim().length === 0) return;
    onSubmit(value);
  }

  return (
    <form onSubmit={handle} className="flex flex-col items-start gap-4">
      {/* The sentence with its gap, for a screen reader, as the field's
          description: the field's name says what goes in it. */}
      <span id={zinId} className="tk-sr-only">
        {`${delen.voor}…${delen.na}`}
      </span>
      <p className="tk-zin">
        {delen.voor}
        <input
          ref={input}
          className="tk-input tk-zin-veld"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          aria-label={label}
          aria-describedby={zinId}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={40}
        />
        {delen.na}
      </p>
      <button
        type="submit"
        className="tk-button flex-none whitespace-nowrap"
        disabled={value.trim().length === 0}
      >
        {t('practice.check')}
      </button>
    </form>
  );
}
