import { OverOnderwerp } from './OverOnderwerp';
import { brengInBeeld, naarBoven, stapInBeeld } from '@/features/shell/naarBoven';
import { leesRustig } from '@/features/player/settings';
import { pathFor, routeFor } from '@/features/shell/routes';
import { seoPaginaVoor } from '@/seo/paginas';
import { overOnderwerp } from '@/seo/over';
import { heeftWerkblad } from '@/features/werkblad/werkblad';
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Button } from '@/components/Button';
import { ChevronDownIcon, CorrectIcon, GoIcon, PaperIcon, WrongIcon } from '@/components/Icon';
import {
  aanDeBeurt,
  countMastered,
  isDiplomaVorm,
  vlagDiplomaDeelVan,
  vlagDiplomaSet,
  opGroep,
  roundPreview,
  vooruitblik,
  type Groep,
  type Indeling,
  type ItemState,
  type ModeId,
} from '@/game-core';
import { t, type TranslationKey } from '@/i18n';
import { loadItemStates } from '@/store/progress';
import { groepVanActiefKind } from '@/store/children';
import { MODULE_ICON } from '@/features/shell/moduleIcons';
import type { Module } from '@/features/shell/modules';

import { Setdiplomas } from '@/features/badges/Setdiplomas';
import { doelwitVan } from '@/features/home/doel';
import { Tafeldiplomas } from './Tafeldiplomas';
import { TopoDiplomas } from './TopoDiplomas';
import { VlagDiplomas } from '@/features/vlaggen/VlagDiplomas';
import { KlokDiplomas } from '@/features/klok/KlokDiplomas';
import { vraagOuders } from '@/features/premium/ouderVraag';
import { usePremium } from '@/features/premium/usePremium';
import {
  fouteItems,
  isMixOnderwerp,
  itemsVan,
  MIN_FOUTEN,
  naamVan,
  naamVanSet,
  onderwerpenVan,
  onderwerpVan,
  type Onderdeel,
  type Onderwerp,
} from './onderdelen';
import { eersteRegio, regioLabel, regioVraag, regiosVan } from './regios';
import { indelingVanOnderwerp } from './groepen';
import { onderwerpIcon, regioIcon } from './tegelIcons';
import {
  formsFor,
  minutesFor,
  offeredForms,
  questionChoices,
  questionCount,
  startLabel,
  teDrukOmAanTeWijzen,
  toetsVormVan,
  type PracticeForm,
} from './forms';
import { isPremiumOnderwerp, isPremiumVorm, metPremium } from './premium';
import { useSmallScreen } from '@/features/shell/useSmallScreen';
import {
  Blad,
  LaterStappen,
  MeerRij,
  OpenStap,
  OverBeeld,
  PremiumLegenda,
  PremiumSter,
  StandRing,
  StappenGekozen,
  StapVoortgang,
  type StapAntwoord,
  type StapKop,
} from './KiesStappen';
import { balkStand, openStap, segmenten, type OpenWens, type StapId } from './stappen';

/**
 * A module's own page — leer.nu/topografie, leer.nu/rekenen, leer.nu/klokkijken
 * — and the one flow on it.
 *
 * A column under "Wat wil je oefenen?": first **what about**, then **how**, then
 * a start bar that carries the answers. The same column for every module, and
 * what differs between two modules is data — the list of regions, of subjects,
 * of ways — which is not a reason for a second screen.
 *
 * Redrawn in 2026-09 (ADR-095), with the same questions in the same order. What
 * changed is how each is answered:
 *
 * **A word is a chip, a subject is a tile, a number is a square.** Where on the
 * map, which kind of sum, which range and how many questions are rows of chips:
 * short words, several to a line. A subject and a way of practising are tiles —
 * a plate and a title, two columns from 1200 — because they are what the page
 * is about and a tile a hand's width across is hit first time. The tables and
 * the divisions are a keypad of twelve squares (ADR-100). In each of them the
 * answer already given wears the module's colour (ADR-089).
 *
 * **Topography asks where before it asks what** (ADR-083), and rekenen's first
 * question is which kind of sum — so there the subjects are chips, and the
 * second question is the keypad. Klokkijken has no where and one set per
 * subject, so it asks two things. The steps are numbered by the page.
 *
 * **Nothing is answered for the child** (ADR-111). The page used to open with
 * the first subject, its first set and the first way already pressed, so the
 * start bar was full before a question had been answered. Now only the map has
 * a default — Nederland, or the world on the flags page — and an address that
 * names a set answers the questions it names. Everything else waits for a
 * press.
 *
 * **The start bar is the answers, together.** Each choice as a small chip —
 * the map, the subject, which one, the way, how long — and the Start button at
 * the end of the line. Until every numbered step has an answer the bar is there
 * but empty: it says which steps still wait, and Start is off. What a screen
 * reader hears from the button is still the whole sentence (ADR-066). On a
 * phone it is a bar stuck to the foot of the screen, the last thing in the
 * page, which ADR-052 put off and ADR-095 builds.
 *
 * **A set has an address.** leer.nu/topografie/provincies opens on it — on the
 * tile and on the region above it.
 *
 * **Taal asks which part first, in the same row** (ADR-118): "Welk deel?" is
 * the region row with Spelling and Werkwoorden in it, and the ways follow the
 * part rather than the set.
 *
 * **Op een telefoon een accordeon** (ADR-252). Dezelfde vragen in dezelfde
 * volgorde, maar er staat er één open: wat gekozen is, staat samen bovenaan in
 * één kaart met "Wijzig", wat nog komt eronder als gestippelde rij, en na elke
 * keuze opent de eerste stap die nog leeg is (`stappen.ts`). Er is niets
 * voorgekozen, ook de kaart niet. Twee vormen om te kiezen, chips en tegels in
 * twee kolommen; de diploma's en "Over" staan achter een rij, in een blad dat
 * van onderen opkomt. Onderaan een balk met de stap waar je bent, en als
 * alles gekozen is het startblok. Vanaf 768 blijft alles zoals het was.
 */
