import { useEffect, useState, type ReactNode } from 'react';
import { Dot } from '@/components/Dot';
import { StatusLabel, type ItemStatus } from '@/components/StatusLabel';
import {
  sumText,
  type Item,
  type ItemState,
  type KlokItem,
  type Schedulable,
  type SumItem,
  type VlagItem,
} from '@/game-core';
import { klokVoluit } from '@/features/klok/klokTaal';
import { naamVan, onderwerpenVan, type Onderdeel } from '@/features/module/onderdelen';
import { PremiumSlot } from '@/features/premium/PremiumSlot';
import { usePremium } from '@/features/premium/usePremium';
import { MODULE_ICON } from '@/features/shell/moduleIcons';
import { BUILT_MODULES, type Module } from '@/features/shell/modules';
import { t, type TranslationKey } from '@/i18n';
import { loadItemStates } from '@/store/progress';
import { aantalAntwoorden, dagenGeleden, procentGoed, retentionOf, statusOf } from './itemStatus';

/**
 * K9, "Wat je onthoudt": the one screen that answers the question the product
 * is named after (ADR-112, ADR-114).
 *
 * It knows every module a child can practise, in the shape of the rest of the
 * app: which subject as chips — the module first, then the set, the chosen one
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
 * Premium since ADR-116. The rules are there without a code as well: what
 * remembering means is not something to sell.
 */

/** The four statuses, in the order a child moves through them. */
const STATUSSEN: readonly ItemStatus[] = ['new', 'practising', 'remembered', 'refresh'];

/** What remembering means, in the order a child meets it. */
const REGELS: readonly TranslationKey[] = [
  'retention.regel1',
  'retention.regel2',
  'retention.regel3',
  'retention.regel4',
];

export function RetentionScreen({ aside }: { readonly aside: ReactNode }) {
  const { actief } = usePremium();

  if (!actief) {
    return (
      <div className="tk-page">
        <div className="tk-page-main">
          <Kop />
          <PremiumSlot />
          <Regels />
        </div>
        {aside}
      </div>
    );
  }

  return <Onthouden aside={aside} />;
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
      <h2 className="tk-sectie">{t('retention.regelsTitel')}</h2>
      <ul className="flex list-disc flex-col gap-2 pl-6 text-lopend">
        {REGELS.map((regel) => (
          <li key={regel}>{t(regel)}</li>
        ))}
      </ul>
    </section>
  );
}

function Onthouden({ aside }: { readonly aside: ReactNode }) {
  const [states, setStates] = useState<Map<string, ItemState> | null>(null);
  const [moduleId, setModuleId] = useState<Module['id']>('topo');
  /** Which kind of sum, on rekenen only. Null for the first. */
  const [soortId, setSoortId] = useState<string | null>(null);
  const [setId, setSetId] = useState<string | null>(null);

  useEffect(() => {
    void loadItemStates().then(setStates);
  }, []);

  if (states === null) {
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
  const sets = setsVan(moduleId, states, soort?.id ?? null);
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

        {/* Which subject: the module, then the set. Chips rather than a
            select: every option is worth seeing, and a select on a touch
            screen is a menu that covers the thing you were looking at. */}
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

        <section className="flex flex-col gap-3" aria-label={t('retention.detail')}>
          <h2 className="tk-sectie">{t('retention.detail')}</h2>
          {/* A stop in the tab order with a name of its own: on a phone the
              table is wider than the screen and scrolls sideways inside its
              card, and a region that scrolls has to be reachable from the
              keyboard too (axe, scrollable-region-focusable) — as the rows on
              the front door are (ScrollRij). */}
          <div
            className="tk-tabelkaart"
            role="group"
            aria-label={t('retention.detail')}
            tabIndex={0}
          >
            <RetentionTable moduleId={moduleId} items={items} states={states} now={now} />
          </div>
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
 * place or a flag, the sum as it is written, the time in full.
 */
function itemNaam(moduleId: Module['id'], item: Schedulable): string {
  if (moduleId === 'tafels') return sumText(item as SumItem);
  if (moduleId === 'klok') return klokVoluit(item as KlokItem);
  if (moduleId === 'vlaggen') return (item as VlagItem).naam;
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
              <td>{laatstGeoefend(dagenGeleden(state, now))}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
