import { useEffect, useId, useState, type FormEvent } from 'react';
import { CorrectIcon, SlotIcon } from '@/components/Icon';
import { t } from '@/i18n';
import type { AccountFout, Terugkeer } from '@/store/account';
import { ACCOUNT_FOUT } from './fouten';
import { useAccount } from './useAccount';

/**
 * Waar de link uit een herstelmail op uitkomt (ADR-186).
 *
 * Een scherm van zijn eigen, zoals `#diagnose`, en niet achter de pincode: wie
 * hier komt, is juist zijn wachtwoord kwijt en vaak ook zijn pincode, en de link
 * wordt net zo goed op een telefoon geopend waar nog nooit een kind heeft
 * geoefend. Wat hier de deur is, is de mail zelf: alleen wie die postbus kan
 * openen, heeft deze link.
 *
 * Het nieuwe wachtwoord opent de ouderpagina niet vanzelf. Daarna staat de
 * gewone deur er weer: de pincode, of "Pincode vergeten?" met het wachtwoord dat
 * hier net gekozen is (ADR-178). Eén deur per slot, en deze link is er geen
 * tweede naar binnen.
 *
 * De tokens staan in het adres achter het hekje, en worden daar meteen
 * weggehaald: een adres met een sessie erin hoort niet in de geschiedenis van
 * een gedeelde tablet te blijven staan.
 */
export function NieuwWachtwoord({ terugkeer }: { readonly terugkeer: Terugkeer }) {
  useEffect(() => {
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
  }, []);

  return (
    <div className="tk-page">
      <div className="tk-page-main">
        <div className="tk-card flex max-w-md flex-col gap-3">
          {terugkeer.soort === 'herstel' ? (
            <Formulier email={terugkeer.sessie.email} terugkeer={terugkeer} />
          ) : (
            <>
              <p className="tk-kaartteken">
                <SlotIcon size={24} />
              </p>
              <h1 className="tk-titel">{t('herstel.verlopenTitel')}</h1>
              <p className="text-lopend">{t('herstel.verlopenUitleg')}</p>
              <a className="tk-button self-start" href="/ouder">
                {t('herstel.naarOuder')}
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Formulier({
  email,
  terugkeer,
}: {
  readonly email: string;
  readonly terugkeer: Extract<Terugkeer, { soort: 'herstel' }>;
}) {
  const { nieuwWachtwoord } = useAccount();
  const [wachtwoord, setWachtwoord] = useState('');
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<AccountFout | null>(null);
  const [klaar, setKlaar] = useState(false);

  const veld = useId();
  const melding = useId();

  async function verstuur(event: FormEvent) {
    event.preventDefault();
    setBezig(true);
    setFout(null);
    const uitkomst = await nieuwWachtwoord(terugkeer.sessie, wachtwoord);
    setBezig(false);
    if (!uitkomst.ok) {
      setFout(uitkomst.reden);
      return;
    }
    setWachtwoord('');
    setKlaar(true);
  }

  if (klaar) {
    return (
      <>
        <p className="tk-kaartteken">
          <CorrectIcon size={24} />
        </p>
        <h1 className="tk-titel">{t('herstel.titel')}</h1>
        <p role="status" className="tk-melding" data-soort="gelukt">
          {t('herstel.klaar')}
        </p>
        <a className="tk-button self-start" href="/ouder">
          {t('herstel.naarOuder')}
        </a>
      </>
    );
  }

  return (
    <form className="flex flex-col gap-3" noValidate onSubmit={(event) => void verstuur(event)}>
      <p className="tk-kaartteken">
        <SlotIcon size={24} />
      </p>
      <h1 className="tk-titel">{t('herstel.titel')}</h1>
      <p className="text-lopend">{t('herstel.uitleg', { email })}</p>

      <label htmlFor={veld} className="tk-label">
        {t('herstel.veld')}
      </label>
      <input
        id={veld}
        className="tk-input max-w-xs"
        type="password"
        autoComplete="new-password"
        maxLength={200}
        value={wachtwoord}
        onChange={(event) => setWachtwoord(event.target.value)}
        aria-describedby={fout ? melding : undefined}
        aria-invalid={fout ? true : undefined}
      />
      <p className="tk-hulp">{t('account.wachtwoordHint')}</p>

      <button type="submit" className="tk-button self-start" disabled={bezig}>
        {bezig ? t('account.bezig') : t('herstel.knop')}
      </button>

      {fout ? (
        <p id={melding} role="alert" className="tk-melding" data-soort="fout">
          {t(ACCOUNT_FOUT[fout])}
        </p>
      ) : null}
    </form>
  );
}
