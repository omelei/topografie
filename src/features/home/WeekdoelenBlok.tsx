import { useEffect, useState, type ComponentType } from 'react';
import { ProgressBar } from '@/components/ProgressBar';
import {
  DiplomaIcon,
  type IconProps,
  PlusIcon,
  StreakIcon,
  TodayIcon,
  WrongIcon,
} from '@/components/Icon';
import type { Groep, ItemState } from '@/game-core';
import { naamVan, startbareOnderdelen } from '@/features/module/onderdelen';
import { isPremiumVorm, metPremium } from '@/features/module/premium';
import { PremiumLabel } from '@/features/module/PremiumLabel';
import { vraagOuders } from '@/features/premium/ouderVraag';
import { PremiumSlot } from '@/features/premium/PremiumSlot';
import { usePremium } from '@/features/premium/usePremium';
import { MODULES, type Module } from '@/features/shell/modules';
import { t, type TranslationKey } from '@/i18n';
import { groepVanActiefKind } from '@/store/children';
import { loadItemStates, loadPlayedRounds } from '@/store/progress';
import { loadBehaald } from '@/store/rewardStore';
import {
  GEEN_DOELEN,
  leesWeekdoelen,
  MAX_DOELEN,
  schrijfWeekdoelen,
  type Weekdoel,
  type Weekdoelen,
  type WeekdoelSoort,
} from '@/store/weekdoelStore';
import { doelwitMet, doelwitten, suggesties, type Doelwit } from './doel';
import { standen, weekZin, type DoelStand } from './weekdoel';

/**
 * "Je doelen voor deze week" (ADR-162).
 *
 * Het blok dat hier stond — "Waar je voor gaat" — koos één diploma uit drie
 * voorstellen en hield dat maanden vol. Dat is een goed antwoord op "waarvoor",
 * en een slecht antwoord op "wat doe ik deze week": een doel zonder einddatum
 * is nooit gehaald en nooit gemist, en daarmee zegt het op donderdagavond
 * niets.
 *
 * Dit blok heeft wél een einde, en dat staat erbij: de datums van maandag tot
 * en met zondag. Wat er staat, heeft het kind zelf gemaakt, want een doel dat de
 * app stelt is een opdracht, en dan is het het dagplan nog een keer.
 *
 * **Drie soorten, alle drie op zondag na te rekenen.** Een aantal rondes, een
 * aantal dagen waarop geoefend is, of één diploma. Er is niets bij verzonnen
 * dat nergens uit af te leiden is: alle drie worden geteld uit wat er toch al
 * bewaard wordt (`weekdoel.ts`), zodat er geen tweede boekhouding is die kan
 * gaan scheellopen.
 *
 * **Drie is het maximum.** Een week met vijf doelen is een lijst met klusjes.
 *
 * **En elk diploma is te kiezen** (ADR-168). Het blok stelde er drie voor — de
 * drie die het dichtst bij waren — en dat wás de hele lijst: wie de tafel van 8
 * wilde en 12, 11 en 9 kreeg voorgesteld, kon niets anders kiezen. Drie
 * voorstellen zijn een goede eerste regel en een slecht menu. Dus staan ze er
 * nog, bovenaan onder "Dichtbij", en daaronder staat per vak alles wat er te
 * halen valt. Ook wat een code vraagt: die rij is dan geen doel maar de vraag
 * aan de ouders (ADR-163), net als elke andere premiumtegel in de app —
 * weglaten liet een kind denken dat het diploma niet bestond.
 *
 * **En het mag leeg blijven.** "Ik wil geen doelen" zet het blok weg, en het
 * vraagt daarna niet elke maandag opnieuw. Aanzetten kan bij de instellingen op
 * Jij (ADR-171) — dus op de voordeur is het uit ook echt uit, en niet een
 * dichtgeklapt blok dat nog een regel kost.
 *
 * **Opgemaakt als "Recent geoefend"** (ADR-171). Het was een kaart met de kop
 * erin, rijen van een eigen soort met een kleiner plaatje, en de knoppen
 * onderin dezelfde kaart — het enige blok op de voordeur dat er zo uitzag. Nu
 * staat de kop erboven op de haarlijn, met de datums aan het eind zoals een
 * sectie zijn telling draagt, en zijn de doelen een lijst: dezelfde kaart,
 * dezelfde rij, hetzelfde plaatje en het kruisje waar bij Recent de pijl staat.
 * De knoppen staan eronder, buiten de kaart, zoals "Nog een kind erbij" onder
 * de lijst op Jij.
 *
 * **Niets tot het bekend is**, zoals `VandaagBlok`: een blok dat eerst "nog
 * geen doel" zegt en daarna van gedachten verandert heeft iets verteld wat niet
 * waar was.
 */