export function ModuleScreen({
  module,
  setId,
  regio: adresRegio = null,
  onSet,
  onWerkblad,
  onOefenen,
  onStart,
}: {
  readonly module: Module;
  /** Which set the address names, or null for the module's own way in. */
  readonly setId: string | null;
  /** Which region or part the address names without a set: /werkwoorden. */
  readonly regio?: string | null;
  /** Puts a set in the address, or takes it out with null. */
  readonly onSet: (setId: string | null) => void;
  /** Opent het werkblad om te printen van dit onderwerp (ADR-211). */
  readonly onWerkblad?: (setId: string) => void;
  /** Terug naar Oefenen, op een telefoon boven de kop (ADR-241). */
  readonly onOefenen?: () => void;
  readonly onStart: (
    deel: Onderdeel,
    mode: ModeId,
    aantal: number | null,
    toetsstand: boolean,
    /** Alleen deze onderdelen, voor "Je fouten" (ADR-168). Null is de hele set. */
    alleen: readonly string[] | null,
  ) => void;
}) {
  const [states, setStates] = useState<Map<string, ItemState> | null>(null);
  const [groep, setGroep] = useState<Groep | undefined>(undefined);
  const [formId, setFormId] = useState<ModeId | null>(null);
  /** Where on the map, for the module that has a where. Null follows the set. */
  const [regio, setRegio] = useState<string | null>(null);
  /**
   * A subject pressed whose set is a second question still to answer — the
   * tables before the table. Every set that has been chosen is in the address.
   */
  const [vakId, setVakId] = useState<string | null>(null);
  /** How long the child wants the round, or null for the round's own length. */
  const [aantal, setAantal] = useState<number | null>(null);
  /** Whether the round should keep its answers until the end (ADR-085). */
  const [toetsstand, setToetsstand] = useState(false);
  /** Of de ronde alleen vraagt wat dit kind fout had (ADR-168). */
  const [foutenstand, setFoutenstand] = useState(false);
  const kleinScherm = useSmallScreen();
  const nogId = useId();
  // Op een telefoon (ADR-252): welke stap het kind zelf opende, of 'auto' voor
  // de eerste zonder antwoord; welk blad openstaat; en hoeveel diploma's de
  // wand in dat blad heeft, voor de rij die ernaar wijst.
  const [openWens, setOpenWens] = useState<OpenWens>('auto');
  const [scrollVraag, setScrollVraag] = useState(0);
  const [blad, setBlad] = useState<'diplomas' | 'over' | null>(null);
  const [diplomaStand, setDiplomaStand] = useState<{
    readonly behaald: number;
    readonly totaal: number;
  } | null>(null);
  const zetDiplomaStand = useCallback(
    (behaald: number, totaal: number) =>
      setDiplomaStand((nu) =>
        nu !== null && nu.behaald === behaald && nu.totaal === totaal ? nu : { behaald, totaal },
      ),
    [],
  );
  const openRef = useRef<HTMLElement>(null);
  const stappenRef = useRef<HTMLDivElement>(null);
  // Wat een premiumtegel zonder code doet: hij vraagt het even aan de ouders in
  // plaats van gekozen en bij de start geweigerd te worden (ADR-116, ADR-163).
  const { actief } = usePremium();

  useEffect(() => {
    void loadItemStates().then(setStates);
    void groepVanActiefKind().then(setGroep);
  }, []);

  const known = states ?? new Map<string, ItemState>();
  const now = new Date();

  const alleOnderwerpen = onderwerpenVan(module.id);
  const alleSets = alleOnderwerpen.flatMap((vak) => vak.sets);

  // Only the address chooses a set. One that names a set nobody has heard of
  // opens the module rather than an error, with nothing chosen: the child asked
  // for topography and got topography.
  const adresSet = setId === null ? null : (alleSets.find((deel) => deel.setId === setId) ?? null);
  const adresVak = adresSet ? onderwerpVan(alleOnderwerpen, adresSet.setId) : null;

  // The region follows the address unless the child has said otherwise, so
  // leer.nu/topografie/provincies opens on Nederland without the address
  // having to carry the word. With neither, the module's own (`eersteRegio`).
  const regios = regiosVan(module.id);
  const uitAdres = regios.find((kandidaat) => kandidaat.id === adresRegio)?.id ?? null;
  const hier = regio ?? adresVak?.regio ?? uitAdres ?? eersteRegio(module.id, regios);
  // Welke klok, voor de diploma's van die klok (ADR-257).
  const klokDeel = hier === 'digitaal' ? 'digitaal' : 'analoog';
  const opKaart =
    regios.length === 0 ? alleOnderwerpen : alleOnderwerpen.filter((vak) => vak.regio === hier);
  // Wat bij de groep past eerst, dan wat herhaling is, dan wat voor later is
  // (ADR-151). Alles blijft op de pagina en alles blijft te kiezen; zonder
  // groep is dit de volgorde van altijd. Welke tafel of welk bereik eronder
  // staat, blijft in zijn eigen volgorde: een toetsenbord van twaalf tafels
  // op groep gesorteerd is geen toetsenbord meer.
  // En de mix altijd achteraan (ADR-168). Een mix is elk ander onderwerp van
  // deze rij nog een keer, dus is hij nooit waar je begint — op elk vak. Na
  // `opGroep`, want anders zet de groep hem er weer tussen: een mix hoort bij
  // geen enkele groep in het bijzonder en zou dan als "neutraal" boven de stof
  // van volgend jaar uitkomen.
  const onderwerpen = mixAchteraan(opGroep(opKaart, (vak) => indelingVanOnderwerp(vak, groep)));

  // The subject is the address's, or the one pressed while its set is still to
  // choose — and only while it is on the map the page shows. A set in Europe is
  // not chosen on a page that has moved to Afrika.
  const gekozenVak =
    adresVak ?? alleOnderwerpen.find((vak) => vak.id === vakId && vraagtWelke(vak)) ?? null;
  const onderwerp = gekozenVak !== null && onderwerpen.includes(gekozenVak) ? gekozenVak : null;
  const chosen = onderwerp !== null ? adresSet : null;

  // De pagina voor Google op dit adres (ADR-207), of die van het vak als het
  // adres een mix of jouw fouten noemt: daar komen de links vandaan. De kop is
  // altijd die van het vak (ADR-247).
  const vakPagina = seoPaginaVoor(pathFor({ name: 'module', module, setId: null }));
  const pagina =
    seoPaginaVoor(pathFor({ name: 'module', module, setId: adresSet?.setId ?? null })) ?? vakPagina;

  // Een link onder "Meer topografie" blijft in de app, en begint bovenaan de
  // pagina: anders stond je na de klik nog onderaan, bij de vragen van ouders.
  const volg = (pad: string) => {
    const doel = routeFor(pad);
    if (doel.name === 'werkblad') onWerkblad?.(doel.setId);
    else if (doel.name === 'module') onSet(doel.setId);
    else return;
    naarBoven();
  };

  // Wat een kind wilde toen het op een slot drukte (ADR-193): het venster zegt
  // het terug, en de ouderpagina onthoudt het.
  const wilDit = (wat: string) => vraagOuders({ wat, soort: 'wil' });
  const metSet = (vorm: string) =>
    chosen !== null ? t('wens.vorm', { vorm, naam: naamVan(chosen) }) : vorm;
  const wilDiploma = (setId: string) => wilDit(t('wens.diploma', { naam: naamVanSet(setId) }));

  /** How many steps this page has, so the numbers are the page's own. */
  const heeftRegio = regios.length >= 2;
  const heeftKeuze = onderwerp !== null && vraagtWelke(onderwerp);
  const regioStap = heeftRegio ? 1 : 0;
  const watStap = regioStap + 1;
  const keuzeStap = heeftKeuze ? watStap + 1 : 0;
  // Elke keuze springt naar het volgende onderdeel: zonder die sprong moest
  // een kind op een telefoon zelf naar beneden zoeken (ADR-233, sinds ADR-242
  // voor elk onderdeel en niet alleen het eerste). Regio → onderwerp →
  // welke → spelvorm → hoeveel vragen → de startbalk.
  const watSectie = useRef<HTMLElement>(null);
  const keuzeSectie = useRef<HTMLElement>(null);
  const hoeSectie = useRef<HTMLElement>(null);
  const aantalSectie = useRef<HTMLElement>(null);
  const startSectie = useRef<HTMLDivElement>(null);
  // Na de render: dan staat wat bij de keuze hoort er al. De eerste die er
  // staat: "Hoeveel vragen?" is er niet bij elke spelvorm, en de startbalk
  // staat op een telefoon al vast onderaan en hoeft dan niet.
  // Niet meer bovenaan, maar net in beeld (ADR-247): wat je net koos, blijft
  // zo lang mogelijk te zien. Zie `brengInBeeld`.
  const springNaar = (...secties: { readonly current: HTMLElement | null }[]) =>
    requestAnimationFrame(() => {
      const doel = secties.map((sectie) => sectie.current).find((el) => el !== null);
      if (doel) brengInBeeld(doel, leesRustig());
    });

  // Na een keuze op een telefoon: de stap die nu open moet, is de eerste
  // zonder antwoord, en die komt in beeld (ADR-252). Vanaf 768 de sprong naar
  // het volgende onderdeel, zoals altijd.
  const naKeuze = () => {
    setOpenWens('auto');
    setScrollVraag((n) => n + 1);
  };
  const verder = (...secties: { readonly current: HTMLElement | null }[]) => {
    if (kleinScherm) naKeuze();
    else springNaar(...secties);
  };
  const openOpTelefoon = (id: StapId) => {
    setOpenWens(id);
    setScrollVraag((n) => n + 1);
  };

  const stap = {
    regio: regioStap,
    wat: watStap,
    keuze: keuzeStap,
    hoe: (keuzeStap === 0 ? watStap : keuzeStap) + 1,
  };

  // A map of a hundred and sixty-seven countries is not something a child can
  // point at, and on a phone neither is a map of forty-six. Where that is true
  // the way in becomes multiple choice (ADR-087). Pointing is still on the
  // page, at the end of the row.
  const krap = teDrukOmAanTeWijzen(chosen?.setId ?? null, chosen?.items.length ?? 0, kleinScherm);
  // On Taal the ways are the part's, before a subject is chosen (ADR-118).
  const aangeboden = offeredForms(formsFor(module.id, hier), chosen?.setId ?? null, krap);
  // Before there is a set, a way that is only offered for some sets is not
  // offered yet: a tafeldiploma drawn before the table is a tile that can
  // vanish from under a finger the moment the child picks the Keersommen.
  //
  // Behalve het diploma (ADR-247). Zonder onderwerp stond het er niet, en dus
  // zag een nieuwe bezoeker alleen op /topografie/provincies dat er een toets
  // is: daar noemt het adres het onderwerp al. Nu staat het er op elk vak,
  // als het vak er een heeft: het diploma dat bij de meeste onderwerpen op
  // deze pagina hoort. Kies je daarna een onderwerp, dan wordt het het diploma
  // van dat onderwerp; heeft dat er geen (een mix), dan wacht de stap weer.
  const setsHier = onderwerpen.flatMap((vak) => vak.sets.map((deel) => deel.setId));
  const bijHoeveel = (kandidaat: PracticeForm) =>
    setsHier.filter((id) => kandidaat.geldtVoor?.(id) ?? true).length;
  const diplomaHier =
    aangeboden
      .filter((kandidaat) => isDiplomaVorm(kandidaat.id) && bijHoeveel(kandidaat) > 0)
      .sort((een, ander) => bijHoeveel(ander) - bijHoeveel(een))[0] ?? null;
  const forms = chosen
    ? aangeboden
    : aangeboden.filter((kandidaat) => !kandidaat.geldtVoor || kandidaat === diplomaHier);
  // The ways that are tiles. A way only the oefentoets asks in is reached by
  // pressing the oefentoets, and never offered beside it (ADR-102). Het
  // diploma staat apart, want het staat als laatste en het staat groter
  // (ADR-168).
  const tegels = forms.filter((candidate) => !candidate.alleenToets);
  // Eerst wat gratis is, dan wat premium is, elk in de volgorde van `forms.ts`:
  // wie zonder code binnenkomt, ziet bovenaan wat hij meteen kan doen.
  const gewoneTegels = tegels
    .filter((candidate) => !isDiplomaVorm(candidate.id))
    .sort((a, b) => Number(isPremiumVorm(a.id)) - Number(isPremiumVorm(b.id)));
  const eigenDiploma = tegels.find((candidate) => isDiplomaVorm(candidate.id)) ?? null;
  // Elk onderwerp een diploma (ADR-247). Bekende vlaggen en vlaggen die op
  // elkaar lijken hebben er geen eigen, want dat zou een diploma voor de
  // makkelijke helft zijn. Daar staat het diploma van het hele werelddeel, en
  // een druk erop kiest dat werelddeel. Alleen een mix heeft er geen: die is
  // de andere onderwerpen door elkaar, en die hebben elk hun eigen diploma.
  const vlagDeel =
    module.id === 'vlaggen' && chosen !== null && eigenDiploma === null
      ? vlagDiplomaDeelVan(chosen.setId)
      : null;
  const diplomaVorm =
    eigenDiploma ??
    (vlagDeel === null
      ? null
      : (formsFor('vlaggen').find((candidate) => candidate.id === 'vlag-diploma') ?? null));
  const diplomaReden =
    vlagDeel === null || diplomaVorm === null
      ? diplomaVorm === null
        ? ''
        : t(diplomaVorm.reason)
      : t('way.vlag-diploma-deel', {
          deel: t(
            vlagDeel === 'wereld' ? 'vlag.heleWereld' : (`regio.${vlagDeel}` as TranslationKey),
          ),
        });
  // No way until one is pressed (ADR-111).
  // Een diploma dat vóór het onderwerp gekozen is, is het diploma van het
  // onderwerp dat daarna komt (ADR-247).
  const gekozenManier =
    tegels.find((candidate) => candidate.id === formId) ??
    (formId !== null && isDiplomaVorm(formId)
      ? (tegels.find((candidate) => isDiplomaVorm(candidate.id)) ?? null)
      : null);
  // The oefentoets is a way of its own (ADR-100). It answers the way a test
  // asks, by typing, and hears back only at the end — so pressing it chooses
  // the way as well, and pressing any other way leaves it.
  const toetsVorm = toetsVormVan(module.id, forms, hier);
  const alsToets = toetsstand && toetsVorm !== null;
  const form = alsToets ? toetsVorm : gekozenManier;

  const ModuleIcon = MODULE_ICON[module.id];

  /**
   * De sets waarvan de wand onderaan het diploma toont (ADR-168).
   *
   * Rekenen: de bereiken van de gekozen soort som — niet de tafels, die hebben
   * hun eigen wand van twaalf. Taal: alles van het deel dat gekozen is, want
   * daar is het deel wat de soort som bij rekenen is.
   */
  const setdiplomas =
    module.id === 'woorden'
      ? alleOnderwerpen
          .filter((vak) => vak.regio === hier)
          .flatMap((vak) => vak.sets)
          .filter((deel) => doelwitVan(deel)?.mode === 'taal-diploma')
      : module.id === 'tafels' && onderwerp !== null && onderwerp.id !== 'tafels'
        ? onderwerp.sets.filter((deel) => doelwitVan(deel)?.mode === 'reken-diploma')
        : [];

  // "Je fouten": de onderdelen van de gekozen set die dit kind wel eens fout
  // had (ADR-168). Het is een spelvorm en geen onderwerp — wát je oefent is in
  // stap 2 al gezegd, en dit zegt hoe: alleen de stukken die niet zaten.
  const fouteIds = chosen === null ? [] : fouteItems(chosen, known);
  const kanFouten = fouteIds.length >= MIN_FOUTEN;
  const alsFouten = foutenstand && kanFouten;

  const heleSet = chosen?.items.length ?? 0;
  // Met "Je fouten" is de set zo groot als de foutenlijst: de schatting naast
  // Start en de rij "Hoeveel vragen?" horen over de ronde te gaan die volgt.
  const setSize = alsFouten ? fouteIds.length : heleSet;
  const lengtes = form === null ? [] : questionChoices(form, setSize);
  // A length that no longer fits — twenty-five questions of the table of seven,
  // after the child moved from the Rekenmix to a table — falls back to the
  // round's own rather than quietly asking for something impossible.
  const gekozen = aantal !== null && lengtes.includes(aantal) ? aantal : null;
  const vragen = form === null ? null : questionCount(form, setSize, gekozen);
  const minuten = form === null ? null : minutesFor(form, vragen);
  const zin =
    chosen === null || form === null
      ? ''
      : alsToets
        ? t('choose.startTest', { wat: startLabel(form, naamVan(chosen), setSize, gekozen) })
        : startLabel(form, naamVan(chosen), setSize, gekozen);

  // The numbered steps still without an answer, in the page's own numbers.
  // "Hoeveel vragen?" is never among them: it opens on the round's own length,
  // pressed, which is an answer.
  // Met hun vraag en hun plek op de pagina: de startbalk noemt ze, en een
  // druk erop brengt je erheen (ADR-247).
  const wachtend: readonly Wachtend[] = [
    ...(onderwerp === null
      ? [{ nummer: stap.wat, vraag: t('choose.stepWhat'), sectie: watSectie }]
      : []),
    ...(heeftKeuze && chosen === null && onderwerp.keuze !== null
      ? [{ nummer: stap.keuze, vraag: t(onderwerp.keuze), sectie: keuzeSectie }]
      : []),
    ...(form === null ? [{ nummer: stap.hoe, vraag: t('choose.stepHow'), sectie: hoeSectie }] : []),
  ];
  const nogZin = nogTeKiezen(wachtend.map(({ nummer }) => nummer));
  const klaar = chosen !== null && form !== null;

  // What the start bar lists: one chip per question the page asked, in the
  // order it asked them, and how long the round will be.
  const regioNaam = heeftRegio ? regios.find((kandidaat) => kandidaat.id === hier) : undefined;
  const ronde = rondeVan(form, vragen, minuten);
  /**
   * Hoeveel van de vragen dit kind eerder gehad heeft (ADR-140).
   *
   * `roundPreview` stond er al, getest en ongebruikt, met in zijn eigen
   * commentaar de zin waarvoor het bestaat. Die zin is het argument van dit
   * product voor zijn eigen methode, uitgesproken op het moment dat die methode
   * op een fout lijkt: waarom krijg ik vragen die ik al weet?
   *
   * Alleen als het er zijn. "Nul eerder gehad" legt niets uit en neemt niets
   * weg — er valt dan ook niets te verbazen.
   */
  const vooraf =
    klaar && chosen !== null && vragen !== null && form?.rule?.kind === 'fixed'
      ? roundPreview({
          // Met "Je fouten" gaat de ronde over die onderdelen, dus gaat deze
          // zin daar ook over: "3 van de 3 eerder gehad" is bij een foutenlijst
          // geen verrassing maar de definitie.
          items: alsFouten
            ? chosen.items.filter((item) => fouteIds.includes(item.id))
            : chosen.items,
          states: known,
          size: vragen,
          now: new Date(),
        })
      : null;
  // Hoeveel je eerder had, is voortgang: alleen met premium (ADR-192).
  const eerderZin =
    actief && vooraf !== null && vooraf.seen > 0
      ? t('start.eerderGehad', { eerder: vooraf.seen, totaal: vooraf.total })
      : null;

  const gekozenLijst: readonly { readonly label: string; readonly waarde: string }[] = [
    ...(regioNaam ? [{ label: t(regioLabel(module.id)), waarde: t(regioNaam.naam) }] : []),
    ...(onderwerp
      ? [
          {
            label: t(module.id === 'tafels' ? 'start.som' : 'start.onderwerp'),
            waarde: t(onderwerp.naam),
          },
        ]
      : []),
    ...(heeftKeuze && chosen
      ? [{ label: t('start.welke'), waarde: chosen.kortNaam ?? naamVan(chosen) }]
      : []),
    ...(form ? [{ label: t('start.manier'), waarde: t(form.name) }] : []),
    ...(ronde ? [{ label: t('start.ronde'), waarde: ronde }] : []),
    ...(alsToets ? [{ label: t('start.stand'), waarde: t('choose.testMode') }] : []),
    ...(alsFouten ? [{ label: t('start.stand'), waarde: t('choose.fouten') }] : []),
  ];

  /** A set chosen from outside its own subject's row: the map follows the set. */
  const kiesElders = (id: string) => {
    setRegio(null);
    setVakId(null);
    onSet(id);
  };

  // ---- De stappen op een telefoon (ADR-252) ----------------------------------
  // Op een telefoon (ADR-252) is de kaart pas gekozen als het kind erop drukte,
  // of als het adres hem noemt. Vanaf 768 heeft hij een standaard (ADR-111).
  const regioGekozen = regio !== null || adresVak !== null || uitAdres !== null;
  // Elke vraag van de pagina met zijn antwoord, of null zolang er geen is. De
  // stap "Hoeveel vragen?" heeft er altijd een: de lengte van de ronde zelf.
  const vormWaarde =
    form === null
      ? null
      : alsToets
        ? t('choose.testMode')
        : alsFouten
          ? `${t(form.name)} · ${t('choose.fouten')}`
          : t(form.name);
  const telefoonStappen: readonly (StapKop & {
    readonly label: string;
    readonly waarde: string | null;
  })[] = [
    ...(heeftRegio
      ? [
          {
            id: 'regio' as const,
            vraag: t(regioVraag(module.id)),
            label: t(regioLabel(module.id)),
            waarde: regioGekozen && regioNaam ? t(regioNaam.naam) : null,
          },
        ]
      : []),
    {
      id: 'wat' as const,
      vraag: t('choose.stepWhat'),
      label: t(module.id === 'tafels' ? 'start.som' : 'start.onderwerp'),
      waarde: onderwerp ? t(onderwerp.naam) : null,
    },
    ...(heeftKeuze && onderwerp.keuze !== null
      ? [
          {
            id: 'keuze' as const,
            vraag: t(onderwerp.keuze),
            label: t('start.welke'),
            waarde: chosen ? (chosen.kortNaam ?? naamVan(chosen)) : null,
          },
        ]
      : []),
    {
      id: 'hoe' as const,
      vraag: t('choose.stepHow'),
      label: t('start.manier'),
      waarde: vormWaarde,
    },
    ...(chosen && form && lengtes.length > 0
      ? [
          {
            id: 'aantal' as const,
            vraag: t('choose.howMany'),
            label: t('start.ronde'),
            waarde: ronde ?? '',
          },
        ]
      : []),
  ].map((kandidaat, plek) => ({ ...kandidaat, nummer: plek + 1 }));
  const standen = telefoonStappen.map(({ id, waarde }) => ({ id, gekozen: waarde !== null }));
  const openId = openStap(standen, openWens);
  const balk = balkStand(standen, openId);

  // De open stap in beeld, na een keuze of een druk op een stap: alleen als hij
  // niet al bovenin staat. Na de laatste keuze is alles dicht, en dan de
  // stappen zelf.
  useEffect(() => {
    if (scrollVraag === 0) return;
    const doel = openRef.current ?? stappenRef.current;
    if (doel) stapInBeeld(doel, leesRustig());
  }, [scrollVraag]);

  const vakKop = vakPagina?.kop ?? t('choose.titleZonderNaam');
  const setdiplomaTitel = t(
    module.id === 'woorden' ? 'taal.diplomasTitle' : 'rekenen.somdiplomasTitle',
  );
  // Onder 1200 is er geen zijbalk: de weg terug naar de vakken staat boven de
  // kop (ADR-241).
  const terugKnop = onOefenen ? (
    <button
      type="button"
      className="tk-terugknop desk:hidden"
      aria-label={t('module.terugOefenen')}
      onClick={onOefenen}
    >
      <ChevronDownIcon size={20} />
      {t('nav.oefenen')}
    </button>
  ) : null;

  // Off, not absent, until every step has an answer: a button that appeared
  // only at the end would be a button a child had to go looking for. What is
  // still missing is said beside it, and a screen reader hears that too.
  const startKnopVan = (vorm?: string) => (
    <Button
      className={vorm === undefined ? 'tk-button-go' : `tk-button-go ${vorm}`}
      disabled={!klaar}
      aria-label={klaar ? t('choose.goLabel', { wat: zin }) : undefined}
      aria-describedby={klaar ? undefined : nogId}
      onClick={() => {
        if (chosen && form)
          onStart(chosen, form.id, gekozen, alsToets, alsFouten ? fouteIds : null);
      }}
    >
      {t('choose.go')}
      <GoIcon size={24} />
    </Button>
  );
  const startKnop = startKnopVan();

  const vink = (
    <span className="tk-tegel-vink">
      <CorrectIcon size={24} />
    </span>
  );

  // Een premiumtegel: een ster in plaats van het woord, en niets voor wie
  // premium al heeft (ADR-252, op elke maat sinds ADR-255).
  const premiumTeken = (premium: boolean) => {
    if (!premium || actief) return null;
    return <PremiumSter />;
  };
  // De korte regel onder een tegel.
  const tegelRegel = (regel: string | null) =>
    regel === null || regel === '' ? null : (
      <span className="tk-tegel-regel" aria-hidden="true">
        {regel}
      </span>
    );

  // ---- What each step asks, as chips or tiles --------------------------------
  // Eén keer gebouwd en op twee plekken gezet: vanaf 768 als sectie onder
  // elkaar, op een telefoon in de stap die openstaat (ADR-252).

  const regioKnoppen = (
    <div className="tk-keuzes">
      {regios.map((kandidaat) => {
        const RegioIcon = regioIcon(kandidaat.id);

        return (
          <button
            key={kandidaat.id}
            type="button"
            className="tk-keuze"
            aria-pressed={
              kandidaat.built ? kandidaat.id === hier && (regioGekozen || !kleinScherm) : undefined
            }
            disabled={!kandidaat.built}
            data-soon={kandidaat.built ? undefined : 'ja'}
            onClick={() => {
              // Een andere kaart wist op een telefoon het onderwerp en wat
              // eronder gekozen was (ADR-252); dezelfde kaart nog eens niet.
              if (kleinScherm && kandidaat.id !== hier) {
                setVakId(null);
                if (setId !== null) onSet(null);
              }
              setRegio(kandidaat.id);
              // A set on another map is not chosen on this one, and
              // the address should stop saying it is.
              if (adresVak && adresVak.regio !== kandidaat.id) onSet(null);
              verder(watSectie);
            }}
          >
            <RegioIcon size={20} />
            {t(kandidaat.naam)}
            {/* A region the plan has and the product does not says so
                on its own face rather than opening onto nothing. */}
            {kandidaat.built ? null : (
              <span className="tk-label tk-keuze-soon">{t('regio.soon')}</span>
            )}
          </button>
        );
      })}
    </div>
  );

  const onderwerpTegels = (
    <div className="tk-tegels">
      {onderwerpen.map((vak) => {
        const open = vak.id === onderwerp?.id;
        const VakIcon = onderwerpIcon(vak.id);
        const premium = isPremiumOnderwerp(vak.id);
        const buitenGroep = groepLabel(indelingVanOnderwerp(vak, groep));

        return (
          <button
            key={vak.id}
            type="button"
            className="tk-tegel"
            // How the subject is going is not on the face of it; it is in
            // its name, and in the child's own column (ADR-089).
            aria-label={metPremium(
              [t(vak.naam), buitenGroep, actief ? vorderingVan(vak, known, now) : null]
                .filter((deel) => deel !== null)
                .join('. '),
              premium,
              actief,
            )}
            aria-pressed={open}
            // A subject with one set chooses it. One whose sets are a
            // second question opens that question and chooses nothing
            // yet: the table of one is not what a child who pressed
            // "Tafels" asked for (ADR-111). Pressed again while open it
            // does nothing, so a chosen table of seven stays chosen.
            onClick={() => {
              if (open) {
                // Op een telefoon sluit hij wel de stap: het antwoord staat.
                if (kleinScherm) naKeuze();
                return;
              }
              if (premium && !actief) {
                wilDit(t(vak.naam));
                return;
              }
              setRegio(hier);
              if (vraagtWelke(vak)) {
                setVakId(vak.id);
                if (setId !== null) onSet(null);
              } else {
                setVakId(null);
                onSet(vak.sets[0]?.setId ?? '');
              }
              verder(vraagtWelke(vak) ? keuzeSectie : hoeSectie);
            }}
          >
            <span className="tk-plaat">
              <VakIcon size={24} />
            </span>
            <span className="min-w-0">
              {t(vak.naam)}
              {tegelRegel(buitenGroep ?? (vak.uitleg === null ? null : t(vak.uitleg)))}
            </span>
            {premiumTeken(premium)}
            {open ? vink : null}
          </button>
        );
      })}
    </div>
  );

  // Ook het toetsenbord van tafels is een rij chips: twee vormen om te kiezen,
  // en niet drie (ADR-252, op elke maat sinds ADR-255).
  const keuzeKnoppen =
    onderwerp === null ? null : (
      <div className="tk-keuzes">
        {onderwerp.sets.map((deel) => (
          <button
            key={deel.setId}
            type="button"
            className="tk-keuze"
            aria-label={naamVan(deel)}
            aria-pressed={deel.setId === chosen?.setId}
            onClick={() => {
              onSet(deel.setId);
              verder(hoeSectie);
            }}
          >
            <span aria-hidden="true">{deel.kortNaam ?? naamVan(deel)}</span>
          </button>
        ))}
      </div>
    );

  // Het diploma, altijd als laatste en altijd uitgelicht (ADR-168): de laatste
  // tegel in het raster, over de volle breedte (ADR-252, op elke maat sinds
  // ADR-255).
  const diplomaTegel = diplomaVorm ? (
    <button
      type="button"
      className="tk-tegel tk-tegel-diploma"
      aria-label={metPremium(
        `${t(diplomaVorm.name)}. ${diplomaReden}`,
        isPremiumVorm(diplomaVorm.id),
        actief,
      )}
      aria-pressed={!alsToets && diplomaVorm.id === form?.id}
      onClick={() => {
        if (isPremiumVorm(diplomaVorm.id) && !actief) {
          wilDit(
            chosen !== null ? t('wens.diploma', { naam: naamVan(chosen) }) : t(diplomaVorm.name),
          );
          return;
        }
        setToetsstand(false);
        setFoutenstand(false);
        if (vlagDeel !== null) kiesElders(vlagDiplomaSet(vlagDeel));
        setFormId(diplomaVorm.id);
        verder(aantalSectie, startSectie);
      }}
    >
      <span className="tk-plaat">
        <diplomaVorm.icon size={24} />
      </span>
      <span className="min-w-0">
        {t(diplomaVorm.name)}
        <span className="tk-tegel-regel" aria-hidden="true">
          {diplomaReden}
        </span>
      </span>
      {premiumTeken(isPremiumVorm(diplomaVorm.id))}
      {!alsToets && diplomaVorm.id === form?.id ? vink : null}
    </button>
  ) : null;

  const vormTegels = (
    <div className="tk-tegels">
      {gewoneTegels.map((candidate) => {
        const FormIcon = candidate.icon;
        const gekozenVorm = !alsToets && candidate.id === form?.id;
        const premium = isPremiumVorm(candidate.id);

        return (
          <button
            key={candidate.id}
            type="button"
            className="tk-tegel"
            aria-label={metPremium(`${t(candidate.name)}. ${t(candidate.reason)}`, premium, actief)}
            aria-pressed={gekozenVorm}
            onClick={() => {
              if (premium && !actief) {
                wilDit(metSet(t(candidate.name)));
                return;
              }
              setFormId(candidate.id);
              setToetsstand(false);
              verder(aantalSectie, startSectie);
            }}
          >
            <span className="tk-plaat">
              <FormIcon size={24} />
            </span>
            <span className="min-w-0">
              {t(candidate.name)}
              {tegelRegel(kortVan(t(candidate.reason)))}
            </span>
            {premiumTeken(premium)}
            {gekozenVorm ? vink : null}
          </button>
        );
      })}

      {/* "Je fouten": een stand op de manier die gekozen is, zoals de
          oefentoets er een is (ADR-168). Het was een onderwerp — een
          tegel tussen Provincies en Steden — en dat is het niet: waar de
          ronde over gaat, staat in stap 2, en dit zegt welk deel ervan
          gevraagd wordt. Alleen als er iets in zit (`MIN_FOUTEN`), want
          een knop die "0 fouten" oefent, oefent niets.

          Gratis sinds ADR-231, ook hier (ADR-232): je fouten herhalen
          hoort bij oefenen. Alleen het aantal blijft bij premium, want
          dat is een telling over rondes heen (ADR-192). */}
      {kanFouten ? (
        <button
          type="button"
          className="tk-tegel"
          // Zonder code geen aantal: hoeveel je fout had is een telling over
          // rondes heen, en dat is voortgang (ADR-192).
          aria-label={
            actief
              ? `${t('choose.fouten')}. ${t('choose.foutenWhy', { aantal: fouteIds.length })}`
              : t('choose.fouten')
          }
          aria-pressed={alsFouten}
          onClick={() => {
            // Een diploma over de helft van een set is geen diploma, en
            // een oefentoets over je eigen fouten is geen toets: allebei
            // gaan ze uit zodra dit aangaat.
            setToetsstand(false);
            if (form !== null && isDiplomaVorm(form.id)) setFormId(null);
            setFoutenstand(!alsFouten);
            if (kleinScherm) naKeuze();
          }}
        >
          <span className="tk-plaat">
            <WrongIcon size={24} />
          </span>
          <span className="min-w-0">
            {t('choose.fouten')}
            {actief ? tegelRegel(t('choose.foutenWhy', { aantal: fouteIds.length })) : null}
          </span>
          {alsFouten ? vink : null}
        </button>
      ) : null}

      {/* The oefentoets, one of the ways: pressing it un-presses the
          others, because it chooses how you answer too. It used to be a
          switch on whichever way was chosen (ADR-085), which asked a
          child to pick a way a test never asks for (ADR-100). */}
      {toetsVorm ? (
        <button
          type="button"
          className="tk-tegel"
          // "Je typt zonder hulp" is what the toets is everywhere a test
          // types; where it asks in a way of its own, that way says it.
          aria-label={metPremium(
            `${t('choose.testMode')}. ${t(toetsVorm.alleenToets ? toetsVorm.reason : 'choose.testModeWhy')}`,
            true,
            actief,
          )}
          aria-pressed={alsToets}
          onClick={() => {
            if (!actief) {
              wilDit(
                chosen !== null
                  ? t('wens.oefentoets', { naam: naamVan(chosen) })
                  : t('choose.testMode'),
              );
              return;
            }
            setFoutenstand(false);
            setToetsstand(true);
            verder(aantalSectie, startSectie);
          }}
        >
          <span className="tk-plaat">
            <PaperIcon size={24} />
          </span>
          <span className="min-w-0">
            {t('choose.testMode')}
            {tegelRegel(
              kortVan(t(toetsVorm.alleenToets ? toetsVorm.reason : 'choose.testModeWhy')),
            )}
          </span>
          {premiumTeken(true)}
          {alsToets ? vink : null}
        </button>
      ) : null}

      {diplomaTegel}
    </div>
  );

  const aantalKnoppen = (
    <div className="tk-keuzes">
      {lengtes.map((count) => {
        const heel = count === setSize;
        const label = heel ? 'choose.howManyAllLabel' : 'choose.howManyOne';

        return (
          <button
            key={count}
            type="button"
            className="tk-keuze"
            aria-label={t(label, { aantal: count })}
            aria-pressed={count === vragen}
            onClick={() => {
              setAantal(count);
              verder(startSectie);
            }}
          >
            <span aria-hidden="true">
              {heel ? t('choose.howManyAll', { aantal: count }) : count}
            </span>
          </button>
        );
      })}
    </div>
  );

  // ---- The diploma walls ----------------------------------------------------
  // Een diploma kiezen sluit op een telefoon het blad, en de stappen gaan
  // verder waar nog iets leeg is.
  const naDiploma = () => {
    if (!kleinScherm) return;
    setBlad(null);
    naKeuze();
  };
  const kiesTafelDiploma = (tafel: string) => {
    // Een diploma halen is premium (ADR-192): zonder code eerst de
    // vraag aan de ouders, net als de diplomategel zelf.
    if (!actief) {
      setBlad(null);
      wilDiploma(tafel);
      return;
    }
    kiesElders(tafel);
    setFormId('tafeldiploma');
    setToetsstand(false);
    naDiploma();
  };
  const kiesVlagDiploma = (deel: Parameters<typeof vlagDiplomaSet>[0]) => {
    if (!actief) {
      setBlad(null);
      wilDiploma(vlagDiplomaSet(deel));
      return;
    }
    kiesElders(vlagDiplomaSet(deel));
    setFormId('vlag-diploma');
    setToetsstand(false);
    naDiploma();
  };
  const kiesKlokDiploma = (stap: string) => {
    if (!actief) {
      setBlad(null);
      wilDiploma(stap);
      return;
    }
    kiesElders(stap);
    setFormId('klok-diploma');
    setToetsstand(false);
    naDiploma();
  };
  const kiesTopoDiploma = (kaart: string) => {
    if (!actief) {
      setBlad(null);
      wilDiploma(kaart);
      return;
    }
    kiesElders(kaart);
    setFormId('topo-diploma');
    setToetsstand(false);
    naDiploma();
  };
  const kiesSetDiploma = (setId: string) => {
    if (!actief) {
      setBlad(null);
      wilDiploma(setId);
      return;
    }
    kiesElders(setId);
    setFormId(module.id === 'woorden' ? 'taal-diploma' : 'reken-diploma');
    setToetsstand(false);
    setFoutenstand(false);
    naDiploma();
  };

  // Wat erin zit en de vragen van een ouder (ADR-213), voor een onderwerp dat
  // er een pagina voor heeft.
  const overDeel =
    chosen !== null && !chosen.mix && !/(^|-)fouten$/.test(chosen.setId) ? chosen : null;
  const overOnder =
    overDeel === null ? null : (
      <OverOnderwerp
        deel={overDeel}
        links={pagina?.links ?? []}
        linksKop={pagina?.linksKop ?? ''}
        onVolg={(pad) => {
          setBlad(null);
          volg(pad);
        }}
      />
    );
  const werkbladKnop =
    onWerkblad && chosen !== null && heeftWerkblad(chosen) ? (
      <button
        type="button"
        className="tk-button tk-button-tertiary self-start"
        onClick={() => {
          setBlad(null);
          onWerkblad(chosen.setId);
        }}
      >
        {t('werkblad.knop')}
      </button>
    ) : null;
  const terugRegel =
    actief && chosen !== null && states !== null ? (
      <p className="tk-hulp">{terugZin(chosen.items, states, now)}</p>
    ) : null;

  // De ster op een premiumtegel heeft één legenda onder het raster, niet voor
  // wie premium heeft (ADR-252).
  const premiumWat = onderwerpen.some((vak) => isPremiumOnderwerp(vak.id));
  const premiumHoe =
    toetsVorm !== null ||
    gewoneTegels.some((vorm) => isPremiumVorm(vorm.id)) ||
    (diplomaVorm !== null && isPremiumVorm(diplomaVorm.id));
  const legendaWat = !actief && premiumWat ? <PremiumLegenda /> : null;
  const legendaHoe = !actief && premiumHoe ? <PremiumLegenda /> : null;

  if (kleinScherm) {
    return mobiel();
  }

  // Vanaf 768 dezelfde kop, chips en tegels als op een telefoon (ADR-255), met
  // de stappen onder elkaar in plaats van een accordeon.
  return (
    <div className="tk-page tk-kiespagina" data-module={module.id}>
      {/* What is chosen here wears the module's colour (ADR-112). The child's
          own column beside it does not: it is about the child, not the module. */}
      <div className="tk-page-main" data-accent="module">
        <div className="tk-vakkop">
          {/* Onder 1200 is er geen zijbalk: de weg terug naar de vakken staat
            boven de kop (ADR-241). */}
          {terugKnop}
          {/* De kop als witte kaart, met de plaat van het vak, zoals op een
              telefoon (ADR-252, op elke maat sinds ADR-255). Het was een vlak
              in de diepe kleur van het vak (ADR-238). Het vak en wat je hier
              doet: "Topografie oefenen", ook als er een onderwerp gekozen is
              (ADR-247). */}
          <div className="tk-vakkaart">
            <span className="tk-plaat tk-plaat-groot" aria-hidden="true">
              <ModuleIcon size={24} />
            </span>
            <h1 className="tk-vakkaart-kop">{vakKop}</h1>
          </div>
        </div>

        {/* Where on the map, or which part of Taal, and only where there is
            more than one answer. */}
        {heeftRegio ? (
          <section className="tk-kies" aria-label={t(regioVraag(module.id))}>
            <Stap nummer={stap.regio} label={t(regioVraag(module.id))} />
            {regioKnoppen}
          </section>
        ) : null}

        <section ref={watSectie} className="tk-kies" aria-label={t('choose.stepWhat')}>
          <Stap nummer={stap.wat} label={t('choose.stepWhat')} />

          {/* Tegels, op elk vak (ADR-168). Rekenen tekende zijn onderwerpen als
              chips en de andere vier als tegels, en dat maakte dezelfde vraag —
              "wat wil je oefenen?" — op twee pagina's twee verschillende
              dingen: een rij woorden om te lezen, of een raster om aan te
              wijzen. Een kind dat op /topografie geleerd heeft waar het antwoord
              op stap 2 staat, vindt het op /rekenen op dezelfde plek terug. */}
          {onderwerpTegels}
          {legendaWat}
        </section>

        {/* The second, smaller decision, where there is one — numbered like the
            others, because on rekenen it is the press that decides what the
            round contains. The tables and the divisions are a keypad of twelve;
            a range, a level or which cities are chips. The keypad has no mix
            square: the Rekenmix is one step up already (ADR-100). */}
        {onderwerp && heeftKeuze && onderwerp.keuze ? (
          <section ref={keuzeSectie} className="tk-kies" aria-label={t(onderwerp.keuze)}>
            <Stap nummer={stap.keuze} label={t(onderwerp.keuze)} />
            {keuzeKnoppen}
          </section>
        ) : null}

        <section ref={hoeSectie} className="tk-kies" aria-label={t('choose.stepHow')}>
          {/* The order of the ways is the argument, and the tile is the name.
              What each is for is in its label, so tabbing through them never
              costs a child the thing that tells them apart (ADR-061).

              Eén volgorde op elk vak (ADR-168): eerst de manieren die leren —
              zoeken, kiezen, typen, ontdekken — dan de twee die druk zetten op
              wat er al zit, dan de twee standen op wat je al koos (je fouten,
              de oefentoets), en als laatste het diploma. Dat is niet de
              volgorde van `forms.ts` maar die van deze sectie: het diploma
              stond daar al achteraan en werd hier alsnog door de oefentoets
              ingehaald. */}
          <Stap nummer={stap.hoe} label={t('choose.stepHow')} />

          {vormTegels}
          {legendaHoe}
        </section>

        {/* How long, as a step of its own — and only after a way that has a
            length: pointing, choosing, typing. A minute, three lives and
            exploring have none, and a diploma is the whole table, so for those
            the step is not there rather than empty (ADR-100, amending ADR-074). */}
        {chosen && form && lengtes.length > 0 ? (
          <section ref={aantalSectie} className="tk-kies" aria-label={t('choose.howMany')}>
            <Stap nummer={stap.hoe + 1} label={t('choose.howMany')} />
            {aantalKnoppen}
          </section>
        ) : null}

        {/* From a tablet up, the answers together and the way on, closing the
            chooser. Always drawn; filled once every step has an answer. */}
        <div ref={startSectie} className="tk-startbalk tk-choose-start">
          <div className="min-w-0">
            <p className="tk-startbalk-label">{t(klaar ? 'start.klaar' : 'start.nogKiezen')}</p>
            {klaar ? (
              <ul className="tk-startbalk-keuzes">
                {gekozenLijst.map(({ label, waarde }) => (
                  <li key={label} className="tk-startchip">
                    <span className="tk-startchip-label">{label}</span>
                    {waarde}
                  </li>
                ))}
              </ul>
            ) : (
              <>
                <p id={nogId} className="tk-sr-only">
                  {nogZin}
                </p>
                <NogKiezen wachtend={wachtend} kort={false} onNaar={springNaar} />
              </>
            )}
            {eerderZin ? <p className="tk-hulp">{eerderZin}</p> : null}
          </div>
          {startKnop}
        </div>

        {/* Eén zin: wat hier vandaag terugkomt. Dat is de voorwaarde voor het
            diploma — alleen wat terugkomt kan onthouden raken. */}
        {terugRegel}

        {/* Hetzelfde onderwerp op papier (ADR-211): voor thuis, of voor de klas. */}
        {werkbladKnop}

        {/* Twelve diplomas, under the tables and nowhere else (ADR-075). Pressing
            a gap answers both steps at once: that table, and the diploma. */}
        {onderwerp?.id === 'tafels' ? <Tafeldiplomas onKies={kiesTafelDiploma} /> : null}

        {/* Six vlaggendiploma's on the flags page (ADR-104). Pressing one answers
            every step at once: that werelddeel, all its flags, the diploma. */}
        {module.id === 'vlaggen' ? <VlagDiplomas onKies={kiesVlagDiploma} /> : null}

        {/* Four klokdiploma's on the clock's page, and eleven topodiploma's on
            topography's (ADR-117). Pressing one answers every step at once:
            that step or that map, and the diploma. */}
        {module.id === 'klok' ? <KlokDiplomas onKies={kiesKlokDiploma} deel={klokDeel} /> : null}

        {module.id === 'topo' ? <TopoDiplomas onKies={kiesTopoDiploma} /> : null}

        {/* En de twee vakken die er geen hadden (ADR-168): de soorten som
            buiten de tafels, en Taal. Dezelfde wand, met de namen uit de sets
            zelf — "Plussommen tot 20", "Tegenwoordige tijd".

            Ze volgen wat er gekozen is en niet de hele module, zoals de
            tafelwand dat ook doet: eenendertig rekendiploma's onder elkaar is
            geen wand maar een catalogus. Wie Plussommen kiest, ziet de drie
            bereiken van plussommen. */}
        {setdiplomas.length > 0 ? (
          <Setdiplomas
            moduleId={module.id}
            titel={setdiplomaTitel}
            sets={setdiplomas}
            onKies={kiesSetDiploma}
          />
        ) : null}

        {/* Wat erin zit en de vragen van een ouder (ADR-213): ook wat Google
            leest, nadat de app de pagina heeft overgenomen. */}
        {overOnder}
      </div>
    </div>
  );

  /**
   * De vakpagina op een telefoon (ADR-252): de kop als witte kaart, de stappen
   * als accordeon, de diploma's en "Over" als twee rijen naar een blad, en
   * onderaan de balk.
   */
  function mobiel() {
    const inhoud: Record<StapId, ReactNode> = {
      regio: regioKnoppen,
      wat: (
        <>
          {onderwerpTegels}
          {legendaWat}
        </>
      ),
      keuze: keuzeKnoppen,
      hoe: (
        <>
          {vormTegels}
          {legendaHoe}
        </>
      ),
      aantal: aantalKnoppen,
    };
    const open = telefoonStappen.find((kandidaat) => kandidaat.id === openId) ?? null;
    const gekozenStappen = telefoonStappen.filter(
      (kandidaat): kandidaat is StapAntwoord =>
        kandidaat.waarde !== null && kandidaat.id !== openId,
    );
    const laterStappen = telefoonStappen.filter(
      (kandidaat) => kandidaat.waarde === null && kandidaat.id !== openId,
    );

    // De wand van dit vak, in het blad. Eén per pagina: de tafels hebben de
    // hunne alleen als Tafels gekozen is, anders die van de soort som.
    const muur =
      onderwerp?.id === 'tafels'
        ? {
            titel: t('rekenen.diplomasTitle'),
            wand: <Tafeldiplomas onKies={kiesTafelDiploma} onStand={zetDiplomaStand} />,
          }
        : module.id === 'vlaggen'
          ? {
              titel: t('vlag.diplomasTitle'),
              wand: <VlagDiplomas onKies={kiesVlagDiploma} onStand={zetDiplomaStand} />,
            }
          : module.id === 'klok'
            ? {
                titel: t('klok.diplomasTitle'),
                wand: (
                  <KlokDiplomas
                    onKies={kiesKlokDiploma}
                    onStand={zetDiplomaStand}
                    deel={klokDeel}
                  />
                ),
              }
            : module.id === 'topo'
              ? {
                  titel: t('topo.diplomasTitle'),
                  wand: <TopoDiplomas onKies={kiesTopoDiploma} onStand={zetDiplomaStand} />,
                }
              : setdiplomas.length > 0
                ? {
                    titel: setdiplomaTitel,
                    wand: (
                      <Setdiplomas
                        moduleId={module.id}
                        titel={setdiplomaTitel}
                        sets={setdiplomas}
                        onKies={kiesSetDiploma}
                        onStand={zetDiplomaStand}
                      />
                    ),
                  }
                : null;
    const overKop = overDeel === null ? null : overOnderwerp(overDeel).kop;

    return (
      <div className="tk-page tk-kiespagina" data-module={module.id}>
        <div className="tk-page-main" data-accent="module">
          <div className="tk-vakkop">
            {terugKnop}
            {/* De kop als witte kaart, met de plaat van het vak: geen vlak in
                de kleur van het vak, want die is op deze pagina voor wat je
                koos (ADR-252). */}
            <div className="tk-vakkaart">
              <span className="tk-plaat tk-plaat-groot" aria-hidden="true">
                <ModuleIcon size={24} />
              </span>
              <h1 className="tk-vakkaart-kop">{vakKop}</h1>
            </div>
          </div>

          <div ref={stappenRef} className="tk-stappen">
            <StappenGekozen stappen={gekozenStappen} onWijzig={openOpTelefoon} />
            {open === null ? null : (
              <OpenStap stap={open} stapRef={openRef}>
                {inhoud[open.id]}
              </OpenStap>
            )}
            <LaterStappen stappen={laterStappen} onOpen={openOpTelefoon} />
          </div>

          {muur !== null || overDeel !== null ? (
            <ul className="tk-oefenlijst-rijen">
              {muur === null ? null : (
                <li>
                  <MeerRij
                    moduleId={module.id}
                    titel={muur.titel}
                    regel={
                      diplomaStand === null
                        ? ''
                        : t('kies.diplomasStand', {
                            aantal: diplomaStand.behaald,
                            totaal: diplomaStand.totaal,
                          })
                    }
                    beeld={
                      <StandRing
                        deel={
                          diplomaStand === null || diplomaStand.totaal === 0
                            ? 0
                            : diplomaStand.behaald / diplomaStand.totaal
                        }
                      />
                    }
                    onClick={() => setBlad('diplomas')}
                  />
                </li>
              )}
              {overKop === null ? null : (
                <li>
                  <MeerRij
                    moduleId={module.id}
                    titel={overKop}
                    regel={t(
                      werkbladKnop === null ? 'kies.overRegelZonderWerkblad' : 'kies.overRegel',
                    )}
                    beeld={<OverBeeld />}
                    onClick={() => setBlad('over')}
                  />
                </li>
              )}
            </ul>
          ) : null}
        </div>

        {muur === null ? null : (
          <Blad open={blad === 'diplomas'} titel={muur.titel} onSluit={() => setBlad(null)}>
            {muur.wand}
          </Blad>
        )}
        {/* Ook dicht in de pagina: wat een ouder hier leest, leest Google ook. */}
        {overKop === null ? null : (
          <Blad open={blad === 'over'} titel={overKop} onSluit={() => setBlad(null)}>
            {terugRegel}
            {werkbladKnop}
            {overOnder}
          </Blad>
        )}

        {/* Onderaan, boven het menu: de stap waar je bent, of de weg verder.
            Sticky en het laatste in de pagina, zoals ADR-095 hem bouwde: hij
            ligt nooit over zijn eigen knop, en onderaan de pagina nooit over
            de stap die openstaat. */}
        <div className="tk-startbalk-mobiel tk-choose-start" data-accent="module" data-stand={balk}>
          {balk === 'kiezen' ? (
            <>
              <StapVoortgang segmenten={segmenten(standen, openId)} />
              <span id={nogId} className="tk-sr-only">
                {nogZin}
              </span>
            </>
          ) : balk === 'allesGekozen' ? (
            <>
              <p className="tk-stapvoortgang-tekst">{t('kies.allesGekozen')}</p>
              {startKnopVan('tk-button-go-klein')}
            </>
          ) : (
            <>
              <p className="tk-startblok-label">{t('start.klaar')}</p>
              <p className="tk-startblok-zin">{zin}</p>
              {minuten === null ? null : (
                <p className="tk-startblok-duur">
                  {minuten === 1 ? t('choose.minuteOne') : t('choose.minutes', { aantal: minuten })}
                </p>
              )}
              {eerderZin ? <p className="tk-startblok-duur">{eerderZin}</p> : null}
              {startKnop}
            </>
          )}
        </div>
      </div>
    );
  }
}

