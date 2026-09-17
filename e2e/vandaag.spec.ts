import { expect, test, type Page } from '@playwright/test';

/**
 * The front door's "Maak af" (ADR-115) and the Onthouden table (ADR-114).
 *
 * A round stopped halfway waits on the front door, says how far it got, and
 * picks up with only the questions it had not asked yet. And the table says
 * how often each place was answered, how much of that was right, and when.
 */

async function signIn(page: Page, naam: string) {
  await page.goto('/');
  await page.getByPlaceholder('Je naam').fill(naam);
  await page.getByRole('button', { name: 'Beginnen' }).click();
  // De groep is een tweede stap, altijd over te slaan (ADR-151).
  await page.getByRole('button', { name: 'Weet ik niet' }).click();
  await expect(page.getByRole('banner').getByRole('button', { name: naam })).toBeVisible();
}

/** The provinces, pointed at: twelve questions, of which this answers one and stops. */
async function eenProvincieEnStop(page: Page) {
  await page.goto('/topografie');
  await page
    .getByRole('region', { name: /Kies een onderwerp/ })
    .getByRole('button', { name: /^Provincies/ })
    .click();
  await page
    .getByRole('region', { name: /Hoe wil je/ })
    .getByRole('button', { name: /Aanwijzen/ })
    .click();
  await page.locator('.tk-choose-start button').click();

  await expect(page.getByRole('button', { name: 'Limburg' })).toBeVisible();
  await page.getByRole('button', { name: 'Limburg' }).click();
  await expect(page.getByRole('button', { name: 'Volgende vraag' })).toBeVisible();
  await page.getByRole('button', { name: 'Stoppen' }).click();
  await expect(page.getByRole('heading', { name: 'Ronde klaar' })).toBeVisible();
}

test('a round stopped halfway waits under Maak af, and asks only what was left', async ({
  page,
}) => {
  await signIn(page, 'Lotte');

  // Nothing started yet: the row is there, and says what it is for.
  const rij = page.getByRole('region', { name: 'Maak af' });
  await expect(rij).toContainText('Stop je halverwege een ronde?');
  // And the module tiles it replaced are gone.
  await expect(page.getByRole('region', { name: 'Verder oefenen' })).toHaveCount(0);

  await eenProvincieEnStop(page);
  await page.getByRole('button', { name: 'Terug naar start' }).click();

  const kaart = rij.getByRole('button', { name: /Provincies van Nederland/ });
  await expect(kaart).toContainText('Nog 11 van de 12 vragen');
  await kaart.click();

  // Eleven questions, not twelve: stopping at once says so.
  await expect(page.getByRole('button', { name: 'Stoppen' })).toBeVisible();
  await page.getByRole('button', { name: 'Stoppen' }).click();
  await expect(page.getByText('Je stopte na 0 van de 11 vragen.')).toBeVisible();
});

test('the Onthouden table counts the answers, the share right, and the days since', async ({
  page,
}) => {
  await signIn(page, 'Siem');
  await eenProvincieEnStop(page);

  await page.goto('/onthouden');
  // De tabel staat sinds ADR-143 achter een knop: wat de pagina opent is het
  // beeld, en dit is de test over de tabel.
  await page.getByRole('button', { name: 'Laat de tabel zien' }).click();
  const tabel = page.getByRole('table');
  for (const kop of ['Onderdeel', 'Hoe het gaat', 'Aantal', '% goed', 'Laatst geoefend']) {
    await expect(tabel.getByRole('columnheader', { name: kop, exact: true })).toBeVisible();
  }
  await expect(tabel.getByRole('columnheader', { name: 'Weer op' })).toHaveCount(0);

  // One province answered today, the other eleven never.
  await expect(tabel.getByRole('cell', { name: 'vandaag', exact: true })).toHaveCount(1);

  // The four tiles are the four statuses; "Vandaag op de rol" is gone.
  await expect(page.getByText('Vandaag op de rol')).toHaveCount(0);
  await expect(page.getByText('Even opfrissen', { exact: true })).toBeVisible();
});
