import { useEffect, useId, useState, type FormEvent } from 'react';
import { brand } from '@/config/brand';
import { Wordmark } from '@/components/Wordmark';
import type { Groep } from '@/game-core';
import { t, type TranslationKey } from '@/i18n';
import { createProfile } from '@/store/profile';
import { loadPlayedRounds } from '@/store/progress';
import { tel } from '@/store/teller';
import { isIngesteld } from '@/store/account';
import type { KindInlogUitkomst } from '@/store/gezin/kindinlog';
import type { ProfileRecord } from '@/store/db';
import { starters, type Onderdeel } from '@/features/module/onderdelen';
import { GroepKiezer } from './GroepKiezer';

/**
 * The first screen. It asks for a name, and then in which group the child is
 * — no e-mail, no age. The name is used to say hello and stays on the device
 * unless a parent takes the child into the family account (ADR-187), and the
 * copy says where it goes, because a child who is asked for their name
 * deserves to be told.
 *
 * **De groep is bewust teruggekomen** (ADR-151). Dit scherm vroeg eerst "no
 * class, no age", en dat was een keuze: wat je niet vraagt, hoef je niet te
 * bewaren. De groep is een aanwijzing voor de leeftijd, en hij wordt toch
 * gevraagd, omdat een kind uit groep 4 anders dezelfde voordeur krijgt als een
 * kind uit groep 8. Daarom kan hij altijd worden overgeslagen, blijft hij op
 * dit apparaat zoals de naam, en gaat hij nooit naar een derde. Het blijft bij
 * de groep: een leeftijd of een geboortedatum wordt nooit gevraagd.
 *
 * **De uitweg heet "Zeg ik niet"** (ADR-161). Hij heette "Weet ik niet", en dat
 * is het enige antwoord op deze kaart dat een kind iets over zichzelf laat
 * toegeven wat het gewoon weet. Overslaan hoort een keuze te zijn en geen
 * bekentenis; wat de app ermee doet, is precies hetzelfde.
 *
 * **En er is een derde weg: "Ik ben een ouder"** (ADR-161, ADR-198). Dit
 * scherm is het allereerste wat iemand van leer.nu ziet, en dat is vaak niet
 * het kind maar de volwassene die de app opzoekt. Een ouder oefent niet en is
 * dus geen profiel: de knop staat bij de naam, en daarna vraagt dezelfde kaart
 * naar de naam en de groep van het kind. Dat kind wordt gemaakt, en de app
 * opent op Premium, waar staat wat leer.nu doet en wat het kost. Tot ADR-198
 * stond de knop bij de groep en werd de ouder zelf het eerste kind: die telde
 * mee in de drie, en kon oefenen.
 *
 * Twee stappen op één kaart, en het kind bestaat pas na de tweede. Wie bij de
 * groep terug wil naar de naam, is nog niemand.
 *
 * **En een vierde: "Ik heb een inlogcode"** (ADR-190). Een kind dat al in een
 * gezinsaccount staat, logt hier in met zijn code en het wachtwoord dat zijn
 * ouder zette, en oefent verder waar het was. Alleen op een bouw met een
 * gezinsproject: zonder is er niets om in te loggen.
 */
