import { PremiumLabel } from '@/features/module/PremiumLabel';
import { t, type TranslationKey } from '@/i18n';
import { useNaarPremium } from './usePremium';

/**
 * Wat er staat waar iets van premium zou staan (ADR-116, ADR-124).
 *
 * **Het is geen teaser.** Er wordt niets van het blok achter getekend, vervaagd
 * of anders: een plaatje van een beloning die een kind niet kan krijgen is een
 * kleine wreedheid. Die regel staat sinds ADR-116 en blijft staan — voor
 * belóningen. Wat een ouder moet begrijpen om te kunnen kiezen is geen beloning,
 * en daar toont het product sinds ADR-124 wél iets (de Onthouden-pagina laat
 * zien wat ze zou laten zien).
 *
 * **Het zegt wat het doet.** "Dit hoort bij premium" draagt geen informatie: het
 * meldt een deur, niet wat erachter zit. Elk slot geeft daarom een `wat` mee —
 * één zin over wat dít ding voor je doet. Wie niets te zeggen heeft over wat er
 * achter de deur zit, hoort er ook geen deur te zetten.
 *
 * **De knop past bij wie ervoor staat.** "Code invullen" veronderstelt dat je al
 * gekocht hebt, en dat is bijna niemand die dit leest. De weg is naar de pagina
 * die uitlegt wat premium is; daar staat het codeveld voor wie er wel een heeft.
 */
export function PremiumSectie({
  titel,
  wat,
}: {
  readonly titel: string;
  readonly wat?: TranslationKey | undefined;
}) {
  return (
    <section className="flex flex-col gap-3" aria-label={titel}>
      <h2 className="tk-sectie">{titel}</h2>
      <PremiumSlot wat={wat} />
    </section>
  );
}

export function PremiumSlot({
  kaal = false,
  wat,
}: {
  readonly kaal?: boolean;
  readonly wat?: TranslationKey | undefined;
}) {
  const naarPremium = useNaarPremium();

  return (
    <div className={kaal ? 'flex flex-col gap-3' : 'tk-card flex flex-col gap-3'}>
      <p className="flex flex-wrap items-center gap-2 text-tekst-secundair">
        <PremiumLabel hoorbaar />
        {t(wat ?? 'premium.slot')}
      </p>
      <button
        type="button"
        className="tk-button tk-button-secondary self-start"
        onClick={naarPremium}
      >
        {t('premium.slotKnop')}
      </button>
    </div>
  );
}
