import { scrollAfstand } from '@/features/module/stappen';

/**
 * Terug naar boven, op een nieuw scherm (zie `App`).
 *
 * Op een telefoon scrolt `.tk-schil-rol` en niet het document, dus allebei:
 * wie alleen het venster terugzet, laat het scherm op een telefoon staan waar
 * het vorige was gebleven.
 */
export function naarBoven(): void {
  window.scrollTo(0, 0);
  document.querySelector('.tk-schil-rol')?.scrollTo(0, 0);
}

/**
 * Een onderdeel in beeld brengen na een keuze (ADR-233, ADR-242, ADR-247), en
 * niet verder dan nodig.
 *
 * Het sprong met `scrollIntoView` naar de bovenrand: het volgende onderdeel
 * stond dan helemaal bovenin, en wat het kind net koos, was uit beeld. Nu
 * schuift de pagina net zo ver dat het onderdeel in beeld staat, tot zestig
 * procent van het scherm hoog, boven de startbalk die op een telefoon onderaan
 * plakt. Staat het er al, dan blijft alles staan. Een groot onderdeel komt met
 * zijn kop net onder de bovenrand, nooit erboven.
 */
export function brengInBeeld(doel: HTMLElement, rustig: boolean): void {
  const rol = document.querySelector<HTMLElement>('.tk-schil-rol');
  const eigenRol = rol !== null && rol.scrollHeight > rol.clientHeight && rol.contains(doel);
  const venster = eigenRol ? rol.getBoundingClientRect() : { top: 0, bottom: window.innerHeight };
  const balk = document.querySelector('.tk-startbalk-mobiel')?.getBoundingClientRect().top;
  const boven = venster.top;
  const onder = Math.min(venster.bottom, balk ?? Infinity);
  const lucht = 16;

  const vak = doel.getBoundingClientRect();
  const tot = Math.min(vak.bottom, vak.top + (onder - boven) * 0.6);
  // Een onderdeel boven de rand (terug naar een stap die nog wacht) komt met
  // zijn kop net onder de rand; een onderdeel eronder net zo ver als nodig.
  const verschil =
    vak.top < boven + lucht
      ? vak.top - boven - lucht
      : Math.min(tot + lucht - onder, vak.top - boven - lucht);
  if (verschil >= 0 && verschil < 1) return;

  const opties: ScrollToOptions = { top: verschil, behavior: rustig ? 'auto' : 'smooth' };
  const scroller = eigenRol ? rol : window;
  if (typeof scroller.scrollBy === 'function') scroller.scrollBy(opties);
}

/**
 * De stap die op een telefoon openging in beeld brengen (ADR-252): niet als
 * zijn bovenkant al in het bovenste deel van het scherm staat, en anders met
 * 80 pixels lucht erboven (`scrollAfstand`). Zonder glijden voor wie minder
 * beweging vroeg.
 */
export function stapInBeeld(doel: HTMLElement, rustig: boolean): void {
  const rol = document.querySelector<HTMLElement>('.tk-schil-rol');
  const eigenRol = rol !== null && rol.scrollHeight > rol.clientHeight && rol.contains(doel);
  const boven = eigenRol ? rol.getBoundingClientRect().top : 0;
  const hoogte = eigenRol ? rol.clientHeight : window.innerHeight;
  const afstand = scrollAfstand(doel.getBoundingClientRect().top - boven, hoogte);
  if (Math.abs(afstand) < 1) return;

  const scroller = eigenRol ? rol : window;
  if (typeof scroller.scrollBy === 'function') {
    scroller.scrollBy({ top: afstand, behavior: rustig ? 'auto' : 'smooth' });
  }
}
