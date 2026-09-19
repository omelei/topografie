import { expect, test, type Page } from '@playwright/test';

/**
 * Onthouden als de pagina met de getallen (ADR-148).
 *
 * Wat deze test vastlegt is de samenhang: de pagina opent op wat je onthoudt
 * en op deze week, met premium per vak en week na week, en de getallen die
 * hiervoor op Voor ouders en op de reekspagina stonden, staan daar niet meer.
 * Premium staat aan via de `storageState` van playwright.config.
 */

async function signIn(page: Page, naam: string) {
  await page.goto('/');
  await page.getByPlaceholder('Je naam').fill(naam);
  await page.getByRole('button', { name: 'Beginnen' }).click();
  // De groep is een tweede stap, altijd over te slaan (ADR-151).
  await page.getByRole('button', { name: 'Zeg ik niet' }).click();
  await expect(page.getByRole('banner').getByRole('button', { name: naam })).toBeVisible();
}

/** De provincies, aangewezen: één vraag beantwoord, en dan gestopt. */
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

function tegel(page: Page, regio: string, label: string) {
  return page
    .getByRole('region', { name: regio })
    .locator('.tk-cijfer')
    .filter({ has: page.getByText(label, { exact: true }) })
    .locator('.tk-cijfer-getal');
}

test('Onthouden opent op je geheugen, en zegt het eerlijk als er nog niets is', async ({
  page,
}) => {
  await signIn(page, 'Mila');
  await page.goto('/onthouden');

  await expect(page.getByRole('region', { name: 'Je geheugen' })).toContainText(
    'Je hebt nog niets geoefend',
  );
  await expect(page.getByRole('region', { name: 'Deze week' })).toContainText(
    'Deze week nog niet geoefend.',
  );
});

test('na één ronde staan het geheugen, deze week, per vak en week na week er', async ({ page }) => {
  await signIn(page, 'Jip');
  await eenProvincieEnStop(page);
  await page.goto('/onthouden');

  await expect(page.getByRole('region', { name: 'Je geheugen' })).toContainText(
    'van de 1 die je geoefend hebt',
  );
  await expect(tegel(page, 'Deze week', 'Rondes')).toHaveText('1');
  await expect(tegel(page, 'Deze week', 'Vragen beantwoord')).toHaveText('1');

  const vakken = page.getByRole('region', { name: 'Per vak' });
  await expect(vakken.getByRole('button', { name: /^Topo/ })).toContainText('1 geoefend');

  const verloop = page.getByRole('region', { name: 'Week na week' });
  await expect(tegel(page, 'Week na week', 'Vragen in totaal')).toHaveText('1');
  const weken = verloop.getByRole('list', { name: 'Vragen per week' }).getByRole('listitem');
  await expect(weken).toHaveCount(8);
  await expect(weken.last()).toContainText(/Deze week: [01] van de 1 vragen goed\./);

  // Een vak aanwijzen kiest het hieronder.
  await vakken.getByRole('button', { name: /^Topo/ }).click();
  await expect(page.getByRole('heading', { name: 'Per onderwerp' })).toBeFocused();
  await expect(
    page.getByRole('group', { name: 'Welk vak?' }).getByRole('button', { name: /Topo/ }),
  ).toHaveAttribute('aria-pressed', 'true');
});

test('de getallen over het oefenen staan alleen op Onthouden', async ({ page }) => {
  await signIn(page, 'Ties');
  await eenProvincieEnStop(page);

  await page.goto('/ouder');
  await expect(page.getByRole('heading', { name: 'Voor ouders' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Deze week' })).toHaveCount(0);

  // De weekkaart is met het album vervallen (ADR-158), dus haar adres en dat
  // van de oude reeks komen op de voordeur uit in plaats van op een leeg
  // scherm.
  await page.goto('/reeks');
  await expect(page.getByRole('heading', { name: 'Welkom Ties!' })).toBeVisible();

  // En de kolom naast de pagina zegt niet nog eens hoeveel er goed was.
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Goed beantwoord' })).toHaveCount(0);
});
