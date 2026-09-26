import { expect, type Page } from '@playwright/test';

/**
 * Een kind met een naam, zoals de meeste tests beginnen (ADR-229).
 *
 * Er staat geen naamscherm meer vóór de voordeur: een kind oefent eerst zonder
 * naam en typt hem waar hij iets doet. De kortste weg is Jij, waar de vraag
 * bovenaan staat zolang er geen naam is. Daarna Vandaag, met de vraag naar de
 * groep weggeklikt: dat is de voordeur die het naamscherm achterliet, toen het
 * na de naam de groep vroeg en "Zeg ik niet" hem wegzette (ADR-151).
 */
export async function signIn(page: Page, naam: string) {
  await page.goto('/jij');
  const vraag = page.getByRole('form', { name: 'Hoe heet je?' });
  await vraag.getByLabel('Je naam').fill(naam);
  await vraag.getByRole('button', { name: 'Bewaren' }).click();
  // The name is in the app bar, on the profile switch: that is where "you are
  // signed in" is visible.
  await expect(page.getByRole('banner').getByRole('button', { name: naam })).toBeVisible();

  await page.goto('/');
  const groep = page.getByRole('region', { name: 'In welke groep zit je?' });
  await groep.getByRole('button', { name: 'Niet nu' }).click();
  await expect(groep).toHaveCount(0);
}
