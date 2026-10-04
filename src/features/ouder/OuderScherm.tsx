import { useId, useState, type FormEvent } from 'react';
import { CorrectIcon, SlotIcon, StarIcon } from '@/components/Icon';
import { t, type TranslationKey } from '@/i18n';
import { AccountBlok } from '@/features/account/AccountBlok';
import { CodeVeld } from '@/features/premium/CodeVeld';
import { leesbareDatum, naarPremium, usePremium } from '@/features/premium/usePremium';
import { Wissen } from '@/features/player/Wissen';
import { isTeKoop, isVerlopen, meldAf } from '@/store/premium';
import {
  SESSIE_KEUZES,
  sessieMinuten,
  sluit,
  verleng,
  zetPin,
  zetSessieMinuten,
  type OuderFout,
} from '@/store/ouder';
import { useAccount } from '@/features/account/useAccount';
import { Apparaten } from './Apparaten';
import { Bewaren } from './Bewaren';
import { JouwKinderen } from './JouwKinderen';
import { Overname } from './Overname';
import { Paginakop } from '@/features/shell/Paginakop';

/**
 * De ouderpagina, op /ouder (ADR-173).
 *
 * **Waarom deze pagina terug is.** ADR-136 gaf de ouder een eigen pagina,
 * ADR-171 haalde hem weg met één zin — "ouders loggen niet in, kinderen wel" —
 * en ADR-172 legde wat er nog van over was onderaan Premium. Die ene zin was de
 * aanname, en hij is omgedraaid: de ouder logt wél in. Alles wat sindsdien heen
 * en weer schoof, heeft daarmee weer één plek.
 *
 * **De vraag van deze pagina is "gaat het goed, en wat kost het?"** Vandaag
 * vraagt "wat doe ik nu?", Jij "wat heb ik bereikt, en blijft het hangen?".
 * Sinds ADR-177 beantwoordt hij de eerste helft ook echt: `HoeGaatHet` stond
 * op vier plekken beloofd en bestond niet.
 * Dat is de maatstaf voor elk blok hier, en de reden dat de schakelaars voor
 * geluid en rust op Jij blijven staan: die gaan over de kamer en over het kind
 * dat de iPad vasthoudt, en ze achter een pincode zetten is wrijving zonder
 * winst.
 *
 * **Wat hier staat en nergens anders**: het codeveld, het afmelden, en het
 * wissen van dit apparaat. Alle drie zijn ze van de ouder, en alle drie zijn ze
 * op Jij een rij die een kind van zeven per ongeluk indrukt. Apple en Google
 * eisen bovendien voor een app voor kinderen dat commercie achter een poort
 * staat, en dit is die poort.
 *
 * **De etalage staat hier niet.** Die is op /premium, want dat is de pagina die
 * uitlegt wat je koopt en die ook een kind mag zien. Hier staat wat je ermee
 * doet.
 *
 * **Elke handeling zet de klok terug op vijf minuten.** Niet elke muisbeweging:
 * wat telt is dat er iemand aan het werk is. Een pagina die zichzelf openhoudt
 * zolang hij openstaat, is een pagina zonder slot.
 */
