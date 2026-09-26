import { expect, test, type Page } from '@playwright/test';
import { signIn } from './naam';

/**
 * De ronde kondigt zichzelf aan (ADR-140).
 *
 * Aan het eind: "Laatste vraag", zodat het slot iets is dat komt in plaats van
 * iets dat gebeurt. Aan het begin: hoeveel van de vragen dit kind eerder gehad
 * heeft — de zin waarmee dit product zijn eigen methode uitlegt, op het moment
 * dat die methode op een fout lijkt.
 */

async function kiesTafelVanEen(page: Page) {
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
}

/** Eén som goed beantwoorden en doorgaan. */
async function antwoord(page: Page) {
  const som = await page.locator('.tk-sum').innerText();
  await page.getByPlaceholder('Antwoord').fill((som.split('×')[1] ?? '').trim());
  await page.getByRole('button', { name: 'Kijk na' }).click();
}

test('de laatste vraag wordt aangekondigd, en niet eerder', async ({ page }) => {
  await signIn(page, 'Noor');
  await kiesTafelVanEen(page);
  await page.locator('.tk-choose-start button').click();

  const laatste = page.locator('.tk-round-laatste');
  await expect(page.getByPlaceholder('Antwoord')).toBeVisible();
  await expect(laatste).toHaveCount(0);

  // Negen keer door, dan staat de tiende klaar.
  for (let vraag = 1; vraag <= 9; vraag++) {
    await antwoord(page);
    await page.getByRole('button', { name: 'Volgende vraag' }).click();
  }

  await expect(laatste).toBeVisible();
  await expect(laatste).toHaveText('Laatste vraag');
});

/**
 * De zin die het product zijn eigen methode laat uitleggen. Hij staat er pas
 * als er iets eerder gehad ís: "nul eerder gehad" legt niets uit.
 */
test('voor de ronde staat er hoeveel je er eerder gehad hebt', async ({ page }) => {
  await signIn(page, 'Sam');

  // De eerste keer is alles nieuw, dus er valt niets uit te leggen.
  await kiesTafelVanEen(page);
  await expect(page.getByText(/eerder gehad/)).toHaveCount(0);

  // Een ronde spelen, en dan is het de tweede keer.
  await page.locator('.tk-choose-start button').click();
  for (let vraag = 1; vraag <= 10; vraag++) {
    await antwoord(page);
    const volgende = page.getByRole('button', { name: 'Volgende vraag' });
    const klaar = page.getByRole('heading', { name: 'Ronde klaar' });
    await expect(volgende.or(klaar).first()).toBeVisible();
    if (await klaar.isVisible()) break;
    await volgende.click();
  }

  await kiesTafelVanEen(page);
  await expect(
    page.getByText(/heb je al eerder gehad. Zo blijft het in je hoofd./).first(),
  ).toBeVisible();
});
