import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Accessibility, checked on the screens Lighthouse cannot reach.
 *
 * Lighthouse loads one URL and scores it. This product's hardest screen is
 * three clicks in and is a picture — a map where every province is a control —
 * so the screen most likely to fail is the one an automated first-load audit
 * never sees. These run axe on each screen in turn instead.
 *
 * Automated checks catch perhaps a third of what matters. They are here to stop
 * regressions, not to certify: a keyboard pass on a real device is still the
 * thing that finds the rest, and spec section 8 asks for that too.
 */

async function scan(page: Page) {
  return new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
}

async function signIn(page: Page, naam: string) {
  await page.goto('/');
  await page.getByPlaceholder('Je naam').fill(naam);
  await page.getByRole('button', { name: 'Beginnen' }).click();

  // The name is in the app bar now, beside the streak — K1 puts the profile
  // switch top right, so that is where "you are signed in" is visible.
  await expect(page.getByRole('banner').getByRole('button', { name: naam })).toBeVisible();
}

/** The three topography sets these scans use, as the path through step 1. */
const PROVINCIES: Keuze = [/^Provincies/];
const HOOFDSTEDEN: Keuze = [/^Steden/, /^Hoofdsteden van de provincies$/];
const STEDEN: Keuze = [/^Steden/, /^Steden van Nederland$/];

/**
 * Step 1 of K2, which is two decisions where a subject holds more than one set.
 *
 * Topography's subjects are one word each now, and where on the map is asked
 * above them (ADR-083): "Provincies" rather than "Provincies van Nederland",
 * and the twelve capitals and the eighty cities are two chips under one card
 * called "Steden". So the path to a set is a card, and sometimes a chip after
 * it — which is exactly the path a child takes.
 */
type Keuze = readonly [RegExp] | readonly [RegExp, RegExp];

async function kiesOnderwerp(page: Page, [vak, chip]: Keuze) {
  const what = page.getByRole('region', { name: /Kies een onderwerp/ });

  // First rather than exact: after the card is pressed its chips are in the
  // same region, and a chip's accessible name is the set's full name.
  await what.getByRole('button', { name: vak }).first().click();
  // The chips are a numbered step of their own now, not a caption inside step
  // 1, so they are no longer in that region. The chip patterns are anchored at
  // both ends, which is what keeps them off the start button — that one names
  // the set too, inside a longer sentence.
  if (chip) await page.getByRole('button', { name: chip }).click();
}

/**
 * Into a round, through K2.
 *
 * The front door no longer carries a card per set: choosing which set is step 1
 * of K2, so a test that wants a particular set goes where a child goes.
 */
async function startRound(page: Page, set: Keuze, way: RegExp) {
  await page.goto('/topografie');
  await expect(page.getByRole('heading', { name: /^Wat wil je oefenen,/ })).toBeVisible();

  await kiesOnderwerp(page, set);
  await page
    .getByRole('region', { name: /Hoe wil je/ })
    .getByRole('button', { name: way })
    .click();
  // The wrapper rather than the label: the label is the combination in words
  // and its measure comes from the round, so matching on "vragen" was quietly
  // asserting which modes exist — and one of the mode cards ends in it too.
  await page.locator('.tk-choose-start button').click();
}

test('the name screen has no violations', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Wie ben jij?' })).toBeVisible();

  const results = await scan(page);
  expect(results.violations).toEqual([]);
});

test('the home screen has no violations', async ({ page }) => {
  await signIn(page, 'Iris');

  const results = await scan(page);
  expect(results.violations).toEqual([]);
});

/**
 * The three shapes a page inside the shell takes: a module whose subjects are
 * one set each, a module whose subjects hold thirteen sets behind a row of
 * chips, a module with neither a region row nor chips, and a module that does
 * not exist yet. All three carry the same frame
 * and the child's own column, and the last one is the easiest to get wrong
 * precisely because nobody looks at it.
 */
