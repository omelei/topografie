import { expect, test, type Locator } from '@playwright/test';
import { signIn } from './naam';

/**
 * Een keuze in het eerste onderdeel van een vakpagina springt naar het tweede
 * (ADR-233). Op een telefoon stond het tweede onderdeel onder de vouw, en een
 * kind moest zelf zoeken waar het verder moest.
 */

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

/** Hoe ver de bovenkant van een onderdeel onder de bovenrand van het scherm staat. */
async function bovenkant(onderdeel: Locator) {
  const vak = await onderdeel.boundingBox();
  if (vak === null) throw new Error('Het onderdeel staat niet op de pagina.');
  return vak.y;
}

test('op Topo springt een regio naar de onderwerpen', async ({ page }) => {
  await signIn(page, 'Noor');
  await page.goto('/topografie');

  const onderwerpen = page.getByRole('region', { name: 'Kies een onderwerp' });
  expect(await bovenkant(onderwerpen)).toBeGreaterThan(400);

  await page
    .getByRole('region', { name: /Waar op de kaart/ })
    .getByRole('button', { name: 'Europa' })
    .click();
  await expect.poll(() => bovenkant(onderwerpen)).toBeLessThan(200);
});

test('op Rekenen springt een onderwerp naar de volgende vraag', async ({ page }) => {
  await signIn(page, 'Noor');
  await page.goto('/rekenen');

  await page
    .getByRole('region', { name: 'Kies een onderwerp' })
    .getByRole('button', { name: /^Tafels/ })
    .click();
  const welke = page.locator('section.tk-kies').nth(1);
  await expect.poll(() => bovenkant(welke)).toBeLessThan(200);
  await expect(welke.getByRole('button', { name: 'Tafel van 7', exact: true })).toBeInViewport();
});
