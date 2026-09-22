import { expect, test, type Page } from '@playwright/test';
import { antwoord, GEZIN, sessie, stubGezin } from './gezin';

/**
 * Inloggen was een aanbod en is sinds ADR-178 ook de poort.
 *
 * Wat hier vastligt is niet het formulier maar de belofte eromheen. Het blok
 * staat op de ouderpagina en nergens anders — sinds ADR-173, want een
 * e-mailadres en een wachtwoord zijn van de ouder, en de ouder heeft sinds die
 * beslissing een eigen pagina achter een pincode — de voordeur verandert niet,
 * en zonder in te loggen werkt alles zoals het werkte.
 *
 * **Wat ADR-178 eraan veranderde.** Op een bouw mét gezinsproject staat
 * hetzelfde blok ook vóór de pincode, als de poort die het geboortejaar
 * vervangt. Deze suite draait op zo'n bouw, dus de eerste keer dat een ouder
 * dit formulier ziet, is daar. Wat het formulier doet — een adres met een
 * typefout tegenhouden, een fout wachtwoord benoemen — wordt daarom ook daar
 * getoetst: dat is de plek waar een ouder het meemaakt, en het scheelt een
 * reis door een poort om te kunnen toetsen wat de poort zelf al doet.
 *
 * Er is geen Supabase in een test, dus het adres uit `playwright.config.ts`
 * bestaat niet en `page.route` antwoordt ervoor — zoals `premium.spec.ts` dat
 * voor de premiumserver doet. Het gedeelde antwoordapparaat staat in
 * `e2e/gezin.ts`.
 */

async function signIn(page: Page, naam: string) {
  await page.goto('/');
  await page.getByPlaceholder('Je naam').fill(naam);
  await page.getByRole('button', { name: 'Beginnen' }).click();
  // De groep is een tweede stap, altijd over te slaan (ADR-151).
  await page.getByRole('button', { name: 'Zeg ik niet' }).click();
  await expect(page.getByRole('banner').getByRole('button', { name: naam })).toBeVisible();
}

/** Tot vóór de poort: de wisselaar in de balk en de rij met het hangslot. */
async function naarDePoort(page: Page) {
  await page
    .getByRole('banner')
    .getByRole('button', { name: /Wissel van profiel/ })
    .click();
  await page.getByRole('button', { name: 'Ouder', exact: false }).click();
  return page.getByRole('region', { name: 'Account' });
}

/**
 * De ouderpagina openen: langs de poort en een verse pincode (ADR-173,
 * ADR-178). Op een leeg apparaat is er nog geen pincode, dus is "maken" ook
 * meteen "opendoen".
 */
async function naarOuder(page: Page, email = 'ouder@example.nl') {
  const blok = await naarDePoort(page);
  await blok.getByLabel('E-mailadres').fill(email);
  await blok.getByLabel('Wachtwoord').fill('geheimwoord');
  await blok.getByRole('button', { name: 'Inloggen', exact: true }).click();

  await page.getByLabel('Nieuwe pincode').fill('1234');
  await page.getByLabel('Nog een keer').fill('1234');
  await page.getByRole('button', { name: 'Bewaren', exact: true }).click();
  await expect(page).toHaveURL(/\/ouder$/);
}

/**
 * Inloggen aan de poort, en uitloggen op de pagina erachter.
 *
 * De twee horen bij elkaar en staan sinds ADR-178 op twee schermen: je komt
 * binnen bij de poort, en het blok op de ouderpagina is waar je er weer uit
 * kunt. Wie uitlogt, houdt zijn pincode — anders zou uitloggen een ouder
 * buitensluiten van zijn eigen apparaat.
 */
test('wie inlogt, ziet dat, en logt weer uit', async ({ page }) => {
  await stubGezin(page);
  await signIn(page, 'Noor');
  await naarOuder(page);

  const blok = page.getByRole('region', { name: 'Account' });
  await expect(blok).toContainText('Je bent ingelogd als ouder@example.nl');

  await blok.getByRole('button', { name: 'Uitloggen' }).click();
  await expect(blok.getByLabel('E-mailadres')).toBeVisible();

  // En de pincode staat er nog: uitloggen is geen wissen.
  await page.goto('/');
  await page
    .getByRole('banner')
    .getByRole('button', { name: /Wissel van profiel/ })
    .click();
  await page.getByRole('button', { name: 'Ouder', exact: false }).click();
  await expect(page.getByLabel('Pincode')).toBeVisible();
});

test('een fout wachtwoord zegt dat, en laat je het opnieuw proberen', async ({ page }) => {
  await signIn(page, 'Noor');

  await page.route(`${GEZIN}/auth/v1/token**`, (route) =>
    antwoord(route, 400, { error_code: 'invalid_credentials', msg: 'Invalid login credentials' }),
  );

  const blok = await naarDePoort(page);
  await blok.getByLabel('E-mailadres').fill('ouder@example.nl');
  await blok.getByLabel('Wachtwoord').fill('ietsanders');
  await blok.getByRole('button', { name: 'Inloggen', exact: true }).click();

  await expect(blok.getByRole('alert')).toContainText('horen niet bij elkaar');
  await expect(blok.getByLabel('E-mailadres')).toHaveValue('ouder@example.nl');
  // En de poort blijft dicht.
  await expect(page.getByLabel('Nieuwe pincode')).toHaveCount(0);
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

  const blok = await naarDePoort(page);
  await blok.getByLabel('E-mailadres').fill('ouder.example.nl');
  await blok.getByLabel('Wachtwoord').fill('geheimwoord');
  await blok.getByRole('button', { name: 'Inloggen', exact: true }).click();

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
  await stubGezin(page);
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
