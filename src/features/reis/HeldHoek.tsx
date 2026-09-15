import { useState } from 'react';
import { Heldplaat } from '@/components/Heldplaat';
import { STICKERS, stickerById } from '@/components/stickerSet';
import type { Reeks } from '@/game-core';
import { t, type TranslationKey } from '@/i18n';
import { useHelden } from './useHelden';

/**
 * De held van dit kind, groot, op de voordeur — en te wisselen (ADR-142).
 *
 * Er liggen zestig tekeningen in `public/helden`: twaalf dieren in vijf
 * materialen, met de hand gemaakt. Een kind zag er precies één van, op dertig
 * pixels in de balk, naast zijn naam. Dat is de derde keer deze maand dat iets
 * gebouwd en getest is en nooit getoond wordt — na de munten (ADR-130), de kist
 * (ADR-138) en `roundPreview` (ADR-140).
 *
 * Hier staat hij op honderd pixels, als eerste ding op het scherm, naast "Welkom
 * Fien". Dat doet drie dingen tegelijk die geen tekst kan doen: het maakt de
 * voordeur van dít kind, het zet kleur op een pagina van papier en inkt, en het
 * geeft de kist een reden — een held die je nooit ziet is geen beloning.
 *
 * **En hij is te kiezen.** `setSticker` bestond, werd alleen door de kist
 * aangeroepen, en een kind kon dus nooit zeggen wie het wilde zijn. Nu wel: druk
 * op je held en je ziet iedereen die je hebt. Dat is de enige plek in dit
 * product waar een kind iets kiest wat niets met leren te maken heeft, en dat is
 * precies waarom het er hoort.
 *
 * **Alleen de helden die dit kind heeft.** Geen grijze silhouetten van wat er
 * nog te halen valt: welke held er uit een kist komt is de kist zijn werk
 * (ADR-081), en een rij dichte deuren op de voordeur is elke dag hetzelfde
 * verwijt.
 */
export function HeldHoek({
  sticker,
  onHeld,
}: {
  readonly sticker: string | undefined;
  readonly onHeld: (sticker: string) => void;
}) {
  const stand = useHelden();
  const [open, setOpen] = useState(false);

  const gedragen = stickerById(sticker);
  const reeks = reeksVanPlek(stand?.helden, STICKERS.indexOf(gedragen));

  // De helden die dit kind heeft, in de volgorde waarin ze getekend zijn. Tot
  // ze gelezen zijn is dat alleen de gedragen held: een rij die aangroeit
  // onder je ogen is een rij die iets beloofde wat er niet was.
  const eigen = (stand?.helden ?? []).map((held) => held.plek).sort((a, b) => a - b);

  return (
    <section className="tk-heldhoek" aria-label={t('held.titel')}>
      <button
        type="button"
        className="tk-heldhoek-knop"
        aria-expanded={open}
        aria-label={t('held.wissel', {
          naam: t(gedragen.name),
          reeks: t(`held.${reeks}` as TranslationKey),
        })}
        onClick={() => setOpen(!open)}
      >
        <Heldplaat sticker={gedragen.id} reeks={reeks} size={88} className="tk-heldhoek-beeld" />
        {/* De naam klein onder de tekening en niet ernaast: naast "Welkom Fien"
            leest een naam op kopgrootte als de titel van de pagina, en de titel
            hoort over het kind te gaan en niet over zijn dier. Wat de knop
            doet staat in zijn toegankelijke naam, want een derde regel tekst
            onder een plaatje is een bijsluiter. */}
        <span className="tk-heldhoek-naam">{open ? t('held.klaar') : t(gedragen.name)}</span>
      </button>

      {open ? (
        <ul className="tk-heldhoek-rij">
          {eigen.map((plek) => {
            const kandidaat = STICKERS[plek];
            if (!kandidaat) return null;
            const draagt = kandidaat.id === gedragen.id;

            return (
              <li key={plek}>
                <button
                  type="button"
                  className="tk-heldhoek-kaart"
                  aria-pressed={draagt}
                  onClick={() => {
                    onHeld(kandidaat.id);
                    setOpen(false);
                  }}
                >
                  <Heldplaat
                    sticker={kandidaat.id}
                    reeks={reeksVanPlek(stand?.helden, plek)}
                    size={64}
                  />
                  <span className="tk-heldhoek-kaartnaam">{t(kandidaat.name)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}

/** In welke reeks de held op deze plek staat, of brons zolang niets gelezen is. */
function reeksVanPlek(helden: readonly { plek: number; reeks: Reeks }[] | undefined, plek: number) {
  return helden?.find((held) => held.plek === plek)?.reeks ?? 'brons';
}
