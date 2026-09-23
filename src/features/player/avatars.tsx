import type { IconProps } from '@/components/Icon';
import { t, type TranslationKey } from '@/i18n';

/**
 * De avatars waaruit een kind kiest (ADR-177, ADR-182, ADR-202).
 *
 * **De set van de eigenaar.** 48 tekeningen in twee groepen: dieren en dingen,
 * en monsters en helden. Ze staan als bestand in `public/avatars`, zonder de
 * metadata die het tekenprogramma meegaf. De acht ids van de vorige set (zon,
 * wolk, bloem, vis, raket, kat, robot, boot) zitten er ook in, dus een kind dat
 * al koos, houdt zijn avatar — in de nieuwe tekening.
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

export type AvatarGroep = 'dieren' | 'helden';

export interface Avatar {
  /** Wat er in `avatarConfig.avatar` komt te staan. Verandert nooit meer. */
  readonly id: string;
  readonly naam: TranslationKey;
  readonly groep: AvatarGroep;
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
  { id: 'zon', naam: 'avatar.zon', groep: 'dieren', teken: plaatje('zon') },
  { id: 'wolk', naam: 'avatar.wolk', groep: 'dieren', teken: plaatje('wolk') },
  { id: 'bloem', naam: 'avatar.bloem', groep: 'dieren', teken: plaatje('bloem') },
  { id: 'vis', naam: 'avatar.vis', groep: 'dieren', teken: plaatje('vis') },
  { id: 'raket', naam: 'avatar.raket', groep: 'dieren', teken: plaatje('raket') },
  { id: 'kat', naam: 'avatar.kat', groep: 'dieren', teken: plaatje('kat') },
  { id: 'robot', naam: 'avatar.robot', groep: 'dieren', teken: plaatje('robot') },
  { id: 'boot', naam: 'avatar.boot', groep: 'dieren', teken: plaatje('boot') },
  { id: 'beer', naam: 'avatar.beer', groep: 'dieren', teken: plaatje('beer') },
  { id: 'bij', naam: 'avatar.bij', groep: 'dieren', teken: plaatje('bij') },
  { id: 'draak', naam: 'avatar.draak', groep: 'dieren', teken: plaatje('draak') },
  { id: 'ijsje', naam: 'avatar.ijsje', groep: 'dieren', teken: plaatje('ijsje') },
  { id: 'inktvis', naam: 'avatar.inktvis', groep: 'dieren', teken: plaatje('inktvis') },
  { id: 'kikker', naam: 'avatar.kikker', groep: 'dieren', teken: plaatje('kikker') },
  { id: 'konijn', naam: 'avatar.konijn', groep: 'dieren', teken: plaatje('konijn') },
  { id: 'maan', naam: 'avatar.maan', groep: 'dieren', teken: plaatje('maan') },
  { id: 'monster', naam: 'avatar.monster', groep: 'dieren', teken: plaatje('monster') },
  { id: 'panda', naam: 'avatar.panda', groep: 'dieren', teken: plaatje('panda') },
  { id: 'pinguin', naam: 'avatar.pinguin', groep: 'dieren', teken: plaatje('pinguin') },
  { id: 'planeet', naam: 'avatar.planeet', groep: 'dieren', teken: plaatje('planeet') },
  { id: 'ster', naam: 'avatar.ster', groep: 'dieren', teken: plaatje('ster') },
  { id: 'ufo', naam: 'avatar.ufo', groep: 'dieren', teken: plaatje('ufo') },
  { id: 'uil', naam: 'avatar.uil', groep: 'dieren', teken: plaatje('uil') },
  { id: 'vos', naam: 'avatar.vos', groep: 'dieren', teken: plaatje('vos') },
  { id: 'brom', naam: 'avatar.brom', groep: 'helden', teken: plaatje('brom') },
  { id: 'drieoog', naam: 'avatar.drieoog', groep: 'helden', teken: plaatje('drieoog') },
  { id: 'fladder', naam: 'avatar.fladder', groep: 'helden', teken: plaatje('fladder') },
  { id: 'flits', naam: 'avatar.flits', groep: 'helden', teken: plaatje('flits') },
  { id: 'hoorntje', naam: 'avatar.hoorntje', groep: 'helden', teken: plaatje('hoorntje') },
  { id: 'ijzel', naam: 'avatar.ijzel', groep: 'helden', teken: plaatje('ijzel') },
  { id: 'klauw', naam: 'avatar.klauw', groep: 'helden', teken: plaatje('klauw') },
  { id: 'knobbel', naam: 'avatar.knobbel', groep: 'helden', teken: plaatje('knobbel') },
  { id: 'komeet', naam: 'avatar.komeet', groep: 'helden', teken: plaatje('komeet') },
  { id: 'kracht', naam: 'avatar.kracht', groep: 'helden', teken: plaatje('kracht') },
  { id: 'magneet', naam: 'avatar.magneet', groep: 'helden', teken: plaatje('magneet') },
  { id: 'nova', naam: 'avatar.nova', groep: 'helden', teken: plaatje('nova') },
  { id: 'pluis', naam: 'avatar.pluis', groep: 'helden', teken: plaatje('pluis') },
  { id: 'schaduw', naam: 'avatar.schaduw', groep: 'helden', teken: plaatje('schaduw') },
  { id: 'slijm', naam: 'avatar.slijm', groep: 'helden', teken: plaatje('slijm') },
  { id: 'spook', naam: 'avatar.spook', groep: 'helden', teken: plaatje('spook') },
  { id: 'sprietje', naam: 'avatar.sprietje', groep: 'helden', teken: plaatje('sprietje') },
  { id: 'storm', naam: 'avatar.storm', groep: 'helden', teken: plaatje('storm') },
  { id: 'tandje', naam: 'avatar.tandje', groep: 'helden', teken: plaatje('tandje') },
  { id: 'tornado', naam: 'avatar.tornado', groep: 'helden', teken: plaatje('tornado') },
  { id: 'turbo', naam: 'avatar.turbo', groep: 'helden', teken: plaatje('turbo') },
  { id: 'vampie', naam: 'avatar.vampie', groep: 'helden', teken: plaatje('vampie') },
  { id: 'vonk', naam: 'avatar.vonk', groep: 'helden', teken: plaatje('vonk') },
  { id: 'yeti', naam: 'avatar.yeti', groep: 'helden', teken: plaatje('yeti') },
];

/** De groepen in de kiezer, in deze volgorde. */
export const AVATAR_GROEPEN: readonly {
  readonly id: AvatarGroep;
  readonly naam: TranslationKey;
}[] = [
  { id: 'dieren', naam: 'avatar.groep.dieren' },
  { id: 'helden', naam: 'avatar.groep.helden' },
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
