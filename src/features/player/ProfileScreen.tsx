import { useEffect, useId, useState, type FormEvent, type ReactNode } from 'react';
import { t } from '@/i18n';
import { CorrectIcon, FamilyIcon, NextIcon, PupilIcon, SpeakIcon } from '@/components/Icon';
import { dayKey, grade, formatGrade } from '@/game-core';
import { createChild, listChildren, renameChild, switchChild } from '@/store/children';
import type { ProfileRecord } from '@/store/db';
import { loadPlayedRounds, type PlayedRound } from '@/store/progress';
import { geplaatst, naamVan, startbareOnderdelen } from '@/features/module/onderdelen';
import { Tafeldiplomas } from '@/features/module/Tafeldiplomas';
import { VlagDiplomas } from '@/features/vlaggen/VlagDiplomas';
import { KlokDiplomas } from '@/features/klok/KlokDiplomas';
import { TopoDiplomas } from '@/features/module/TopoDiplomas';
import { BadgeSectie } from '@/features/badges/Badges';
import { leesbareDatum, useNaarPremium, usePremium } from '@/features/premium/usePremium';
import { dagenGeldig, isVerlopen, verlooptBinnenkort } from '@/store/premium';
import { useTestPlan, daysUntil } from '@/features/home/testPlan';
import { DEFAULT_PREFERENCES, loadPreferences, savePreference, type Preferences } from './settings';
import { Weekbericht } from './Weekbericht';

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
  now = new Date(),
}: {
  readonly profile: ProfileRecord;
  readonly aside: ReactNode;
  readonly now?: Date;
}) {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [loaded, setLoaded] = useState(false);
  const [rondes, setRondes] = useState<readonly PlayedRound[] | null>(null);

  useEffect(() => {
    void loadPlayedRounds().then(setRondes);
  }, []);

  const afgemaakt = (rondes ?? []).map((ronde) => ronde.at);

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
        </div>

        {/* Wie je bent, bovenaan (ADR-126). Deze pagina heet "Jij" en begon met
            drieënveertig lege prijzenkasten: tien badges, twaalf tafels, zes
            vlaggen, vier klokken en elf kaarten, allemaal "nog niet", voordat er
            één woord over de gebruiker stond. En de naam die het kind op het
            eerste scherm typte was nergens te veranderen. Nu eerst de persoon,
            dan wat die deze week deed, dan de kast, en onderaan wat van de ouder
            is: het gezin, premium en de instellingen. */}
        <Ikben profile={profile} />

        <Week rondes={rondes} />

        {/* Boven dit blok staan de feiten, hier staat de lezing ervan — de vraag
            achter een abonnement is niet "hoeveel rondes" maar "gaat het goed"
            (ADR-133). De rondes worden één keer gelezen en door beide gebruikt. */}
        <Weekbericht afgemaakt={afgemaakt} now={now} />

        <Prijzenkast />

        <Children active={profile} />

        <PremiumBlok />

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
            <li>
              <Switch
                on={prefs.geluid}
                label={t('you.geluid')}
                why={t('you.geluidWhy')}
                onToggle={() => toggle('geluid')}
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

/** Zo lang als het naamscherm toestaat (`ProfileGate`): één limiet, twee velden. */
const NAAM_MAX = 24;

/**
 * Wie er oefent, en hoe die heet (ADR-126).
 *
 * De naam en de held stonden er als een regel tekst onder de titel — "Je oefent
 * als Noor" — en waren geen van beide aan te raken. De held kiest een kind op
 * zijn eigen pagina; de naam kon nergens. Hier staat hij, met één knop ernaast.
 *
 * Hernoemen raakt alleen de naam: het id blijft, dus elke Leitner-doos, elk
 * diploma en elke dag van de reeks blijft bij dit kind horen.
 */
function Ikben({ profile }: { readonly profile: ProfileRecord }) {
  const [open, setOpen] = useState(false);
  const [naam, setNaam] = useState(profile.naam);
  const [bezig, setBezig] = useState(false);
  const veld = useId();

  async function bewaar(event: FormEvent) {
    event.preventDefault();
    if (naam.trim() === '' || naam.trim() === profile.naam) {
      setOpen(false);
      return;
    }
    setBezig(true);
    await renameChild(profile.id, naam);
    // Elk scherm houdt een stukje van dit kind in React-state, en de naam staat
    // ook in de balk. Opnieuw laden is bot en het is het juiste: het is de
    // enige manier waarop nergens de oude naam blijft staan (zoals switchChild).
    window.location.reload();
  }

  return (
    <section className="flex flex-col gap-3" aria-label={t('you.who')}>
      <h2 className="tk-sectie">{t('you.who')}</h2>

      {open ? (
        <form className="tk-card flex flex-col gap-3" onSubmit={(event) => void bewaar(event)}>
          <label htmlFor={veld} className="tk-label">
            {t('you.childName')}
          </label>
          <input
            id={veld}
            className="tk-input max-w-xs"
            value={naam}
            onChange={(event) => setNaam(event.target.value)}
            maxLength={NAAM_MAX}
            autoComplete="off"
            autoFocus
          />
          <div className="flex flex-wrap gap-3">
            <button type="submit" className="tk-button self-start" disabled={bezig}>
              {t('you.nameSave')}
            </button>
            <button
              type="button"
              className="tk-button tk-button-tertiary self-start"
              onClick={() => {
                setNaam(profile.naam);
                setOpen(false);
              }}
            >
              {t('you.nameCancel')}
            </button>
          </div>
        </form>
      ) : (
        <div className="tk-card flex flex-wrap items-center justify-between gap-3">
          <p className="text-lopend">{t('you.nameIs', { naam: profile.naam })}</p>
          <button
            type="button"
            className="tk-button tk-button-secondary"
            onClick={() => setOpen(true)}
          >
            {t('you.nameChange')}
          </button>
        </div>
      )}
    </section>
  );
}

/**
 * De prijzenkast: de badges en de vier muren met diploma's, onder één kop.
 *
 * Ze stonden als vijf losse secties boven aan de pagina, samen goed voor
 * drieënveertig vakjes die op dag één allemaal leeg zijn. Dat is niet minder
 * waard geworden — de gaten zijn juist het punt (ADR-064) — maar het is wat een
 * kind ziet nadat het iets gedaan heeft, niet waarmee een pagina over hemzelf
 * hoort te beginnen.
 */
function Prijzenkast() {
  return (
    <div className="flex flex-col gap-6">
      <BadgeSectie />
      <Tafeldiplomas />
      <VlagDiplomas />
      <KlokDiplomas />
      <TopoDiplomas />
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
  const { actief } = usePremium();
  const [children, setChildren] = useState<ProfileRecord[]>([]);
  const [adding, setAdding] = useState(false);
  const [naam, setNaam] = useState('');

  useEffect(() => {
    void listChildren().then(setChildren);
  }, []);

  // Meer dan één kind is premium (ADR-116). Zonder code staat deze sectie er
  // niet meer (ADR-124): wie in zijn eentje oefent heeft geen wisselaar nodig,
  // en het premiumblok onderaan deze pagina noemt het.
  if (!actief) return null;

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
 * Premium, for the adult in the room (ADR-116): on or off on this device, until
 * when, and the way to the page where a code is entered or taken off again.
 */
function PremiumBlok({ now = new Date() }: { readonly now?: Date }) {
  const { actief, stand } = usePremium();
  const naarPremium = useNaarPremium();

  const dagen = dagenGeldig(stand, now);
  const verlopen = isVerlopen(stand, now);
  const bijnaAf = actief && verlooptBinnenkort(stand, now);

  // Met code is dit een statusregel voor de volwassene: staat het aan, tot
  // wanneer, en waar je het afzet. Zonder code is het het enige premiumblok op
  // deze pagina, en dan zegt het wat er mist in plaats van dat er iets mist
  // (ADR-124). Vijf sloten werden er één.
  //
  // En sinds ADR-129 een derde geval, dat er het langst het meest toe doet:
  // een jaar loopt af. Een ouder die niets hoort merkt het pas als het dagplan
  // op een dinsdag weg is, en dat is geen opzegging maar een verrassing.
  return (
    <section className="flex flex-col gap-3" aria-label={t('you.premium')}>
      <h2 className="tk-sectie">{t('you.premium')}</h2>
      <p className="text-tekst-secundair">
        {verlopen && stand
          ? t('you.premiumVerlopen', { datum: leesbareDatum(stand.geldigTot) })
          : actief && stand
            ? afloopZin(stand.geldigTot, bijnaAf, dagen)
            : t('premium.wat.jij')}
      </p>
      <button
        type="button"
        className="tk-button tk-button-secondary self-start"
        onClick={naarPremium}
      >
        {verlopen
          ? t('you.premiumVerleng')
          : actief
            ? t('you.premiumBekijk')
            : t('premium.slotKnop')}
      </button>
    </section>
  );
}

/**
 * Hoeveel er nog van het jaar over is, in de woorden die erbij horen.
 *
 * Losse zinnen voor vandaag en morgen, want "over 0 dagen" is geen Nederlands
 * en "over 1 dagen" is erger. Dezelfde vorm als het toetsblok gebruikt.
 */
function afloopZin(geldigTot: string, bijnaAf: boolean, dagen: number | null): string {
  const datum = leesbareDatum(geldigTot);
  if (!bijnaAf || dagen === null) return t('you.premiumAan', { datum });
  if (dagen === 0) return t('you.premiumVandaag');
  if (dagen === 1) return t('you.premiumMorgen');
  return t('you.premiumBijna', { datum, dagen });
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
function Week({
  rondes,
  now = new Date(),
}: {
  readonly rondes: readonly PlayedRound[] | null;
  readonly now?: Date;
}) {
  const plan = useTestPlan(now);

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
