import { useEffect, useState } from 'react';
import { KLOK_DIPLOMA_SETS, type KlokDiplomaSet } from '@/game-core';
import { t, type TranslationKey } from '@/i18n';
import { loadKlokDiplomas } from '@/store/rewardStore';
import { DiplomaRaster } from '@/features/badges/DiplomaRaster';
import { PremiumLabel } from '@/features/module/PremiumLabel';
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
  alleenBehaald = false,
}: {
  /** Where pressing a diploma chooses its step. Absent where the wall is only shown. */
  readonly onKies?: ((setId: KlokDiplomaSet) => void) | undefined;
  /** Alleen tonen wat gehaald is (ADR-143), met de stand erboven. */
  readonly alleenBehaald?: boolean;
}) {
  const { actief } = usePremium();
  const [behaald, setBehaald] = useState<ReadonlySet<KlokDiplomaSet> | null>(null);

  useEffect(() => {
    void loadKlokDiplomas().then(setBehaald);
  }, []);

  // Zonder code helemaal niet getekend, in plaats van als een eigen slot
  // (ADR-124). Op Jij stonden vijf van deze secties onder elkaar, elk met
  // hetzelfde zinnetje eronder: vijf keer dezelfde vraag is geen aanbod maar
  // ruis. Eén blok onderaan die pagina zegt nu wat ze samen zijn.
  if (!actief) return null;

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
        vakken={(alleenBehaald
          ? KLOK_DIPLOMA_SETS.filter((id) => behaald.has(id))
          : KLOK_DIPLOMA_SETS
        ).map((set) => {
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
