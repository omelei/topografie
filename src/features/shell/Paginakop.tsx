import { Brandmark } from '@/components/Brandmark';

/**
 * De kop van een pagina: het koraal vlak van Vandaag, met de kop, één regel
 * eronder en Denker ernaast (ADR-254).
 *
 * Vandaag op een telefoon begon met één koraal blok (ADR-252), en de andere
 * pagina's met een losse kop op de grond, of op Jij een etalage zonder Denker.
 * Nu begint elke pagina zoals Vandaag: hetzelfde vlak, dezelfde maat en
 * dezelfde vorm in de hoek. Cacao op koraal 5,72. Een knop staat er niet in:
 * koraal op koraal is geen knop.
 */
export function Paginakop({
  kop,
  regel,
}: {
  readonly kop: string;
  readonly regel?: string | undefined;
}) {
  return (
    <div className="tk-etalage tk-welkom tk-welkom-nu">
      <span className="tk-welkom-vorm tk-welkom-cirkel" aria-hidden="true" />
      <div className="tk-welkom-boven">
        <div className="tk-welkom-tekst">
          <h1 className="tk-welkom-kop">{kop}</h1>
          {regel === undefined ? null : <p className="tk-welkom-tekstregel">{regel}</p>}
        </div>
        <span className="tk-welkom-denker">
          <Brandmark size={136} />
        </span>
      </div>
    </div>
  );
}
