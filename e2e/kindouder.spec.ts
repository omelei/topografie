import { expect, test, type Page } from '@playwright/test';

/**
 * De grens tussen kind en ouder, door het hele product (ADR-143).
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

  // Eén vak open en de rest als regel: twaalf kaarten in beeld en niet
  // drieëndertig. Het bezwaar van ADR-158 ging over stapelen — "vier lege
  // wanden met een kop erboven" — en dit is de ingreep. Wat een kind zonder
  // code ziet, staat in premium.spec.
  await expect(kast.getByRole('region', { name: 'Rekenen' })).toBeVisible();
  await expect(kast.locator('.tk-diploma')).toHaveCount(12);
  await expect(kast.getByRole('button', { name: /^Vlaggen / })).toBeVisible();

  // En nergens een telling die nul is. Een kop die de afwezigheid uitrekent, is
  // wat "je hebt niets" letterlijk op het scherm zet; daar staat de uitnodiging.
  await expect(page.getByText('0 van de 12 gehaald')).toHaveCount(0);
  await expect(kast).toContainText('Hier komen je diploma’s te hangen.');

  // De regel staat er één keer en niet op elke kaart: twaalf keer dezelfde zin
  // onder elkaar is geen uitleg maar een muur waarin de kaarten verdwijnen.
  await expect(kast.getByText(/Een onderdeel telt mee als je het drie keer/)).toHaveCount(1);
  await expect(kast.getByText('Nog niet', { exact: true })).toHaveCount(12);
});

test('de kast staat op Jij en niet meer bij de ouder, met één vak open', async ({ page }) => {
  await signIn(page, 'Fien');

  // Voor ouders draagt geen raster meer. ADR-158 zette het daar omdat een
  // diploma een toets is en dus hoort bij wie hem afneemt; zodra het diploma
  // zelf de beloning is keert die redenering om.
  await page.goto('/ouder');
  await expect(page.locator('.tk-diploma')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Laat zien wat er nog te halen is' })).toHaveCount(
    0,
  );

  // Op Jij staat hij wél, met één vak open: het bezwaar van ADR-158 ging over
  // stapelen, niet over een onverdiend vakje.
  await page.goto('/jij');
  const kast = page.getByRole('region', { name: 'Jouw diploma’s' });
  await expect(kast).toBeVisible();
  await expect(kast.getByRole('region', { name: 'Rekenen' })).toBeVisible();
  await expect(kast.locator('.tk-diploma')).toHaveCount(12);
});

test('Jij toont de toren en het schooljaar van dit kind', async ({ page }) => {
  await signIn(page, 'Bram');
  await page.goto('/jij');
  await expect(page.getByRole('region', { name: 'Je toren' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Jouw schooljaar' })).toBeVisible();
  // Geen held meer, en geen badges (ADR-149).
  await expect(page.getByRole('region', { name: 'Jouw held' })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Jouw badges' })).toHaveCount(0);
});

test('de tabel op Onthouden staat achter een knop', async ({ page }) => {
  await signIn(page, 'Tess');
  await page.goto('/onthouden');

  // Het beeld staat er meteen; de tabel met percentages en de voorspelling niet.
  await expect(page.getByRole('heading', { name: 'Alles in één blik' })).toBeVisible();
  await expect(page.getByRole('table')).toHaveCount(0);

  await page.getByRole('button', { name: 'Laat de tabel zien' }).click();
  await expect(page.getByRole('table')).toBeVisible();
});

test('Voor ouders spreekt de ouder aan, niet het kind', async ({ page }) => {
  await signIn(page, 'Noor');
  await page.goto('/ouder');

  // Het cijfer en de favorieten van het kind horen op de pagina's van het kind
  // en staan hier dus niet. Hoe de toren eruitziet wel: dat stelt een ouder in
  // (ADR-158).
  await expect(page.getByRole('region', { name: 'Jouw week' })).toHaveCount(0);
  await expect(page.getByRole('group', { name: 'Hoe de toren eruitziet' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Jouw favorieten' })).toHaveCount(0);

  // Er staat helemaal geen kolom meer naast deze pagina (ADR-162): wat erin
  // stond voor de ouder waren de toetsen, en die zijn weg.
  await expect(page.locator('.tk-home-aside')).toHaveCount(0);

  // De doelen van deze week staan hier wél: een ouder mag er een bij zetten,
  // en hij is degene die ze uit kan zetten (ADR-162).
  await expect(page.getByRole('region', { name: 'Doelen van Noor voor deze week' })).toBeVisible();

  // En er is een weg naar het detail, dat hiervoor alleen in het menu van het
  // kind stond.
  await page.getByRole('button', { name: /Bekijk wat je kind onthoudt/ }).click();
  await expect(page.getByRole('heading', { name: 'Wat je onthoudt' })).toBeVisible();
});
