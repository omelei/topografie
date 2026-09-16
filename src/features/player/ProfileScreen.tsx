import { useEffect, useId, useState, type FormEvent, type ReactNode } from 'react';
import { t } from '@/i18n';
import { CorrectIcon, FamilyIcon, NextIcon, PupilIcon } from '@/components/Icon';
import { createChild, listChildren, renameChild, switchChild } from '@/store/children';
import type { ProfileRecord } from '@/store/db';
import { Tafeldiplomas } from '@/features/module/Tafeldiplomas';
import { VlagDiplomas } from '@/features/vlaggen/VlagDiplomas';
import { KlokDiplomas } from '@/features/klok/KlokDiplomas';
import { TopoDiplomas } from '@/features/module/TopoDiplomas';
import { BadgeSectie } from '@/features/badges/Badges';
import { usePremium } from '@/features/premium/usePremium';
import { HeldHoek } from '@/features/reis/HeldHoek';
import { HeldUitleg } from '@/features/reis/HeldUitleg';

/**
 * K10, "Jij": the child's own page (ADR-112).
 *
 * In the order of a profile page (ADR-145): **who you are** — the hero, the
 * name and who is practising — then **where the settings are**, then **what
 * you have earned**: the badges and the walls of diplomas.
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
  onHeld,
  onOuder,
}: {
  readonly profile: ProfileRecord;
  readonly aside: ReactNode;
  /** Een andere held kiezen (ADR-142). Gaat naar App, want de balk toont hem ook. */
  readonly onHeld: (sticker: string) => void;
  readonly onOuder: () => void;
}) {
  return (
    <div className="tk-page">
      <div className="tk-page-main">
        {/* Wie je bent, als eerste ding (ADR-143). Deze pagina heet "Jij" en
            liet tot nu toe geen enkel beeld van dit kind zien — de voordeur wel.
            Naast de titel en niet erboven, precies zoals daar. */}
        <div className="tk-home-kop">
          <HeldHoek sticker={profile.avatarConfig.sticker} onHeld={onHeld} />
          <div className="tk-home-welkom">
            <h1 className="tk-titel">{t('you.title')}</h1>
            <HeldUitleg sticker={profile.avatarConfig.sticker} />
          </div>
        </div>

        {/* De volgorde van een profielpagina (ADR-145): eerst wie je bent, dan
            de instellingen, dan wat je verdiend hebt. ADR-143 zette de
            prijzenkast bovenaan; de eigenaar vroeg om deze volgorde, op Jij en
            op Voor ouders hetzelfde, zodat de twee pagina's één patroon delen.
            De held staat nog steeds als eerste ding, naast de titel. */}
        <Ikben profile={profile} />

        <Children active={profile} />

        {/* De instellingen zelf staan op Voor ouders (ADR-136): het zijn
            schakelaars van het apparaat. Hier staat waar je ze vindt, op de
            plek waar je ze zoekt. */}
        <section className="flex flex-col gap-3" aria-label={t('you.settings')}>
          <h2 className="tk-sectie">{t('you.settings')}</h2>
          <div className="tk-card flex flex-wrap items-center justify-between gap-3">
            <p className="text-lopend">{t('you.settingsBijOuder')}</p>
            <button type="button" className="tk-button tk-button-secondary" onClick={onOuder}>
              {t('ouder.naar')}
            </button>
          </div>
        </section>

        <Prijzenkast />
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
  const [alles, setAlles] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <BadgeSectie alleenBehaald={!alles} />
      <Tafeldiplomas alleenBehaald={!alles} />
      <VlagDiplomas alleenBehaald={!alles} />
      <KlokDiplomas alleenBehaald={!alles} />
      <TopoDiplomas alleenBehaald={!alles} />

      <p>
        <button
          type="button"
          className="tk-button tk-button-secondary"
          aria-expanded={alles}
          onClick={() => setAlles(!alles)}
        >
          {alles ? t('prijzenkast.minder') : t('prijzenkast.meer')}
        </button>
      </p>
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
