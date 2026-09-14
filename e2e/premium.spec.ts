import { expect, test, type Page, type Route } from '@playwright/test';

/**
 * Premium behind a code (ADR-116, ADR-122): without one the premium parts are
 * locked and every lock leads to the code; with one they open, and what went to
 * the server was the code and a device number, nothing else.
 *
 * ADR-122 moved the line to between practising and remembering, so this spec
 * also holds the other way round: ontdekken, "herhaal je fouten", the
 * tafeldiploma's and the forecast on "Ronde klaar" are there without a code.
 *
 * Every other spec runs with premium on (playwright.config.ts). This one starts
 * from nothing, and answers for the premium server itself — the build asks
 * https://premium.leer.test, which does not exist.
 */
test.use({ storageState: { cookies: [], origins: [] } });

const SERVER = 'https://premium.leer.test';
const GOEDE_CODE = '7K3MQ9TX';

async function signIn(page: Page, naam: string) {
  await page.goto('/');
  await page.getByPlaceholder('Je naam').fill(naam);
  await page.getByRole('button', { name: 'Beginnen' }).click();
  await expect(page.getByRole('banner').getByRole('button', { name: naam })).toBeVisible();
}

/** The premium server, as the browser will meet it: across origins, so with CORS. */
async function beantwoord(route: Route, body: unknown) {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'apikey, authorization, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
  if (route.request().method() === 'OPTIONS') {
    await route.fulfill({ status: 204, headers: cors });
    return;
  }
  await route.fulfill({ status: 200, headers: cors, json: body });
}

