import { expect, test } from '@playwright/test';

/**
 * Eerst proberen, daarna je naam (ADR-208).
 *
 * Wie via Google op een onderwerp binnenkomt, speelt meteen een ronde. Pas
 * daarna vraagt de app een naam, en wat er zonder naam geoefend is, hoort dan
 * bij dat kind.
 */
test.use({ storageState: { cookies: [], origins: [] } });

test('a visitor plays a topic first, and keeps the round after typing a name', async ({ page }) => {
  await page.goto('/topografie/provincies');
  await expect(page.getByPlaceholder('Je naam')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Wat wil je oefenen?' })).toBeVisible();

  // Zonder code de gratis manier: kies uit 4 namen (ADR-192).
  await page
    .getByRole('region', { name: /Hoe wil je/ })
    .getByRole('button', { name: /Kies uit 4 namen/ })
    .click();
  await page.locator('.tk-choose-start button').click();
  await page.getByRole('group', { name: 'Kies de naam' }).getByRole('button').first().click();
  await expect(page.getByRole('button', { name: 'Volgende vraag' })).toBeVisible();
  await page.getByRole('button', { name: 'Stoppen' }).click();
  await expect(page.getByRole('heading', { name: 'Ronde klaar' })).toBeVisible();

  // Vandaag gaat over wie je bent: daar komt de naam.
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Hoe heet je?' })).toBeVisible();
  await expect(page.getByText('Dan blijft bewaard wat je net oefende.')).toBeVisible();
  await page.getByPlaceholder('Je naam').fill('Noor');
  await page.getByRole('button', { name: 'Beginnen' }).click();
  await page.getByRole('button', { name: 'Zeg ik niet' }).click();

  await expect(page.getByRole('heading', { name: 'Hoi Noor!' })).toBeVisible();
  const geoefend = page.getByRole('group', { name: 'Meest geoefend' });
  await expect(geoefend.getByRole('button', { name: /Provincies van Nederland/ })).toBeVisible();
});

test('the first card asks a name, and lets you try a round first', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Wie ben jij?' })).toBeVisible();
  await expect(
    page.getByText('Jouw naam blijft opgeslagen op dit apparaat en niet op onze servers.'),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Eerst een ronde proberen' }).click();
  await expect(page).toHaveURL(/\/topografie\/provincies$/);
  await expect(page.getByRole('heading', { name: 'Wat wil je oefenen?' })).toBeVisible();
});

/**
 * Voor ouders (ADR-214): te lezen zonder naam, met de weg naar een ronde en
 * naar premium.
 */
test('a parent reads what leer.nu is, and can look at premium without a name', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Voor ouders: zo werkt het' }).click();
  await expect(page).toHaveURL(/\/voor-ouders$/);
  await expect(page.getByRole('heading', { name: 'leer.nu voor ouders' })).toBeVisible();
  await expect(page.getByText('Herhalen op het goede moment')).toBeVisible();

  await page.getByRole('button', { name: 'Wat premium is' }).click();
  await expect(page).toHaveURL(/\/premium$/);
  await expect(page.getByPlaceholder('Je naam')).toHaveCount(0);
});

/**
 * Voor de klas (ADR-216): een leerkracht leest wat een klassencode is en vraagt
 * hem per mail aan, zonder naam.
 */
test('a teacher reads about the class code and finds how to ask for one', async ({ page }) => {
  await page.goto('/voor-ouders');
  await page.getByRole('button', { name: 'Voor de klas', exact: true }).click();
  await expect(page).toHaveURL(/\/scholen$/);
  await expect(page.getByRole('heading', { name: 'leer.nu voor de klas' })).toBeVisible();
  await expect(page.getByPlaceholder('Je naam')).toHaveCount(0);
  const aanvragen = page.getByRole('link', { name: 'Vraag een klassencode aan' });
  await expect(aanvragen).toHaveAttribute('href', /^mailto:scholen@leer\.nu\?subject=/);
});
