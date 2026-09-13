import { useEffect, useState } from 'react';
import { DIPLOMA_WERELDDELEN, type DiplomaWerelddeel } from '@/game-core';
import { t, type TranslationKey } from '@/i18n';
import { loadVlagDiplomas } from '@/store/rewardStore';
import { DiplomaRaster } from '@/features/badges/DiplomaRaster';
import { PremiumLabel } from '@/features/module/PremiumLabel';

/**
 * Six vlaggendiploma's, one per werelddeel, with the gaps showing (ADR-104).
 *
 * The tafeldiploma wall's shape and its argument: every gap is one werelddeel a
 * child can decide to go and sit this afternoon, so on the flags page pressing
 * one chooses it — the werelddeel, all its flags, and the diploma — and on the
 * child's own page the same six are there to be looked at (ADR-112).
 */
export function VlagDiplomas({
  onKies,
}: {
  /** Where pressing a diploma chooses it. Absent where the wall is only shown. */
  readonly onKies?: ((deel: DiplomaWerelddeel) => void) | undefined;
}) {
  const [behaald, setBehaald] = useState<ReadonlySet<DiplomaWerelddeel> | null>(null);

  useEffect(() => {
    void loadVlagDiplomas().then(setBehaald);
  }, []);

  // Nothing until it is known: a wall that shows six gaps and then fills two of
  // them has told a child they had none.
  if (behaald === null) return null;

  return (
    <section className="flex flex-col gap-3" aria-label={t('vlag.diplomasTitle')}>
      <div className="tk-sectie">
        <h2>{t('vlag.diplomasTitle')}</h2>
        <PremiumLabel hoorbaar />
        <span className="tk-sectie-meta">
          {t('vlag.diplomasCount', { aantal: behaald.size, totaal: DIPLOMA_WERELDDELEN.length })}
        </span>
      </div>

      <DiplomaRaster
        module="vlaggen"
        vakken={DIPLOMA_WERELDDELEN.map((deel) => {
          const naam = t(`regio.${deel}` as TranslationKey);
          const gehaald = behaald.has(deel);

          return {
            key: deel,
            titel: naam,
            label: gehaald
              ? t('vlag.diplomaHave', { deel: naam })
              : t('vlag.diplomaWant', { deel: naam }),
            gehaald,
            onKies: onKies ? () => onKies(deel) : undefined,
          };
        })}
      />
    </section>
  );
}
