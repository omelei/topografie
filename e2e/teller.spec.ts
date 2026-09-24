import { expect, test, type Page } from '@playwright/test';

/**
 * De teller (ADR-210). Wat er naar de server gaat, is een gebeurtenis en een
 * adres van leer.nu, en verder niets: geen naam, geen apparaatnummer, geen
 * uitslag. Hier wordt elk verzoek opgevangen en nagekeken.
 */
test.use({ storageState: { cookies: [], origins: [] } });

async function vangTellingen(page: Page): Promise<Record<string, unknown>[]> {
  const tellingen: Record<string, unknown>[] = [];
  await page.route('**/rest/v1/rpc/teller_tel', async (route) => {
    tellingen.push(route.request().postDataJSON() as Record<string, unknown>);
    await route.fulfill({ status: 204, body: '' });
  });
  return tellingen;
}

test('counts where someone came in and that a round began, and nothing about who', async ({
  page,
}) => {
  const tellingen = await vangTellingen(page);

  await page.goto('/topografie/provincies');
  await page
    .getByRole('region', { name: /Hoe wil je/ })
    .getByRole('button', { name: /Kies uit 4 namen/ })
    .click();
  await page.locator('.tk-choose-start button').click();
  await page.getByRole('group', { name: 'Kies de naam' }).getByRole('button').first().click();
  await page.getByRole('button', { name: 'Stoppen' }).click();

  await page.goto('/');
  await page.getByPlaceholder('Je naam').fill('Noor');
  await page.getByRole('button', { name: 'Beginnen' }).click();
  await page.getByRole('button', { name: 'Zeg ik niet' }).click();
  await expect(page.getByRole('heading', { name: 'Hoi Noor!' })).toBeVisible();

  await expect
    .poll(() => tellingen.map((telling) => telling.p_gebeurtenis))
    .toEqual(expect.arrayContaining(['binnenkomst', 'ronde-zonder-naam', 'naam']));
  expect(tellingen).toContainEqual({
    p_gebeurtenis: 'binnenkomst',
    p_pad: '/topografie/provincies',
  });
  expect(tellingen).toContainEqual({
    p_gebeurtenis: 'ronde-zonder-naam',
    p_pad: '/topografie/provincies',
  });

  // Elke telling heeft precies deze twee velden, en de naam staat nergens in.
  for (const telling of tellingen) {
    expect(Object.keys(telling).sort()).toEqual(['p_gebeurtenis', 'p_pad']);
  }
  expect(JSON.stringify(tellingen)).not.toContain('Noor');
});

test('counts nothing when the browser asks not to be tracked', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'globalPrivacyControl', { value: true });
  });
  const tellingen = await vangTellingen(page);

  await page.goto('/topografie/provincies');
  await expect(page.getByRole('heading', { name: 'Wat wil je oefenen?' })).toBeVisible();
  expect(tellingen).toEqual([]);
});
