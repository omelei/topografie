/**
 * Het account van de ouder, op "Voor ouders" (ADR-155).
 *
 * Eén blok met drie standen: niet beschikbaar, niet ingelogd, ingelogd. Meer is
 * het niet, en meer hoort het in deze fase ook niet te zijn — het kind komt in
 * F3, de kinderen van deze ouder in F5.
 *
 * **Het staat op Voor ouders en niet op de voordeur.** Inloggen is een aanbod en
 * geen poort (ADR-152): zonder account werkt alles zoals het werkte, en een kind
 * dat de app opent hoort niet als eerste een inlogscherm te zien. Dit is de
 * pagina waar de volwassene toch al komt voor de code en de instellingen.
 *
 * Aanmelden zit erbij omdat inloggen zonder aanmelden niets is: er zou niemand
 * zijn om in te loggen. Wat er níét bij zit is een wachtwoord vergeten — dat
 * loopt via Supabase' eigen mail en komt met de schermen van F5.
 */

import { useId, useState, type FormEvent } from 'react';
import { t, type TranslationKey } from '@/i18n';
import type { AccountFout, AccountUitkomst } from '@/store/account';
import { useAccount } from './useAccount';

const FOUT: Record<AccountFout, TranslationKey> = {
  leeg: 'account.fout.leeg',
  'geen-email': 'account.fout.geen-email',
  'te-kort': 'account.fout.te-kort',
  onjuist: 'account.fout.onjuist',
  'bestaat-al': 'account.fout.bestaat-al',
  'bevestig-email': 'account.fout.bevestig-email',
  'te-vaak': 'account.fout.te-vaak',
  'geen-verbinding': 'account.fout.geen-verbinding',
  'niet-ingesteld': 'account.fout.niet-ingesteld',
};

type Modus = 'inloggen' | 'aanmelden';

export function AccountBlok() {
  const { sessie, ingesteld, inloggen, aanmelden, uitloggen } = useAccount();

  return (
    <section className="flex flex-col gap-3" aria-label={t('account.titel')}>
      <h2 className="tk-sectie">{t('account.titel')}</h2>
      {!ingesteld ? (
        <p className="text-lopend text-tekst-secundair">{t('account.fout.niet-ingesteld')}</p>
      ) : sessie === null ? (
        <Formulier onInloggen={inloggen} onAanmelden={aanmelden} />
      ) : (
        <Ingelogd email={sessie.email} onUitloggen={uitloggen} />
      )}
    </section>
  );
}

function Ingelogd({
  email,
  onUitloggen,
}: {
  readonly email: string;
  readonly onUitloggen: () => Promise<void>;
}) {
  const [bezig, setBezig] = useState(false);

  async function uit() {
    setBezig(true);
    await onUitloggen();
    setBezig(false);
  }

  return (
    <div className="tk-card flex flex-col gap-3">
      <p className="text-lopend">{t('account.ingelogd', { email })}</p>
      <button
        type="button"
        className="tk-button tk-button-secondary self-start"
        disabled={bezig}
        onClick={() => void uit()}
      >
        {t('account.uitloggen')}
      </button>
      <p className="tk-hulp">{t('account.uitloggenUitleg')}</p>
    </div>
  );
}

function Formulier({
  onInloggen,
  onAanmelden,
}: {
  readonly onInloggen: (email: string, wachtwoord: string) => Promise<AccountUitkomst>;
  readonly onAanmelden: (email: string, wachtwoord: string) => Promise<AccountUitkomst>;
}) {
  const [modus, setModus] = useState<Modus>('inloggen');
  const [email, setEmail] = useState('');
  const [wachtwoord, setWachtwoord] = useState('');
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<AccountFout | null>(null);
  const [gemaild, setGemaild] = useState(false);

  const emailVeld = useId();
  const wachtwoordVeld = useId();
  const melding = useId();

  async function verstuur(event: FormEvent) {
    event.preventDefault();
    setBezig(true);
    setFout(null);
    setGemaild(false);

    const uitkomst =
      modus === 'inloggen'
        ? await onInloggen(email, wachtwoord)
        : await onAanmelden(email, wachtwoord);
    setBezig(false);

    if (!uitkomst.ok) {
      setFout(uitkomst.reden);
      return;
    }
    setWachtwoord('');
    // Aangemeld zonder sessie betekent: er staat een mail klaar om op te
    // klikken. Dat is geen fout, en het zou als fout lezen in het rode vak.
    if (modus === 'aanmelden' && uitkomst.sessie === null) setGemaild(true);
  }

  function wissel() {
    setModus(modus === 'inloggen' ? 'aanmelden' : 'inloggen');
    setFout(null);
    setGemaild(false);
  }

  return (
    <>
      <p className="text-lopend text-tekst-secundair">{t('account.uitleg')}</p>
      <form className="tk-card flex flex-col gap-3" onSubmit={(event) => void verstuur(event)}>
        <label htmlFor={emailVeld} className="tk-label">
          {t('account.email')}
        </label>
        <input
          id={emailVeld}
          className="tk-input max-w-xs"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          spellCheck={false}
          maxLength={254}
          aria-describedby={fout ? melding : undefined}
          aria-invalid={fout ? true : undefined}
        />

        <label htmlFor={wachtwoordVeld} className="tk-label">
          {t('account.wachtwoord')}
        </label>
        <input
          id={wachtwoordVeld}
          className="tk-input max-w-xs"
          type="password"
          value={wachtwoord}
          onChange={(event) => setWachtwoord(event.target.value)}
          autoComplete={modus === 'inloggen' ? 'current-password' : 'new-password'}
          maxLength={200}
          aria-describedby={fout ? melding : undefined}
          aria-invalid={fout ? true : undefined}
        />
        {modus === 'aanmelden' ? <p className="tk-hulp">{t('account.wachtwoordHint')}</p> : null}

        <button type="submit" className="tk-button self-start" disabled={bezig}>
          {bezig
            ? t('account.bezig')
            : modus === 'inloggen'
              ? t('account.inloggen')
              : t('account.aanmelden')}
        </button>

        {fout ? (
          <p id={melding} role="alert" className="text-lopend">
            {t(FOUT[fout])}
          </p>
        ) : null}
        {gemaild ? (
          <p role="status" className="text-lopend">
            {t('account.gemaild')}
          </p>
        ) : null}

        <button
          type="button"
          className="tk-button tk-button-tertiary self-start"
          onClick={wissel}
          disabled={bezig}
        >
          {modus === 'inloggen' ? t('account.naarAanmelden') : t('account.naarInloggen')}
        </button>
      </form>
    </>
  );
}
