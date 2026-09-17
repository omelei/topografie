import { expect, test, type Page } from '@playwright/test';

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
  await page.getByRole('button', { name: 'Weet ik niet' }).click();
  await expect(page.getByRole('banner').getByRole('button', { name: naam })).toBeVisible();
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
  await expect(muur.getByRole('button')).toHaveCount(11);
  await muur.getByRole('button', { name: 'Waddeneilanden: nog geen topodiploma' }).click();

  const hoe = page.getByRole('region', { name: /Hoe wil je/ });
  await expect(hoe.getByRole('button', { name: /^Topodiploma/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.locator('.tk-choose-start button').click();

  // Afzwemmen first (ADR-149): what it asks, and that a page nobody practised
  // is not ripe. Proefzwemmen still says how it went.
  await expect(page.getByRole('heading', { name: /^Afzwemmen: / })).toBeVisible();
  await expect(page.getByText('Nog niet klaar om af te zwemmen')).toBeVisible();
  await page.getByRole('button', { name: 'Proefzwemmen' }).click();

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
  await expect(page.getByText(/^Dit was proefzwemmen\./)).toBeVisible();
  await expect(page.getByText('Cijfer', { exact: true })).toBeVisible();

  // And on the child's own page, as pictures rather than buttons.
  await page.goto('/jij');
  // De muur staat sinds ADR-143 achter een knop: de pagina opent met wat je
  // hebt, en dit is de test over de hele muur.
  await page.getByRole('button', { name: 'Laat zien wat er nog te halen is' }).click();
  const verzameling = page.getByRole('region', { name: 'Jouw topodiploma’s' });
  await expect(verzameling.getByRole('img')).toHaveCount(11);
  await expect(
    page.getByRole('region', { name: 'Jouw klokdiploma’s' }).getByRole('img'),
  ).toHaveCount(4);
});
