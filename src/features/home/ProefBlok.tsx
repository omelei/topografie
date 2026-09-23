import { naarPremium, usePremium } from '@/features/premium/usePremium';
import { t } from '@/i18n';
import { PROEF_NAZEGGEN } from '@/store/proef';

/**
 * Wat de proef van premium op de voordeur zegt (ADR-193), en alleen als er iets
 * te zeggen is.
 *
 * Drie keer, en daartussen niets:
 *
 * - **De eerste dagen:** dat alles open staat, en voor hoe lang. Een kind dat
 *   gisteren alleen meerkeuze kon, ziet vandaag bliksemrondes en diploma's; het
 *   hoort te weten waarom, en dat het geen vergissing is.
 * - **De laatste dagen:** hoeveel er nog over zijn. Zonder aankondiging voelt
 *   het einde als iets wat afgepakt wordt.
 * - **Een week na afloop:** dat het voorbij is en dat er niets weg is. Anders
 *   leest een kind de sloten als "mijn diploma's zijn weg".
 *
 * Geen knop in de eerste dagen: dan is er niets te verkopen, alleen iets uit te
 * leggen. Daarna de gewone weg naar premium, net als elk slot (ADR-124).
 */
export function ProefBlok() {
  const { proef } = usePremium();

  if (proef.soort === 'loopt' && proef.eersteDagen) {
    return <Blok kop={t('proef.kopNog', { dagen: proef.dagenOver })} tekst={t('proef.welkom')} />;
  }

  if (proef.soort === 'loopt' && proef.dagenOver <= 3) {
    return (
      <Blok
        kop={
          proef.dagenOver === 1
            ? t('proef.kopLaatste')
            : t('proef.kopNog', { dagen: proef.dagenOver })
        }
        tekst={t('proef.bijnaKlaar')}
        knop
      />
    );
  }

  if (proef.soort === 'voorbij' && proef.dagenGeleden <= PROEF_NAZEGGEN) {
    return <Blok kop={t('proef.kopVoorbij')} tekst={t('proef.voorbij')} knop />;
  }

  return null;
}

function Blok({
  kop,
  tekst,
  knop = false,
}: {
  readonly kop: string;
  readonly tekst: string;
  readonly knop?: boolean;
}) {
  return (
    <section className="tk-card flex flex-col gap-3" aria-label={t('proef.titel')}>
      <h2 className="tk-lijstrij-titel">{kop}</h2>
      <p className="text-lopend text-tekst-secundair">{tekst}</p>
      {knop ? (
        <button
          type="button"
          className="tk-button tk-button-secondary self-start"
          onClick={naarPremium}
        >
          {t('premium.slotKnop')}
        </button>
      ) : null}
    </section>
  );
}
