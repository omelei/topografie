import { useEffect, useState, type ReactNode } from 'react';
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
import { PremiumSlot } from '@/features/premium/PremiumSlot';
import { usePremium } from '@/features/premium/usePremium';
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
import { DezeWeek, GeheugenKaart, PerVak, WeekNaWeek } from './Overzicht';
import { geheugen, perVak, perWeek, procentGoedVan, type Antwoord } from './statistiek';

/**
 * K9, "Wat je onthoudt": the one screen that answers the question the product
 * is named after (ADR-112, ADR-114), and since ADR-148 also the one that says
 * how the practising goes.
 *
 * **It opens on the whole of it** (`Overzicht.tsx`): what you remember over
 * every subject, with the three-week forecast as a ring; this week in four
 * tiles; and, with premium, each subject as a bar and the questions of the last
 * eight weeks as a chart. Every number about practising that stood elsewhere —
 * the week on Voor ouders, the rounds and questions on the streak page, "Goed
 * beantwoord" in the column — stands here now and nowhere else.
 *
 * **Then one subject**, as before: which subject as chips — the module first, then the set, the chosen one
 * in the module's colour — then **four tiles** that say where the whole set
 * stands, then the dots, then the table, and last the rules.
 *
 * **The four tiles are the four statuses**, and they add up to the set:
 * onthoud je, even opfrissen, nog aan het oefenen, nog niet geoefend. "Vandaag
 * op de rol" was the fourth and is gone (ADR-114): it was the scheduler's word
 * for what is due, which is a fact about the schedule and not about what a
 * child remembers, and it is what the next round asks anyway.
 *
 * **The table is how the practising has gone**, not when it comes back: how
 * many times each one was answered, the share of those that was right, and
 * how many days ago it was last answered. "Weer op" — a date the scheduler
 * chose — made a child plan around the algorithm.
 *
 * **The rules are written out**, as the streak's are (ADR-110). What counts as
 * remembering changed in ADR-114, and a definition nobody can read is one
 * nobody can trust.
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

/** The four statuses, in the order a child moves through them. */
const STATUSSEN: readonly ItemStatus[] = ['new', 'practising', 'remembered', 'refresh'];

/** How many weeks the chart looks back: two months, and this week last. */
const WEKEN = 8;

/** What remembering means, in the order a child meets it. */
const REGELS: readonly TranslationKey[] = [
  'retention.regel1',
  'retention.regel2',
  'retention.regel3',
  'retention.regel4',
];

/** Where a subject row in Per vak takes you. */
const ONDERWERP_ID = 'onthouden-onderwerp';

export function RetentionScreen({ aside }: { readonly aside: ReactNode }) {
  const { actief } = usePremium();
  return <Onthouden aside={aside} premium={actief} />;
}

function Kop() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="tk-titel">{t('retention.title')}</h1>
      <p className="text-lopend text-tekst-secundair">{t('retention.intro')}</p>
    </div>
  );
}

function Regels() {
  return (
    <section className="flex flex-col gap-3" aria-label={t('retention.regelsTitel')}>
      <Uitklap open={t('retention.regelsTitel')} titel={t('uitklap.uitlegDicht')}>
        <ul className="flex list-disc flex-col gap-2 pl-6 text-lopend">
          {REGELS.map((regel) => (
            <li key={regel}>{t(regel)}</li>
          ))}
        </ul>
      </Uitklap>
    </section>
  );
}