/** Waaruit gekozen kan worden bij "een aantal rondes" en "een aantal dagen". */
const RONDES_KEUZE: readonly number[] = [2, 3, 5, 8, 10];
const DAGEN_KEUZE: readonly number[] = [2, 3, 4, 5, 7];

/** Hoeveel diploma's er bovenaan voorgesteld worden. De rest staat eronder. */
const DIPLOMA_KEUZE = 3;

type Pictogram = ComponentType<Omit<IconProps, 'children'>>;

const SOORT_TEKEN: Record<WeekdoelSoort, Pictogram> = {
  rondes: TodayIcon,
  dagen: StreakIcon,
  diploma: DiplomaIcon,
};

export function WeekdoelenBlok({
  onDiplomas,
  now = new Date(),
}: {
  /**
   * Naar alle diploma's (ADR-153). Onder het blok, want een diploma is een van
   * de drie soorten doelen en drie voorstellen zijn geen overzicht.
   */
  readonly onDiplomas?: (() => void) | undefined;
  readonly now?: Date;
}) {
  const { actief } = usePremium();
  const [stand, setStand] = useState<Weekdoelen | null>(null);
  const [afgemaakt, setAfgemaakt] = useState<readonly string[] | null>(null);
  const [behaald, setBehaald] = useState<ReadonlySet<string> | null>(null);
  const [states, setStates] = useState<ReadonlyMap<string, ItemState> | null>(null);
  const [groep, setGroep] = useState<Groep | undefined>(undefined);
  const [nieuw, setNieuw] = useState<WeekdoelSoort | null>(null);

  useEffect(() => {
    void (async () => {
      const [doelen, rondes, stempels, standenVanItems, vanKind] = await Promise.all([
        leesWeekdoelen(),
        loadPlayedRounds(),
        loadBehaald(),
        loadItemStates(),
        groepVanActiefKind(),
      ]);
      setStand(doelen);
      setAfgemaakt(rondes.map((ronde) => ronde.at));
      setBehaald(stempels);
      setStates(standenVanItems);
      setGroep(vanKind);
    })();
  }, []);

  if (stand === null || afgemaakt === null || behaald === null || states === null) return null;

  // Eerst wegschrijven, dan tonen — zoals `GroepInstelling` en het blok dat
  // hier stond: wat op het scherm staat, staat zo ook in de opslag.
  async function bewaar(volgende: Weekdoelen) {
    await schrijfWeekdoelen(volgende);
    setStand(volgende);
  }

  function zetUit() {
    void bewaar({ ...(stand ?? GEEN_DOELEN), uit: true });
    setNieuw(null);
  }

  function voegToe(doel: Weekdoel) {
    const huidig = stand ?? GEEN_DOELEN;
    if (huidig.doelen.length >= MAX_DOELEN) return;
    void bewaar({ ...huidig, doelen: [...huidig.doelen, doel] });
    setNieuw(null);
  }

  function haalWeg(id: string) {
    const huidig = stand ?? GEEN_DOELEN;
    void bewaar({ ...huidig, doelen: huidig.doelen.filter((doel) => doel.id !== id) });
  }

  const titel = t('weekdoel.titel');

  // Uit. Op de voordeur is dat niets — het kind koos ervoor en hoort er niet
  // elke dag een regel over te lezen. De weg terug staat op Jij (ADR-171).
  if (stand.uit) return null;

  // Zonder premium de kop en wat het zou doen (ADR-192). Een weekdoel telt
  // rondes en dagen, en dat is precies wat alleen met premium te zien is.
  if (!actief) {
    return (
      <section className="flex flex-col gap-3" aria-label={titel}>
        <h2 className="tk-sectie">{titel}</h2>
        <PremiumSlot wat="premium.wat.weekdoelen" />
      </section>
    );
  }

  const lijst = standen(stand.doelen, afgemaakt, behaald, now);
  const vol = stand.doelen.length >= MAX_DOELEN;
  // Alle 33, ook de premiumdiploma's. Die worden niet weggelaten maar gemerkt:
  // een kind dat de vlaggen van Europa wil, hoort te zien dát dat bestaat. En
  // een doel dat met een code gezet is, houdt zo zijn naam ook als de code om
  // is — met `actief` stond daar "Dit diploma bestaat niet meer".
  const alle = doelwitten(startbareOnderdelen(), true);
  // Wat nog open staat: niet gehaald, en niet al een doel van deze week.
  const openDoelwitten = alle.filter(
    (doelwit) => !behaald.has(doelwit.id) && !gekozen(stand.doelen, doelwit.id),
  );
  // Voorgesteld wordt alleen wat dit kind vandaag ook kan doen: een voorstel
  // dat op een slot uitloopt is geen voorstel. In de lijst eronder staat het
  // wel, met het slot erbij.
  const dichtbij = suggesties(
    openDoelwitten.filter((doelwit) => actief || !isPremiumVorm(doelwit.mode)),
    new Set<string>(),
    states,
    now,
    DIPLOMA_KEUZE,
    groep,
  ).map((suggestie) => suggestie.doelwit);
  // Elk diploma staat precies één keer in de lijst: wat bovenaan bij "Dichtbij"
  // staat, staat niet nog eens onder zijn vak. Een keuzelijst waarin dezelfde
  // regel twee keer voorkomt, is een lijst die je twee keer moet lezen om te
  // weten of het er echt twee zijn.
  const dichtbijIds = new Set(dichtbij.map((doelwit) => doelwit.id));
  const perVak = MODULES.map((module) => ({
    module,
    doelen: openDoelwitten.filter(
      (doelwit) => doelwit.deel.moduleId === module.id && !dichtbijIds.has(doelwit.id),
    ),
  })).filter((rij) => rij.doelen.length > 0);

  return (
    <section className="flex flex-col gap-3" aria-label={titel}>
      {/* De kop op de haarlijn, en de datums aan het eind zoals een sectie zijn
          telling draagt: "deze week" heeft een einde en dat hoort te zien zijn —
          op donderdag is het verschil tussen drie dagen en nul dagen precies
          wat je wilt weten. */}
      <div className="tk-sectie">
        <h2>{titel}</h2>
        <span className="tk-sectie-meta">{weekZin(now)}</span>
      </div>

      {lijst.length === 0 && nieuw === null ? (
        <p className="text-tekst-secundair">{t('weekdoel.leeg')}</p>
      ) : null}

      {lijst.length > 0 ? (
        <ul className="tk-lijst">
          {lijst.map((doelstand) => (
            <li key={doelstand.doel.id}>
              <Rij
                stand={doelstand}
                omschrijving={omschrijf(doelstand.doel, alle)}
                moduleId={moduleVan(doelstand.doel, alle)}
                onWeg={() => haalWeg(doelstand.doel.id)}
              />
            </li>
          ))}
        </ul>
      ) : null}

      {nieuw !== null ? (
        <Toevoegen
          soort={nieuw}
          onSoort={setNieuw}
          onKies={voegToe}
          onAnnuleer={() => setNieuw(null)}
          dichtbij={dichtbij}
          perVak={perVak}
          premium={actief}
        />
      ) : (
        <div className="tk-doel-knoppen">
          {/* De knop erbij is een kale knop en niet `Button`, om het teken:
              `Button` stopt zijn kinderen in één span, en de 8px tussenruimte
              van `.tk-button` geldt voor directe kinderen. Zo doet "Nog een
              kind erbij" op Jij het ook. */}
          {vol ? (
            <p className="tk-hulp">{t('weekdoel.vol')}</p>
          ) : (
            <button
              type="button"
              className="tk-button tk-button-secondary"
              onClick={() => setNieuw('rondes')}
            >
              <PlusIcon size={20} />
              {t('weekdoel.toevoegen')}
            </button>
          )}
          <button type="button" className="tk-doel-ander" onClick={zetUit}>
            {t('weekdoel.uitZetten')}
          </button>
        </div>
      )}

      {/* Altijd, ook terwijl er een doel gekozen wordt: dan is het overzicht
          juist het nuttigst. */}
      {onDiplomas ? (
        <p>
          <button type="button" className="tk-doel-ander" onClick={onDiplomas}>
            {t('weekdoel.alleDiplomas')}
          </button>
        </p>
      ) : null}
    </section>
  );
}

