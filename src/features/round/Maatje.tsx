import { useEffect, useState } from 'react';
import { Heldplaat } from '@/components/Heldplaat';
import { stickerById } from '@/components/stickerSet';
import { STICKERS } from '@/components/stickerSet';
import type { Reeks } from '@/game-core';
import { useHelden } from '@/features/reis/useHelden';
import { getProfile } from '@/store/profile';

/**
 * Het maatje: de held van dit kind, in beeld zodra een antwoord nagekeken is
 * (ADR-142).
 *
 * Het rondescherm was het leegste scherm van het product en tegelijk het scherm
 * waar een kind verreweg de meeste tijd doorbrengt: een kaart met een som erin,
 * een teken van tweeëndertig pixels ernaast, en verder wit. Alles wat dit
 * product aan persoonlijkheid heeft — zestig tekeningen — stond ergens anders.
 *
 * Hier staat hij dus. Niet als versiering die er altijd is, maar op het moment
 * dat er iets gebeurde: je hebt geantwoord, en je maatje is er. Dat is hetzelfde
 * moment waarop het geluid klinkt (ADR-134) en het teken landt, dus het is één
 * gebeurtenis en niet drie.
 *
 * **Goed veert, fout komt gewoon aan.** Eén pose per held, dus de held zelf kan
 * niet blij of teleurgesteld kijken; wat verschilt is hoe hij binnenkomt. Een
 * kind dat het even niet weet heeft geen juichend dier nodig — de woorden
 * ernaast zeggen al wat er gebeurde, en die zijn nooit een oordeel.
 *
 * **Altijd even hoog.** Ook als er niets te tekenen valt, want een kaart die van
 * hoogte verspringt tussen goed en fout verplaatst de knop waar een kind net
 * naartoe bewoog.
 */
export function Maatje({ goed }: { readonly goed: boolean }) {
  const stand = useHelden();
  const [sticker, setSticker] = useState<string | undefined>(undefined);

  // Het profiel wordt hier zelf gelezen. Vijf rondeschermen zouden het anders
  // alle vijf moeten doorgeven, en wie je bent verandert niet tijdens een ronde.
  useEffect(() => {
    void getProfile().then((profile) => setSticker(profile?.avatarConfig.sticker));
  }, []);

  const held = stickerById(sticker);
  const plek = STICKERS.indexOf(held);
  const reeks: Reeks = stand?.helden.find((rij) => rij.plek === plek)?.reeks ?? 'brons';

  return (
    <p className="tk-maatje" data-goed={goed ? '' : undefined}>
      <Heldplaat sticker={held.id} reeks={reeks} size={88} className="tk-maatje-beeld" />
    </p>
  );
}
