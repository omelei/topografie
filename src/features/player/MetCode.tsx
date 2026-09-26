import { useId, useState, type FormEvent } from 'react';
import { t, type TranslationKey } from '@/i18n';
import type { KindInlogUitkomst } from '@/store/gezin/kindinlog';
import type { ProfileRecord } from '@/store/db';

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
 * Dit stond op het naamscherm, dat er niet meer is (ADR-229). Nu opent het op
 * Vandaag, onder "Ik heb een inlogcode", zolang dit kind nog geen naam heeft:
 * wie inlogt, wordt het kind zonder naam dat hier al oefende.
 *
 * De meldingen zijn die van ADR-155: één zin voor een onbekende code en een fout
 * wachtwoord, zodat niemand hier kan navragen welke codes bestaan, en bij te
 * vaak proberen de verwijzing naar een ouder.
 */
export function MetCode({
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
      <h2 className="tk-sectie">{t('inlog.titel')}</h2>
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
        {t('inlog.terug')}
      </button>
    </form>
  );
}