/** Staat dit diploma al als doel? Dan hoeft het niet nog eens voorgesteld. */
function gekozen(doelen: readonly Weekdoel[], diplomaId: string): boolean {
  return doelen.some((doel) => doel.diplomaId === diplomaId);
}

/**
 * Het vak van een diplomadoel, voor de kleur van zijn plaatje — zoals een rij
 * in "Recent geoefend" de kleur van zijn vak draagt. Rondes en dagen horen bij
 * geen vak en houden de kleur van de voordeur.
 */
function moduleVan(doel: Weekdoel, alle: readonly Doelwit[]): Module['id'] | undefined {
  if (doel.soort !== 'diploma') return undefined;
  return doelwitMet(alle, doel.diplomaId)?.deel.moduleId;
}

/** Wat het doel is, in één regel: de zin die het kind zelf koos. */
function omschrijf(doel: Weekdoel, alle: readonly Doelwit[]): string {
  if (doel.soort === 'rondes') return t('weekdoel.rondesDoel', { aantal: doel.aantal });
  if (doel.soort === 'dagen') return t('weekdoel.dagenDoel', { aantal: doel.aantal });
  const doelwit = doelwitMet(alle, doel.diplomaId);
  // Een diploma dat niet meer bestaat — een set die weg is, of een premiumvorm
  // zonder code — levert de kale zin op in plaats van een kapotte rij.
  return doelwit === null
    ? t('weekdoel.diplomaWeg')
    : t('weekdoel.diplomaDoel', { naam: naamVan(doelwit.deel) });
}

