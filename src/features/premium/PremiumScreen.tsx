import { tel } from '@/store/teller';
import { useState, type ComponentType, type ReactNode } from 'react';
import {
  CorrectIcon,
  FamilyIcon,
  type IconProps,
  PremiumFilledIcon,
  PupilIcon,
  ShieldIcon,
  SlotIcon,
  StreakIcon,
  UurIcon,
} from '@/components/Icon';
import { openWisselaar } from '@/features/ouder/wisselaar';
import { t, type TranslationKey } from '@/i18n';
import { isTeKoop, isVerlopen, verlooptBinnenkort } from '@/store/premium';
import { isIngesteld } from '@/store/account/omgeving';
import { leesbareDatum, usePremium } from './usePremium';

/**
 * De kassa, als adres. Geen route van de app maar een echte pagina onder
 * `public/kopen`, dus een gewone link die de app verlaat (ADR-123).
 *
 * Sinds ADR-164 draagt hij welk plan je koos. De kassa leest dat en zegt wat
 * je koopt; de app hoeft daarmee nog steeds niets van betalen te weten.
 */
const KASSA_PAD = '/kopen/';

type Pictogram = ComponentType<Omit<IconProps, 'children'>>;

/** Waarom dit product en niet een ander (ADR-256). Geen functies: redenen om het te vertrouwen. */
const WAAROM: readonly (readonly [Pictogram, TranslationKey, TranslationKey])[] = [
  [PupilIcon, 'premium.waarom.anoniem', 'premium.waarom.anoniemUit'],
  [StreakIcon, 'premium.waarom.herhalen', 'premium.waarom.herhalenUit'],
  [UurIcon, 'premium.waarom.kort', 'premium.waarom.kortUit'],
  [ShieldIcon, 'premium.waarom.reclame', 'premium.waarom.reclameUit'],
];

/**
 * Met een gezinsaccount gaat de voornaam wél naar de server, met toestemming
 * (ADR-249). Dan zegt de uitleg dat, en niet meer dat er geen account is.
 */
function metAccount(uitleg: TranslationKey): TranslationKey {
  return uitleg === 'premium.waarom.anoniemUit' && isIngesteld()
    ? 'premium.waarom.anoniemUitAccount'
    : uitleg;
}

/**
 * Basis tegen premium, regel voor regel (ADR-145, ADR-256).
 *
 * `basis` zegt of de regel ook zonder code geldt. Elke regel is nagelopen tegen
 * waar het product het echt afschermt — `isPremiumVorm`, `isPremiumOnderwerp`,
 * en de blokken die zonder code een `PremiumSlot` tekenen — want een
 * vergelijking die iets belooft wat de app weigert, is de snelste manier om een
 * ouder kwijt te raken die net betaald heeft.
 *
 * Sinds ADR-256 één lijst zonder groepen, zodat de tabel en de knop samen op
 * een telefoon boven de vouw passen.
 */
interface Regel {
  readonly tekst: TranslationKey;
  readonly basis: boolean;
}

const VERGELIJK: readonly Regel[] = [
  { tekst: 'premium.regel.vakken', basis: true },
  // Er is geen dagelijkse grens: elke spelvorm die leert is gratis (ADR-224).
  { tekst: 'premium.regel.onbeperkt', basis: true },
  { tekst: 'premium.regel.reclame', basis: true },
  { tekst: 'premium.regel.bliksem', basis: false },
  // De ring blijft gratis te zien, het halen niet (ADR-192).
  { tekst: 'premium.regel.diplomas', basis: false },
  { tekst: 'premium.regel.plan', basis: false },
  { tekst: 'premium.regel.weekdoelen', basis: false },
  // Wat een kind kent en hoe vaak het oefende, wordt altijd bewaard — het
  // herhaalschema heeft het nodig — maar het is alleen met premium te zien
  // (ADR-192).
  { tekst: 'premium.regel.voortgang', basis: false },
  { tekst: 'premium.regel.lijsten', basis: false },
  // Drie kinderen zijn gratis sinds ADR-173; één code op drie apparaten niet.
  { tekst: 'premium.regel.gezin', basis: false },
];

