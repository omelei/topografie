import { expect, test } from '@playwright/test';

/**
 * Eerst oefenen, de naam later (ADR-208, ADR-229).
 *
 * Er staat geen naamscherm meer vóór de voordeur. Wie binnenkomt, via Google
 * op een onderwerp of op leer.nu zelf, speelt meteen een ronde. Na de eerste
 * ronde nodigt Vandaag uit om een naam te typen, en wat er zonder naam
 * geoefend is, hoort dan bij dat kind. De uitnodiging is weg te klikken.
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

  // Vandaag opent gewoon, en nodigt uit om een naam te typen, met wat hij doet.
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Hoi!' })).toBeVisible();
  const vraag = page.getByRole('form', { name: 'Hoe heet je?' });
  await expect(vraag.getByText('Dan staat je naam bovenaan en op je diploma’s.')).toBeVisible();
  const geoefend = page.getByRole('group', { name: 'Meest geoefend' });
  await expect(geoefend.getByRole('button', { name: /Provincies van Nederland/ })).toBeVisible();

  await vraag.getByLabel('Je naam').fill('Noor');
  await vraag.getByRole('button', { name: 'Bewaren' }).click();

  await expect(page.getByRole('heading', { name: 'Hoi Noor!' })).toBeVisible();
  await expect(page.getByRole('form', { name: 'Hoe heet je?' })).toHaveCount(0);
  await expect(geoefend.getByRole('button', { name: /Provincies van Nederland/ })).toBeVisible();
});

test('the front door opens without a name, with the first round on it', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Hoi!' })).toBeVisible();
  await expect(page.getByPlaceholder('Je naam')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Wie ben jij?' })).toHaveCount(0);

  // Vóór de eerste ronde vraagt Vandaag geen naam: alleen de groep, weg te klikken.
  await expect(page.getByRole('region', { name: 'In welke groep zit je?' })).toBeVisible();
  await expect(page.getByRole('form', { name: 'Hoe heet je?' })).toHaveCount(0);
});

test('"Niet nu" puts the invitation away for good, and Jij still asks', async ({ page }) => {
  await page.goto('/topografie/provincies');
  await page
    .getByRole('region', { name: /Hoe wil je/ })
    .getByRole('button', { name: /Kies uit 4 namen/ })
    .click();
  await page.locator('.tk-choose-start button').click();
  await page.getByRole('group', { name: 'Kies de naam' }).getByRole('button').first().click();
  await page.getByRole('button', { name: 'Stoppen' }).click();
  await expect(page.getByRole('heading', { name: 'Ronde klaar' })).toBeVisible();

  await page.goto('/');
  const vraag = page.getByRole('form', { name: 'Hoe heet je?' });
  await vraag.getByRole('button', { name: 'Niet nu' }).click();
  await expect(vraag).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Hoi!' })).toBeVisible();
  await expect(page.getByRole('form', { name: 'Hoe heet je?' })).toHaveCount(0);

  // Op Jij staat de vraag, zonder "Niet nu": Jij gaat over wie je bent.
  await page.goto('/jij');
  const jij = page.getByRole('form', { name: 'Hoe heet je?' });
  await expect(jij).toBeVisible();
  await expect(jij.getByRole('button', { name: 'Niet nu' })).toHaveCount(0);
});

/**
 * Voor ouders (ADR-214): te lezen zonder naam, met de weg naar een ronde en
 * naar premium. Op Vandaag staat de knop zolang er geen naam is (ADR-229).
 */
test('a parent reads what leer.nu is, and can look at premium without a name', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Ik ben een ouder' }).click();
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
