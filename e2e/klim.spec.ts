import { expect, test, type Page } from '@playwright/test';

/**
 * De trap na een goed antwoord (ADR-137).
 *
 * Dit product draait op Leitner-dozen en een kind heeft die motor nog nooit
 * zien draaien: alles wat er te zien was, was een stand. Deze test kijkt of er
 * iets beweegt op het moment dat er iets gebeurt — en of er níéts beweegt als
 * het antwoord fout is, want een zichtbare val is straffen.
 */

async function signIn(page: Page, naam: string) {
  await page.goto('/');
  await page.getByPlaceholder('Je naam').fill(naam);
  await page.getByRole('button', { name: 'Beginnen' }).click();
  await expect(page.getByRole('banner').getByRole('button', { name: naam })).toBeVisible();
}

async function startTafelVanEen(page: Page) {
  await page.goto('/rekenen');
  await page
    .getByRole('region', { name: /Kies een onderwerp/ })
    .getByRole('button', { name: /^Tafels/ })
    .click();
  await page.getByRole('button', { name: 'Tafel van 1', exact: true }).click();
  await page
    .getByRole('region', { name: /Hoe wil je/ })
    .getByRole('button', { name: /Zelf typen/ })
    .click();
  await page.locator('.tk-choose-start button').click();
}

/** Het juiste antwoord op de som die er staat. */
async function juist(page: Page): Promise<string> {
  const som = await page.locator('.tk-sum').innerText();
  return (som.split('×')[1] ?? '').trim();
}

test('een goed antwoord laat het onderdeel een trede klimmen', async ({ page }) => {
  await signIn(page, 'Noor');
  await startTafelVanEen(page);

  await page.getByPlaceholder('Antwoord').fill(await juist(page));
  await page.getByRole('button', { name: 'Kijk na' }).click();

  const klim = page.locator('.tk-klim');
  await expect(klim).toBeVisible();
  await expect(klim).toContainText('Je kent dit steeds beter');

  // Een onderdeel dat nooit gezien was staat na één goede beurt op twee van vijf.
  await expect(page.locator(".tk-klim-trede[data-vol='ja']")).toHaveCount(2);
  await expect(page.locator('.tk-klim-trede')).toHaveCount(5);
});

/**
 * De belangrijkste: bij een fout antwoord staat er niets. ADR-048 maakt het niet
 * weten overal goedkoop, en een zichtbare demotie zou dat in één beeld
 * terugdraaien.
 */
test('een fout antwoord toont geen val', async ({ page }) => {
  await signIn(page, 'Sam');
  await startTafelVanEen(page);

  await page.getByPlaceholder('Antwoord').fill('999');
  await page.getByRole('button', { name: 'Kijk na' }).click();

  await expect(page.locator('.tk-klim')).toHaveCount(0);
});
