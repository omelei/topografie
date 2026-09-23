import { expect, test, type Page } from '@playwright/test';

/**
 * Two children on one device, ADR-046.
 *
 * This is the failure that was already in the schema rather than a feature
 * anybody asked for: `itemStates` was keyed by item alone, so a family iPad had
 * one set of Leitner boxes and the youngest kept meeting the eldest's
 * provinces. Nobody would have seen it as a bug — they would have seen a
 * forecast that was quietly wrong.
 *
 * So what is worth asserting is separation, not the buttons: one child's answer
 * must not appear in the other's progress, and one child's streak must not keep
 * the other's going.
 *
 * **Sinds ADR-173 gaat het wisselen via de balk** in plaats van via een blok op
 * Jij, en het zit niet meer achter premium: drie kinderen zijn gratis. Wat deze
 * test vastlegt verandert daar niet door — alleen waar je drukt.
 */

async function signIn(page: Page, naam: string) {
  await page.goto('/');
  await page.getByPlaceholder('Je naam').fill(naam);
  await page.getByRole('button', { name: 'Beginnen' }).click();
  // De groep is een tweede stap, altijd over te slaan (ADR-151).
  await page.getByRole('button', { name: 'Zeg ik niet' }).click();
  // The name is in the app bar now, beside the streak — K1 puts the profile
  // switch top right, so that is where "you are signed in" is visible.
  await expect(page.getByRole('banner').getByRole('button', { name: naam })).toBeVisible();
}

async function answerOne(page: Page) {
  await page.goto('/');
  await page.goto('/topografie');
  await page
    .getByRole('region', { name: /Kies een onderwerp/ })
    .getByRole('button', { name: /^Provincies/ })
    .click();
  await page
    .getByRole('region', { name: /Hoe wil je/ })
    .getByRole('button', { name: /Aanwijzen/ })
    .click();
  // The wrapper rather than the label: the label is the combination in words
  // and its measure comes from the round, so matching on "vragen" was quietly
  // asserting which modes exist — and one of the mode cards ends in it too.
  await page.locator('.tk-choose-start button').click();

  await expect(page.getByRole('button', { name: 'Limburg' })).toBeVisible();
  await page.getByRole('button', { name: 'Limburg' }).click();
  await expect(page.getByRole('button', { name: 'Volgende vraag' })).toBeVisible();

  await page.getByRole('button', { name: 'Stoppen' }).click();
  await expect(page.getByRole('heading', { name: 'Ronde klaar' })).toBeVisible();

  // De beloning wordt na de ronde weggeschreven en het uitslagscherm wacht daar
  // niet op, dus nu weglopen zou met die schrijfactie racen. De samenvatting is
  // het scherm dat zegt dat de ronde geland is.
  await expect(page.getByRole('region', { name: 'Hoe de ronde ging' })).toBeVisible();
}

/** De wisselaar in de balk: de ene plek waar je van profiel wisselt (ADR-173). */
function wisselaar(page: Page) {
  return page.getByRole('button', { name: /Wissel van profiel/ });
}

async function addChild(page: Page, naam: string) {
  await wisselaar(page).click();
  await page.getByRole('button', { name: 'Nog een kind erbij' }).click();
  await page.getByLabel('Naam van het kind').fill(naam);
  await page.getByRole('button', { name: 'Toevoegen', exact: true }).click();

  // Adding reloads, on purpose: every screen holds some of a child's work in
  // React state and none of it may survive the handover.
  await expect(page.getByRole('banner').getByRole('button', { name: naam })).toBeVisible();
}

test('a second child starts with nothing, and the first keeps everything', async ({ page }) => {
  await signIn(page, 'Anne');
  await answerOne(page);

  // One province has left the pile of things Anne has never seen. The boxes are
  // what this test is about; the streak is keyed the same way and is not
  // asserted here because the app bar drops it on a phone, and a check that
  // only runs at three of the six sizes is worse than one that says less.
  await page.goto('/jij');
  await page.getByRole('button', { name: 'Laat de tabel zien' }).click();
  await expect(page.getByRole('table').getByText('nog aan het oefenen').first()).toBeVisible();

  await addChild(page, 'Bram');

  // Bram starts at nothing: his own boxes, and they are empty.
  await page.goto('/');
  await expect(page.getByRole('banner').getByRole('button', { name: 'Bram' })).toBeVisible();

  await page.goto('/jij');
  // De tabel open, anders bewijst "nul rijen" niets: zonder knop staat er
  // sowieso geen tabel (ADR-143).
  await page.getByRole('button', { name: 'Laat de tabel zien' }).click();
  await expect(page.getByRole('table').getByText('nog aan het oefenen')).toHaveCount(0);

  // And handing the device back gives Anne hers, unchanged.
  await wisselaar(page).click();
  await page.getByRole('button', { name: /Geef Anne de beurt/ }).click();
  await expect(page.getByRole('banner').getByRole('button', { name: 'Anne' })).toBeVisible();

  await page.goto('/jij');
  await page.getByRole('button', { name: 'Laat de tabel zien' }).click();
  await expect(page.getByRole('table').getByText('nog aan het oefenen').first()).toBeVisible();
});

test('the child practising is the one the switcher says', async ({ page }) => {
  await signIn(page, 'Iris');
  await addChild(page, 'Tijn');

  await wisselaar(page).click();
  const venster = page.getByRole('dialog');
  const tijn = venster.getByRole('button', { name: /Tijn/ });
  const iris = venster.getByRole('button', { name: /Iris/ });

  await expect(tijn).toHaveAttribute('aria-pressed', 'true');
  await expect(iris).toHaveAttribute('aria-pressed', 'false');

  // The one practising cannot be handed the turn again: there is nothing to do
  // and a control that does nothing is a control that lies.
  await expect(tijn).toBeDisabled();
});

/**
 * Drie kinderen per apparaat, en dat is een grens in de opslag en niet alleen
 * een knop die verdwijnt (ADR-173).
 */
test('er kunnen drie kinderen op een apparaat, en daarna zegt het dat', async ({ page }) => {
  await signIn(page, 'Een');
  await addChild(page, 'Twee');
  await addChild(page, 'Drie');

  await wisselaar(page).click();
  const venster = page.getByRole('dialog');
  await expect(venster.getByRole('button', { name: 'Nog een kind erbij' })).toHaveCount(0);
  await expect(venster).toContainText('Er passen 3 kinderen op dit apparaat');
});
