import { useEffect, useId, useRef, useState, type ComponentType, type FormEvent } from 'react';
import { t } from '@/i18n';
import {
  CorrectIcon,
  FamilyIcon,
  type IconProps,
  NextIcon,
  OogIcon,
  PupilIcon,
  SpeakIcon,
  TodayIcon,
} from '@/components/Icon';
import { createChild, listChildren, renameChild, switchChild } from '@/store/children';
import type { ProfileRecord } from '@/store/db';
import { Kast } from '@/features/badges/Kast';
import { usePremium } from '@/features/premium/usePremium';
import type { ModeId } from '@/game-core';
import type { Onderdeel } from '@/features/module/onderdelen';
import { AccountBlok } from '@/features/account/AccountBlok';
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
 * **Drie pagina's naast de oefeningen**: Vandaag, Jij en Premium. Onthouden was
 * een vierde en Voor ouders een vijfde, en allebei zijn ze hierin opgegaan.
 * Onthouden, omdat "wie ben ik" en "hoe gaat het" op deze pagina één vraag zijn.
 * Voor ouders, omdat ouders niet inloggen en kinderen wel: een pagina die
 * alleen voor een ouder was, had in deze app geen lezer — en wat erop stond,
 * de schakelaars, de groep, de lijsten van school, het account, is van het kind
 * dat hier oefent. Wat van de rekening is, staat op Premium.
 *
 * In the order of a profile page (ADR-145): **who you are**, then **how it is
 * going** — every number the product keeps, from what you remember to the
 * weeks behind you — then **what you have made**: the diplomas, which since
 * ADR-167 are the whole reward programme. Then **the settings**, and last the
 * way to take it all off this device (ADR-166).
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
            wat er op de pagina staat, nu dat meer is dan een naam (ADR-171). */}
        <header className="tk-etalage">
          <h1 className="tk-etalage-kop">{t('you.title')}</h1>
          <p className="tk-etalage-tekst text-lopend">{t('you.intro')}</p>
        </header>

        <Ikben profile={profile} />

        <Children active={profile} />

        {/* Hoe het gaat: wat je onthoudt, deze week, per vak, week na week en
            per onderwerp (ADR-171). Dit was de Onthouden-pagina. */}
        <Statistieken />

        {/* De diplomakast: alle diploma's die dit kind kan halen, met de gaten
            zichtbaar. Zodra het diploma zelf de beloning is, is een gat geen
            tekort meer maar een doel — en dan hoort het raster hier, want een
            kind kan erop mikken (ADR-064). */}
        <div ref={kast}>
          <Kast onOefen={onOefen} onToets={onToets} />
        </div>

        <DiplomaUitleg />

        <Jaaroverzicht />

        {/* De instellingen, hier en niet meer op Voor ouders (ADR-171). */}
        <Instellingen />

        <GroepInstelling />

        <EigenLijsten />

        <AccountBlok />

        {/* Onderaan, en als laatste: de belofte hierboven — het blijft op dit
            apparaat — is pas iets waard als je er ook bij kunt (ADR-166). */}
        <div className="flex flex-col gap-4">
          <p className="tk-hulp">{t('you.stays')}</p>
          <Wissen />
        </div>
      </div>
    </div>
  );
}

/**
 * Hoe een diploma verdiend wordt, onder de kast (ADR-171).
 *
 * Het stond op Voor ouders, als de uitleg die een ouder nodig had om thuis het
 * goede te zeggen. Nu die pagina weg is, staat het bij het kind, in zijn eigen
 * woorden, direct onder de diploma's waar het over gaat: een kind dat alles
 * goed had en toch geen diploma kreeg, leest hier waarom.
 */
function DiplomaUitleg() {
  return (
    <section className="flex flex-col gap-3" aria-labelledby="diploma-uitleg">
      <h2 id="diploma-uitleg" className="tk-sectie">
        {t('you.diplomaTitel')}
      </h2>
      <div className="tk-card flex flex-col gap-2">
        <p className="text-lopend">{t('you.diplomaUitleg')}</p>
        <p className="text-lopend">{t('you.diplomaTempo')}</p>
      </div>
    </section>
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
 */
function Instellingen() {
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
 * Wie er oefent, en hoe die heet (ADR-126).
 *
 * De naam stond er als een regel tekst onder de titel — "Je oefent als Noor" —
 * en was nergens te veranderen. Hier staat hij, met één knop ernaast.
 *
 * Hernoemen raakt alleen de naam: het id blijft, dus elke Leitner-doos, elk
 * diploma en elke stempel op de weekkaart blijft bij dit kind horen.
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
        <div className="tk-card tk-kaartrij">
          <span className="tk-kaartteken">
            <PupilIcon size={24} />
          </span>
          <p className="tk-kaartrij-tekst text-lopend">{t('you.nameIs', { naam: profile.naam })}</p>
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
