import { expect, test, type Page } from '@playwright/test';
import { alsOnthouden } from './zaai';

/**
 * The klokdiploma and the topodiploma (ADR-117): a wall on the module page
 * with the gaps showing, one press to sit one, nothing said until the end, and
 * the same wall on the child's own page.
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
 * Een gewone ronde over de Waddeneilanden, aanwijzen, alles fout. Het gaat om
 * de rijen in `progress`: `alsOnthouden` zet er de doos van, en verzint niets
 * bij wat nooit geoefend is.
 */
async function wijsDeEilandenAan(page: Page) {
  await page.goto('/topografie');
  await page
    .getByRole('region', { name: /Kies een onderwerp/ })
    .getByRole('button', { name: /^Waddeneilanden/ })
    .click();
  await page
    .getByRole('region', { name: /Hoe wil je/ })
    .getByRole('button', { name: /Aanwijzen/ })
    .click();
  await page.locator('.tk-choose-start button').click();

  const klaar = page.getByRole('heading', { name: 'Ronde klaar' });
  const weetNiet = page.getByRole('button', { name: 'Ik weet het niet' });
  const volgende = page.getByRole('button', { name: 'Volgende vraag' });
  for (let vraag = 0; vraag < 20; vraag++) {
    await expect(klaar.or(weetNiet).or(volgende).first()).toBeVisible();
    if (await klaar.isVisible()) return;
    if (await volgende.isVisible()) await volgende.click();
    else await weetNiet.click();
  }
  throw new Error('De ronde over de Waddeneilanden hield niet op.');
}

test('four klokdiploma’s, and one press chooses a step and the diploma', async ({ page }) => {
  await signIn(page, 'Jip');
  await page.goto('/klokkijken');

  const muur = page.getByRole('region', { name: 'Jouw klokdiploma’s' });
  await expect(muur.getByRole('button')).toHaveCount(4);
  await muur.getByRole('button', { name: 'Kwartieren: nog geen klokdiploma' }).click();

  const wat = page.getByRole('region', { name: /Kies een onderwerp/ });
  await expect(wat.getByRole('button', { name: /^Kwartieren/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  const hoe = page.getByRole('region', { name: /Hoe wil je/ });
  await expect(hoe.getByRole('button', { name: /^Klokdiploma/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  // A diploma is its own length.
  await expect(page.getByRole('region', { name: 'Hoeveel vragen?' })).toHaveCount(0);
});

test('a topodiploma is sat on one map, says nothing until the end, and hangs on Jij', async ({
  page,
}) => {
  await signIn(page, 'Isa');
  await page.goto('/topografie');

  const muur = page.getByRole('region', { name: 'Jouw topodiploma’s' });
  // Twaalf sinds ADR-168: de wereldkaart hoort er ook bij.
  await expect(muur.getByRole('button')).toHaveCount(12);
  await muur.getByRole('button', { name: 'Waddeneilanden: nog geen topodiploma' }).click();

  const hoe = page.getByRole('region', { name: /Hoe wil je/ });
  await expect(hoe.getByRole('button', { name: /^Topodiploma/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.locator('.tk-choose-start button').click();

  // Afzwemmen first (ADR-149): what it asks, and that a page nobody practised
  // is not ripe. Er is dan precies één knop, en die gaat terug naar oefenen —
  // de toets afleggen terwijl er geen diploma uit kan komen, kan niet meer.
  await expect(page.getByRole('heading', { name: /^Afzwemmen: / })).toBeVisible();
  await expect(page.getByText('Nog niet klaar om af te zwemmen')).toBeVisible();
  const knoppen = page.locator('.tk-uitslag-knoppen').getByRole('button');
  await expect(knoppen).toHaveCount(1);
  await expect(knoppen).toHaveText('Eerst oefenen');
  await knoppen.click();
  await expect(page.locator('.tk-choose-start button')).toBeVisible();

  // Dus eerst de eilanden leren, en dan pas afzwemmen. De doosstand zetten
  // scheelt de vier rondes over een week die het echt zou kosten.
  await wijsDeEilandenAan(page);
  await alsOnthouden(page);
  await page.goto('/topografie');
  await muur.getByRole('button', { name: 'Waddeneilanden: nog geen topodiploma' }).click();
  await page.locator('.tk-choose-start button').click();
  await expect(page.getByText('Klaar om af te zwemmen', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Nee, ik begin' }).click();

  // Five islands, and "ik weet het niet" to each: no answer is shown between.
  const klaar = page.getByRole('heading', { name: 'Ronde klaar' });
  const weetNiet = page.getByRole('button', { name: 'Ik weet het niet' });
  for (let vraag = 0; vraag < 10; vraag++) {
    await expect(klaar.or(weetNiet).first()).toBeVisible();
    if (await klaar.isVisible()) break;
    await expect(page.getByRole('button', { name: 'Volgende vraag' })).toHaveCount(0);
    await weetNiet.click();
  }

  await expect(
    page.getByText('Nog geen diploma: 0 van de 5 goed. Met 5 goed is hij van jou.'),
  ).toBeVisible();
  await expect(page.getByText('Cijfer', { exact: true })).toBeVisible();

  // En in de kast op Jij, waar alle diploma's staan die dit kind kan halen. Eén
  // vak open en de rest als regel: het bezwaar van ADR-158 ging over stapelen,
  // niet over een onverdiend vakje.
  await page.goto('/jij');
  const kast = page.getByRole('region', { name: 'Jouw diploma’s' });
  await expect(kast).toBeVisible();
  // Nog niets gehaald: dan staat er de uitnodiging en nergens een nul.
  await expect(
    kast.getByText('Hier komen je diploma’s te hangen.', { exact: false }),
  ).toBeVisible();

  // Het vak van de laatste ronde staat open, de andere drie als regel.
  // Twaalf sinds ADR-168: de wereldkaart hoort er ook bij.
  await expect(kast.getByRole('region', { name: 'Topo' }).getByRole('button')).toHaveCount(12);
  await kast.getByRole('button', { name: /^Klok / }).click();
  await expect(kast.getByRole('region', { name: 'Klok' }).getByRole('button')).toHaveCount(4);
});

test('elke kaart in de kast opent het diploma groot, gehaald of niet', async ({ page }) => {
  await signIn(page, 'Fenna');
  await page.goto('/jij');

  // Zonder gespeelde ronde staat tafels open: het enige vak dat zonder code
  // diploma's heeft (ADR-122).
  const kast = page.getByRole('region', { name: 'Jouw diploma’s' });
  await expect(kast.getByRole('region', { name: 'Rekenen' })).toBeVisible();
  await kast.getByRole('button', { name: /^Bekijk je diploma: Tafel van 1$/ }).click();

  // Eén regel: elke kaart opent dit. En één knop, die van woord verandert —
  // niets onthouden, dus oefenen.
  const venster = page.getByRole('dialog');
  await expect(venster).toBeVisible();
  await expect(venster.getByText('Tafeldiploma')).toBeVisible();
  await expect(venster.getByText('Nog niets onthouden.', { exact: false })).toBeVisible();
  await expect(venster.getByRole('button', { name: 'Ga oefenen' })).toBeVisible();

  // Escape sluit, en dan staat de kast er weer.
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(kast).toBeVisible();
});
