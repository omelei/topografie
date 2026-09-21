import { expect, test, type Page } from '@playwright/test';

/**
 * De getallen over het oefenen, op Jij (ADR-148, ADR-171, ADR-172).
 *
 * Wat deze test vastlegt is de samenhang: wat je onthoudt, hoe vaak je oefent
 * — deze week, en met premium de weken ervoor — en per vak, en die getallen
 * staan op één plek. Dat was de pagina Onthouden; sinds ADR-171 is die een
 * deel van Jij, en het oude adres komt daar uit. Premium staat aan via de
 * `storageState` van playwright.config.
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

test('Jij toont je geheugen, en zegt het eerlijk als er nog niets is', async ({ page }) => {
  await signIn(page, 'Mila');
  await page.goto('/jij');

  const geheugen = page.getByRole('region', { name: 'Je geheugen' });
  await expect(geheugen).toContainText('Je hebt nog niets geoefend');
  // Wat onthouden is, staat open boven de ring; de rest van de regels één druk
  // verder (ADR-172).
  await expect(geheugen).toContainText(
    'Je onthoudt iets als je het drie keer goed hebt, op drie verschillende dagen.',
  );
  await expect(geheugen).not.toContainText('Dan begin je daar weer opnieuw mee.');
  await geheugen.getByRole('button', { name: 'Hoe werkt onthouden?' }).click();
  await expect(geheugen).toContainText('Dan begin je daar weer opnieuw mee.');

  const vaak = page.getByRole('region', { name: 'Hoe vaak oefen je?' });
  await expect(vaak).toContainText('Deze week nog niet geoefend.');
  // Geen grafiek van acht lege staven voor wie nog niets deed.
  await expect(vaak.getByRole('list', { name: 'Vragen per week' })).toHaveCount(0);
});

test('na één ronde staan het geheugen, hoe vaak je oefent en per vak er', async ({ page }) => {
  await signIn(page, 'Jip');
  await eenProvincieEnStop(page);
  await page.goto('/jij');

  await expect(page.getByRole('region', { name: 'Je geheugen' })).toContainText(
    'van de 1 die je geoefend hebt',
  );

  // Deze week en de weken ervoor zijn één blok, met één rij tegels (ADR-172).
  const vaak = 'Hoe vaak oefen je?';
  await expect(tegel(page, vaak, 'Rondes')).toHaveText('1');
  await expect(tegel(page, vaak, 'Vragen beantwoord')).toHaveText('1');
  // Tegen schooldagen: zeven dagen op rij zijn er altijd vijf.
  await expect(tegel(page, vaak, 'Dagen geoefend')).toHaveText('1 van 5');

  const verloop = page.getByRole('region', { name: vaak });
  const weken = verloop.getByRole('list', { name: 'Vragen per week' }).getByRole('listitem');
  await expect(weken).toHaveCount(8);
  await expect(weken.last()).toContainText(/Deze week: [01] van de 1 vragen goed\./);
  await expect(verloop).toContainText('1 keer geoefend en 1 vragen beantwoord');
  await expect(page.getByRole('region', { name: 'Week na week' })).toHaveCount(0);

  const vakken = page.getByRole('region', { name: 'Per vak' });
  await expect(vakken.getByRole('button', { name: /^Topo/ })).toContainText('1 geoefend');

  // Eerst de twee samenvattingen, dan de zoom: per vak, dan per onderwerp.
  const koppen = await page.locator('.tk-page-main h2').allInnerTexts();
  const plek = (kop: string) => koppen.indexOf(kop);
  expect(plek('Je geheugen')).toBeLessThan(plek(vaak));
  expect(plek(vaak)).toBeLessThan(plek('Per vak'));
  expect(plek('Per vak')).toBeLessThan(plek('Per onderwerp'));

  // Een vak aanwijzen kiest het hieronder.
  await vakken.getByRole('button', { name: /^Topo/ }).click();
  await expect(page.getByRole('heading', { name: 'Per onderwerp' })).toBeFocused();
  await expect(
    page.getByRole('group', { name: 'Welk vak?' }).getByRole('button', { name: /Topo/ }),
  ).toHaveAttribute('aria-pressed', 'true');
});

test('de getallen over het oefenen staan alleen op Jij', async ({ page }) => {
  await signIn(page, 'Ties');
  await eenProvincieEnStop(page);

  // Niet op Premium, waar het adres van Voor ouders nu uitkomt (ADR-171).
  await page.goto('/premium');
  await expect(page.getByRole('heading', { level: 1, name: 'Premium' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Hoe vaak oefen je?' })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Je geheugen' })).toHaveCount(0);

  // De weekkaart is met het album vervallen (ADR-158), dus haar adres en dat
  // van de oude reeks komen op de voordeur uit in plaats van op een leeg
  // scherm.
  await page.goto('/reeks');
  await expect(page.getByRole('heading', { name: 'Welkom Ties!' })).toBeVisible();

  // En de kolom naast de pagina zegt niet nog eens hoeveel er goed was.
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Goed beantwoord' })).toHaveCount(0);
});
