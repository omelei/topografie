import { expect, test, type Page } from '@playwright/test';
import { alsOnthouden } from './zaai';
import { langsDePoort, stubGezin } from './gezin';

/**
 * Je doelen voor deze week (ADR-162).
 *
 * "Waar je voor gaat" stond hier: één diploma, gekozen uit drie voorstellen,
 * dat maanden kon duren. Deze test loopt de boog die ervoor in de plaats kwam:
 * een doel zelf maken, het zien meelopen, het diploma halen en dat terugzien op
 * het uitslagscherm — en het geheel uit kunnen zetten zonder dat het terugkomt.
 */

async function signIn(page: Page, naam: string) {
  await page.goto('/');
  await page.getByPlaceholder('Je naam').fill(naam);
  await page.getByRole('button', { name: 'Beginnen' }).click();
  // De groep is een tweede stap, altijd over te slaan (ADR-151).
  await page.getByRole('button', { name: 'Zeg ik niet' }).click();
  await expect(page.getByRole('banner').getByRole('button', { name: naam })).toBeVisible();
}

/**
 * De ouderpagina openen: de wisselaar in de balk, de rij met het hangslot, en
 * een verse pincode (ADR-173).
 */
async function naarOuder(page: Page) {
  await stubGezin(page);
  await page
    .getByRole('banner')
    .getByRole('button', { name: /Wissel van profiel/ })
    .click();
  await page.getByRole('button', { name: 'Ouder' }).click();
  await langsDePoort(page);
  await page.getByLabel('Nieuwe pincode').fill('1234');
  await page.getByLabel('Nog een keer').fill('1234');
  await page.getByRole('button', { name: 'Bewaren', exact: true }).click();
  await expect(page).toHaveURL(/\/ouder$/);
}

const blokVan = (page: Page) => page.getByRole('region', { name: 'Je doelen voor deze week' });

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

test('een kind maakt een doel voor deze week en ziet het meelopen', async ({ page }) => {
  await signIn(page, 'Fien');

  const blok = blokVan(page);
  await expect(blok).toBeVisible();
  await expect(blok).toContainText('Nog geen doel. Waar ga jij deze week voor?');

  // De datums van de week staan erbij: "deze week" heeft een einde.
  await expect(blok).toContainText(/\d+ .*t\/m .*\d+ \w+/);

  await blok.getByRole('button', { name: 'Doel toevoegen' }).click();
  await blok.getByRole('button', { name: '2 rondes doen', exact: true }).click();

  // Het doel staat er, op nul, want er is nog niets gedaan.
  await expect(blok).toContainText('2 rondes doen');
  await expect(blok).toContainText('0 van de 2');

  // Eén ronde, en het doel loopt mee.
  await tafelVanEen(page, /Zelf typen/);
  await tienSommen(page);
  await page.goto('/');
  await expect(blok).toContainText('1 van de 2');
});

test('een doel blijft staan, is weg te halen, en drie is het maximum', async ({ page }) => {
  await signIn(page, 'Bram');
  const blok = blokVan(page);

  for (const knop of ['2 rondes doen', '3 rondes doen', '5 rondes doen']) {
    await blok.getByRole('button', { name: 'Doel toevoegen' }).click();
    await blok.getByRole('button', { name: knop, exact: true }).click();
  }

  // Vol: geen vierde erbij, en het blok zegt waarom.
  await expect(blok.getByRole('button', { name: 'Doel toevoegen' })).toHaveCount(0);
  await expect(blok).toContainText('Drie doelen is genoeg voor één week.');

  // En het staat er nog na een rondje door de app.
  await page.goto('/rekenen');
  await page.goto('/');
  await expect(blok).toContainText('3 rondes doen');

  await blok.getByRole('button', { name: 'Weghalen: 3 rondes doen' }).click();
  await expect(blok).not.toContainText('3 rondes doen');
  await expect(blok.getByRole('button', { name: 'Doel toevoegen' })).toBeVisible();
});

/**
 * Geen doelen hoeven is ook een antwoord, en dan wordt het niet elke maandag
 * opnieuw gevraagd. Aanzetten kan bij de instellingen van de ouder (ADR-173).
 */
test('doelen zijn uit te zetten, en komen dan niet terug op de voordeur', async ({ page }) => {
  await signIn(page, 'Sep');

  await blokVan(page).getByRole('button', { name: 'Ik wil geen doelen' }).click();
  await expect(blokVan(page)).toHaveCount(0);

  await page.reload();
  await expect(blokVan(page)).toHaveCount(0);

  // Bij de ouder staat de weg terug, als schakelaar bij de instellingen.
  await naarOuder(page);
  const schakelaar = page
    .getByRole('region', { name: 'Instellingen' })
    .getByRole('button', { name: /Doelen voor deze week/ });
  await expect(schakelaar).toHaveAttribute('aria-pressed', 'false');
  await schakelaar.click();
  await expect(schakelaar).toHaveAttribute('aria-pressed', 'true');

  await page.goto('/');
  await expect(blokVan(page)).toBeVisible();
});

test('een diploma als doel van de week, en het uitslagscherm zegt het', async ({ page }) => {
  await signIn(page, 'Tess');

  // Eerst de tafel van 1 kennen: dan staat hij bovenaan de voorstellen, want
  // het diploma dat het dichtst bij is gaat voor.
  await tafelVanEen(page, /Zelf typen/);
  await tienSommen(page);
  await alsOnthouden(page);

  await page.goto('/');
  const blok = blokVan(page);
  await blok.getByRole('button', { name: 'Doel toevoegen' }).click();
  await blok.getByRole('button', { name: 'Een diploma halen', exact: true }).click();
  // Elk diploma is te kiezen (ADR-168): de drie dichtstbijzijnde bovenaan, en
  // daaronder alles per vak. Wat bovenaan staat, staat er maar één keer.
  await expect(blok.getByRole('region', { name: 'Dichtbij' })).toBeVisible();
  await expect(blok.getByRole('region', { name: 'Topo' })).toBeVisible();
  // Met ". Premium" erachter: sinds ADR-192 is elk diploma premium, ook dit.
  await blok
    .getByRole('button', { name: 'Het diploma Tafel van 1 halen. Premium', exact: true })
    .click();

  await expect(blok).toContainText('Het diploma Tafel van 1 halen');
  await expect(blok).toContainText('0 van de 1');

  // Het diploma zelf wordt gehaald waar het altijd gehaald werd: op de muur
  // met de twaalf tafeldiploma's (ADR-075). Eén druk kiest de tafel én de
  // vorm; daarna is er nog één startknop.
  await page.goto('/rekenen');
  await page
    .getByRole('region', { name: /Kies een onderwerp/ })
    .getByRole('button', { name: /^Tafels/ })
    .click();
  await page
    .getByRole('region', { name: 'Jouw tafeldiploma’s' })
    .getByRole('button', { name: 'Tafel van 1: nog geen diploma' })
    .click();
  await page.locator('.tk-choose-start button').click();
  // Afzwemmen (ADR-149): de pagina is rijp, dus de vraag is of er iemand meekijkt.
  await expect(page.getByText('Klaar voor de toets', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Nee, ik begin' }).click();
  await tienSommen(page);

  // Op het moment zelf, naast het diploma.
  await expect(page.getByText('Daarmee is ook je weekdoel gehaald.')).toBeVisible();

  // En op de voordeur staat het doel op gehaald.
  await page.goto('/');
  await expect(blok).toContainText('Gehaald!');
});
