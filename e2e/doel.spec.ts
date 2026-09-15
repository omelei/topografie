import { expect, test, type Page } from '@playwright/test';

/**
 * Waar je voor gaat (ADR-141).
 *
 * De app wist elke dag wat er aan de beurt was en nooit waar het naartoe ging.
 * Deze test loopt de hele boog: een doel kiezen, zien hoe ver je bent, het
 * diploma halen zodra je er klaar voor bent, en het op de voordeur terugzien
 * met de vraag wat nu.
 */

async function signIn(page: Page, naam: string) {
  await page.goto('/');
  await page.getByPlaceholder('Je naam').fill(naam);
  await page.getByRole('button', { name: 'Beginnen' }).click();
  await expect(page.getByRole('banner').getByRole('button', { name: naam })).toBeVisible();
}

const blokVan = (page: Page) => page.getByRole('region', { name: 'Waar je voor gaat' });

/** De tafel van 1 spelen, tien sommen lang, alles goed. */
async function tienSommen(page: Page) {
  for (let vraag = 1; vraag <= 10; vraag++) {
    const som = await page.locator('.tk-sum').innerText();
    await page.getByPlaceholder('Antwoord').fill((som.split('×')[1] ?? '').trim());
    await page.getByRole('button', { name: 'Kijk na' }).click();
    // Wachten op één van beide: `isVisible` zonder wachten breekt de lus soms
    // af voordat het scherm bijgewerkt is.
    const volgende = page.getByRole('button', { name: 'Volgende vraag' });
    const klaar = page.getByRole('heading', { name: 'Ronde klaar' });
    await expect(volgende.or(klaar).first()).toBeVisible();
    if (await klaar.isVisible()) break;
    await volgende.click();
  }
  await expect(page.getByRole('heading', { name: 'Ronde klaar' })).toBeVisible();
}

async function tafelVanEen(page: Page, vorm: RegExp) {
  await page.goto('/rekenen');
  await page
    .getByRole('region', { name: /Kies een onderwerp/ })
    .getByRole('button', { name: /^Tafels/ })
    .click();
  await page.getByRole('button', { name: 'Tafel van 1', exact: true }).click();
  await page
    .getByRole('region', { name: /Hoe wil je/ })
    .getByRole('button', { name: vorm })
    .click();
  await page.locator('.tk-choose-start button').click();
}

/**
 * Alles wat dit kind geoefend heeft in doos vier zetten: dan is het onthouden
 * (ADR-114), en dat is wat de voortgang naar een diploma meet. Vier goede
 * rondes over een week afspelen zou hetzelfde doen en tien minuten duren.
 */
async function alsOnthouden(page: Page) {
  await page.evaluate(async () => {
    await new Promise<void>((klaar, mis) => {
      const open = indexedDB.open('leernu');
      open.onerror = () => mis(open.error);
      open.onsuccess = () => {
        const db = open.result;
        const tx = db.transaction('progress', 'readwrite');
        const store = tx.objectStore('progress');
        store.getAll().onsuccess = (event) => {
          const rijen = (event.target as IDBRequest).result as Record<string, unknown>[];
          const nu = new Date().toISOString();
          const straks = new Date(Date.now() + 14 * 86_400_000).toISOString();
          for (const rij of rijen) {
            store.put({ ...rij, box: 4, goedCount: 4, laatsteReview: nu, volgendeReview: straks });
          }
        };
        tx.oncomplete = () => {
          db.close();
          klaar();
        };
        tx.onerror = () => mis(tx.error);
      };
    });
  });
}

test('een kind kiest een doel en oefent ernaartoe', async ({ page }) => {
  await signIn(page, 'Fien');

  const blok = blokVan(page);
  await expect(blok).toBeVisible();
  await expect(blok).toContainText('Kies een diploma om voor te gaan.');

  const eerste = blok.getByRole('button').first();
  const naam = (await eerste.locator('.tk-lijstrij-titel').innerText()).trim();
  await eerste.click();

  // Het doel staat er, met hoeveel van die set dit kind onthoudt — nul, want er
  // is nog niets gedaan, en dat is precies wat er te doen is.
  await expect(blok).toContainText(`Diploma ${naam}`);
  await expect(blok).toContainText(/Je onthoudt er 0 van de \d+\./);

  // Eén druk, en je oefent eraan.
  await blok.getByRole('button', { name: 'Oefenen' }).click();
  await expect(page.getByRole('button', { name: 'Stoppen' })).toBeVisible();
});

test('het doel blijft staan en is weer los te laten', async ({ page }) => {
  await signIn(page, 'Bram');
  const blok = blokVan(page);

  const eerste = blok.getByRole('button').first();
  const naam = (await eerste.locator('.tk-lijstrij-titel').innerText()).trim();
  await eerste.click();
  await expect(blok).toContainText(`Diploma ${naam}`);

  await page.goto('/rekenen');
  await page.goto('/');
  await expect(blok).toContainText(`Diploma ${naam}`);

  await blok.getByRole('button', { name: 'Ander doel kiezen' }).click();
  await expect(blok).toContainText('Kies een diploma om voor te gaan.');
});

test('wie de hele set onthoudt krijgt de toets aangeboden, en haalt zijn doel', async ({
  page,
}) => {
  await signIn(page, 'Tess');

  // Eerst de tafel van 1 kennen: dan staat hij bovenaan de voorstellen, want
  // het diploma dat het dichtst bij is gaat voor.
  await tafelVanEen(page, /Zelf typen/);
  await tienSommen(page);
  await alsOnthouden(page);

  await page.goto('/');
  const blok = blokVan(page);
  await blok
    .getByRole('button', { name: /Tafel van 1 / })
    .first()
    .click();

  // Rijp: de knop zegt niet meer "Oefenen".
  await expect(blok).toContainText('Diploma Tafel van 1');
  await expect(blok).toContainText('Je kent ze allemaal. Nu de toets.');

  await blok.getByRole('button', { name: 'Doe de toets' }).click();
  await tienSommen(page);

  // Op het moment zelf, naast het diploma.
  await expect(page.getByText('Dit was waar je voor ging.')).toBeVisible();

  // En op de voordeur de vraag wat nu.
  await page.goto('/');
  await expect(blok).toContainText('Gehaald! Je hebt het diploma Tafel van 1.');
  await expect(blok).toContainText('Waar ga je nu voor?');
});
