import { expect, test, type Page } from '@playwright/test';
import { signIn } from './naam';

/**
 * The house style in the running app (ADR-109).
 *
 * The unit tests hold the tokens to the styleguide's values; this holds that
 * the page actually uses them: the ground is room, headings are Baloo 2, and
 * a round stays on that paper with its controls at 56 on every size (ADR-112).
 */

async function startRound(page: Page) {
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
  await expect(page.getByRole('heading', { name: /Waar ligt / })).toBeVisible();
}

test('stands on zand and sets its headings in Baloo 2', async ({ page }) => {
  await signIn(page, 'Noor');

  const ground = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  // Zand, the ground since ADR-221; room is the plane on it.
  expect(ground).toBe('rgb(243, 230, 216)');

  const heading = page.getByRole('heading', { name: /^Hoi / });
  await expect(heading).toBeVisible();
  expect(await heading.evaluate((el) => getComputedStyle(el).fontFamily)).toContain('Baloo 2');
  expect(await heading.evaluate((el) => getComputedStyle(el).fontWeight)).toBe('800');

  // Running text is Atkinson Hyperlegible.
  expect(await page.evaluate(() => getComputedStyle(document.body).fontFamily)).toContain(
    'Atkinson Hyperlegible',
  );
});

test('keeps a round on the app’s paper, with its controls at 56 whatever the size', async ({
  page,
}) => {
  await signIn(page, 'Daan');
  await startRound(page);

  // Light like every other screen since ADR-112: the same ground.
  const ronde = page.locator('[data-thema="ronde"]');
  await expect(ronde).toBeVisible();
  expect(await ronde.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(
    'rgb(243, 230, 216)',
  );

  const stop = await page.locator('.tk-stop').boundingBox();
  expect(stop?.height ?? 0, 'the stop in a round').toBeGreaterThanOrEqual(56);
  expect(stop?.width ?? 0, 'the stop in a round').toBeGreaterThanOrEqual(56);
});

/**
 * Op een groot scherm groeit de pagina mee (ADR-199): driekwart van het
 * scherm, tussen 1080 en 1600. Alleen op de desktop, want daar zit de maat.
 */
test('de pagina groeit mee met een groot scherm', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', 'de maat van een desktop');
  await signIn(page, 'Noor');
  const breedte = () =>
    page.locator('.tk-home').evaluate((el) => Math.round(el.getBoundingClientRect().width));

  expect(await breedte()).toBe(1080);
  await page.setViewportSize({ width: 1920, height: 1080 });
  expect(await breedte()).toBe(1440);
  await page.setViewportSize({ width: 2560, height: 1440 });
  expect(await breedte()).toBe(1600);
});
