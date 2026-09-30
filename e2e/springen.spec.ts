import { expect, test } from '@playwright/test';
import { signIn } from './naam';

/**
 * Een keuze op een vakpagina brengt het volgende onderdeel in beeld (ADR-233,
 * sinds ADR-242 bij elk onderdeel). Op een telefoon stond het volgende
 * onderdeel onder de vouw, en een kind moest zelf zoeken waar het verder moest.
 *
 * Sinds ADR-247 niet meer tot bovenaan: net zo ver dat het onderdeel in beeld
 * staat, zodat wat je net koos zo lang mogelijk te zien blijft.
 */

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

test('op Topo brengt een regio de onderwerpen in beeld, en de regio blijft staan', async ({
  page,
}) => {
  await signIn(page, 'Noor');
  await page.goto('/topografie');

  const onderwerpen = page.getByRole('region', { name: 'Kies een onderwerp' });
  const eerste = onderwerpen.getByRole('button').first();
  await expect(eerste).not.toBeInViewport();

  const europa = page
    .getByRole('region', { name: /Waar op de kaart/ })
    .getByRole('button', { name: 'Europa' });
  await europa.click();
  await expect(eerste).toBeInViewport();
  await expect(europa).toBeInViewport();
});

test('op Rekenen brengt een onderwerp de volgende vraag in beeld', async ({ page }) => {
  await signIn(page, 'Noor');
  await page.goto('/rekenen');

  await page
    .getByRole('region', { name: 'Kies een onderwerp' })
    .getByRole('button', { name: /^Tafels/ })
    .click();
  const welke = page.locator('section.tk-kies').nth(1);
  await expect(welke.getByRole('button', { name: 'Tafel van 7', exact: true })).toBeInViewport();
});

test('op Topo brengt elke keuze de volgende in beeld, tot de laatste vraag', async ({ page }) => {
  await signIn(page, 'Noor');
  await page.goto('/topografie');

  // Regio → onderwerp → spelvorm → hoeveel vragen.
  await page
    .getByRole('region', { name: /Waar op de kaart/ })
    .getByRole('button', { name: 'Nederland' })
    .click();
  const onderwerpen = page.getByRole('region', { name: 'Kies een onderwerp' });
  await expect(onderwerpen.getByRole('button').first()).toBeInViewport();

  await onderwerpen.getByRole('button', { name: /^Provincies/ }).click();
  const hoe = page.getByRole('region', { name: /Hoe wil je/ });
  await expect(hoe.getByRole('button').first()).toBeInViewport();

  await hoe.getByRole('button', { name: /^Meerkeuze/ }).click();
  const hoeveel = page.getByRole('region', { name: 'Hoeveel vragen?' });
  await expect(hoeveel.getByRole('button').first()).toBeInViewport();
});

test('op Rekenen brengt een tafel de spelvormen in beeld', async ({ page }) => {
  await signIn(page, 'Noor');
  await page.goto('/rekenen');

  await page
    .getByRole('region', { name: 'Kies een onderwerp' })
    .getByRole('button', { name: /^Tafels/ })
    .click();
  await page.getByRole('button', { name: 'Tafel van 7', exact: true }).click();
  const hoe = page.getByRole('region', { name: /Hoe wil je/ });
  await expect(hoe.getByRole('button').first()).toBeInViewport();
});

test('een stap die nog wacht, staat in de startbalk en brengt je erheen', async ({ page }) => {
  await signIn(page, 'Noor');
  await page.goto('/rekenen');

  const hoe = page.getByRole('region', { name: /Hoe wil je/ });
  await page.getByRole('button', { name: /^Naar stap 2: Hoe wil je oefenen\?/ }).click();
  await expect(hoe.getByRole('button').first()).toBeInViewport();
});
