import { Icon, type IconProps } from '@/components/Icon';
import { t, type TranslationKey } from '@/i18n';

/**
 * De avatars waaruit een kind kiest (ADR-177).
 *
 * **Waarom ze hier staan en niet bij de pictogrammen.** Een pictogram in
 * `Icon.tsx` betekent iets — een vak, een stand, een richting — en styleguide
 * §E verbiedt twee tekeningen met dezelfde betekenis. Een avatar betekent
 * niets; hij is van jou. Ze delen alleen het raster van 24 en de ene streekdikte,
 * zodat ze naast de rest van de app niet als een ander product ogen.
 *
 * **Waarom het vormen zijn en geen kleuren.** De palet van dit product is
 * bezet: groen zegt "goed", gearceerd rood zegt "fout", koraal is het merk en
 * mag niets zijn wat een kind indrukt (ADR-159), en de zes vakkleuren zeggen
 * welk vak je voor je hebt. Een avatar die zich van een andere onderscheidt
 * door kleur, zou dus of een van die betekenissen lenen of een negende kleur
 * introduceren. Acht silhouetten doen hetzelfde werk, en ze werken ook voor een
 * kind dat kleuren niet onderscheidt.
 *
 * **Dit is de tijdelijke set.** De eigenaar levert de echte avatars later apart
 * aan. Dat is één wijziging in dit bestand: de lijst hieronder houdt zijn ids,
 * en `teken` wordt de geleverde tekening. Alles wat een avatar gebruikt —
 * de balk, de wisselaar, de instellingen — leest die lijst en hoeft niet mee te
 * veranderen. De ids staan daarom in het Nederlands en beschrijven de vorm, niet
 * de volgorde: `avatar-3` zou bij de eerste herschikking de verkeerde tekening
 * worden voor een kind dat allang gekozen had.
 */

export interface Avatar {
  /** Wat er in `avatarConfig.avatar` komt te staan. Verandert nooit meer. */
  readonly id: string;
  readonly naam: TranslationKey;
  readonly teken: (props: Omit<IconProps, 'children'>) => JSX.Element;
}

function Zon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="5" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" />
    </Icon>
  );
}

function Wolk(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M7 18h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6 11a3.5 3.5 0 0 0 1 7Z" />
    </Icon>
  );
}

function Bloem(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="9" r="2.5" />
      <path d="M12 4a2.5 2.5 0 0 1 0 5M7.7 6.5a2.5 2.5 0 0 1 4.3 2.5M7.7 11.5a2.5 2.5 0 0 1 4.3-2.5M16.3 6.5a2.5 2.5 0 0 0-4.3 2.5M16.3 11.5a2.5 2.5 0 0 0-4.3-2.5" />
      <path d="M12 13v8" />
    </Icon>
  );
}

function Vis(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M3 12c3-4 7-5 10-5s6 2 8 5c-2 3-5 5-8 5s-7-1-10-5Z" />
      <path d="M21 12c-1.5-1-2.5-2.5-2.5-4M21 12c-1.5 1-2.5 2.5-2.5 4" />
      <circle cx="8" cy="11" r="1" fill="currentColor" stroke="none" />
    </Icon>
  );
}

function Raket(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M12 2c3 2.5 4.5 6 4.5 10L12 17l-4.5-5C7.5 8 9 4.5 12 2Z" />
      <path d="M7.5 12 4 14l1.5 4 3-2M16.5 12 20 14l-1.5 4-3-2" />
      <circle cx="12" cy="9" r="1.5" />
    </Icon>
  );
}

function Kat(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M5 9 4 3l5 3.5a9 9 0 0 1 6 0L20 3l-1 6a8 8 0 1 1-14 0Z" />
      <path d="M9.5 12v.5M14.5 12v.5" />
      <path d="M12 15.5v1M10 17h4" />
    </Icon>
  );
}

function Robot(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <rect x="4" y="7" width="16" height="12" rx="3" />
      <path d="M12 3v4" />
      <circle cx="12" cy="3" r="1.5" />
      <path d="M9 12v1.5M15 12v1.5M9.5 16h5" />
    </Icon>
  );
}

function Boot(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M3 16h18l-2.5 5H5.5L3 16Z" />
      <path d="M12 16V3l7 8h-7" />
    </Icon>
  );
}

export const AVATARS: readonly Avatar[] = [
  { id: 'zon', naam: 'avatar.zon', teken: Zon },
  { id: 'wolk', naam: 'avatar.wolk', teken: Wolk },
  { id: 'bloem', naam: 'avatar.bloem', teken: Bloem },
  { id: 'vis', naam: 'avatar.vis', teken: Vis },
  { id: 'raket', naam: 'avatar.raket', teken: Raket },
  { id: 'kat', naam: 'avatar.kat', teken: Kat },
  { id: 'robot', naam: 'avatar.robot', teken: Robot },
  { id: 'boot', naam: 'avatar.boot', teken: Boot },
];

export function avatarVan(id: string | undefined): Avatar | null {
  if (id === undefined) return null;
  return AVATARS.find((avatar) => avatar.id === id) ?? null;
}

/**
 * De avatar van een kind, of zijn voorletter zolang het er geen koos.
 *
 * De voorletter was er al en blijft de terugval: een kind dat niets kiest,
 * houdt precies wat het had. Decoratief, want overal waar dit staat, staat de
 * naam van het kind ernaast of in de naam van de knop eromheen.
 */
export function AvatarTeken({
  id,
  naam,
  size = 24,
}: {
  readonly id: string | undefined;
  readonly naam: string;
  readonly size?: number;
}) {
  const avatar = avatarVan(id);
  if (avatar === null) return <>{naam.slice(0, 1).toLocaleUpperCase('nl-NL')}</>;

  const Teken = avatar.teken;
  return <Teken size={size} />;
}

/** De naam van een avatar, voor waar er woorden nodig zijn. */
export function avatarNaam(id: string | undefined): string | null {
  const avatar = avatarVan(id);
  return avatar === null ? null : t(avatar.naam);
}
