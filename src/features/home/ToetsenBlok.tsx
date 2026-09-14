import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/Button';
import { PaperIcon, PlusIcon } from '@/components/Icon';
// The streak already needs "which day is it, locally" and writes it the same
// way. One of them, so a date that is Tuesday to the streak cannot be Monday
// to the test.
import { dayKey, retentionAfterRound, setRetention, type ItemState } from '@/game-core';
import { startbareOnderdelen } from '@/features/module/onderdelen';
import { PremiumSlot } from '@/features/premium/PremiumSlot';
import { usePremium } from '@/features/premium/usePremium';
import { MODULE_ICON } from '@/features/shell/moduleIcons';
import type { Module } from '@/features/shell/modules';
import { useDesk } from '@/features/shell/useSmallScreen';
import { t } from '@/i18n';
import { loadItemStates } from '@/store/progress';
import { Blok } from './Blok';
import { daysUntil, TEST_SUBJECTS, useTestPlan, type Toets } from './testPlan';
import { toetsOnderdelen } from './toetsZicht';

/**
 * The tests that are coming, and a way to add one.
 *
 * It was the one block on K1 with a surface and a border, in the middle of the
 * page. The redesign moves it to the top of the child's own column from 1200
 * and to the second place in the flow below that (ADR-094), in the same card
 * shape as the three blocks it now stands with. What it holds did not change:
 * every test the child told us about, soonest first, each with its subject and
 * a way to take it off the list — and nothing else (ADR-077).
 *
 * **Two sizes of the same block.** Where there is a column for it, it is the
 * whole thing at once. Below 1200 the handoff draws only the dates — the
 * subject's mark and "over 3 dagen" — because that is what the block is for at
 * a glance on a tablet or a phone. The rest is not dropped: pressing the dates
 * opens the block into the whole thing, and "Klaar" closes it again. A block
 * with no tests in it has nothing to glance at, so it opens whole.
 *
 * There is no date picker of our own. `<input type="date">` is the platform's,
 * keyboard- and screen-reader-navigable for free, and the subject is a
 * `<select>` for the same reason. It lists only modules that exist: a test set
 * for a module with no content is a promise this product does not make.
 *
 * It draws before the tests have arrived, and "nog geen toetsdatum" is what it
 * says in the meantime — on WebKit the read takes long enough to see, and a
 * block that waits is a block that is absent and then pushes everything down.
 */
