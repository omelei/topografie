/**
 * "Hier stond net een volwassene" (ADR-232): een vlag in `sessionStorage`,
 * gezet als de geboortejaarvraag goed ging.
 *
 * Eén keer per tabblad. Een ouder die de premiumpagina opende en daarna de
 * pincode kiest, hoeft het jaar geen twee keer te typen; een kind dat de iPad
 * morgen pakt, krijgt de vraag weer. Een pincode die kwijt is, vraagt het
 * altijd opnieuw: dat is de deur die telt.
 */

const SLEUTEL = 'leernu.ouderBevestigd';

export function isOuderBevestigd(): boolean {
  try {
    return window.sessionStorage.getItem(SLEUTEL) === 'ja';
  } catch {
    return false;
  }
}

export function bevestigOuder(): void {
  try {
    window.sessionStorage.setItem(SLEUTEL, 'ja');
  } catch {
    // Zonder opslag komt de vraag de volgende keer opnieuw.
  }
}
