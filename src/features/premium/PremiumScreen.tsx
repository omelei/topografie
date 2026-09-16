import { useId, useState, type ComponentType, type FormEvent } from 'react';
import {
  CorrectIcon,
  DiplomaIcon,
  FamilyIcon,
  type IconProps,
  OogIcon,
  PupilIcon,
  ShieldIcon,
  StarIcon,
  TodayIcon,
} from '@/components/Icon';
import { t, type TranslationKey } from '@/i18n';
import {
  activeer,
  isTeKoop,
  isVerlopen,
  meldAf,
  verlooptBinnenkort,
  type PremiumReden,
} from '@/store/premium';
import { leesbareDatum, usePremium } from './usePremium';

/**
 * De kassa, als adres. Geen route van de app maar een echte pagina onder
 * `public/kopen`, dus een gewone link die de app verlaat (ADR-123).
 */
const KASSA_PAD = '/kopen/';

type Pictogram = ComponentType<Omit<IconProps, 'children'>>;

/**
 * Wat premium voor je doet, in vier klussen (ADR-124), elk met een teken
 * (ADR-145). De volgorde is die van ADR-124: het plannen bovenaan.
 */
const DOET: readonly (readonly [Pictogram, TranslationKey, TranslationKey])[] = [
  [TodayIcon, 'premium.usp.plan', 'premium.usp.planUit'],
  [OogIcon, 'premium.usp.zicht', 'premium.usp.zichtUit'],
  [DiplomaIcon, 'premium.usp.zelf', 'premium.usp.zelfUit'],
  [FamilyIcon, 'premium.usp.gezin', 'premium.usp.gezinUit'],
];

/** Waarom dit product en niet een ander. Geen functies: redenen om het te vertrouwen. */
const WAAROM: readonly (readonly [Pictogram, TranslationKey, TranslationKey])[] = [
  [ShieldIcon, 'premium.waarom.reclame', 'premium.waarom.reclameUit'],
  [PupilIcon, 'premium.waarom.apparaat', 'premium.waarom.apparaatUit'],
  [CorrectIcon, 'premium.waarom.abonnement', 'premium.waarom.abonnementUit'],
  [StarIcon, 'premium.waarom.gok', 'premium.waarom.gokUit'],
];

/**
 * Basis tegen premium, regel voor regel (ADR-145).
 *
 * `basis` zegt of de regel ook zonder code geldt. Elke regel is nagelopen tegen
 * waar het product het echt afschermt — `isPremiumVorm`, `isPremiumOnderwerp`,
 * en de blokken die zonder code een `PremiumSlot` tekenen — want een
 * vergelijking die iets belooft wat de app weigert, is de snelste manier om een
 * ouder kwijt te raken die net betaald heeft.
 */
interface Regel {
  readonly tekst: TranslationKey;
  readonly basis: boolean;
}

