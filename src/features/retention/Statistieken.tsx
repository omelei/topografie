import { useEffect, useId, useState } from 'react';
import { Uitklap } from '@/components/Uitklap';
import { Dot } from '@/components/Dot';
import { StatusLabel, type ItemStatus } from '@/components/StatusLabel';
import {
  sumText,
  type Item,
  type ItemState,
  type KlokItem,
  type Schedulable,
  type EngelsItem,
  type SpellingItem,
  type SumItem,
  type VlagItem,
  type WerkwoordItem,
} from '@/game-core';
import { itemRetention } from '@/game-core';
import { klokVoluit } from '@/features/klok/klokTaal';
import { naamVan, onderwerpenVan, type Onderdeel } from '@/features/module/onderdelen';
import { regiosVan } from '@/features/module/regios';
import { heeftKaart, StandKaart } from './StandKaart';
import { useNaarPremium, usePremium } from '@/features/premium/usePremium';
import { BUILT_MODULES, type Module } from '@/features/shell/modules';
import { t, type TranslationKey } from '@/i18n';
import {
  loadAntwoorden,
  loadItemStates,
  loadPlayedRounds,
  type PlayedRound,
} from '@/store/progress';
import { aantalAntwoorden, dagenGeleden, procentGoed, retentionOf, statusOf } from './itemStatus';
import { GeheugenKaart, HoeVaak, PerVak, StandTegels } from './Overzicht';
import { geheugen, perVak, perWeek, procentGoedVan, type Antwoord } from './statistiek';

/**
 * K9, "Wat je onthoudt": the part of the product that answers the question it
 * is named after (ADR-112, ADR-114), and since ADR-148 also the one that says
 * how the practising goes.
 *
 * **Sinds ADR-171 geen eigen pagina meer, maar het midden van Jij.** Jij is
 * waar je al je cijfers ziet, en een tweede bestemming met alleen de cijfers
 * liet een kind kiezen tussen "wie ben ik" en "hoe gaat het" — twee vragen met
 * één antwoord. Dit bestand tekent dus geen kop en geen pagina: het geeft de
 * blokken, en `ProfileScreen` zet ze onder de diploma's (ADR-172).
 *
 * **Eerst de twee samenvattingen, dan de zoom** (ADR-172): what you remember
 * over every subject, with the three-week forecast as a ring; how often you
 * practise, this week in four tiles and with premium the weeks before it; then,
 * with premium, each subject as a bar, and one subject in full. Per vak and Per
 * onderwerp stand next to each other because a press on a subject row chooses
 * that subject below. And "Hoe vaak" stands above them rather than after,
 * because without premium Per onderwerp ends on the example child: a child's
 * own numbers go first, all of them (ADR-165).
 *
 * **De uitleg staat bij het getal** (ADR-160, ADR-172). Alles hier telt één
 * woord, en wie dat woord niet kent leest getallen zonder eenheid. De eerste
 * regel staat daarom open boven de ring, de andere drie in een uitklap eronder.
 *
 * **Then one subject**, as before: which subject as chips — the module first, then the set, the chosen one
 * in the module's colour — then one card that is the whole set at a glance:
 * **four tiles** that say where it stands, the map where there is one, and the
 * dots. Then the table.
 *
 * **The four tiles are the four statuses**, and they add up to the set:
 * onthoud je, even opfrissen, nog aan het oefenen, nog niet geoefend. "Vandaag
 * op de rol" was the fourth and is gone (ADR-114): it was the scheduler's word
 * for what is due, which is a fact about the schedule and not about what a
 * child remembers, and it is what the next round asks anyway.
 *
 * Sinds ADR-160 zijn die tegels ook de legenda onder de stippen, in vier
 * sterktes van de kleur van het vak. Ze zeiden met de legenda samen twee keer
 * dezelfde vier woorden, in zwart-wit, boven en onder één kaart.
 *
 * **The table is how the practising has gone**, not when it comes back: how
 * many times each one was answered, the share of those that was right, and
 * how many days ago it was last answered. "Weer op" — a date the scheduler
 * chose — made a child plan around the algorithm.
 *
 * **The rules are written out**, as the streak's are (ADR-110). What counts as
 * remembering changed in ADR-114 and again in ADR-160 — drie keer goed op
 * drie dagen — and a definition nobody can read is one nobody can trust.
 *
 * **Sinds ADR-192 staat hier zonder code alleen de vraag (`Etalage`).** Wat
 * hieronder over een gratis voorproef staat, is de geschiedenis van die grens.
 *
 * Premium since ADR-116, en sinds ADR-124 met een gratis voorproef, want dit is
 * de pagina die de hele propositie ís en hij liet er niets van zien. Er stond
 * een kaal slot waar het product hoort. Een belofte die een ouder niet kan zien
 * is geen belofte — dezelfde redenering die de voorspelling op "Ronde klaar"
 * gratis maakte (ADR-122), doorgetrokken naar de pagina waar die voorspelling
 * vandaan komt.
 *
 * **Wat gratis te zien is:** de vier tegels en de stippen, voor het onderwerp
 * waar de pagina op opent. Dat is de vorm van het ding — hoeveel je onthoudt,
 * hoeveel er opgefrist moet, wat je nog niet gedaan hebt — en het is waar.
 * **Wat premium is:** elk ander onderwerp, en de tabel per onderdeel. Het
 * inzicht is gratis, het bijhouden is betaald.
 *
 * Dit is geen teaser van een beloning en botst dus niet met de regel van
 * `PremiumSlot`: er wordt geen kist getekend die een kind niet mag openmaken.
 * Het is de eigen voortgang van dat kind, in het klein.
 */

