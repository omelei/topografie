import { expect, test, type Page } from '@playwright/test';

/**
 * "Je fouten" is een spelvorm op de gekozen set (ADR-103, ADR-168).
 *
 * A child who says "ik weet het niet" has not known it, and the boxes record
 * that as a mistake — so a round answered that way is the quickest honest way
 * to a handful of them. Daarna staat de tegel in stap 3, bij de manieren, en
 * niet meer tussen de onderwerpen: wát je oefent koos je in stap 2, en dit
 * zegt welk deel ervan gevraagd wordt.
 */

async function signIn(page: Page, naam: string) {
  await page.goto('/');
  await page.getByPlaceholder('Je naam').fill(naam);
  await page.getByRole('button', { name: 'Beginnen' }).click();
  // De groep is een tweede stap, altijd over te slaan (ADR-151).
  await page.getByRole('button', { name: 'Zeg ik niet' }).click();
  await expect(page.getByRole('banner').getByRole('button', { name: naam })).toBeVisible();
}

async function kies(page: Page, pad: string, onderwerp: RegExp, hoe: RegExp) {
  await page.goto(pad);
  await page
    .getByRole('region', { name: /Kies een onderwerp/ })
    .getByRole('button', { name: onderwerp })
    .click();
  await page
    .getByRole('region', { name: /Hoe wil je/ })
    .getByRole('button', { name: hoe })
    .click();
  await page.locator('.tk-choose-start button').click();
}

/** Says "ik weet het niet" to every question, to the end of the round. */
async function weetHetNiet(page: Page) {
  // "Klaar" when nothing is due any more, "Terug naar Vandaag" otherwise (ADR-149).
  const klaar = page.getByRole('button', { name: /^(Klaar|Terug naar Vandaag)$/ });
  const weetNiet = page.getByRole('button', { name: 'Ik weet het niet' });
  const volgende = page.getByRole('button', { name: 'Volgende vraag' });

  for (let vraag = 0; vraag < 40; vraag++) {
    await expect(klaar.or(volgende).or(weetNiet).first()).toBeVisible();
    if (await klaar.isVisible()) return;
    if (await volgende.isVisible()) await volgende.click();
    else await weetNiet.click();
  }
  throw new Error('De ronde hield niet op.');
}

test('de klok biedt "Je fouten" pas aan als er fouten zijn, bij de manieren', async ({ page }) => {
  await signIn(page, 'Ties');
  const wat = page.getByRole('region', { name: /Kies een onderwerp/ });
  const hoe = page.getByRole('region', { name: /Hoe wil je/ });

  // Nergens een onderwerp dat over fouten gaat, met of zonder fouten.
  await page.goto('/klokkijken');
  await expect(wat.getByRole('button', { name: /fouten/i })).toHaveCount(0);

  // En zonder fouten ook geen spelvorm: er valt niets te oefenen.
  await wat.getByRole('button', { name: /^Hele uren/ }).click();
  await expect(hoe.getByRole('button', { name: /^Jouw fouten/ })).toHaveCount(0);

  await kies(page, '/klokkijken', /^Hele uren/, /^Meerkeuze/);
  await weetHetNiet(page);

  // Nu staat hij er, bij de manieren, en hij start een ronde over dezelfde set.
  await page.goto('/klokkijken');
  await wat.getByRole('button', { name: /^Hele uren/ }).click();
  await hoe.getByRole('button', { name: /^Jouw fouten/ }).click();
  await hoe.getByRole('button', { name: /^Meerkeuze/ }).click();
  await page.locator('.tk-choose-start button').click();
  await expect(page.getByRole('group', { name: 'Kies hoe laat het is' })).toBeVisible();
});

/**
 * "Herhaal je fouten" on the result screen: a round with a miss in it offers
 * those items again, straight away, in the same way of practising.
 */
test('the result screen repeats the round’s mistakes', async ({ page }) => {
  await signIn(page, 'Mats');
  await kies(page, '/klokkijken', /^Hele uren/, /^Meerkeuze/);
  await weetHetNiet(page);

  await page.getByRole('button', { name: 'Herhaal je fouten' }).click();
  await expect(page.getByRole('group', { name: 'Kies hoe laat het is' })).toBeVisible();
});

test('topografie biedt dezelfde spelvorm, op de set die gekozen is', async ({ page }) => {
  await signIn(page, 'Isa');
  await kies(page, '/topografie', /^Provincies/, /^Meerkeuze/);
  await weetHetNiet(page);

  await page.goto('/topografie');
  const wat = page.getByRole('region', { name: /Kies een onderwerp/ });
  const hoe = page.getByRole('region', { name: /Hoe wil je/ });
  await expect(wat.getByRole('button', { name: /fouten/i })).toHaveCount(0);

  // Op de provincies wel, want daar zijn ze gemaakt; op de wateren niet.
  await wat.getByRole('button', { name: /^Provincies/ }).click();
  await expect(hoe.getByRole('button', { name: /^Jouw fouten/ })).toBeVisible();

  await wat.getByRole('button', { name: /^Wateren/ }).click();
  await expect(hoe.getByRole('button', { name: /^Jouw fouten/ })).toHaveCount(0);
});

test('het diploma staat als laatste manier, met zijn eigen regel erbij', async ({ page }) => {
  await signIn(page, 'Sam');
  await page.goto('/topografie');
  await page
    .getByRole('region', { name: /Kies een onderwerp/ })
    .getByRole('button', { name: /^Provincies/ })
    .click();

  const hoe = page.getByRole('region', { name: /Hoe wil je/ });
  const manieren = hoe.getByRole('button');
  await expect(manieren.last()).toContainText('Topodiploma');
  await expect(hoe.locator('.tk-tegel-diploma')).toHaveCount(1);
});
