import { expect, type Page, type Route } from '@playwright/test';

/**
 * De poort vóór de pincode, voor de toetsen die erlangs moeten (ADR-178).
 *
 * **Waarom dit er is.** `playwright.config.ts` geeft de bouw waar deze suite op
 * draait een gezinsproject: `VITE_GEZIN_URL` staat op een adres dat niet
 * bestaat, zodat `page.route` ervoor kan antwoorden. Sinds ADR-178 bepaalt
 * diezelfde variabele wélke poort er vóór de pincode staat — het account in
 * plaats van het geboortejaar — en daarmee raakt hij elke reis in deze suite
 * die bij de ouderpagina uitkomt.
 *
 * Dat is geen ongeluk maar het product: zodra de eigenaar `GEZIN_URL` invult,
 * is dit de eerste keer die een ouder meemaakt. De suite hoort die reis te
 * lopen en niet de terugval.
 *
 * **De terugval raakt zijn dekking niet kwijt.** Welke poort er bij welke bouw
 * staat, ligt vast in `src/features/ouder/Pinslot.test.tsx`, en wat het
 * geboortejaar afwijst in `src/features/ouder/Volwassenencheck.test.tsx`. Dat
 * zijn takken, geen reizen, en een tak toets je waar hij staat.
 */

/** Hetzelfde adres als in `playwright.config.ts`. Er luistert niets. */
export const GEZIN = 'https://gezin.leer.test';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'apikey, authorization, content-type, prefer',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
};

export async function antwoord(route: Route, status: number, body: unknown) {
  if (route.request().method() === 'OPTIONS') {
    await route.fulfill({ status: 204, headers: CORS });
    return;
  }
  await route.fulfill({ status, headers: CORS, json: body });
}

/** Een sessie zoals Supabase er een teruggeeft. */
export function sessie(email: string) {
  return {
    access_token: 'token-e2e',
    refresh_token: 'vernieuw-e2e',
    expires_in: 3600,
    token_type: 'bearer',
    user: { id: 'ouder-e2e', email },
  };
}

/**
 * Antwoorden voor het gezinsproject, zodat inloggen lukt.
 *
 * Dit moet vóór de eerste klik staan die de poort opent: een verzoek dat niet
 * onderschept wordt, sneuvelt op de naam.
 */
export async function stubGezin(page: Page, email = 'ouder@example.nl') {
  await page.route(`${GEZIN}/auth/v1/token**`, (route) => antwoord(route, 200, sessie(email)));
  await page.route(`${GEZIN}/auth/v1/logout`, (route) => antwoord(route, 204, {}));
}

/**
 * Door de poort: het formulier dat vóór de pincode staat, ingevuld en verstuurd.
 *
 * Het is `AccountBlok`, hetzelfde blok als op de ouderpagina zelf, dus het
 * staat in de streek "Account" en begint in de stand "inloggen".
 */
export async function langsDePoort(page: Page, email = 'ouder@example.nl') {
  const blok = page.getByRole('region', { name: 'Account', exact: true });
  await blok.getByLabel('E-mailadres').fill(email);
  await blok.getByLabel('Wachtwoord').fill('geheimwoord');
  await blok.getByRole('button', { name: 'Inloggen', exact: true }).click();
  await expect(page.getByLabel('Nieuwe pincode')).toBeVisible();
}

/**
 * Dezelfde poort, maar voor wie al ingelogd is: dan vraagt hij alleen nog het
 * wachtwoord (ADR-178).
 *
 * Dit is het geval dat een pincode vervangen tegenkomt: de ouder logde in toen
 * hij de code zette, die sessie staat er nog, en de poort gaat er toch niet
 * vanzelf van open.
 */
export async function herbevestig(page: Page) {
  await expect(page.getByRole('heading', { name: 'Ben jij het?' })).toBeVisible();
  await page.getByLabel('Je wachtwoord').fill('geheimwoord');
  await page.getByRole('button', { name: 'Verder', exact: true }).click();
  await expect(page.getByLabel('Nieuwe pincode')).toBeVisible();
}

/**
 * Het adres waar de link uit een herstelmail op uitkomt (ADR-186), zoals
 * Supabase het maakt: de sessie achter het hekje, met een JWT waar de app het
 * adres en de id van de ouder uit leest.
 */
export function herstelLink(pad = '/ouder', email = 'ouder@example.nl') {
  const deel = (waarde: unknown) => Buffer.from(JSON.stringify(waarde)).toString('base64url');
  const token = `${deel({ alg: 'HS256', typ: 'JWT' })}.${deel({ sub: 'ouder-e2e', email })}.x`;
  const velden = new URLSearchParams({
    access_token: token,
    expires_in: '3600',
    refresh_token: 'vernieuw-herstel',
    token_type: 'bearer',
    type: 'recovery',
  });
  return `${pad}#${velden.toString()}`;
}

/** Een link die op is: verlopen, of al een keer gebruikt. */
export const VERLOPEN_LINK =
  '/ouder#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired';
