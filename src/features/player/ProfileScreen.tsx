import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { t } from '@/i18n';
import { CorrectIcon, FamilyIcon, NextIcon, PupilIcon, SpeakIcon } from '@/components/Icon';
import { dayKey, grade, formatGrade } from '@/game-core';
import { createChild, listChildren, switchChild } from '@/store/children';
import type { ProfileRecord } from '@/store/db';
import { loadPlayedRounds, type PlayedRound } from '@/store/progress';
import { geplaatst, naamVan, startbareOnderdelen } from '@/features/module/onderdelen';
import { Tafeldiplomas } from '@/features/module/Tafeldiplomas';
import { VlagDiplomas } from '@/features/vlaggen/VlagDiplomas';
import { BadgeSectie } from '@/features/badges/Badges';
import { useTestPlan, daysUntil } from '@/features/home/testPlan';
import { DEFAULT_PREFERENCES, loadPreferences, savePreference, type Preferences } from './settings';

/**
 * K10, "Jij": the child's own page (ADR-112).
 *
 * In the order a child reads it. **What they have earned** first — the badges
 * and the two walls of diplomas, which used to be on the collection page and
 * are the part of it that stays while the rest is thought through again. Then
 * **this week**, for the adult in the room, as the same tiles the streak page
 * uses. Then **who is practising**, and the one switch.
 *
 * Most of what the design draws here needs something that does not exist yet.
 * The avatar set, the group, the friend code all belong to the parent account
 * of ADR-046 or to the friend layer, and none of it is built — so none of it is
 * drawn. A settings screen full of controls that do nothing is worse than a
 * short one that works.
 *
 * School and place of residence are not here and never will be. They are the
 * two fields that would turn a name on a device into a child somebody could
 * find, and nothing this product does needs them.
 */
export function ProfileScreen({
  profile,
  aside,
}: {
  readonly profile: ProfileRecord;
  readonly aside: ReactNode;
}) {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void loadPreferences().then((value) => {
      setPrefs(value);
      setLoaded(true);
    });
  }, []);

  /**
   * The switch moves after the write, not before it. Flipping it first and
   * writing afterwards reads a few milliseconds sooner and is a lie the moment
   * the write does not land. What the switch shows is what is stored.
   */
  const toggle = (name: keyof Preferences) => {
    const next = { ...prefs, [name]: !prefs[name] };
    void savePreference(name, next[name]).then(() => setPrefs(next));
  };

  return (
    <div className="tk-page">
      <div className="tk-page-main">
        <div className="flex flex-col gap-2">
          <h1 className="tk-titel">{t('you.title')}</h1>
          <p className="text-lopend text-tekst-secundair">
            {t('you.nameIs', { naam: profile.naam })}
          </p>
        </div>

        <BadgeSectie />
        <Tafeldiplomas />
        <VlagDiplomas />

        <Week />

        <Children active={profile} />

        <section className="flex flex-col gap-3" aria-label={t('you.settings')} aria-busy={!loaded}>
          <h2 className="tk-sectie">{t('you.settings')}</h2>
          <ul className="tk-lijst">
            <li>
              <Switch
                on={prefs.readAloud}
                label={t('you.readAloud')}
                why={t('you.readAloudWhy')}
                onToggle={() => toggle('readAloud')}
              />
            </li>
          </ul>
        </section>

        <p className="tk-hulp">{t('you.stays')}</p>
      </div>

      {aside}
    </div>
  );
}

/**
 * The family on this device, ADR-046.
 *
 * A child here is a name and a set of boxes, not an account: no password, no
 * e-mail, nothing to sign in to. What it fixes is the failure that was already
 * in the schema — three children on one iPad were one learner as far as the
 * scheduler was concerned, and the youngest kept being asked the eldest's
 * provinces.
 *
 * Switching reloads the page. That is blunt and it is right: every screen holds
 * some of a child's work in React state, and the one thing this must never do
 * is show one child a number that belongs to another.
 */
