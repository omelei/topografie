import type { CSSProperties } from 'react';
import type { Uitdrukking } from '@/components/Brandmark';
import { LevendeDenker } from '@/components/LevendeDenker';

/**
 * De kop van een pagina: het koraal vlak van Vandaag, met de kop, één regel
 * eronder en Denker ernaast (ADR-255).
 *
 * Vandaag op een telefoon begon met één koraal blok (ADR-252), en de andere
 * pagina's met een losse kop op de grond, of op Jij een etalage zonder Denker.
 * Nu begint elke pagina zoals Vandaag: hetzelfde vlak, dezelfde maat en
 * dezelfde vorm in de hoek. Cacao op koraal 5,72. Een knop staat er niet in:
 * koraal op koraal is geen knop.
 *
 * Sinds ADR-259 groeit het vlak mee met het scherm, met Denker groot erin, en
 * kan Denker iets zeggen: een witte ballon onder de kop (`zin`). Op Oefenen
 * zegt hij wat hij van het vak vindt waar je naar wijst.
 */
export function Paginakop({
  kop,
  regel,
  zin,
  zinKleur,
  uitdrukking = 'denken',
  niveau,
  onKietel,
  kietelLabel,
}: {
  readonly kop: string;
  readonly regel?: string | undefined;
  readonly zin?: string | undefined;
  /** De kleur van de woorden in de ballon: inkt, of de diepe toon van een vak. */
  readonly zinKleur?: string | undefined;
  readonly uitdrukking?: Uitdrukking;
  readonly niveau?: 0 | 1 | 2 | 3 | undefined;
  readonly onKietel?: (() => void) | undefined;
  readonly kietelLabel?: string | undefined;
}) {
  return (
    <div className="tk-etalage tk-welkom tk-welkom-nu tk-paginakop">
      <span className="tk-welkom-vorm tk-welkom-cirkel" aria-hidden="true" />
      <span className="tk-welkom-vorm tk-welkom-zon" aria-hidden="true" />
      <span className="tk-welkom-vorm tk-welkom-room" aria-hidden="true" />
      <div className="tk-welkom-boven">
        <div className="tk-welkom-tekst">
          <h1 className="tk-welkom-kop">{kop}</h1>
          {regel === undefined ? null : <p className="tk-welkom-tekstregel">{regel}</p>}
          {zin === undefined ? null : (
            <p
              className="tk-paginakop-zin"
              aria-live="polite"
              style={zinKleur === undefined ? undefined : ({ color: zinKleur } as CSSProperties)}
            >
              {zin}
            </p>
          )}
        </div>
        <LevendeDenker
          className="tk-welkom-denker"
          size={136}
          uitdrukking={uitdrukking}
          niveau={niveau}
          onKietel={onKietel}
          kietelLabel={kietelLabel}
        />
      </div>
    </div>
  );
}
