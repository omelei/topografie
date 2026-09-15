import { useEffect, useState } from 'react';
import { STICKERS, stickerById, type Sticker } from '@/components/stickerSet';
import type { Reeks } from '@/game-core';
import { getProfile } from '@/store/profile';
import { useHelden } from './useHelden';

/**
 * De held die dit kind draagt, en in welke reeks.
 *
 * Stond woordelijk in `Maatje.tsx` en is nu op twee plekken nodig: in de ronde
 * en aan het eind van een dag. Twee kopieën van "lees het profiel, zoek de plek
 * op, pak de reeks" zouden op een dag uit elkaar lopen — en de ene zou dan een
 * andere held tekenen dan de andere, in hetzelfde kwartier.
 *
 * Het profiel wordt hier gelezen en niet doorgegeven: wie je bent verandert niet
 * tijdens een ronde, en anders zouden vijf rondeschermen het alle vijf moeten
 * doorgeven.
 *
 * Brons zolang er niets bekend is. Dat is ook de reeks waarin een held begint,
 * dus een plaat die verandert zodra de stand er is, gaat altijd omhoog en nooit
 * omlaag.
 */
export interface EigenHeld {
  readonly held: Sticker;
  readonly reeks: Reeks;
}

export function useEigenHeld(): EigenHeld {
  const stand = useHelden();
  const [sticker, setSticker] = useState<string | undefined>(undefined);

  useEffect(() => {
    void getProfile().then((profile) => setSticker(profile?.avatarConfig.sticker));
  }, []);

  const held = stickerById(sticker);
  const plek = STICKERS.indexOf(held);

  return { held, reeks: stand?.helden.find((rij) => rij.plek === plek)?.reeks ?? 'brons' };
}
