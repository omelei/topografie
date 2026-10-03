import { CorrectIcon } from '@/components/Icon';
import { t } from '@/i18n';

/**
 * "Vandaag": wat er klaarstaat om te herhalen (ADR-126).
 *
 * Sinds ADR-252 staat dat met premium als lijst op Vandaag (`HerhaalLijst` in
 * `HomeScreen`), met de eerste ronde als Nu doen; tot ADR-254 waren het vanaf
 * 768 tegels. Hier staat nog wat er met premium staat als alles klaar is: de
 * bevestiging, onder Nu doen (ADR-139). De beloning voor op schema zijn is niet
 * dat het blok verdwijnt. Zonder premium staat er niets (ADR-253).
 */

/** Klaar voor vandaag (ADR-139), als bevestiging onder Nu doen: in zon, want het is gehaald. */
export function KlaarVoorVandaag() {
  return (
    <section className="tk-klaar" aria-label={t('vandaag.titel')}>
      <span className="tk-klaar-teken" aria-hidden="true">
        <CorrectIcon size={22} />
      </span>
      <span className="tk-klaar-tekst">
        <span className="tk-klaar-kop">{t('vandaag.klaarVoorVandaag')}</span>
        <span className="tk-hulp">{t('vandaag.klaarUitleg')}</span>
      </span>
    </section>
  );
}
