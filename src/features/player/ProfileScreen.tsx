import { useEffect, useId, useRef, useState, type ComponentType, type FormEvent } from 'react';
import { t, type TranslationKey } from '@/i18n';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  type IconProps,
  OogIcon,
  PupilIcon,
  SpeakIcon,
} from '@/components/Icon';
import { Uitklap } from '@/components/Uitklap';
import { AVATAR_SLEUTEL, renameChild, setAvatar } from '@/store/children';
import type { ProfileRecord } from '@/store/db';
import { Kast } from '@/features/badges/Kast';
import type { ModeId } from '@/game-core';
import type { Onderdeel } from '@/features/module/onderdelen';
import { usePremium } from '@/features/premium/usePremium';
import { Statistieken } from '@/features/retention/Statistieken';
import { AVATAR_GROEPEN, AVATARS, avatarNaam, AvatarTeken } from './avatars';
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
 * **In de volgorde van wat een kind hier komt halen** (ADR-172, ADR-177):
 * **wie je bent** — je avatar, je naam, je groep en de schakelaars; dan **wat
 * je gehaald hebt**, de diploma's, die sinds ADR-167 het hele
 * beloningsprogramma zijn en het enige blok met een knop die iets oplevert; dan
 * **of het blijft hangen**, alle cijfers; en als laatste je eigen woorden.
 *
 * Die eerste stap is in ADR-177 teruggedraaid naar waar ADR-145 en ADR-171 hem
 * hadden. ADR-172 zette de instellingen onderaan, en met reden: er stonden toen
 * acht blokken tussen de naam en de diploma's en begon de kast op een telefoon
 * pas op het zesde scherm. Dat is niet meer zo — het blok is er één, met vijf
 * rijen — en er is iets bij gekomen wat wél bovenaan hoort: een kind mag hier
 * kiezen hoe het eruitziet, en een pagina die "Jij" heet, begint daarmee.
 *
 * **De naam staat ook in de kop**, en wijzigen is een rij bij de instellingen:
 * iets wat je bijna nooit doet, en de naam stond met premium drie keer op het
 * eerste scherm — in de balk, in "Jouw naam" en in "Wie oefent er?".
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
  onProfiel,
}: {
  readonly profile: ProfileRecord;
  readonly onOefen: (deel: Onderdeel) => void;
  readonly onToets: (deel: Onderdeel, mode: ModeId) => void;
  /** Binnengekomen via "Bekijk alle diploma's": de kast in beeld (ADR-153). */
  readonly kastOpen?: boolean;
  readonly onKastGezien?: (() => void) | undefined;
  /** Dit kind is veranderd: de balk draagt het ook (ADR-177). */
  readonly onProfiel?: ((profile: ProfileRecord) => void) | undefined;
}) {
  const kast = useRef<HTMLDivElement>(null);
  const { actief: premium } = usePremium();

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
            {t(premium ? 'you.intro' : 'you.introZonderCode', { naam: profile.naam })}
          </p>
        </header>

        {/* Wie je bent, bovenaan (ADR-177): je avatar, je naam, je groep en de
            schakelaars. Het stond onderaan sinds ADR-172, met het argument dat
            een kind hier komt voor wat het gehaald heeft en niet om iets in te
            stellen. Dat argument houdt niet meer nu er een avatar bij komt: een
            pagina die "Jij" heet en waarop je jezelf een gezicht geeft, hoort
            daarmee te beginnen. Het is ook waar ADR-145 en ADR-171 het hadden,
            en de reden dat ADR-172 het verplaatste — acht blokken tussen de
            naam en de diploma's — is er niet meer: het zijn er nu twee. */}
        <Instellingen profile={profile} onProfiel={onProfiel} />

        {/* De diplomakast: alle diploma's die dit kind kan halen, met de gaten
            zichtbaar. Zodra het diploma zelf de beloning is, is een gat geen
            tekort meer maar een doel — en dan hoort het raster hier, want een
            kind kan erop mikken (ADR-064). */}
        <div ref={kast}>
          <Kast onOefen={onOefen} onToets={onToets}>
            <DiplomaUitleg />
            <Jaaroverzicht />
          </Kast>
        </div>

        {/* Of het blijft hangen: wat je onthoudt, per vak en per onderwerp, en
            hoe vaak je oefent (ADR-171, ADR-172, ADR-177). Dit was de
            Onthouden-pagina. */}
        <Statistieken />

        <EigenLijsten />
      </div>
    </div>
  );
}

