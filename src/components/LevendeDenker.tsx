import { useEffect, useRef, type CSSProperties } from 'react';
import { Brandmark, type Uitdrukking } from './Brandmark';

/**
 * Denker die meeleeft (ADR-259): op elke pagina beweegt hij, hij volgt de muis
 * met zijn ogen, en waar hij bij een keuze staat, wordt hij enthousiaster
 * naarmate er meer gekozen is.
 *
 * - **Niveau** 0 tot 3: 0 ademt, 1 wiebelt nieuwsgierig, 2 hupt met wat
 *   confetti, 3 hupt snel met meer confetti. Zonder niveau doet hij wat zijn
 *   uitdrukking doet, en ademt hij als die niets doet.
 * - **Ogen die volgen**: de pupillen schuiven hooguit 3 px naar de muis. Eén
 *   luisteraar voor alle Denkers op de pagina.
 * - **Kietelen**: met `onKietel` is hij een knop. Wat hij dan zegt, is aan de
 *   pagina; hij juicht zelf.
 *
 * Alles hiervan staat stil voor wie minder beweging vroeg: de animaties staan
 * in de bewegingslaag van index.css, en de ogen volgen dan niet.
 */
export function LevendeDenker({
  uitdrukking,
  size,
  niveau,
  className,
  onKietel,
  kietelLabel,
}: {
  readonly uitdrukking: Uitdrukking;
  readonly size: number;
  readonly niveau?: 0 | 1 | 2 | 3 | undefined;
  readonly className?: string | undefined;
  readonly onKietel?: (() => void) | undefined;
  readonly kietelLabel?: string | undefined;
}) {
  const doos = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = doos.current;
    if (!element) return;
    VOLGERS.add(element);
    luister();
    return () => {
      VOLGERS.delete(element);
    };
  }, [uitdrukking, niveau]);

  const confetti = niveau === undefined ? 0 : CONFETTI[niveau];
  const binnen = (
    <span
      ref={doos}
      // Een nieuwe uitdrukking of een nieuw niveau komt binnen met een plop.
      key={`${uitdrukking}-${niveau ?? ''}`}
      className="tk-levend"
      data-niveau={niveau}
      style={{ width: size, height: size }}
    >
      {Array.from({ length: confetti }, (_, plek) => (
        <span
          key={plek}
          className="tk-levend-confetti"
          style={confettiStijl(plek, confetti, size)}
        />
      ))}
      <Brandmark size={size} uitdrukking={uitdrukking} />
    </span>
  );

  if (onKietel === undefined) {
    return className === undefined ? binnen : <span className={className}>{binnen}</span>;
  }
  return (
    <button
      type="button"
      className={className === undefined ? 'tk-kietel' : `tk-kietel ${className}`}
      aria-label={kietelLabel}
      onClick={onKietel}
    >
      {binnen}
    </button>
  );
}

const CONFETTI = [0, 0, 5, 12] as const;
const KLEUREN = ['var(--zon)', 'var(--koraal)', 'var(--topo-vlak)', 'var(--nacht)'];

function confettiStijl(plek: number, aantal: number, size: number): CSSProperties {
  const hoek = (plek / aantal) * Math.PI * 2 - Math.PI / 2;
  const straal = size * (0.55 + (plek % 3) * 0.12);
  const maat = Math.max(5, Math.round(size / 14));
  return {
    width: maat,
    height: maat,
    marginLeft: -maat / 2,
    marginTop: -maat / 2,
    borderRadius: plek % 4 === 3 ? 2 : 999,
    background: KLEUREN[plek % KLEUREN.length],
    animationDelay: `${(plek * 0.08).toFixed(2)}s`,
    ['--x' as string]: `${Math.round(Math.cos(hoek) * straal)}px`,
    ['--y' as string]: `${Math.round(Math.sin(hoek) * straal)}px`,
  };
}

/** Elke Denker die meekijkt, en de ene luisteraar die ze allemaal bijwerkt. */
const VOLGERS = new Set<HTMLElement>();
let luistert = false;

function rustig(): boolean {
  if (document.documentElement.dataset.beweging === 'rustig') return true;
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function luister() {
  if (luistert || typeof document === 'undefined') return;
  luistert = true;
  document.addEventListener('pointermove', (event) => {
    if (VOLGERS.size === 0 || rustig()) return;
    for (const element of VOLGERS) {
      const vak = element.getBoundingClientRect();
      const dx = event.clientX - (vak.left + vak.width / 2);
      const dy = event.clientY - (vak.top + vak.height * 0.45);
      const afstand = Math.hypot(dx, dy) || 1;
      const stap = Math.min(3, afstand / 30);
      const verschuiving = `translate(${(dx / afstand) * stap}px, ${(dy / afstand) * stap}px)`;
      element.querySelectorAll<SVGElement>('.pupil').forEach((pupil) => {
        pupil.style.transform = verschuiving;
      });
    }
  });
}
