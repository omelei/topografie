import { delenVan, regioById, werelddelen, type RegioId } from '@/game-core';
import { t, type TranslationKey } from '@/i18n';

/**
 * De knoppen om in te zoomen op de wereldkaart (ADR-146).
 *
 * Twee rijen. De eerste is de hele wereld en de zes werelddelen; de tweede
 * verschijnt pas als het gekozen werelddeel delen heeft, met het hele werelddeel
 * vooraan. Zo staan er nooit meer dan zeven knoppen tegelijk, en hoeft een kind
 * dat Luxemburg zoekt niet uit negentien gebieden te kiezen: eerst Europa, dan
 * West-Europa.
 *
 * Een rij die niet past scrolt opzij in plaats van te wikkelen: twee regels
 * knoppen die er vier worden, zouden op een telefoon de kaart wegduwen waarvoor
 * ze bedoeld zijn.
 */
export function ZoomKiezer({
  regio,
  onRegio,
}: {
  readonly regio: RegioId | null;
  readonly onRegio: (regio: RegioId | null) => void;
}) {
  const werelddeel = regio === null ? null : (regioById(regio).ouder ?? regio);
  const delen = werelddeel === null ? [] : delenVan(werelddeel);

  return (
    <nav className="tk-zoom" aria-label={t('zoom.label')}>
      <div className="tk-zoom-rij">
        <button
          type="button"
          className="tk-zoomknop"
          aria-pressed={regio === null}
          onClick={() => onRegio(null)}
        >
          {t('zoom.wereld')}
        </button>
        {werelddelen().map((deel) => (
          <button
            key={deel.id}
            type="button"
            className="tk-zoomknop"
            aria-pressed={werelddeel === deel.id}
            onClick={() => onRegio(deel.id)}
          >
            {t(`zoom.${deel.id}` as TranslationKey)}
          </button>
        ))}
      </div>

      {werelddeel !== null && delen.length > 0 ? (
        <div className="tk-zoom-rij">
          <button
            type="button"
            className="tk-zoomknop"
            aria-pressed={regio === werelddeel}
            onClick={() => onRegio(werelddeel)}
          >
            {t('zoom.heel', { naam: t(`zoom.${werelddeel}` as TranslationKey) })}
          </button>
          {delen.map((deel) => (
            <button
              key={deel.id}
              type="button"
              className="tk-zoomknop"
              aria-pressed={regio === deel.id}
              onClick={() => onRegio(deel.id)}
            >
              {t(`zoom.${deel.id}` as TranslationKey)}
            </button>
          ))}
        </div>
      ) : null}
    </nav>
  );
}
