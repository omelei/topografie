import { Fragment, useEffect, useState, type ReactNode } from 'react';
import { Brandmark } from '@/components/Brandmark';
import {
  formatGrade,
  grade,
  huidigeGroep,
  isKleutergroep,
  type Groep,
  type ItemState,
  type ModeId,
} from '@/game-core';
import { ProgressBar } from '@/components/ProgressBar';
import { MODULE_ICON } from '@/features/shell/moduleIcons';
import type { Module } from '@/features/shell/modules';
import { t, type TranslationKey } from '@/i18n';
import { loadItemStates, loadOpenRounds, loadPlayedRounds } from '@/store/progress';
import {
  getActiveChild,
  groepOnbekend,
  setGroep as bewaarGroep,
  zetGroepOnbekend,
} from '@/store/children';
import { tel } from '@/store/teller';
import type { OpenRound, PlayedRound } from '@/store/progress';
import {
  geplaatst,
  naamVan,
  starters,
  startbareOnderdelen,
  voorGroep,
  type Gespeeld,
  type Onderdeel,
} from '@/features/module/onderdelen';
import { usePremium } from '@/features/premium/usePremium';
import { Geheugencheck, zoekGeheugencheck, type CheckKlaar } from './Geheugencheck';
import { GroepVraag, VakkenRaster, VoorKleuters, ZoWerktHet } from './Kennismaken';
import { NuDoenKaart } from './NuDoen';
import { halfAf, kiesNuDoen, verderOefenen, type NuDoenSoort, type VerderKaart } from './nuDoen';
import { terugkomst, TerugKaart } from './TerugBlok';
import { useVandaag, vrijeVorm } from './useVandaag';
import { HerhaalRegel, KlaarVoorVandaag, VandaagHerhalen } from './VandaagBlok';
import { ScrollRij } from './ScrollRij';
import { NaamUitnodiging, VoorWieNieuwIs } from './NogZonderNaam';

/**
 * K1, the front door — which is also leer.nu itself.
 *
 * **Eén ding bovenaan: Nu doen** (ADR-250). Onder de begroeting staat precies
 * één kaart met één knop, en die staat op elke telefoon boven de vouw. Welke
 * kaart, kiest `kiesNuDoen`: Welkom terug, Vandaag herhalen, Maak af, de
 * geheugencheck of Ga verder. Hiervoor kozen die vijf elk hun eigen plek, en
 * stond de knop die de begroeting beloofde onder het naamformulier en twee
 * rijen geschiedenis.
 *
 * **Daaronder één rij: Verder oefenen** (ADR-250). Meest geoefend, Recent
 * geoefend en Maak af toonden een kind met één ronde drie keer hetzelfde
 * onderwerp. Nu staat elk onderwerp één keer, en niet nog eens als het Nu doen
 * is. Wat half af is, staat vooraan.
 *
 * **Een nieuw kind** krijgt eerst de vraag naar zijn groep (ADR-243), dan de
 * onderwerpen van die groep. Wie al geoefend heeft, heeft zijn eigen weg terug
 * in de rijen.
 *
 * **De vakken en "Zo werkt leer.nu" alleen aan een bureau** (ADR-251). Vanaf
 * 1200 staan ze onderaan; op een telefoon en een tablet niet, want daar zijn
 * de vakken één tik weg onder Oefenen.
 *
 * **Geen premium op Vandaag** (ADR-250). Een kind koopt niets (R-11): zonder
 * code staat er hoeveel er terugkomt, als feit, en geen slot en geen knop.
 *
 * Eén kolom, op elke maat (ADR-168). One thing it deliberately does not do:
 * **it does not forecast** — "wat onthoud je" is K9's.
 */

export interface HomeScreenProps {
  /** Whose front door this is. K1 opens by saying so. */
  readonly naam: string;
  /**
   * One way into a round, whichever module it is in: the same one the child's
   * own column and the module pages use.
   */
  readonly onBegin: (deel: Onderdeel, mode: ModeId) => void;
  /** An unfinished round, picked up: the same set and way, asking only the rest. */
  readonly onVerder: (deel: Onderdeel, mode: ModeId, rest: readonly string[]) => void;
  /**
   * Een geplande ronde: dezelfde set, dezelfde manier, en alleen de onderdelen
   * die vandaag aan de beurt zijn (ADR-126). Dat is wat "Maak af" ook doet, met
   * een andere reden — daar is de rest van een ronde, hier wat je bijna vergeet.
   */
  readonly onPlan: (deel: Onderdeel, mode: ModeId, ids: readonly string[]) => void;
  /** Naar de pagina van een vak, vanuit "Kies een vak" (ADR-204). */
  readonly onVak: (id: Module['id']) => void;
  /** De geheugencheck, één keer per kind (ADR-228). */
  readonly onGeheugencheck: (check: CheckKlaar) => void;
  /** Naar de pagina voor ouders, voor wie nog geen naam heeft (ADR-229). */
  readonly onVoorOuders: () => void;
}