export function OuderScherm({ naam }: { readonly naam: string }) {
  // Een kind dat `Overname` op dit apparaat zet, hoort ook in Jouw kinderen te
  // staan (ADR-189): dan begint dat blok opnieuw.
  const [vanBuiten, zetVanBuiten] = useState(0);
  // Zonder gezinsproject in de bouw is er geen account, en dan staat er ook
  // geen blok en geen anker (ADR-172, ADR-262).
  const { ingesteld: metAccount } = useAccount();

  const ankers: readonly (readonly [string, TranslationKey])[] = [
    ['kinderen', 'ouder.kinderen'],
    ['premiumcode', 'ouder.premium'],
    ...(metAccount ? [['account', 'account.titel'] as const] : []),
    ['pincode', 'ouder.instellingen'],
    ['wissen', 'wissen.titel'],
  ];

  return (
    <div className="tk-page" onClickCapture={() => verleng()} onKeyDownCapture={() => verleng()}>
      <div className="tk-page-main tk-ouder">
        <Paginakop kop={t('ouder.titel')} regel={t('ouder.intro')} />

        {/* Waar alles staat, en de weg terug naar het kind (ADR-262). */}
        <nav className="tk-ouder-ankers" aria-label={t('ouder.opDezePagina')}>
          <ul>
            {ankers.map(([id, kop]) => (
              <li key={id}>
                <a className="tk-chip" href={`#${id}`}>
                  {t(kop)}
                </a>
              </li>
            ))}
          </ul>
          <Terug naam={naam} />
        </nav>

        {/* Links waar een ouder voor komt, rechts wat hij regelt (ADR-262).
            Op een tablet en een telefoon onder elkaar, in dezelfde volgorde. */}
        <div className="tk-ouder-raster">
          <div className="tk-ouder-kolom">
            <JouwKinderen key={`kinderen-${vanBuiten}`} />
          </div>

          <div className="tk-ouder-kolom">
            <Premium />

            {metAccount ? (
              <div id="account" className="tk-ouderblok">
                {/* Het account van het gezin, en direct eronder het meenemen
                    van de kinderen erin (ADR-187). */}
                <AccountBlok />
                <Overname onKinderenVeranderd={() => zetVanBuiten((vorige) => vorige + 1)} />
              </div>
            ) : null}

            {/* Of de browser de voortgang vasthoudt (ADR-186). Tekent niets als
                de browser er niets over zegt. */}
            <Bewaren />

            <Gezinsinstellingen />
          </div>
        </div>

        {/* Als laatste, over de hele breedte en met een rode rand: het enige op
            dit apparaat dat niet terug te draaien is (ADR-166, ADR-262). Ook de
            enige uitweg voor wie zijn pincode kwijt is, en het geeft dus niets:
            wie hem neemt, houdt een leeg apparaat over. */}
        <div id="wissen">
          <Wissen />
        </div>
      </div>
    </div>
  );
}

/**
 * Terug naar het kind, onderaan en als gewone knop.
 *
 * De sessie loopt na vijf minuten vanzelf af, maar een ouder die klaar is hoort
 * niet te hoeven wachten tot dat gebeurt — dat is precies het moment waarop de
 * iPad weer wordt doorgegeven.
 */
function Terug({ naam }: { readonly naam: string }) {
  return (
    <button
      type="button"
      className="tk-button tk-button-secondary tk-ouder-terug"
      onClick={() => {
        sluit();
        window.location.href = '/';
      }}
    >
      {t('ouder.terugNaarKind', { naam })}
    </button>
  );
}

/**
 * Premium, als iets wat je regelt in plaats van iets wat je koopt.
 *
 * Het codeveld stond onderaan de premiumpagina, waar een kind het kon vinden.
 * Het staat nu hier en in het venster dat een slot opent (ADR-163) — allebei
 * plekken waar de ouder zit. Dat is wat de opdracht vraagt en wat de winkels
 * eisen.
 *
 * Eén code, alle kinderen: premium is een gezinsabonnement en telt geen
 * kinderen. Dat is sinds ADR-173 ook waar — drie kinderen aanmaken is gratis.
 */