/** Een stap die nog wacht: zijn nummer, zijn vraag en waar hij staat. */
interface Wachtend {
  readonly nummer: number;
  readonly vraag: string;
  readonly sectie: { readonly current: HTMLElement | null };
}

/**
 * De stappen die nog wachten, in de startbalk (ADR-247).
 *
 * Er stond "Kies nog bij stap 2 en 3", in grijze letters: een zin die je moest
 * lezen, en dan zelf de stap zoeken. Nu is elke stap die wacht een knop met
 * zijn munt en zijn vraag, en een druk brengt je erheen. Op een telefoon is
 * er geen plek voor de vraag: dan alleen de munt, met de vraag als naam.
 */
function NogKiezen({
  wachtend,
  kort,
  onNaar,
}: {
  readonly wachtend: readonly Wachtend[];
  readonly kort: boolean;
  readonly onNaar: (sectie: Wachtend['sectie']) => void;
}) {
  return (
    <ul className="tk-nogkiezen">
      {wachtend.map(({ nummer, vraag, sectie }) => (
        <li key={nummer}>
          <button
            type="button"
            className="tk-nogstap"
            aria-label={t('start.naarStap', { stap: nummer, vraag })}
            onClick={() => onNaar(sectie)}
          >
            <span className="tk-stap-nummer" aria-hidden="true">
              {nummer}
            </span>
            {kort ? null : <span aria-hidden="true">{vraag}</span>}
          </button>
        </li>
      ))}
    </ul>
  );
}

