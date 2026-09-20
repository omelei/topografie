import { expect, test, type Page } from '@playwright/test';

/**
 * Het meetinstrument achter #diagnose (ADR-128).
 *
 * De hele waarde ervan is dat de getallen kloppen, en dat is precies wat een
 * pure test niet kan aantonen: die voert zelfverzonnen rondes in. Hier wordt
 * er echt gespeeld en echt weggelopen, en daarna wordt geteld wat de app zelf
 * in IndexedDB heeft achtergelaten.
 */

async function signIn(page: Page, naam: string) {
  await page.goto('/');
  await page.getByPlaceholder('Je naam').fill(naam);
  await page.getByRole('button', { name: 'Beginnen' }).click();
  // De groep is een tweede stap, altijd over te slaan (ADR-151).
  await page.getByRole('button', { name: 'Zeg ik niet' }).click();
  await expect(page.getByRole('banner').getByRole('button', { name: naam })).toBeVisible();
}

/** De provincies: twaalf vragen, waarvan dit er één beantwoordt en dan stopt. */
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

/** De tafel van 1, helemaal uitgespeeld. */
async function eenHeleTafelronde(page: Page) {
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

function tegel(page: Page, label: string) {
  return page
    .locator('.tk-cijfer')
    .filter({ has: page.getByText(label, { exact: true }) })
    .locator('.tk-cijfer-getal');
}

test('telt een weggelopen ronde als afgebroken, en durft er niets uit te concluderen', async ({
  page,
}) => {
  await signIn(page, 'Noor');
  await eenProvincieEnStop(page);

  await page.goto('/#diagnose');
  await expect(page.getByRole('heading', { name: 'Waar haken ze af?' })).toBeVisible();

  const kind = page.getByRole('region', { name: 'Noor' });
  await expect(kind).toBeVisible();

  await expect(tegel(page, 'Rondes')).toHaveText('1');
  await expect(tegel(page, 'Afgebroken')).toHaveText('100%');
  await expect(tegel(page, 'Stopt bij vraag')).toHaveText('1');

  // Eén ronde is geen bewijs, en het instrument hoort dat zelf te zeggen in
  // plaats van honderd procent te presenteren alsof het iets betekent.
  await expect(kind.getByText(/te weinig rondes/)).toBeVisible();
});

test('scheidt een afgemaakte ronde van een afgebroken ronde', async ({ page }) => {
  await signIn(page, 'Sam');
  await eenProvincieEnStop(page);
  await eenHeleTafelronde(page);

  await page.goto('/#diagnose');
  await expect(tegel(page, 'Rondes')).toHaveText('2');
  await expect(tegel(page, 'Afgebroken')).toHaveText('50%');
});
