import { expect, test, type Page, type Route } from '@playwright/test';

/**
 * Premium behind a code (ADR-116): without one the premium parts are locked and
 * every lock leads to the code; with one they open, and what went to the
 * server was the code and a device number, nothing else.
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

  // On Jij: the badges, the diplomas and the second child are locked.
  await page.goto('/jij');
  await expect(page.getByRole('region', { name: 'Jouw badges' })).toContainText(
    'Dit hoort bij premium.',
  );
  await expect(page.getByRole('region', { name: 'Wie oefent er?' })).toContainText(
    'Dit hoort bij premium.',
  );
  await expect(page.getByRole('button', { name: 'Nog een kind erbij' })).toHaveCount(0);
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
});
