import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Taal: the fifth module (ADR-118), and one round of every way of each part.
 *
 * What is tested here is what only a browser can show: that the page has the
 * shape the other modules have with its parts in the region row, that every
 * way can be played to "Ronde klaar", that the flitsdictee takes the word away
 * and can be played with a keyboard alone, and that a screen reader hears the
 * letter pieces spelled. Which words, the gaps and the verb forms are tested
 * without a browser, in `src/content/taal.content.test.ts` and
 * `src/game-core/taal.test.ts`.
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
  // De groep is een tweede stap, altijd over te slaan (ADR-151).
  await page.getByRole('button', { name: 'Zeg ik niet' }).click();
  await expect(page.getByRole('banner').getByRole('button', { name: naam })).toBeVisible();
}

/** Which part, what, which set where there is a choice, and how. */
async function kies(
  page: Page,
  deel: 'Spelling' | 'Werkwoorden',
  onderwerp: RegExp,
  set: string | null,
  hoe: RegExp,
) {
  await page.goto('/taal');
  await expect(page.getByRole('heading', { name: /^Wat wil je oefenen,/ })).toBeVisible();

  const welk = page.getByRole('region', { name: 'Welk deel?' });
  await welk.getByRole('button', { name: deel, exact: true }).click();

  const wat = page.getByRole('region', { name: /Kies een onderwerp/ });
  await wat.getByRole('button', { name: onderwerp }).click();
  if (set) await page.getByRole('button', { name: set, exact: true }).click();

  await page
    .getByRole('region', { name: /Hoe wil je/ })
    .getByRole('button', { name: hoe })
    .click();
}

async function start(page: Page) {
  await page.locator('.tk-choose-start button').click();
}

/**
 * Plays a round to its end: the first option where there are options, a wrong
 * word where there is a field. A round of Taal ends on its last question or on
 * its third life, and both are what is being tested. A flitsdictee shows no
 * field for three seconds, which the wait below covers.
 */
async function speel(page: Page) {
  const klaar = page.getByRole('heading', { name: 'Ronde klaar' });
  const volgende = page.getByRole('button', { name: 'Volgende vraag' });
  const letters = page.getByRole('group', { name: 'Kies de letters' });
  const vormen = page.getByRole('group', { name: 'Kies de vorm' });
  const veld = page.locator('.tk-zin-veld');

  for (let vraag = 0; vraag < 150; vraag++) {
    await expect(klaar.or(volgende).or(letters).or(vormen).or(veld).first()).toBeVisible({
      timeout: 10_000,
    });
    if (await klaar.isVisible()) return;
    if (await volgende.isVisible()) {
      await volgende.click();
      continue;
    }
    if (await letters.isVisible()) {
      await letters.getByRole('button').first().click();
      continue;
    }
    if (await vormen.isVisible()) {
      await vormen.getByRole('button').first().click();
      continue;
    }
    await veld.fill('x');
    await veld.press('Enter');
  }
  throw new Error('De ronde hield niet op.');
}

