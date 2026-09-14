import { useEffect, useState } from 'react';
import { t } from '@/i18n';
import { SpeakIcon } from '@/components/Icon';
import { dayKey, grade, formatGrade } from '@/game-core';
import { geplaatst, naamVan, startbareOnderdelen } from '@/features/module/onderdelen';
import { leesbareDatum, useNaarPremium, usePremium } from '@/features/premium/usePremium';
import { dagenGeldig, isVerlopen, verlooptBinnenkort } from '@/store/premium';
import { useTestPlan, daysUntil } from '@/features/home/testPlan';
import { loadPlayedRounds, type PlayedRound } from '@/store/progress';
import { DEFAULT_PREFERENCES, loadPreferences, savePreference, type Preferences } from './settings';
import { Weekbericht } from './Weekbericht';
import { EigenLijsten } from './EigenLijsten';
import type { ReactNode } from 'react';

/**
 * "Voor ouders": alles wat niet van het kind is (ADR-136).
 *
 * "Jij" was één pagina met acht blokken, waarvan er vijf niets met het kind te
 * maken hadden: de week met een cijfer, het weekbericht, de woordenlijsten van
 * school, premium en de instellingen van het apparaat. Dat is hoe het groeide —
 * er stond toch al iets van een ouder, dus kwam het volgende er ook bij — en
 * het gevolg was een pagina die "Jij" heet en voor de helft over de rekening
 * gaat.
 *
 * Nu twee pagina's. Hier staat wat een volwassene komt doen: kijken hoe het
 * gaat, de lijst van school invoeren, het abonnement regelen, de schakelaars
 * zetten. Op "Jij" staat wie het kind is en wat het verdiend heeft.
 *
 * **Geen slot ervoor.** Een oudersectie in een app voor kinderen wordt vaak
 * afgeschermd met een sommetje — en dit is een app waarin kinderen sommen
 * oefenen. Dat slot zou theater zijn: het houdt niemand tegen die het zou
 * moeten tegenhouden, en het kost de ouder elke keer een handeling. Wat deze
 * scheiding oplost is dat de verkeerde dingen op het verkeerde scherm staan,
 * niet dat een kind ze niet mag zien.
 */
export function ParentScreen({
  aside,
  onJij,
  now = new Date(),
}: {
  readonly aside: ReactNode;
  readonly onJij: () => void;
  readonly now?: Date;
}) {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [loaded, setLoaded] = useState(false);
  const [rondes, setRondes] = useState<readonly PlayedRound[] | null>(null);

  useEffect(() => {
    void loadPlayedRounds().then(setRondes);
  }, []);

  useEffect(() => {
    void loadPreferences().then((value) => {
      setPrefs(value);
      setLoaded(true);
    });
  }, []);

  const afgemaakt = (rondes ?? []).map((ronde) => ronde.at);

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
          <h1 className="tk-titel">{t('ouder.title')}</h1>
          <p className="text-lopend text-tekst-secundair">{t('ouder.uitleg')}</p>
        </div>

        <Week rondes={rondes} now={now} />

        {/* Boven dit blok staan de feiten, hier staat de lezing ervan — de vraag
            achter een abonnement is niet "hoeveel rondes" maar "gaat het goed"
            (ADR-133). De rondes worden één keer gelezen en door beide gebruikt. */}
        <Weekbericht afgemaakt={afgemaakt} now={now} />

        <EigenLijsten />

        <PremiumBlok now={now} />

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

        <p>
          <button type="button" className="tk-button tk-button-secondary" onClick={onJij}>
            {t('ouder.terug')}
          </button>
        </p>

        <p className="tk-hulp">{t('you.stays')}</p>
      </div>

      {aside}
    </div>
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
