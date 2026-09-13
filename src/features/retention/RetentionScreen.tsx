import { useEffect, useState, type ReactNode } from 'react';
import { Dot } from '@/components/Dot';
import { StatusLabel, type ItemStatus } from '@/components/StatusLabel';
import {
  isDue,
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
import { MODULE_ICON } from '@/features/shell/moduleIcons';
import { BUILT_MODULES, type Module } from '@/features/shell/modules';
import { t, type TranslationKey } from '@/i18n';
import { loadItemStates } from '@/store/progress';
import { dueLabel, retentionOf, statusOf } from './itemStatus';

/**
 * K9, "Wat je onthoudt": the one screen that answers the question the product
 * is named after (ADR-112).
 *
 * It used to know only topography's five Dutch sets. Now it knows every module
 * a child can practise, in the shape of the rest of the app: which subject as
 * chips — the module first, then the set, the chosen one in the module's
 * colour — then **four tiles** that say where the whole set stands, then the
 * dots, then the table.
 *
 * Two views of the same facts, and both are needed. The dots are all of it at
 * once, and they are what tells you whether this week went well without
 * reading anything; the table is the detail — which one, how often, when it
 * comes back. The dots are the same `Dot` as everywhere else rather than a new
 * chart, and the legend under them is the same four labels the table uses.
 */

/** The four statuses, in the order a child moves through them. */
const STATUSSEN: readonly ItemStatus[] = ['new', 'practising', 'remembered', 'frozen'];

export function RetentionScreen({ aside }: { readonly aside: ReactNode }) {
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

  const telling = { new: 0, practising: 0, remembered: 0, frozen: 0 } satisfies Record<
    ItemStatus,
    number
  >;
  let opDeRol = 0;
  for (const item of items) {
    const state = states.get(item.id);
    telling[statusOf(state)] += 1;
    if (state && state.laatsteReview !== null && isDue(state, now)) opDeRol += 1;
  }

  const tegels: readonly (readonly [TranslationKey, number])[] = [
    ['retention.tegelOnthouden', telling.remembered + telling.frozen],
    ['retention.tegelOefenen', telling.practising],
    ['retention.tegelNieuw', telling.new],
    ['retention.tegelRol', opDeRol],
  ];

  return (
    <div className="tk-page">
      <div className="tk-page-main" data-module={moduleId} data-accent="module">
        <div className="flex flex-col gap-2">
          <h1 className="tk-titel">{t('retention.title')}</h1>
          <p className="text-lopend text-tekst-secundair">{t('retention.intro')}</p>
        </div>

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
            <Heatmap moduleId={moduleId} items={items} states={states} />
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
          <div className="tk-tabelkaart">
            <RetentionTable moduleId={moduleId} items={items} states={states} now={now} />
          </div>
        </section>
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
}: {
  readonly moduleId: Module['id'];
  readonly items: readonly Schedulable[];
  readonly states: ReadonlyMap<string, ItemState>;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="list" aria-label={t('retention.glance')}>
      {items.map((item) => {
        const state = states.get(item.id);
        const status = t(`status.${statusOf(state)}` as TranslationKey);

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
  // Dutch, and short: a table column is not the place for "dinsdag 1 september".
  const day = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short' });

  return (
    <table className="tk-table">
      <thead>
        <tr>
          <th>{t('retention.item')}</th>
          <th>{t('retention.status')}</th>
          <th className="tk-num">{t('retention.correct')}</th>
          <th className="tk-num">{t('retention.due')}</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const state = states.get(item.id);
          const due = dueLabel(state, now);

          return (
            <tr key={item.id}>
              <td>
                <span className="flex items-center gap-2">
                  <Dot size={24} fill={retentionOf(state)} />
                  {itemNaam(moduleId, item)}
                </span>
              </td>
              <td>
                <StatusLabel status={statusOf(state)} />
              </td>
              {/* Right-aligned and tabular, so a column of them lines up on the
                  digit and the figure does not dance from row to row. */}
              <td className="tk-num">{state?.goedCount ?? 0}</td>
              <td className="tk-num">{due === 'due' ? t('retention.dueNow') : day.format(due)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
