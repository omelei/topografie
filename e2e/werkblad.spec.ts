import { expect, test, type Page } from '@playwright/test';

/**
 * Een werkblad om te printen (ADR-211): te openen zonder naam, vanaf de pagina
 * van een onderwerp, met de antwoorden erbij. De foto's gaan naar
 * `screenshots/`, zodat de PR het blad op elke maat laat zien.
 */
test.use({ storageState: { cookies: [], origins: [] } });

async function foto(page: Page, project: string, naam: string) {
  await page.screenshot({ path: `screenshots/${project}-${naam}.png`, fullPage: false });
}

test('a worksheet opens from its topic, with a blank map and the answers', async ({
  page,
}, testInfo) => {
  await page.goto('/topografie/provincies');
  await page.getByRole('button', { name: 'Werkblad om te printen' }).click();

  await expect(page).toHaveURL(/\/topografie\/provincies\/werkblad$/);
  await expect(page).toHaveTitle('Provincies van Nederland: werkblad om te printen · leer.nu');
  await expect(
    page.getByRole('heading', { name: 'Provincies van Nederland', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Schrijf bij elk nummer de naam.')).toBeVisible();
  const kaart = page.getByRole('img', { name: 'Schrijf bij elk nummer de naam.' });
  await expect(kaart.locator('text')).toHaveCount(12);
  await expect(page.getByRole('heading', { name: /^Antwoorden/ })).toBeVisible();
  await foto(page, testInfo.project.name, '20-werkblad-kaart');

  await page.getByRole('button', { name: 'Terug naar oefenen' }).click();
  await expect(page).toHaveURL(/\/topografie\/provincies$/);
});

test('a worksheet of sums prints the questions, and another set on request', async ({
  page,
}, testInfo) => {
  await page.addInitScript(() => {
    (window as unknown as { geprint: number }).geprint = 0;
    window.print = () => {
      (window as unknown as { geprint: number }).geprint += 1;
    };
  });
  await page.goto('/rekenen/tafel-7/werkblad');

  const vragen = page.locator('.tk-werkblad-vragen li');
  await expect(vragen).toHaveCount(10);
  await expect(vragen.first()).toContainText(/7 × \d+ = _+/);
  await foto(page, testInfo.project.name, '21-werkblad-sommen');

  const eerst = await vragen.allTextContents();
  await page.getByRole('button', { name: 'Andere vragen' }).click();
  await expect.poll(() => vragen.allTextContents()).not.toEqual(eerst);

  await page.getByRole('button', { name: 'Printen', exact: true }).click();
  expect(await page.evaluate(() => (window as unknown as { geprint: number }).geprint)).toBe(1);
});

test('a class set is thirty different sheets, each with a code to scan', async ({ page }) => {
  await page.goto('/klokkijken/halve-uren/werkblad');
  await expect(page.locator('.tk-werkblad-qr')).toHaveCount(1);
  const qr = await page.locator('.tk-werkblad-qr').getAttribute('src');
  expect((await page.request.get(qr ?? '')).status()).toBe(200);

  await page.getByRole('button', { name: 'Klassenset van 30' }).click();
  await expect(page.getByText('Werkblad 30', { exact: true }).first()).toBeVisible();
  await expect(page.locator('.tk-werkblad-antwoordblok')).toHaveCount(30);
});
