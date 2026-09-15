import { useEffect, useState } from 'react';
import { DIPLOMA_WERELDDELEN, type DiplomaWerelddeel } from '@/game-core';
import { t, type TranslationKey } from '@/i18n';
import { loadVlagDiplomas } from '@/store/rewardStore';
import { DiplomaRaster } from '@/features/badges/DiplomaRaster';
import { PremiumLabel } from '@/features/module/PremiumLabel';
import { usePremium } from '@/features/premium/usePremium';

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
  alleenBehaald = false,
}: {
  /** Where pressing a diploma chooses it. Absent where the wall is only shown. */
  readonly onKies?: ((deel: DiplomaWerelddeel) => void) | undefined;
  /** Alleen tonen wat gehaald is (ADR-143), met de stand erboven. */
  readonly alleenBehaald?: boolean;
}) {
  const { actief } = usePremium();
  const [behaald, setBehaald] = useState<ReadonlySet<DiplomaWerelddeel> | null>(null);

  useEffect(() => {
    void loadVlagDiplomas().then(setBehaald);
  }, []);

  // Zonder code helemaal niet getekend, in plaats van als een eigen slot
  // (ADR-124). Op Jij stonden vijf van deze secties onder elkaar, elk met
  // hetzelfde zinnetje eronder: vijf keer dezelfde vraag is geen aanbod maar
  // ruis. Eén blok onderaan die pagina zegt nu wat ze samen zijn.
  if (!actief) return null;

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
        vakken={(alleenBehaald
          ? DIPLOMA_WERELDDELEN.filter((id) => behaald.has(id))
          : DIPLOMA_WERELDDELEN
        ).map((deel) => {
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