export function HomeScreen({
  naam,
  onBegin,
  onVerder,
  onPlan,
  onVak,
  onGeheugencheck,
  onVoorOuders,
}: HomeScreenProps) {
  const [played, setPlayed] = useState<readonly PlayedRound[]>([]);
  // Of de rondes gelezen zijn: pas dan is "nog niets geoefend" waar, en
  // anders flitsen de blokken voor een nieuw kind langs bij een kind van jaren.
  const [gelezen, setGelezen] = useState(false);
  const [open, setOpen] = useState<readonly OpenRound[] | null>(null);
  const [states, setStates] = useState<ReadonlyMap<string, ItemState> | null>(null);
  // De geheugencheck: `undefined` tot hij gezocht is, `null` als er geen is.
  const [check, setCheck] = useState<CheckKlaar | null | undefined>(undefined);
  const [groep, setGroep] = useState<Groep | undefined>(undefined);
  const [groepGelezen, setGroepGelezen] = useState(false);
  const [kindId, setKindId] = useState<string | null>(null);
  // Of dit kind op de vraag naar de groep "Weet ik niet" zei (ADR-243), en of
  // het net op "Andere groep" drukte.
  const [weetNiet, setWeetNiet] = useState(false);
  const [andereGroep, setAndereGroep] = useState(false);
  // "Later" op Welkom terug (ADR-250). Na de volgende ronde is hij vanzelf weg,
  // want dan was de laatste ronde vandaag; tot dan is dit genoeg.
  const [terugLater, setTerugLater] = useState(false);

  useEffect(() => {
    void loadPlayedRounds().then((rondes) => {
      setPlayed(rondes);
      setGelezen(true);
    });
    void loadOpenRounds().then(setOpen);
    void loadItemStates().then(setStates);
    void zoekGeheugencheck(new Date()).then(setCheck);
    void (async () => {
      const kind = await getActiveChild();
      setGroep(kind ? huidigeGroep(kind, new Date()) : undefined);
      setKindId(kind?.id ?? null);
      setWeetNiet(kind ? await groepOnbekend(kind.id) : false);
      setGroepGelezen(true);
    })();
  }, []);

  // De groep, gekozen op Vandaag (ADR-243): bewaard bij het kind, zoals op Jij,
  // en geteld zonder wie (ADR-210). Alleen de keuze zelf, en niet samen met
  // iets anders: wat een kind oefent, blijft op het apparaat.
  async function kiesGroep(gekozen: Groep | undefined) {
    if (kindId !== null) {
      await bewaarGroep(kindId, gekozen);
      if (gekozen === undefined) await zetGroepOnbekend(kindId);
    }
    tel('groep', gekozen === undefined ? '/geen' : `/${gekozen}`);
    setGroep(gekozen);
    setWeetNiet(gekozen === undefined);
    setAndereGroep(false);
  }

  const { actief } = usePremium();
  const vandaag = useVandaag();

  // Over every set a round can be started on, mixes included: a round of the
  // Rekenmix that could not be placed would drop out of the history entirely.
  const alles = startbareOnderdelen();
  const gespeeld = geplaatst(played, alles);
  // Een kind zonder naam oefent gewoon (ADR-229); de voordeur groet het zonder
  // naam, en vraagt hem pas na de eerste ronde, als uitnodiging.
  const naamloos = naam.trim() === '';

  // Nieuw is: nog geen ronde af, geen ronde half en niets te herhalen. Wie er
  // één stopte, heeft "Maak af" nodig en is geen beginner meer.
  const basisGelezen = gelezen && open !== null && states !== null && groepGelezen;
  const nieuw = basisGelezen && played.length === 0 && open.length === 0 && states.size === 0;
  // Pas als alles gelezen is, staat de rest er (ADR-229): de pagina tekende
  // eerst de ene indeling en wisselde dan naar de andere, en alles onder het
  // eerste blok sprong een scherm omlaag (CLS 0,36). Voor wie al oefende, wacht
  // Nu doen ook op het plan, de dozen en de geheugencheck: een kaart die
  // bovenaan verschijnt en dan plaatsmaakt, is een knop onder een vinger die
  // weg is.
  const gelezenAlles = basisGelezen && (nieuw || (vandaag !== null && check !== undefined));

  // ---- Nu doen (ADR-250) ----
  const terug = states === null || terugLater ? null : terugkomst(played, states, new Date());
  const herhalen =
    actief && vandaag !== null && !vandaag.voortgang.klaar && vandaag.plan.vragen > 0;
  const half = halfAf(open ?? [], alles);
  const laatste = gespeeld[0] ?? null;
  const soort = kiesNuDoen({
    terug: terug !== null,
    herhalen,
    maakAf: half !== null,
    check: check !== null && check !== undefined,
    verder: laatste !== null,
  });
  const klaarVandaag = actief && vandaag !== null && vandaag.voortgang.klaar;

  // Het onderwerp van Nu doen staat niet nog eens in Verder oefenen.
  const nuSet =
    soort === 'terug'
      ? (terug?.eerste.deel.setId ?? null)
      : soort === 'maakAf'
        ? (half?.deel.setId ?? null)
        : soort === 'check'
          ? (check?.deel.setId ?? null)
          : soort === 'verder'
            ? (laatste?.deel.setId ?? null)
            : null;

  let nuDoen: ReactNode = null;
  if (soort === 'terug' && terug !== null) {
    nuDoen = (
      <TerugKaart
        terug={terug}
        gespeeld={gespeeld}
        onVerder={onVerder}
        onLater={() => setTerugLater(true)}
      />
    );
  } else if (soort === 'herhalen' && vandaag !== null) {
    nuDoen = <VandaagHerhalen vandaag={vandaag} gespeeld={gespeeld} onPlan={onPlan} />;
  } else if (soort === 'maakAf' && half !== null) {
    const { deel, ronde } = half;
    const rest = ronde.rest.length;
    nuDoen = (
      <NuDoenKaart
        moduleId={deel.moduleId}
        kop={t('home.nu.maakAf.kop')}
        regel={
          rest === 1
            ? t('home.nu.maakAf.regelEen', { onderwerp: naamVan(deel), totaal: ronde.totaal })
            : t('home.nu.maakAf.regel', {
                onderwerp: naamVan(deel),
                aantal: rest,
                totaal: ronde.totaal,
              })
        }
        knop={t('home.nu.maakAf.knop')}
        balk={{ waarde: ronde.beantwoord / ronde.totaal, label: restVan(ronde) }}
        onStart={() => onVerder(deel, vrijeVorm(deel, ronde.mode, actief), ronde.rest)}
      />
    );
  } else if (soort === 'check' && check) {
    nuDoen = <Geheugencheck check={check} onStart={onGeheugencheck} />;
  } else if (soort === 'verder' && laatste !== null) {
    const vorm = vrijeVorm(laatste.deel, laatste.ronde.mode, actief);
    nuDoen = (
      <NuDoenKaart
        vorm="smal"
        moduleId={laatste.deel.moduleId}
        kop={t('home.nu.verder.kop', { onderwerp: naamVan(laatste.deel) })}
        regel={t(`mode.${vorm}` as TranslationKey)}
        knop={t('home.nu.verder.knop')}
        onStart={() => onBegin(laatste.deel, vorm)}
      />
    );
  }

  // Een nieuw kind zonder groep krijgt eerst de vraag naar de groep (ADR-243),
  // want de groep bepaalt waarmee het begint. Wie "Weet ik niet" zei, krijgt
  // hem niet terug; wie op "Andere groep" drukt, wel.
  const vraagGroep = nieuw && ((groep === undefined && !weetNiet) || andereGroep);
  const kleuter = nieuw && !vraagGroep && isKleutergroep(groep);

  // De zin onder de begroeting zegt wat er nu staat, en hoort bij Nu doen.
  const status: string = !gelezenAlles
    ? t('home.todayOpen')
    : nieuw
      ? vraagGroep
        ? t('home.status.groep')
        : kleuter
          ? t('home.status.kleuter')
          : t('home.status.begin')
      : statusVoor(soort, vandaag?.plan.vragen ?? 0, klaarVandaag);

  // Het welkomstvlak (Kleurblokken, ADR-238): het merkvlak van de pagina, met
  // Denker die zwaait over de rand. De vormen zijn versiering, staan stil en
  // dragen geen tekst.
  const kop = (
    <div className="tk-etalage tk-welkom">
      <span className="tk-welkom-vorm tk-welkom-cirkel" aria-hidden="true" />
      <span className="tk-welkom-vorm tk-welkom-zon" aria-hidden="true" />
      <span className="tk-welkom-vorm tk-welkom-room" aria-hidden="true" />
      <span className="tk-welkom-vorm tk-welkom-room-twee" aria-hidden="true" />
      <div className="tk-welkom-tekst">
        <h1 className="tk-welkom-kop">
          {naamloos ? t('home.welcomeZonderNaam') : t('home.welcome', { naam })}
        </h1>
        <p className="tk-welkom-tekstregel">{status}</p>
      </div>
      <span className="tk-welkom-denker">
        <Brandmark size={136} uitdrukking="zwaaien" />
      </span>
    </div>
  );

  // Elk blok met een vaste sleutel: als de rondes gelezen zijn en de pagina
  // van volgorde wisselt, verhuist React de blokken in plaats van ze opnieuw
  // te bouwen, zodat een rij zijn focus en zijn scrollstand houdt.
  const blok = (sleutel: string, inhoud: ReactNode) => <Fragment key={sleutel}>{inhoud}</Fragment>;

  if (!gelezenAlles) return <div className="tk-home">{[blok('kop', kop)]}</div>;

  if (nieuw) {
    // Waar dit kind mee begint: de vijf onderwerpen van zijn groep, één per
    // vak, en het kiest zelf waarmee (ADR-243). Groep 1 en 2 hebben nog geen
    // onderwerpen, en krijgen hier te horen dat die eraan komen (ADR-244).
    const beginnen = vraagGroep ? (
      <GroepVraag gekozen={groep === undefined && !weetNiet ? null : groep} onKies={kiesGroep} />
    ) : kleuter ? (
      <VoorKleuters />
    ) : (
      <Starters groep={groep} premium={actief} onBegin={onBegin} />
    );
    // Onder de kaarten en niet erboven, want eerst kiest het waarmee het begint.
    const andere = vraagGroep ? null : (
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="tk-button tk-button-tertiary"
          onClick={() => setAndereGroep(true)}
        >
          {groep === undefined ? t('home.begin.kiesGroep') : t('home.begin.andereGroep')}
        </button>
      </div>
    );

    return (
      <div className="tk-home">
        {[
          blok('kop', kop),
          blok('beginnen', beginnen),
          blok('andere', andere),
          // Aan een bureau de vakken en hoe het werkt; op een telefoon en een
          // tablet niet: daar staat de tab Oefenen voor de vakken (ADR-251).
          blok(
            'vakken',
            <AlleenAanEenBureau>
              <VakkenRaster onVak={onVak} />
              <ZoWerktHet />
            </AlleenAanEenBureau>,
          ),
          // Zonder naam de twee uitwegen van het oude naamscherm: voor een
          // ouder en voor een kind met een inlogcode (ADR-229). De inlogcode
          // staat nergens anders.
          blok('gast', naamloos ? <VoorWieNieuwIs onVoorOuders={onVoorOuders} /> : null),
        ]}
      </div>
    );
  }

  const verder = verderOefenen(open ?? [], gespeeld, alles, nuSet);

  return (
    <div className="tk-home">
      {[
        blok('kop', kop),
        blok('nu', nuDoen),
        // Na de eerste ronde, één keer: hoe heet je? Onder Nu doen en niet
        // erboven, en weg te klikken (ADR-229, ADR-250).
        blok('naam', naamloos ? <NaamUitnodiging /> : null),
        blok('klaar', klaarVandaag && soort !== 'herhalen' ? <KlaarVoorVandaag /> : null),
        blok(
          'verder',
          verder.length === 0 ? null : (
            <VerderOefenen
              kaarten={verder}
              premium={actief}
              onBegin={onBegin}
              onVerder={onVerder}
            />
          ),
        ),
        blok(
          'passend',
          <PastBijGroep gespeeld={gespeeld} groep={groep} premium={actief} onBegin={onBegin} />,
        ),
        blok(
          'herhaal',
          !actief && vandaag !== null && vandaag.plan.vragen > 0 ? (
            <HerhaalRegel vragen={vandaag.plan.vragen} />
          ) : null,
        ),
        blok(
          'vakken',
          <AlleenAanEenBureau>
            <VakkenRaster onVak={onVak} />
          </AlleenAanEenBureau>,
        ),
        blok('gast', naamloos ? <VoorWieNieuwIs onVoorOuders={onVoorOuders} /> : null),
      ]}
    </div>
  );
}

