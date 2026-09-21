import { expect, test, type Page } from '@playwright/test';

/**
 * De grens tussen kind en ouder, door het hele product (ADR-143). Sinds ADR-171
 * is er geen ouderpagina meer, en ligt de grens tussen Jij en Premium.
 *
 * ADR-136 trok die grens op één pagina. Deze test kijkt naar de plekken waar
 * hij daarna nog scheef lag: een prijzenkast die drieënveertig lege vakjes
 * toonde, een tabel met percentages in het menu van het kind, en een ouderkolom
 * die de ouder aansprak alsof hij het kind was.
 *
 * ADR-158 loste het eerste op door de kast naar de ouder te schuiven. Nu het
 * diploma zelf de beloning is, komt hij terug bij het kind — en wordt hetzelfde
 * probleem anders opgelost: niet door het raster te verbergen, maar door niet
 * te stapelen en nergens een nul af te drukken.
 */

async function signIn(page: Page, naam: string) {
  await page.goto('/');
  await page.getByPlaceholder('Je naam').fill(naam);
  await page.getByRole('button', { name: 'Beginnen' }).click();
  // De groep is een tweede stap, altijd over te slaan (ADR-151).
  await page.getByRole('button', { name: 'Zeg ik niet' }).click();
  await expect(page.getByRole('banner').getByRole('button', { name: naam })).toBeVisible();
}

test('Jij toont de kast op dag één zonder ergens een nul af te drukken', async ({ page }) => {
  await signIn(page, 'Fien');
  await page.goto('/jij');

  const kast = page.getByRole('region', { name: 'Jouw diploma’s' });
  await expect(kast).toBeVisible();

  // Eén vak open en de rest als regel: de kaarten van één vak in beeld en niet
  // die van alle vijf. Het bezwaar van ADR-158 ging over stapelen — "vier lege
  // wanden met een kop erboven" — en dit is de ingreep. Wat een kind zonder
  // code ziet, staat in premium.spec.
  await expect(kast.getByRole('region', { name: 'Rekenen' })).toBeVisible();
  // Tweeëndertig sinds ADR-168: de twaalf tafels en de twintig andere rekensets.
  await expect(kast.locator('.tk-diploma')).toHaveCount(32);
  await expect(kast.getByRole('button', { name: /^Vlaggen / })).toBeVisible();

  // En nergens een telling die nul is. Een kop die de afwezigheid uitrekent, is
  // wat "je hebt niets" letterlijk op het scherm zet; daar staat de uitnodiging.
  await expect(page.getByText('0 van de 12 gehaald')).toHaveCount(0);
  await expect(kast).toContainText('Hier komen je diploma’s te hangen.');

  // De regel die hier stond, staat sinds ADR-177 in de uitleg één druk verder:
  // hij legde één voorwaarde uit op de plek waar een kind zijn stand komt
  // lezen, terwijl de uitleg die de vraag beantwoordt eronder stond.
  await expect(kast.getByText(/telt mee als je het drie keer/)).toHaveCount(0);
  await expect(kast.getByText('Nog niet', { exact: true })).toHaveCount(32);
});

test('Jij toont de diploma’s van dit kind, met de uitleg erbij', async ({ page }) => {
  await signIn(page, 'Bram');
  await page.goto('/jij');
  const kast = page.getByRole('region', { name: 'Jouw diploma’s' });
  await expect(kast).toBeVisible();

  // Hoe je een diploma haalt, staat in de kast, één druk verder (ADR-172), en
  // sinds ADR-177 in vijf stappen die de vraag in de titel beantwoorden: van
  // kiezen tot printen, en niet beginnend bij de uitzondering.
  await expect(kast).not.toContainText('Is de ring helemaal vol?');
  await kast.getByRole('button', { name: 'Hoe haal je een diploma?' }).click();
  await expect(kast).toContainText('Kies een diploma. Bijvoorbeeld de tafel van 6.');
  await expect(kast).toContainText('Is de ring helemaal vol? Dan mag je de toets doen.');
  await expect(kast).toContainText('Dan is het diploma van jou.');

  // Het schooljaar is een printknop in de kast, en pas als er iets gehaald is:
  // op dag één is er geen blad om te printen (ADR-172). De reeks staat nergens
  // bij het kind: dat is verlies-als-prikkel (ADR-169).
  await expect(page.getByRole('region', { name: 'Het schooljaar' })).toHaveCount(0);
  await expect(kast.getByRole('button', { name: /Print je diploma’s/ })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'De reeks' })).toHaveCount(0);

  // Geen held meer, en geen badges (ADR-149).
  await expect(page.getByRole('region', { name: 'Jouw held' })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Jouw badges' })).toHaveCount(0);
});

test('de tabel op Jij staat achter een knop', async ({ page }) => {
  await signIn(page, 'Tess');
  await page.goto('/jij');

  // Het beeld staat er meteen; de tabel met percentages en de voorspelling niet.
  await expect(page.getByRole('region', { name: 'Alles in één blik' })).toBeVisible();
  await expect(page.getByRole('table')).toHaveCount(0);

  await page.getByRole('button', { name: 'Laat de tabel zien' }).click();
  await expect(page.getByRole('table')).toBeVisible();
});

// "Voor ouders spreekt de ouder aan" stond hier. Die pagina is weg (ADR-171):
// ouders loggen niet in, kinderen wel. Wat er nog van te toetsen valt — geen
// kolom naast een pagina — staat hieronder.
test('er staat nergens een kolom naast een pagina', async ({ page }) => {
  await signIn(page, 'Noor');
  for (const pad of ['/', '/jij', '/premium']) {
    await page.goto(pad);
    await expect(page.locator('.tk-home-aside')).toHaveCount(0);
  }
});
