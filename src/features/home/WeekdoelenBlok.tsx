import { useEffect, useState, type ComponentType } from 'react';
import { Button } from '@/components/Button';
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
import { usePremium } from '@/features/premium/usePremium';
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
 * en met zondag. Wat er staat, is zelf gemaakt — door het kind hier of door de
 * ouder op Voor ouders — want een doel dat de app stelt is een opdracht, en dan
 * is het het dagplan nog een keer.
 *
 * **Drie soorten, alle drie op zondag na te rekenen.** Een aantal rondes, een
 * aantal dagen waarop geoefend is, of één diploma. Er is niets bij verzonnen
 * dat nergens uit af te leiden is: alle drie worden geteld uit wat er toch al
 * bewaard wordt (`weekdoel.ts`), zodat er geen tweede boekhouding is die kan
 * gaan scheellopen.
 *
 * **Drie is het maximum.** Een week met vijf doelen is een lijst met klusjes.
 *
 * **En het mag leeg blijven.** "Ik wil geen doelen" zet het blok weg, en het
 * vraagt daarna niet elke maandag opnieuw. Aanzetten kan op Voor ouders, waar
 * de instellingen staan (ADR-143) — dus op de voordeur is het uit ook echt uit,
 * en niet een dichtgeklapt blok dat nog een regel kost.
 *
 * **Niets tot het bekend is**, zoals `VandaagBlok`: een blok dat eerst "nog
 * geen doel" zegt en daarna van gedachten verandert heeft iets verteld wat niet
 * waar was.
 */

/** Waaruit gekozen kan worden bij "een aantal rondes" en "een aantal dagen". */
const RONDES_KEUZE: readonly number[] = [2, 3, 5, 8, 10];
const DAGEN_KEUZE: readonly number[] = [2, 3, 4, 5, 7];

/** Hoeveel diploma's er voorgesteld worden om uit te kiezen. */
const DIPLOMA_KEUZE = 3;

type Pictogram = ComponentType<Omit<IconProps, 'children'>>;

const SOORT_TEKEN: Record<WeekdoelSoort, Pictogram> = {
  rondes: TodayIcon,
  dagen: StreakIcon,
  diploma: DiplomaIcon,
};