/** How many weeks the chart looks back: two months, and this week last. */
const WEKEN = 8;

/**
 * What remembering means, after the first rule: that one stands open above the
 * ring (`GeheugenKaart`), and these are the exceptions to it.
 */
const REGELS: readonly TranslationKey[] = [
  'retention.regel2',
  'retention.regel3',
  'retention.regel4',
];

/** Where a subject row in Per vak takes you. */
const ONDERWERP_ID = 'onthouden-onderwerp';

export function Statistieken() {
  const { actief } = usePremium();
  // Wat een kind kent en hoe vaak het oefende, is alleen met premium te zien
  // (ADR-192). Het wordt wel altijd bewaard — het herhaalschema heeft het
  // nodig — dus wie premium neemt, ziet meteen alles wat er al was. Zonder
  // code staat hier alleen de vraag, en niets van de getallen erachter.
  return actief ? <Onthouden premium /> : <Etalage />;
}

/**
 * Hoe onthouden werkt, in een uitklap onder "Je geheugen" (ADR-172).
 *
 * ADR-160 zette de vier regels bovenaan en open, omdat ze onderaan achter de
 * tabel stonden, dichtgevouwen, en wie het woord niet kent leest getallen
 * zonder eenheid. Dat eerste blijft zo: wat onthouden is staat open boven de
 * ring. Wat hier ingeklapt staat, zijn de uitzonderingen — wat meetelt, wat
 * opfrissen is, wat een fout doet — die een kind één keer leest en die op een
 * telefoon bij elk bezoek een half scherm kostten.
 */
function Regels() {
  return (
    <Uitklap open={t('retention.regelsTitel')} titel={t('uitklap.uitlegDicht')}>
      <div className="tk-card">
        <ol className="tk-regelkaart-lijst">
          {REGELS.map((regel, nummer) => (
            <li key={regel} className="tk-regelrij">
              {/* Het nummer is de volgorde die de tekst al heeft; een schermlezer
                  telt de lijst zelf. */}
              <span className="tk-regelnummer" aria-hidden="true">
                {nummer + 1}
              </span>
              <span className="text-lopend">{t(regel)}</span>
            </li>
          ))}
        </ol>
      </div>
    </Uitklap>
  );
}

/** Eén keuze in een rij chips. */
interface Keuze {
  readonly sleutel: string;
  readonly naam: string;
  /**
   * Wat er te lezen staat als dat korter is dan de naam — "6" voor de tafel van
   * zes. De naam blijft de toegankelijke naam, dus een schermlezer hoort waar
   * een chip over gaat en niet één cijfer.
   */
  readonly kort?: string;
  readonly aan: boolean;
  readonly kies: () => void;
}

/**
 * Eén rij chips, met dezelfde vorm voor het soort som, het deel en het
 * onderwerp.
 *
 * Op modulehoogte en niet binnen `Onthouden`, hoe verleidelijk dat ook was met
 * al die state binnen handbereik: een component die in een ander component
 * gedefinieerd wordt, is bij elke render een nieuw type, en React hangt dan de
 * hele rij opnieuw op. Wie met het toetsenbord op een chip stond, staat daarna
 * bovenaan de pagina.
 */
