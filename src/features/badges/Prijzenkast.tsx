import { useEffect, useId, useState } from 'react';
import { KlokDiplomas } from '@/features/klok/KlokDiplomas';
import { Tafeldiplomas } from '@/features/module/Tafeldiplomas';
import { TopoDiplomas } from '@/features/module/TopoDiplomas';
import { VlagDiplomas } from '@/features/vlaggen/VlagDiplomas';
import { t } from '@/i18n';

/**
 * De diploma's, op twee plekken en met twee betekenissen (ADR-158).
 *
 * **Op Jij staat alleen wat gehaald is.** Dat is wat dit kind gebouwd heeft, en
 * het hoort bij de toren en de reeks. Is er nog niets, dan staat er niets: vier
 * lege wanden met een kop erboven zeggen een kind dat het niets heeft, en dat
 * is op dag één de verkeerde boodschap.
 *
 * **Op Voor ouders staat het hele raster.** Drieëndertig vakjes, waarvan de
 * meeste leeg — en dáár zijn de gaten het punt (ADR-064): een ouder kan er iets
 * mee, een kind van zes kijkt ertegenaan. Dit is ook waar het diploma hoort
 * sinds het een toets is en geen beloning: bij degene die de toets afneemt.
 */
export function BehaaldeDiplomas() {
  return (
    <div className="flex flex-col gap-6">
      <Tafeldiplomas alleenBehaald stilAlsLeeg />
      <VlagDiplomas alleenBehaald stilAlsLeeg />
      <KlokDiplomas alleenBehaald stilAlsLeeg />
      <TopoDiplomas alleenBehaald stilAlsLeeg />
    </div>
  );
}

export function Prijzenkast({
  open = false,
  onGezien,
}: {
  /** Binnengekomen via "Bekijk alle diploma's": de kast in beeld (ADR-153). */
  readonly open?: boolean;
  readonly onGezien?: (() => void) | undefined;
}) {
  const [alles, setAlles] = useState(open);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    document.getElementById(id)?.scrollIntoView({ block: 'start' });
    onGezien?.();
    // Eén keer, bij binnenkomst.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div id={id} className="flex flex-col gap-6">
      <Tafeldiplomas alleenBehaald={!alles} />
      <VlagDiplomas alleenBehaald={!alles} />
      <KlokDiplomas alleenBehaald={!alles} />
      <TopoDiplomas alleenBehaald={!alles} />

      <p>
        <button
          type="button"
          className="tk-button tk-button-secondary"
          aria-expanded={alles}
          onClick={() => setAlles(!alles)}
        >
          {alles ? t('prijzenkast.minder') : t('prijzenkast.meer')}
        </button>
      </p>
    </div>
  );
}
