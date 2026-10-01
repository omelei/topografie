import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Een stap van een vakpagina, open, op elke maat.
 *
 * Vanaf 768 staan alle stappen onder elkaar en is dit gewoon de sectie met die
 * naam. Op een telefoon is de pagina een accordeon (ADR-252): er staat één stap
 * open, wat gekozen is staat bovenaan als rij met "Wijzig", en wat nog komt als
 * gestippelde rij. Een stap die dicht is, gaat hier eerst open — met een druk
 * op zijn rij, zoals een kind dat doet. Beide rijen dragen de vraag van de stap
 * in hun naam.
 */
export async function stap(page: Page, naam: string | RegExp): Promise<Locator> {
  const sectie = page.getByRole('region', { name: naam });
  const rij = page.locator('.tk-stappen').getByRole('button', { name: naam });
  await expect(sectie.or(rij).first()).toBeVisible();
  if (!(await sectie.isVisible())) await rij.first().click();
  await expect(sectie).toBeVisible();
  return sectie;
}

/** Of deze maat een telefoon is: daar is de vakpagina een accordeon (ADR-252). */
export function opEenTelefoon(page: Page): boolean {
  return (page.viewportSize()?.width ?? 0) < 768;
}

/**
 * De diplomawand van een vak. Op een telefoon staat hij op de vakpagina in een
 * blad achter een rij met zijn naam (ADR-252); die rij gaat hier eerst open.
 * Elders — vanaf 768, en op Jij — is het de sectie zelf.
 */
export async function wand(page: Page, naam: string): Promise<Locator> {
  const sectie = page.getByRole('region', { name: naam });
  const rij = page.locator('.tk-oefenlijst-rijen').getByRole('button', { name: naam });
  await expect(sectie.or(rij).first()).toBeVisible();
  if (await sectie.isVisible()) return sectie;
  await rij.click();
  // De wand zelf, in het blad: zonder de knop die het blad sluit.
  const blad = page.getByRole('dialog', { name: naam }).getByRole('region', { name: naam });
  await expect(blad).toBeVisible();
  return blad;
}

/**
 * "Over" het onderwerp open. Op een telefoon staat het in een blad achter een
 * rij (ADR-252) — dicht wel in de pagina, maar niet te zien; vanaf 768 staat
 * het gewoon onder de stappen en doet dit niets.
 */
export async function openOver(page: Page): Promise<void> {
  if (!opEenTelefoon(page)) return;
  await page
    .locator('.tk-oefenlijst-rijen')
    .getByRole('button', { name: /^Over / })
    .click();
  await expect(page.getByRole('dialog', { name: /^Over / })).toBeVisible();
}