/**
 * Het woord onder een tegel die niet bij de groep past (ADR-151), of niets.
 *
 * Nog één woord sinds ADR-162, en dat is "Voor later". **"Nog eens herhalen"
 * is eruit.** Het stond onder elk onderwerp dat onder de groep van dit kind
 * valt — voor een kind in groep 7 onder de halve tafelrij — en het is het
 * enige bijschrift op deze pagina dat een kind vertelt hoe het over zijn eigen
 * keuze hoort te denken. De tegel stond toch al onderaan, en dát is wat de
 * volgorde hier moet zeggen; het woord erbij maakte er een oordeel van.
 *
 * "Voor later" blijft staan, want dat zegt iets wat de volgorde niet zegt: dit
 * is stof die je nog niet gehad hebt. Dat is een waarschuwing en geen oordeel.
 */
function groepLabel(indeling: Indeling): string | null {
  return indeling === 'later' ? t('groep.later') : null;
}

/**
 * De mix achteraan, de rest in de volgorde waarin hij binnenkwam (ADR-168).
 *
 * Stabiel, dus binnen elke helft verandert er niets: wat `opGroep` net gezet
 * heeft, blijft staan. Op elke module dezelfde regel — de Rekenmix, de Topomix,
 * de Klokmix, de Spellingmix en de Werkwoordmix staan alle vijf achteraan om
 * dezelfde reden, en die stond hiervoor nergens opgeschreven: ze waren het
 * toevallig, doordat ze toevallig onderaan hun lijst stonden.
 */
