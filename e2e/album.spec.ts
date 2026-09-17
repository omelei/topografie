import { expect, test, type Page } from '@playwright/test';

/**
 * Het album en de weekkaart (ADR-149).
 *
 * Wat hier vastligt is de boog van één dag: de pagina van wat je kiest staat
 * op de modulepagina, een ronde laat zien wat ze aan die pagina deed, de dag
 * krijgt een stempel op de weekkaart, en het weekdoel kies je op de weekkaart
 * of samen met een ouder op Voor ouders — en het is hetzelfde doel.
 */

async function signIn(page: Page, naam: string) {
  await page.goto('/');
  await page.getByPlaceholder('Je naam').fill(naam);
  await page.getByRole('button', { name: 'Beginnen' }).click();
  await expect(page.getByRole('banner').getByRole('button', { name: naam })).toBeVisible();
}

async function kiesProvincies(page: Page) {
  await page.goto('/topografie');
  await page
    .getByRole('region', { name: /Kies een onderwerp/ })
    .getByRole('button', { name: /^Provincies/ })
    .click();
}

test('de modulepagina toont de albumpagina van wat gekozen is', async ({ page }) => {
  await signIn(page, 'Jet');
  await kiesProvincies(page);

  const album = page.getByRole('region', { name: 'Jouw albumpagina' });
  await expect(album).toBeVisible();
  // Nog niets geoefend: twaalf plekken, geen enkele in kleur, en de plaatjes
  // ook als lijst, voor wie de kaart niet ziet.
  await expect(album).toContainText('0 van de 12 in kleur');
  await expect(album.getByText('Alle plaatjes van deze pagina')).toBeVisible();
});

test('een ronde laat de pagina zien, en de dag krijgt een stempel', async ({ page }) => {
  await signIn(page, 'Pim');
  await kiesProvincies(page);
  await page
    .getByRole('region', { name: /Hoe wil je/ })
    .getByRole('button', { name: /Aanwijzen/ })
    .click();
  await page.locator('.tk-choose-start button').click();

  await page.getByRole('button', { name: 'Limburg' }).click();
  await expect(page.getByRole('button', { name: 'Volgende vraag' })).toBeVisible();
  await page.getByRole('button', { name: 'Stoppen' }).click();

  // Ronde klaar opent met de pagina, en zegt in woorden wat er gebeurde.
  await expect(page.getByRole('heading', { name: 'Ronde klaar' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Jouw albumpagina' })).toBeVisible();
  await expect(page.getByText('1 vraag, ', { exact: false })).toBeVisible();
  // Na één vraag gestopt is geen "klaar voor vandaag".
  await expect(page.getByRole('button', { name: 'Terug naar start' })).toBeVisible();

  // De weekkaart telt de dag, ook voor een ronde die halverwege stopte.
  await page.goto('/week');
  await expect(page.getByRole('heading', { name: 'Jouw week' })).toBeVisible();
  await expect(page.getByRole('list', { name: 'Je weekkaart' })).toContainText('Vandaag: stempel');
  await expect(page.getByText('1 van de 3 dagen.')).toBeVisible();
  await expect(page.getByText(/op rij/i)).toHaveCount(0);
});

test('het weekdoel is één doel, op de weekkaart en bij de ouder', async ({ page }) => {
  await signIn(page, 'Roos');

  await page.goto('/week');
  const doel = page.getByRole('group', { name: 'Je weekdoel' });
  await expect(doel.getByRole('button', { name: '3 dagen' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await doel.getByRole('button', { name: '4 dagen' }).click();
  await expect(doel.getByRole('button', { name: '4 dagen' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await page.goto('/ouder');
  const bijOuder = page.getByRole('group', { name: 'Je weekdoel' });
  await expect(bijOuder.getByRole('button', { name: '4 dagen' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});
