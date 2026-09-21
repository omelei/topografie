import { useEffect, useId, useRef, useState, type ComponentType, type FormEvent } from 'react';
import { t } from '@/i18n';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CorrectIcon,
  FamilyIcon,
  type IconProps,
  NextIcon,
  OogIcon,
  PupilIcon,
  SpeakIcon,
  TodayIcon,
} from '@/components/Icon';
import { Uitklap } from '@/components/Uitklap';
import { createChild, listChildren, renameChild, switchChild } from '@/store/children';
import type { ProfileRecord } from '@/store/db';
import { Kast } from '@/features/badges/Kast';
import { usePremium } from '@/features/premium/usePremium';
import type { ModeId } from '@/game-core';
import type { Onderdeel } from '@/features/module/onderdelen';
import { Statistieken } from '@/features/retention/Statistieken';
import {
  GEEN_DOELEN,
  leesWeekdoelen,
  schrijfWeekdoelen,
  type Weekdoelen,
} from '@/store/weekdoelStore';
import { EigenLijsten } from './EigenLijsten';
import { GroepInstelling } from './GroepInstelling';
import { Jaaroverzicht } from './Jaaroverzicht';
import {
  DEFAULT_PREFERENCES,
  loadPreferences,
  savePreference,
  zetRustig,
  type Preferences,
} from './settings';
import { Wissen } from './Wissen';

/**
 * K10, "Jij": the child's own page (ADR-112), en sinds ADR-171 ook de pagina
 * waar al je cijfers staan.
 *
 * **Drie pagina's naast de oefeningen**: Vandaag, Jij en Premium. Vandaag
 * beantwoordt "wat doe ik nu?", Premium "wat krijg ik erbij, en tot wanneer?",
 * en Jij **"wat heb ik al bereikt, en blijft het hangen?"** — met daaronder wat
 * van jou is en wat je zelf instelt. Wat vooruitkijkt hoort op Vandaag, wat van
 * de rekening of van de ouder is op Premium (ADR-172).
 *
 * **In de volgorde van wat een kind hier komt halen** (ADR-172): wie er oefent,
 * alleen als er iets te kiezen valt; dan **wat je gehaald hebt** — de
 * diploma's, die sinds ADR-167 het hele beloningsprogramma zijn en het enige
 * blok met een knop die iets oplevert; dan **of het blijft hangen**, alle
 * cijfers; dan **wat je instelt**; en als laatste de weg om het er allemaal af
 * te halen (ADR-166).
 *
 * ADR-145 en ADR-171 hadden een andere volgorde: wie je bent, hoe het gaat, wat
 * je gehaald hebt. Dat was de volgorde van een profielpagina met vier blokken.
 * Sinds de cijfers van Onthouden erbij kwamen, stonden er acht blokken tussen
 * de naam en de diploma's, en begon de kast op een telefoon pas op het zesde
 * scherm.
 *
 * **De naam staat in de kop**, en wijzigen is een rij bij de instellingen: iets
 * wat je bijna nooit doet, en de naam stond met premium drie keer op het eerste
 * scherm — in de balk, in "Jouw naam" en in "Wie oefent er?".
 *
 * De reeks staat er niet (ADR-169): verlies als prikkel hoort niet bij het kind,
 * en de ouder die hem wél zag heeft geen eigen pagina meer.
 *
 * School and place of residence are not here and never will be. They are the
 * two fields that would turn a name on a device into a child somebody could
 * find, and nothing this product does needs them.
 */