function mixAchteraan(vakken: readonly Onderwerp[]): Onderwerp[] {
  return [
    ...vakken.filter((vak) => !isMixOnderwerp(vak)),
    ...vakken.filter((vak) => isMixOnderwerp(vak)),
  ];
}

/** A subject whose sets are a second question: the tables before the table. */
function vraagtWelke(vak: Onderwerp): boolean {
  return vak.keuze !== null && vak.sets.length > 1;
}

/** "Kies nog bij stap 2 en 3": what the start bar says while it waits. */
function nogTeKiezen(stappen: readonly number[]): string {
  const laatste = stappen.at(-1);
  if (laatste === undefined) return '';
  if (stappen.length === 1) return t('start.kiesNogStap', { stap: laatste });
  return t('start.kiesNogStappen', { stappen: stappen.slice(0, -1).join(', '), laatste });
}

/**
 * How long the round will be, in the words the start bar uses: a number of
 * questions and roughly how many minutes, a number of seconds, a number of
 * lives, or no questions at all for exploring. Null where there is no way yet.
 */
function rondeVan(
  form: PracticeForm | null,
  vragen: number | null,
  minuten: number | null,
): string | null {
  if (form === null) return null;
  const rule = form.rule;
  if (rule === null) return t('start.vrij');
  if (rule.kind === 'tijd') return t('start.seconden', { aantal: rule.seconden });
  if (rule.kind === 'levens') return t('start.levens', { aantal: rule.levens });
  if (vragen === null) return null;
  return minuten === null
    ? t('start.vragen', { aantal: vragen })
    : t('start.vragenTijd', { aantal: vragen, minuten });
}

