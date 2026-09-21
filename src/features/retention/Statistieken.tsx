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
import { MODULE_ICON } from '@/features/shell/moduleIcons';
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
import { voorbeeldStanden } from './voorbeeld';

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
  return <Onthouden premium={actief} />;
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
      {/* Over alle vakken, dus in de kleur van geen enkel vak: de ring en de
          tegels staan in de kleur van leer.nu zelf, en pas bij Per onderwerp
          hieronder neemt de pagina de kleur aan van het vak dat je kiest. */}
      <GeheugenKaart stand={geheugen(states, now)} uitleg={<Regels />} />

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

      {/* `contents`: de vakkleur geldt voor alles hieronder, en de blokken
          houden de tussenruimte van de pagina. */}
      <div className="contents" data-module={moduleId} data-accent="module">
        {premium ? <PerVak vakken={vakken} modules={modules} onKies={kiesVak} /> : null}

        <h2 id={ONDERWERP_ID} className="tk-sectie" tabIndex={-1}>
          {t('retention.onderwerpTitel')}
        </h2>

        {/* Which subject: the module, then the set. Chips rather than a
            select: every option is worth seeing, and a select on a touch
            screen is a menu that covers the thing you were looking at.
            Zonder code staan ze er niet (ADR-124): de pagina laat dan één
            onderwerp zien en zegt welk. Dat er meer is, zegt de etalage onder
            het voorbeeld — de enige vraag om premium op Jij (ADR-172). */}
        {!premium ? (
          <p className="text-tekst-secundair">
            {t('retention.voorproef', { onderwerp: deel ? naamVan(deel) : '' })}
          </p>
        ) : null}
        {/* Niet met `hidden`: dat verliest van Tailwinds `display: flex` op
            hetzelfde element, en dan staat de keuze er alsnog. */}
        {premium ? (
          <div className="flex flex-col gap-3">
            <div className="tk-keuzes" role="group" aria-label={t('retention.welkVak')}>
              {modules.map((module) => {
                const ModuleIcon = MODULE_ICON[module.id];

                return (
                  <button
                    key={module.id}
                    type="button"
                    className="tk-keuze"
                    aria-pressed={module.id === moduleId}
                    onClick={() => {
                      setModuleId(module.id);
                      setSoortId(null);
                      setSetId(null);
                    }}
                  >
                    <ModuleIcon size={20} />
                    {t(module.name)}
                  </button>
                );
              })}
            </div>

            {soorten.length > 0 ? (
              <div className="tk-keuzes" role="group" aria-label={t('retention.welkeSom')}>
                {soorten.map((vak) => (
                  <button
                    key={vak.id}
                    type="button"
                    className="tk-keuze"
                    aria-pressed={vak.id === soort?.id}
                    onClick={() => {
                      setSoortId(vak.id);
                      setSetId(null);
                    }}
                  >
                    {t(vak.naam)}
                  </button>
                ))}
              </div>
            ) : null}

            {delen.length > 0 ? (
              <div className="tk-keuzes" role="group" aria-label={t('deel.title')}>
                {delen.map((kandidaat) => (
                  <button
                    key={kandidaat.id}
                    type="button"
                    className="tk-keuze"
                    aria-pressed={kandidaat.id === deelKeuze?.id}
                    onClick={() => {
                      setSoortId(kandidaat.id);
                      setSetId(null);
                    }}
                  >
                    {t(kandidaat.naam)}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="tk-keuzes" role="group" aria-label={t('retention.welkOnderwerp')}>
              {sets.map((kandidaat) => (
                <button
                  key={kandidaat.setId}
                  type="button"
                  className="tk-keuze"
                  aria-label={naamVan(kandidaat)}
                  aria-pressed={kandidaat.setId === deel?.setId}
                  onClick={() => setSetId(kandidaat.setId)}
                >
                  <span aria-hidden="true">
                    {moduleId === 'tafels'
                      ? (kandidaat.kortNaam ?? naamVan(kandidaat))
                      : naamVan(kandidaat)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* Alles in één blik, in één kaart en in de kleur van het vak
            (ADR-160). De vier getallen stonden als grijze tegels boven deze
            kaart en de legenda eronder zei dezelfde vier woorden nog een keer;
            nu zijn het vier tegels die tellen én de legenda zijn, in vier
            sterktes van de kleur die dit vak overal draagt — dezelfde taal als
            de balk op Per vak. De stip erop is de stip van de tabel en van de
            muur eronder, dus de kleur zegt niets wat de vorm niet ook zegt.

            Zonder eigen kop sinds ADR-172: "Per onderwerp", "Alles in één
            blik" en "Per onderdeel" waren drie koppen voor één ding. De naam
            blijft, voor wie met een schermlezer van regio naar regio gaat. */}
        <section className="flex flex-col gap-3" aria-label={t('retention.glance')}>
          <Blik
            moduleId={moduleId}
            deel={deel}
            items={items}
            states={states}
            telling={telling}
            now={now}
          />

          {/* En zonder code een tweede kaart eronder: hoe het eruitziet bij een
              kind dat een paar weken oefent (ADR-165). Eronder en nooit
              ervoor, en gemerkt in woorden — een voorbeeld dat voor de echte
              cijfers van een kind langs gaat staan, is een leugen. */}
          {!premium ? <Voorbeeld moduleId={moduleId} deel={deel} items={items} now={now} /> : null}
        </section>

        {/* De tabel staat er nog, maar niet vooraan (ADR-143), en alleen met
            premium. Zonder code stond hier een slot, het derde van vier op Jij;
            de etalage erboven noemt de tabel al (ADR-172).

            A stop in the tab order with a name of its own: on a phone the
            table is wider than the screen and scrolls sideways inside its
            card, and a region that scrolls has to be reachable from the
            keyboard too (axe, scrollable-region-focusable) — as the rows on
            the front door are (ScrollRij). */}
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
    </>
  );
}

/**
 * "Alles in één blik": vier tegels, de kaart waar er een is, en de stippen.
 *
 * Eén component sinds ADR-165, omdat hij twee keer getekend wordt: één keer met
 * de standen van dit kind, en zonder code nog een keer met die van een
 * verzonnen kind. Twee kopieën van deze kaart zouden op de dag van de eerste
 * wijziging uit elkaar lopen, en dan laat het voorbeeld iets anders zien dan
 * het ding waar het een voorbeeld van is.
 */
function Blik({
  moduleId,
  deel,
  items,
  states,
  telling,
  now,
  voorbeeld = false,
}: {
  readonly moduleId: Module['id'];
  readonly deel: Onderdeel | null;
  readonly items: readonly Schedulable[];
  readonly states: ReadonlyMap<string, ItemState>;
  readonly telling: Record<ItemStatus, number>;
  readonly now: Date;
  /**
   * De kaart van het voorbeeldkind. Alleen de namen veranderen ervan, en dat
   * is geen detail: twee kaarten op één pagina met dezelfde naam zijn voor een
   * schermlezer één ding dat twee keer staat, en voor een test onvindbaar.
   */
  readonly voorbeeld?: boolean;
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
          label={
            voorbeeld
              ? t('retention.voorbeeldKaart', { wat: naamVan(deel) })
              : t('retention.kaartLabel', { wat: naamVan(deel) })
          }
        />
      ) : null}
      <Heatmap
        moduleId={moduleId}
        items={items}
        states={states}
        now={now}
        label={voorbeeld ? t('retention.voorbeeldStippen') : t('retention.glance')}
      />
    </div>
  );
}

/**
 * Dezelfde kaart, met de stand van een kind dat er al een paar weken mee bezig
 * is (ADR-165), en daaronder wat premium ermee doet.
 *
 * **Waarom hij er staat.** Wie deze pagina voor het eerst opent, heeft nog
 * niets geoefend: dan zijn de vier getallen vier nullen en is de muur een muur
 * van lege stippen. Dat is eerlijk, en het laat precies niets zien van waar dit
 * product over gaat. Hier staat wat het wordt.
 *
 * **En de knop eronder zegt het hardop.** Er stond een `PremiumSlot` bij de
 * tabel, halverwege de pagina, met dezelfde toon als elk ander slot in de app.
 * Dit is de pagina die de hele propositie ís — als er ergens één zin mag staan
 * die het vraagt, is het hier. Sinds ADR-172 is het ook de enige op Jij: het
 * slot bij de tabel, dat van het weekbericht en dat van de eigen woorden zijn
 * weg, want ADR-124 vraagt één keer per pagina.
 */
function Voorbeeld({
  moduleId,
  deel,
  items,
  now,
}: {
  readonly moduleId: Module['id'];
  readonly deel: Onderdeel | null;
  readonly items: readonly Schedulable[];
  readonly now: Date;
}) {
  const naarPremium = useNaarPremium();
  const kop = useId();
  const states = voorbeeldStanden(items, now);

  const telling = { new: 0, practising: 0, remembered: 0, refresh: 0 } satisfies Record<
    ItemStatus,
    number
  >;
  for (const item of items) telling[statusOf(states.get(item.id), now)] += 1;

  return (
    <section className="flex flex-col gap-3" aria-labelledby={kop}>
      <p className="flex flex-wrap items-center gap-3">
        <span className="tk-pil">{t('retention.voorbeeldLabel')}</span>
        <span id={kop} className="text-tekst-secundair">
          {t('retention.voorbeeldUitleg')}
        </span>
      </p>

      <Blik
        moduleId={moduleId}
        deel={deel}
        items={items}
        states={states}
        telling={telling}
        now={now}
        voorbeeld
      />

      <div className="tk-etalage">
        <h3 className="tk-etalage-kop">{t('retention.verkoopKop')}</h3>
        <p className="tk-etalage-tekst">{t('retention.verkoopTekst')}</p>
        <div className="tk-etalage-knoppen">
          <button type="button" className="tk-button tk-knop-licht" onClick={naarPremium}>
            {t('retention.verkoopKnop')}
          </button>
        </div>
      </div>
    </section>
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
    const taalItem = item as SpellingItem | WerkwoordItem;
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