/**
 * De premiumpagina: wat je krijgt, wat het kost en de knop, in één blik
 * (ADR-116, ADR-145, ADR-256).
 *
 * **Sinds ADR-256 past de beslissing boven de vouw.** Bovenaan staan Basis en
 * Premium in één tabel, en daarnaast of eronder de keuze tussen maandelijks en
 * jaarlijks, de prijs en de knop. Daaronder vier redenen om ons te vertrouwen,
 * en helemaal onderaan de weg naar de ouder voor wie al een code heeft. De kop
 * met de uitleg en de vier kaarten met wat premium doet zijn weg: de tabel zegt
 * hetzelfde, korter.
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
    <div className="tk-page">
      <div className={actief ? 'tk-page-main' : 'tk-page-main tk-premium-pagina'}>
        <div className={actief ? 'flex flex-col gap-2' : 'flex flex-col gap-2 tk-premium-kop'}>
          <h1 className={actief ? 'tk-titel' : 'tk-titel tk-premium-titel'}>
            {t('premium.titel')}
          </h1>
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
    <section className="flex flex-col gap-3" aria-label={t('premium.codeTitelAan')}>
      <h2 className="tk-sectie">{t('premium.codeTitelAan')}</h2>
      <div className="tk-card flex flex-col gap-3">
        <p className="flex items-center gap-2 text-lopend">
          <CorrectIcon size={24} />
          {t('premium.aan', { datum: leesbareDatum(tot) })}
        </p>
        <p className="tk-hulp">{t('premium.afmeldenBijOuder')}</p>
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
      <div className="tk-premium-boven">
        <Vergelijking />
        {teKoop ? <Kopen /> : null}
      </div>

      <section className="flex flex-col gap-3" aria-label={t('premium.waaromTitel')}>
        <h2 className="tk-sectie">{t('premium.waaromTitel')}</h2>
        <ul className="tk-kaarten tk-premium-waarom">
          {WAAROM.map(([Teken, kop, uitleg]) => (
            <li key={kop} className="tk-kaartje">
              <span className="tk-kaartteken">
                <Teken size={24} />
              </span>
              <span className="tk-kaartje-kop">{t(kop)}</span>
              <span className="text-tekst-secundair">{t(metAccount(uitleg))}</span>
            </li>
          ))}
        </ul>
      </section>

      <NaarOuder />
    </>
  );
}

/**
 * Basis en premium naast elkaar (ADR-145, ADR-256). Een echte tabel: een
 * schermlezer loopt hem af per rij en hoort bij elke cel of het erin zit. De
 * kolom van premium heeft een gouden rand, het plan dat de pagina aanraadt.
 */