/**
 * Wat alleen aan een bureau staat, vanaf 1200 (ADR-251). Op een telefoon en een
 * tablet duwden de vakken en "Zo werkt leer.nu" alles een scherm omlaag; daar
 * zijn de vakken één tik weg onder Oefenen. `contents`, zodat de blokken in de
 * kolom van Vandaag hun gewone afstand houden.
 */
function AlleenAanEenBureau({ children }: { readonly children: ReactNode }) {
  return <div className="hidden desk:contents">{children}</div>;
}

/** De zin onder de begroeting voor wie al geoefend heeft, bij zijn Nu doen. */
function statusVoor(soort: NuDoenSoort | null, vragen: number, klaar: boolean): string {
  switch (soort) {
    case 'terug':
      return t('home.status.terug');
    // Met premium staan de vragen echt klaar: er is een knop (ADR-238).
    case 'herhalen':
      return vragen === 1 ? t('home.welkomKlaarEen') : t('home.welkomKlaar', { aantal: vragen });
    case 'maakAf':
      return t('home.status.maakAf');
    case 'check':
    case 'verder':
      return klaar ? t('home.status.klaar') : t('home.status.verder');
    default:
      return t('home.todayOpen');
  }
}

/** "Nog 11 van de 12 vragen": wat er van een ronde over is. */
function restVan(ronde: OpenRound): string {
  return ronde.rest.length === 1
    ? t('home.openRestOne', { totaal: ronde.totaal })
    : t('home.openRest', { aantal: ronde.rest.length, totaal: ronde.totaal });
}

