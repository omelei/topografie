import { expect, test, type Page } from '@playwright/test';

/**
 * Drie pagina's naast de oefeningen: Vandaag, Jij en Premium (ADR-171).
 *
 * Onthouden is een deel van Jij geworden, want Jij is waar je al je cijfers
 * ziet. Voor ouders is weg: ouders loggen niet in, kinderen wel. Wat erop stond
 * en van het kind is — de schakelaars, de groep, de eigen woorden — staat op
 * Jij, en wat van de rekening of van de ouder is, met het account, op Premium
 * (ADR-172). Wat deze test vastlegt, is die indeling: waar alles staat, in
 * welke volgorde, en waar de oude adressen heen gaan.
 */

async function signIn(page: Page, naam: string) {
  await page.goto('/');
  await page.getByPlaceholder('Je naam').fill(naam);
  await page.getByRole('button', { name: 'Beginnen' }).click();
  // De groep is een tweede stap, altijd over te slaan (ADR-151).
  await page.getByRole('button', { name: 'Zeg ik niet' }).click();
  await expect(page.getByRole('banner').getByRole('button', { name: naam })).toBeVisible();
}

test('Jij draagt je diploma’s, al je cijfers en de instellingen, in die volgorde', async ({
  page,
}) => {
  await signIn(page, 'Noor');
  await page.goto('/jij');

  await expect(page.getByRole('heading', { level: 1, name: 'Jij' })).toBeVisible();
  // De zin onder de titel zegt wie er oefent en wat er op de pagina staat.
  await expect(page.locator('.tk-etalage-tekst').first()).toHaveText(
    'Je oefent als Noor. Hier staan je diploma’s, wat je onthoudt en hoe vaak je oefent.',
  );

  for (const blok of [
    'Wie oefent er?',
    'Jouw diploma’s',
    'Je geheugen',
    'Hoe vaak oefen je?',
    'Per vak',
    'Alles in één blik',
    'Instellingen',
    'Eigen woorden',
    'Alles van dit apparaat halen',
  ]) {
    await expect(page.getByRole('region', { name: blok, exact: true })).toBeVisible();
  }

  // Wat samengevoegd of verhuisd is, staat er niet meer als eigen blok
  // (ADR-172): de naam en de groep zijn rijen bij de instellingen, de regels
  // en de diploma-uitleg uitklappen, het schooljaar een printknop, het
  // weekbericht weg, en het account op Premium. De reeks staat nergens bij het
  // kind (ADR-169).
  for (const weg of [
    'Jouw naam',
    'Wanneer onthoud je iets?',
    'Hoe gaat het?',
    'Week na week',
    'Hoe haal je een diploma?',
    'Het schooljaar',
    'Je groep',
    'Account',
    'Premium',
    'De reeks',
  ]) {
    await expect(page.getByRole('region', { name: weg, exact: true }), weg).toHaveCount(0);
  }

  // Eerst wie er oefent, dan wat je gehaald hebt, dan of het blijft hangen, dan
  // wat je instelt, en als laatste de uitweg (ADR-172).
  const koppen = await page.locator('.tk-page-main h2').allInnerTexts();
  const plek = (kop: string) => koppen.findIndex((tekst) => tekst.startsWith(kop));
  expect(plek('Wie oefent er?')).toBeLessThan(plek('Jouw diploma’s'));
  expect(plek('Jouw diploma’s')).toBeLessThan(plek('Je geheugen'));
  expect(plek('Je geheugen')).toBeLessThan(plek('Instellingen'));
  expect(plek('Instellingen')).toBeLessThan(plek('Alles van dit apparaat halen'));
  expect(koppen.at(-1)).toBe('Alles van dit apparaat halen');
});

/**
 * Je naam wijzigen is een rij bij de instellingen (ADR-172). De naam zelf
 * staat in de kop; de rij zegt hem ook, en gaat open als je erop drukt.
 */
test('je naam wijzig je bij de instellingen', async ({ page }) => {
  await signIn(page, 'Fleur');
  await page.goto('/jij');

  const instellingen = page.getByRole('region', { name: 'Instellingen' });
  const rij = instellingen.getByRole('button', { name: /^Je naam/ });
  await expect(rij).toContainText('Fleur');
  await expect(rij).toHaveAttribute('aria-expanded', 'false');

  await rij.click();
  await expect(rij).toHaveAttribute('aria-expanded', 'true');
  const veld = instellingen.getByLabel('Je naam', { exact: true });
  await expect(veld).toBeFocused();
  await veld.fill('Floor');
  await instellingen.getByRole('button', { name: 'Bewaren' }).click();

  // Opnieuw geladen, en nergens staat de oude naam nog.
  await expect(page.getByRole('banner').getByRole('button', { name: 'Floor' })).toBeVisible();
  await expect(page.locator('.tk-etalage-tekst').first()).toContainText('Je oefent als Floor.');
});

