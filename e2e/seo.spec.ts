import { expect, test } from '@playwright/test';

/**
 * Een onderwerp is een pagina met een eigen titel (ADR-207). Wie via Google op
 * /topografie/provincies binnenkomt, ziet die titel in het tabblad, en de app
 * neemt de pagina over zodra hij start: de tekst voor Google blijft niet staan.
 * De kop noemt het vak (ADR-247); het onderwerp staat in het tabblad.
 */
test('a topic has its own page and title, and the app takes it over', async ({ page }) => {
  await page.goto('/topografie/provincies');
  await expect(page).toHaveTitle('Provincies van Nederland oefenen · leer.nu');
  // Zonder naam opent het onderwerp zelf (ADR-208).
  await expect(page.getByRole('heading', { level: 1, name: 'Topografie oefenen' })).toBeVisible();
  await expect(page.locator('[data-seo]')).toHaveCount(0);
});

/**
 * Onder een onderwerp de andere onderwerpen van het vak, als echte links
 * (ADR-245): Google volgt ze, en een klik blijft in de app.
 */
test('a topic page links to the other topics of its subject', async ({ page }) => {
  await page.goto('/topografie/provincies');
  const meer = page.getByRole('navigation', { name: 'Meer topografie' });
  await expect(meer.getByRole('link', { name: 'Alles van topografie' })).toHaveAttribute(
    'href',
    '/topografie',
  );
  await meer.getByRole('link', { name: 'Hoofdsteden van de provincies' }).click();
  await expect(page).toHaveURL(/\/topografie\/hoofdsteden$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Topografie oefenen' })).toBeVisible();
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
