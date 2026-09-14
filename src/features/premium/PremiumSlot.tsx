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
 * Sinds ADR-125 is `wat` verplicht in plaats van een sleutel met een terugval
 * op "Dit hoort bij premium". Een regel die met één weggelaten prop te omzeilen
 * is, is over een halfjaar geen regel meer; het type is de goedkoopste plek om
 * hem te bewaken, en de zin waarop teruggevallen werd bestaat niet meer.
 * `PremiumSectie` stond hier ook nog — een kop met een slot eronder — en had
 * sinds ADR-124 geen enkele gebruiker: elk blok dat premium is tekent zichzelf
 * zonder code niet.
 *
 * **De knop past bij wie ervoor staat.** "Code invullen" veronderstelt dat je al
 * gekocht hebt, en dat is bijna niemand die dit leest. De weg is naar de pagina
 * die uitlegt wat premium is; daar staat het codeveld voor wie er wel een heeft.
 */
export function PremiumSlot({
  kaal = false,
  wat,
}: {
  readonly kaal?: boolean;
  /** Wat dít ding voor je doet, in één zin. Verplicht: zie hierboven. */
  readonly wat: TranslationKey;
}) {
  const naarPremium = useNaarPremium();

  return (
    <div className={kaal ? 'flex flex-col gap-3' : 'tk-card flex flex-col gap-3'}>
      <p className="flex flex-wrap items-center gap-2 text-tekst-secundair">
        <PremiumLabel hoorbaar />
        {t(wat)}
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