test('the module pages have no violations, in each of their four shapes', async ({ page }) => {
  await signIn(page, 'Nour');

  await page.goto('/topografie');
  await expect(page.getByRole('heading', { name: /^Wat wil je oefenen,/ })).toBeVisible();
  expect((await scan(page)).violations).toEqual([]);

  await page.goto('/rekenen');
  // The keypad, which is step 1's second question and the one control on the
  // page whose visible label is deliberately shorter than its meaning: "12" is
  // what the eye gets and "Tafel van 12" is what a screen reader gets. Nothing
  // is pressed when the page opens, so it waits for Tafels.
  await page
    .getByRole('region', { name: /Kies een onderwerp/ })
    .getByRole('button', { name: /^Tafels/ })
    .click();
  await expect(page.getByRole('button', { name: 'Tafel van 12', exact: true })).toBeVisible();
  expect((await scan(page)).violations).toEqual([]);

  await page.goto('/klokkijken');
  // The clock's step 1: four subjects and a mix, one set each — the shape
  // topografie's Nederland row has, with no chips underneath.
  // The tile, whose name is "Halve uren. …" — not the klokdiploma under it,
  // whose name starts "Halve uren: …" (ADR-117).
  await expect(page.getByRole('button', { name: /^Halve uren\./ })).toBeVisible();
  expect((await scan(page)).violations).toEqual([]);

  // The page of a module not built yet. Taal was this example until it was
  // built (ADR-118).
  await page.goto('/tijdvakken');
  await expect(page.getByRole('heading', { name: 'Tijdvakken' })).toBeVisible();
  expect((await scan(page)).violations).toEqual([]);
});

/**
 * Jij: ten badges and eighteen diplomas, most of them not earned yet (ADR-112).
 * It is where the temptation to say "not yet" with a colour alone is
 * strongest, so it is worth a scan of its own — and so is Onthouden, which is
 * a table and a wall of dots.
 */
test('the Jij page and the Onthouden page have no violations', async ({ page }) => {
  await signIn(page, 'Lieve');

  await page.goto('/jij');
  await expect(page.getByRole('region', { name: 'Jouw badges' })).toBeVisible();
  expect((await scan(page)).violations).toEqual([]);

  await page.goto('/onthouden');
  await expect(page.getByRole('heading', { name: 'Wat je onthoudt' })).toBeVisible();
  expect((await scan(page)).violations).toEqual([]);
});

test('the map has no violations while asking, and none while showing the answer', async ({
  page,
}) => {
  await signIn(page, 'Bram');
  await startRound(page, PROVINCIES, /Aanwijzen/);
  await expect(page.getByRole('button', { name: 'Limburg' })).toBeVisible();

  expect((await scan(page)).violations).toEqual([]);

  // The revealed state is a different screen in every way that matters: colours
  // change, focus moves, and a panel appears.
  await page.getByRole('button', { name: 'Limburg' }).click();
  await expect(page.getByRole('button', { name: 'Volgende vraag' })).toBeVisible();

  expect((await scan(page)).violations).toEqual([]);
});

test('the typing mode has no violations', async ({ page }) => {
  await signIn(page, 'Sem');
  await startRound(page, PROVINCIES, /Zelf typen/);
  await expect(page.getByPlaceholder('Naam')).toBeVisible();

  expect((await scan(page)).violations).toEqual([]);
});

test('the capitals map has no violations', async ({ page }) => {
  await signIn(page, 'Lotte');
  await startRound(page, HOOFDSTEDEN, /Aanwijzen/);
  await expect(page.getByRole('button', { name: 'Maastricht' })).toBeVisible();

  expect((await scan(page)).violations).toEqual([]);
});

test('the result screen has no violations', async ({ page }) => {
  await signIn(page, 'Yara');
  await startRound(page, PROVINCIES, /Aanwijzen/);
  await page.getByRole('button', { name: 'Stoppen' }).click();
  await expect(page.getByRole('button', { name: 'Terug naar start' })).toBeVisible();

  expect((await scan(page)).violations).toEqual([]);
});

/**
 * Not an axe check: axe cannot tell whether a keyboard can actually get
 * anywhere. This walks the map the way a child without a mouse would.
 */
