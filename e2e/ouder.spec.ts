import { expect, test, type Page } from '@playwright/test';

/**
 * De ouder en het kind (ADR-173).
 *
 * Wat hier vastligt is de verhouding, niet de knoppen: **een kind hoeft niets
 * in te tikken om te oefenen, en een ouder wel om iets te regelen.** Drie
 * kinderen zijn gratis, het codeveld staat alleen achter de pincode, en wie de
 * ouderpagina zonder pincode opent, krijgt de deur.
 *
 * Twee dingen die makkelijk stilletjes kapotgaan en daarom apart staan: dat de
 * sessie een adreswissel overleeft (anders is wisselen tussen de blokken van de
 * ouderpagina onmogelijk, want elk kind wisselen herlaadt), en dat de pincode
 * nergens leesbaar in de opslag staat.
 */

async function signIn(page: Page, naam: string) {
  await page.goto('/');
  await page.getByPlaceholder('Je naam').fill(naam);
  await page.getByRole('button', { name: 'Beginnen' }).click();
  // De groep is een tweede stap, altijd over te slaan (ADR-151).
  await page.getByRole('button', { name: 'Zeg ik niet' }).click();
  await expect(page.getByRole('banner').getByRole('button', { name: naam })).toBeVisible();
}

function wisselaar(page: Page) {
  return page.getByRole('banner').getByRole('button', { name: /Wissel van profiel/ });
}

/** De eerste keer: er is nog geen pincode, dus hem maken is hem opendoen. */
async function maakOuder(page: Page, pin = '1234') {
  await wisselaar(page).click();
  await page.getByRole('button', { name: 'Ouder' }).click();
  await page.getByLabel('Nieuwe pincode').fill(pin);
  await page.getByLabel('Nog een keer').fill(pin);
  await page.getByRole('button', { name: 'Bewaren', exact: true }).click();
  await expect(page).toHaveURL(/\/ouder$/);
}

test('een kind tikt op zijn naam en oefent; er wordt niets gevraagd', async ({ page }) => {
  await signIn(page, 'Noor');

  await wisselaar(page).click();
  const venster = page.getByRole('dialog');
  await expect(venster.getByRole('heading', { name: 'Wie gebruikt de app?' })).toBeVisible();

  // Het kind dat oefent staat er, zonder slot en zonder veld.
  await expect(venster.getByRole('button', { name: /Noor/ })).toBeDisabled();
  await expect(venster.getByLabel('Pincode')).toHaveCount(0);
  await expect(venster.getByLabel('Wachtwoord')).toHaveCount(0);
});

test('de ouder zit achter een pincode, en het kind niet', async ({ page }) => {
  await signIn(page, 'Sam');

  await wisselaar(page).click();
  await page.getByRole('button', { name: 'Ouder' }).click();

  // Eerst maken, want dit apparaat heeft er nog geen.
  await expect(page.getByRole('heading', { name: 'Maak een ouderpagina' })).toBeVisible();
  await page.getByLabel('Nieuwe pincode').fill('4821');
  await page.getByLabel('Nog een keer').fill('4821');
  await page.getByRole('button', { name: 'Bewaren', exact: true }).click();

  await expect(page).toHaveURL(/\/ouder$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Voor de ouder' })).toBeVisible();

  // En de cijfers staan nergens in de opslag (ADR-173): wat er staat is een
  // afleiding met een salt. Vier cijfers zijn geen geheim, maar ze mogen ook
  // niet zomaar te lezen zijn — een gezin gebruikt dezelfde vier vaker.
  const ruw = await page.evaluate(() => window.localStorage.getItem('leernu.ouder'));
  expect(ruw).not.toBeNull();
  expect(ruw).not.toContain('4821');
});

test('een verkeerde pincode komt er niet in, en de goede wel', async ({ page }) => {
  await signIn(page, 'Tess');
  await maakOuder(page, '4821');

  // Terug naar het kind, en dan staat de deur weer dicht.
  await page.getByRole('button', { name: /Terug naar Tess/ }).click();
  await expect(page).toHaveURL(/\/$/);

  await wisselaar(page).click();
  await page.getByRole('button', { name: 'Ouder' }).click();
  await expect(page.getByRole('heading', { name: 'Even je pincode' })).toBeVisible();

  const venster = page.getByRole('dialog');
  await venster.getByLabel('Pincode', { exact: true }).fill('0000');
  await venster.getByRole('button', { name: 'Verder', exact: true }).click();
  await expect(venster.getByRole('alert')).toContainText('niet de pincode van dit apparaat');
  await expect(page).not.toHaveURL(/\/ouder$/);

  await venster.getByLabel('Pincode', { exact: true }).fill('4821');
  await venster.getByRole('button', { name: 'Verder', exact: true }).click();
  await expect(page).toHaveURL(/\/ouder$/);
});

test('wie zonder pincode op /ouder komt, krijgt de deur en niet de pagina', async ({ page }) => {
  await signIn(page, 'Mees');

  await page.goto('/ouder');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Dit is de ouderpagina' }),
  ).toBeVisible();

  // Niets van wat erachter zit is te zien: geen codeveld, geen wissen.
  await expect(page.getByLabel('Typ de code')).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Alles van dit apparaat halen' })).toHaveCount(0);

  // En het adres blijft staan: het wordt niet weggeschreven naar een andere
  // pagina, want dan zou de terugknop een stap overslaan.
  await expect(page).toHaveURL(/\/ouder$/);
});