export function ProfileGate({
  onReady,
  onProberen,
}: {
  /** Eerst proberen, zonder naam: opent het eerste onderwerp om mee te beginnen. */
  readonly onProberen?: (deel: Onderdeel) => void;
  /**
   * Het profiel bestaat. `naarOuder` zegt of de app op Premium moet openen
   * in plaats van op de voordeur: dat is geen eigenschap van het profiel, dus
   * het reist ernaast mee en wordt nergens bewaard.
   */
  readonly onReady: (profile: ProfileRecord, naarOuder?: boolean) => void;
}) {
  const [naam, setNaam] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [stap, setStap] = useState<'naam' | 'groep' | 'code'>('naam');
  const [voorOuder, setVoorOuder] = useState(false);
  const [busy, setBusy] = useState(false);
  // Of er zonder naam al een ronde gespeeld is (ADR-208). Dan zegt de kaart
  // waarom de naam nu gevraagd wordt: om te bewaren wat er net geoefend is.
  // Gelezen en niet doorgegeven, zodat het ook na herladen klopt.
  const [naRonde, setNaRonde] = useState(false);
  useEffect(() => {
    void loadPlayedRounds().then((rondes) => setNaRonde(rondes.length > 0));
  }, []);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (naam.trim().length < 2) {
      setError(t(voorOuder ? 'profile.ouder.nameTooShort' : 'profile.nameTooShort'));
      return;
    }
    setStap('groep');
  }

  async function kies(groep: Groep | undefined) {
    setBusy(true);
    const kind = await createProfile(naam, groep);
    // Onbereikbaar: dit scherm staat er alleen als er nog geen kind is, en de
    // grens van ADR-173 ligt op drie. Het vangnet staat er omdat `createChild`
    // sinds die grens mag weigeren, en een scherm dat dat negeert loopt vast op
    // een leeg profiel in plaats van op deze regel.
    if (kind === null) {
      setBusy(false);
      return;
    }
    tel('naam');
    onReady(kind, voorOuder);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-8 p-6">
      <div>
        <Wordmark height={40} />
        <p className="mt-1 text-tekst-secundair">{brand.slogan}</p>
        {/* Wie hier voor het eerst komt, leest eerst wat dit is (ADR-208). */}
        {naRonde ? null : <p className="mt-3 text-lopend">{t('profile.watIsHet')}</p>}
      </div>

      {stap === 'naam' ? (
        <form onSubmit={handleSubmit} className="tk-card flex flex-col gap-4">
          <h1 className="tk-titel">
            {t(
              voorOuder
                ? 'profile.ouder.title'
                : naRonde
                  ? 'profile.naRonde.title'
                  : 'profile.title',
            )}
          </h1>
          <label htmlFor="naam" className="text-tekst-secundair">
            {t(
              voorOuder ? 'profile.ouder.help' : naRonde ? 'profile.naRonde.help' : 'profile.help',
            )}
          </label>
          <input
            id="naam"
            className="tk-input"
            value={naam}
            onChange={(event) => {
              setNaam(event.target.value);
              setError(null);
            }}
            placeholder={t(voorOuder ? 'profile.ouder.placeholder' : 'profile.placeholder')}
            autoComplete="off"
            maxLength={24}
            aria-describedby={error ? 'naam-error' : undefined}
            aria-invalid={error !== null}
          />
          {error !== null && (
            <p id="naam-error" role="alert" className="font-semibold text-fout">
              {error}
            </p>
          )}
          <button type="submit" className="tk-button">
            {t(voorOuder ? 'profile.ouder.submit' : 'profile.submit')}
          </button>
          <button
            type="button"
            className="tk-button tk-button-tertiary self-start"
            onClick={() => {
              setVoorOuder(!voorOuder);
              setError(null);
            }}
          >
            {t(voorOuder ? 'profile.ouder.terug' : 'profile.ouder')}
          </button>
          {onProberen && !naRonde && !voorOuder ? (
            <button
              type="button"
              className="tk-button tk-button-tertiary self-start"
              onClick={() => {
                const eerste = starters()[0];
                if (eerste) onProberen(eerste.deel);
              }}
            >
              {t('profile.proberen')}
            </button>
          ) : null}
          {isIngesteld() && !voorOuder ? (
            <button
              type="button"
              className="tk-button tk-button-tertiary self-start"
              onClick={() => setStap('code')}
            >
              {t('inlog.knop')}
            </button>
          ) : null}
        </form>
      ) : stap === 'code' ? (
        <MetCode onReady={(profiel) => onReady(profiel)} onTerug={() => setStap('naam')} />
      ) : (
        <section className="tk-card flex flex-col gap-4" aria-labelledby="groep-vraag">
          <h1 id="groep-vraag" className="tk-titel">
            {voorOuder ? t('groep.ouder.vraag', { naam: naam.trim() }) : t('groep.vraag')}
          </h1>
          <p className="text-tekst-secundair">
            {t(voorOuder ? 'groep.ouder.uitleg' : 'groep.uitleg')}
          </p>
          <GroepKiezer
            gekozen={null}
            uitweg={voorOuder ? 'groep.ouder.overslaan' : 'groep.zegIkNiet'}
            label={voorOuder ? t('groep.ouder.vraag', { naam: naam.trim() }) : undefined}
            bezig={busy}
            onKies={(groep) => void kies(groep)}
          />
          <button
            type="button"
            className="tk-button tk-button-secondary"
            disabled={busy}
            onClick={() => setStap('naam')}
          >
            {t(voorOuder ? 'groep.ouder.terug' : 'groep.terug')}
          </button>
        </section>
      )}
    </main>
  );
}

