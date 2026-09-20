import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { t } from '@/i18n';
import { GrootDiploma, type DiplomaBeeld } from './GrootDiploma';

/**
 * Het diploma groot, geopend vanuit de kast.
 *
 * Elke kaart doet hetzelfde: hij opent dit. Gehaald of niet, geen uitzondering
 * — één regel, want twee regels die je moet afleiden uit hoe een kaart eruitziet
 * zijn er één te veel voor een kind van zes. Wat je daarna kunt doen staat
 * hier, in één knop die van woord verandert en niet van plek: dat is de regel
 * van ADR-141, hier op een tweede scherm.
 *
 * De toetsenbordkant is het bewerkelijke deel en staat daarom voluit:
 *
 * - De focus gaat naar binnen bij openen en keert bij sluiten terug naar de
 *   kaart waarop gedrukt is. Die kaart onthouden we hier, want `document.
 *   activeElement` is na het sluiten al weg.
 * - Escape sluit, en de tik naast het diploma ook.
 * - Tab loopt rond binnen de dialoog in plaats van erachter de pagina in.
 * - De kast eronder scrollt niet: de pagina wordt vastgezet zolang dit open
 *   staat, dus je komt terug waar je was.
 */
export function DiplomaDialoog({
  beeld,
  titel,
  knop,
  onSluit,
}: {
  readonly beeld: DiplomaBeeld;
  /** Wat een schermlezer hoort als naam van de dialoog. */
  readonly titel: string;
  /** De ene knop: oefenen, de toets, of printen. */
  readonly knop: ReactNode;
  readonly onSluit: () => void;
}) {
  const venster = useRef<HTMLDivElement>(null);
  const sluit = useCallback(() => onSluit(), [onSluit]);

  // De focus gaat naar binnen, en keert terug in de opruiming — niet in de
  // knop die sluit. Anders zet React de dialoog daarná pas weg en gaat de focus
  // alsnog naar de body verloren, wat precies het soort fout is dat je alleen
  // met een toetsenbord merkt.
  useEffect(() => {
    const opener = document.activeElement;
    venster.current?.querySelector<HTMLElement>('button, [href], [tabindex]')?.focus();
    return () => {
      if (opener instanceof HTMLElement) opener.focus();
    };
  }, []);

  // De pagina eronder staat stil zolang dit open is, zodat de kast terugkomt
  // waar hij stond.
  useEffect(() => {
    const was = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = was;
    };
  }, []);

  const opToets = (gebeurtenis: React.KeyboardEvent<HTMLDivElement>) => {
    if (gebeurtenis.key === 'Escape') {
      gebeurtenis.stopPropagation();
      sluit();
      return;
    }
    if (gebeurtenis.key !== 'Tab') return;

    const bereikbaar = venster.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    );
    if (!bereikbaar || bereikbaar.length === 0) return;
    const eerste = bereikbaar[0];
    const laatste = bereikbaar[bereikbaar.length - 1];
    if (!eerste || !laatste) return;

    if (gebeurtenis.shiftKey && document.activeElement === eerste) {
      gebeurtenis.preventDefault();
      laatste.focus();
    } else if (!gebeurtenis.shiftKey && document.activeElement === laatste) {
      gebeurtenis.preventDefault();
      eerste.focus();
    }
  };

  return (
    <div
      className="tk-diplomavenster"
      role="dialog"
      aria-modal="true"
      aria-label={titel}
      onKeyDown={opToets}
      onPointerDown={(gebeurtenis) => {
        if (gebeurtenis.target === gebeurtenis.currentTarget) sluit();
      }}
    >
      <div className="tk-diplomavenster-blad" ref={venster}>
        <GrootDiploma beeld={beeld} />
        <div className="tk-diplomavenster-knoppen">
          {knop}
          <button type="button" className="tk-button tk-button-secondary" onClick={sluit}>
            {t('diploma.terug')}
          </button>
        </div>
      </div>
    </div>
  );
}