/**
 * Eén doel: wat het is, hoe ver het is, en de weg eruit.
 *
 * Een rij van de lijst, zoals in "Recent geoefend": het plaatje, de zin met
 * de balk eronder, de stand aan het eind en het kruisje waar daar de pijl
 * staat. Op een telefoon gaat de stand onder de balk, zoals daar het cijfer.
 *
 * Geen knop om de hele rij: er valt niets te openen. De balk is decoratief
 * genoemd noch stil — hij draagt de stand in woorden, en de stand ernaast zegt
 * hetzelfde, want een balk alleen is geen zin.
 */
function Rij({
  stand,
  omschrijving,
  moduleId,
  onWeg,
}: {
  readonly stand: DoelStand;
  readonly omschrijving: string;
  readonly moduleId: Module['id'] | undefined;
  readonly onWeg: () => void;
}) {
  const Teken = SOORT_TEKEN[stand.doel.soort];
  const regel = stand.gehaald
    ? t('weekdoel.gehaald')
    : t('weekdoel.balk', { gedaan: stand.gedaan, nodig: stand.nodig });

  return (
    <div
      className="tk-lijstrij tk-weekdoel-rij"
      data-module={moduleId}
      data-gehaald={stand.gehaald ? '' : undefined}
    >
      <span className="tk-plaat">
        <Teken size={24} />
      </span>
      <span className="tk-lijstrij-tekst">
        <span className="tk-lijstrij-titel">{omschrijving}</span>
        <ProgressBar
          value={stand.nodig === 0 ? 0 : stand.gedaan / stand.nodig}
          showDot={false}
          label={`${omschrijving}: ${regel}`}
        />
      </span>
      <span className="tk-lijstrij-stand">{regel}</span>
      <span className="tk-lijstrij-pijl">
        <button
          type="button"
          className="tk-weekdoel-weg"
          aria-label={t('weekdoel.wegVan', { doel: omschrijving })}
          onClick={onWeg}
        >
          <WrongIcon size={20} />
        </button>
      </span>
    </div>
  );
}

/**
 * Een doel erbij: eerst welke soort, dan hoeveel of welk diploma.
 *
 * Twee stappen op één plek, en de eerste staat altijd open, zodat van soort
 * wisselen één druk is en niet eerst terug. Chips en geen `select`: elke keuze
 * is het zien waard, en een menu op een aanraakscherm dekt af waar je naar keek
 * — dezelfde redenering als op Onthouden.
 *
 * Bij "een diploma" staat eerst wat dichtbij is en daaronder alles, per vak
 * (ADR-168). De lijst is lang — drieëndertig regels — en dat is precies wat er
 * gevraagd werd: elk diploma moet te kiezen zijn. Wat de lengte draagt is de
 * kop per vak en de volgorde van `MODULES`, dezelfde als in de rail.
 */