function Premium() {
  const { actief, stand } = usePremium();
  const verlopen = isVerlopen(stand, new Date());
  const extraKind = t('ouder.extraKind', {
    jaar: t('ouder.extraKindJaar'),
    maand: t('ouder.extraKindMaand'),
  });

  return (
    <section id="premiumcode" className="tk-ouderblok" aria-label={t('ouder.premium')}>
      <h2 className="tk-sectie">{t('ouder.premium')}</h2>

      {actief && stand ? (
        <div className="tk-card flex flex-col gap-3">
          <p className="flex items-center gap-2 text-lopend">
            <CorrectIcon size={24} />
            {t('premium.aan', { datum: leesbareDatum(stand.geldigTot) })}
          </p>
          <p className="text-lopend text-tekst-secundair">{t('ouder.premiumAlleKinderen')}</p>
          {/* De code zelf (ADR-232): wie hem op een tweede apparaat wil
              invullen, hoeft niet de mail terug te zoeken. Achter de pincode. */}
          <p className="text-lopend">
            {t('ouder.jouwCode', { code: `LEER-${stand.code.slice(0, 4)}-${stand.code.slice(4)}` })}
          </p>
          <p className="tk-hulp">{t('ouder.jouwCodeUitleg')}</p>
          <p className="tk-hulp">{extraKind}</p>
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
        <div className="tk-card flex flex-col gap-3">
          {verlopen && stand ? (
            <p className="text-lopend">
              {t('premium.verlopen', { datum: leesbareDatum(stand.geldigTot) })}
            </p>
          ) : (
            <p className="text-lopend">{t('ouder.premiumUit')}</p>
          )}

          <CodeVeld className="flex flex-col gap-3" />
          <p className="tk-hulp">{extraKind}</p>

          <div className="flex flex-wrap gap-3">
            {isTeKoop() ? (
              <a className="tk-button tk-button-secondary" href="/kopen/">
                {t('premium.kopenKnop')}
              </a>
            ) : null}
            <button
              type="button"
              className="tk-button tk-button-tertiary"
              onClick={() => naarPremium()}
            >
              {t('ouder.bekijkPremium')}
            </button>
          </div>
        </div>
      )}
      {/* Welke apparaten de code gebruiken (ADR-226): plekken op de code, dus
          hier. Alleen met een code op dit apparaat. */}
      <Apparaten />
    </section>
  );
}

/**
 * Pincode en instellingen (ADR-232, ADR-262): wat de deur van deze pagina
 * regelt. Een nieuwe pincode, en hoe lang de pagina openblijft. De schakelaar
 * voor de weekdoelen stond hier en staat nu bij Jouw kinderen, want hij gaat
 * over wat de app de kinderen vraagt.
 *
 * Geluid, voorlezen en minder beweging blijven met opzet op Jij. Die gaan over
 * de kamer en over het kind dat de iPad vasthoudt; ze achter een pincode zetten
 * zou een kind dat het geluid uit wil doen naar zijn ouder sturen.
 */
function Gezinsinstellingen() {
  return (
    <section id="pincode" className="tk-ouderblok" aria-label={t('ouder.instellingen')}>
      <h2 className="tk-sectie">{t('ouder.instellingen')}</h2>
      <ul className="tk-lijst">
        <PinWijzigen />
        <SessieDuur />
      </ul>
      <p className="tk-hulp">{t('ouder.instellingenUitleg')}</p>
    </section>
  );
}

/**
 * Hoe lang de ouderpagina openblijft zonder dat er iets gebeurt (ADR-232).
 * Vijf minuten is de standaard; wie rustig iets leest, kiest er meer.
 */
function SessieDuur() {
  const [minuten, setMinuten] = useState(sessieMinuten);
  return (
    <li className="tk-card flex flex-col gap-2">
      <span className="tk-lijstrij-titel" id="sessie-kop">
        {t('ouder.sessie')}
      </span>
      <span className="tk-hulp">{t('ouder.sessieRegel')}</span>
      <div className="flex flex-wrap gap-2" role="group" aria-labelledby="sessie-kop">
        {SESSIE_KEUZES.map((keuze) => (
          <button
            key={keuze}
            type="button"
            className="tk-chip"
            aria-pressed={keuze === minuten}
            onClick={() => {
              zetSessieMinuten(keuze);
              setMinuten(keuze);
            }}
          >
            {t('ouder.sessieMinuten', { aantal: keuze })}
          </button>
        ))}
      </div>
    </li>
  );
}

