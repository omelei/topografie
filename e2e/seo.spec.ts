import { expect, test } from '@playwright/test';

/**
 * Een onderwerp is een pagina met een eigen titel (ADR-207). Wie via Google op
 * /topografie/provincies binnenkomt, ziet die titel in het tabblad, en de app
 * neemt de pagina over zodra hij start: de tekst voor Google blijft niet staan.
 */
test('a topic has its own page and title, and the app takes it over', async ({ page }) => {
  await page.goto('/topografie/provincies');
  await expect(page).toHaveTitle('Provincies van Nederland oefenen · leer.nu');
  // Zonder naam opent het onderwerp zelf (ADR-208).
  await expect(page.getByRole('heading', { name: 'Wat wil je oefenen?' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Alles van topografie' })).toHaveCount(0);
});

test('the sitemap lists the topics, and robots.txt points at it', async ({ request }) => {
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain('/topografie/provincies</loc>');

  const robots = await request.get('/robots.txt');
  expect(await robots.text()).toContain('Sitemap: https://www.leer.nu/sitemap.xml');
});

/**
 * "Over dit onderwerp" (ADR-213): wat erin zit en de vragen van ouders staan ook
 * in de app, onder het onderwerp, en dus ook nadat Google de app liet draaien.
 */
test('a topic page says what is in it and answers a parent', async ({ page }) => {
  await page.goto('/topografie/hoofdsteden');
  const over = page.getByRole('region', { name: 'Over Hoofdsteden van de provincies' });
  await expect(over).toBeVisible();
  await expect(over.getByText('Groningen (Groningen)')).toBeVisible();
  await expect(over.getByText('Is het gratis?')).toBeVisible();
});