export function ProfileScreen({
  profile,
  onOefen,
  onToets,
  kastOpen = false,
  onKastGezien,
}: {
  readonly profile: ProfileRecord;
  readonly onOefen: (deel: Onderdeel) => void;
  readonly onToets: (deel: Onderdeel, mode: ModeId) => void;
  /** Binnengekomen via "Bekijk alle diploma's": de kast in beeld (ADR-153). */
  readonly kastOpen?: boolean;
  readonly onKastGezien?: (() => void) | undefined;
}) {
  const kast = useRef<HTMLDivElement>(null);

  // Met premium staat "Wie oefent er?" boven de kast, dus is dit nog een sprong;
  // zonder is het er een van niets.
  useEffect(() => {
    if (!kastOpen) return;
    kast.current?.scrollIntoView({ block: 'start' });
    onKastGezien?.();
    // Eén keer, bij binnenkomst.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="tk-page">
      <div className="tk-page-main">
        {/* De kop als de etalage van premium (ADR-150). De zin eronder zegt
            wie er oefent en wat er op de pagina staat, in die volgorde
            (ADR-172). */}
        <header className="tk-etalage">
          <h1 className="tk-etalage-kop">{t('you.title')}</h1>
          <p className="tk-etalage-tekst text-lopend">
            {t('you.intro', { naam: profile.naam })}
          </p>
        </header>

        <Children active={profile} />

        {/* De diplomakast: alle diploma's die dit kind kan halen, met de gaten
            zichtbaar. Zodra het diploma zelf de beloning is, is een gat geen
            tekort meer maar een doel — en dan hoort het raster hier, want een
            kind kan erop mikken (ADR-064). Bovenaan sinds ADR-172. */}
        <div ref={kast}>
          <Kast onOefen={onOefen} onToets={onToets}>
            <DiplomaUitleg />
            <Jaaroverzicht />
          </Kast>
        </div>

        {/* Of het blijft hangen: wat je onthoudt, hoe vaak je oefent, per vak
            en per onderwerp (ADR-171, ADR-172). Dit was de Onthouden-pagina. */}
        <Statistieken />

        {/* Wat je instelt, met je naam en je groep erbij (ADR-172). */}
        <Instellingen profile={profile} />

        <EigenLijsten />

        {/* Onderaan, en als laatste: het enige op deze pagina dat niet terug te
            draaien is (ADR-166). */}
        <Wissen />
      </div>
    </div>
  );
}

/**
 * Hoe een diploma verdiend wordt, in een uitklap onder de kast (ADR-172).
 *
 * Het stond op Voor ouders, en daarna als eigen blok onder de kast (ADR-171),
 * met als eerste zin de regel die boven het raster al stond. Het antwoord is
 * voor een kind dat alles goed had en toch geen diploma kreeg: dat zoekt bij de
 * diploma's, en daar staat het, één druk verder.
 */
function DiplomaUitleg() {
  return (
    <Uitklap open={t('you.diplomaTitel')} titel={t('uitklap.uitlegDicht')}>
      <div className="tk-card flex flex-col gap-2">
        <p className="text-lopend">{t('you.diplomaUitleg')}</p>
        <p className="text-lopend">{t('you.diplomaTempo')}</p>
      </div>
    </Uitklap>
  );
}

/**
 * De schakelaars van dit apparaat, en de doelen van de week (ADR-171).
 *
 * The switch moves after the write, not before it. Flipping it first and
 * writing afterwards reads a few milliseconds sooner and is a lie the moment
 * the write does not land. What the switch shows is what is stored.
 *
 * **De doelen staan erbij.** "Ik wil geen doelen" op Vandaag zet het blok weg,
 * en de weg terug stond op Voor ouders (ADR-162). Die pagina is er niet meer,
 * dus is het een schakelaar tussen de andere: iets wat de app wel of niet doet.
 *
 * **En je naam en je groep bovenaan de lijst** (ADR-172). Allebei waren ze een
 * eigen blok, en allebei verander je bijna nooit. Als rij zeggen ze wat ze nu
 * zijn, en gaan ze open als je erop drukt.
 */
function Instellingen({ profile }: { readonly profile: ProfileRecord }) {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [doelen, setDoelen] = useState<Weekdoelen | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void Promise.all([loadPreferences(), leesWeekdoelen()]).then(([value, weekdoelen]) => {
      setPrefs(value);
      setDoelen(weekdoelen);
      setLoaded(true);
    });
  }, []);

  const toggle = (name: keyof Preferences) => {
    const next = { ...prefs, [name]: !prefs[name] };
    void savePreference(name, next[name]).then(() => {
      setPrefs(next);
      if (name === 'rustig') zetRustig(next.rustig);
    });
  };

  const toggleDoelen = () => {
    const huidig = doelen ?? GEEN_DOELEN;
    const next = { ...huidig, uit: !huidig.uit };
    void schrijfWeekdoelen(next).then(() => setDoelen(next));
  };

  return (
    <section className="flex flex-col gap-3" aria-label={t('you.settings')} aria-busy={!loaded}>
      <h2 className="tk-sectie">{t('you.settings')}</h2>
      <ul className="tk-lijst">
        <Naam profile={profile} />
        <GroepInstelling />
        <li>
          <Switch
            icon={SpeakIcon}
            on={prefs.readAloud}
            label={t('you.readAloud')}
            why={t('you.readAloudWhy')}
            onToggle={() => toggle('readAloud')}
          />
        </li>
        <li>
          <Switch
            icon={SpeakIcon}
            on={prefs.geluid}
            label={t('you.geluid')}
            why={t('you.geluidWhy')}
            onToggle={() => toggle('geluid')}
          />
        </li>
        <li>
          <Switch
            icon={OogIcon}
            on={prefs.rustig}
            label={t('you.rustig')}
            why={t('you.rustigWhy')}
            onToggle={() => toggle('rustig')}
          />
        </li>
        <li>
          <Switch
            icon={TodayIcon}
            on={!(doelen?.uit ?? false)}
            label={t('you.doelen')}
            why={t('you.doelenWhy')}
            onToggle={toggleDoelen}
          />
        </li>
      </ul>
    </section>
  );
}