function Chips({ label, keuzes }: { readonly label: string; readonly keuzes: readonly Keuze[] }) {
  const kop = useId();
  if (keuzes.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {/* De vraag staat er zichtbaar boven, en is ook de naam van de groep.
          Hij stond er alleen als `aria-label`, dus wie kijkt zag een rij
          knoppen zonder te lezen wat er gekozen wordt — en dit is een pagina
          voor een kind van acht. */}
      <p id={kop} className="tk-label">
        {label}
      </p>
      <div className="tk-keuzes" role="group" aria-labelledby={kop}>
        {keuzes.map((keuze) => (
          <button
            key={keuze.sleutel}
            type="button"
            className="tk-keuze"
            aria-label={keuze.kort === undefined ? undefined : keuze.naam}
            aria-pressed={keuze.aan}
            onClick={keuze.kies}
          >
            {keuze.kort === undefined ? keuze.naam : <span aria-hidden="true">{keuze.kort}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

function Onthouden({ premium }: { readonly premium: boolean }) {
  const [states, setStates] = useState<Map<string, ItemState> | null>(null);
  const [rondes, setRondes] = useState<readonly PlayedRound[] | null>(null);
  const [antwoorden, setAntwoorden] = useState<readonly Antwoord[]>([]);
  const [moduleId, setModuleId] = useState<Module['id']>('topo');
  /** Which kind of sum, on rekenen only. Null for the first. */
  const [soortId, setSoortId] = useState<string | null>(null);
  const [setId, setSetId] = useState<string | null>(null);

  useEffect(() => {
    void loadItemStates().then(setStates);
    void loadPlayedRounds().then(setRondes);
  }, []);

  // Alleen met premium gelezen: elk antwoord ooit is de grootste lezing op
  // deze pagina, en zonder code staat de grafiek er niet.
  useEffect(() => {
    if (!premium) return;
    void loadAntwoorden().then(setAntwoorden);
  }, [premium]);

  if (states === null || rondes === null) {
    return (
      <p className="text-tekst-secundair" aria-busy="true">
        {t('practice.loading')}
      </p>
    );
  }

  const modules = BUILT_MODULES;
  const soorten = moduleId === 'tafels' ? somSoorten() : [];
  const soort = soorten.find((vak) => vak.id === soortId) ?? soorten[0] ?? null;
  // Taal asks which part first, as its own page does (ADR-118).
  const delen = moduleId === 'woorden' ? regiosVan('woorden') : [];
  const deelKeuze = delen.find((kandidaat) => kandidaat.id === soortId) ?? delen[0] ?? null;
  const sets = setsVan(moduleId, deelKeuze?.id ?? soort?.id ?? null);
  // The set the child chose, or the module's first: topography opens on the
  // provinces, as it always has.
  const deel = sets.find((kandidaat) => kandidaat.setId === setId) ?? sets[0] ?? null;
  const items = deel ? deel.items : [];
  const now = new Date();

  const telling = { new: 0, practising: 0, remembered: 0, refresh: 0 } satisfies Record<
    ItemStatus,
    number
  >;
  for (const item of items) telling[statusOf(states.get(item.id), now)] += 1;

  // De sets waar een vak uit bestaat, zonder mix en zonder foutenlijst: dezelfde
  // twee uitzonderingen als de keuzes hieronder.
  const vakken = perVak(
    modules.flatMap((module) =>
      onderwerpenVan(module.id)
        .flatMap((vak) => vak.sets)
        .filter((set) => !set.mix && !set.setId.endsWith('fouten')),
    ),
    states,
    now,
  );

  function kiesVak(id: Module['id']) {
    setModuleId(id);
    setSoortId(null);
    setSetId(null);
    // Naar de keuzes, en de focus erheen: wie met het toetsenbord drukte, staat
    // anders nog bovenaan een pagina die net onder hem veranderde.
    const doel = document.getElementById(ONDERWERP_ID);
    doel?.scrollIntoView({ block: 'start' });
    doel?.focus({ preventScroll: true });
  }

  return (
    <>
      {/* Alles bij elkaar staat in de kleur van geen enkel vak — die van
          leer.nu zelf — en de zoom eronder neemt de kleur aan van het vak dat
          je aanwijst. Sinds ADR-177 is dat één sectie in plaats van drie:
          "Je geheugen", "Per vak" en "Per onderwerp" waren drie koppen voor
          hetzelfde onderwerp, van ver naar dichtbij. */}
      <GeheugenKaart
        stand={geheugen(states, now)}
        uitleg={<Regels />}
        zoom={
          /* `contents`: de vakkleur geldt voor alles hieronder, en de blokken
             houden de tussenruimte van de pagina. */
          <div className="contents" data-module={moduleId} data-accent="module">
            <PerVak vakken={vakken} modules={modules} gekozen={moduleId} onKies={kiesVak} />

            {/* Welk onderwerp binnen dat vak. Chips en geen keuzelijst: elke
                optie is het bekijken waard, en een keuzelijst op een
                aanraakscherm is een menu dat gaat staan waar je net naar keek.

                Sinds ADR-177 staan ze er zonder code. Ze stonden achter
                premium, en dat betekende niet "minder zien" maar "altijd
                hetzelfde zien": het eerste onderwerp van het eerste vak, de
                provincies van Nederland, ook voor het kind dat alleen maar
                klokgekeken had. */}
            <div id={ONDERWERP_ID} tabIndex={-1} className="flex flex-col gap-3">
              <Chips
                label={t('retention.welkeSom')}
                keuzes={soorten.map((vak) => ({
                  sleutel: vak.id,
                  naam: t(vak.naam),
                  aan: vak.id === soort?.id,
                  kies: () => {
                    setSoortId(vak.id);
                    setSetId(null);
                  },
                }))}
              />
              <Chips
                label={t('deel.title')}
                keuzes={delen.map((kandidaat) => ({
                  sleutel: kandidaat.id,
                  naam: t(kandidaat.naam),
                  aan: kandidaat.id === deelKeuze?.id,
                  kies: () => {
                    setSoortId(kandidaat.id);
                    setSetId(null);
                  },
                }))}
              />
              <Chips
                label={t('retention.welkOnderwerp')}
                keuzes={sets.map((kandidaat) => ({
                  sleutel: kandidaat.setId,
                  naam: naamVan(kandidaat),
                  ...(moduleId === 'tafels' && kandidaat.kortNaam != null
                    ? { kort: kandidaat.kortNaam }
                    : {}),
                  aan: kandidaat.setId === deel?.setId,
                  kies: () => setSetId(kandidaat.setId),
                }))}
              />
            </div>

            {/* Alles in één blik, in één kaart en in de kleur van het vak
                (ADR-160): vier tegels die tellen én de legenda zijn, de kaart
                waar er een is, en de stippen. Zonder eigen kop sinds ADR-172;
                de naam blijft, voor wie met een schermlezer van regio naar
                regio gaat. */}
            <section className="flex flex-col gap-3" aria-label={t('retention.glance')}>
              <Blik
                moduleId={moduleId}
                deel={deel}
                items={items}
                states={states}
                telling={telling}
                now={now}
              />
            </section>

            {/* De tabel is het bijhouden, en dat is wat premium koopt
                (ADR-124). Een stop in de tabvolgorde met een eigen naam: op een
                telefoon is de tabel breder dan het scherm en schuift hij binnen
                zijn kaart, en een gebied dat schuift moet ook met het
                toetsenbord te bereiken zijn (axe,
                scrollable-region-focusable). */}
            {premium ? (
              <Uitklap open={t('uitklap.tabel')} titel={t('uitklap.tabelDicht')}>
                <div
                  className="tk-tabelkaart tk-vakkleur"
                  role="group"
                  aria-label={t('retention.detail')}
                  tabIndex={0}
                >
                  <RetentionTable moduleId={moduleId} items={items} states={states} now={now} />
                </div>
              </Uitklap>
            ) : null}
          </div>
        }
      />

      <HoeVaak
        rondes={rondes}
        now={now}
        verloop={
          premium
            ? {
                weken: perWeek(antwoorden, now, WEKEN),
                procentGoed: procentGoedVan(antwoorden),
                vragen: antwoorden.length,
              }
            : null
        }
      />

      {premium ? null : <Etalage />}
    </>
  );
}

/**
 * De vraag om premium, één keer op Jij (ADR-124, ADR-172, ADR-177).
 *
 * Hij stond onder het voorbeeldkind en hoorde erbij: eerst een verzonnen kind,
 * dan de vraag of je dit over jezelf wilt zien. Het voorbeeld is weg en de
 * vraag blijft, want ADR-124 wil dat een ouder kan zien wat hij koopt — alleen
 * staat er nu het echte kind boven in plaats van een gemaakt exemplaar, en dan
 * is "wil je dit over jezelf zien" ook niet meer de goede zin.
 */
function Etalage() {
  const naarPremium = useNaarPremium();

  return (
    <div className="tk-etalage">
      <h2 className="tk-etalage-kop">{t('retention.verkoopKop')}</h2>
      <p className="tk-etalage-tekst">{t('retention.verkoopTekst')}</p>
      <div className="tk-etalage-knoppen">
        <button type="button" className="tk-button tk-knop-licht" onClick={naarPremium}>
          {t('retention.verkoopKnop')}
        </button>
      </div>
    </div>
  );
}

/**
 * "Alles in één blik": vier tegels, de kaart waar er een is, en de stippen.
 *
 * Eén keer getekend sinds ADR-177, met de standen van dit kind. ADR-165 zette
 * er zonder code een tweede onder, met die van een verzonnen kind, omdat je dan
 * maar één onderwerp zag en dat er vaak leeg bij lag. Nu je elk van je eigen
 * vakken kunt aanwijzen, is het voorbeeld overbodig — en verzonnen cijfers op
 * een pagina die "Jij" heet, zijn het soort ding dat de rest van de pagina
 * minder geloofwaardig maakt.
 */
function Blik({
  moduleId,
  deel,
  items,
  states,
  telling,
  now,
}: {
  readonly moduleId: Module['id'];
  readonly deel: Onderdeel | null;
  readonly items: readonly Schedulable[];
  readonly states: ReadonlyMap<string, ItemState>;
  readonly telling: Record<ItemStatus, number>;
  readonly now: Date;
}) {
  return (
    <div className="tk-card tk-vakkleur flex flex-col gap-4">
      <StandTegels telling={telling} />
      {/* De kaart van topografie hoort hier, en niet meer bij een beloning
          (ADR-158): dezelfde vier statussen als de stippen en de tabel, op de
          plek waar de dingen liggen. */}
      {deel && !deel.mix && heeftKaart(deel.setId) ? (
        <StandKaart
          setId={deel.setId}
          items={items}
          states={states}
          now={now}
          label={t('retention.kaartLabel', { wat: naamVan(deel) })}
        />
      ) : null}
      <Heatmap
        moduleId={moduleId}
        items={items}
        states={states}
        now={now}
        label={t('retention.glance')}
      />
    </div>
  );
}

/**
 * The sets of a module a child can see their own memory of: every set a round
 * can be played on, except a mix — it is all the others at once — and a list
 * of mistakes, which is a view of the others rather than a set of its own.
 *
 * Flags keep one set per werelddeel, the one with every flag in it: the
 * well-known and the look-alikes are the same flags again, and twenty chips
 * are not a choice. Rekenen asks which kind of sum first (`onderwerpenVan`),
 * as its own page does, because thirty-odd sets in one row are not one either.
 * Taal asks which part first, Spelling or Werkwoorden, for the same reason.
 */
function setsVan(moduleId: Module['id'], onderwerpId: string | null): Onderdeel[] {
  const gezien = new Set<string>();
  const sets: Onderdeel[] = [];
  for (const vak of onderwerpenVan(moduleId)) {
    if (moduleId === 'tafels' && vak.id !== onderwerpId) continue;
    if (moduleId === 'woorden' && vak.regio !== onderwerpId) continue;
    for (const deel of vak.sets) {
      if (deel.mix || deel.setId.endsWith('fouten') || gezien.has(deel.setId)) continue;
      if (
        moduleId === 'vlaggen' &&
        !deel.setId.endsWith('-alle') &&
        deel.setId !== 'vlag-nederland-provincies'
      ) {
        continue;
      }
      gezien.add(deel.setId);
      sets.push(deel);
    }
  }
  return sets;
}

/** Rekenen's kinds of sum that hold a set of their own: not the mix. */
function somSoorten() {
  return onderwerpenVan('tafels').filter((vak) => vak.sets.some((deel) => !deel.mix));
}

/**
 * What an item is called, in the words its own round uses: the name of a
 * place or a flag, the sum as it is written, the time in full — and in Taal the
 * word, or for a verb the sentence, because "wordt" is three items apart.
 */
function itemNaam(moduleId: Module['id'], item: Schedulable): string {
  if (moduleId === 'tafels') return sumText(item as SumItem);
  if (moduleId === 'klok') return klokVoluit(item as KlokItem);
  if (moduleId === 'vlaggen') return (item as VlagItem).naam;
  if (moduleId === 'woorden') {
    const taalItem = item as SpellingItem | WerkwoordItem | EngelsItem;
    if ('en' in taalItem) return `${taalItem.nl}: ${taalItem.en}`;
    return 'woord' in taalItem ? taalItem.woord : taalItem.zin;
  }
  return (item as Item).naam;
}

/**
 * Everything, at a glance.
 *
 * No labels on the dots: they are read as a group rather than one by one, and
 * the table underneath is where a name belongs. Each still carries its own
 * accessible name, so the group is not a wall of silence to a screen reader.
 *
 * In the subject's own colour since ADR-160, at full strength, with the fill
 * saying everything it said before. One hue and four levels rather than four
 * hues: a wall of two hundred dots in four colours is a pattern to decode,
 * and a wall of one colour filling up is a picture you can read from the
 * doorway.
 */
function Heatmap({
  moduleId,
  items,
  states,
  now,
  label,
}: {
  readonly moduleId: Module['id'];
  readonly items: readonly Schedulable[];
  readonly states: ReadonlyMap<string, ItemState>;
  readonly now: Date;
  /** Hoe de muur heet. Die van het voorbeeldkind heet anders (ADR-165). */
  readonly label: string;
}) {
  return (
    <div className="tk-stippen" role="list" aria-label={label}>
      {items.map((item) => {
        const state = states.get(item.id);
        const status = t(`status.${statusOf(state, now)}` as TranslationKey);

        return (
          <span key={item.id} role="listitem">
            <Dot
              size={24}
              tone="inherit"
              fill={retentionOf(state)}
              label={`${itemNaam(moduleId, item)}: ${status}`}
            />
          </span>
        );
      })}
    </div>
  );
}

/** De horizon van de voorspelling, overal in het product dezelfde: drie weken. */
function overDrieWeken(now: Date): Date {
  return new Date(now.getTime() + 21 * 86_400_000);
}

/** "vandaag", "1 dag geleden", "12 dagen geleden" — or a dash for never. */
function laatstGeoefend(dagen: number | null): string {
  if (dagen === null) return t('retention.nooit');
  if (dagen === 0) return t('retention.vandaag');
  if (dagen === 1) return t('retention.dagGeleden');
  return t('retention.dagenGeleden', { aantal: dagen });
}

function RetentionTable({
  moduleId,
  items,
  states,
  now,
}: {
  readonly moduleId: Module['id'];
  readonly items: readonly Schedulable[];
  readonly states: ReadonlyMap<string, ItemState>;
  readonly now: Date;
}) {
  return (
    <table className="tk-table">
      <thead>
        <tr>
          <th>{t('retention.item')}</th>
          <th>{t('retention.status')}</th>
          <th className="tk-num">{t('retention.aantal')}</th>
          <th className="tk-num">{t('retention.procentGoed')}</th>
          <th className="tk-num">{t('retention.overDrieWeken')}</th>
          <th>{t('retention.laatst')}</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const state = states.get(item.id);
          const procent = procentGoed(state);

          return (
            <tr key={item.id}>
              <td>
                <span className="flex items-center gap-2">
                  <span className="tk-stip">
                    <Dot size={24} tone="inherit" fill={retentionOf(state)} />
                  </span>
                  {itemNaam(moduleId, item)}
                </span>
              </td>
              <td>
                <StatusLabel status={statusOf(state, now)} />
              </td>
              {/* Right-aligned and tabular, so a column of them lines up on the
                  digit and the figure does not dance from row to row. */}
              <td className="tk-num">{aantalAntwoorden(state)}</td>
              <td className="tk-num">
                {procent === null ? t('retention.nooit') : t('retention.procent', { procent })}
              </td>
              {/* De voorspelling per onderdeel (ADR-126). De premiumpagina
                  belooft "per onderdeel: hoeveel er over drie weken nog van over
                  is", en tot nu toe stond dat getal alleen per set op "Ronde
                  klaar". Een streepje waar niets geoefend is: nul procent is een
                  uitspraak over iets wat niemand ooit gevraagd heeft. */}
              <td className="tk-num">
                {state === undefined
                  ? t('retention.nooit')
                  : t('retention.procent', {
                      procent: Math.round(itemRetention(state, overDrieWeken(now)) * 100),
                    })}
              </td>
              <td>{laatstGeoefend(dagenGeleden(state, now))}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
