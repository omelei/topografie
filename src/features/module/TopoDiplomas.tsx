import { useEffect, useState } from 'react';
import { TOPO_DIPLOMA_SETS, type TopoDiplomaSet } from '@/game-core';
import { t } from '@/i18n';
import { loadTopoDiplomas } from '@/store/rewardStore';
import { DiplomaRaster } from '@/features/badges/DiplomaRaster';
import { PremiumSectie } from '@/features/premium/PremiumSlot';
import { usePremium } from '@/features/premium/usePremium';
import { PremiumLabel } from './PremiumLabel';
import { KAART_NAAM } from './topoDiplomaNamen';

/**
 * Eleven topodiploma's, one per map, with the gaps showing (ADR-117): the five
 * Dutch maps and the six werelddelen, in the order the page offers them.
 *
 * The other walls' shape and their argument. On the topography page pressing
 * a gap chooses that map — the region follows it — and the diploma; on the
 * child's own page the same eleven are there to be looked at.
 */
export function TopoDiplomas({
  onKies,
}: {
  /** Where pressing a diploma chooses its map. Absent where the wall is only shown. */
  readonly onKies?: ((setId: TopoDiplomaSet) => void) | undefined;
}) {
  const { actief } = usePremium();
  const [behaald, setBehaald] = useState<ReadonlySet<TopoDiplomaSet> | null>(null);

  useEffect(() => {
    void loadTopoDiplomas().then(setBehaald);
  }, []);

  if (!actief) return <PremiumSectie titel={t('topo.diplomasTitle')} />;

  // Nothing until it is known, for the reason every wall gives.
  if (behaald === null) return null;

  return (
    <section className="flex flex-col gap-3" aria-label={t('topo.diplomasTitle')}>
      <div className="tk-sectie">
        <h2>{t('topo.diplomasTitle')}</h2>
        <PremiumLabel hoorbaar />
        <span className="tk-sectie-meta">
          {t('topo.diplomasCount', { aantal: behaald.size, totaal: TOPO_DIPLOMA_SETS.length })}
        </span>
      </div>

      <DiplomaRaster
        module="topo"
        vakken={TOPO_DIPLOMA_SETS.map((set) => {
          const kaart = t(KAART_NAAM[set]);
          const gehaald = behaald.has(set);

          return {
            key: set,
            titel: kaart,
            label: gehaald ? t('topo.diplomaHave', { kaart }) : t('topo.diplomaWant', { kaart }),
            gehaald,
            onKies: onKies ? () => onKies(set) : undefined,
          };
        })}
      />
    </section>
  );
}
