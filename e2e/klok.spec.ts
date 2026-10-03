import { expect, test, type Page } from '@playwright/test';
import { signIn } from './naam';
import { stap } from './stap';

/**
 * Klokkijken: the third module, and the first one that asks in two directions.
 *
 * What is worth testing here is not the arithmetic of a clock face —
 * `klok.test.ts` and `klok.content.test.ts` work all hundred and forty-four
 * back out — but that the module has a page in the shape the other two have,
 * that its steps have addresses, and that both directions of the exercise are
 * actually reachable from step 2.
 */

/**
 * Welke klok, het onderwerp, hoe, start. The one way into a round, whatever
 * was chosen. Zonder klok blijft het de wijzerklok, waar de pagina op opent.
 */
async function startKlok(page: Page, onderwerp: RegExp, hoe: RegExp, klok: RegExp | null = null) {
  await page.goto('/klokkijken');
  await expect(page.getByRole('heading', { level: 1, name: / oefenen$/ })).toBeVisible();

  if (klok) await (await stap(page, /Welke klok/)).getByRole('button', { name: klok }).click();

  await (await stap(page, /Kies een onderwerp/)).getByRole('button', { name: onderwerp }).click();
  await (await stap(page, /Hoe wil je/)).getByRole('button', { name: hoe }).click();
  await page.locator('.tk-choose-start .tk-button-go').click();
}

test('the clock has a module page in the same shape as the other two', async ({ page }) => {
  await signIn(page, 'Sanne');
  await page.goto('/klokkijken');

  // Four steps and a mix, one set each, and no chips, because no subject here
  // holds more than one set. Geen kaart, maar wel een rij erboven: welke klok
  // (ADR-257), en de pagina opent op de wijzerklok.
  for (const naam of ['Hele uren', 'Halve uren', 'Kwartieren', 'Vijf minuten', 'Klokmix']) {
    await expect(
      (await stap(page, /Kies een onderwerp/)).getByRole('button', {
        name: new RegExp(`^${naam}`),
      }),
    ).toBeVisible();
  }
  await expect(page.getByRole('region', { name: 'Waar op de kaart?' })).toHaveCount(0);
  const klokken = await stap(page, /Welke klok/);
  await expect(klokken.getByRole('button', { name: /^Analoge klok/ })).toBeVisible();
  await expect(klokken.getByRole('button', { name: /^Digitale klok/ })).toBeVisible();

  // Step 2 is five ways, and the two that read the face come before the one
  // that reads it backwards. The clock and the lives are off by default (K10),
  // so four of the five are on the page.
  await expect(
    (await stap(page, /Hoe wil je/)).getByRole('button', { name: /^Meerkeuze/ }),
  ).toBeVisible();
  await expect(
    (await stap(page, /Hoe wil je/)).getByRole('button', { name: /^Klok zoeken/ }),
  ).toBeVisible();
  await expect(
    (await stap(page, /Hoe wil je/)).getByRole('button', { name: /^Zelf typen/ }),
  ).toBeVisible();
});

test('the clock answers to the short word as well as its own', async ({ page }) => {
  await signIn(page, 'Bram');

  // "Klok" is what the rail says and what a child would type. Both land here.
  await page.goto('/klok');
  await expect(page.getByRole('heading', { level: 1, name: / oefenen$/ })).toBeVisible();
  // The tile, "Kwartieren. …", and not the klokdiploma "Kwartieren: …" (ADR-117).
  // Op een telefoon staat eerst "Welke klok?" open (ADR-257).
  await expect(
    (await stap(page, /Kies een onderwerp/)).getByRole('button', { name: /^Kwartieren\./ }),
  ).toBeVisible();
});

test('a step of the clock has an address, and the page opens on it', async ({ page }) => {
  await signIn(page, 'Iris');
  await page.goto('/klokkijken/kwartieren');
  await expect(
    (await stap(page, /Kies een onderwerp/)).getByRole('button', { name: /^Kwartieren/ }),
  ).toHaveAttribute('aria-pressed', 'true');
});

test('reading a face: a clock on the stage and four times to choose from', async ({ page }) => {
  await signIn(page, 'Fem');
  await startKlok(page, /^Halve uren/, /^Meerkeuze/);

  // The face is where the map goes on topografie and the sum on rekenen.
  await expect(page.locator('.tk-klok').first()).toBeVisible();

  const opties = page.getByRole('group', { name: 'Kies hoe laat het is' });
  await expect(opties.getByRole('button')).toHaveCount(4);
  // Written out, because the difference between "7:30" and "half acht" is the
  // whole exercise — an option reading "half 8" would do the reading for them.
  await expect(opties.getByRole('button').first()).toContainText(/[a-z]/);

  await opties.getByRole('button').first().click();
  await expect(page.getByRole('button', { name: 'Volgende vraag' })).toBeVisible();
  // Whatever the time was, the answer is given in both notations.
  await expect(page.getByRole('status')).toContainText(':');
});

/**
 * De digitale klok (ADR-247, ADR-257): een deel van Klok en geen spelvorm. Bij
 * meerkeuze cijfers op het scherm, en om de vraag na twaalf uur, zodat 19:30
 * ook half acht is.
 */
