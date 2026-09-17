import type { ReactNode } from 'react';
import { OpfrissenIcon, PleisterIcon, StampIcon } from '@/components/Icon';
import { laagVan, stempelsVan, tekenVan, type ItemState, type Teken } from '@/game-core';
import { t, type TranslationKey } from '@/i18n';

/**
 * Eén plaatje in het album (ADR-149).
 *
 * **Elke laag is een vorm, niet alleen een kleur.** Leeg is een gestippelde rand
 * zonder inkt, begonnen een gestippelde inktrand, daarna een dichte rand, dan
 * arcering, dan vlak in de kleur van de module, en een lijstje is een dubbele
 * rand. Een kind van zes leest het beeld en geen woord, en een kind dat kleuren
 * niet uit elkaar houdt, ziet de vorm.
 *
 * **Een teken pakt niets af.** Opfrissen en lastig staan er klein bij, in een
 * hoek, en de kleur blijft. Stempels staan in de andere hoek, met een getal vanaf
 * twee.
 *
 * De naam, de laag en het teken zijn samen het label: een schermlezer hoort
 * "Utrecht: onthoud je, even opfrissen".
 */

const LAAG_WOORD: Record<number, TranslationKey> = {
  0: 'album.laag0',
  1: 'album.laag1',
  2: 'album.laag2',
  3: 'album.laag3',
  4: 'album.laag4',
  5: 'album.laag5',
};

const TEKEN_WOORD: Record<Teken, TranslationKey> = {
  opfrissen: 'album.tekenOpfrissen',
  lastig: 'album.tekenLastig',
};

export function stempelWoord(aantal: number): string {
  return aantal === 1 ? t('album.stempelsEen') : t('album.stempelsVeel', { aantal });
}

/** Het label van een plaatje: naam, laag, teken en stempels. */
export function plaatjeLabel(naam: string, state: ItemState | undefined, now: Date): string {
  const delen = [t(LAAG_WOORD[laagVan(state)] ?? 'album.laag0')];
  const teken = tekenVan(state, now);
  if (teken) delen.push(t(TEKEN_WOORD[teken]));
  const stempels = stempelsVan(state).length;
  if (stempels > 0) delen.push(stempelWoord(stempels));
  return `${naam}: ${delen.join(', ')}`;
}

export function Plaatje({
  state,
  now,
  naam,
  nieuw = false,
  klein = false,
  gekozen,
  onKies,
  children,
}: {
  readonly state: ItemState | undefined;
  readonly now: Date;
  /** Wat dit plaatje is, in woorden. */
  readonly naam: string;
  /** Er veranderde net iets aan: het komt aan in plaats van er te staan. */
  readonly nieuw?: boolean;
  /** De kleine versie in de terugkoppeling na een antwoord. */
  readonly klein?: boolean;
  readonly gekozen?: boolean;
  /** Tik om de achterkant te zien. Zonder is het plaatje alleen om te kijken. */
  readonly onKies?: () => void;
  readonly children: ReactNode;
}) {
  const laag = laagVan(state);
  const teken = tekenVan(state, now);
  const stempels = stempelsVan(state).length;
  const label = plaatjeLabel(naam, state, now);

  const binnen = (
    <>
      <span className="tk-plaatje-beeld" aria-hidden="true">
        {children}
      </span>
      {stempels > 0 ? (
        <span className="tk-plaatje-stempel" aria-hidden="true">
          <StampIcon size={16} />
          {stempels > 1 ? <span className="tk-plaatje-getal">{stempels}</span> : null}
        </span>
      ) : null}
      {teken ? (
        <span className="tk-plaatje-teken" data-teken={teken} aria-hidden="true">
          {teken === 'lastig' ? <PleisterIcon size={16} /> : <OpfrissenIcon size={16} />}
        </span>
      ) : null}
    </>
  );

  const data = {
    'data-laag': laag,
    'data-nieuw': nieuw ? 'ja' : undefined,
    'data-klein': klein ? 'ja' : undefined,
  };

  if (onKies) {
    return (
      <button
        type="button"
        className="tk-plaatje"
        {...data}
        aria-label={label}
        aria-pressed={gekozen === true}
        onClick={onKies}
      >
        {binnen}
      </button>
    );
  }

  return (
    <span className="tk-plaatje" {...data} role="img" aria-label={label}>
      {binnen}
    </span>
  );
}
