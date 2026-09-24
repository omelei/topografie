import { expect, test } from '@playwright/test';

/**
 * Deel je uitslag (ADR-209): de uitslag en een link naar hetzelfde onderwerp,
 * zonder naam. De deelknop van het toestel is er in de testbrowsers niet, dus
 * het gaat via kopiëren; het klembord wordt hier nagebootst, zodat Chromium en
 * WebKit hetzelfde doen.
 */
test.use({ storageState: { cookies: [], origins: [] } });

test('after a round the result can be shared, with a link to the same topic', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async (tekst: string) => {
          (window as unknown as { gekopieerd: string }).gekopieerd = tekst;
        },
      },
      configurable: true,
    });
  });

  await page.goto('/topografie/provincies');
  await page
    .getByRole('region', { name: /Hoe wil je/ })
    .getByRole('button', { name: /Kies uit 4 namen/ })
    .click();
  await page.locator('.tk-choose-start button').click();
  await page.getByRole('group', { name: 'Kies de naam' }).getByRole('button').first().click();
  await page.getByRole('button', { name: 'Stoppen' }).click();
  await expect(page.getByRole('heading', { name: 'Ronde klaar' })).toBeVisible();

  await page.getByRole('button', { name: 'Deel je uitslag' }).click();
  await expect(page.getByText('Gekopieerd. Plak het in een bericht.')).toBeVisible();

  const gekopieerd = await page.evaluate(
    () => (window as unknown as { gekopieerd: string }).gekopieerd,
  );
  expect(gekopieerd).toMatch(/^Ik had [01] van de 1 goed bij Provincies van Nederland\./);
  expect(gekopieerd).toMatch(/\/topografie\/provincies$/);
});