test('the digital clock: figures on the stage, the afternoon too, and four times', async ({
  page,
}) => {
  await signIn(page, 'Jip');
  await startKlok(page, /^Halve uren/, /^Meerkeuze/, /^Digitale klok/);

  const scherm = page.getByRole('img', { name: /^\d{2}:\d{2}$/ });
  await expect(scherm).toBeVisible();
  const eerste = Number((await scherm.getAttribute('aria-label'))?.slice(0, 2));
  expect(eerste).toBeLessThanOrEqual(12);

  const opties = page.getByRole('group', { name: 'Kies hoe laat het is' });
  await expect(opties.getByRole('button')).toHaveCount(4);
  await opties.getByRole('button').first().click();
  await page.getByRole('button', { name: 'Volgende vraag' }).click();

  // De tweede vraag staat na twaalf uur, behalve om twaalf uur zelf.
  const tweede = Number((await scherm.getAttribute('aria-label'))?.slice(0, 2));
  expect(tweede === 12 || tweede > 12).toBe(true);
});

test('the digital clock is no longer a way of practising, but every way works on it', async ({
  page,
}) => {
  await signIn(page, 'Guus');
  await page.goto('/klokkijken');
  await expect(
    (await stap(page, /Hoe wil je/)).getByRole('button', { name: /^Digitale klok/ }),
  ).toHaveCount(0);

  // Klok zoeken: de tijd in woorden, en vier digitale klokken om uit te kiezen.
  await startKlok(page, /^Kwartieren/, /^Klok zoeken/, /^Digitale klok/);
  const klokken = page.getByRole('group', { name: 'Welke klok hoort hierbij?' });
  await expect(klokken.getByRole('button')).toHaveCount(4);
  await expect(klokken.locator('.tk-digitaal')).toHaveCount(4);
  await expect(klokken.locator('.tk-klok')).toHaveCount(0);
});

test('typing on the digital clock: the time in words, written in figures', async ({ page }) => {
  await signIn(page, 'Vos');
  await startKlok(page, /^Hele uren/, /^Zelf typen/, /^Digitale klok/);

  // De cijfers staan er niet: die schrijft het kind zelf.
  await expect(page.getByText('Typ deze tijd in cijfers', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/uur$/);
  await expect(page.getByRole('img', { name: /^\d{2}:\d{2}$/ })).toHaveCount(0);

  await page.getByRole('button', { name: 'Ik weet het niet' }).click();
  await expect(page.getByRole('status')).toContainText(':00');
});

test('the digital clock has its own addresses', async ({ page }) => {
  await signIn(page, 'Nina');
  await page.goto('/klokkijken/digitaal-kwartieren');
  await expect(
    (await stap(page, /Welke klok/)).getByRole('button', { name: /^Digitale klok/ }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(
    (await stap(page, /Kies een onderwerp/)).getByRole('button', { name: /^Kwartieren/ }),
  ).toHaveAttribute('aria-pressed', 'true');
});

test('the other direction: a time in words and four faces to point at', async ({ page }) => {
  await signIn(page, 'Loes');
  await startKlok(page, /^Hele uren/, /^Klok zoeken/);

  // Four clocks, and the question is the sentence above them rather than a
  // picture. This is the half of clock reading a child who has learned to
  // recognise twelve pictures has never been asked.
  const klokken = page.getByRole('group', { name: 'Welke klok hoort hierbij?' });
  await expect(klokken.getByRole('button')).toHaveCount(4);

  await klokken.getByRole('button').first().click();
  await expect(page.getByRole('button', { name: 'Volgende vraag' })).toBeVisible();
});

test('typing a time takes every way a child writes one', async ({ page }) => {
  await signIn(page, 'Nout');
  await startKlok(page, /^Hele uren/, /^Zelf typen/);

  const antwoord = page.getByPlaceholder('7:30');
  await expect(antwoord).toBeFocused();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '10');

  // Without a colon, which `judgeKlok` takes: a child who typed "100" knows
  // what time it is, and failing them for a separator would be measuring the
  // keyboard. Right or wrong, the answer comes back in both notations.
  await antwoord.fill('100');
  await page.getByRole('button', { name: 'Kijk na' }).click();
  await expect(page.getByRole('status')).toContainText(':');

  await page.getByRole('button', { name: 'Volgende vraag' }).click();
  await page.getByRole('button', { name: 'Ik weet het niet' }).click();
  await expect(page.getByRole('button', { name: 'Volgende vraag' })).toBeVisible();
});

test('the clock is a door in the side bar like the others', async ({ page }, testInfo) => {
  // Below 1024 the way in is Oefenen (ADR-241); shell.spec.ts walks it.
  test.skip(
    !['chromebook', 'desktop-1440', 'ipad-landscape'].includes(testInfo.project.name),
    'no side bar below 1024',
  );

  await signIn(page, 'Timo');

  const rail = page.getByRole('list', { name: 'Vakken' });
  await rail.getByRole('button', { name: 'Klok', exact: true }).click();

  // A door that is open opens onto the chooser, not onto "binnenkort".
  await expect(page.getByRole('heading', { level: 1, name: / oefenen$/ })).toBeVisible();
  await expect(rail.getByRole('button', { name: 'Klok', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
});
