import { useId, useState, type FormEvent, type ReactNode } from 'react';
import { CorrectIcon } from '@/components/Icon';
import { t, type TranslationKey } from '@/i18n';
import { activeer, isTeKoop, meldAf, type PremiumReden } from '@/store/premium';
import { leesbareDatum, usePremium } from './usePremium';

/**
 * What is free and stays free (ADR-122), said as a list of the same weight as
 * the premium one (ADR-124). It is a complete practice programme, and a reader
 * who cannot see it cannot weigh what premium adds to it.
 */
const GRATIS: readonly TranslationKey[] = [
  'premium.gratis.vakken',
  'premium.gratis.manieren',
  'premium.gratis.fouten',
  'premium.gratis.tafeldiploma',
  'premium.gratis.voorspelling',
];

/**
 * Everything premium opens, in three groups (ADR-122, ADR-124).
 *
 * Nine bullets on one heap made a system that works over weeks read as a level
 * with a badge on it. The groups are ADR-122's argument in the order it makes
 * it: first the record that is kept across weeks, then the two ways of
 * checking yourself — which are only worth anything once you know it — and
 * last what you collect along the way.
 */
const WAT: readonly { readonly kop: TranslationKey; readonly punten: readonly TranslationKey[] }[] =
  [
    {
      kop: 'premium.groep.onthouden',
      punten: ['premium.functie.onthouden', 'premium.functie.fouten'],
    },
    {
      kop: 'premium.groep.checken',
      punten: ['premium.functie.toets', 'premium.functie.manieren'],
    },
    {
      kop: 'premium.groep.bijhouden',
      punten: [
        'premium.functie.diplomas',
        'premium.functie.badges',
        'premium.functie.reeks',
        'premium.functie.goed',
        'premium.functie.kinderen',
      ],
    },
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
 * The premium page: what it is, where you get one, and the field that turns it
 * on (ADR-116, ADR-123, ADR-124).
 *
 * Written for the parent, who is the one holding the code, and short enough
 * for the child who pressed a lock to read too. It says what is in premium,
 * what the code does and does not send, and — once it is on — until when, with
 * the way to take it off this device again so its place can go to another.
 *
 * **The order follows who arrives.** It used to open with the code field and
 * end with where you buy one, which is the order for the one reader who
 * already has a code. Almost everybody who gets here pressed a lock and has
 * none: the first thing they met was a field they could not fill, and the
 * offer was below a list of nine bullets. Without a code the page now reads
 * what it is → what it costs you nothing to keep → where to get one → and the
 * code field last, under "Heb je al een code?". With a code on it, the state
 * of this device comes first, because that is the question a returning parent
 * has.
 *
 * "Inloggen" is a code and nothing more. No e-mail and no password: there is no
 * account to sign in to (ADR-015), and a field for either would collect exactly
 * what this product has promised not to.
 */
export function PremiumScreen({ aside }: { readonly aside: ReactNode }) {
  const { actief, stand } = usePremium();

  return (
    <div className="tk-page">
      <div className="tk-page-main">
        <div className="flex flex-col gap-2">
          <h1 className="tk-titel">{t('premium.titel')}</h1>
          <p className="text-lopend text-tekst-secundair">{t('premium.intro')}</p>
        </div>

        {actief && stand ? (
          <>
            <AanOpDitApparaat geldigTot={stand.geldigTot} />
            <WatErInZit />
          </>
        ) : (
          <>
            <Vergelijking />
            <Kopen />
            {/* One primary button per screen: with a kassa the way on is
                buying one, and the code field is for the reader who already
                did. Without a kassa the code field is the only action there
                is, and it takes the weight back. */}
            <CodeVeld primair={!isTeKoop()} />
          </>
        )}

        <p className="tk-hulp">{t('premium.voorOuders')}</p>
      </div>

      {aside}
    </div>
  );
}

/** Premium is on here: until when, and how to free the place for another device. */
function AanOpDitApparaat({ geldigTot }: { readonly geldigTot: string }) {
  return (
    <section className="flex flex-col gap-3" aria-label={t('premium.codeTitel')}>
      <h2 className="tk-sectie">{t('premium.codeTitel')}</h2>
      <div className="tk-card flex flex-col gap-3">
        <p className="flex items-center gap-2 text-lopend">
          <CorrectIcon size={24} />
          {t('premium.aan', { datum: leesbareDatum(geldigTot) })}
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
    </section>
  );
}

/**
 * The two sides next to each other (ADR-124): what this family has without
 * paying, and what a code adds to it. Free first and the same width, because
 * ADR-122 made the free tier the whole of oefenen and a list that only shows
 * the paid half asks a reader to weigh an offer against nothing.
 */
function Vergelijking() {
  return (
    <section className="flex flex-col gap-3" aria-label={t('premium.vergelijkTitel')}>
      <h2 className="tk-sectie">{t('premium.vergelijkTitel')}</h2>

      <div className="tk-vergelijk">
        <div className="tk-card flex flex-col gap-3">
          <h3 className="tk-kaartkop">{t('premium.gratisTitel')}</h3>
          <ul className="tk-punten">
            {GRATIS.map((sleutel) => (
              <li key={sleutel}>{t(sleutel)}</li>
            ))}
          </ul>
        </div>

        <div className="tk-card tk-card-premium flex flex-col gap-3">
          <h3 className="tk-kaartkop">{t('premium.premiumTitel')}</h3>
          {WAT.map((groep) => (
            <div key={groep.kop} className="flex flex-col gap-2">
              <h4 className="tk-label">{t(groep.kop)}</h4>
              <ul className="tk-punten">
                {groep.punten.map((sleutel) => (
                  <li key={sleutel}>{t(sleutel)}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** The same list, once premium is on: no longer an offer, just what is in it. */
function WatErInZit() {
  return (
    <section className="flex flex-col gap-3" aria-label={t('premium.watTitel')}>
      <h2 className="tk-sectie">{t('premium.watTitel')}</h2>
      {WAT.map((groep) => (
        <div key={groep.kop} className="flex flex-col gap-2">
          <h3 className="tk-label">{t(groep.kop)}</h3>
          <ul className="tk-punten">
            {groep.punten.map((sleutel) => (
              <li key={sleutel}>{t(sleutel)}</li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

/**
 * Waar je er een koopt (ADR-123), en sinds ADR-124 vóór het codeveld: wie hier
 * vanaf een slot binnenkomt heeft geen code, en de kassa is voor die lezer het
 * antwoord.
 *
 * Een gewone link naar een gewone pagina op dit adres: de kassa staat buiten de
 * app, praat met Mollie en met niemand anders, en de app zelf blijft vragen aan
 * niemand stellen. Hij staat er alleen als er een premiumserver is om een code
 * bij te controleren — een knop naar een winkel die niet bestaat is erger dan
 * geen knop.
 */
function Kopen() {
  if (!isTeKoop()) return null;

  return (
    <section className="flex flex-col gap-3" aria-label={t('premium.kopenTitel')}>
      <h2 className="tk-sectie">{t('premium.kopenTitel')}</h2>
      <div className="tk-card flex flex-col gap-3">
        <p className="text-lopend">{t('premium.kopenUitleg')}</p>
        <a className="tk-button self-start" href={KASSA_PAD}>
          {t('premium.kopenKnop')}
        </a>
      </div>
    </section>
  );
}

/**
 * The one field that turns premium on. Last on the page without a code: it is
 * the step for the reader who already has one, and asking everybody else for a
 * code first is what made this page a dead end (ADR-124).
 */
function CodeVeld({ primair }: { readonly primair: boolean }) {
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
    <section className="flex flex-col gap-3" aria-label={t('premium.codeTitelNog')}>
      <h2 className="tk-sectie">{t('premium.codeTitelNog')}</h2>

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
        <button
          type="submit"
          className={primair ? 'tk-button self-start' : 'tk-button tk-button-secondary self-start'}
          disabled={bezig}
        >
          {bezig ? t('premium.bezig') : t('premium.codeGebruiken')}
        </button>
        {fout ? (
          <p id={melding} role="alert" className="text-lopend">
            {t(FOUT[fout])}
          </p>
        ) : null}
      </form>
    </section>
  );
}
