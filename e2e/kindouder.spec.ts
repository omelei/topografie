import { expect, test, type Page } from '@playwright/test';

/**
 * De grens tussen kind en ouder, door het hele product (ADR-143).
 *
 * ADR-136 trok die grens op één pagina. Deze test kijkt naar de plekken waar
 * hij daarna nog scheef lag: een prijzenkast die drieënveertig lege vakjes
 * toonde, een tabel met percentages in het menu van het kind, en een ouderkolom
 * die de ouder aansprak alsof hij het kind was. Sinds ADR-158 staat de kast bij
 * de ouder en houdt het kind alleen wat het gehaald heeft.
 */

async function signIn(page: Page, naam: string) {
  await page.goto('/');
  await page.getByPlaceholder('Je naam').fill(naam);
  await page.getByRole('button', { name: 'Beginnen' }).click();
  // De groep is een tweede stap, altijd over te slaan (ADR-151).
  await page.getByRole('button', { name: 'Zeg ik niet' }).click();
  await expect(page.getByRole('banner').getByRole('button', { name: naam })).toBeVisible();
}

test('Jij zwijgt over diploma’s tot er een gehaald is', async ({ page }) => {
  await signIn(page, 'Fien');
  await page.goto('/jij');

  // Geen vakjes, en ook geen koppen: vier lege wanden zouden een kind op dag
  // één vertellen dat het niets heeft (ADR-158).
  await expect(page.locator('.tk-diploma')).toHaveCount(0);
  await expect(page.getByText('0 van de 12 gehaald')).toHaveCount(0);
});

test('Voor ouders toont eerst wat gehaald is, en de gaten pas als je erom vraagt', async ({
  page,
}) => {
  await signIn(page, 'Fien');
  await page.goto('/ouder');

  // De koppen met hun stand staan er altijd; de vakjes niet. Hier zijn de gaten
  // wél iets om iets mee te doen (ADR-064).
  // Per wand, want sinds ADR-168 zijn er twee van twaalf: de tafels en de
  // kaarten.
  await expect(
    page.getByRole('region', { name: 'Jouw tafeldiploma’s' }).getByText('0 van de 12 gehaald'),
  ).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Jouw topodiploma’s' }).getByText('0 van de 12 gehaald'),
  ).toBeVisible();
  await expect(page.locator('.tk-diploma')).toHaveCount(0);

  await page.getByRole('button', { name: 'Laat zien wat er nog te halen is' }).click();

  // Twaalf tafels, zeven vlaggensets, vier klokstappen en twaalf kaarten
  // (ADR-168). De rekendiploma's en de taaldiploma's staan op hun eigen
  // modulepagina en niet in deze vier wanden.
  await expect(page.locator('.tk-diploma')).toHaveCount(35);

  await page.getByRole('button', { name: 'Laat alleen zien wat gehaald is' }).click();
  await expect(page.locator('.tk-diploma')).toHaveCount(0);
});

test('Jij toont de toren en het schooljaar van dit kind', async ({ page }) => {
  await signIn(page, 'Bram');
  await page.goto('/jij');
  await expect(page.getByRole('region', { name: 'Je toren' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Jouw schooljaar' })).toBeVisible();
  // Geen held meer, en geen badges (ADR-149).
  await expect(page.getByRole('region', { name: 'Jouw held' })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Jouw badges' })).toHaveCount(0);
});

test('de tabel op Onthouden staat achter een knop', async ({ page }) => {
  await signIn(page, 'Tess');
  await page.goto('/onthouden');

  // Het beeld staat er meteen; de tabel met percentages en de voorspelling niet.
  await expect(page.getByRole('heading', { name: 'Alles in één blik' })).toBeVisible();
  await expect(page.getByRole('table')).toHaveCount(0);

  await page.getByRole('button', { name: 'Laat de tabel zien' }).click();
  await expect(page.getByRole('table')).toBeVisible();
});

test('Voor ouders spreekt de ouder aan, niet het kind', async ({ page }) => {
  await signIn(page, 'Noor');
  await page.goto('/ouder');

  // Het cijfer van het kind hoort op de pagina's van het kind en staat hier dus
  // niet. Hoe de toren eruitziet wel: dat stelt een ouder in (ADR-158).
  await expect(page.getByRole('region', { name: 'Jouw week' })).toHaveCount(0);
  await expect(page.getByRole('group', { name: 'Hoe de toren eruitziet' })).toBeVisible();

  // Er staat helemaal geen kolom meer naast een pagina, hier niet en nergens
  // (ADR-162, ADR-168).
  await expect(page.locator('.tk-home-aside')).toHaveCount(0);

  // De doelen van deze week staan hier wél: een ouder mag er een bij zetten,
  // en hij is degene die ze uit kan zetten (ADR-162).
  await expect(page.getByRole('region', { name: 'Doelen van Noor voor deze week' })).toBeVisible();

  // En er is een weg naar het detail, dat hiervoor alleen in het menu van het
  // kind stond.
  await page.getByRole('button', { name: /Bekijk wat je kind onthoudt/ }).click();
  await expect(page.getByRole('heading', { name: 'Wat je onthoudt' })).toBeVisible();
});
