import { expect, test, type Page } from '@playwright/test';

/**
 * Premium op proef (ADR-193): een apparaat zonder code krijgt één keer veertien
 * dagen alles, en valt daarna terug naar gratis. De voordeur zegt het in het
 * begin, telt aan het eind af, en zegt na afloop dat er niets weg is.
 */

async function signIn(page: Page, naam: string) {
  await page.goto('/');
  await page.getByPlaceholder('Je naam').fill(naam);
  await page.getByRole('button', { name: 'Beginnen' }).click();
  // De groep is een tweede stap, altijd over te slaan (ADR-151).
  await page.getByRole('button', { name: 'Zeg ik niet' }).click();
  await expect(page.getByRole('banner').getByRole('button', { name: naam })).toBeVisible();
}

/** Een proef die zoveel dagen geleden begon, gezet vóór de app hem leest. */
async function proefVan(page: Page, dagenGeleden: number) {
  await page.addInitScript((terug) => {
    const dag = new Date();
    dag.setDate(dag.getDate() - terug);
    const maand = String(dag.getMonth() + 1).padStart(2, '0');
    const dagVanMaand = String(dag.getDate()).padStart(2, '0');
    window.localStorage.setItem('leernu.proef', `${dag.getFullYear()}-${maand}-${dagVanMaand}`);
  }, dagenGeleden);
}

/** De bliksemronde bij de provincies: premium, dus een slot of een keuze. */
async function kiesBliksem(page: Page) {
  await page.goto('/topografie');
  await page
    .getByRole('region', { name: /Kies een onderwerp/ })
    .getByRole('button', { name: /^Provincies/ })
    .click();
  const hoe = page.getByRole('region', { name: /Hoe wil je/ });
  await hoe.getByRole('button', { name: /^Bliksemronde/ }).click();
  return hoe.getByRole('button', { name: /^Bliksemronde/ });
}

const blokVan = (page: Page) => page.getByRole('region', { name: 'Premium op proef' });

test.describe('een nieuw apparaat', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('heeft twee weken alles open, en de voordeur zegt het', async ({ page }) => {
    await signIn(page, 'Lotte');

    const blok = blokVan(page);
    await expect(blok).toContainText('Nog 14 dagen staat alles open');
    await expect(blok).toContainText('Je mag leer.nu twee weken helemaal proberen');
    // In het begin valt er niets te verkopen, alleen iets uit te leggen.
    await expect(blok.getByRole('button')).toHaveCount(0);

    // De weekdoelen staan open, zonder slot.
    const doelen = page.getByRole('region', { name: 'Je doelen voor deze week' });
    await expect(doelen.getByRole('button', { name: 'Doel toevoegen' })).toBeVisible();

    // En een premiumvorm is gewoon een vorm.
    const bliksem = await kiesBliksem(page);
    await expect(bliksem).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('dialog', { name: 'Vraag het even aan je ouders' })).toHaveCount(0);

    // De premiumpagina zegt tot wanneer, en verkoopt gewoon verder.
    await page.goto('/premium');
    await expect(page.getByText(/^Je probeert premium: alles staat open/)).toBeVisible();
    await expect(page.getByText('Alles staat open op dit apparaat.')).toHaveCount(0);
  });
});

test.describe('zonder code', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('telt de voordeur de laatste dagen af', async ({ page }) => {
    await proefVan(page, 12);
    await signIn(page, 'Mees');

    const blok = blokVan(page);
    await expect(blok).toContainText('Nog 2 dagen staat alles open');
    await expect(blok).toContainText('Alles wat je nu doet, blijft bewaard');
    await blok.getByRole('button', { name: 'Bekijk premium' }).click();
    await expect(page).toHaveURL(/\/premium$/);
  });

  test('zegt de voordeur na afloop dat er niets weg is, en staan de sloten er weer', async ({
    page,
  }) => {
    await proefVan(page, 14);
    await signIn(page, 'Noa');

    await expect(blokVan(page)).toContainText('De twee weken zijn voorbij');
    await expect(
      page.getByRole('region', { name: 'Je doelen voor deze week' }).getByRole('button', {
        name: 'Bekijk premium',
      }),
    ).toBeVisible();

    await kiesBliksem(page);
    await expect(page.getByRole('dialog', { name: 'Vraag het even aan je ouders' })).toBeVisible();

    await page.goto('/premium');
    await expect(page.getByText(/^De twee weken op proef zijn voorbij/)).toBeVisible();
  });

  test('zegt de voordeur na een week niets meer', async ({ page }) => {
    await proefVan(page, 30);
    await signIn(page, 'Jip');
    await expect(page.getByRole('heading', { name: 'Welkom Jip!' })).toBeVisible();
    await expect(blokVan(page)).toHaveCount(0);
  });
});

test('met een code begint er geen proef', async ({ page }) => {
  await signIn(page, 'Ties');
  await expect(page.getByRole('heading', { name: 'Welkom Ties!' })).toBeVisible();
  expect(await page.evaluate(() => window.localStorage.getItem('leernu.proef'))).toBeNull();
  await expect(blokVan(page)).toHaveCount(0);
});
