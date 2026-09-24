import { expect, test } from '@playwright/test';

/**
 * Een onderwerp is een pagina met een eigen titel (ADR-207). Wie via Google op
 * /topografie/provincies binnenkomt, ziet die titel in het tabblad, en de app
 * neemt de pagina over zodra hij start: de tekst voor Google blijft niet staan.
 */
test('a topic has its own page and title, and the app takes it over', async ({ page }) => {
  await page.goto('/topografie/provincies');
  await expect(page).toHaveTitle('Provincies van Nederland oefenen · leer.nu');
  await expect(page.getByRole('heading', { name: 'In welke groep zit je?' })).toHaveCount(0);
  await expect(page.getByPlaceholder('Je naam')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Alles van topografie' })).toHaveCount(0);
});

test('the sitemap lists the topics, and robots.txt points at it', async ({ request }) => {
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain('/topografie/provincies</loc>');

  const robots = await request.get('/robots.txt');
  expect(await robots.text()).toContain('Sitemap: https://www.leer.nu/sitemap.xml');
});