function Toevoegen({
  soort,
  dichtbij,
  perVak,
  premium,
  onSoort,
  onKies,
  onAnnuleer,
}: {
  readonly soort: WeekdoelSoort;
  /** De drie die het dichtst bij zijn, bovenaan. Leeg als er niets open staat. */
  readonly dichtbij: readonly Doelwit[];
  /** Alles wat open staat, per vak, in de volgorde van de rail. */
  readonly perVak: readonly { readonly module: Module; readonly doelen: readonly Doelwit[] }[];
  readonly premium: boolean;
  readonly onSoort: (soort: WeekdoelSoort) => void;
  readonly onKies: (doel: Weekdoel) => void;
  readonly onAnnuleer: () => void;
}) {
  const aantallen = soort === 'dagen' ? DAGEN_KEUZE : RONDES_KEUZE;

  return (
    // In een kaart, want de sectie zelf is er geen meer: de keuze hoort als één
    // ding onder de lijst te staan en niet los op de voordeur.
    <div className="tk-card flex flex-col gap-3">
      <p className="text-tekst-secundair">{t('weekdoel.vraag')}</p>

      <div className="tk-keuzes" role="group" aria-label={t('weekdoel.vraag')}>
        {(['rondes', 'dagen', 'diploma'] as const).map((kandidaat) => {
          const Teken = SOORT_TEKEN[kandidaat];

          return (
            <button
              key={kandidaat}
              type="button"
              className="tk-keuze"
              aria-pressed={kandidaat === soort}
              onClick={() => onSoort(kandidaat)}
            >
              <Teken size={20} />
              {t(`weekdoel.soort.${kandidaat}` as TranslationKey)}
            </button>
          );
        })}
      </div>

      {soort === 'diploma' ? (
        perVak.length === 0 && dichtbij.length === 0 ? (
          <p className="text-tekst-secundair">{t('weekdoel.geenDiplomas')}</p>
        ) : (
          <div className="tk-doel-keuze">
            {dichtbij.length > 0 ? (
              <DiplomaLijst
                titel={t('weekdoel.diplomaDichtbij')}
                doelen={dichtbij}
                premium={premium}
                onKies={onKies}
              />
            ) : null}

            {perVak.map(({ module, doelen }) => (
              <DiplomaLijst
                key={module.id}
                titel={t(module.name)}
                doelen={doelen}
                premium={premium}
                onKies={onKies}
              />
            ))}
          </div>
        )
      ) : (
        <div className="tk-keuzes" role="group" aria-label={t('weekdoel.hoeveel')}>
          {aantallen.map((aantal) => (
            <button
              key={aantal}
              type="button"
              className="tk-keuze"
              aria-label={
                soort === 'rondes'
                  ? t('weekdoel.rondesDoel', { aantal })
                  : t('weekdoel.dagenDoel', { aantal })
              }
              onClick={() => onKies({ id: crypto.randomUUID(), soort, aantal, diplomaId: null })}
            >
              <span aria-hidden="true">{aantal}</span>
            </button>
          ))}
        </div>
      )}

      <button type="button" className="tk-doel-ander self-start" onClick={onAnnuleer}>
        {t('weekdoel.annuleer')}
      </button>
    </div>
  );
}

/**
 * Eén kop met de diploma's eronder: "Dichtbij", of de naam van een vak.
 *
 * Zonder code is een rij geen doel maar de vraag aan de ouders (ADR-163). Dat
 * is niet weggelaten en niet uitgeschakeld: uitschakelen laat een kind met een
 * grijze regel achter waar niemand iets van leert, en weglaten laat het denken
 * dat het diploma niet bestaat.
 */
function DiplomaLijst({
  titel,
  doelen,
  premium,
  onKies,
}: {
  readonly titel: string;
  readonly doelen: readonly Doelwit[];
  readonly premium: boolean;
  readonly onKies: (doel: Weekdoel) => void;
}) {
  return (
    <section className="flex flex-col gap-2" aria-label={titel}>
      <h3 className="tk-sectie tk-sectie-klein">{titel}</h3>

      <ul className="tk-lijst">
        {doelen.map((doelwit) => {
          const naam = t('weekdoel.diplomaDoel', { naam: naamVan(doelwit.deel) });
          const opSlot = !premium && isPremiumVorm(doelwit.mode);

          return (
            <li key={doelwit.id}>
              <button
                type="button"
                data-module={doelwit.deel.moduleId}
                className="tk-lijstrij"
                aria-label={metPremium(naam, isPremiumVorm(doelwit.mode), premium)}
                onClick={() => {
                  if (opSlot) {
                    vraagOuders();
                    return;
                  }
                  onKies({
                    id: crypto.randomUUID(),
                    soort: 'diploma',
                    aantal: 1,
                    diplomaId: doelwit.id,
                  });
                }}
              >
                <span className="tk-plaat tk-plaat-klein">
                  <DiplomaIcon size={20} />
                </span>
                <span className="tk-lijstrij-tekst">
                  <span className="tk-lijstrij-titel">{naam}</span>
                </span>
                {isPremiumVorm(doelwit.mode) ? <PremiumLabel /> : null}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