test('a keyboard reaches the map and can answer with it', async ({ page }) => {
  await signIn(page, 'Kees');
  await startRound(page, PROVINCIES, /Aanwijzen/);
  await expect(page.getByRole('button', { name: 'Limburg' })).toBeVisible();

  // Tab from the top of the page until a province takes focus, and give up
  // rather than loop forever if the map turns out to be unreachable.
  let reached: string | null = null;
  for (let i = 0; i < 30 && reached === null; i++) {
    await page.keyboard.press('Tab');
    reached = await page.evaluate(() => {
      const active = document.activeElement;
      return active?.tagName.toLowerCase() === 'path' ? active.getAttribute('aria-label') : null;
    });
  }

  expect(reached, 'no province could be reached with the keyboard').not.toBeNull();

  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Volgende vraag' })).toBeVisible();
  // Focus follows the answer, so a child does not tab back through twelve
  // provinces to carry on.
  await expect(page.getByRole('button', { name: 'Volgende vraag' })).toBeFocused();
});

/**
 * Ontdekken is the screen with the most controls on it — eighty names in a list
 * beside a map that is itself a set of controls — so it is the one where a
 * duplicate accessible name or an unlabelled region is most likely to appear.
 */
test('explore has no violations, empty or with something chosen', async ({ page }) => {
  await signIn(page, 'Tess');
  await startRound(page, STEDEN, /Ontdek/);

  // Scoped to the list: the map carries the same names, and it should — a
  // marker without an accessible name is the bug this file exists to catch.
  const lijst = page.getByRole('navigation');
  await expect(lijst.getByRole('button', { name: 'Amsterdam', exact: true })).toBeVisible();

  expect((await scan(page)).violations).toEqual([]);

  await lijst.getByRole('button', { name: 'Amsterdam', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Amsterdam' })).toBeVisible();

  expect((await scan(page)).violations).toEqual([]);
});

/**
 * De kassa (ADR-123), en de pagina erna.
 *
 * Deze twee staan buiten de app: geen bundle, geen tokens uit Tailwind, eigen
 * CSS. Precies daarom horen ze hier — wat buiten het systeem staat, erft de
 * zorgvuldigheid van het systeem niet vanzelf, en dit is de pagina waar een
 * ouder een e-mailadres en geld achterlaat.
 */
/**
 * De premiumpagina heeft sinds ADR-124 twee gezichten, en ze moeten allebei
 * gemeten worden: met een code is het een statusregel, zonder code een
 * verkooppagina met koppen, een lijst van twee niveaus, een prijs en een link
 * die als knop is opgemaakt. De rest van dit bestand draait mét code
 * (playwright.config.ts), dus de verkoopkant krijgt een eigen sessie.
 */
test('the premium page has no violations once a code is in', async ({ page }) => {
  await signIn(page, 'Vera');
  await page.goto('/premium');
  await expect(page.getByText(/Premium staat aan op dit apparaat/)).toBeVisible();
  expect((await scan(page)).violations).toEqual([]);
});

test.describe('zonder code', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('the premium page has no violations while it is still selling', async ({ page }) => {
    await signIn(page, 'Wout');
    await page.goto('/premium');
    await expect(page.getByRole('heading', { name: 'Wat premium voor je doet' })).toBeVisible();
    expect((await scan(page)).violations).toEqual([]);
  });

  test('the Onthouden page has no violations while showing its free preview', async ({ page }) => {
    await signIn(page, 'Wout');
    await page.goto('/onthouden');
    await expect(page.getByRole('list', { name: 'Alles in één blik' })).toBeVisible();
    expect((await scan(page)).violations).toEqual([]);
  });
});

test('the kassa and the page after it have no violations', async ({ page }) => {
  await page.goto('/kopen/');
  await expect(page.getByRole('heading', { name: 'Premium voor een schooljaar' })).toBeVisible();
  expect((await scan(page)).violations).toEqual([]);

  // Met een foutmelding erbij: die staat in een rode kaart en is de enige tekst
  // op deze pagina's die op kleur leunt.
  await page.getByLabel('Waar sturen we de code heen?').fill('geen adres');
  await page.getByRole('button', { name: 'Betalen met iDEAL' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  expect((await scan(page)).violations).toEqual([]);

  // De pagina na het betalen, zoals een ouder hem zonder bestelling in de
  // browser ziet: "je code komt per mail".
  await page.goto('/kopen/klaar/');
  await expect(page.getByRole('heading', { name: 'Bedankt' })).toBeVisible();
  expect((await scan(page)).violations).toEqual([]);
});