/**
 * How a subject is going, in the words the tile has no room for.
 *
 * It is the tail of every subject's accessible name. The right-hand column is
 * where a child reads progress; the tiles are where they choose.
 *
 * What remembering is and nothing about the schedule: "3 vandaag op de rol"
 * went with the Onthouden page's tile of that name (ADR-114). What is due is
 * what the next round asks first, and a child does not need to be told so.
 */
function vorderingVan(vak: Onderwerp, known: ReadonlyMap<string, ItemState>, now: Date): string {
  const ids = itemsVan(vak);
  const mastered = countMastered(known, ids, now);
  const begonnen = ids.some((id) => known.get(id)?.laatsteReview != null);

  return begonnen
    ? t('home.setMastered', { goed: mastered, totaal: ids.length })
    : t('home.setNew');
}

/**
 * One of the page's numbered questions: the number as a coin in the module's
 * colour and the question in ink (ADR-239). The number is drawn here rather
 * than written into the copy, because the modules do not have the same number
 * of questions. The comma is for a screen reader, which hears "1, Waar op de
 * kaart?" where the eye sees the coin.
 */
function Stap({ nummer, label }: { readonly nummer: number; readonly label: string }) {
  return (
    <h2 className="tk-sectie tk-stapkop">
      <span className="tk-stap-nummer">{nummer}</span>
      <span className="tk-sr-only">, </span>
      {label}
    </h2>
  );
}

