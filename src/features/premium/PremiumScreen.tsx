import { useId, useState, type FormEvent, type ReactNode } from 'react';
import { CorrectIcon } from '@/components/Icon';
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

/**
 * Wat premium voor je doet, in vier dingen (ADR-124).
 *
 * Hiervoor stond hier een lijst van negen functies — badges, reeks, "Goed
 * beantwoord" — allemaal even zwaar, allemaal de naam van een knop in plaats
 * van wat hij oplevert. Een ouder die "Jouw badges" leest weet niet meer dan
 * daarvoor. Dit zijn de vier klussen waarvoor betaald wordt, met de
 * belangrijkste bovenaan: het plannen. De kleine dingen staan eronder in één
 * regel, waar ze thuishoren.
 */
const DOET: readonly (readonly [TranslationKey, TranslationKey])[] = [
  ['premium.usp.plan', 'premium.usp.planUit'],
  ['premium.usp.zicht', 'premium.usp.zichtUit'],
  ['premium.usp.zelf', 'premium.usp.zelfUit'],
  ['premium.usp.gezin', 'premium.usp.gezinUit'],
];

/** Waarom dit product en niet een ander. Geen functies: redenen om het te vertrouwen. */
const WAAROM: readonly TranslationKey[] = [
  'premium.waarom.reclame',
  'premium.waarom.apparaat',
  'premium.waarom.abonnement',
  'premium.waarom.gok',
];

/** Wat er gratis is en blijft. Staat vóór de prijs: het is het sterkste dat er te zeggen valt. */
const GRATIS: readonly TranslationKey[] = [
  'premium.vrij.alles',
  'premium.vrij.vormen',
  'premium.vrij.fouten',
  'premium.vrij.diploma',
  'premium.vrij.voorspelling',
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
 * ADR-124).
 *
 * Hij stond op zijn kop. Bovenaan een codeveld — een formulier voor wie al
 * gekocht heeft, en dat is bijna niemand die hier komt — dan een lijst met
 * functienamen, en onderaan, na alles, de weg om er een te kopen. Wie hier
 * binnenkwam zonder te weten wat premium was, moest langs de kassa van iemand
 * anders om bij de etalage te komen.
 *
 * Nu leest hij in de volgorde van de beslissing: wat doet het voor mij, wat
 * blijft gratis, waarom zou ik jullie vertrouwen, wat kost het, hoe koop ik het
 * — en helemaal onderaan, klein, het veld voor wie al een code heeft.
 *
 * **Met een code verandert de pagina van rol.** Dan is er niets meer te
 * verkopen: bovenaan staat tot wanneer het aanstaat en hoe je het van dit
 * apparaat haalt, en de rest is er niet. Doorverkopen aan wie al betaald heeft
 * is het duidelijkste teken dat een pagina niet naar zijn lezer kijkt.
 */
export function PremiumScreen({
  aside,
  now = new Date(),
}: {
  readonly aside: ReactNode;
  readonly now?: Date;
}) {
  const { actief, stand } = usePremium();
  const verlopen = isVerlopen(stand, now);
  const bijnaAf = actief && verlooptBinnenkort(stand, now);

  return (
    <div className="tk-page">
      <div className="tk-page-main">
        <div className="flex flex-col gap-2">
          <h1 className="tk-titel">{t('premium.titel')}</h1>
          <p className="text-lopend text-tekst-secundair">
            {actief ? t('premium.introAan') : t('premium.intro')}
          </p>
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

      {aside}
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
  return (
    <>
      <section className="flex flex-col gap-3" aria-label={t('premium.watTitel')}>
        <h2 className="tk-sectie">{t('premium.watTitel')}</h2>
        <ul className="tk-lijst">
          {DOET.map(([kop, uitleg]) => (
            <li key={kop}>
              <div className="tk-lijstrij">
                <span className="tk-lijstrij-tekst">
                  <span className="tk-lijstrij-titel">{t(kop)}</span>
                  <span className="tk-lijstrij-regel">{t(uitleg)}</span>
                </span>
              </div>
            </li>
          ))}
        </ul>
        <p className="tk-hulp">{t('premium.watKlein')}</p>
      </section>

      {/* Vóór de prijs, en met opzet: dit is het sterkste dat er te zeggen valt,
          en een ouder die twijfelt of het een muur is hoort hier af te haken met
          een gerust hart in plaats van door te scrollen met een onbehaaglijk
          gevoel. */}
      <section className="flex flex-col gap-3" aria-label={t('premium.vrijTitel')}>
        <h2 className="tk-sectie">{t('premium.vrijTitel')}</h2>
        <ul className="flex list-disc flex-col gap-2 pl-6 text-lopend">
          {GRATIS.map((sleutel) => (
            <li key={sleutel}>{t(sleutel)}</li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3" aria-label={t('premium.waaromTitel')}>
        <h2 className="tk-sectie">{t('premium.waaromTitel')}</h2>
        <ul className="flex list-disc flex-col gap-2 pl-6 text-lopend">
          {WAAROM.map((sleutel) => (
            <li key={sleutel}>{t(sleutel)}</li>
          ))}
        </ul>
      </section>

      <Kopen />
      <Code />

      <p className="tk-hulp">{t('premium.voorOuders')}</p>
    </>
  );
}

/**
 * De prijs staat er (ADR-124). ADR-123 hield hem met opzet alleen op de
 * kassapagina — twee plekken met een prijs is één plek met een oude prijs — maar
 * dat kostte meer dan het opleverde: een knop naar een winkel waarvan je het
 * bedrag niet weet, voelt als een val. Het bedrag staat nu op één plek in de app
 * (`premium.prijs`) en `kassa.test.ts` houdt het gelijk aan `PRIJS_CENTEN`.
 */
function Kopen() {
  if (!isTeKoop()) return null;

  return (
    <section className="flex flex-col gap-3" aria-label={t('premium.kopenTitel')}>
      <h2 className="tk-sectie">{t('premium.kopenTitel')}</h2>
      <div className="tk-card flex flex-col gap-3">
        <p className="tk-display text-paginakop">{t('premium.prijs')}</p>
        <p className="text-lopend">{t('premium.kopenUitleg')}</p>
        <a className="tk-button self-start" href={KASSA_PAD}>
          {t('premium.kopenKnop')}
        </a>
      </div>
    </section>
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
