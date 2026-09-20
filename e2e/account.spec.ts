import { expect, test, type Page, type Route } from '@playwright/test';

/**
 * De ouder logt in, en het kind merkt er niets van (ADR-155).
 *
 * Wat hier vastligt is niet het formulier maar de belofte eromheen: inloggen is
 * een aanbod en geen poort. Het blok staat op Voor ouders en nergens anders, de
 * voordeur van het kind verandert niet, en zonder in te loggen werkt alles zoals
 * het werkte.
 *
 * Er is geen Supabase in een test, dus het adres uit `playwright.config.ts`
 * bestaat niet en `page.route` antwoordt ervoor — zoals `premium.spec.ts` dat
 * voor de premiumserver doet.
 */

const GEZIN = 'https://gezin.leer.test';

async function signIn(page: Page, naam: string) {
  await page.goto('/');
  await page.getByPlaceholder('Je naam').fill(naam);
  await page.getByRole('button', { name: 'Beginnen' }).click();
  // De groep is een tweede stap, altijd over te slaan (ADR-151).
  await page.getByRole('button', { name: 'Zeg ik niet' }).click();
  await expect(page.getByRole('banner').getByRole('button', { name: naam })).toBeVisible();
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'apikey, authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

async function antwoord(route: Route, status: number, body: unknown) {
  if (route.request().method() === 'OPTIONS') {
    await route.fulfill({ status: 204, headers: CORS });
    return;
  }
  await route.fulfill({ status, headers: CORS, json: body });
}

/** Een sessie zoals Supabase er een teruggeeft. */
function sessie(email: string) {
  return {
    access_token: 'token-e2e',
    refresh_token: 'vernieuw-e2e',
    expires_in: 3600,
    token_type: 'bearer',
    user: { id: 'ouder-e2e', email },
  };
}

test('een ouder logt in, ziet dat, en logt weer uit', async ({ page }) => {
  await signIn(page, 'Noor');

  await page.route(`${GEZIN}/auth/v1/token**`, (route) =>
    antwoord(route, 200, sessie('ouder@example.nl')),
  );
  await page.route(`${GEZIN}/auth/v1/logout`, (route) => antwoord(route, 204, {}));

  await page.goto('/ouder');
  const blok = page.getByRole('region', { name: 'Account' });
  await expect(blok).toBeVisible();

  await blok.getByLabel('E-mailadres').fill('ouder@example.nl');
  await blok.getByLabel('Wachtwoord').fill('geheimwoord');
  await blok.getByRole('button', { name: 'Inloggen' }).click();

  await expect(blok).toContainText('Je bent ingelogd als ouder@example.nl');

  await blok.getByRole('button', { name: 'Uitloggen' }).click();
  await expect(blok.getByLabel('E-mailadres')).toBeVisible();
});

test('een fout wachtwoord zegt dat, en laat je het opnieuw proberen', async ({ page }) => {
  await signIn(page, 'Noor');

  await page.route(`${GEZIN}/auth/v1/token**`, (route) =>
    antwoord(route, 400, { error_code: 'invalid_credentials', msg: 'Invalid login credentials' }),
  );

  await page.goto('/ouder');
  const blok = page.getByRole('region', { name: 'Account' });
  await blok.getByLabel('E-mailadres').fill('ouder@example.nl');
  await blok.getByLabel('Wachtwoord').fill('ietsanders');
  await blok.getByRole('button', { name: 'Inloggen' }).click();

  await expect(blok.getByRole('alert')).toContainText('horen niet bij elkaar');
  await expect(blok.getByLabel('E-mailadres')).toHaveValue('ouder@example.nl');
});

/**
 * Het adres wordt niet eens opgestuurd als het er geen is. Dat scheelt een
 * verzoek, en het scheelt een ouder een antwoord dat over iets anders gaat.
 */
test('een adres met een typefout gaat de deur niet uit', async ({ page }) => {
  await signIn(page, 'Noor');

  let gevraagd = 0;
  await page.route(`${GEZIN}/**`, (route) => {
    gevraagd += 1;
    return antwoord(route, 200, sessie('ouder@example.nl'));
  });

  await page.goto('/ouder');
  const blok = page.getByRole('region', { name: 'Account' });
  await blok.getByLabel('E-mailadres').fill('ouder.example.nl');
  await blok.getByLabel('Wachtwoord').fill('geheimwoord');
  await blok.getByRole('button', { name: 'Inloggen' }).click();

  await expect(blok.getByRole('alert')).toContainText('lijkt geen e-mailadres');
  expect(gevraagd, 'er ging een verzoek uit voor een adres dat geen adres is').toBe(0);
});

/**
 * De kern van ADR-152, als test: het kind merkt hier niets van. Geen inlogblok
 * op de voordeur, geen knop in de balk, en oefenen kan zonder dat er ook maar
 * iets gevraagd is.
 */
test('de voordeur van het kind verandert niet', async ({ page }) => {
  await signIn(page, 'Sam');

  await expect(page.getByRole('region', { name: 'Account' })).toHaveCount(0);
  for (const woord of ['Inloggen', 'Account maken', 'E-mailadres']) {
    await expect(page.getByRole('button', { name: woord })).toHaveCount(0);
  }

  await page.goto('/jij');
  await expect(page.getByRole('region', { name: 'Account' })).toHaveCount(0);
});

test('het account staat op Voor ouders, na premium', async ({ page }) => {
  await signIn(page, 'Sam');
  await page.goto('/ouder');

  const koppen = page.locator('.tk-page-main h2');
  await expect(koppen.first()).toHaveText('Premium');
  const teksten = await koppen.allInnerTexts();
  expect(teksten.indexOf('Premium')).toBeLessThan(teksten.indexOf('Account'));
  expect(teksten.indexOf('Account')).toBeLessThan(teksten.indexOf('Instellingen'));
});