/**
 * Eén kaart in een rij op Vandaag (ADR-250): de plaat links, het onderwerp, de
 * spelvorm, en waar dat zo is de stand eronder. Dezelfde kaart in Verder
 * oefenen, Hier begin je mee en Past bij groep.
 */
function OefenKaart({
  deel,
  vorm,
  half,
  uitslag,
  onClick,
}: {
  readonly deel: Onderdeel;
  readonly vorm: string;
  /** Een ronde die half af is: een balk en hoeveel er nog over is. */
  readonly half?: OpenRound | undefined;
  /** De uitslag van de laatste ronde, met premium (ADR-192). */
  readonly uitslag?: string | null | undefined;
  readonly onClick: () => void;
}) {
  const ModuleIcon = MODULE_ICON[deel.moduleId];
  const rest = half === undefined ? null : restVan(half);

  return (
    <button
      type="button"
      data-module={deel.moduleId}
      className="tk-kaart tk-maakaf"
      onClick={onClick}
    >
      <span className="tk-plaat tk-plaat-groot">
        <ModuleIcon size={24} />
      </span>
      <span className="tk-kaart-titel">{naamVan(deel)}</span>
      <span className="tk-kaart-regel">{vorm}</span>
      {half === undefined || rest === null ? null : (
        // The bar is decorative: the words under it say the same, and the
        // whole card is one button whose name is read once.
        <span aria-hidden="true">
          <ProgressBar value={half.beantwoord / half.totaal} showDot={false} label={rest} />
        </span>
      )}
      {rest !== null ? <span className="tk-kaart-voet">{rest}</span> : null}
      {uitslag ? <span className="tk-kaart-voet">{uitslag}</span> : null}
    </button>
  );
}

