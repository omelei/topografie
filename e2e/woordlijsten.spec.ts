import { expect, test, type Page } from '@playwright/test';

/**
 * De lijst van school, ingetypt door een ouder (ADR-135).
 *
 * De hele belofte is dat zo'n lijst een gewone set wordt: dat hij op de
 * taalpagina staat, dat er een ronde op te spelen is, en dat die ronde daarna
 * in de geschiedenis staat zoals elke andere. Dat is niet te bewijzen met een
 * pure test — die zou de omzetting testen en niet de belofte.
 */

async function signIn(page: Page, naam: string) {
  await page.goto('/');
  await page.getByPlaceholder('Je naam').fill(naam);
  await page.getByRole('button', { name: 'Beginnen' }).click();
  await expect(page.getByRole('banner').getByRole('button', { name: naam })).toBeVisible();
}

async function maakLijst(page: Page, naam: string, woorden: readonly string[]) {
  await page.goto('/jij');
  const blok = page.getByRole('region', { name: 'Eigen woorden' });

  await blok.getByLabel('Naam van de lijst').fill(naam);
  await blok.getByRole('button', { name: 'Lijst maken' }).click();

  for (const woord of woorden) {
    await blok.getByLabel('Woord', { exact: true }).fill(woord);
    await blok.getByRole('button', { name: 'Woord toevoegen' }).click();
  }
}

test('een ingetypte lijst wordt een set die je kunt oefenen', async ({ page }) => {
  await signIn(page, 'Noor');
  await maakLijst(page, 'Week 12', ['trein', 'fiets', 'wijzer']);

  const blok = page.getByRole('region', { name: 'Eigen woorden' });
  await expect(blok.getByText('3 woorden')).toBeVisible();

  // Hij staat op de taalpagina, als onderwerp met de naam die de ouder typte.
  await page.goto('/taal');
  await page
    .getByRole('region', { name: /Kies een onderwerp/ })
    .getByRole('button', { name: /^Eigen woorden/ })
    .click();

  // En de enige vorm is het flitsdictee: kiezen tussen letters kan niet op een
  // woord waar niemand een gat in heeft gezet.
  const vormen = page.getByRole('region', { name: /Hoe wil je/ });
  await expect(vormen.getByRole('button', { name: /Flitsdictee/ })).toBeVisible();
  await expect(vormen.getByRole('button', { name: /Kies de letters/ })).toHaveCount(0);
});

/** Hetzelfde woord twee keer zou twee onderdelen met hetzelfde id geven. */
test('neemt hetzelfde woord niet twee keer op', async ({ page }) => {
  await signIn(page, 'Sam');
  await maakLijst(page, 'Week 3', ['trein', 'Trein', 'fiets']);

  const blok = page.getByRole('region', { name: 'Eigen woorden' });
  await expect(blok.getByText('2 woorden')).toBeVisible();
});

test('een woord en een hele lijst gaan er weer af', async ({ page }) => {
  await signIn(page, 'Rik');
  await maakLijst(page, 'Week 5', ['trein', 'fiets']);

  const blok = page.getByRole('region', { name: 'Eigen woorden' });
  await blok.getByRole('button', { name: 'trein weghalen' }).click();
  await expect(blok.getByText('1 woord')).toBeVisible();

  await blok.getByRole('button', { name: 'Lijst weghalen' }).click();
  await expect(blok.getByText('Je hebt nog geen lijst.')).toBeVisible();

  // En dan is het onderwerp ook van de taalpagina af: een deur naar een lege
  // kamer is erger dan geen deur.
  await page.goto('/taal');
  await expect(
    page
      .getByRole('region', { name: /Kies een onderwerp/ })
      .getByRole('button', { name: /^Eigen woorden/ }),
  ).toHaveCount(0);
});
