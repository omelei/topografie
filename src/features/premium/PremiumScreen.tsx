import { useId, useState, type FormEvent, type ReactNode } from 'react';
import { CorrectIcon } from '@/components/Icon';
import { t, type TranslationKey } from '@/i18n';
import { activeer, isTeKoop, meldAf, type PremiumReden } from '@/store/premium';
import { leesbareDatum, usePremium } from './usePremium';

/**
 * Everything premium opens, with what it is for at the top (ADR-122): the two
 * that keep a record over weeks come first, then the two ways of checking
 * yourself, then what a family gets for the year.
 */
const WAT: readonly TranslationKey[] = [
  'premium.functie.onthouden',
  'premium.functie.fouten',
  'premium.functie.manieren',
  'premium.functie.toets',
  'premium.functie.diplomas',
  'premium.functie.badges',
  'premium.functie.reeks',
  'premium.functie.goed',
  'premium.functie.kinderen',
];

/**
 * De kassa, als adres. Geen route van de app maar een echte pagina onder
 * `public/kopen`, dus een gewone link die de app verlaat (ADR-123).
 */
const KASSA_PAD = '/kopen/';

const FOUT: Record<PremiumReden, TranslationKey> = {
  leeg: 'premium.fout.leeg',
  onbekend: 'premium.fout.onbekend',
  verlopen: 'premium.fout.verlopen',
  vol: 'premium.fout.vol',
  'te-vaak': 'premium.fout.te-vaak',
  'geen-verbinding': 'premium.fout.geen-verbinding',
  'niet-ingesteld': 'premium.fout.niet-ingesteld',
};

/**
 * The premium page: what it is, and the one field that turns it on (ADR-116).
 *
 * Written for the parent, who is the one holding the code, and short enough
 * for the child who pressed a lock to read too. It says what is in premium,
 * what the code does and does not send, and — once it is on — until when, with
 * the way to take it off this device again so its place can go to another.
 *
 * "Inloggen" is a code and nothing more. No e-mail and no password: there is no
 * account to sign in to (ADR-015), and a field for either would collect exactly
 * what this product has promised not to.
 */
export function PremiumScreen({ aside }: { readonly aside: ReactNode }) {
  const { actief, stand } = usePremium();
  const [invoer, setInvoer] = useState('');
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<PremiumReden | null>(null);
  const veld = useId();
  const melding = useId();

  async function gebruik(event: FormEvent) {
    event.preventDefault();
    setBezig(true);
    setFout(null);
    const uitkomst = await activeer(invoer);
    setBezig(false);
    if (uitkomst.ok) setInvoer('');
    else setFout(uitkomst.reden);
  }

  return (
    <div className="tk-page">
      <div className="tk-page-main">
        <div className="flex flex-col gap-2">
          <h1 className="tk-titel">{t('premium.titel')}</h1>
          <p className="text-lopend text-tekst-secundair">{t('premium.intro')}</p>
        </div>

        <section className="flex flex-col gap-3" aria-label={t('premium.codeTitel')}>
          <h2 className="tk-sectie">{t('premium.codeTitel')}</h2>

          {actief && stand ? (
            <div className="tk-card flex flex-col gap-3">
              <p className="flex items-center gap-2 text-lopend">
                <CorrectIcon size={24} />
                {t('premium.aan', { datum: leesbareDatum(stand.geldigTot) })}
              </p>
              <button
                type="button"
                className="tk-button tk-button-secondary self-start"
                onClick={() => void meldAf()}
              >
                {t('premium.afmelden')}
              </button>
              <p className="tk-hulp">{t('premium.afmeldenUitleg')}</p>
            </div>
          ) : (
            <form className="tk-card flex flex-col gap-3" onSubmit={(event) => void gebruik(event)}>
              <label htmlFor={veld} className="tk-label">
                {t('premium.codeLabel')}
              </label>
              <input
                id={veld}
                className="tk-input max-w-xs"
                value={invoer}
                onChange={(event) => setInvoer(event.target.value)}
                placeholder={t('premium.codePlaceholder')}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={20}
                aria-describedby={fout ? melding : undefined}
                aria-invalid={fout ? true : undefined}
              />
              <button type="submit" className="tk-button self-start" disabled={bezig}>
                {bezig ? t('premium.bezig') : t('premium.codeGebruiken')}
              </button>
              {fout ? (
                <p id={melding} role="alert" className="text-lopend">
                  {t(FOUT[fout])}
                </p>
              ) : null}
            </form>
          )}
        </section>

        <section className="flex flex-col gap-3" aria-label={t('premium.watTitel')}>
          <h2 className="tk-sectie">{t('premium.watTitel')}</h2>
          <ul className="flex list-disc flex-col gap-2 pl-6 text-lopend">
            {WAT.map((sleutel) => (
              <li key={sleutel}>{t(sleutel)}</li>
            ))}
          </ul>
          <p className="tk-hulp">{t('premium.gratis')}</p>
        </section>

        {/* Waar je er een koopt (ADR-123). Een gewone link naar een gewone pagina
            op dit adres: de kassa staat buiten de app, praat met Mollie en met
            niemand anders, en de app zelf blijft vragen aan niemand stellen. Hij
            staat er alleen als er een premiumserver is om een code bij te
            controleren — een knop naar een winkel die niet bestaat is erger dan
            geen knop. */}
        {actief || !isTeKoop() ? null : (
          <section className="flex flex-col gap-3" aria-label={t('premium.kopenTitel')}>
            <h2 className="tk-sectie">{t('premium.kopenTitel')}</h2>
            <div className="tk-card flex flex-col gap-3">
              <p className="text-lopend">{t('premium.kopenUitleg')}</p>
              <a className="tk-button self-start" href={KASSA_PAD}>
                {t('premium.kopenKnop')}
              </a>
            </div>
          </section>
        )}

        <p className="tk-hulp">{t('premium.voorOuders')}</p>
      </div>

      {aside}
    </div>
  );
}