const VERGELIJK: readonly (readonly [TranslationKey, readonly Regel[]])[] = [
  [
    'premium.groep.oefenen',
    [
      { tekst: 'premium.regel.vakken', basis: true },
      { tekst: 'premium.regel.vormen', basis: true },
      { tekst: 'premium.regel.herhaal', basis: true },
      { tekst: 'premium.regel.voorspelling', basis: true },
    ],
  ],
  [
    'premium.groep.belonen',
    [
      { tekst: 'premium.regel.helden', basis: true },
      { tekst: 'premium.regel.tafeldiploma', basis: true },
      { tekst: 'premium.regel.reeks', basis: true },
      { tekst: 'premium.regel.diplomas', basis: false },
    ],
  ],
  [
    'premium.groep.onthouden',
    [
      { tekst: 'premium.regel.plan', basis: false },
      { tekst: 'premium.regel.onthouden', basis: false },
      { tekst: 'premium.regel.fouten', basis: false },
      { tekst: 'premium.regel.toets', basis: false },
    ],
  ],
  [
    'premium.groep.uitdagen',
    [
      { tekst: 'premium.regel.oefentoets', basis: false },
      { tekst: 'premium.regel.bliksem', basis: false },
    ],
  ],
  [
    'premium.groep.ouders',
    [
      { tekst: 'premium.regel.bericht', basis: false },
      { tekst: 'premium.regel.lijsten', basis: false },
      { tekst: 'premium.regel.kalender', basis: false },
      { tekst: 'premium.regel.gezin', basis: false },
    ],
  ],
];

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
 * De premiumpagina: wat het is, wat het kost, en pas daarna het veld (ADR-116,
 * ADR-124, ADR-145).
 *
 * Hij leest in de volgorde van de beslissing: in één zin wat het is en wat het
 * kost, wat het voor je doet, wat je precies krijgt tegenover wat gratis is,
 * waarom je ons kunt vertrouwen — en helemaal onderaan het veld voor wie al een
 * code heeft.
 *
 * **Tot ADR-145 was hij een lijst.** Vier koppen met een regel eronder, twee
 * opsommingen met bolletjes en een prijs in een kaart: alles even zwaar, en
 * niets dat een ouder uitnodigde. Nu is het een etalage, zoals een prijspagina
 * er een is: een kop met de prijs en de knop, vier kaarten met een teken, en
 * Basis en Premium naast elkaar met per regel wat erin zit. Binnen de huisstijl:
 * indigo voor wat je indrukt, groen voor premium, geen schaduw.
 *
 * **Zonder kolom ernaast** (ADR-145). Het toetsblok stond hier sinds ADR-143,
 * met de redenering dat een ouder de toetsdatum invoert. Maar niemand opent de
 * premiumpagina om een toets te plannen, en de vergelijking heeft de breedte
 * nodig.
 *
 * **Met een code verandert de pagina van rol.** Dan is er niets meer te
 * verkopen: bovenaan staat tot wanneer het aanstaat en hoe je het van dit
 * apparaat haalt, en de rest is er niet.
 */
export function PremiumScreen({ now = new Date() }: { readonly now?: Date }) {
  const { actief, stand } = usePremium();
  const verlopen = isVerlopen(stand, now);
  const bijnaAf = actief && verlooptBinnenkort(stand, now);

  return (
    <div className="tk-page tk-page-enkel">
      <div className="tk-page-main">
        <div className="flex flex-col gap-2">
          <h1 className="tk-titel">{t('premium.titel')}</h1>
          {actief ? (
            <p className="text-lopend text-tekst-secundair">{t('premium.introAan')}</p>
          ) : null}
        </div>

        {/* Wie een jaar betaald heeft en over de datum is, kreeg tot ADR-129
            precies dezelfde pagina als iemand die nog nooit van premium had
            gehoord. Dat is niet alleen kil, het is ook het moment waarop een
            ouder denkt dat de voortgang weg is — terwijl die gewoon op het
            apparaat staat en dat de reden is om te verlengen. */}
        {verlopen && stand ? (
          <p className="tk-card text-lopend">
            {t('premium.verlopen', { datum: leesbareDatum(stand.geldigTot) })}
          </p>
        ) : null}

        {bijnaAf && stand ? (
          <p className="tk-card text-lopend">
            {t('premium.bijnaAf', { datum: leesbareDatum(stand.geldigTot) })}
          </p>
        ) : null}

        {actief && stand ? <Aan tot={stand.geldigTot} /> : <Aanbod />}
      </div>
    </div>
  );
}

