import { expect, test } from '@playwright/test';
import { langsDePoort, stubGezin } from './gezin';
import { signIn } from './naam';

/**
 * Een kind op een apparaat waar de ouder is ingelogd, zonder code (flow 2 uit
 * `docs/review-kind-en-ouder.md`). De review vond dat geen enkele test deze
 * toestand liep (ADR-236).
 */
test.use({ storageState: { cookies: [], origins: [] } });

test('een kind met een ingelogde ouder en zonder code', async ({ page }) => {
  await stubGezin(page);
  await signIn(page, 'Noor');

  // De ouder logt in en kiest een pincode, en geeft het apparaat terug.
  // In de zijbalk of, op een telefoon, in de kop (ADR-241).
  await page.getByRole('button', { name: 'Ouders', exact: true }).filter({ visible: true }).click();
  await langsDePoort(page);
  await page.getByLabel('Nieuwe pincode').fill('1234');
  await page.getByLabel('Nog een keer').fill('1234');
  await page.getByRole('button', { name: 'Bewaren', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Ouderpagina' })).toBeVisible();
  await page.getByRole('button', { name: /Terug naar Noor/ }).click();

  // Het kind oefent gewoon: voor oefenen is geen account en geen code nodig.
  await page.goto('/topografie');
  await page
    .getByRole('region', { name: /Kies een onderwerp/ })
    .getByRole('button', { name: /^Provincies/ })
    .click();
  const hoe = page.getByRole('region', { name: /Hoe wil je/ });

  // Een premiummanier opent het venster. Daarin staat geen knop om te kopen,
  // want die hoort achter de pincode (R-11): wel de weg naar de ouder.
  await hoe.getByRole('button', { name: /^Bliksemronde/ }).click();
  const venster = page.getByRole('dialog', { name: 'Vraag het even aan je ouders' });
  await venster.getByRole('button', { name: 'Mijn ouders zijn erbij' }).click();
  await expect(venster.getByRole('link', { name: 'Een code kopen' })).toHaveCount(0);
  await venster.getByRole('button', { name: 'Ik ben de ouder' }).click();

  // En die weg vraagt de pincode die de ouder net koos, geen account opnieuw.
  const slot = page.getByRole('dialog');
  await expect(slot.getByLabel('Pincode', { exact: true })).toBeVisible();
  await slot.getByLabel('Pincode', { exact: true }).fill('1234');
  await slot.getByRole('button', { name: 'Verder', exact: true }).click();
  await expect(page).toHaveURL(/\/ouder$/);
});