function Onthouden({ aside, premium }: { readonly aside: ReactNode; readonly premium: boolean }) {
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
      <div className="tk-page" aria-busy="true">
        <div className="tk-page-main">
          <h1 className="tk-titel">{t('retention.title')}</h1>
          <p className="text-tekst-secundair">{t('practice.loading')}</p>
        </div>
      </div>
    );
  }

  const modules = BUILT_MODULES;
  const soorten = moduleId === 'tafels' ? somSoorten(states) : [];
  const soort = soorten.find((vak) => vak.id === soortId) ?? soorten[0] ?? null;
  // Taal asks which part first, as its own page does (ADR-118).
  const delen = moduleId === 'woorden' ? regiosVan('woorden') : [];
  const deelKeuze = delen.find((kandidaat) => kandidaat.id === soortId) ?? delen[0] ?? null;
  const sets = setsVan(moduleId, states, deelKeuze?.id ?? soort?.id ?? null);
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
      onderwerpenVan(module.id, states)
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

  const tegels: readonly (readonly [TranslationKey, number])[] = [
    ['retention.tegelOnthouden', telling.remembered],
    ['retention.tegelOpfrissen', telling.refresh],
    ['retention.tegelOefenen', telling.practising],
    ['retention.tegelNieuw', telling.new],
  ];

  return (
    <div className="tk-page">
      <div className="tk-page-main" data-module={moduleId} data-accent="module">
        <Kop />

        <GeheugenKaart stand={geheugen(states, now)} />

        <DezeWeek rondes={rondes} now={now} />

        {premium ? (
          <>
            <PerVak vakken={vakken} modules={modules} onKies={kiesVak} />
            <WeekNaWeek
              weken={perWeek(antwoorden, now, WEKEN)}
              procentGoed={procentGoedVan(antwoorden)}
              rondes={rondes.length}
              vragen={antwoorden.length}
            />
          </>
        ) : null}

        <h2 id={ONDERWERP_ID} className="tk-sectie" tabIndex={-1}>
          {t('retention.onderwerpTitel')}
        </h2>

        {/* Which subject: the module, then the set. Chips rather than a
            select: every option is worth seeing, and a select on a touch
            screen is a menu that covers the thing you were looking at.
            Zonder code staan ze er niet (ADR-124): de pagina laat dan één
            onderwerp zien en zegt welk. */}
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

        <dl className="tk-cijfers">
          {tegels.map(([label, waarde]) => (
            <div key={label} className="tk-cijfer">
              <dt className="tk-cijfer-label">{t(label)}</dt>
              <dd className="tk-cijfer-getal">{waarde}</dd>
            </div>
          ))}
        </dl>

        <section className="flex flex-col gap-3" aria-label={t('retention.glance')}>
          <h2 className="tk-sectie">{t('retention.glance')}</h2>
          <div className="tk-card flex flex-col gap-4">
            <Heatmap moduleId={moduleId} items={items} states={states} now={now} />
            {/* The legend is the table's own four labels: one language for
                both views. */}
            <ul className="flex flex-wrap gap-x-6 gap-y-2 border-t border-rand-licht pt-3">
              {STATUSSEN.map((status) => (
                <li key={status}>
                  <StatusLabel status={status} />
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* De tabel staat er nog, maar niet vooraan (ADR-143). Zes kolommen
            met een percentage en een voorspelling over drie weken zijn voor de
            volwassene in de kamer; een kind dat deze pagina opent ziet het
            beeld erboven. */}
        <section className="flex flex-col gap-3" aria-label={t('retention.detail')}>
          <h2 className="tk-sectie">{t('retention.detail')}</h2>
          {!premium ? <PremiumSlot wat="premium.wat.onthouden" /> : null}
          {/* A stop in the tab order with a name of its own: on a phone the
              table is wider than the screen and scrolls sideways inside its
              card, and a region that scrolls has to be reachable from the
              keyboard too (axe, scrollable-region-focusable) — as the rows on
              the front door are (ScrollRij). */}
          {premium ? (
            <Uitklap open={t('uitklap.tabel')} titel={t('uitklap.tabelDicht')}>
              <div
                className="tk-tabelkaart"
                role="group"
                aria-label={t('retention.detail')}
                tabIndex={0}
              >
                <RetentionTable moduleId={moduleId} items={items} states={states} now={now} />
              </div>
            </Uitklap>
          ) : null}
        </section>

        <Regels />
      </div>

      {aside}
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
function setsVan(
  moduleId: Module['id'],
  states: ReadonlyMap<string, ItemState>,
  onderwerpId: string | null,
): Onderdeel[] {
  const gezien = new Set<string>();
  const sets: Onderdeel[] = [];
  for (const vak of onderwerpenVan(moduleId, states)) {
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

/** Rekenen's kinds of sum that hold a set of their own: not the mix, not the mistakes. */
function somSoorten(states: ReadonlyMap<string, ItemState>) {
  return onderwerpenVan('tafels', states).filter(
    (vak) => vak.id !== 'fouten' && vak.sets.some((deel) => !deel.mix),
  );
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
 */
function Heatmap({
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
    <div className="flex flex-wrap gap-2" role="list" aria-label={t('retention.glance')}>
      {items.map((item) => {
        const state = states.get(item.id);
        const status = t(`status.${statusOf(state, now)}` as TranslationKey);

        return (
          <span key={item.id} role="listitem">
            <Dot
              size={24}
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
                  <Dot size={24} fill={retentionOf(state)} />
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
