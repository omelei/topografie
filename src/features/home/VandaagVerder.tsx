import { t } from '@/i18n';
import { NextIcon } from '@/components/Icon';
import { useVandaag } from './useVandaag';

/**
 * Hoeveel er nog van vandaag over is, aan het eind van een ronde (ADR-139).
 *
 * Het dagplan slonk al — het wordt elke keer opnieuw gerekend — maar een kind
 * zag het niet gebeuren: het verliet het scherm en kwam terug op een ander. Hier
 * staat het op het moment zelf, met de knop naar de volgende erbij, zodat de dag
 * doorloopt in plaats van telkens via de voordeur.
 *
 * **Niets als vandaag klaar is.** De voordeur zegt dat, en hier zou het een
 * felicitatie zijn op een scherm dat al over deze ronde gaat. Wat hier staat is
 * alleen wat er nog te doen is.
 *
 * **Niets zonder plan.** Wie geen dagplan heeft — geen code, of niets aan de
 * beurt — ziet hier niets. Dit blok telt af, het verkoopt niet.
 */
export function VandaagVerder({ onVerder }: { readonly onVerder: () => void }) {
  const vandaag = useVandaag();
  if (vandaag === null || vandaag.volgende === null) return null;

  const { over } = vandaag.voortgang;
  if (over <= 0) return null;

  return (
    <button type="button" className="tk-lijstrij tk-vandaag-verder" onClick={onVerder}>
      <span className="tk-lijstrij-tekst">
        <span className="tk-lijstrij-titel">
          {over === 1 ? t('vandaag.overEen') : t('vandaag.over', { aantal: over })}
        </span>
        <span className="tk-lijstrij-regel">{t('vandaag.verder')}</span>
      </span>
      <span className="tk-lijstrij-pijl">
        <NextIcon size={20} />
      </span>
    </button>
  );
}
