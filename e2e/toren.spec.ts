import { expect, test, type Page } from '@playwright/test';

/**
 * De toren en de reeks (ADR-158).
 *
 * Wat hier vastligt is de boog van één dag: de modulepagina zegt wat er vandaag
 * terugkomt, een ronde laat de toren zien en wat ze ermee deed, de dag krijgt
 * de dag telt voor de reeks, en het gezicht van de toren volgt de groep.
 */

async function signIn(page: Page, naam: string) {
  await page.goto('/');
  await page.getByPlaceholder('Je naam').fill(naam);
  await page.getByRole('button', { name: 'Beginnen' }).click();
  // De groep is een tweede stap, altijd over te slaan (ADR-151).
  await page.getByRole('button', { name: 'Zeg ik niet' }).click();
  await expect(page.getByRole('banner').getByRole('button', { name: naam })).toBeVisible();
}

async function kiesProvincies(page: Page) {
  await page.goto('/topografie');
  await page
    .getByRole('region', { name: /Kies een onderwerp/ })
    .getByRole('button', { name: /^Provincies/ })
    .click();
}

test('de modulepagina zegt wat hier vandaag terugkomt, en niets meer', async ({ page }) => {
  await signIn(page, 'Jet');
  await kiesProvincies(page);

  // Geen tweede toren en geen inkleurende kaart: één zin, en die gaat over de
  // voorwaarde en niet over de beloning. Wie nog nooit oefende heeft niets dat
  // terugkomt, en hoort dat ook zo.
  await expect(page.getByText('Hier komt voorlopig niets terug.')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Jouw albumpagina' })).toHaveCount(0);
});

test('een ronde laat de toren zien, en de dag krijgt een stempel', async ({ page }) => {
  await signIn(page, 'Pim');
  await kiesProvincies(page);
  await page
    .getByRole('region', { name: /Hoe wil je/ })
    .getByRole('button', { name: /Aanwijzen/ })
    .click();
  await page.locator('.tk-choose-start button').click();

  await page.getByRole('button', { name: 'Limburg' }).click();
  await expect(page.getByRole('button', { name: 'Volgende vraag' })).toBeVisible();
  await page.getByRole('button', { name: 'Stoppen' }).click();

  // Ronde klaar opent met de toren, en zegt in woorden wat er gebeurde.
  await expect(page.getByRole('heading', { name: 'Ronde klaar' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Je toren' })).toBeVisible();
  await expect(page.getByText('1 vraag, ', { exact: false })).toBeVisible();
  // Eén provincie, voor het eerst gezien: geen steen. De regel is strenger dan
  // de doosstap, en dit is de plek waar dat zichtbaar wordt (ADR-158).
  await expect(page.getByText('Nog geen stenen', { exact: false })).toBeVisible();
  // Na één vraag gestopt is geen "klaar voor vandaag".
  await expect(page.getByRole('button', { name: 'Terug naar start' })).toBeVisible();

  // De reeks telt de dag, ook voor een ronde die halverwege stopte: het kind
  // kwam opdagen en deed het werk (ADR-158).
  const reeks = page.getByRole('region', { name: 'Je reeks' });
  await expect(reeks).toContainText('Vandaag telt al mee.');
});

test('het register volgt de groep, en een ouder kan het omzetten', async ({ page }) => {
  await signIn(page, 'Roos');

  // Zonder groep het beeldgezicht: dat is de veilige kant (ADR-158).
  await page.goto('/jij');
  await expect(page.getByRole('region', { name: 'Je toren' })).toBeVisible();

  // En op Voor ouders staat de schakelaar, standaard op "volg de groep".
  await page.goto('/ouder');
  const keuze = page.getByRole('group', { name: 'Hoe de toren eruitziet' });
  await expect(keuze.getByRole('button', { name: 'Volg de groep' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await keuze.getByRole('button', { name: 'De getallen' }).click();
  await expect(keuze.getByRole('button', { name: 'De getallen' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});
