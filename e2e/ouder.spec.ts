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

  for (const weg of ['Deze week', 'Hoe gaat het?', 'Eigen woorden', 'Premium', 'Instellingen']) {
    await expect(page.getByRole('region', { name: weg })).toHaveCount(0);
  }
});

test('Voor ouders gaat over de ouder en niet over de prijzenkast', async ({ page }) => {
  await signIn(page, 'Noor');
  await page.goto('/ouder');

  for (const blok of ['Deze week', 'Hoe gaat het?', 'Eigen woorden', 'Premium', 'Instellingen']) {
    await expect(page.getByRole('region', { name: blok })).toBeVisible();
  }

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
