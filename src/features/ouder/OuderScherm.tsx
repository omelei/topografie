import { useEffect, useState } from 'react';
import { CorrectIcon, SlotIcon, StarIcon, TodayIcon } from '@/components/Icon';
import { t } from '@/i18n';
import { AccountBlok } from '@/features/account/AccountBlok';
import { CodeVeld } from '@/features/premium/CodeVeld';
import { leesbareDatum, naarPremium, usePremium } from '@/features/premium/usePremium';
import { Wissen } from '@/features/player/Wissen';
import { isTeKoop, isVerlopen, meldAf } from '@/store/premium';
import { sluit, verleng } from '@/store/ouder';
import {
  GEEN_DOELEN,
  leesWeekdoelen,
  schrijfWeekdoelen,
  type Weekdoelen,
} from '@/store/weekdoelStore';
import { Apparaten } from './Apparaten';
import { Bewaren } from './Bewaren';
import { DezeWeek } from './DezeWeek';
import { GeheugencheckUitslag } from './GeheugencheckUitslag';
import { HoeGaatHet } from './HoeGaatHet';
import { Kinderen } from './Kinderen';
import { Overname } from './Overname';

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
  // Wat `Kinderen` verandert, moet `HoeGaatHet` opnieuw laten lezen: allebei
  // lezen ze dezelfde kinderen, en allebei houden ze hun eigen kopie. Een
  // teller als sleutel is hier goedkoper dan een winkel met abonnees, want er
  // zijn precies twee lezers en ze staan naast elkaar op één pagina.
  const [versie, zetVersie] = useState(0);
  // Een kind dat `Overname` op dit apparaat zet, hoort ook in `Kinderen` te
  // staan (ADR-189). Een eigen teller, zodat `Kinderen` alleen opnieuw begint
  // als er van buitenaf iets veranderde, en niet bij zijn eigen wijzigingen.
  const [vanBuiten, zetVanBuiten] = useState(0);

  return (
    <div className="tk-page" onClickCapture={() => verleng()} onKeyDownCapture={() => verleng()}>
      <div className="tk-page-main">
        <header className="flex flex-col gap-2">
          <h1 className="tk-titel">{t('ouder.titel')}</h1>
          <p className="text-lopend text-tekst-secundair">{t('ouder.intro')}</p>
        </header>

        <Kinderen
          key={`kinderen-${vanBuiten}`}
          onVeranderd={() => zetVersie((vorige) => vorige + 1)}
        />

        {/* Waar de poort, de volwassenencheck en de wisselaar het allemaal over
            hadden (ADR-177). Boven premium, want dit is waar een ouder voor
            komt; wat het kost is de vraag daarna. */}
        <HoeGaatHet key={`hoe-${versie}`} />

        {/* Wat het dagplan deze week deed (ADR-227). Ook zonder code: het plan
            rekent stil mee, en dit is waar een ouder ziet wat het zou doen. */}
        <DezeWeek key={`week-${versie}`} />

        {/* Wat de geheugencheck liet zien, één keer per kind (ADR-228). */}
        <GeheugencheckUitslag key={`check-${versie}`} />

        {/* Direct onder hoe het gaat: of wat de kinderen oefenen over een week
            nog staat, is de voorwaarde voor al het andere op deze pagina
            (ADR-186). Het blok tekent niets als de browser er niets over zegt. */}
        <Bewaren />

        <Premium />
        {/* Welke apparaten de code gebruiken (ADR-226). Alleen met een code op
            dit apparaat; de lijst komt pas na een druk op de knop. */}
        <Apparaten />
        <Gezinsinstellingen />

        {/* Het account van het gezin. Zonder gezinsproject in de bouw tekent het
            niets (ADR-172), en dat blijft zo: dit is de plek waar het komt te
            staan zodra er een account ís, en niet een kop met een belofte. */}
        <AccountBlok />

        {/* Direct onder het account: wie ingelogd is, kan hier zijn kinderen
            meenemen (ADR-187). Zonder sessie tekent het niets. */}
        <Overname
          onKinderenVeranderd={() => {
            zetVanBuiten((vorige) => vorige + 1);
            zetVersie((vorige) => vorige + 1);
          }}
        />

        {/* Als laatste, en achter de pincode: het enige op dit apparaat dat niet
            terug te draaien is (ADR-166). Het stond op Jij, waar een kind erbij
            kon. Het is ook de enige uitweg voor wie zijn pincode kwijt is, en
            het geeft dus niets: wie hem neemt, houdt een leeg apparaat over. */}
        <Wissen />

        <Terug naam={naam} />
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
      className="tk-button tk-button-secondary self-start"
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

  return (
    <section className="flex flex-col gap-3" aria-label={t('ouder.premium')}>
      <h2 className="tk-sectie">{t('ouder.premium')}</h2>

      {actief && stand ? (
        <div className="tk-card flex flex-col gap-3">
          <p className="flex items-center gap-2 text-lopend">
            <CorrectIcon size={24} />
            {t('premium.aan', { datum: leesbareDatum(stand.geldigTot) })}
          </p>
          <p className="text-lopend text-tekst-secundair">{t('ouder.premiumAlleKinderen')}</p>
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
    </section>
  );
}

/**
 * Wat de app wel of niet doet, voor het hele gezin.
 *
 * Eén schakelaar vandaag: of de app doelen voor de week voorstelt. Die stond
 * tussen de instellingen op Jij (ADR-171), en hij hoort hier: het is de
 * schakelaar die bepaalt of de app het kind ergens toe aanzet, en dat is een
 * besluit van de ouder en niet van wie aangezet wordt.
 *
 * Geluid, voorlezen en minder beweging blijven met opzet op Jij. Die gaan over
 * de kamer en over het kind dat de iPad vasthoudt; ze achter een pincode zetten
 * zou een kind dat het geluid uit wil doen naar zijn ouder sturen.
 */
function Gezinsinstellingen() {
  const [doelen, setDoelen] = useState<Weekdoelen | null>(null);

  useEffect(() => {
    void leesWeekdoelen().then(setDoelen);
  }, []);

  const uit = doelen?.uit ?? false;

  return (
    <section
      className="flex flex-col gap-3"
      aria-label={t('ouder.instellingen')}
      aria-busy={doelen === null}
    >
      <h2 className="tk-sectie">{t('ouder.instellingen')}</h2>
      <ul className="tk-lijst">
        <li>
          <button
            type="button"
            className="tk-lijstrij"
            aria-pressed={!uit}
            onClick={() => {
              const huidig = doelen ?? GEEN_DOELEN;
              const volgende = { ...huidig, uit: !huidig.uit };
              void schrijfWeekdoelen(volgende).then(() => setDoelen(volgende));
            }}
          >
            <span className="tk-plaat tk-plaat-neutraal">
              <TodayIcon size={24} />
            </span>
            <span className="tk-lijstrij-tekst">
              <span className="tk-lijstrij-titel">{t('you.doelen')}</span>
              <span className="tk-lijstrij-regel">{t('you.doelenWhy')}</span>
            </span>
            <span className="tk-lijstrij-pijl">
              <span className="tk-schakelaar" aria-hidden="true" />
              <span className="tk-label">{uit ? t('you.off') : t('you.on')}</span>
            </span>
          </button>
        </li>
      </ul>
      <p className="tk-hulp">{t('ouder.instellingenUitleg')}</p>
    </section>
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
