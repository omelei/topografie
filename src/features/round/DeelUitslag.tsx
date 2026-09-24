import { useState } from 'react';
import { deel as delen, type DeelUitkomst } from '@/features/delen/deel';
import { naamVan, type Onderdeel } from '@/features/module/onderdelen';
import { pathFor } from '@/features/shell/routes';
import { MODULES } from '@/features/shell/modules';
import { t } from '@/i18n';
import { tel } from '@/store/teller';

/**
 * "Deel je uitslag" (ADR-209): na een ronde, met een link naar hetzelfde
 * onderwerp.
 *
 * Wie de link opent, komt op de pagina van dat onderwerp en kan meteen een
 * ronde spelen, ook zonder naam (ADR-208). Zo brengt een kind dat deelt een
 * nieuwe bezoeker mee.
 *
 * **Er gaat alleen de uitslag en het onderwerp mee.** Geen naam, geen
 * voortgang: het bericht reist via WhatsApp of de telefoon van een ouder.
 */
export function DeelUitslag({
  deel,
  goed,
  totaal,
}: {
  readonly deel: Onderdeel;
  readonly goed: number;
  readonly totaal: number;
}) {
  const [stand, setStand] = useState<'klaar' | 'bezig' | DeelUitkomst>('klaar');
  const module = MODULES.find((kandidaat) => kandidaat.id === deel.moduleId);
  if (!module) return null;

  const onderwerp = naamVan(deel);
  const pad = pathFor({ name: 'module', module, setId: deel.setId });
  const adres = `${window.location.origin}${pad}`;
  const tekst = t('delen.bericht', { goed, totaal, onderwerp });

  async function deelNu() {
    setStand('bezig');
    const uitkomst = await delen({ titel: t('delen.titel', { onderwerp }), tekst, adres });
    if (uitkomst !== 'handmatig') tel('gedeeld', pad);
    setStand(uitkomst);
  }

  return (
    <div className="flex flex-col gap-3">
      {stand === 'gedeeld' || stand === 'gekopieerd' ? (
        <p role="status" className="tk-melding" data-soort="gelukt">
          {stand === 'gedeeld' ? t('delen.gedeeld') : t('delen.gekopieerd')}
        </p>
      ) : (
        <button
          type="button"
          className="tk-button tk-button-tertiary self-start"
          disabled={stand === 'bezig'}
          onClick={() => void deelNu()}
        >
          {t('delen.knop')}
        </button>
      )}
      {/* Delen en kopiëren deden niets: de zin en de link staan er zelf, om over
          te tikken of vast te pakken. */}
      {stand === 'handmatig' ? (
        <div role="status" className="flex flex-col gap-2">
          <p className="text-lopend">{t('delen.zelf')}</p>
          <p className="tk-adres">{`${tekst} ${adres}`}</p>
        </div>
      ) : null}
    </div>
  );
}
