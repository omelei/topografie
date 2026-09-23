import { expect, test, type Page } from '@playwright/test';
import { langsDePoort, stubGezin } from './gezin';

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

/**
 * De ouderpagina openen: de wisselaar in de balk, de rij met het hangslot, en
 * een verse pincode (ADR-173). Op een leeg apparaat is er nog geen pincode, dus
 * is hem maken ook meteen hem opendoen.
 */
async function naarOuder(page: Page) {
  await stubGezin(page);
  await page
    .getByRole('banner')
    .getByRole('button', { name: /Wissel van profiel/ })
    .click();
  await page.getByRole('button', { name: 'Ouder' }).click();
  await langsDePoort(page);
  await page.getByLabel('Nieuwe pincode').fill('1234');
  await page.getByLabel('Nog een keer').fill('1234');
  await page.getByRole('button', { name: 'Bewaren', exact: true }).click();
  await expect(page).toHaveURL(/\/ouder$/);
}

test('Jij draagt je instellingen, je diploma’s en al je cijfers, in die volgorde', async ({
  page,
}) => {
  await signIn(page, 'Noor');
  await page.goto('/jij');

  await expect(page.getByRole('heading', { level: 1, name: 'Jij' })).toBeVisible();
  // De zin onder de titel zegt wie er oefent en wat er op de pagina staat.
  await expect(page.locator('.tk-etalage-tekst').first()).toHaveText(
    'Je oefent als Noor. Hieronder vind je je instellingen, jouw diploma’s, welke stof je beheerst en hoe vaak je oefent.',
  );

  for (const blok of [
    'Instellingen',
    'Jouw diploma’s',
    'Je geheugen',
    'Hoe vaak oefen je?',
    'Alles in één blik',
    'Eigen woorden',
  ]) {
    await expect(page.getByRole('region', { name: blok, exact: true })).toBeVisible();
  }

  // En wat naar de ouder is verhuisd, staat hier niet meer (ADR-173): wisselen
  // is de knop in de balk geworden, en het wissen zit achter de pincode.
  for (const weg of ['Wie oefent er?', 'Alles van dit apparaat halen']) {
    await expect(page.getByRole('region', { name: weg, exact: true })).toHaveCount(0);
  }

  // Wat samengevoegd of verhuisd is, staat er niet meer als eigen blok
  // (ADR-172): de naam en de groep zijn rijen bij de instellingen, de regels
  // en de diploma-uitleg uitklappen, het schooljaar een printknop, het
  // weekbericht weg, en het account bij de ouder (ADR-173). De reeks staat
  // nergens bij het kind (ADR-169).
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
    // Per vak en Per onderwerp zijn de zoom binnen Je geheugen geworden
    // (ADR-177): drie koppen voor ver, middel en dichtbij lazen als drie
    // onderwerpen.
    'Per vak',
    'Per onderwerp',
  ]) {
    await expect(page.getByRole('region', { name: weg, exact: true }), weg).toHaveCount(0);
  }

  // Wie je bent, dan wat je gehaald hebt, dan of het blijft hangen (ADR-177).
  // De instellingen stonden onderaan sinds ADR-172, met acht blokken tussen de
  // naam en de diploma's als reden; het zijn er nu twee, en er is een avatar
  // bij gekomen die op een pagina die "Jij" heet bovenaan hoort.
  const koppen = await page.locator('.tk-page-main h2').allInnerTexts();
  const plek = (kop: string) => koppen.findIndex((tekst) => tekst.startsWith(kop));
  expect(plek('Instellingen')).toBeLessThan(plek('Jouw diploma’s'));
  expect(plek('Jouw diploma’s')).toBeLessThan(plek('Je geheugen'));
  expect(koppen.at(0)).toBe('Instellingen');
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

  // En /ouder wijst weer naar zichzelf (ADR-173). Wie er zonder pincode komt,
  // krijgt de deur en niet de pagina — en ook niet een omleiding, want een adres
  // dat alleen bestaat als je er mag komen, laat de terugknop liegen.
  await page.goto('/ouder');
  await expect(page).toHaveURL(/\/ouder$/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Dit is de ouderpagina' }),
  ).toBeVisible();
  await expect(page.getByRole('region', { name: 'Je kinderen' })).toHaveCount(0);
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
 * staat sinds ADR-173 bij de ouder: of de app het kind ergens toe aanzet, is
 * een besluit van de ouder en niet van wie aangezet wordt.
 */
test('de doelen gaan uit op Vandaag en weer aan bij de ouder', async ({ page }) => {
  await signIn(page, 'Mila');

  const doelen = page.getByRole('region', { name: 'Je doelen voor deze week' });
  await expect(doelen).toBeVisible();
  await doelen.getByRole('button', { name: 'Ik wil geen doelen' }).click();
  await expect(doelen).toHaveCount(0);

  await naarOuder(page);
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
  await naarOuder(page);

  const blok = page.getByRole('region', { name: 'Alles van dit apparaat halen' });
  await expect(blok).toBeVisible();

  // Eén druk wist nog niets: er komt eerst te staan wat er weggaat.
  await blok.getByRole('button', { name: 'Alles wissen' }).click();
  await expect(blok).toContainText('Je kunt dit niet terugdraaien.');

  // En de uitweg brengt je terug zonder dat er iets gebeurd is.
  await blok.getByRole('button', { name: 'Laat maar staan' }).click();
  await expect(blok.getByRole('button', { name: 'Alles wissen' })).toBeVisible();

  await page.goto('/');
  await expect(page.getByRole('banner').getByRole('button', { name: 'Loes' })).toBeVisible();

  // En dan echt. De sessie van de ouder staat in `sessionStorage` en overleeft
  // dus een adreswissel in hetzelfde tabblad (ADR-173): de deur hoeft niet nog
  // een keer open.
  await page.goto('/ouder');
  await blok.getByRole('button', { name: 'Alles wissen' }).click();
  await blok.getByRole('button', { name: 'Ja, haal alles weg' }).click();

  // Terug bij het begin: geen kind meer, en dus weer de vraag naar een naam.
  await expect(page.getByPlaceholder('Je naam')).toBeVisible();
  await expect(page.getByRole('banner').getByRole('button', { name: 'Loes' })).toHaveCount(0);
});
