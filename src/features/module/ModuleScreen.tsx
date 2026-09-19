import { useEffect, useId, useState, type ReactNode } from 'react';
import { Button } from '@/components/Button';
import { CorrectIcon, GoIcon, PaperIcon } from '@/components/Icon';
import {
  aanDeBeurt,
  countMastered,
  opGroep,
  roundPreview,
  vooruitblik,
  type Groep,
  type Indeling,
  type ItemState,
  type ModeId,
} from '@/game-core';
import { t } from '@/i18n';
import { loadItemStates } from '@/store/progress';
import { groepVanActiefKind } from '@/store/children';
import { MODULE_ICON } from '@/features/shell/moduleIcons';
import type { Module } from '@/features/shell/modules';

import { Tafeldiplomas } from './Tafeldiplomas';
import { TopoDiplomas } from './TopoDiplomas';
import { VlagDiplomas } from '@/features/vlaggen/VlagDiplomas';
import { KlokDiplomas } from '@/features/klok/KlokDiplomas';
import { vraagOuders } from '@/features/premium/ouderVraag';
import { usePremium } from '@/features/premium/usePremium';
import {
  itemsVan,
  naamVan,
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
import { PremiumLabel } from './PremiumLabel';
import { useSmallScreen } from '@/features/shell/useSmallScreen';

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
 */
export function ModuleScreen({
  module,
  naam,
  setId,
  regio: adresRegio = null,
  onSet,
  onStart,
  aside,
}: {
  readonly module: Module;
  /** Whose page this is. The heading asks them by name. */
  readonly naam: string;
  /** Which set the address names, or null for the module's own way in. */
  readonly setId: string | null;
  /** Which region or part the address names without a set: /werkwoorden. */
  readonly regio?: string | null;
  /** Puts a set in the address, or takes it out with null. */
  readonly onSet: (setId: string | null) => void;
  readonly onStart: (
    deel: Onderdeel,
    mode: ModeId,
    aantal: number | null,
    toetsstand: boolean,
  ) => void;
  /** The child's own column, the same one the front door carries. */
  readonly aside: ReactNode;
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
  const kleinScherm = useSmallScreen();
  const nogId = useId();
  // Wat een premiumtegel zonder code doet: hij vraagt het even aan de ouders in
  // plaats van gekozen en bij de start geweigerd te worden (ADR-116, ADR-163).
  const { actief } = usePremium();

  useEffect(() => {
    void loadItemStates().then(setStates);
    void groepVanActiefKind().then(setGroep);
  }, []);

  const known = states ?? new Map<string, ItemState>();
  const now = new Date();

  const alleOnderwerpen = onderwerpenVan(module.id, known);
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
  const opKaart =
    regios.length === 0 ? alleOnderwerpen : alleOnderwerpen.filter((vak) => vak.regio === hier);
  // Wat bij de groep past eerst, dan wat herhaling is, dan wat voor later is
  // (ADR-151). Alles blijft op de pagina en alles blijft te kiezen; zonder
  // groep is dit de volgorde van altijd. Welke tafel of welk bereik eronder
  // staat, blijft in zijn eigen volgorde: een toetsenbord van twaalf tafels
  // op groep gesorteerd is geen toetsenbord meer.
  const onderwerpen = opGroep(opKaart, (vak) => indelingVanOnderwerp(vak, groep));

  // The subject is the address's, or the one pressed while its set is still to
  // choose — and only while it is on the map the page shows. A set in Europe is
  // not chosen on a page that has moved to Afrika.
  const gekozenVak =
    adresVak ?? alleOnderwerpen.find((vak) => vak.id === vakId && vraagtWelke(vak)) ?? null;
  const onderwerp = gekozenVak !== null && onderwerpen.includes(gekozenVak) ? gekozenVak : null;
  const chosen = onderwerp !== null ? adresSet : null;

  /** How many steps this page has, so the numbers are the page's own. */
  const heeftRegio = regios.length >= 2;
  const heeftKeuze = onderwerp !== null && vraagtWelke(onderwerp);
  const regioStap = heeftRegio ? 1 : 0;
  const watStap = regioStap + 1;
  const keuzeStap = heeftKeuze ? watStap + 1 : 0;
  const stap = {
    regio: regioStap,
    wat: watStap,
    keuze: keuzeStap,
    hoe: (keuzeStap === 0 ? watStap : keuzeStap) + 1,
  };

  /**
   * Rekenen's subjects are kinds of sum — tafels, delen, plus, min — and the
   * handoff asks that as a row of words, with the keypad under it. The other
   * two modules' subjects are things on a map or a face, and those are tiles.
   */
  const onderwerpAlsChips = module.id === 'tafels';

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
  const forms = chosen ? aangeboden : aangeboden.filter((kandidaat) => !kandidaat.geldtVoor);
  // The ways that are tiles. A way only the oefentoets asks in is reached by
  // pressing the oefentoets, and never offered beside it (ADR-102).
  const tegels = forms.filter((candidate) => !candidate.alleenToets);
  // No way until one is pressed (ADR-111).
  const gekozenManier = tegels.find((candidate) => candidate.id === formId) ?? null;
  // The oefentoets is a way of its own (ADR-100). It answers the way a test
  // asks, by typing, and hears back only at the end — so pressing it chooses
  // the way as well, and pressing any other way leaves it.
  const toetsVorm = toetsVormVan(module.id, forms, hier);
  const alsToets = toetsstand && toetsVorm !== null;
  const form = alsToets ? toetsVorm : gekozenManier;

  const ModuleIcon = MODULE_ICON[module.id];

  const setSize = chosen?.items.length ?? 0;
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
  const wachtend = [
    ...(onderwerp === null ? [stap.wat] : []),
    ...(heeftKeuze && chosen === null ? [stap.keuze] : []),
    ...(form === null ? [stap.hoe] : []),
  ];
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
      ? roundPreview({ items: chosen.items, states: known, size: vragen, now: new Date() })
      : null;
  const eerderZin =
    vooraf !== null && vooraf.seen > 0
      ? t('start.eerderGehad', { eerder: vooraf.seen, totaal: vooraf.total })
      : null;

  const gekozenLijst: readonly { readonly label: string; readonly waarde: string }[] = [
    ...(regioNaam ? [{ label: t(regioLabel(module.id)), waarde: t(regioNaam.naam) }] : []),
    ...(onderwerp
      ? [
          {
            label: t(onderwerpAlsChips ? 'start.som' : 'start.onderwerp'),
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
  ];

  /** A set chosen from outside its own subject's row: the map follows the set. */
  const kiesElders = (id: string) => {
    setRegio(null);
    setVakId(null);
    onSet(id);
  };

  // Off, not absent, until every step has an answer: a button that appeared
  // only at the end would be a button a child had to go looking for. What is
  // still missing is said beside it, and a screen reader hears that too.
  const startKnop = (
    <Button
      className="tk-button-go"
      disabled={!klaar}
      aria-label={klaar ? t('choose.goLabel', { wat: zin }) : undefined}
      aria-describedby={klaar ? undefined : nogId}
      onClick={() => {
        if (chosen && form) onStart(chosen, form.id, gekozen, alsToets);
      }}
    >
      {t('choose.go')}
      <GoIcon size={24} />
    </Button>
  );

  const vink = (
    <span className="tk-tegel-vink">
      <CorrectIcon size={24} />
    </span>
  );

  return (
    <div className="tk-page" data-module={module.id}>
      {/* What is chosen here wears the module's colour (ADR-112). The child's
          own column beside it does not: it is about the child, not the module. */}
      <div className="tk-page-main" data-accent="module">
        <div className="flex flex-col gap-3">
          {/* Which module this is, as a badge in its own tint. On a phone and
              a tablet the rail is not drawn, and the menu above says it too;
              here it is the page saying it about itself. */}
          <p className="tk-modulebadge">
            <ModuleIcon size={16} />
            {t(module.name)}
          </p>

          {/* By name, the way the front door greets them — on every size. The
              handoff drops the name on a phone; a chooser that asks "wat wil
              je oefenen?" of nobody in particular is a form, and asked of Fem
              it is a question (ADR-095). */}
          <h1 className="tk-display tk-titel">{t('choose.title', { naam })}</h1>

          {/* Hier stond "Hier gaat je toets over", met een knop die de hele
              module als toets oefende. Het hing aan een toetsdatum, en die
              wordt sinds ADR-162 nergens meer ingevoerd. De oefentoets zelf
              staat er nog, bij de manieren, waar hij altijd stond. */}
        </div>

        {/* Where on the map, or which part of Taal, and only where there is
            more than one answer. */}
        {heeftRegio ? (
          <section className="tk-kies" aria-label={t(regioVraag(module.id))}>
            <Stap nummer={stap.regio} label={t(regioVraag(module.id))} />

            <div className="tk-keuzes">
              {regios.map((kandidaat) => {
                const RegioIcon = regioIcon(kandidaat.id);

                return (
                  <button
                    key={kandidaat.id}
                    type="button"
                    className="tk-keuze"
                    aria-pressed={kandidaat.built ? kandidaat.id === hier : undefined}
                    disabled={!kandidaat.built}
                    data-soon={kandidaat.built ? undefined : 'ja'}
                    onClick={() => {
                      setRegio(kandidaat.id);
                      // A set on another map is not chosen on this one, and
                      // the address should stop saying it is.
                      if (adresVak && adresVak.regio !== kandidaat.id) onSet(null);
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
          </section>
        ) : null}

        <section className="tk-kies" aria-label={t('choose.stepWhat')}>
          <Stap nummer={stap.wat} label={t('choose.stepWhat')} />

          <div className={onderwerpAlsChips ? 'tk-keuzes' : 'tk-tegels'}>
            {onderwerpen.map((vak) => {
              const open = vak.id === onderwerp?.id;
              const VakIcon = onderwerpIcon(vak.id);
              const premium = isPremiumOnderwerp(vak.id);
              const buitenGroep = groepLabel(indelingVanOnderwerp(vak, groep));

              return (
                <button
                  key={vak.id}
                  type="button"
                  className={onderwerpAlsChips ? 'tk-keuze' : 'tk-tegel'}
                  // How the subject is going is not on the face of it; it is in
                  // its name, and in the child's own column (ADR-089).
                  aria-label={metPremium(
                    [t(vak.naam), buitenGroep, vorderingVan(vak, known, now)]
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
                    if (open) return;
                    if (premium && !actief) {
                      vraagOuders();
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
                  }}
                >
                  {onderwerpAlsChips ? (
                    <VakIcon size={20} />
                  ) : (
                    <span className="tk-plaat">
                      <VakIcon size={24} />
                    </span>
                  )}
                  <span className="min-w-0">
                    {t(vak.naam)}
                    {buitenGroep !== null ? (
                      <span className="tk-hulp block" aria-hidden="true">
                        {buitenGroep}
                      </span>
                    ) : null}
                  </span>
                  {premium ? <PremiumLabel /> : null}
                  {!onderwerpAlsChips && open ? vink : null}
                </button>
              );
            })}
          </div>
        </section>

        {/* The second, smaller decision, where there is one — numbered like the
            others, because on rekenen it is the press that decides what the
            round contains. The tables and the divisions are a keypad of twelve;
            a range, a level or which cities are chips. The keypad has no mix
            square: the Rekenmix is one step up already (ADR-100). */}
        {onderwerp && heeftKeuze && onderwerp.keuze ? (
          <section className="tk-kies" aria-label={t(onderwerp.keuze)}>
            <Stap nummer={stap.keuze} label={t(onderwerp.keuze)} />

            {isKeypad(onderwerp) ? (
              <div className="tk-tafels">
                {onderwerp.sets.map((deel) => (
                  <button
                    key={deel.setId}
                    type="button"
                    className="tk-tafel"
                    // The full name, because "7" is not a sentence: this is the
                    // one control whose visible label is shorter than it means.
                    aria-label={naamVan(deel)}
                    aria-pressed={deel.setId === chosen?.setId}
                    onClick={() => onSet(deel.setId)}
                  >
                    <span aria-hidden="true">{deel.kortNaam ?? naamVan(deel)}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="tk-keuzes">
                {onderwerp.sets.map((deel) => (
                  <button
                    key={deel.setId}
                    type="button"
                    className="tk-keuze"
                    aria-label={naamVan(deel)}
                    aria-pressed={deel.setId === chosen?.setId}
                    onClick={() => onSet(deel.setId)}
                  >
                    <span aria-hidden="true">{deel.kortNaam ?? naamVan(deel)}</span>
                  </button>
                ))}
              </div>
            )}
          </section>
        ) : null}

        <section className="tk-kies" aria-label={t('choose.stepHow')}>
          {/* The order of the ways is the argument, and the tile is the name.
              What each is for is in its label, so tabbing through them never
              costs a child the thing that tells them apart (ADR-061). */}
          <Stap nummer={stap.hoe} label={t('choose.stepHow')} />

          <div className="tk-tegels">
            {tegels.map((candidate) => {
              const FormIcon = candidate.icon;
              const gekozenVorm = !alsToets && candidate.id === form?.id;
              const premium = isPremiumVorm(candidate.id);

              return (
                <button
                  key={candidate.id}
                  type="button"
                  className="tk-tegel"
                  aria-label={metPremium(
                    `${t(candidate.name)}. ${t(candidate.reason)}`,
                    premium,
                    actief,
                  )}
                  aria-pressed={gekozenVorm}
                  onClick={() => {
                    if (premium && !actief) {
                      vraagOuders();
                      return;
                    }
                    setFormId(candidate.id);
                    setToetsstand(false);
                  }}
                >
                  <span className="tk-plaat">
                    <FormIcon size={24} />
                  </span>
                  <span className="min-w-0">{t(candidate.name)}</span>
                  {premium ? <PremiumLabel /> : null}
                  {gekozenVorm ? vink : null}
                </button>
              );
            })}

            {/* The oefentoets, last among the ways and one of them: pressing it
                un-presses the others, because it chooses how you answer too.
                It used to be a switch on whichever way was chosen (ADR-085),
                which asked a child to pick a way a test never asks for
                (ADR-100). */}
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
                onClick={() => (actief ? setToetsstand(true) : vraagOuders())}
              >
                <span className="tk-plaat">
                  <PaperIcon size={24} />
                </span>
                <span className="min-w-0">{t('choose.testMode')}</span>
                <PremiumLabel />
                {alsToets ? vink : null}
              </button>
            ) : null}
          </div>
        </section>

        {/* How long, as a step of its own — and only after a way that has a
            length: pointing, choosing, typing. A minute, three lives and
            exploring have none, and a diploma is the whole table, so for those
            the step is not there rather than empty (ADR-100, amending ADR-074). */}
        {chosen && form && lengtes.length > 0 ? (
          <section className="tk-kies" aria-label={t('choose.howMany')}>
            <Stap nummer={stap.hoe + 1} label={t('choose.howMany')} />

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
                    onClick={() => setAantal(count)}
                  >
                    <span aria-hidden="true">
                      {heel ? t('choose.howManyAll', { aantal: count }) : count}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* From a tablet up, the answers together and the way on, closing the
            chooser. On a phone the same bar is at the foot of the page — see
            below. Always drawn; filled once every step has an answer. */}
        {kleinScherm ? null : (
          <div className="tk-startbalk tk-choose-start">
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
                <p id={nogId} className="tk-startbalk-nog">
                  {nogTeKiezen(wachtend)}
                </p>
              )}
              {eerderZin ? <p className="tk-hulp">{eerderZin}</p> : null}
            </div>
            {startKnop}
          </div>
        )}

        {/* Eén zin, en geen tweede toren (ADR-158): wat hier vandaag terugkomt,
            want dat is het enige wat een steen kan opleveren. */}
        {chosen !== null && states !== null ? (
          <p className="tk-hulp">{terugZin(chosen.items, states, now)}</p>
        ) : null}

        {/* Twelve diplomas, under the tables and nowhere else (ADR-075). Pressing
            a gap answers both steps at once: that table, and the diploma. */}
        {onderwerp?.id === 'tafels' ? (
          <Tafeldiplomas
            onKies={(tafel) => {
              kiesElders(tafel);
              setFormId('tafeldiploma');
              setToetsstand(false);
            }}
          />
        ) : null}

        {/* Six vlaggendiploma's on the flags page (ADR-104). Pressing one answers
            every step at once: that werelddeel, all its flags, the diploma. */}
        {module.id === 'vlaggen' ? (
          <VlagDiplomas
            onKies={(deel) => {
              kiesElders(`vlag-${deel}-alle`);
              setFormId('vlag-diploma');
              setToetsstand(false);
            }}
          />
        ) : null}

        {/* Four klokdiploma's on the clock's page, and eleven topodiploma's on
            topography's (ADR-117). Pressing one answers every step at once:
            that step or that map, and the diploma. */}
        {module.id === 'klok' ? (
          <KlokDiplomas
            onKies={(stap) => {
              kiesElders(stap);
              setFormId('klok-diploma');
              setToetsstand(false);
            }}
          />
        ) : null}

        {module.id === 'topo' ? (
          <TopoDiplomas
            onKies={(kaart) => {
              kiesElders(kaart);
              setFormId('topo-diploma');
              setToetsstand(false);
            }}
          />
        ) : null}
      </div>

      {aside}

      {/* On a phone: the sentence and the way on, stuck to the foot of the
          screen. After the child's own column, as the last thing in the page, so
          it is in reach the whole way down and never lies over its own button.
          See .tk-startbalk-mobiel for what ADR-052 taught about building it. */}
      {kleinScherm ? (
        <div className="tk-startbalk-mobiel tk-choose-start" data-accent="module">
          <p className="tk-startbalk-zin">
            {klaar ? (
              <>
                <span className="block font-semibold">{zin}</span>
                {minuten === null ? null : (
                  <span className="tk-hulp block">
                    {minuten === 1
                      ? t('choose.minuteOne')
                      : t('choose.minutes', { aantal: minuten })}
                  </span>
                )}
                {eerderZin ? <span className="tk-hulp block">{eerderZin}</span> : null}
              </>
            ) : (
              <span id={nogId} className="tk-hulp block">
                {nogTeKiezen(wachtend)}
              </span>
            )}
          </p>
          {startKnop}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Het woord onder een tegel die niet bij de groep past (ADR-151), of niets. Het
 * zegt waarom hij onderaan staat, en dat hij er nog is.
 */
function groepLabel(indeling: Indeling): string | null {
  if (indeling === 'herhaling') return t('groep.herhaling');
  if (indeling === 'later') return t('groep.later');
  return null;
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
 * The subject whose sets are twelve numbers: a keypad, not a row of words. The
 * deelsommen were one too until they came in ranges, like the keersommen
 * (ADR-120).
 */
function isKeypad(onderwerp: Onderwerp): boolean {
  return onderwerp.id === 'tafels';
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
 * One of the page's numbered questions: the number in the module's text colour
 * and the question in ink, on the hairline every section heading has. The
 * number is drawn here rather than written into the copy, because the modules
 * do not have the same number of questions.
 */
function Stap({ nummer, label }: { readonly nummer: number; readonly label: string }) {
  return (
    <h2 className="tk-sectie">
      <span className="tk-stap-nummer">{nummer}</span> · {label}
    </h2>
  );
}

/**
 * Wat er van deze set vandaag terugkomt (ADR-158).
 *
 * De enige zin op deze pagina die over de toren gaat, en hij gaat over de
 * voorwaarde en niet over de beloning: alleen wat terugkomt kan een steen
 * opleveren. Komt er vandaag niets, dan staat er wanneer wel — anders leest een
 * kind "nul" als "je hebt iets verkeerd gedaan".
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