export function ToetsenBlok({ now = new Date() }: { readonly now?: Date }) {
  const plan = useTestPlan(now);
  const desk = useDesk();
  const { actief } = usePremium();
  const [states, setStates] = useState<ReadonlyMap<string, ItemState> | null>(null);

  useEffect(() => {
    void loadItemStates().then(setStates);
  }, []);
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const kort = useRef<HTMLButtonElement>(null);
  const toevoegen = useRef<HTMLButtonElement>(null);
  const eerste = useRef(true);

  // Focus follows the block open and shut. The control that was pressed is
  // gone either way — the dates become the list, "Klaar" becomes the dates —
  // and focus left on nothing starts a keyboard back at the top of the page.
  useEffect(() => {
    if (eerste.current) {
      eerste.current = false;
      return;
    }
    (open ? toevoegen : kort).current?.focus();
  }, [open]);

  const heel = desk || open || plan.toetsen.length === 0;

  return (
    <Blok titel={t('home.testTitle')} module={plan.subject ?? undefined}>
      {!heel ? (
        <button
          ref={kort}
          type="button"
          className="tk-toetsen-kort"
          aria-expanded={false}
          onClick={() => setOpen(true)}
        >
          {plan.toetsen.map((toets) => (
            <span
              key={toets.id}
              className="tk-toetsen-kort-item"
              data-module={toets.subject ?? undefined}
            >
              <VakPlaat subject={toets.subject} />
              {wanneerKort(toets, now)}
            </span>
          ))}
          <span className="tk-sr-only">{t('home.testsChange')}</span>
        </button>
      ) : (
        <>
          {plan.toetsen.length === 0 ? (
            <p className="text-tekst-secundair">{t('home.testNone')}</p>
          ) : (
            <ul className="tk-toets-lijst">
              {plan.toetsen.map((toets) => (
                <ToetsRegel
                  key={toets.id}
                  toets={toets}
                  now={now}
                  states={actief ? states : null}
                  onRemove={() => plan.remove(toets.id)}
                />
              ))}
            </ul>
          )}

          {/* Wat premium hier doet, zonder het per toets te herhalen (ADR-127). */}
          {!actief && plan.toetsen.length > 0 ? <PremiumSlot kaal wat="premium.wat.toets" /> : null}

          <button
            ref={toevoegen}
            type="button"
            className="tk-blok-knop"
            aria-expanded={adding}
            onClick={() => setAdding(!adding)}
          >
            <PlusIcon size={20} />
            {t('home.testAdd')}
          </button>

          {adding ? (
            <ToetsToevoegen
              now={now}
              onAdd={(date, subject) => {
                plan.add(date, subject);
                setAdding(false);
              }}
            />
          ) : null}

          {!desk && open ? (
            <button
              type="button"
              className="tk-blok-knop"
              onClick={() => {
                setOpen(false);
                setAdding(false);
              }}
            >
              {t('home.testsDone')}
            </button>
          ) : null}
        </>
      )}
    </Blok>
  );
}

/** "Vandaag", "Morgen", "Over 3 dagen": the block's heading already says "toets". */
function wanneerKort(toets: Toets, now: Date): string {
  const days = daysUntil(toets.date, now);
  if (days === 0) return t('home.testSoonToday');
  if (days === 1) return t('home.testSoonTomorrow');
  return t('home.testSoonDays', { aantal: days });
}

/**
 * The whole sentence, for the one place it is heard out of context: the button
 * that takes the test away.
 */
function wanneerLang(toets: Toets, now: Date): string {
  const days = daysUntil(toets.date, now);
  if (days === 0) return t('home.testToday');
  if (days === 1) return t('home.testTomorrow');
  return t('home.testInDays', { aantal: days });
}

/** One test: what it is about, when it is, and a way to take it off the list. */
function ToetsRegel({
  toets,
  now,
  states,
  onRemove,
}: {
  readonly toets: Toets;
  readonly now: Date;
  /** De Leitner-standen, of null zonder code: dan is er geen voorspelling. */
  readonly states: ReadonlyMap<string, ItemState> | null;
  readonly onRemove: () => void;
}) {
  const subject = TEST_SUBJECTS.find((module) => module.id === toets.subject) ?? null;
  const VakIcon = subject ? MODULE_ICON[subject.id] : null;

  return (
    <li className="tk-toets" data-module={subject?.id}>
      {/* Which subject, as a badge in the module's own tint — the module's
          mark and name, which is the entrance an accent may paint. */}
      {subject && VakIcon ? (
        <span className="tk-vakbadge">
          <VakIcon size={16} />
          {t(subject.name)}
        </span>
      ) : (
        <span className="text-tekst-secundair">{t('home.testSubjectNone')}</span>
      )}

      <span className="tk-toets-wanneer">{wanneerKort(toets, now)}</span>

      <button
        type="button"
        className="tk-toets-weg"
        aria-label={t('home.testRemoveOne', { wanneer: wanneerLang(toets, now) })}
        onClick={onRemove}
      >
        {t('home.testRemove')}
      </button>

      {states === null ? null : <Vooruitzicht toets={toets} now={now} states={states} />}
    </li>
  );
}