/** Voor wie al betaald heeft: de stand, en de weg terug. Verder niets. */
function Aan({ tot }: { readonly tot: string }) {
  return (
    <section className="flex flex-col gap-3" aria-label={t('premium.codeTitel')}>
      <h2 className="tk-sectie">{t('premium.codeTitel')}</h2>
      <div className="tk-card flex flex-col gap-3">
        <p className="flex items-center gap-2 text-lopend">
          <CorrectIcon size={24} />
          {t('premium.aan', { datum: leesbareDatum(tot) })}
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

function Aanbod() {
  // De prijs en de knop alleen als er echt gekocht kan worden (ADR-123): een
  // bedrag op een pagina zonder kassa is een doodlopende weg.
  const teKoop = isTeKoop();

  return (
    <>
      <Etalage teKoop={teKoop} />

      <section className="flex flex-col gap-4" aria-label={t('premium.watTitel')}>
        <h2 className="tk-sectie">{t('premium.watTitel')}</h2>
        <ul className="tk-premium-usps">
          {DOET.map(([Teken, kop, uitleg]) => (
            <li key={kop} className="tk-premium-usp">
              <span className="tk-premium-teken">
                <Teken size={24} />
              </span>
              <span className="tk-premium-usp-kop">{t(kop)}</span>
              <span className="text-lopend text-tekst-secundair">{t(uitleg)}</span>
            </li>
          ))}
        </ul>
      </section>

      <Vergelijking teKoop={teKoop} />

      <section className="flex flex-col gap-4" aria-label={t('premium.waaromTitel')}>
        <h2 className="tk-sectie">{t('premium.waaromTitel')}</h2>
        <ul className="tk-premium-waarom">
          {WAAROM.map(([Teken, kop, uitleg]) => (
            <li key={kop} className="tk-premium-waarom-rij">
              <span className="tk-plaat tk-plaat-neutraal">
                <Teken size={24} />
              </span>
              <span className="flex min-w-0 flex-col gap-1">
                <span className="tk-lijstrij-titel">{t(kop)}</span>
                <span className="text-tekst-secundair">{t(uitleg)}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <Code />
    </>
  );
}

/**
 * De kop van de pagina: wat premium is in één zin, de prijs, en de knop.
 *
 * Een vlak in de actiekleur, want dit is de ene plek in het product die om een
 * besluit vraagt. De knop erop is licht in plaats van indigo — indigo op indigo
 * is geen knop — en de prijs staat ernaast en niet ergens onderaan: een knop
 * naar een winkel waarvan je het bedrag niet weet, voelt als een val (ADR-124).
 */
function Etalage({ teKoop }: { readonly teKoop: boolean }) {
  const kop = useId();

  return (
    <section className="tk-premium-etalage" aria-labelledby={kop}>
      <span className="tk-premium-pil">{t('premium.etalageLabel')}</span>
      <h2 id={kop} className="tk-premium-etalage-kop">
        {t('premium.etalageKop')}
      </h2>
      <p className="tk-premium-etalage-tekst">{t('premium.intro')}</p>
      {teKoop ? (
        <div className="tk-premium-etalage-koop">
          <a className="tk-button tk-premium-knop-licht" href={KASSA_PAD}>
            {t('premium.kopenKnop')}
          </a>
          <p className="tk-premium-etalage-prijs">
            <span className="tk-display">{t('premium.prijs')}</span>{' '}
            {t('premium.perSchooljaar')}
          </p>
        </div>
      ) : null}
    </section>
  );
}

/**
 * Basis en premium naast elkaar, zoals op de prijspagina van elk abonnement —
 * behalve dat dit er geen is.
 *
 * Twee kaarten met wat ze kosten en voor wie ze zijn, en daaronder één tabel
 * met per regel een vinkje of een streep. De tabel is een echte tabel: een
 * schermlezer loopt hem af per rij en hoort bij elke cel of het erin zit.
 *
 * **De zin boven de tabel beantwoordt de vraag die de pagina zelf opriep.**
 * "Oefenen is en blijft gratis" stond bovenaan, en op elke modulepagina stond
 * "Premium" bij de bliksemronde, overleven en de oefentoets. Beide waren waar
 * (ADR-122): die drie oefenen niet, ze toetsen of je het al kent. Maar dat stond
 * nergens, en een ouder die het tegenstrijdig vond had gelijk.
 */
function Vergelijking({ teKoop }: { readonly teKoop: boolean }) {
  return (
    <section className="flex flex-col gap-4" aria-label={t('premium.vergelijkTitel')}>
      <h2 className="tk-sectie">{t('premium.vergelijkTitel')}</h2>
      <p className="text-lopend text-tekst-secundair">{t('premium.vergelijkUitleg')}</p>

      <div className="tk-premium-plannen">
        <div className="tk-premium-plan">
          <p className="tk-premium-plan-naam">{t('premium.basisNaam')}</p>
          <p className="tk-premium-plan-prijs">
            <span className="tk-display">{t('premium.basisPrijs')}</span>
          </p>
          <p className="text-tekst-secundair">{t('premium.basisVoor')}</p>
        </div>

        <div className="tk-premium-plan" data-premium="">
          <p className="flex flex-wrap items-center justify-between gap-2">
            <span className="tk-premium-plan-naam">{t('premium.titel')}</span>
            <span className="tk-premium-pil">{t('premium.aanrader')}</span>
          </p>
          {teKoop ? (
            <p className="tk-premium-plan-prijs">
              <span className="tk-display">{t('premium.prijs')}</span>{' '}
              <span className="text-tekst-secundair">{t('premium.perSchooljaar')}</span>
            </p>
          ) : null}
          <p className="text-tekst-secundair">{t('premium.premiumVoor')}</p>
          {teKoop ? (
            <>
              <a className="tk-button self-start" href={KASSA_PAD}>
                {t('premium.kopenKnop')}
              </a>
              <p className="tk-hulp">{t('premium.kopenUitleg')}</p>
            </>
          ) : null}
        </div>
      </div>

      <div className="tk-premium-tabel-rol">
        <table className="tk-premium-tabel">
          <caption className="tk-sr-only">{t('premium.vergelijkTitel')}</caption>
          <thead>
            <tr>
              <th scope="col">
                <span className="tk-sr-only">{t('premium.tabelWat')}</span>
              </th>
              <th scope="col">{t('premium.basisNaam')}</th>
              <th scope="col" data-premium="">
                {t('premium.titel')}
              </th>
            </tr>
          </thead>
          {VERGELIJK.map(([groep, regels]) => (
            <tbody key={groep}>
              <tr>
                <th scope="colgroup" colSpan={3} className="tk-premium-tabel-groep">
                  {t(groep)}
                </th>
              </tr>
              {regels.map((regel) => (
                <tr key={regel.tekst}>
                  <th scope="row">{t(regel.tekst)}</th>
                  <td>
                    <Cel ja={regel.basis} />
                  </td>
                  <td data-premium="">
                    <Cel ja />
                  </td>
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </section>
  );
}

/** Een vinkje of een streep, en voor een schermlezer allebei in woorden. */
function Cel({ ja }: { readonly ja: boolean }) {
  return ja ? (
    <CorrectIcon size={20} label={t('premium.tabelJa')} />
  ) : (
    <>
      <span aria-hidden="true">—</span>
      <span className="tk-sr-only">{t('premium.tabelNee')}</span>
    </>
  );
}

/**
 * Het veld, onderaan en klein. Het is de laatste stap van een reis die ergens
 * anders begon: je hebt betaald, je hebt een mail, je typt hem over.
 *
 * "Inloggen" is een code en niets meer. Geen e-mail en geen wachtwoord: er is
 * geen account om in te loggen (ADR-015), en een veld voor een van beide zou
 * precies verzamelen wat dit product beloofd heeft niet te verzamelen.
 */
function Code() {
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
    <section className="flex flex-col gap-3" aria-label={t('premium.codeTitel')}>
      <h2 className="tk-sectie">{t('premium.codeTitel')}</h2>
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
        <button type="submit" className="tk-button tk-button-secondary self-start" disabled={bezig}>
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
