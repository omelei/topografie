import { leesRustig } from '@/features/player/settings';

/**
 * Het feest na een goed antwoord (Merk en stijlgids §05, ADR-183).
 *
 * `leerFeest` en `leerVlieg` uit `docs/leer.js`, in de app: sterren die uit
 * Denker springen, en de punt die van Denker naar het bolletje van de
 * voortgang vliegt. Beide tekenen in een laag boven de pagina die niets
 * opvangt en zichzelf opruimt, en beide doen niets waar beweging uit staat —
 * wie rustig gekozen heeft, ziet het groene vlak met het vinkje en het
 * bolletje dat al gevuld is, en dat is de hele boodschap.
 *
 * De kleuren komen uit de tokens: een ster is zon, de punt is cacao.
 */

const STER =
  'polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)';

function kanBewegen(): boolean {
  return !leesRustig() && typeof Element !== 'undefined' && 'animate' in Element.prototype;
}

function laag(): HTMLDivElement {
  const div = document.createElement('div');
  div.setAttribute('aria-hidden', 'true');
  div.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:60;overflow:hidden';
  document.body.appendChild(div);
  return div;
}

/**
 * Twaalf sterren in een kring uit een punt van `bron` (standaard rechtsboven,
 * waar de punt van Denker zit). 700–950 ms, en dan weg.
 */
export function sterren(bron: Element | null, { ox = 0.85, oy = 0.12 } = {}): void {
  if (!bron || !kanBewegen()) return;
  const r = bron.getBoundingClientRect();
  const x0 = r.left + r.width * ox;
  const y0 = r.top + r.height * oy;
  const doek = laag();
  const aantal = 12;
  for (let i = 0; i < aantal; i++) {
    const maat = 10 + Math.random() * 10;
    const ster = document.createElement('div');
    ster.style.cssText = `position:absolute;left:${x0 - maat / 2}px;top:${y0 - maat / 2}px;width:${maat}px;height:${maat}px;background:var(--zon);clip-path:${STER}`;
    doek.appendChild(ster);
    const hoek = (i / aantal) * Math.PI * 2 + Math.random() * 0.3;
    const afstand = 50 + Math.random() * 40;
    const dx = Math.cos(hoek) * afstand;
    const dy = Math.sin(hoek) * afstand;
    ster.animate(
      [
        { transform: 'translate(0,0) scale(.3)', opacity: 1 },
        { transform: `translate(${dx}px,${dy}px) scale(1) rotate(90deg)`, opacity: 1, offset: 0.6 },
        {
          transform: `translate(${dx * 1.15}px,${dy * 1.15 + 14}px) scale(.6) rotate(140deg)`,
          opacity: 0,
        },
      ],
      { duration: 700 + Math.random() * 250, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' },
    );
  }
  window.setTimeout(() => doek.remove(), 1200);
}

/**
 * De punt vliegt van `van` naar `naar` in een boog: 560 ms, en hij landt op het
 * bolletje dat net gevuld is.
 */
export function vlieg(van: Element | null, naar: Element | null): void {
  if (!van || !naar || !kanBewegen()) return;
  const a = van.getBoundingClientRect();
  const b = naar.getBoundingClientRect();
  const maat = 12;
  const doek = laag();
  const punt = document.createElement('div');
  punt.style.cssText = `position:absolute;left:${a.left + a.width / 2 - maat / 2}px;top:${a.top + a.height / 2 - maat / 2}px;width:${maat}px;height:${maat}px;border-radius:50%;background:var(--inkt)`;
  doek.appendChild(punt);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const vlucht = punt.animate(
    [
      { transform: 'translate(0,0) scale(1)' },
      { transform: `translate(${dx * 0.5}px,${dy * 0.5 - 80}px) scale(1.3)`, offset: 0.5 },
      { transform: `translate(${dx}px,${dy}px) scale(.7)` },
    ],
    { duration: 560, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'forwards' },
  );
  vlucht.onfinish = () => doek.remove();
}