/** De vijf stappen, in de volgorde waarin een kind ze doet (ADR-177). */
const DIPLOMA_STAPPEN: readonly TranslationKey[] = [
  'you.diplomaStap1',
  'you.diplomaStap2',
  'you.diplomaStap3',
  'you.diplomaStap4',
  'you.diplomaStap5',
];

/**
 * Hoe een diploma verdiend wordt, in een uitklap onder de kast (ADR-172,
 * ADR-177).
 *
 * Het stond op Voor ouders, en daarna als eigen blok onder de kast (ADR-171),
 * met als eerste zin de regel die boven het raster al stond. Het antwoord is
 * voor een kind dat alles goed had en toch geen diploma kreeg: dat zoekt bij de
 * diploma's, en daar staat het, één druk verder.
 *
 * **Sinds ADR-177 vijf stappen in plaats van twee alinea's**, en de regel die
 * boven het raster stond hoort er nu bij in plaats van erboven. De oude tekst
 * begon bij de uitzondering — wanneer een goed antwoord níét meetelt — en
 * beantwoordde de vraag in de titel nergens: er stond niet dat je een diploma
 * kiest, niet dat er een toets is, en niet dat het daarna van jou blijft.
 *
 * Genummerd met dezelfde regelkaart als `Regels` hieronder, want het is
 * dezelfde soort tekst: een handvol regels die een kind één keer leest.
 */
function DiplomaUitleg() {
  return (
    <Uitklap open={t('you.diplomaTitel')} titel={t('uitklap.uitlegDicht')}>
      <div className="tk-card">
        <ol className="tk-regelkaart-lijst">
          {DIPLOMA_STAPPEN.map((stap, nummer) => (
            <li key={stap} className="tk-regelrij">
              {/* Het nummer is de volgorde die de lijst zelf al heeft; een
                  schermlezer telt hem en hoort hem dus niet twee keer. */}
              <span className="tk-regelnummer" aria-hidden="true">
                {nummer + 1}
              </span>
              <span className="text-lopend">{t(stap)}</span>
            </li>
          ))}
        </ol>
      </div>
    </Uitklap>
  );
}

/**
 * De schakelaars van dit apparaat (ADR-171, ADR-173).
 *
 * The switch moves after the write, not before it. Flipping it first and
 * writing afterwards reads a few milliseconds sooner and is a lie the moment
 * the write does not land. What the switch shows is what is stored.
 *
 * **De doelen staan er niet meer bij** (ADR-173). Of de app doelen voor de week
 * voorstelt, bepaalt of het kind ergens toe wordt aangezet, en dat is een
 * besluit van de ouder en niet van wie aangezet wordt: die schakelaar staat op
 * /ouder. Geluid, voorlezen en minder beweging blijven hier, want die gaan over
 * de kamer en over het kind dat de iPad vasthoudt.
 *
 * **En je naam en je groep bovenaan de lijst** (ADR-172). Allebei waren ze een
 * eigen blok, en allebei verander je bijna nooit. Als rij zeggen ze wat ze nu
 * zijn, en gaan ze open als je erop drukt.
 */
