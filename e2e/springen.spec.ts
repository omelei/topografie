import { expect, test, type Locator } from '@playwright/test';
import { signIn } from './naam';

/**
 * Een keuze op een vakpagina springt naar het volgende onderdeel (ADR-233,
 * sinds ADR-242 bij elk onderdeel). Op een telefoon stond het volgende
 * onderdeel onder de vouw, en een kind moest zelf zoeken waar het verder moest.
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

test('op Topo springt elke keuze door, tot de laatste vraag', async ({ page }) => {
  await signIn(page, 'Noor');
  await page.goto('/topografie');

  // Regio → onderwerp → spelvorm → hoeveel vragen.
  await page
    .getByRole('region', { name: /Waar op de kaart/ })
    .getByRole('button', { name: 'Nederland' })
    .click();
  const onderwerpen = page.getByRole('region', { name: 'Kies een onderwerp' });
  await expect.poll(() => bovenkant(onderwerpen)).toBeLessThan(200);

  await onderwerpen.getByRole('button', { name: /^Provincies/ }).click();
  const hoe = page.getByRole('region', { name: /Hoe wil je/ });
  await expect.poll(() => bovenkant(hoe)).toBeLessThan(200);

  await hoe.getByRole('button', { name: /^Meerkeuze/ }).click();
  const hoeveel = page.getByRole('region', { name: 'Hoeveel vragen?' });
  await expect.poll(() => bovenkant(hoeveel)).toBeLessThan(200);
});

test('op Rekenen springt een tafel naar de spelvormen', async ({ page }) => {
  await signIn(page, 'Noor');
  await page.goto('/rekenen');

  await page
    .getByRole('region', { name: 'Kies een onderwerp' })
    .getByRole('button', { name: /^Tafels/ })
    .click();
  await page.getByRole('button', { name: 'Tafel van 7', exact: true }).click();
  const hoe = page.getByRole('region', { name: /Hoe wil je/ });
  await expect.poll(() => bovenkant(hoe)).toBeLessThan(200);
});
