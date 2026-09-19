import type { Reeks } from '@/game-core';
import { t } from '@/i18n';

/**
 * De reeks: dagen op rij met een afgemaakte ronde (ADR-158).
 *
 * Op twee plekken en niet meer: onderaan Ronde klaar, en op Jij. Niet op de
 * voordeur en niet in de ronde — daar zou hij gaan meekijken terwijl een kind
 * aan het werk is.
 *
 * **Hij straft niet.** Het record blijft staan, ook als de reeks breekt, en
 * breken kost geen enkele steen. Daarom gaat de zin bij een nieuwe start over
 * de toren en niet over wat er weg is.
 */
export function ReeksBlok({ reeks }: { readonly reeks: Reeks | null }) {
  if (reeks === null) return null;

  return (
    <section className="tk-card tk-dagenreeks" aria-label={t('reeks.naam')}>
      <h2 className="tk-label">{t('reeks.naam')}</h2>

      {reeks.dagen === 0 ? (
        <p className="text-lopend">{t('reeks.leeg')}</p>
      ) : (
        <>
          <p className="tk-dagenreeks-getal">
            <span className="tk-dagenreeks-aantal">{reeks.dagen}</span>
            <span className="tk-dagenreeks-zin">
              {reeks.dagen === 1 ? t('reeks.dagenEen') : t('reeks.dagen', { aantal: reeks.dagen })}
            </span>
          </p>
          {reeks.vandaagTelt ? <p className="text-lopend">{t('reeks.vandaag')}</p> : null}
        </>
      )}

      {reeks.record > 0 ? (
        <p className="tk-hulp">
          {reeks.record === 1 ? t('reeks.recordEen') : t('reeks.record', { aantal: reeks.record })}
        </p>
      ) : null}
      <p className="tk-hulp">{t('reeks.uitleg')}</p>
    </section>
  );
}