/**
 * Wat er van deze set vandaag terugkomt.
 *
 * De zin gaat over de voorwaarde en niet over de beloning: alleen wat terugkomt
 * kan onthouden raken, en alleen wat onthouden is telt voor het diploma. Komt er
 * vandaag niets, dan staat er wanneer wel — anders leest een kind "nul" als "je
 * hebt iets verkeerd gedaan".
 */
function terugZin(
  items: readonly { readonly id: string }[],
  states: ReadonlyMap<string, ItemState>,
  now: Date,
): string {
  const ids = items.map((item) => item.id);
  const vandaag = aanDeBeurt(ids, states, now);
  if (vandaag === 1) return t('module.terugVandaagEen');
  if (vandaag > 1) return t('module.terugVandaag', { aantal: vandaag });

  const blik = vooruitblik(ids, states, now);
  if (blik.morgenTerug > 0) return t('module.terugMorgen', { aantal: blik.morgenTerug });
  return t('module.terugNiets');
}

/**
 * Het eerste deel van een uitleg, voor onder een tegel op een telefoon: "Kies
 * uit 4 namen" van "Kies uit 4 namen — de eerste stap naar typen" (ADR-252).
 * De hele zin blijft de naam van de tegel.
 */
function kortVan(uitleg: string): string {
  const deel = uitleg.split(' — ')[0] ?? uitleg;
  // En van een uitleg in zinnen alleen de eerste: "Je typt zonder hulp."
  const zin = /^[^.]*\./.exec(deel);
  return zin === null ? deel : zin[0];
}
