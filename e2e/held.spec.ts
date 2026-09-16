import { expect, test, type Page } from '@playwright/test';

/**
 * De held op de voordeur, en het maatje in een ronde (ADR-142).
 *
 * Er lagen zestig tekeningen in het product die een kind alleen op dertig
 * pixels in de balk te zien kreeg, en `setSticker` werd door niets anders dan
 * de kist aangeroepen — een kind kon dus nooit zeggen wie het wilde zijn. Deze
 * test kijkt naar precies die twee dingen: staat hij er, en is hij te kiezen.
 */

async function signIn(page: Page, naam: string) {
  await page.goto('/');
  await page.getByPlaceholder('Je naam').fill(naam);
  await page.getByRole('button', { name: 'Beginnen' }).click();
  await expect(page.getByRole('banner').getByRole('button', { name: naam })).toBeVisible();
}

test('de held staat groot op de voordeur en is te wisselen', async ({ page }) => {
  await signIn(page, 'Fien');

  const hoek = page.getByRole('region', { name: 'Jouw held' });
  await expect(hoek).toBeVisible();
  // Elk kind draagt er een vanaf het begin (ADR-067): de eerste van de twaalf.
  await expect(hoek).toContainText('Valerie Vos');

  // En er staat bij wat hij is en hoe je er meer krijgt (ADR-145): zonder die
  // regels stond er een dier naast je naam en verder niets.
  await expect(page.getByText('Valerie Vos is jouw held.')).toBeVisible();
  await expect(page.getByText('Speel rondes en verdien nieuwe helden.')).toBeVisible();
  await expect(page.getByText('Nog 50 goede antwoorden tot je kist.')).toBeVisible();

  await hoek.getByRole('button', { name: /Kies een andere held/ }).click();

  // De drie die een nieuw kind heeft, en niet de negen die het nog niet heeft.
  const keuzes = hoek.locator('.tk-heldhoek-kaart');
  await expect(keuzes).toHaveCount(3);

  await keuzes.filter({ hasText: 'Daan Das' }).click();
  await expect(hoek).toContainText('Daan Das');

  // En in de balk staat hij ook meteen: één keuze, twee plekken.
  await expect(page.getByRole('banner')).toContainText('Fien');
  await page.reload();
  await expect(hoek).toContainText('Daan Das');
});

test('het maatje komt in beeld zodra er nagekeken is', async ({ page }) => {
  await signIn(page, 'Sam');

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

  // Tijdens de vraag is er niets na te kijken, dus ook geen maatje.
  await expect(page.locator('.tk-maatje')).toHaveCount(0);

  const som = await page.locator('.tk-sum').innerText();
  await page.getByPlaceholder('Antwoord').fill((som.split('×')[1] ?? '').trim());
  await page.getByRole('button', { name: 'Kijk na' }).click();

  const maatje = page.locator('.tk-maatje');
  await expect(maatje).toBeVisible();
  // Goed veert; dat staat als een haakje op het element, zodat de stijl het
  // verschil kan maken zonder dat er een tweede component voor nodig is.
  await expect(maatje).toHaveAttribute('data-goed', '');
});
