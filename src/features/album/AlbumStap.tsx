import type { ReactNode } from 'react';
import { ONTHOUDEN_BOX, MAX_BOX, type ItemState, type Stap } from '@/game-core';
import { t } from '@/i18n';
import { Plaatje } from './Plaatje';

/**
 * Wat een antwoord met het plaatje deed, in de terugkoppeling (ADR-149).
 *
 * Dit vervangt de trap van ADR-137. Die liet de motor zien, en dat was goed;
 * wat hij niet liet zien, was dat er iets van het kind bleef. Nu staat er het
 * plaatje van wat het net beantwoordde, met de laag die het nu heeft, en één
 * zin.
 *
 * **Goed maar niet aan de beurt krijgt een eerlijke zin**: "Die ken je al. Over
 * drie dagen telt hij weer." Zo leert een kind wat spreiden is zonder het woord,
 * en waarom een tweede ronde vandaag niets aan het plaatje doet.
 *
 * Niets als er niets gebeurde: een fout op een schets verandert het plaatje
 * niet, en het uitkomstteken heeft dan al gezegd wat er te zeggen was.
 */

function zinVan(stap: Stap): string | null {
  if (stap.lastig) return t('album.stapLastig');
  if (stap.weerGoed) return t('album.stapWeerGoed');
  if (stap.stempel) return t('album.stapStempel');
  if (stap.naar > stap.van) {
    if (stap.van < ONTHOUDEN_BOX && stap.naar >= ONTHOUDEN_BOX) return t('album.stapKleur');
    if (stap.naar === MAX_BOX) return t('album.stapLijst');
    if (stap.van === 0) return t('album.stapBegonnen');
    return t('album.stapSchets');
  }
  if (stap.wachtDagen !== null) {
    return stap.wachtDagen === 1
      ? t('album.stapWachtEen')
      : t('album.stapWacht', { dagen: stap.wachtDagen });
  }
  return null;
}

export function AlbumStap({
  stap,
  state,
  naam,
  children,
}: {
  readonly stap: Stap | null;
  /** De stand van het item na dit antwoord. */
  readonly state: ItemState | undefined;
  readonly naam: string;
  /** Het beeld van het plaatje. */
  readonly children: ReactNode;
}) {
  if (stap === null) return null;
  const zin = zinVan(stap);
  if (zin === null) return null;
  const nieuw = stap.naar > stap.van || stap.stempel || stap.weerGoed;

  return (
    <p className="tk-albumstap">
      <Plaatje state={state} now={new Date()} naam={naam} nieuw={nieuw} klein>
        {children}
      </Plaatje>
      <span className="tk-albumstap-zin">{zin}</span>
    </p>
  );
}
