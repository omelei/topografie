import { expect, test, type Page, type Route } from '@playwright/test';

/**
 * Inloggen is een aanbod en geen poort (ADR-155).
 *
 * Wat hier vastligt is niet het formulier maar de belofte eromheen. Het blok
 * staat op de ouderpagina en nergens anders — sinds ADR-173, want een
 * e-mailadres en een wachtwoord zijn van de ouder, en de ouder heeft sinds die
 * beslissing een eigen pagina achter een pincode — de voordeur verandert niet,
 * en zonder in te loggen werkt alles zoals het werkte.
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

/**
 * De ouderpagina openen: de wisselaar in de balk, de rij met het hangslot, en
 * een verse pincode (ADR-173). Op een leeg apparaat is er nog geen pincode, dus
 * is "maken" ook meteen "opendoen".
 */
async function naarOuder(page: Page) {
  await page
    .getByRole('banner')
    .getByRole('button', { name: /Wissel van profiel/ })
    .click();
  await page.getByRole('button', { name: 'Ouder', exact: false }).click();
  await page.getByLabel('Nieuwe pincode').fill('1234');
  await page.getByLabel('Nog een keer').fill('1234');
  await page.getByRole('button', { name: 'Bewaren', exact: true }).click();
  await expect(page).toHaveURL(/\/ouder$/);
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

test('wie inlogt, ziet dat, en logt weer uit', async ({ page }) => {
  await signIn(page, 'Noor');

  await page.route(`${GEZIN}/auth/v1/token**`, (route) =>
    antwoord(route, 200, sessie('ouder@example.nl')),
  );
  await page.route(`${GEZIN}/auth/v1/logout`, (route) => antwoord(route, 204, {}));

  await naarOuder(page);
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

  await naarOuder(page);
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

  await naarOuder(page);
  const blok = page.getByRole('region', { name: 'Account' });
  await blok.getByLabel('E-mailadres').fill('ouder.example.nl');
  await blok.getByLabel('Wachtwoord').fill('geheimwoord');
  await blok.getByRole('button', { name: 'Inloggen' }).click();

  await expect(blok.getByRole('alert')).toContainText('lijkt geen e-mailadres');
  expect(gevraagd, 'er ging een verzoek uit voor een adres dat geen adres is').toBe(0);
});

/**
 * De kern van ADR-152, als test: de voordeur merkt hier niets van. Geen
 * inlogblok op Vandaag, geen knop in de balk, en oefenen kan zonder dat er ook
 * maar iets gevraagd is.
 */
test('de voordeur van het kind verandert niet', async ({ page }) => {
  await signIn(page, 'Sam');

  await expect(page.getByRole('region', { name: 'Account' })).toHaveCount(0);
  for (const woord of ['Inloggen', 'Account maken', 'E-mailadres']) {
    await expect(page.getByRole('button', { name: woord })).toHaveCount(0);
  }
});

test('het account staat op de ouderpagina, en niet op Jij of Premium', async ({ page }) => {
  await signIn(page, 'Sam');
  await naarOuder(page);

  // Met `expect(locator)`, niet met `allInnerTexts()`: dat leest de koppen van
  // vóór de eerste render van React en wacht nergens op (zie premium.spec).
  await expect(page.getByRole('region', { name: 'Account' })).toBeVisible();

  // En op geen van de twee pagina's die een kind kan openen (ADR-173).
  for (const adres of ['/jij', '/premium']) {
    await page.goto(adres);
    await expect(page.getByRole('region', { name: 'Account' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Inloggen' })).toHaveCount(0);
  }
});