/**
 * Verder oefenen (ADR-250): wat half af is vooraan, daarna wat gespeeld is,
 * elk onderwerp één keer.
 *
 * Een ronde die half af is, gaat verder met precies de vragen die nog niet
 * gesteld zijn (ADR-115). Een gespeeld onderwerp begint opnieuw op dezelfde
 * manier, en draagt met premium de uitslag van de laatste ronde: een cijfer
 * alleen bij een toets (ADR-235), anders een telling.
 */
function VerderOefenen({
  kaarten,
  premium,
  onBegin,
  onVerder,
}: {
  readonly kaarten: readonly VerderKaart[];
  /** Zonder premium geen uitslag, en een premiummanier wordt een gratis manier (ADR-192). */
  readonly premium: boolean;
  readonly onBegin: (deel: Onderdeel, mode: ModeId) => void;
  readonly onVerder: (deel: Onderdeel, mode: ModeId, rest: readonly string[]) => void;
}) {
  return (
    <ScrollRij titel={t('home.verderTitel')}>
      {kaarten.map((kaart) => {
        const { deel } = kaart;
        if (kaart.soort === 'half') {
          const vorm = vrijeVorm(deel, kaart.ronde.mode, premium);
          return (
            <OefenKaart
              key={deel.setId}
              deel={deel}
              vorm={t(`mode.${vorm}` as TranslationKey)}
              half={kaart.ronde}
              onClick={() => onVerder(deel, vorm, kaart.ronde.rest)}
            />
          );
        }
        const { ronde } = kaart.gespeeld;
        const vorm = vrijeVorm(deel, ronde.mode, premium);
        return (
          <OefenKaart
            key={deel.setId}
            deel={deel}
            vorm={t(`mode.${vorm}` as TranslationKey)}
            uitslag={premium ? uitslagVan(kaart.gespeeld) : null}
            onClick={() => onBegin(deel, vorm)}
          />
        );
      })}
    </ScrollRij>
  );
}

