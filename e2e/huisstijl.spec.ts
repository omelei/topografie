import { expect, test, type Page } from '@playwright/test';
import { signIn } from './naam';
import { stap } from './stap';

/**
 * The house style in the running app (ADR-109).
 *
 * The unit tests hold the tokens to the styleguide's values; this holds that
 * the page actually uses them: the ground is room, headings are Baloo 2, and
 * a round stays on that paper with its controls at 56 on every size (ADR-112).
 */

async function startRound(page: Page) {
  await page.goto('/topografie');
  await (
    await stap(page, /Kies een onderwerp/)
  )
    .getByRole('button', { name: /^Provincies/ })
    .click();
  await (await stap(page, /Hoe wil je/)).getByRole('button', { name: /Aanwijzen/ }).click();
  await page.locator('.tk-choose-start .tk-button-go').click();
  await expect(page.getByRole('heading', { name: /Waar ligt / })).toBeVisible();
}

/** Room, op elke maat (ADR-259; ADR-247 maakte het melk aan een bureau). */
const ROOM = 'rgb(255, 243, 230)';

test('stands on room and sets its headings in Baloo 2', async ({ page }) => {
  await signIn(page, 'Noor');

  const ground = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  // Room, the logo's own, the ground since Kleur erin (ADR-239), op elke maat
  // (ADR-259).
  expect(ground).toBe(ROOM);

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
  expect(await ronde.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(ROOM);

  const stop = await page.locator('.tk-stop').boundingBox();
  expect(stop?.height ?? 0, 'the stop in a round').toBeGreaterThanOrEqual(56);
  expect(stop?.width ?? 0, 'the stop in a round').toBeGreaterThanOrEqual(56);
});

/**
 * Op een groot scherm groeit de pagina mee (ADR-199): sinds ADR-259 alles
 * naast de zijbalk (256 en 24 lucht), tot 1600. Alleen op de desktop, want
 * daar zit de maat.
 */
test('de pagina groeit mee met een groot scherm', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', 'de maat van een desktop');
  await signIn(page, 'Noor');
  const breedte = () =>
    page.locator('.tk-home').evaluate((el) => Math.round(el.getBoundingClientRect().width));

  expect(await breedte()).toBe(1440 - 280);
  await page.setViewportSize({ width: 1920, height: 1080 });
  expect(await breedte()).toBe(1600);
  await page.setViewportSize({ width: 2560, height: 1440 });
  expect(await breedte()).toBe(1600);
});
