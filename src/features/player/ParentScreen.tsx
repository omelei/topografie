import { useEffect, useState, type ComponentType } from 'react';
import { t } from '@/i18n';
import {
  FreezerIcon,
  type IconProps,
  NextIcon,
  OogIcon,
  PupilIcon,
  SpeakIcon,
  StarIcon,
} from '@/components/Icon';
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
import { AccountBlok } from '@/features/account/AccountBlok';
import { EigenLijsten } from './EigenLijsten';
import { Jaaroverzicht } from './Jaaroverzicht';
import { ReeksBlok } from './ReeksBlok';
import { useReeks } from './reeks';
import { WeekdoelenBlok } from '@/features/home/WeekdoelenBlok';
import { getActiveChild } from '@/store/children';
import { GroepInstelling } from './GroepInstelling';
import { Wissen } from './Wissen';

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
  onJij,
  onOnthouden,
  now = new Date(),
}: {
  readonly onJij: () => void;
  /** De weg naar wat het kind onthoudt, per onderwerp (ADR-143). */
  readonly onOnthouden: () => void;
  readonly now?: Date;
}) {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [loaded, setLoaded] = useState(false);
  const [rondes, setRondes] = useState<readonly PlayedRound[] | null>(null);
  /** Wie er nu oefent, voor de kop boven de doelen van deze week (ADR-162). */
  const [kindnaam, setKindnaam] = useState<string | null>(null);

  useEffect(() => {
    void loadPlayedRounds().then(setRondes);
  }, []);

  useEffect(() => {
    void getActiveChild().then((kind) => setKindnaam(kind?.naam ?? null));
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
        {/* De kop als de etalage van premium (ADR-150). */}
        <header className="tk-etalage">
          <h1 className="tk-etalage-kop">{t('ouder.title')}</h1>
          <p className="tk-etalage-tekst text-lopend">{t('ouder.uitleg')}</p>
        </header>

        {/* De volgorde van een instellingenpagina (ADR-145): eerst wat je
            geregeld hebt, dan hoe de app zich gedraagt, dan wat je kind
            oefent, en pas daarna de cijfers. Tot nu toe opende de pagina met
            de cijfers en stonden de schakelaars onderaan, onder de rekening. */}
        <PremiumBlok now={now} />

        {/* Het account, na premium en vóór de instellingen (ADR-155, ADR-157).
            Het is van dezelfde soort als het blok erboven — iets dat je als
            ouder geregeld hebt — en het staat er niet vóór, omdat premium het
            eerste is waar een ouder voor terugkomt. */}
        <AccountBlok />

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
          </ul>
        </section>

        {/* Wat je kind oefent begint bij zijn groep (ADR-151). */}
        <GroepInstelling />

        {/* De doelen van deze week (ADR-162). Hetzelfde blok als op de
            voordeur, met dezelfde knoppen: een ouder die het gesprek thuis
            voert, hoort er een doel bij te kunnen zetten zonder het kind erbij
            te roepen — en hij is degene die ze helemaal uit kan zetten.

            Pas als de naam bekend is. De kop draagt hem, dus zonder die naam
            zou het blok even "Je doelen voor deze week" heten en dan van naam
            veranderen — en een blok dat onder je ogen anders gaat heten, heeft
            je iets verteld wat niet waar was. */}
        {kindnaam === null ? null : <WeekdoelenBlok vanOuder naam={kindnaam} />}

        <EigenLijsten />

        {/* De lezing van de week: is er geoefend, blijft het hangen, wat wacht
            er (ADR-133). De vier tegels met de feiten erachter stonden hier
            ook; die staan sinds ADR-148 op Onthouden, bij de rest van de
            getallen over het oefenen, en deze pagina telt niets meer zelf. */}
        <Weekbericht afgemaakt={afgemaakt} now={now} />

        {/* Hoe een diploma verdiend wordt, en waarom één keer goed niet telt.
            Hier en niet bij het kind: dit is de uitleg die een ouder nodig
            heeft om thuis het goede te zeggen. */}
        <DiplomaUitleg />

        {/* De reeks, en het schooljaar. Allebei stonden ze bij het kind. De
            reeks is verlies-als-prikkel — ADR-158 schreef zelf op dat dat op de
            verbodenlijst staat van het onderzoek dat aan ADR-149 voorafging —
            dus het kind ziet hem niet meer en de ouder wel: die kan er iets mee
            zonder dat een kind zich erop blindstaart. */}
        <ReeksBlok reeks={useReeks()} />

        <Jaaroverzicht />

        {/* De weg naar de cijfers (ADR-143, ADR-148): wat het kind onthoudt,
            per vak en per onderwerp, en hoe het oefenen week na week gaat. */}
        <div className="flex flex-col gap-4">
          <div className="tk-kaarten">
            <Weg icon={FreezerIcon} label={t('ouder.naarOnthouden')} onClick={onOnthouden} />
            <Weg icon={PupilIcon} label={t('ouder.terug')} onClick={onJij} />
          </div>

          <p className="tk-hulp">{t('you.stays')}</p>
        </div>

        {/* Onderaan, en als laatste: de belofte hierboven — het blijft op dit
            apparaat — is pas iets waard als je er ook bij kunt (ADR-166). */}
        <Wissen />
      </div>
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
      {/* Een kaart zoals het plan op de premiumpagina (ADR-150): met de groene
          rand zolang het aanstaat. */}
      <div className="tk-card tk-kaartrij" data-premium={actief ? '' : undefined}>
        <span className="tk-kaartteken">
          <StarIcon size={24} />
        </span>
        <p className="tk-kaartrij-tekst text-lopend">
          {verlopen && stand
            ? t('you.premiumVerlopen', { datum: leesbareDatum(stand.geldigTot) })
            : actief && stand
              ? afloopZin(stand.geldigTot, bijnaAf, dagen)
              : t('premium.wat.jij')}
        </p>
        <button type="button" className="tk-button tk-button-secondary" onClick={naarPremium}>
          {verlopen
            ? t('you.premiumVerleng')
            : actief
              ? t('you.premiumBekijk')
              : t('premium.slotKnop')}
        </button>
      </div>
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

/**
 * Een weg naar een andere pagina, als een kaart met een teken (ADR-150): de
 * hele kaart is de knop, zoals de kaarten op de premiumpagina er een teken
 * dragen.
 */
function Weg({
  icon: Teken,
  label,
  onClick,
}: {
  readonly icon: ComponentType<Omit<IconProps, 'children'>>;
  readonly label: string;
  readonly onClick: () => void;
}) {
  return (
    <button type="button" className="tk-kaartje" onClick={onClick}>
      <span className="tk-kaartteken">
        <Teken size={24} />
      </span>
      <span className="tk-kaartje-kop">{label}</span>
      <NextIcon size={20} />
    </button>
  );
}

/**
 * Hoe een diploma verdiend wordt, voor de ouder.
 *
 * Drie zinnen, en de middelste is de belangrijkste: één keer goed antwoorden
 * telt niet mee. Dat is het verschil tussen iets kennen en iets onthouden, en
 * het is het enige dat thuis uitgelegd moet worden — een kind dat alles goed
 * had en toch geen diploma kreeg, is anders een kind met een ouder die denkt
 * dat de app stuk is.
 */
function DiplomaUitleg() {
  return (
    <section className="flex flex-col gap-3" aria-labelledby="diploma-ouder">
      <h2 id="diploma-ouder" className="tk-sectie">
        {t('ouder.diplomaTitel')}
      </h2>
      <div className="tk-card flex flex-col gap-2">
        <p className="text-lopend">{t('ouder.diplomaUitleg')}</p>
        <p className="text-lopend">{t('ouder.diplomaTempo')}</p>
        <p className="text-lopend">{t('reeks.ouderUitleg')}</p>
      </div>
    </section>
  );
}