test('de oude adressen komen uit waar het nu staat', async ({ page }) => {
  await signIn(page, 'Sam');

  // Onthouden is een deel van Jij.
  await page.goto('/onthouden');
  await expect(page).toHaveURL(/\/jij$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Jij' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Je geheugen' })).toBeVisible();

  // Voor ouders is opgegaan in Jij en Premium; het adres opent Premium.
  await page.goto('/ouder');
  await expect(page).toHaveURL(/\/premium$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Premium' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Voor ouders', level: 1 })).toHaveCount(0);
});

test('de navigatie gaat naar Vandaag, Jij en Premium', async ({ page }) => {
  await signIn(page, 'Ties');

  // Op elke maat staat één van de twee balken; welke, is CSS (Shell).
  const balk = page
    .getByRole('navigation', { name: 'Waar je heen kunt' })
    .filter({ visible: true });
  await expect(balk.getByRole('button')).toHaveText(['Vandaag', 'Jij', 'Premium']);

  await balk.getByRole('button', { name: 'Premium' }).click();
  await expect(page).toHaveURL(/\/premium$/);
  await expect(balk.getByRole('button', { name: 'Premium' })).toHaveAttribute(
    'aria-current',
    'page',
  );

  await balk.getByRole('button', { name: 'Jij' }).click();
  await expect(page).toHaveURL(/\/jij$/);
  await expect(page.getByRole('region', { name: 'Je geheugen' })).toBeVisible();

  // De groene knop in de balk is weg: Premium is nu een bestemming, en twee
  // knoppen naar dezelfde pagina is er één te veel.
  await expect(page.locator('.tk-premiumknop')).toHaveCount(0);
});

/**
 * "Ik wil geen doelen" op Vandaag zet het blok weg (ADR-162). De weg terug
 * stond op Voor ouders; nu is het een schakelaar bij de instellingen op Jij.
 */
test('de doelen gaan uit op Vandaag en weer aan op Jij', async ({ page }) => {
  await signIn(page, 'Mila');

  const doelen = page.getByRole('region', { name: 'Je doelen voor deze week' });
  await expect(doelen).toBeVisible();
  await doelen.getByRole('button', { name: 'Ik wil geen doelen' }).click();
  await expect(doelen).toHaveCount(0);

  await page.goto('/jij');
  const schakelaar = page
    .getByRole('region', { name: 'Instellingen' })
    .getByRole('button', { name: /Doelen voor deze week/ });
  await expect(schakelaar).toHaveAttribute('aria-pressed', 'false');
  await schakelaar.click();
  await expect(schakelaar).toHaveAttribute('aria-pressed', 'true');

  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Je doelen voor deze week' })).toBeVisible();
});

/**
 * Alles van dit apparaat halen (ADR-166).
 *
 * De belofte van dit product is dat de voortgang op het apparaat blijft. Deze
 * test legt vast wat die belofte waard maakt: dat je er ook bij kunt. In twee
 * stappen, met een uitweg, en daarna is het kind er echt niet meer — de app
 * opent weer op de vraag naar een naam.
 */
test('alles gaat van dit apparaat af, in twee stappen', async ({ page }) => {
  await signIn(page, 'Loes');
  await page.goto('/jij');

  const blok = page.getByRole('region', { name: 'Alles van dit apparaat halen' });
  await expect(blok).toBeVisible();

  // Eén druk wist nog niets: er komt eerst te staan wat er weggaat.
  await blok.getByRole('button', { name: 'Alles wissen' }).click();
  await expect(blok).toContainText('Dit kan niet ongedaan gemaakt worden.');

  // En de uitweg brengt je terug zonder dat er iets gebeurd is.
  await blok.getByRole('button', { name: 'Laat maar staan' }).click();
  await expect(blok.getByRole('button', { name: 'Alles wissen' })).toBeVisible();

  await page.goto('/');
  await expect(page.getByRole('banner').getByRole('button', { name: 'Loes' })).toBeVisible();

  // En dan echt.
  await page.goto('/jij');
  await blok.getByRole('button', { name: 'Alles wissen' }).click();
  await blok.getByRole('button', { name: 'Ja, haal alles weg' }).click();

  // Terug bij het begin: geen kind meer, en dus weer de vraag naar een naam.
  await expect(page.getByPlaceholder('Je naam')).toBeVisible();
  await expect(page.getByRole('banner').getByRole('button', { name: 'Loes' })).toHaveCount(0);
});
