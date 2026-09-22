import { useId, type ComponentType } from 'react';
import {
  CorrectIcon,
  DiplomaIcon,
  FamilyIcon,
  type IconProps,
  OogIcon,
  PupilIcon,
  ShieldIcon,
  SlotIcon,
  StarIcon,
  TodayIcon,
} from '@/components/Icon';
import { openWisselaar } from '@/features/ouder/wisselaar';
import { t, type TranslationKey } from '@/i18n';
import { isTeKoop, isVerlopen, verlooptBinnenkort } from '@/store/premium';
import { leesbareDatum, usePremium } from './usePremium';

/**
 * De kassa, als adres. Geen route van de app maar een echte pagina onder
 * `public/kopen`, dus een gewone link die de app verlaat (ADR-123).
 *
 * Sinds ADR-164 draagt hij welk plan je koos. De kassa leest dat en zegt wat
 * je koopt; de app hoeft daarmee nog steeds niets van betalen te weten.
 */
const KASSA_PAD = '/kopen/';
const KASSA_MAAND = '/kopen/?plan=maand';

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
  [FamilyIcon, 'premium.waarom.geenNamen', 'premium.waarom.geenNamenUit'],
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
      { tekst: 'premium.regel.tafeldiploma', basis: true },
      { tekst: 'premium.regel.diplomas', basis: false },
    ],
  ],
  [
    'premium.groep.onthouden',
    [
      // "Zien wat blijft hangen" stond onder Belonen, naast de diploma's
      // (ADR-177). Het hoort hier: het is de enige gratis regel in deze groep,
      // en dat is precies wat de grens van ADR-122 zegt — het inzicht is
      // gratis, het bijhouden is betaald.
      { tekst: 'premium.regel.blijfthangen', basis: true },
      { tekst: 'premium.regel.plan', basis: false },
      { tekst: 'premium.regel.onthouden', basis: false },
      { tekst: 'premium.regel.fouten', basis: false },
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
      { tekst: 'premium.regel.lijsten', basis: false },
      // Drie kinderen zijn gratis sinds ADR-173, en deze tabel zei nog van
      // niet (ADR-177). Het zijn twee regels geworden, want het zijn twee
      // dingen: hoeveel kinderen er op dít apparaat kunnen, en hoeveel
      // apparaten één code opent.
      { tekst: 'premium.regel.kinderen', basis: true },
      { tekst: 'premium.regel.gezin', basis: false },
    ],
  ],
];

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
    <div className="tk-page">
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
      <Etalage teKoop={teKoop} />

      <section className="flex flex-col gap-4" aria-label={t('premium.watTitel')}>
        <h2 className="tk-sectie">{t('premium.watTitel')}</h2>
        <ul className="tk-kaarten">
          {DOET.map(([Teken, kop, uitleg]) => (
            <li key={kop} className="tk-kaartje">
              <span className="tk-kaartteken">
                <Teken size={24} />
              </span>
              <span className="tk-kaartje-kop">{t(kop)}</span>
              <span className="text-lopend text-tekst-secundair">{t(uitleg)}</span>
            </li>
          ))}
        </ul>
      </section>

      <Vergelijking teKoop={teKoop} />

      <section className="flex flex-col gap-4" aria-label={t('premium.waaromTitel')}>
        <h2 className="tk-sectie">{t('premium.waaromTitel')}</h2>
        <ul className="tk-kaarten">
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

      <NaarOuder />
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
    <section className="tk-etalage" aria-labelledby={kop}>
      <span className="tk-pil">{t('premium.etalageLabel')}</span>
      <h2 id={kop} className="tk-etalage-kop">
        {t('premium.etalageKop')}
      </h2>
      <p className="tk-etalage-tekst">{t('premium.intro')}</p>
      {teKoop ? (
        <>
          <div className="tk-etalage-knoppen">
            <a className="tk-button tk-knop-licht" href={KASSA_PAD}>
              {t('premium.kopenKnop')}
            </a>
            <p className="tk-premium-etalage-prijs">
              <span className="tk-display">{t('premium.prijs')}</span> {t('premium.perSchooljaar')}
            </p>
          </div>
          {/* De maandprijs als regel en niet als tweede knop ernaast (ADR-164).
              Twee even zware knoppen is geen aanbod maar een vraag, en de
              vergelijking eronder zet beide plannen wél naast elkaar. */}
          <p className="tk-etalage-tekst">
            {t('premium.ofPerMaand', { prijs: t('premium.maandPrijs') })}
          </p>
        </>
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
            <span className="tk-pil">{t('premium.aanrader')}</span>
          </p>
          {/* Twee manieren om hetzelfde te krijgen, naast elkaar (ADR-164). Ze
              staan in één kaart en niet in twee, want het is één product: wat
              verschilt is wanneer je betaalt, niet wat je koopt. Het jaar
              voorop, met de reden erbij dat het goedkoper is — een aanrader
              zonder rekensom is een duwtje, met de rekensom is het een
              argument. */}
          {teKoop ? (
            <div className="tk-premium-prijzen">
              <p className="tk-premium-plan-prijs">
                <span className="tk-display">{t('premium.prijs')}</span>{' '}
                <span className="text-tekst-secundair">{t('premium.perSchooljaarKort')}</span>
              </p>
              <p className="tk-premium-plan-prijs">
                <span className="tk-display">{t('premium.maandPrijs')}</span>{' '}
                <span className="text-tekst-secundair">{t('premium.perMaand')}</span>
              </p>
            </div>
          ) : null}
          <p className="text-tekst-secundair">{t('premium.premiumVoor')}</p>
          {teKoop ? (
            <>
              <div className="tk-premium-plan-knoppen">
                <a className="tk-button" href={KASSA_PAD}>
                  {t('premium.kopenKnop')}
                </a>
                <a className="tk-button tk-button-secondary" href={KASSA_MAAND}>
                  {t('premium.maandKnop')}
                </a>
              </div>
              <p className="tk-hulp">{t('premium.kopenUitleg')}</p>
              <p className="tk-hulp">
                {t('premium.maandUitleg')} {t('premium.jaarVoordeel')}
              </p>
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
