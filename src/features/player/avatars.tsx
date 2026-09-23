import type { IconProps } from '@/components/Icon';
import { t, type TranslationKey } from '@/i18n';

/**
 * De avatars waaruit een kind kiest (ADR-177, ADR-182).
 *
 * **De geleverde set.** ADR-177 zette acht tijdelijke silhouetten neer en
 * beloofde dat de echte tekeningen één wijziging in dit bestand zouden zijn.
 * Dat zijn ze: de acht avatars uit de Merk en stijlgids (`docs/leer.js`),
 * door `tools/merk-uit-leer.mjs` als bestand in `public/avatars` gezet. De ids
 * zijn dezelfde, dus een kind dat al koos houdt zijn avatar.
 *
 * **Waarom ze hier kleur mogen dragen.** Een avatar betekent niets; hij is van
 * jou. Hij staat altijd naast de naam van het kind en zegt nooit "goed", "fout"
 * of een vak. Het zijn plaatjes en geen pictogrammen, dus de regels van §E
 * gelden er niet.
 *
 * **De ids beschrijven de vorm, niet de volgorde:** `avatar-3` zou bij de
 * eerste herschikking de verkeerde tekening worden voor een kind dat allang
 * gekozen had.
 */

export interface Avatar {
  /** Wat er in `avatarConfig.avatar` komt te staan. Verandert nooit meer. */
  readonly id: string;
  readonly naam: TranslationKey;
  readonly teken: (props: Omit<IconProps, 'children'>) => JSX.Element;
}

/** De tekening van een avatar: het geleverde bestand, rond, decoratief. */
function plaatje(id: string) {
  function Plaatje({ size = 24 }: Omit<IconProps, 'children'>) {
    return (
      <img
        src={`/avatars/${id}.svg`}
        alt=""
        width={size}
        height={size}
        className="tk-avatar-plaatje"
      />
    );
  }
  return Plaatje;
}

export const AVATARS: readonly Avatar[] = [
  { id: 'zon', naam: 'avatar.zon', teken: plaatje('zon') },
  { id: 'wolk', naam: 'avatar.wolk', teken: plaatje('wolk') },
  { id: 'bloem', naam: 'avatar.bloem', teken: plaatje('bloem') },
  { id: 'vis', naam: 'avatar.vis', teken: plaatje('vis') },
  { id: 'raket', naam: 'avatar.raket', teken: plaatje('raket') },
  { id: 'kat', naam: 'avatar.kat', teken: plaatje('kat') },
  { id: 'robot', naam: 'avatar.robot', teken: plaatje('robot') },
  { id: 'boot', naam: 'avatar.boot', teken: plaatje('boot') },
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