const PIN_FOUT: Record<OuderFout, TranslationKey> = {
  'geen-cijfers': 'ouder.fout.geenCijfers',
  ongelijk: 'ouder.fout.ongelijk',
  onjuist: 'ouder.fout.onjuist',
  'te-vaak': 'ouder.fout.teVaak',
  'geen-kluis': 'ouder.fout.geenKluis',
};

/**
 * Een nieuwe pincode, voor wie al binnen is (ADR-232). Binnen ben je alleen met
 * de oude, dus hoeft die niet nog eens.
 */
function PinWijzigen() {
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [herhaling, setHerhaling] = useState('');
  const [uitkomst, setUitkomst] = useState<'goed' | OuderFout | null>(null);
  const nieuw = useId();
  const nogEens = useId();

  async function bewaar(event: FormEvent) {
    event.preventDefault();
    const gedaan = await zetPin(pin, herhaling);
    setPin('');
    setHerhaling('');
    setUitkomst(gedaan.ok ? 'goed' : gedaan.reden);
    if (gedaan.ok) setOpen(false);
  }

  return (
    <li>
      <button
        type="button"
        className="tk-lijstrij"
        aria-expanded={open}
        onClick={() => {
          setOpen(!open);
          setUitkomst(null);
        }}
      >
        <span className="tk-plaat tk-plaat-neutraal">
          <SlotIcon size={24} />
        </span>
        <span className="tk-lijstrij-tekst">
          <span className="tk-lijstrij-titel">{t('ouder.pinWijzigen')}</span>
          <span className="tk-lijstrij-regel">{t('ouder.pinWijzigenRegel')}</span>
        </span>
      </button>
      {open ? (
        <form className="tk-card flex flex-col gap-3" onSubmit={(event) => void bewaar(event)}>
          <label htmlFor={nieuw} className="tk-label">
            {t('ouder.pinNieuw')}
          </label>
          <input
            id={nieuw}
            className="tk-input max-w-[10rem]"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            value={pin}
            onChange={(event) => setPin(event.target.value.replace(/\D/g, ''))}
          />
          <label htmlFor={nogEens} className="tk-label">
            {t('ouder.pinHerhaal')}
          </label>
          <input
            id={nogEens}
            className="tk-input max-w-[10rem]"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            value={herhaling}
            onChange={(event) => setHerhaling(event.target.value.replace(/\D/g, ''))}
          />
          <button type="submit" className="tk-button tk-button-secondary self-start">
            {t('ouder.bewaarPin')}
          </button>
        </form>
      ) : null}
      {uitkomst === 'goed' ? (
        <p role="status" className="tk-melding" data-soort="gelukt">
          {t('ouder.pinGewijzigd')}
        </p>
      ) : uitkomst !== null ? (
        <p role="alert" className="tk-melding" data-soort="fout">
          {t(PIN_FOUT[uitkomst], { seconden: 0 })}
        </p>
      ) : null}
    </li>
  );
}

/**
 * Het slot zelf, voor wie op /ouder komt zonder de pincode gegeven te hebben.
 *
 * Het staat in `App` en niet in de router, met opzet: een adres dat alleen
 * bestaat als je er mag komen, zou de terugknop laten liegen. Dit is dezelfde
 * pagina, met een deur ervoor.
 */
export function OuderPoort({ onOpen }: { readonly onOpen: () => void }) {
  return (
    <div className="tk-page">
      <div className="tk-page-main">
        <div className="tk-card flex max-w-md flex-col gap-3">
          <p className="tk-kaartteken">
            <SlotIcon size={24} />
          </p>
          <h1 className="tk-titel">{t('ouder.poortTitel')}</h1>
          <p className="text-lopend">{t('ouder.poortUitleg')}</p>
          <button type="button" className="tk-button self-start" onClick={onOpen}>
            <StarIcon size={24} />
            {t('ouder.poortKnop')}
          </button>
        </div>
      </div>
    </div>
  );
}
