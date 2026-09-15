import { t } from '@/i18n';
import type { Sterstand } from './ster';

/**
 * De ster die aankomt, naast de klim (ADR-137) in dezelfde terugkoppelkaart.
 *
 * Tien treden die vollopen, en bij de tiende landt de ster. Het staat hier en
 * niet in de rondebalk, om twee redenen. In de balk staan al tien stippen —
 * de tien vragen van deze ronde — en twee rijen van tien die verschillende
 * dingen tellen, is voor een kind van tien geen voortgang maar een raadsel. En
 * hier gebeurt het: dit is de plek waar het geluid klinkt, het teken landt en
 * het maatje binnenkomt, dus is het één gebeurtenis en niet vier.
 *
 * **Alleen na een goed antwoord**, net als de klim. Een rij die na een misser
 * laat zien hoe ver je nog moet, is een verwijt, en ADR-048 maakt het niet
 * weten in dit product overal goedkoop.
 *
 * De zin eronder verschilt op het moment zelf: onderweg staat er hoeveel er nog
 * tot de kist te gaan is — het enige getal in dit product dat over meerdere
 * dagen loopt — en op de ster zelf staat de hoeveelste van de vijf het is.
 */
export function Ster({ stand }: { readonly stand: Sterstand }) {
  const treden = Array.from({ length: stand.treden }, (_, i) => i + 1);

  return (
    <p className="tk-ster" data-vol={stand.voltooid ? 'ja' : undefined}>
      <span className="tk-ster-rij" aria-hidden="true">
        {treden.map((trede) => (
          <span
            key={trede}
            className="tk-ster-trede"
            data-vol={trede <= stand.vol ? 'ja' : undefined}
            data-nieuw={trede === stand.vol ? 'ja' : undefined}
          />
        ))}
        <SterTeken />
      </span>
      <span className="tk-ster-woord">
        {stand.voltooid
          ? t('ster.gehaald', { ster: stand.ster, totaal: stand.sterrenPerKist })
          : t('ster.onderweg', { aantal: stand.totKist })}
      </span>
    </p>
  );
}

/**
 * De ster zelf. Eén vorm, en hij staat er altijd: grijs zolang de rij nog
 * loopt, in de kleur van de module zodra hij verdiend is. Een teken dat pas
 * verschijnt, verspringt de regel eronder.
 */
function SterTeken() {
  return (
    <span className="tk-ster-teken">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" focusable="false">
        <path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.4-5.8-3-5.8 3 1.1-6.4L2.6 9.4l6.5-.9z" />
      </svg>
    </span>
  );
}