test('Taal has a module page in the shape the others have, opening on Spelling', async ({
  page,
}) => {
  await signIn(page, 'Noa');
  await page.goto('/taal');

  // Which part, in the row topography asks where on, with Spelling chosen.
  const welk = page.getByRole('region', { name: 'Welk deel?' });
  await expect(welk.getByRole('button')).toHaveCount(2);
  await expect(welk.getByRole('button', { name: 'Spelling', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('region', { name: 'Waar op de kaart?' })).toHaveCount(0);

  const wat = page.getByRole('region', { name: /Kies een onderwerp/ });
  for (const naam of [
    'Onthoudwoorden',
    'D of t',
    'Eén of twee',
    'Achter aan het woord',
    'Spellingmix',
  ]) {
    await expect(wat.getByRole('button', { name: new RegExp(`^${naam}`) })).toBeVisible();
  }

  // The ways follow the part, before a subject is chosen — and there is no
  // clock among them (ADR-118).
  const hoe = page.getByRole('region', { name: /Hoe wil je/ });
  for (const naam of ['Kies de letters', 'Flitsdictee', 'Overleven', 'Oefentoets']) {
    await expect(hoe.getByRole('button', { name: new RegExp(`^${naam}`) })).toBeVisible();
  }
  await expect(hoe.getByRole('button', { name: /^Bliksemronde/ })).toHaveCount(0);
  expect((await scan(page)).violations).toEqual([]);

  await welk.getByRole('button', { name: 'Werkwoorden', exact: true }).click();
  for (const naam of [
    'Tegenwoordige tijd',
    'Verleden tijd',
    'Voltooid deelwoord',
    'Werkwoordmix',
  ]) {
    await expect(wat.getByRole('button', { name: new RegExp(`^${naam}`) })).toBeVisible();
  }
  for (const naam of ['Kies de vorm', 'Typ de vorm', 'Overleven', 'Oefentoets']) {
    await expect(hoe.getByRole('button', { name: new RegExp(`^${naam}`) })).toBeVisible();
  }
  await expect(hoe.getByRole('button', { name: /^Bliksemronde/ })).toHaveCount(0);
});

test('the parts and the sets have addresses, and the page opens on them', async ({ page }) => {
  await signIn(page, 'Lars');
  const welk = page.getByRole('region', { name: 'Welk deel?' });
  const wat = page.getByRole('region', { name: /Kies een onderwerp/ });

  await page.goto('/werkwoorden');
  await expect(welk.getByRole('button', { name: 'Werkwoorden', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page).toHaveURL(/\/taal\/werkwoorden$/);

  await page.goto('/spelling');
  await expect(welk.getByRole('button', { name: 'Spelling', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await page.goto('/woordjes');
  await expect(page).toHaveURL(/\/taal$/);

  await page.goto('/taal/ei-ij');
  await expect(wat.getByRole('button', { name: /^Onthoudwoorden/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('button', { name: 'Ei of ij', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await page.goto('/taal/tegenwoordige-tijd');
  await expect(wat.getByRole('button', { name: /^Tegenwoordige tijd/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('Kies de letters: a screen reader hears the letters one by one', async ({ page }) => {
  await signIn(page, 'Mees');
  await page.goto('/taal/ei-ij');
  await page
    .getByRole('region', { name: /Hoe wil je/ })
    .getByRole('button', { name: /^Kies de letters/ })
    .click();
  await start(page);

  // "ei" and "ij" sound the same, so the names spell them.
  const letters = page.getByRole('group', { name: 'Kies de letters' });
  await expect(letters.getByRole('button', { name: 'e, i', exact: true })).toBeVisible();
  await expect(letters.getByRole('button', { name: 'i, j', exact: true })).toBeVisible();
  expect((await scan(page)).violations).toEqual([]);

  await letters.getByRole('button').first().click();
  await expect(page.getByRole('button', { name: 'Volgende vraag' })).toBeVisible();
  expect((await scan(page)).violations).toEqual([]);

  await speel(page);
  await expect(page.getByRole('heading', { name: 'Ronde klaar' })).toBeVisible();
  expect((await scan(page)).violations).toEqual([]);
});

test('Flitsdictee: three seconds of looking, then the whole word, with a keyboard alone', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await signIn(page, 'Pim');
  await kies(page, 'Spelling', /^D of t/, null, /^Flitsdictee/);
  await start(page);

  // The sentence with the word takes focus, which is when a screen reader
  // reads it out and when the three seconds start.
  const zin = page.locator('p.tk-zin[tabindex="-1"]');
  const veld = page.locator('.tk-zin-veld');
  const vraag = page.locator('.tk-round-question');
  await expect(zin).toBeFocused();
  const woord = ((await zin.locator('.tk-letters').textContent()) ?? '').trim();
  expect(woord.length).toBeGreaterThan(1);
  expect((await scan(page)).violations).toEqual([]);

  // Then the word goes, the field takes focus, and nothing spells for the child.
  await expect(veld).toBeFocused({ timeout: 8_000 });
  await expect(zin).toHaveCount(0);
  await expect(veld).toHaveAttribute('autocomplete', 'off');
  await expect(veld).toHaveAttribute('autocorrect', 'off');
  await expect(veld).toHaveAttribute('autocapitalize', 'none');
  await expect(veld).toHaveAttribute('spellcheck', 'false');
  expect((await scan(page)).violations).toEqual([]);

  // One letter short is wrong, and the screen marks the letter that was missing.
  await page.keyboard.type(woord.slice(0, -1));
  await page.keyboard.press('Enter');
  await expect(vraag.getByText(`Het is ${woord}, met`)).toBeVisible();
  await expect(page.locator('mark.tk-verschil').first()).toBeVisible();
  const volgende = page.getByRole('button', { name: 'Volgende vraag' });
  await expect(volgende).toBeFocused();
  await page.keyboard.press('Enter');

  // A capital is not a mistake.
  await expect(zin).toBeFocused();
  const tweede = ((await zin.locator('.tk-letters').textContent()) ?? '').trim();
  await expect(veld).toBeFocused({ timeout: 8_000 });
  await page.keyboard.type(`${tweede.charAt(0).toUpperCase()}${tweede.slice(1)}`);
  await page.keyboard.press('Enter');
  await expect(vraag.getByText(`Goed! ${tweede}.`)).toBeVisible();
  await expect(volgende).toBeFocused();
  await page.keyboard.press('Enter');

  // The rest of the round with the keyboard and nothing else.
  const klaar = page.getByRole('heading', { name: 'Ronde klaar' });
  for (let nog = 0; nog < 20; nog++) {
    await expect(klaar.or(veld).first()).toBeVisible({ timeout: 8_000 });
    if (await klaar.isVisible()) break;
    await expect(veld).toBeFocused();
    await page.keyboard.type('x');
    await page.keyboard.press('Enter');
    await expect(volgende).toBeFocused();
    await page.keyboard.press('Enter');
  }
  await expect(klaar).toBeVisible();
});

test('Overleven on spelling: three lives, and it ends', async ({ page }) => {
  await signIn(page, 'Sara');
  await kies(page, 'Spelling', /^Achter aan het woord/, 'Woorden op -ig', /^Overleven/);
  await start(page);

  await expect(page.getByText('levens', { exact: true })).toBeVisible();
  await speel(page);
});

test('Oefentoets on spelling: the flitsdictee, no answers until the end, and a mark', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await signIn(page, 'Jip');
  await kies(page, 'Spelling', /^Eén of twee/, 'Eén of twee klinkers', /^Oefentoets/);
  await start(page);

  await speel(page);
  await expect(page.getByText('Cijfer', { exact: true })).toBeVisible();
});

test('Ontdekken: the rule, and the words with their letters marked', async ({ page }) => {
  await signIn(page, 'Fenna');
  await kies(page, 'Spelling', /^D of t/, null, /^Ontdekken/);
  await start(page);

  await expect(page.getByRole('region', { name: 'De regel' })).toContainText('honden');
  await expect(
    page.getByRole('region', { name: 'De woorden' }).locator('mark').first(),
  ).toBeVisible();
  expect((await scan(page)).violations).toEqual([]);

  // Nothing was asked, so the way out is home.
  await page.getByRole('button', { name: 'Klaar' }).click();
  await expect(page.getByRole('region', { name: 'Maak af' })).toBeVisible();
});

test('Kies de vorm: three real forms, and the round in the history', async ({ page }) => {
  await signIn(page, 'Ties');
  await kies(page, 'Werkwoorden', /^Tegenwoordige tijd/, null, /^Kies de vorm/);
  await start(page);

  await expect(page.getByRole('group', { name: 'Kies de vorm' }).getByRole('button')).toHaveCount(
    3,
  );
  expect((await scan(page)).violations).toEqual([]);
  await speel(page);

  // "Klaar" when nothing is due any more (ADR-149), "Terug naar start" otherwise.
  await page.getByRole('button', { name: /^(Klaar|Terug naar start)$/ }).click();
  const recent = page.getByRole('region', { name: 'Recent geoefend' });
  await expect(recent.getByRole('button', { name: /Tegenwoordige tijd/ }).first()).toBeVisible();
});

test('Typ de vorm: after a wrong answer, the rule applied to this verb', async ({ page }) => {
  await signIn(page, 'Isa');
  await kies(page, 'Werkwoorden', /^Verleden tijd/, null, /^Typ de vorm/);
  await start(page);

  const veld = page.locator('.tk-zin-veld');
  await expect(veld).toBeFocused();
  await expect(veld).toHaveAttribute('autocorrect', 'off');
  await veld.fill('x');
  await veld.press('Enter');
  // "’t Kofschip" opens its sentence, so it is written with a capital there.
  await expect(page.locator('.tk-round-question')).toContainText(/kofschip|sterk werkwoord/i);
  expect((await scan(page)).violations).toEqual([]);

  await speel(page);
});

test('Overleven on verbs: three lives, and it ends', async ({ page }) => {
  await signIn(page, 'Bas');
  await kies(page, 'Werkwoorden', /^Voltooid deelwoord/, null, /^Overleven/);
  await start(page);

  await expect(page.getByText('levens', { exact: true })).toBeVisible();
  await speel(page);
});

test('Oefentoets on verbs: typed, no answers until the end, and a mark', async ({ page }) => {
  await signIn(page, 'Floor');
  await kies(page, 'Werkwoorden', /^Werkwoordmix/, null, /^Oefentoets/);
  await start(page);

  await speel(page);
  await expect(page.getByText('Cijfer', { exact: true })).toBeVisible();
});

test('Ontdekken on verbs: a card per rule, with examples from the set', async ({ page }) => {
  await signIn(page, 'Mila');
  await kies(page, 'Werkwoorden', /^Tegenwoordige tijd/, null, /^Ontdekken/);
  await start(page);

  const kaart = page.getByRole('region', { name: 'Jij en hij: stam + t' });
  await expect(kaart).toBeVisible();
  await expect(kaart).toContainText('stam + t');
  expect((await scan(page)).violations).toEqual([]);

  await page.getByRole('button', { name: 'Klaar' }).click();
  await expect(page.getByRole('region', { name: 'Maak af' })).toBeVisible();
});
