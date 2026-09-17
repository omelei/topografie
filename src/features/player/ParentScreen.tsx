import { useEffect, useState, type ComponentType } from 'react';
import { t } from '@/i18n';
import { type IconProps, OogIcon, PupilIcon, SpeakIcon } from '@/components/Icon';
import { leesbareDatum, useNaarPremium, usePremium } from '@/features/premium/usePremium';
import { dagenGeldig, isVerlopen, verlooptBinnenkort } from '@/store/premium';
import { loadPlayedRounds, type PlayedRound } from '@/store/progress';
import {
  DEFAULT_PREFERENCES,
  loadPreferences,
  savePreference,
  zetRustig,
  type Preferences,
} from './settings';
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
  onOnthouden,
  now = new Date(),
}: {
  readonly aside: ReactNode;
  readonly onJij: () => void;
  /** De weg naar wat het kind onthoudt, per onderwerp (ADR-143). */
  readonly onOnthouden: () => void;
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
    void savePreference(name, next[name]).then(() => {
      setPrefs(next);
      if (name === 'rustig') zetRustig(next.rustig);
    });
  };

  return (
    <div className="tk-page">
      <div className="tk-page-main">
        <div className="flex flex-col gap-2">
          <h1 className="tk-titel">{t('ouder.title')}</h1>
          <p className="text-lopend text-tekst-secundair">{t('ouder.uitleg')}</p>
        </div>

        {/* De volgorde van een instellingenpagina (ADR-145): eerst wat je
            geregeld hebt, dan hoe de app zich gedraagt, dan wat je kind
            oefent, en pas daarna de cijfers. Tot nu toe opende de pagina met
            de cijfers en stonden de schakelaars onderaan, onder de rekening. */}
        <PremiumBlok now={now} />

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
                icon={PupilIcon}
                on={prefs.maatje}
                label={t('you.maatje')}
                why={t('you.maatjeWhy')}
                onToggle={() => toggle('maatje')}
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
          </ul>
        </section>

        <EigenLijsten />

        {/* De lezing van de week: is er geoefend, blijft het hangen, wat wacht
            er (ADR-133). De vier tegels met de feiten erachter stonden hier
            ook; die staan sinds ADR-148 op Onthouden, bij de rest van de
            getallen over het oefenen, en deze pagina telt niets meer zelf. */}
        <Weekbericht afgemaakt={afgemaakt} now={now} />

        {/* De weg naar de cijfers (ADR-143, ADR-148): wat het kind onthoudt,
            per vak en per onderwerp, en hoe het oefenen week na week gaat. */}
        <p>
          <button type="button" className="tk-button tk-button-secondary" onClick={onOnthouden}>
            {t('ouder.naarOnthouden')}
          </button>
        </p>

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
  icon: Teken,
  on,
  label,
  why,
  onToggle,
}: {
  /** Wat de schakelaar raakt. Het waren er twee met hetzelfde teken; nu vier. */
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
