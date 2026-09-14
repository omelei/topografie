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

  // Elke lijst heeft een eigen woordveld, dus de kaart van déze lijst.
  const kaart = blok.locator('.tk-card').filter({ hasText: naam });
  for (const woord of woorden) {
    await kaart.getByLabel('Woord', { exact: true }).fill(woord);
    await kaart.getByRole('button', { name: 'Woord toevoegen' }).click();
  }
}

test('een ingetypte lijst wordt een set die je kunt oefenen', async ({ page }) => {
  await signIn(page, 'Noor');
  await maakLijst(page, 'Week 12', ['trein', 'fiets', 'wijzer']);

  const blok = page.getByRole('region', { name: 'Eigen woorden' });
  await expect(blok.getByText('3 woorden')).toBeVisible();

  // Hij staat op de taalpagina, als een eigen deel naast Spelling en
  // Werkwoorden — en niet als onderwerp binnen Spelling, want de vormen volgen
  // op deze module het deel en niet het onderwerp (ADR-118).
  await page.goto('/taal');
  await page
    .getByRole('region', { name: 'Welk deel?' })
    .getByRole('button', { name: 'Eigen woorden', exact: true })
    .click();

  await expect(
    page
      .getByRole('region', { name: /Kies een onderwerp/ })
      .getByRole('button', { name: /^Eigen woorden/ }),
  ).toBeVisible();

  // En de enige vorm is het flitsdictee: kiezen tussen letters kan niet op een
  // woord waar niemand een gat in heeft gezet.
  const vormen = page.getByRole('region', { name: /Hoe wil je/ });
  await expect(vormen.getByRole('button', { name: /Flitsdictee/ })).toBeVisible();
  await expect(vormen.getByRole('button', { name: /Kies de letters/ })).toHaveCount(0);
});

/** Zonder lijst is er geen deel: een knop naar een lege kamer is erger dan geen knop. */
test('het deel Eigen woorden bestaat alleen als er een lijst is', async ({ page }) => {
  await signIn(page, 'Fenna');

  await page.goto('/taal');
  const delen = page.getByRole('region', { name: 'Welk deel?' });
  await expect(delen.getByRole('button')).toHaveCount(2);

  await maakLijst(page, 'Week 1', ['trein']);
  await page.goto('/taal');
  await expect(delen.getByRole('button')).toHaveCount(3);
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
      .getByRole('region', { name: 'Welk deel?' })
      .getByRole('button', { name: 'Eigen woorden', exact: true }),
  ).toHaveCount(0);
});

/**
 * Met meer dan één lijst worden het chips onder één tegel, zoals de tafels er
 * twaalf zijn onder één tegel — en dáár staat de naam die de ouder typte.
 */
test('met twee lijsten draagt elke chip de naam die de ouder typte', async ({ page }) => {
  await signIn(page, 'Jesse');
  await maakLijst(page, 'Week 12', ['trein']);
  await maakLijst(page, 'Week 13', ['fiets']);

  await page.goto('/taal');
  await page
    .getByRole('region', { name: 'Welk deel?' })
    .getByRole('button', { name: 'Eigen woorden', exact: true })
    .click();
  // De chips staan onder het gekozen onderwerp, zoals de twaalf tafels.
  await page
    .getByRole('region', { name: /Kies een onderwerp/ })
    .getByRole('button', { name: /^Eigen woorden/ })
    .click();

  await expect(page.getByRole('button', { name: /Week 12/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Week 13/ })).toBeVisible();
});
