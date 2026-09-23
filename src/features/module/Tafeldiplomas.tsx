import { useEffect, useState } from 'react';
import { t } from '@/i18n';
import { loadDiplomas } from '@/store/rewardStore';
import { DiplomaRaster } from '@/features/badges/DiplomaRaster';
import { PremiumLabel } from './PremiumLabel';

/** One to twelve, which is every table the product has. */
const TAFELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/**
 * Twelve diplomas, on the page the tables live on and on the child's own page.
 *
 * The tafeltoets is the one thing about the tables a Dutch child already has an
 * opinion about before they meet this app: it is what the teacher hands out,
 * and "ik heb de tafel van 7" is a sentence they have heard and want to be able
 * to say. So the product offers it, in the shape it already has — the whole
 * table, all ten right, one mistake and you sit it again — and shows the twelve
 * as a wall with the gaps visible (ADR-064).
 *
 * The gaps are the point. This is twelve named tables, in the order they are
 * taught, and every gap is a thing a child can decide to go and do this
 * afternoon: on the rekenen page pressing one chooses that table and the
 * diploma. On the child's own page the same wall is shown, not pressed — it is
 * where the badges are (ADR-112).
 *
 * Free from ADR-122 to ADR-192, alone among the diplomas. Since ADR-192 every
 * diploma is premium, this one too: the wall is still shown without a code, so
 * a child sees the twelve it can aim for, and sitting the toets asks for one.
 */
export function Tafeldiplomas({
  onKies,
  alleenBehaald = false,
  stilAlsLeeg = false,
}: {
  /** Where pressing a diploma chooses its table. Absent where the wall is only shown. */
  readonly onKies?: ((setId: string) => void) | undefined;
  /** Alleen tonen wat gehaald is (ADR-143), met de stand erboven. */
  readonly alleenBehaald?: boolean;
  /** Niets tonen zolang er niets gehaald is (ADR-158). */
  readonly stilAlsLeeg?: boolean;
}) {
  const [behaald, setBehaald] = useState<ReadonlySet<number> | null>(null);

  useEffect(() => {
    void loadDiplomas().then(setBehaald);
  }, []);

  // Nothing until it is known: a wall that shows twelve gaps and then fills
  // four of them has told a child they had none.
  if (behaald === null) return null;
  // Op Jij zwijgt een lege wand (ADR-158): een kop met "0 van de 12" erboven
  // zegt een kind op dag een dat het niets heeft. Op een vakpagina staat hij
  // wel, want daar is een gat iets om op te mikken.
  if (stilAlsLeeg && behaald.size === 0) return null;

  return (
    <section className="flex flex-col gap-3" aria-label={t('rekenen.diplomasTitle')}>
      <div className="tk-sectie">
        <h2>{t('rekenen.diplomasTitle')}</h2>
        <PremiumLabel hoorbaar />
        <span className="tk-sectie-meta">
          {t('rekenen.diplomasCount', { aantal: behaald.size, totaal: TAFELS.length })}
        </span>
      </div>

      <DiplomaRaster
        module="tafels"
        vakken={(alleenBehaald ? TAFELS.filter((tafel) => behaald.has(tafel)) : TAFELS).map(
          (tafel) => ({
            key: String(tafel),
            diplomaId: `diploma-tafel-${tafel}`,
            titel: t('sums.table', { tafel }),
            label: behaald.has(tafel)
              ? t('rekenen.diplomaHave', { tafel })
              : t('rekenen.diplomaWant', { tafel }),
            gehaald: behaald.has(tafel),
            onKies: onKies ? () => onKies(`tafel-${tafel}`) : undefined,
          }),
        )}
      />
    </section>
  );
}