/**
 * De uitslag van een ronde. Over wat beantwoord is en niet over wat gevraagd
 * was: een ronde mag eerder stoppen, en vragen die niemand zag zijn niet fout.
 */
function uitslagVan({ ronde }: Gespeeld): string {
  const uit = { goed: ronde.correct, totaal: ronde.answered };
  // Een cijfer alleen bij een toets (ADR-235): een oefenronde, met hulp
  // onderweg, krijgt geen oordeel maar een telling.
  const cijfer = ronde.toets === true ? grade(ronde.correct, ronde.answered) : null;
  return cijfer === null
    ? t('home.recentOutOf', uit)
    : t('home.recentLine', { cijfer: formatGrade(cijfer), ...uit });
}

/**
 * Waar een nieuw kind mee begint: de vijf onderwerpen van zijn groep, één per
 * vak (ADR-243). Geen getal eronder: een kind dat nog niets deed, heeft geen
 * stand (ADR-131).
 */
function Starters({
  groep,
  premium,
  onBegin,
}: {
  /** Waarmee een nieuw kind begint, hangt af van zijn groep (ADR-151). */
  readonly groep: Groep | undefined;
  readonly premium: boolean;
  readonly onBegin: (deel: Onderdeel, mode: ModeId) => void;
}) {
  const lijst = starters(groep);
  if (lijst.length === 0) return null;

  return (
    <ScrollRij
      titel={groep === undefined ? t('home.popularStart') : t('home.popularStartGroep', { groep })}
    >
      {lijst.map(({ deel, mode }) => {
        const vorm = vrijeVorm(deel, mode, premium);
        return (
          <OefenKaart
            key={`${deel.setId}-${mode}`}
            deel={deel}
            vorm={t(`mode.${vorm}` as TranslationKey)}
            onClick={() => onBegin(deel, vorm)}
          />
        );
      })}
    </ScrollRij>
  );
}

/**
 * "Past bij groep 6": per vak de set van de groep die dit kind nog niet deed
 * (ADR-206). Zonder groep, of als alles gedaan is, staat de rij er niet.
 */
function PastBijGroep({
  gespeeld,
  groep,
  premium,
  onBegin,
}: {
  readonly gespeeld: readonly Gespeeld[];
  readonly groep: Groep | undefined;
  readonly premium: boolean;
  readonly onBegin: (deel: Onderdeel, mode: ModeId) => void;
}) {
  if (groep === undefined || gespeeld.length === 0) return null;
  const lijst = voorGroep(groep, new Set(gespeeld.map(({ deel }) => deel.setId)));
  if (lijst.length === 0) return null;

  return (
    <ScrollRij titel={t('home.pastBijGroep', { groep })}>
      {lijst.map(({ deel, mode }) => {
        const vorm = vrijeVorm(deel, mode, premium);
        return (
          <OefenKaart
            key={deel.setId}
            deel={deel}
            vorm={t(`mode.${vorm}` as TranslationKey)}
            onClick={() => onBegin(deel, vorm)}
          />
        );
      })}
    </ScrollRij>
  );
}