/**
 * Wat je op de dag van de toets naar verwachting nog weet — en wat één ronde
 * vandaag daaraan verandert (ADR-127).
 *
 * Het toetsblok was een aftelklok: een vak en "over 3 dagen", en verder niets.
 * De machinerie om er meer van te maken lag er al: `itemRetention` neemt elke
 * datum, dus ook de dag van de toets, en `retentionAfterRound` rekent uit wat
 * een ronde vandaag oplevert. Dat is precies de vraag waar een ouder die de
 * brief van school leest mee zit, en het is de enige plek in het product waar
 * de voorspelling ergens naartoe rekent in plaats van naar drie weken vooruit.
 *
 * **Alleen over wat dit kind geoefend heeft** (`toetsOnderdelen`). Heeft het van
 * dat vak nog niets gedaan, dan staat er dat, en geen nul procent: nul is een
 * uitspraak, en over iets wat nooit gevraagd is valt niets te zeggen.
 *
 * **De tweede zin alleen als hij iets toevoegt.** "Doe vandaag een ronde: dan is
 * het 62%" naast een 61% is ruis, en een advies dat niets verandert leert een
 * kind het advies te negeren.
 */
function Vooruitzicht({
  toets,
  now,
  states,
}: {
  readonly toets: Toets;
  readonly now: Date;
  readonly states: ReadonlyMap<string, ItemState>;
}) {
  const ids = toetsOnderdelen(toets.subject, startbareOnderdelen(), states);
  if (ids.length === 0) {
    return <p className="tk-toets-zicht text-tekst-secundair">{t('home.testNothingYet')}</p>;
  }

  const dag = new Date(`${toets.date}T12:00:00`);
  const nu = setRetention(states, ids, dag);
  const na = retentionAfterRound(states, ids, dag, now);
  // Vijf procentpunt of meer, anders is het advies ruis. Hierboven uitgerekend
  // en niet in de JSX: een vergelijking tussen accolades leest als tekst.
  const helptHet = na - nu >= 5;

  return (
    <p className="tk-toets-zicht">
      <span>{t('home.testForecast', { procent: nu })}</span>
      {helptHet ? <span> {t('home.testForecastRound', { procent: na })}</span> : null}
    </p>
  );
}

/** The subject's mark on its tint, or a sheet of paper where no subject was chosen. */
function VakPlaat({ subject }: { readonly subject: Module['id'] | null }) {
  if (subject === null) {
    return (
      <span className="tk-plaat tk-plaat-neutraal">
        <PaperIcon size={20} />
      </span>
    );
  }

  const VakIcon = MODULE_ICON[subject];
  return (
    <span className="tk-plaat">
      <VakIcon size={20} />
    </span>
  );
}

/**
 * A test being added: a date, a subject, and a button that means it.
 *
 * A form rather than two fields that save as you touch them, because adding is
 * a thing with an end: a half-typed date would otherwise become a row. One
 * field under the other at every size, because the column it stands in from
 * 1200 is 320 wide.
 */
function ToetsToevoegen({
  now,
  onAdd,
}: {
  readonly now: Date;
  readonly onAdd: (date: string, subject: string) => void;
}) {
  const [date, setDate] = useState(dayKey(now));
  const [subject, setSubject] = useState('');

  function submit(event: FormEvent) {
    event.preventDefault();
    if (date === '') return;
    onAdd(date, subject);
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={submit}>
      <label className="flex min-w-0 flex-col gap-2">
        <span className="text-tekst-secundair">{t('home.testPick')}</span>
        <input
          type="date"
          className="tk-input"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
      </label>

      <label className="flex min-w-0 flex-col gap-2">
        <span className="text-tekst-secundair">{t('home.testSubjectPick')}</span>
        <select
          className="tk-input"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
        >
          <option value="">{t('home.testSubjectNone')}</option>
          {TEST_SUBJECTS.map((module) => (
            <option key={module.id} value={module.id}>
              {t(module.name)}
            </option>
          ))}
        </select>
      </label>

      <Button type="submit">{t('home.testSave')}</Button>
    </form>
  );
}
