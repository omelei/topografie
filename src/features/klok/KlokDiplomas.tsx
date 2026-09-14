import { useEffect, useState } from 'react';
import { KLOK_DIPLOMA_SETS, type KlokDiplomaSet } from '@/game-core';
import { t, type TranslationKey } from '@/i18n';
import { loadKlokDiplomas } from '@/store/rewardStore';
import { DiplomaRaster } from '@/features/badges/DiplomaRaster';
import { PremiumLabel } from '@/features/module/PremiumLabel';
import { PremiumSectie } from '@/features/premium/PremiumSlot';
import { usePremium } from '@/features/premium/usePremium';

/**
 * Four klokdiploma's, one per step of the clock, with the gaps showing
 * (ADR-117).
 *
 * The other walls' shape and their argument: every gap is one step a child
 * can decide to go and sit this afternoon. On the clock's page pressing one
 * chooses it — that step and the diploma — and on the child's own page the
 * same four are there to be looked at.
 */
export function KlokDiplomas({
  onKies,
  stil = false,
}: {
  /** Where pressing a diploma chooses its step. Absent where the wall is only shown. */
  readonly onKies?: ((setId: KlokDiplomaSet) => void) | undefined;
  /**
   * Whether this wall says nothing at all without a code (ADR-124). On the page
   * of its own module it carries the lock, because it is the only one there;
   * on Jij, where all three would stand under each other, one merged block
   * speaks for them and these three keep quiet.
   */
  readonly stil?: boolean;
}) {
  const { actief } = usePremium();
  const [behaald, setBehaald] = useState<ReadonlySet<KlokDiplomaSet> | null>(null);

  useEffect(() => {
    void loadKlokDiplomas().then(setBehaald);
  }, []);

  if (!actief) {
    return stil ? null : (
      <PremiumSectie titel={t('klok.diplomasTitle')} wat="premium.slot.klokDiplomas" />
    );
  }

  // Nothing until it is known: a wall that shows four gaps and then fills two
  // of them has told a child they had none.
  if (behaald === null) return null;

  return (
    <section className="flex flex-col gap-3" aria-label={t('klok.diplomasTitle')}>
      <div className="tk-sectie">
        <h2>{t('klok.diplomasTitle')}</h2>
        <PremiumLabel hoorbaar />
        <span className="tk-sectie-meta">
          {t('klok.diplomasCount', { aantal: behaald.size, totaal: KLOK_DIPLOMA_SETS.length })}
        </span>
      </div>

      <DiplomaRaster
        module="klok"
        vakken={KLOK_DIPLOMA_SETS.map((set) => {
          const stap = t(`set.${set}` as TranslationKey);
          const gehaald = behaald.has(set);

          return {
            key: set,
            titel: stap,
            label: gehaald ? t('klok.diplomaHave', { stap }) : t('klok.diplomaWant', { stap }),
            gehaald,
            onKies: onKies ? () => onKies(set) : undefined,
          };
        })}
      />
    </section>
  );
}