function Children({ active }: { readonly active: ProfileRecord }) {
  const [children, setChildren] = useState<ProfileRecord[]>([]);
  const [adding, setAdding] = useState(false);
  const [naam, setNaam] = useState('');

  useEffect(() => {
    void listChildren().then(setChildren);
  }, []);

  async function add(event: FormEvent) {
    event.preventDefault();
    if (naam.trim().length === 0) return;
    await createChild(naam);
    window.location.reload();
  }

  async function give(id: string) {
    await switchChild(id);
    window.location.reload();
  }

  return (
    <section className="flex flex-col gap-3" aria-label={t('you.children')}>
      <h2 className="tk-sectie">{t('you.children')}</h2>

      {children.length > 0 ? (
        <ul className="tk-lijst">
          {children.map((child) => {
            const actief = child.id === active.id;

            return (
              <li key={child.id}>
                {/* The one practising cannot be handed the turn again: there is
                    nothing to do, and a control that does nothing lies. */}
                <button
                  type="button"
                  className="tk-lijstrij"
                  aria-pressed={actief}
                  disabled={actief}
                  onClick={() => void give(child.id)}
                >
                  <span className="tk-plaat tk-plaat-neutraal">
                    <PupilIcon size={24} />
                  </span>
                  <span className="tk-lijstrij-tekst">
                    <span className="tk-lijstrij-titel">{child.naam}</span>
                    <span className="tk-lijstrij-regel">
                      {actief ? t('you.practisingNow') : t('you.switchTo', { naam: child.naam })}
                    </span>
                  </span>
                  <span className="tk-lijstrij-pijl">
                    {actief ? <CorrectIcon size={20} /> : <NextIcon size={20} />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {adding ? (
        <form onSubmit={add} className="flex flex-wrap items-center gap-3">
          <label htmlFor="kind" className="tk-sr-only">
            {t('you.childName')}
          </label>
          <input
            id="kind"
            className="tk-input max-w-xs"
            value={naam}
            onChange={(event) => setNaam(event.target.value)}
            placeholder={t('you.childName')}
            autoComplete="off"
            maxLength={24}
          />
          <button type="submit" className="tk-button" disabled={naam.trim().length === 0}>
            {t('you.add')}
          </button>
        </form>
      ) : (
        <button
          type="button"
          className="tk-button tk-button-secondary self-start"
          onClick={() => setAdding(true)}
        >
          <FamilyIcon size={24} />
          {t('you.addChild')}
        </button>
      )}

      {/* Said once, where a parent adding the second child will read it. */}
      <p className="tk-hulp">{t('you.childExplain')}</p>
    </section>
  );
}

/**
 * A setting as a row of the list: what it does, why, and a switch that shows
 * its state as a shape and in a word — "aan" and "uit" survive being colour
 * blind, and aria-pressed carries it to a screen reader without either.
 */
function Switch({
  on,
  label,
  why,
  onToggle,
}: {
  readonly on: boolean;
  readonly label: string;
  readonly why: string;
  readonly onToggle: () => void;
}) {
  return (
    <button type="button" className="tk-lijstrij" aria-pressed={on} onClick={onToggle}>
      <span className="tk-plaat tk-plaat-neutraal">
        <SpeakIcon size={24} />
      </span>
      <span className="tk-lijstrij-tekst">
        <span className="tk-lijstrij-titel">{label}</span>
        <span className="tk-lijstrij-regel">{why}</span>
      </span>
      <span className="tk-lijstrij-pijl">
        <span className="tk-schakelaar" aria-hidden="true" />
        <span className="tk-label">{on ? t('you.on') : t('you.off')}</span>
      </span>
    </button>
  );
}

/**
 * The week, for the adult in the room.
 *
 * "Jij" is the one screen in this product a parent opens, and what a parent
 * wants is three things: has there been any practice this week, how did it go,
 * and is there a test coming (ADR-079). Four tiles and two sentences.
 *
 * It is deliberately not a report on the child. No forecast, no percentage of
 * anything, no comparison. What it says is what happened: rounds, days,
 * questions, and the mark they came to. Seven days rather than "recently",
 * because a week is the unit a parent thinks in and a school test is set in.
 */
function Week({ now = new Date() }: { readonly now?: Date }) {
  const [rondes, setRondes] = useState<readonly PlayedRound[] | null>(null);
  const plan = useTestPlan(now);

  useEffect(() => {
    void loadPlayedRounds().then(setRondes);
  }, []);

  if (rondes === null) return null;

  const week = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
  const grens = dayKey(week);
  const deze = rondes.filter((ronde) => ronde.at.slice(0, 10) >= grens);
  const gespeeld = geplaatst(deze, startbareOnderdelen());

  const beantwoord = deze.reduce((total, ronde) => total + ronde.answered, 0);
  const goed = deze.reduce((total, ronde) => total + ronde.correct, 0);
  const dagen = new Set(deze.map((ronde) => ronde.at.slice(0, 10))).size;
  const cijfer = grade(goed, beantwoord);

  // What was practised most, which is the sentence a parent repeats back.
  const perSet = new Map<string, number>();
  for (const { deel, ronde } of gespeeld) {
    perSet.set(naamVan(deel), (perSet.get(naamVan(deel)) ?? 0) + ronde.answered);
  }
  const meest = [...perSet.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;

  const toets = plan.toetsen[0] ?? null;
  const dagenTot = toets === null ? null : daysUntil(toets.date, now);

  const tegels = [
    [t('you.tegelRondes'), String(deze.length)],
    [t('you.tegelDagen'), String(dagen)],
    [t('you.tegelVragen'), String(beantwoord)],
    [t('you.tegelCijfer'), cijfer === null ? t('you.geenCijfer') : formatGrade(cijfer)],
  ] as const;

  return (
    <section className="flex flex-col gap-3" aria-label={t('you.week')}>
      <h2 className="tk-sectie">{t('you.week')}</h2>

      {deze.length === 0 ? (
        <p className="text-tekst-secundair">{t('you.weekNone')}</p>
      ) : (
        <>
          <dl className="tk-cijfers">
            {tegels.map(([label, waarde]) => (
              <div key={label} className="tk-cijfer">
                <dt className="tk-cijfer-label">{label}</dt>
                <dd className="tk-cijfer-getal">{waarde}</dd>
              </div>
            ))}
          </dl>
          {meest ? (
            <p className="text-tekst-secundair">{t('you.weekMost', { set: meest[0] })}</p>
          ) : null}
        </>
      )}

      {toets !== null && dagenTot !== null ? (
        <p className="text-tekst-secundair">
          {dagenTot === 0
            ? t('home.testToday')
            : dagenTot === 1
              ? t('home.testTomorrow')
              : t('home.testInDays', { aantal: dagenTot })}
        </p>
      ) : null}
    </section>
  );
}