export function WeekdoelenBlok({
  vanOuder = false,
  naam,
  onDiplomas,
  now = new Date(),
}: {
  /** Op Voor ouders: daar staat ook de schakelaar die het blok weer aanzet. */
  readonly vanOuder?: boolean;
  /** Van wie de doelen zijn. Alleen op Voor ouders, waar "je" de ouder is. */
  readonly naam?: string | undefined;
  /**
   * Naar alle diploma's (ADR-153). Onderaan het blok, want een diploma is een
   * van de drie soorten doelen en drie voorstellen zijn geen overzicht. Op Voor
   * ouders staat het hele raster al op de pagina zelf, dus daar niet.
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

  function zetUit(uit: boolean) {
    void bewaar({ ...(stand ?? GEEN_DOELEN), uit });
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

  const titel = vanOuder && naam ? t('weekdoel.ouderTitel', { naam }) : t('weekdoel.titel');

  // Uit. Op de voordeur is dat niets — het kind koos ervoor en hoort er niet
  // elke dag een regel over te lezen. Op Voor ouders staat de weg terug.
  if (stand.uit) {
    if (!vanOuder) return null;

    return (
      <section className="tk-doel" aria-label={titel}>
        <h2 className="tk-sectie">{titel}</h2>
        <p className="text-lopend text-tekst-secundair">{t('weekdoel.uitUitleg')}</p>
        <Button variant="secondary" className="self-start" onClick={() => zetUit(false)}>
          {t('weekdoel.aanZetten')}
        </Button>
      </section>
    );
  }

  const lijst = standen(stand.doelen, afgemaakt, behaald, now);
  const vol = stand.doelen.length >= MAX_DOELEN;
  const alle = doelwitten(startbareOnderdelen(), actief);

  return (
    <section className="tk-doel" aria-label={titel}>
      <div className="tk-weekdoel-kop">
        <h2 className="tk-sectie">{titel}</h2>
        {/* De datums, want "deze week" heeft een einde en dat hoort te zien
            zijn: op donderdag is het verschil tussen drie dagen en nul dagen
            precies wat je wilt weten. */}
        <p className="tk-hulp">{weekZin(now)}</p>
      </div>

      {lijst.length === 0 && nieuw === null ? (
        <p className="text-lopend text-tekst-secundair">
          {vanOuder ? t('weekdoel.leegOuder') : t('weekdoel.leeg')}
        </p>
      ) : null}

      {lijst.length > 0 ? (
        <ul className="tk-lijst">
          {lijst.map((doelstand) => (
            <li key={doelstand.doel.id}>
              <Rij
                stand={doelstand}
                omschrijving={omschrijf(doelstand.doel, alle)}
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
          diplomas={suggesties(alle, behaald, states, now, DIPLOMA_KEUZE, groep)
            .map((suggestie) => suggestie.doelwit)
            .filter((doelwit) => !gekozen(stand.doelen, doelwit.id))}
        />
      ) : (
        <div className="tk-doel-knoppen">
          {vol ? (
            <p className="tk-hulp">{t('weekdoel.vol')}</p>
          ) : (
            <Button variant="secondary" onClick={() => setNieuw('rondes')}>
              <PlusIcon size={20} />
              {t('weekdoel.toevoegen')}
            </Button>
          )}
          <button type="button" className="tk-doel-ander" onClick={() => zetUit(true)}>
            {vanOuder ? t('weekdoel.uitZettenOuder') : t('weekdoel.uitZetten')}
          </button>
        </div>
      )}

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
 * Geen knop om de hele rij: er valt niets te openen. De balk is decoratief
 * genoemd noch stil — hij draagt de stand in woorden, en de regel eronder zegt
 * hetzelfde, want een balk alleen is geen zin.
 */
function Rij({
  stand,
  omschrijving,
  onWeg,
}: {
  readonly stand: DoelStand;
  readonly omschrijving: string;
  readonly onWeg: () => void;
}) {
  const Teken = SOORT_TEKEN[stand.doel.soort];
  const regel = stand.gehaald
    ? t('weekdoel.gehaald')
    : t('weekdoel.balk', { gedaan: stand.gedaan, nodig: stand.nodig });

  return (
    <div className="tk-weekdoel-rij" data-gehaald={stand.gehaald ? '' : undefined}>
      <span className="tk-plaat tk-plaat-klein">
        <Teken size={20} />
      </span>
      <span className="tk-lijstrij-tekst">
        <span className="tk-lijstrij-titel">{omschrijving}</span>
        <ProgressBar
          value={stand.nodig === 0 ? 0 : stand.gedaan / stand.nodig}
          showDot={false}
          label={`${omschrijving}: ${regel}`}
        />
        <span className="tk-lijstrij-regel">{regel}</span>
      </span>
      <button
        type="button"
        className="tk-weekdoel-weg"
        aria-label={t('weekdoel.wegVan', { doel: omschrijving })}
        onClick={onWeg}
      >
        <WrongIcon size={20} />
      </button>
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
 */
function Toevoegen({
  soort,
  diplomas,
  onSoort,
  onKies,
  onAnnuleer,
}: {
  readonly soort: WeekdoelSoort;
  readonly diplomas: readonly Doelwit[];
  readonly onSoort: (soort: WeekdoelSoort) => void;
  readonly onKies: (doel: Weekdoel) => void;
  readonly onAnnuleer: () => void;
}) {
  const aantallen = soort === 'dagen' ? DAGEN_KEUZE : RONDES_KEUZE;

  return (
    <div className="flex flex-col gap-3">
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
        diplomas.length === 0 ? (
          <p className="text-tekst-secundair">{t('weekdoel.geenDiplomas')}</p>
        ) : (
          <ul className="tk-lijst" aria-label={t('weekdoel.welkDiploma')}>
            {diplomas.map((doelwit) => (
              <li key={doelwit.id}>
                <button
                  type="button"
                  data-module={doelwit.deel.moduleId}
                  className="tk-lijstrij"
                  onClick={() =>
                    onKies({
                      id: crypto.randomUUID(),
                      soort: 'diploma',
                      aantal: 1,
                      diplomaId: doelwit.id,
                    })
                  }
                >
                  <span className="tk-plaat tk-plaat-klein">
                    <DiplomaIcon size={20} />
                  </span>
                  <span className="tk-lijstrij-tekst">
                    <span className="tk-lijstrij-titel">
                      {t('weekdoel.diplomaDoel', { naam: naamVan(doelwit.deel) })}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
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