function Vergelijking() {
  return (
    <table className="tk-premium-tabel">
      <caption className="tk-sr-only">{t('premium.vergelijkTitel')}</caption>
      <thead>
        <tr>
          <th scope="col">{t('premium.tabelKop')}</th>
          <th scope="col">
            <span className="tk-premium-tabel-plan">
              <span className="tk-premium-actief">{t('premium.actief')}</span>
              {t('premium.basisNaam')}
            </span>
          </th>
          <th scope="col" data-premium="">
            <span className="tk-premium-tabel-plan">
              <PremiumFilledIcon size={16} />
              {t('premium.titel')}
            </span>
          </th>
        </tr>
      </thead>
      <tbody>
        {VERGELIJK.map((regel) => (
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
    </table>
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

type Plan = 'jaar' | 'maand';

/**
 * Maandelijks of jaarlijks, de prijs en de knop (ADR-164, ADR-256).
 *
 * Twee echte keuzerondjes in een `fieldset`, opgemaakt als één schakelaar: zo
 * werken de pijltjestoetsen en hoort een schermlezer welke gekozen is. Het jaar
 * staat standaard aan. De knop draagt het plan mee naar de kassa.
 */
function Kopen() {
  const [plan, setPlan] = useState<Plan>('jaar');
  const jaar = plan === 'jaar';
  const href = jaar ? KASSA_PAD : `${KASSA_PAD}?plan=maand`;

  return (
    <section className="tk-premium-kopen" aria-label={t('premium.betalen')}>
      <fieldset className="tk-premium-plankeuze">
        <legend className="tk-sr-only">{t('premium.betalen')}</legend>
        <Keuze plan="maand" gekozen={plan} kies={setPlan}>
          {t('premium.maandelijks')}
        </Keuze>
        <Keuze plan="jaar" gekozen={plan} kies={setPlan}>
          {t('premium.jaarlijks')}
          <span className="tk-premium-korting">{t('premium.jaarKorting')}</span>
        </Keuze>
      </fieldset>

      <div className="tk-premium-prijs" aria-live="polite">
        <p>
          <span className="tk-display">{t(jaar ? 'premium.prijs' : 'premium.maandPrijs')}</span>{' '}
          <span className="text-tekst-secundair">
            {t(jaar ? 'premium.perSchooljaar' : 'premium.perMaand')}
          </span>
        </p>
        <p className="tk-premium-gezin">
          <FamilyIcon size={20} />
          {t(jaar ? 'premium.gezinJaar' : 'premium.gezinMaand')}
        </p>
      </div>

      <a className="tk-button" href={href} onClick={() => tel('kassa')}>
        {t('premium.activeren')}
      </a>

      <p className="tk-premium-voorwaarden">
        <span>{t(jaar ? 'premium.jaarUitleg' : 'premium.maandUitleg')}</span>
        <a href="/privacy">{t('premium.privacy')}</a>
      </p>
    </section>
  );
}

function Keuze({
  plan,
  gekozen,
  kies,
  children,
}: {
  readonly plan: Plan;
  readonly gekozen: Plan;
  readonly kies: (plan: Plan) => void;
  readonly children: ReactNode;
}) {
  return (
    <label className="tk-premium-plankeuze-optie">
      <input
        type="radio"
        name="premium-plan"
        className="tk-sr-only"
        checked={plan === gekozen}
        onChange={() => kies(plan)}
      />
      {children}
    </label>
  );
}

/**
 * De weg naar de code, in plaats van de code zelf (ADR-173).
 *
 * Hier stond het veld waar de code in ging: de laatste stap van een reis die
 * ergens anders begon — je hebt betaald, je hebt een mail, je typt hem over.
 * Het veld zelf staat nog steeds in `CodeVeld`, want het staat op twee plekken
 * (ADR-163), maar allebei zijn ze nu van de ouder: de ouderpagina, en de pop-up
 * die een kind bij een slot krijgt en die een ouder invult.
 *
 * Hier stond het codeveld. Deze pagina is een etalage en een kind mag hem zien
 * — een slot brengt je hier, en de vergelijking legt uit wat premium doet —
 * maar een kind koopt niets en vult geen code in. Apple en Google eisen voor
 * een app voor kinderen bovendien dat alles wat met kopen te maken heeft achter
 * een poort staat, en dit is de deur ernaartoe: één knop, en daarachter de
 * pincode van de ouder.
 */
function NaarOuder() {
  return (
    <section className="flex flex-col gap-3" aria-label={t('premium.codeTitel')}>
      <h2 className="tk-sectie">{t('premium.codeTitel')}</h2>
      <div className="tk-card flex flex-col gap-3">
        <p className="text-lopend">{t('premium.codeBijOuder')}</p>
        <button
          type="button"
          className="tk-button self-start"
          onClick={() => openWisselaar('slot')}
        >
          <SlotIcon size={24} />
          {t('premium.ikBenOuder')}
        </button>
      </div>
    </section>
  );
}