test('de ouderpagina draagt de kinderen, premium, de instellingen en het wissen', async ({
  page,
}) => {
  await signIn(page, 'Iris');
  await maakOuder(page);

  for (const blok of ['Je kinderen', 'Premium', 'Instellingen', 'Alles van dit apparaat halen']) {
    await expect(page.getByRole('region', { name: blok, exact: true })).toBeVisible();
  }

  // Het kind staat erin, met zijn groep, en de naam is hier te veranderen —
  // ook die van een kind dat nu niet aan de beurt is.
  const kinderen = page.getByRole('region', { name: 'Je kinderen' });
  const rij = kinderen.getByRole('button', { name: /^Iris/ });
  await expect(rij).toContainText('geen groep gekozen');
  await rij.click();
  await expect(kinderen.getByRole('button', { name: 'Groep 5' })).toBeVisible();
});

test('de sessie van de ouder overleeft een adreswissel in hetzelfde tabblad', async ({ page }) => {
  await signIn(page, 'Loes');
  await maakOuder(page);

  await page.goto('/jij');
  await page.goto('/ouder');
  await expect(page.getByRole('region', { name: 'Je kinderen' })).toBeVisible();
});

/**
 * Zonder code, want de rest van dit bestand draait ermee
 * (`playwright.config.ts`) en de verkoopkant van de premiumpagina is precies
 * wat een kind zonder code te zien krijgt.
 */
test.describe('zonder code', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  /**
   * De parental gate die Apple en Google eisen: een kind dat op de
   * premiumpagina belandt, vindt daar geen veld maar één knop naar de ouder.
   */
  test('het codeveld staat niet op de premiumpagina, maar erachter', async ({ page }) => {
    await signIn(page, 'Wout');
    await page.goto('/premium');

    await expect(page.getByLabel('Typ de code')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Code gebruiken' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Ik ben de ouder' }).click();
    await page.getByLabel('Nieuwe pincode').fill('1234');
    await page.getByLabel('Nog een keer').fill('1234');
    await page.getByRole('button', { name: 'Bewaren', exact: true }).click();

    await expect(page).toHaveURL(/\/ouder$/);
    await expect(page.getByLabel('Typ de code')).toBeVisible();
  });

  /**
   * Drie kinderen zijn gratis (ADR-173). Tot nu toe was meer dan één kind
   * premium, en dat botst met één code die voor alle drie geldt: dan moet een
   * gezin betalen om te kunnen zien wat er te betalen valt.
   */
  test('een tweede kind kan zonder premium', async ({ page }) => {
    await signIn(page, 'Bram');

    await wisselaar(page).click();
    await page.getByRole('button', { name: 'Nog een kind erbij' }).click();
    await page.getByLabel('Naam van het kind').fill('Fien');
    await page.getByRole('button', { name: 'Toevoegen', exact: true }).click();

    await expect(page.getByRole('banner').getByRole('button', { name: 'Fien' })).toBeVisible();
  });
});
