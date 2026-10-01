import { expect, test, type Page } from '@playwright/test';
import { aanEenBureau } from './maat';
import { signIn } from './naam';

/**
 * The front door's "Maak af" (ADR-115) and the table on Jij that was Onthouden's
 * (ADR-114, ADR-171).
 *
 * A round stopped halfway waits on the front door, says how far it got, and
 * picks up with only the questions it had not asked yet. And the table says
 * how often each place was answered, how much of that was right, and when.
 */

/** The provinces, pointed at: twelve questions, of which this answers one and stops. */
async function eenProvincieEnStop(page: Page) {
  await page.goto('/topografie');
  await page
    .getByRole('region', { name: /Kies een onderwerp/ })
    .getByRole('button', { name: /^Provincies/ })
    .click();
  await page
    .getByRole('region', { name: /Hoe wil je/ })
    .getByRole('button', { name: /Aanwijzen/ })
    .click();
  await page.locator('.tk-choose-start .tk-button-go').click();

  await expect(page.getByRole('button', { name: 'Limburg' })).toBeVisible();
  await page.getByRole('button', { name: 'Limburg' }).click();
  await expect(page.getByRole('button', { name: 'Volgende vraag' })).toBeVisible();
  await page.getByRole('button', { name: 'Stoppen' }).click();
  await expect(page.getByRole('heading', { name: 'Ronde klaar' })).toBeVisible();
}

test('a round stopped halfway is Nu doen, and asks only what was left', async ({ page }) => {
  await signIn(page, 'Lotte');

  // Nothing started yet: a new child gets the subjects, and Nu doen comes
  // once there is something to finish (ADR-204, ADR-250).
  const nu = page.getByRole('region', { name: 'Maak je ronde af' });
  // De vakken staan er alleen aan een bureau (ADR-251).
  await expect(page.getByRole('region', { name: 'Kies een vak' })).toHaveCount(
    aanEenBureau(page) ? 1 : 0,
  );
  await expect(nu).toHaveCount(0);

  await eenProvincieEnStop(page);
  await page.getByRole('button', { name: 'Terug naar Vandaag' }).click();

  // The round stopped halfway is Nu doen, at the top, with how far it got.
  await expect(nu).toContainText('Provincies van Nederland: nog 11 van de 12 vragen.');
  // De vakken staan er alleen aan een bureau; anders onder de tab Oefenen (ADR-251).
  await expect(page.getByRole('region', { name: 'Kies een vak' })).toHaveCount(
    aanEenBureau(page) ? 1 : 0,
  );
  await nu.getByRole('button', { name: 'Maak af' }).click();

  // Eleven questions, not twelve: stopping after one says so.
  await page.getByRole('button', { name: 'Ik weet het niet' }).click();
  await page.getByRole('button', { name: 'Volgende vraag' }).click();
  await page.getByRole('button', { name: 'Stoppen' }).click();
  await expect(page.getByText('Je stopte na 1 van de 11 vragen.')).toBeVisible();
});

/**
 * Stoppen voor de eerste vraag is geen ronde (ADR-236): geen "Ronde klaar",
 * geen nullen, alleen dat stoppen mag.
 */
test('stoppen voor de eerste vraag geeft geen uitslag met nullen', async ({ page }) => {
  await signIn(page, 'Mila');
  await page.goto('/topografie');
  await page
    .getByRole('region', { name: /Kies een onderwerp/ })
    .getByRole('button', { name: /^Provincies/ })
    .click();
  await page
    .getByRole('region', { name: /Hoe wil je/ })
    .getByRole('button', { name: /^Meerkeuze/ })
    .click();
  await page.locator('.tk-choose-start .tk-button-go').click();
  await page.getByRole('button', { name: 'Stoppen' }).click();

  await expect(page.getByRole('heading', { level: 1, name: 'Gestopt' })).toBeVisible();
  await expect(page.getByText('Je hebt nog niets beantwoord. Stoppen mag.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Ronde klaar' })).toHaveCount(0);
  await expect(page.getByText(/0 vragen/)).toHaveCount(0);
  await page.getByRole('button', { name: 'Nog een ronde' }).click();
  await expect(page.getByRole('button', { name: 'Stoppen' })).toBeVisible();
});

test('the table on Jij counts the answers, the share right, and the days since', async ({
  page,
}) => {
  await signIn(page, 'Siem');
  await eenProvincieEnStop(page);

  await page.goto('/jij');
  // De tabel staat sinds ADR-143 achter een knop: wat de pagina opent is het
  // beeld, en dit is de test over de tabel.
  await page.getByRole('button', { name: 'Laat de tabel zien' }).click();
  const tabel = page.getByRole('table');
  for (const kop of ['Onderdeel', 'Hoe het gaat', 'Keer gevraagd', '% goed', 'Laatst geoefend']) {
    await expect(tabel.getByRole('columnheader', { name: kop, exact: true })).toBeVisible();
  }
  await expect(tabel.getByRole('columnheader', { name: 'Weer op' })).toHaveCount(0);

  // One province answered today, the other eleven never.
  await expect(tabel.getByRole('cell', { name: 'vandaag', exact: true })).toHaveCount(1);

  // The four tiles are the four statuses; "Vandaag op de rol" is gone. In the
  // one subject's card: "Je geheugen" above it carries the same tiles since
  // ADR-171, over every subject.
  const blik = page.getByRole('region', { name: 'Alles in één blik' });
  await expect(page.getByText('Vandaag op de rol')).toHaveCount(0);
  await expect(blik.getByText('Bijna vergeten', { exact: true })).toBeVisible();
});

/**
 * De terugknop van de browser tijdens een ronde gaat echt terug (ADR-236).
 * Eerst veranderde alleen het adres, en bleef de ronde staan.
 */
test('de terugknop in een ronde gaat terug naar de vakpagina', async ({ page }) => {
  await signIn(page, 'Jip');
  await page.goto('/topografie');
  await page
    .getByRole('region', { name: /Kies een onderwerp/ })
    .getByRole('button', { name: /^Provincies/ })
    .click();
  await page
    .getByRole('region', { name: /Hoe wil je/ })
    .getByRole('button', { name: /^Meerkeuze/ })
    .click();
  await page.locator('.tk-choose-start .tk-button-go').click();
  await expect(page.getByRole('button', { name: 'Stoppen' })).toBeVisible();

  await page.goBack();
  await expect(page.getByRole('button', { name: 'Stoppen' })).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1, name: / oefenen$/ })).toBeVisible();
});
