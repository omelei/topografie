import { useState, type ReactNode } from 'react';
import { t } from '@/i18n';
import { bevestigOuder, isOuderBevestigd } from '@/features/ouder/bevestigd';
import { Volwassenencheck } from '@/features/ouder/Volwassenencheck';
import { useOuder } from '@/features/ouder/useOuder';

/**
 * De deur voor de premiumpagina (ADR-232).
 *
 * Op de premiumpagina staan de prijs en de knop om te kopen, en die horen niet
 * bij een kind (R-11). Dus vraagt de pagina eerst of het een ouder is, met
 * dezelfde vraag als de ouderpagina (ADR-176): het geboortejaar, gecontroleerd
 * en weggegooid. Wie het niet weet, komt er niet in en gaat terug.
 *
 * **Eén keer per tabblad** (`bevestigd.ts`). En wie de ouderpagina al met de
 * pincode opende, is de ouder al.
 *
 * Het blijft een hek en geen kluis, net als de check zelf: een kind van twaalf
 * dat het doorheeft, tikt een jaartal in.
 */

export function PremiumPoort({
  onTerug,
  children,
}: {
  readonly onTerug: () => void;
  readonly children: ReactNode;
}) {
  const { ouder } = useOuder();
  const [bevestigd, setBevestigd] = useState(isOuderBevestigd);

  if (ouder || bevestigd) return <>{children}</>;

  return (
    <div className="tk-page">
      <div className="tk-page-main">
        <div className="tk-card flex max-w-md flex-col gap-3">
          <Volwassenencheck
            titel={t('premium.poortTitel')}
            uitleg={t('premium.poortUitleg')}
            onGoed={() => {
              bevestigOuder();
              setBevestigd(true);
            }}
          />
          <button
            type="button"
            className="tk-button tk-button-tertiary self-start"
            onClick={onTerug}
          >
            {t('premium.poortTerug')}
          </button>
        </div>
      </div>
    </div>
  );
}
