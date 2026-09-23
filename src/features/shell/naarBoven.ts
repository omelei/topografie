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