/**
 * A setting as a row of the list: what it does, why, and a switch that shows
 * its state as a shape and in a word — "aan" and "uit" survive being colour
 * blind, and aria-pressed carries it to a screen reader without either.
 */
function Switch({
  icon: Teken,
  on,
  label,
  why,
  onToggle,
}: {
  /** Wat de schakelaar raakt. */
  readonly icon: ComponentType<Omit<IconProps, 'children'>>;
  readonly on: boolean;
  readonly label: string;
  readonly why: string;
  readonly onToggle: () => void;
}) {
  return (
    <button type="button" className="tk-lijstrij" aria-pressed={on} onClick={onToggle}>
      <span className="tk-plaat tk-plaat-neutraal">
        <Teken size={24} />
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

/** Zo lang als het naamscherm toestaat (`ProfileGate`): één limiet, twee velden. */
const NAAM_MAX = 24;

/**
 * Je naam, als rij bij de instellingen (ADR-126, ADR-172).
 *
 * De naam stond er als een regel tekst onder de titel — "Je oefent als Noor" —
 * en was nergens te veranderen; ADR-126 gaf hem een eigen blok met een knop.
 * Nu staat die zin weer in de kop, en is veranderen een rij tussen de andere
 * instellingen: iets wat je bijna nooit doet hoort niet bovenaan.
 *
 * Hernoemen raakt alleen de naam: het id blijft, dus elke Leitner-doos, elk
 * diploma en elke stempel op de weekkaart blijft bij dit kind horen.
 */
function Naam({ profile }: { readonly profile: ProfileRecord }) {
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
    <li>
      <button
        type="button"
        className="tk-lijstrij"
        aria-expanded={open}
        onClick={() => {
          setNaam(profile.naam);
          setOpen(!open);
        }}
      >
        <span className="tk-plaat tk-plaat-neutraal">
          <PupilIcon size={24} />
        </span>
        <span className="tk-lijstrij-tekst">
          <span className="tk-lijstrij-titel">{t('you.naam')}</span>
          <span className="tk-lijstrij-regel">{profile.naam}</span>
        </span>
        <span className="tk-lijstrij-pijl">
          <span className="tk-label">{t('you.nameChange')}</span>
          {open ? <ChevronUpIcon size={20} /> : <ChevronDownIcon size={20} />}
        </span>
      </button>

      {open ? (
        <form
          className="flex flex-col gap-3 px-4 pb-4"
          onSubmit={(event) => void bewaar(event)}
        >
          <label htmlFor={veld} className="tk-label">
            {t('you.naamLabel')}
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
      ) : null}
    </li>
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

      {/* Said once, where whoever adds the second child will read it. */}
      <p className="tk-hulp">{t('you.childExplain')}</p>
    </section>
  );
}
