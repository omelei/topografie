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
    'Je beheerst iets als je het drie keer goed hebt, op drie verschillende dagen.',
  );
  await expect(geheugen).not.toContainText('Dan begin je daar opnieuw mee.');
  await geheugen.getByRole('button', { name: 'Hoe werkt herhalen?' }).click();
  await expect(geheugen).toContainText('Dan begin je daar opnieuw mee.');

  const vaak = page.getByRole('region', { name: 'Hoe vaak oefen je?' });
  await expect(vaak).toContainText('De laatste 7 dagen nog niet geoefend.');
  // Geen grafiek van acht lege staven voor wie nog niets deed.
  await expect(vaak.getByRole('list', { name: 'Vragen per week' })).toHaveCount(0);

  // De strook staat er wél, ook leeg (ADR-177): zeven hokjes met vandaag
  // aangewezen zijn de uitnodiging. Een zin dat er niets was, is dat niet.
  const strook = vaak.getByRole('list', { name: 'De laatste 7 dagen' });
  await expect(strook.getByRole('listitem')).toHaveCount(7);
  await expect(strook.getByRole('listitem').last()).toContainText('Dat is vandaag.');
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

  // "Dagen geoefend" was de vierde tegel en is de strook geworden (ADR-177):
  // een breuk is geen beeld. De noemer van ADR-133 staat in de zin eronder.
  const strook = page.getByRole('region', { name: vaak }).getByRole('list', {
    name: 'De laatste 7 dagen',
  });
  await expect(strook.getByRole('listitem').last()).toContainText('1 keer geoefend');
  await expect(page.getByRole('region', { name: vaak })).toContainText(
    'Je hebt op 1 van 5 schooldagen geoefend.',
  );

  const verloop = page.getByRole('region', { name: vaak });
  const weken = verloop.getByRole('list', { name: 'Vragen per week' }).getByRole('listitem');
  await expect(weken).toHaveCount(8);
  await expect(weken.last()).toContainText(/Deze week: [01] van de 1 vragen goed\./);
  await expect(verloop).toContainText('1 keer geoefend en 1 vragen beantwoord');
  await expect(page.getByRole('region', { name: 'Week na week' })).toHaveCount(0);

  // Per vak en Per onderwerp zijn de zoom binnen Je geheugen geworden
  // (ADR-177): één onderwerp, van ver naar dichtbij, dus één regio.
  const geheugen = page.getByRole('region', { name: 'Je geheugen' });
  await expect(page.getByRole('region', { name: 'Per vak' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Per onderwerp' })).toHaveCount(0);

  const topo = geheugen.getByRole('button', { name: /^Topo/ });
  await expect(topo).toContainText('1 geoefend');
  await expect(geheugen.getByRole('heading', { name: 'Welk vak?' })).toBeVisible();
  await expect(geheugen.getByRole('region', { name: 'Alles in één blik' })).toBeVisible();

  // Alles wat je onthoudt staat boven hoe vaak je oefent, en daartussen staat
  // geen andere kop meer.
  const koppen = await page.locator('.tk-page-main h2').allInnerTexts();
  const plek = (kop: string) => koppen.indexOf(kop);
  expect(plek('Je geheugen')).toBeLessThan(plek(vaak));

  // Een vak aanwijzen kiest het hieronder, en de keuze verspringt mee.
  await topo.click();
  await expect(topo).toHaveAttribute('aria-pressed', 'true');
  await expect(geheugen.getByRole('group', { name: 'Welk onderwerp?' })).toBeVisible();
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
  await expect(page.getByRole('heading', { name: 'Hoi Ties!' })).toBeVisible();

  // En de kolom naast de pagina zegt niet nog eens hoeveel er goed was.
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Goed beantwoord' })).toHaveCount(0);
});
