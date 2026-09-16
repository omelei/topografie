import { expect, test, type Page } from '@playwright/test';

/**
 * "Jij" is van het kind, "Voor ouders" is van de ouder (ADR-136).
 *
 * Eén pagina met acht blokken werd er twee. Wat deze test vastlegt is niet de
 * indeling maar de scheiding: op de pagina die "Jij" heet staat niets over de
 * rekening, en de ouder hoeft niet langs de prijzenkast van zijn kind om bij
 * het weekbericht te komen.
 */

async function signIn(page: Page, naam: string) {
  await page.goto('/');
  await page.getByPlaceholder('Je naam').fill(naam);
  await page.getByRole('button', { name: 'Beginnen' }).click();
  await expect(page.getByRole('banner').getByRole('button', { name: naam })).toBeVisible();
}

/** Wat op de pagina van het kind hoort, en wat er niet meer op staat. */
test('Jij gaat over het kind en niet over de rekening', async ({ page }) => {
  await signIn(page, 'Noor');
  await page.goto('/jij');

  await expect(page.getByRole('region', { name: 'Jouw naam' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Wie oefent er?' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Jouw badges' })).toBeVisible();

  for (const weg of ['Deze week', 'Hoe gaat het?', 'Eigen woorden', 'Premium']) {
    await expect(page.getByRole('region', { name: weg })).toHaveCount(0);
  }

  // Eerst wie je bent, dan waar de instellingen staan, dan wat je hebt (ADR-145).
  const koppen = await page.locator('.tk-page-main h2').allInnerTexts();
  const plek = (kop: string) => koppen.findIndex((tekst) => tekst.startsWith(kop));
  expect(plek('Jouw naam')).toBeLessThan(plek('Instellingen'));
  expect(plek('Instellingen')).toBeLessThan(plek('Jouw badges'));
});

test('Voor ouders gaat over de ouder en niet over de prijzenkast', async ({ page }) => {
  await signIn(page, 'Noor');
  await page.goto('/ouder');

  for (const blok of ['Deze week', 'Hoe gaat het?', 'Eigen woorden', 'Premium', 'Instellingen']) {
    await expect(page.getByRole('region', { name: blok })).toBeVisible();
  }

  // Wat je geregeld hebt, hoe de app werkt, de oefenstof, en dan de cijfers
  // (ADR-145). Tot nu toe opende de pagina met de cijfers.
  const koppen = page.locator('.tk-page-main h2');
  await expect(koppen.first()).toHaveText('Premium');
  const teksten = await koppen.allInnerTexts();
  expect(teksten.indexOf('Instellingen')).toBeLessThan(teksten.indexOf('Eigen woorden'));
  expect(teksten.indexOf('Eigen woorden')).toBeLessThan(teksten.indexOf('Deze week'));

  await expect(page.getByRole('region', { name: 'Jouw badges' })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Jouw naam' })).toHaveCount(0);
});

test('de twee pagina’s wijzen naar elkaar, en allebei hebben ze een adres', async ({ page }) => {
  await signIn(page, 'Sam');

  await page.goto('/jij');
  await page.getByRole('button', { name: 'Voor ouders' }).click();
  await expect(page).toHaveURL(/\/ouder$/);
  await expect(page.getByRole('heading', { name: 'Voor ouders' })).toBeVisible();

  await page.getByRole('button', { name: 'Naar Jij' }).click();
  await expect(page).toHaveURL(/\/jij$/);
});
