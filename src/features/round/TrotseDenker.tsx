import type { CSSProperties } from 'react';
import { LevendeDenker } from '@/components/LevendeDenker';

/**
 * Denker die trots is, na een ronde (ADR-260).
 *
 * Hij komt binnen met een plop, en dan zet hij zijn borst op: hij komt
 * omhoog, wordt even breder en kijkt met zijn kin omhoog, en zakt weer terug,
 * steeds opnieuw. Om zijn hoofd fonkelen drie sterren in zon, en bij binnenkomst
 * springt er één keer confetti van hem af. Trots op het oefenen, niet op de
 * score: een ronde met drie goed verdient hem net zo goed, want de pagina zegt
 * nooit "goed gedaan" (ADR-112) en Denker zegt niets.
 *
 * Wie minder beweging vroeg, ziet hem staan met de sterren erbij, stil.
 */
export function TrotseDenker({
  size,
  className,
}: {
  readonly size: number;
  readonly className?: string | undefined;
}) {
  return (
    <span className={className === undefined ? 'tk-trots' : `tk-trots ${className}`}>
      {CONFETTI.map(([x, y, kleur], plek) => (
        <span
          key={`c${plek}`}
          className="tk-trots-confetti"
          aria-hidden="true"
          style={
            {
              '--tx': `${50 + x / 2}%`,
              '--ty': `${45 + y / 2}%`,
              background: kleur,
              animationDelay: `${0.25 + plek * 0.04}s`,
            } as CSSProperties
          }
        />
      ))}
      {STERREN.map(([links, boven, maat], plek) => (
        <svg
          key={`s${plek}`}
          className="tk-trots-ster"
          viewBox="0 0 24 24"
          aria-hidden="true"
          style={{
            left: `${links}%`,
            top: `${boven}%`,
            width: `${maat}%`,
            height: `${maat}%`,
            animationDelay: `${0.5 + plek * 0.45}s`,
          }}
        >
          <path d="M12 1.5c.9 5.6 4.9 9.6 10.5 10.5-5.6.9-9.6 4.9-10.5 10.5C11.1 16.9 7.1 12.9 1.5 12 7.1 11.1 11.1 7.1 12 1.5Z" />
        </svg>
      ))}
      <LevendeDenker size={size} uitdrukking="trots" />
    </span>
  );
}

/** Drie sterren om zijn hoofd: links van boven, van boven, en hun maat, in %. */
const STERREN: readonly (readonly [number, number, number])[] = [
  [2, 8, 18],
  [80, 0, 22],
  [88, 38, 14],
];

/** Waar de confetti heen springt, vanuit zijn midden, in % van zijn maat. */
const CONFETTI: readonly (readonly [number, number, string])[] = [
  [-70, -60, 'var(--zon)'],
  [-20, -95, 'var(--kaart)'],
  [35, -90, 'var(--topo-vlak)'],
  [80, -50, 'var(--zon)'],
  [-85, 5, 'var(--nacht)'],
  [90, 15, 'var(--kaart)'],
  [-55, 55, 'var(--zon)'],
  [60, 60, 'var(--nacht)'],
];
