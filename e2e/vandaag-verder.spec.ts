import { expect, test, type Page } from '@playwright/test';

/**
 * Het slinkende dagplan (ADR-139).
 *
 * Het plan slonk al — het wordt elke keer opnieuw uit de Leitner-standen
 * gerekend — maar een kind zag het niet gebeuren, en afmaken leverde niets op:
 * stond er niets meer open, dan verdween het blok zonder een woord. Deze test
 * kijkt naar precies die twee dingen: gaat het door na een ronde, en heeft de
 * dag een bodem.
 */

async function signIn(page: Page, naam: string) {
  await page.goto('/');
  await page.getByPlaceholder('Je naam').fill(naam);
  await page.getByRole('button', { name: 'Beginnen' }).click();
  // De groep is een tweede stap, altijd over te slaan (ADR-151).
  await page.getByRole('button', { name: 'Zeg ik niet' }).click();
  await expect(page.getByRole('banner').getByRole('button', { name: naam })).toBeVisible();
}

/** De tafel van 1, helemaal uitgespeeld: tien onderdelen met een stand. */
async function oefenTafelVanEen(page: Page) {
  await page.goto('/rekenen');
  await page
    .getByRole('region', { name: /Kies een onderwerp/ })
    .getByRole('button', { name: /^Tafels/ })
    .click();
  await page.getByRole('button', { name: 'Tafel van 1', exact: true }).click();
  await page
    .getByRole('region', { name: /Hoe wil je/ })
    .getByRole('button', { name: /Zelf typen/ })
    .click();
  await page.locator('.tk-choose-start button').click();

  for (let vraag = 1; vraag <= 10; vraag++) {
    const som = await page.locator('.tk-sum').innerText();
    await page.getByPlaceholder('Antwoord').fill((som.split('×')[1] ?? '').trim());
    await page.getByRole('button', { name: 'Kijk na' }).click();
    await page.getByRole('button', { name: 'Volgende vraag' }).click();
  }
  await expect(page.getByRole('heading', { name: 'Ronde klaar' })).toBeVisible();
}

/**
 * De Leitner-standen een week terugzetten, zodat alles vandaag aan de beurt is,
 * en de bewaarde dagstand wissen zodat "vandaag" opnieuw begint.
 */
async function zetStandenTerug(page: Page) {
  await page.evaluate(async () => {
    await new Promise<void>((klaar, mis) => {
      const open = indexedDB.open('leernu');
      open.onerror = () => mis(open.error);
      open.onsuccess = () => {
        const db = open.result;
        const tx = db.transaction(['progress', 'settings'], 'readwrite');
        const store = tx.objectStore('progress');
        store.getAll().onsuccess = (event) => {
          const rijen = (event.target as IDBRequest).result as Record<string, unknown>[];
          const week = new Date(Date.now() - 7 * 86_400_000).toISOString();
          for (const rij of rijen) {
            store.put({ ...rij, laatsteReview: week, volgendeReview: week });
          }
        };
        // De dagstand van dit kind weg: anders ligt "vandaag" al vast op leeg.
        tx.objectStore('settings').delete('dagstand:me');
        tx.oncomplete = () => {
          db.close();
          klaar();
        };
        tx.onerror = () => mis(tx.error);
      };
    });
  });
}

test('na een ronde staat er hoeveel er nog van vandaag over is', async ({ page }) => {
  await signIn(page, 'Noor');

  // Twee sets oefenen, zodat er vandaag twee rondes klaarstaan.
  await oefenTafelVanEen(page);
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
  await page.getByRole('button', { name: 'Limburg' }).click();
  await page.getByRole('button', { name: 'Stoppen' }).click();
  await expect(page.getByRole('heading', { name: 'Ronde klaar' })).toBeVisible();

  await zetStandenTerug(page);
  await page.goto('/');

  const blok = page.getByRole('region', { name: 'Vandaag herhalen' });
  await expect(blok).toBeVisible();

  // De eerste ronde van vandaag, vanaf de voordeur.
  await blok.getByRole('button').first().click();
  await page.getByRole('button', { name: 'Stoppen' }).click();
  await expect(page.getByRole('heading', { name: 'Ronde klaar' })).toBeVisible();

  // En daar staat wat er nog te doen is, met de weg erheen. Twee, want een
  // ronde die na één vraag stopt laat de rest van die set gewoon openstaan.
  const verder = page.locator('.tk-vandaag-verder');
  await expect(verder).toBeVisible();
  await expect(verder).toContainText(/Nog \d+ rondes? voor vandaag/);
  await verder.click();
  await expect(page.getByRole('button', { name: 'Stoppen' })).toBeVisible();
});

/**
 * De bodem. Hiervoor verdween het blok zonder een woord zodra alles gedaan was
 * — de beloning voor precies op schema zijn was dat er iets ophield te bestaan.
 */
test('als alles van vandaag gedaan is, staat dat er', async ({ page }) => {
  await signIn(page, 'Sam');
  await oefenTafelVanEen(page);
  await zetStandenTerug(page);

  await page.goto('/');
  const blok = page.getByRole('region', { name: 'Vandaag herhalen' });
  await expect(blok).toBeVisible();

  await blok.getByRole('button').first().click();
  // Alles goed: dan staat er vanavond niets meer open van deze set. Het plan
  // kiest de manier van de vorige ronde, en typen is gratis (ADR-224).
  for (let vraag = 1; vraag <= 10; vraag++) {
    const som = await page.locator('.tk-sum').innerText();
    await page.getByPlaceholder('Antwoord').fill((som.split('×')[1] ?? '').trim());
    await page.getByRole('button', { name: 'Kijk na' }).click();
    // Wachten op één van beide: `isVisible` zonder wachten breekt de lus soms
    // af voordat het scherm bijgewerkt is, en dan zijn niet alle tien gedaan.
    const volgende = page.getByRole('button', { name: 'Volgende vraag' });
    const klaar = page.getByRole('heading', { name: 'Ronde klaar' });
    await expect(volgende.or(klaar).first()).toBeVisible();
    if (await klaar.isVisible()) break;
    await volgende.click();
  }

  await page.goto('/');
  await expect(blok.getByText('Klaar voor vandaag. Lekker bezig!')).toBeVisible();
});
