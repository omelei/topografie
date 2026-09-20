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
 * **Als vandaag af is, zegt de uitslag dat zelf** (ADR-149): "Klaar voor
 * vandaag", met Klaar als eerste knop. Dit blok stond daar eerst met de held
 * van het kind; die held is met ADR-149 vervallen, en twee keer "af" onder
 * elkaar is er één te veel.
 *
 * **Niets zonder plan.** Wie geen dagplan heeft — geen code, of niets aan de
 * beurt — ziet hier niets. Dit blok telt af, het verkoopt niet. Een dag die leeg
 * begon is ook niet "af": `voortgang.klaar` is onwaar zodra er niets te doen
 * viel, en een lege dag vieren is een compliment voor niets doen.
 */
export function VandaagVerder({ onVerder }: { readonly onVerder: () => void }) {
  const vandaag = useVandaag();
  if (vandaag === null) return null;

  if (vandaag.voortgang.klaar || vandaag.volgende === null) return null;

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
