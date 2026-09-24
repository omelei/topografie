/**
 * Het account, onderaan Premium (ADR-155, ADR-172).
 *
 * Twee standen: niet ingelogd en ingelogd. Meer is het niet, en meer hoort het
 * in deze fase ook niet te zijn — het kind komt in F3, de kinderen van deze
 * ouder in F5.
 *
 * **Het staat niet op de voordeur.** Inloggen is een aanbod en geen poort
 * (ADR-152): zonder account werkt alles zoals het werkte, en een kind dat de
 * app opent hoort niet als eerste een inlogscherm te zien.
 *
 * **En niet meer op Jij.** ADR-171 zette het daar, als het account van wie hier
 * oefent. Maar een e-mailadres en een wachtwoord zijn van de ouder (ADR-155),
 * en een kind van zes vragen om allebei is in de stem van het kind iets tegen
 * een ouder zeggen. De ouder komt op Premium uit — "Ik ben een ouder" opent die
 * pagina (ADR-171) — dus daar staat het. Het kind krijgt in F3 zijn eigen
 * inlogcode, en die hoort dan wel op Jij.
 *
 * **Zonder gezinsproject staat er niets** (ADR-172). Het was één regel, "Inloggen
 * is nog niet beschikbaar", onder een kop: een blok zonder iets om te doen.
 *
 * Aanmelden zit erbij omdat inloggen zonder aanmelden niets is: er zou niemand
 * zijn om in te loggen. En sinds ADR-186 ook een wachtwoord vergeten: sinds
 * ADR-178 is dit blok de poort vóór de pincode, en een poort zonder die uitweg
 * sloot een ouder buiten die zijn wachtwoord kwijt was.
 */

import { useId, useState, type FormEvent } from 'react';
import { t } from '@/i18n';
import type { AccountFout } from '@/store/account';
import { ACCOUNT_FOUT } from './fouten';
import { useAccount, type Aanmeldpoging, type Herstelpoging, type Uitloggen } from './useAccount';

type Modus = 'inloggen' | 'aanmelden' | 'herstellen';

export function AccountBlok() {
  const { sessie, ingesteld, inloggen, aanmelden, uitloggen, herstel } = useAccount();

  if (!ingesteld) return null;

  return (
    <section className="flex flex-col gap-3" aria-label={t('account.titel')}>
      <h2 className="tk-sectie">{t('account.titel')}</h2>
      {sessie === null ? (
        <Formulier onInloggen={inloggen} onAanmelden={aanmelden} onHerstel={herstel} />
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
  readonly onUitloggen: Uitloggen;
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

const KNOP = {
  inloggen: 'account.inloggen',
  aanmelden: 'account.aanmelden',
  herstellen: 'account.herstelKnop',
} as const;

function Formulier({
  onInloggen,
  onAanmelden,
  onHerstel,
}: {
  readonly onInloggen: Aanmeldpoging;
  readonly onAanmelden: Aanmeldpoging;
  readonly onHerstel: Herstelpoging;
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
      modus === 'herstellen'
        ? await onHerstel(email)
        : modus === 'inloggen'
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
    // Een herstelmail is altijd zo'n mail.
    if (modus === 'herstellen' || (modus === 'aanmelden' && uitkomst.sessie === null)) {
      setGemaild(true);
    }
  }

  function wissel(naar: Modus) {
    setModus(naar);
    setFout(null);
    setGemaild(false);
  }

  return (
    <>
      <p className="text-lopend text-tekst-secundair">{t('account.uitleg')}</p>
      {/*
        Geen browservalidatie: `type="email"` zou het formulier zelf tegenhouden,
        met een ballon die per browser anders is en die niet in het meldingsvak
        staat. Het oordeel hoort bij `invoerFout`, zodat er één antwoord is en
        een schermlezer het ook krijgt.
      */}
      <form
        className="tk-card flex flex-col gap-3"
        noValidate
        onSubmit={(event) => void verstuur(event)}
      >
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

        {modus === 'herstellen' ? (
          <p className="tk-hulp">{t('account.herstelUitleg')}</p>
        ) : (
          <>
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
          </>
        )}
        {modus === 'aanmelden' ? <p className="tk-hulp">{t('account.wachtwoordHint')}</p> : null}

        <button type="submit" className="tk-button self-start" disabled={bezig}>
          {bezig ? t('account.bezig') : t(KNOP[modus])}
        </button>

        {fout ? (
          <p id={melding} role="alert" className="tk-melding" data-soort="fout">
            {/* Bij een herstelmail is er maar één veld, en "vul allebei in" zou
                naar een wachtwoord vragen dat hier niet gevraagd wordt. */}
            {fout === 'leeg' && modus === 'herstellen'
              ? t('account.fout.leegAdres')
              : t(ACCOUNT_FOUT[fout])}
          </p>
        ) : null}
        {gemaild ? (
          <p role="status" className="tk-melding" data-soort="gelukt">
            {modus === 'herstellen' ? t('account.herstelGemaild') : t('account.gemaild')}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="tk-button tk-button-tertiary"
            onClick={() => wissel(modus === 'inloggen' ? 'aanmelden' : 'inloggen')}
            disabled={bezig}
          >
            {modus === 'inloggen'
              ? t('account.naarAanmelden')
              : modus === 'herstellen'
                ? t('account.terugNaarInloggen')
                : t('account.naarInloggen')}
          </button>
          {modus === 'inloggen' ? (
            <button
              type="button"
              className="tk-button tk-button-tertiary"
              onClick={() => wissel('herstellen')}
              disabled={bezig}
            >
              {t('account.wachtwoordVergeten')}
            </button>
          ) : null}
        </div>
      </form>
    </>
  );
}
