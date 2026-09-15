import { useState, type ReactNode } from 'react';

/**
 * Een blok dat er wel is, maar niet vooraan (ADR-143).
 *
 * Drie pagina's die een kind in zijn menu heeft, waren voor de helft
 * spreadsheet: de tabel per onderdeel op Onthouden, de zes getallen en de
 * kalender van vijf weken op Reeks, en de uitleg van het algoritme onder
 * allebei. Dat is informatie voor de volwassene in de kamer, en ze stond
 * standaard open op de pagina van het kind.
 *
 * Weghalen zou te ver gaan: het is de voortgang van dit kind, en dit product
 * houdt niets voor hem achter. Dus staat het er nog, één druk verder. Wat een
 * kind ziet als het de pagina opent is het beeld; wat een ouder zoekt staat er
 * onder een knop die zegt wat erachter zit.
 *
 * Geen `<details>`: dat element brengt zijn eigen driehoekje, zijn eigen
 * toetsgedrag en in Safari zijn eigen animatie mee, en dit product tekent zijn
 * knoppen zelf.
 */
export function Uitklap({
  open: dicht,
  titel,
  children,
}: {
  /** De tekst op de knop als het dicht is. */
  readonly open: string;
  /** En als het open staat. */
  readonly titel: string;
  readonly children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <p>
        <button
          type="button"
          className="tk-button tk-button-secondary"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? titel : dicht}
        </button>
      </p>
      {open ? children : null}
    </div>
  );
}