function Instellingen({
  profile,
  onProfiel,
}: {
  readonly profile: ProfileRecord;
  readonly onProfiel?: ((profile: ProfileRecord) => void) | undefined;
}) {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void loadPreferences().then((value) => {
      setPrefs(value);
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

  return (
    <section className="flex flex-col gap-3" aria-label={t('you.settings')} aria-busy={!loaded}>
      <h2 className="tk-sectie">{t('you.settings')}</h2>
      <ul className="tk-lijst">
        <Avatarkiezer profile={profile} onProfiel={onProfiel} />
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

/**
 * Je avatar kiezen, als eerste rij bij de instellingen (ADR-177).
 *
 * **Waarom een kind er een mag kiezen.** Tot nu toe was een kind op dit
 * apparaat zijn voorletter in een rondje. Dat werkt om twee kinderen uit elkaar
 * te houden en verder niets — en "N" is geen manier waarop iemand van acht
 * zichzelf herkent. Twee broers die allebei met een S beginnen, waren zelfs
 * hetzelfde rondje.
 *
 * **Het hoort bij het kind en niet bij het apparaat**, dus het staat in
 * `avatarConfig` op het profiel en niet bij de instellingen in de
 * settings-winkel (`setAvatar`). Bij een wissel van profiel wisselt de avatar
 * mee, wat de hele reden is om er een te hebben.
 *
 * **De tekeningen zijn tijdelijk.** De eigenaar levert ze later aan; wat dan
 * verandert staat in `avatars.tsx` en nergens anders. Daarom is er hier geen
 * enkele tekening genoemd: dit bestand kent alleen de lijst.
 */
function Avatarkiezer({
  profile,
  onProfiel,
}: {
  readonly profile: ProfileRecord;
  readonly onProfiel?: ((profile: ProfileRecord) => void) | undefined;
}) {
  const [open, setOpen] = useState(false);
  const [gekozen, setGekozen] = useState(profile.avatarConfig[AVATAR_SLEUTEL]);

  async function kies(id: string) {
    // De keuze staat meteen, en wordt daarna geschreven — andersom dan de
    // schakelaars hierboven, met opzet: dit is de enige rij waar je het
    // resultaat van je druk zíét, en een avatar die een slag later verspringt
    // leest als een fout.
    setGekozen(id);
    const gewijzigd = await setAvatar(id);
    // De balk bovenaan draagt dezelfde avatar. `Naam` herlaadt daarvoor de hele
    // pagina, en dat mag daar: je hernoemt jezelf één keer. Hier niet — een
    // kind probeert er een paar achter elkaar, en drie herlaadbeurten om een
    // raket te kiezen is geen kiezen meer.
    if (gewijzigd) onProfiel?.(gewijzigd);
  }

  return (
    <li>
      <button
        type="button"
        className="tk-lijstrij"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {/* Verborgen: de regel ernaast zegt welke avatar het is, en zonder
            keuze is dit de voorletter — die anders vóór "Je avatar" in de naam
            van deze knop terechtkomt. */}
        <span className="tk-plaat tk-plaat-neutraal" aria-hidden="true">
          <AvatarTeken id={gekozen} naam={profile.naam} size={24} />
        </span>
        <span className="tk-lijstrij-tekst">
          <span className="tk-lijstrij-titel">{t('you.avatar')}</span>
          <span className="tk-lijstrij-regel">{avatarNaam(gekozen) ?? t('you.avatarGeen')}</span>
        </span>
        <span className="tk-lijstrij-pijl">
          <span className="tk-label">{t('you.nameChange')}</span>
          {open ? <ChevronUpIcon size={20} /> : <ChevronDownIcon size={20} />}
        </span>
      </button>

      {open ? (
        <div
          className="flex flex-col gap-4 px-4 pb-4"
          role="group"
          aria-label={t('you.avatarKies')}
        >
          {/* Twee groepen van 24, als raster met grote plaatjes (ADR-202): in
              een rij pillen van 24 pixels was een tekening niet te zien. */}
          {AVATAR_GROEPEN.map((groep) => (
            <div
              key={groep.id}
              className="flex flex-col gap-2"
              role="group"
              aria-label={t(groep.naam)}
            >
              <p className="tk-label">{t(groep.naam)}</p>
              <div className="tk-avatarraster">
                {AVATARS.filter((avatar) => avatar.groep === groep.id).map((avatar) => {
                  const Teken = avatar.teken;
                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      className="tk-avatarkeuze"
                      aria-pressed={avatar.id === gekozen}
                      onClick={() => void kies(avatar.id)}
                    >
                      <Teken size={56} />
                      {t(avatar.naam)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </li>
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
        <form className="flex flex-col gap-3 px-4 pb-4" onSubmit={(event) => void bewaar(event)}>
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
