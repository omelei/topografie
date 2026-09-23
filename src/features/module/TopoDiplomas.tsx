import { useEffect, useState } from 'react';
import { TOPO_DIPLOMA_SETS, type TopoDiplomaSet } from '@/game-core';
import { t } from '@/i18n';
import { loadTopoDiplomas } from '@/store/rewardStore';
import { DiplomaRaster } from '@/features/badges/DiplomaRaster';
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
  alleenBehaald = false,
  stilAlsLeeg = false,
}: {
  /** Where pressing a diploma chooses its map. Absent where the wall is only shown. */
  readonly onKies?: ((setId: TopoDiplomaSet) => void) | undefined;
  /** Alleen tonen wat gehaald is (ADR-143), met de stand erboven. */
  readonly alleenBehaald?: boolean;
  /** Niets tonen zolang er niets gehaald is (ADR-158). */
  readonly stilAlsLeeg?: boolean;
}) {
  const [behaald, setBehaald] = useState<ReadonlySet<TopoDiplomaSet> | null>(null);

  useEffect(() => {
    void loadTopoDiplomas().then(setBehaald);
  }, []);

  // Ook zonder code getekend (ADR-192): de ringen zijn te zien, halen kan met
  // premium. Het label in de kop zegt dat, en de toets vraagt om de code.
  // Nothing until it is known, for the reason every wall gives.
  if (behaald === null) return null;
  // Op Jij zwijgt een lege wand (ADR-158): een kop met "0 van de 12" erboven
  // zegt een kind op dag een dat het niets heeft. Op een vakpagina staat hij
  // wel, want daar is een gat iets om op te mikken.
  if (stilAlsLeeg && behaald.size === 0) return null;

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
        vakken={(alleenBehaald
          ? TOPO_DIPLOMA_SETS.filter((id) => behaald.has(id))
          : TOPO_DIPLOMA_SETS
        ).map((set) => {
          const kaart = t(KAART_NAAM[set]);
          const gehaald = behaald.has(set);

          return {
            key: set,
            diplomaId: `diploma-topo-${set}`,
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