test('without a code the premium parts are locked, and every lock leads to the code', async ({
  page,
}) => {
  await signIn(page, 'Noor');

  // The Onthouden page: no table, but what remembering means is still there.
  await page.goto('/onthouden');
  await expect(page.getByRole('heading', { name: 'Wat je onthoudt' })).toBeVisible();
  await expect(page.getByRole('table')).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Wanneer onthoud je iets?' })).toBeVisible();

  await page.getByRole('button', { name: 'Code invullen' }).first().click();
  await expect(page).toHaveURL(/\/premium$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Premium' })).toBeVisible();

  // A premium way on a module page goes there too, rather than being chosen.
  await page.goto('/topografie');
  await page
    .getByRole('region', { name: /Kies een onderwerp/ })
    .getByRole('button', { name: /^Provincies/ })
    .click();
  const hoe = page.getByRole('region', { name: /Hoe wil je/ });
  await hoe.getByRole('button', { name: /^Bliksemronde/ }).click();
  await expect(page).toHaveURL(/\/premium$/);

  // And a free way is still simply a way.
  await page.goto('/topografie');
  await page
    .getByRole('region', { name: /Kies een onderwerp/ })
    .getByRole('button', { name: /^Provincies/ })
    .click();
  await hoe.getByRole('button', { name: /^Aanwijzen/ }).click();
  await expect(hoe.getByRole('button', { name: /^Aanwijzen/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  // On Jij: the badges and the second child are locked. The tafeldiploma's are
  // not — they are the one wall a family gets without a code (ADR-122).
  await page.goto('/jij');
  await expect(page.getByRole('region', { name: 'Jouw badges' })).toContainText(
    'Dit hoort bij premium.',
  );
  await expect(page.getByRole('region', { name: 'Wie oefent er?' })).toContainText(
    'Dit hoort bij premium.',
  );
  await expect(page.getByRole('button', { name: 'Nog een kind erbij' })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Jouw tafeldiploma’s' })).not.toContainText(
    'Dit hoort bij premium.',
  );
});

test('without a code a child can still discover, repeat their misses, and see the forecast', async ({
  page,
}) => {
  await signIn(page, 'Sam');

  // Ontdekken is a way now, not a lock: it asks nothing, so it can never be
  // the thing a child is turned away from (ADR-122).
  await page.goto('/topografie');
  await page
    .getByRole('region', { name: /Kies een onderwerp/ })
    .getByRole('button', { name: /^Provincies/ })
    .click();
  await page
    .getByRole('region', { name: /Hoe wil je/ })
    .getByRole('button', { name: /^Ontdekken/ })
    .click();
  await page.locator('.tk-choose-start button').click();
  await expect(page).not.toHaveURL(/\/premium$/);

  // The table of one, typed, so the round can be finished honestly — and one
  // answer given wrong on purpose, so there is something to repeat.
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

  for (let n = 1; n <= 10; n++) {
    const som = await page.locator('.tk-sum').innerText();
    const goed = som.split('×')[1]?.trim() ?? '';
    await page.getByPlaceholder('Antwoord').fill(n === 1 ? '99' : goed);
    await page.getByRole('button', { name: 'Kijk na' }).click();
    await page.getByRole('button', { name: 'Volgende vraag' }).click();
  }

  await expect(page.getByRole('heading', { name: 'Ronde klaar' })).toBeVisible();

  // The forecast is free: it is the one sentence about what happens if you do
  // nothing, and nothing beside it asks for a code.
  await expect(page.getByText(/weet je hier over drie weken nog van/)).toBeVisible();

  // And so is going back over what just went wrong.
  await page.getByRole('button', { name: 'Herhaal je fouten' }).click();
  await expect(page).not.toHaveURL(/\/premium$/);
  await expect(page.getByPlaceholder('Antwoord')).toBeVisible();
});

/**
 * De weg naar de kassa (ADR-123): een gewone link naar een gewone pagina op dit
 * adres. Daarom hoeft de app zelf niets van betalen te weten — hij wijst, en
 * laat los. En hij wijst alleen zolang er nog niets gekocht is.
 */
test('without a code the premium page points at the kassa, and with one it does not', async ({
  page,
  baseURL,
}) => {
  const origin = new URL(baseURL ?? 'http://localhost:4173').origin;
  await signIn(page, 'Tess');

  await page.goto('/premium');
  const knop = page.getByRole('link', { name: 'Een code kopen' });
  await expect(knop).toBeVisible();

  const doel = new URL((await knop.getAttribute('href')) ?? '', origin);
  expect(doel.origin, 'de kassa staat op dit adres zelf').toBe(origin);

  await knop.click();
  await expect(page.getByRole('heading', { name: 'Premium voor een schooljaar' })).toBeVisible();
});

test('a code is checked once, and then everything opens', async ({ page }) => {
  const gevraagd: Record<string, unknown>[] = [];
  await page.route(`${SERVER}/rest/v1/rpc/premium_controleer`, async (route) => {
    if (route.request().method() !== 'OPTIONS') {
      gevraagd.push(route.request().postDataJSON() as Record<string, unknown>);
    }
    const code = (route.request().postDataJSON() as { p_code?: string } | null)?.p_code;
    await beantwoord(
      route,
      code === GOEDE_CODE
        ? { geldig: true, geldig_tot: '2099-09-13' }
        : { geldig: false, reden: 'onbekend' },
    );
  });

  await signIn(page, 'Mees');
  await page.goto('/premium');

  const veld = page.getByLabel('Typ de code');
  await veld.fill('LEER-2222-2222');
  await page.getByRole('button', { name: 'Code gebruiken' }).click();
  await expect(page.getByRole('alert')).toContainText('Deze code kennen we niet');

  // However it is typed: small letters, the LEER in front, spaces.
  await veld.fill('leer 7k3m q9tx');
  await page.getByRole('button', { name: 'Code gebruiken' }).click();
  await expect(page.getByText(/Premium staat aan op dit apparaat/)).toBeVisible();

  // The code, normalised, and a device number: that is all that went.
  expect(gevraagd.at(-1)?.p_code).toBe(GOEDE_CODE);
  expect(Object.keys(gevraagd.at(-1) ?? {}).sort()).toEqual(['p_apparaat', 'p_code']);

  await page.goto('/onthouden');
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Laatst geoefend' })).toBeVisible();

  // En de kassa is weg: iemand die net betaald heeft hoeft niet te lezen waar je
  // kunt betalen (ADR-123).
  await page.goto('/premium');
  await expect(page.getByRole('link', { name: 'Een code kopen' })).toHaveCount(0);
});