const INLOG_FOUT: Record<Exclude<KindInlogUitkomst, { ok: true }>['reden'], TranslationKey> = {
  onjuist: 'inlog.fout.onjuist',
  'te-vaak': 'inlog.fout.te-vaak',
  leeg: 'inlog.fout.leeg',
  storing: 'inlog.fout.storing',
  'geen-verbinding': 'inlog.fout.geen-verbinding',
  vol: 'inlog.fout.vol',
};

/**
 * Inloggen met de code en het wachtwoord van een kind (ADR-190).
 *
 * De meldingen zijn die van ADR-155: één zin voor een onbekende code en een fout
 * wachtwoord, zodat niemand hier kan navragen welke codes bestaan, en bij te
 * vaak proberen de verwijzing naar een ouder.
 */
function MetCode({
  onReady,
  onTerug,
}: {
  readonly onReady: (profiel: ProfileRecord) => void;
  readonly onTerug: () => void;
}) {
  const [code, setCode] = useState('');
  const [wachtwoord, setWachtwoord] = useState('');
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<Exclude<KindInlogUitkomst, { ok: true }>['reden'] | null>(null);
  const codeVeld = useId();
  const wachtwoordVeld = useId();
  const melding = useId();

  async function verstuur(event: FormEvent) {
    event.preventDefault();
    if (code.trim() === '' || wachtwoord === '') {
      setFout('leeg');
      return;
    }
    setBezig(true);
    setFout(null);
    const [{ logInAlsKind }, { vervoer }] = await Promise.all([
      import('@/store/gezin/kindinlog'),
      import('@/store/gezin/vervoer'),
    ]);
    const uit = await logInAlsKind(code, wachtwoord, vervoer);
    setBezig(false);
    setWachtwoord('');
    if (uit.ok) onReady(uit.profiel);
    else setFout(uit.reden);
  }

  return (
    <form
      className="tk-card flex flex-col gap-4"
      noValidate
      onSubmit={(event) => void verstuur(event)}
    >
      <h1 className="tk-titel">{t('inlog.titel')}</h1>
      <p className="text-tekst-secundair">{t('inlog.uitleg')}</p>

      <label htmlFor={codeVeld} className="tk-label">
        {t('inlog.code')}
      </label>
      <input
        id={codeVeld}
        className="tk-input"
        value={code}
        onChange={(event) => setCode(event.target.value)}
        placeholder={t('inlog.codeVoorbeeld')}
        autoComplete="username"
        autoCapitalize="characters"
        spellCheck={false}
        maxLength={20}
        aria-describedby={fout ? melding : undefined}
        aria-invalid={fout ? true : undefined}
      />

      <label htmlFor={wachtwoordVeld} className="tk-label">
        {t('inlog.wachtwoord')}
      </label>
      <input
        id={wachtwoordVeld}
        className="tk-input"
        type="password"
        value={wachtwoord}
        onChange={(event) => setWachtwoord(event.target.value)}
        autoComplete="current-password"
        maxLength={200}
        aria-describedby={fout ? melding : undefined}
        aria-invalid={fout ? true : undefined}
      />

      <button type="submit" className="tk-button" disabled={bezig}>
        {bezig ? t('account.bezig') : t('inlog.verder')}
      </button>

      {fout ? (
        <p id={melding} role="alert" className="font-semibold text-fout">
          {t(INLOG_FOUT[fout])}
        </p>
      ) : null}

      <button
        type="button"
        className="tk-button tk-button-secondary"
        disabled={bezig}
        onClick={onTerug}
      >
        {t('groep.terug')}
      </button>
    </form>
  );
}
