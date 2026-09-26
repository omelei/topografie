import { expect, test, type Page } from '@playwright/test';
import { antwoord, GEZIN, herstelLink, langsDePoort, stubGezin } from './gezin';
import { signIn } from './naam';

/**
 * The screens of the design, photographed at every size the app claims to work
 * at.
 *
 * Spec section 8 asks for this, and it is the one check nothing else covers.
 * The a11y and flow specs prove a control exists and can be reached; neither of
 * them can see that the map is letterboxed on a phone, that the question card
 * has landed on top of Limburg, or that a heading has wrapped to three lines on
 * the Chromebook. Those are the bugs this build has actually shipped, and they
 * were all found by looking.
 *
 * The files land in `screenshots/` and CI uploads them, so a size can be
 * inspected without owning the device — which, for the Android and iPad cases,
 * nobody here does.
 *
 * These assert almost nothing on purpose. A screenshot test that fails on a
 * pixel is a test that gets disabled; what makes this useful is that the images
 * are current on every run, not that they are compared to yesterday's.
 */

const READY = { timeout: 15_000 };

async function shoot(page: Page, project: string, naam: string) {
  await page.screenshot({ path: `screenshots/${project}-${naam}.png`, fullPage: false });
}

async function chooseAndStart(page: Page, way: RegExp) {
  await page.goto('/topografie');
  await expect(page.getByRole('heading', { name: /^Wat wil je oefenen,/ })).toBeVisible();

  // Nothing is chosen for the child any more, so the subject is pressed too.
  await page
    .getByRole('region', { name: /Kies een onderwerp/ })
    .getByRole('button', { name: /^Provincies/ })
    .click();
  const how = page.getByRole('region', { name: /Hoe wil je/ });
  await how.getByRole('button', { name: way }).click();
  await start(page);
}

/** The one way out of K2, whatever was chosen. See e2e/app.spec.ts. */
async function start(page: Page) {
  await page.locator('.tk-choose-start button').click();
}

test('the front door, the chooser and the profile', async ({ page }, testInfo) => {
  const size = testInfo.project.name;

  // De voordeur voor wie nog geen naam heeft (ADR-229): het naamscherm dat
  // hier stond, is er niet meer. Wachten op de vraag naar de groep, die pas
  // staat als het kind gelezen is.
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Hoi!' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'In welke groep zit je?' })).toBeVisible();
  await shoot(page, size, '01-zonder-naam');

  // Jij zonder naam: de vraag bovenaan.
  await page.goto('/jij');
  await expect(page.getByRole('form', { name: 'Hoe heet je?' })).toBeVisible();
  await shoot(page, size, '01-jij-zonder-naam');

  await signIn(page, 'Fenna');
  // De voordeur leest uit IndexedDB, en op WebKit — beide iPads en de iPhone —
  // duurt die lezing langer dan een schermafdruk die meteen na de naam wordt
  // genomen. Wachten op de rij waar een kind mee begint: die is het eerste blok
  // van de pagina en staat er pas als de geschiedenis gelezen is (ADR-162).
  await expect(page.getByRole('group', { name: 'Hier begin je mee vandaag' })).toBeVisible();
  // En op de doelen, die hun eigen lezingen doen en anders net na de foto
  // verschijnen.
  await expect(page.getByRole('region', { name: 'Je doelen voor deze week' })).toBeVisible();
  await shoot(page, size, '02-thuis');

  await page.goto('/topografie');
  await expect(page.getByRole('heading', { name: /^Wat wil je oefenen,/ })).toBeVisible();
  await shoot(page, size, '03-kiezen');

  // Jij carries the diplomas, which since ADR-167 are the whole reward
  // programme — so it is the page that has to survive being mostly empty: a
  // new child has none of them. Since ADR-172 they are the first block under
  // the heading, so this photo is them.
  await page.goto('/jij');
  await expect(page.getByRole('heading', { name: 'Jij', exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Jouw diploma’s' })).toBeVisible();
  await shoot(page, size, '04-jij');

  // Wat Onthouden was, staat sinds ADR-171 op Jij, onder de diploma's
  // (ADR-172): de foto begint bij de cijfers, zodat de PR laat zien hoe "Je
  // geheugen" eruitziet, met de regel erboven en de uitklap eronder.
  const geheugen = page.getByRole('region', { name: 'Je geheugen' });
  await expect(geheugen).toBeVisible();
  await geheugen.scrollIntoViewIfNeeded();
  await shoot(page, size, '12-jij-cijfers');

  // De instellingen, met je naam en je groep als rij erbij (ADR-172) en sinds
  // ADR-177 bovenaan, en de groep open: zo ziet een rij eruit die iets
  // openklapt.
  const instellingen = page.getByRole('region', { name: 'Instellingen' });
  await instellingen.getByRole('button', { name: /^Je groep/ }).click();
  await expect(instellingen.getByRole('group', { name: 'In welke groep zit je?' })).toBeVisible();
  await instellingen.scrollIntoViewIfNeeded();
  await shoot(page, size, '20-jij-instellingen');

  // En de avatarkiezer open (ADR-177): acht vormen, want de kleuren van dit
  // product zijn bezet. De echte tekeningen komen later; deze foto is waar ze
  // terechtkomen.
  await instellingen.getByRole('button', { name: /^Je groep/ }).click();
  await instellingen.getByRole('button', { name: /^Je avatar/ }).click();
  await expect(instellingen.getByRole('group', { name: 'Kies je avatar' })).toBeVisible();
  await instellingen.scrollIntoViewIfNeeded();
  await shoot(page, size, '26-avatar');

  // Een modulepagina met een set gekozen zegt één ding over het leren: wat er
  // hier vandaag terugkomt, want alleen wat terugkomt kan onthouden raken.
  await page.goto('/topografie/provincies');
  const terug = page.getByText(
    /komt hier vandaag terug|komen hier vandaag terug|voorlopig niets terug|Morgen \d+/,
  );
  await expect(terug.first()).toBeVisible(READY);
  await terug.first().scrollIntoViewIfNeeded();
  await shoot(page, size, '17-moduleterug');
});

/**
 * K3 and K4 in one pass, because the point of K4 is that nothing moves except
 * the words — and two pictures taken a second apart are how you see that.
 */
/**
 * De ouderpagina en de wisselaar (ADR-173): twee schermen die nergens anders
 * gefotografeerd worden, en waarvan het venster op een telefoon tegen de
 * onderrand staat — precies waar ADR-163 al op wees.
 */
/**
 * Het venster dat een slot opent (ADR-163, ADR-174). Op een telefoon staat het
 * tegen de onderrand, en de drie uitwegen moeten daar naast elkaar leesbaar
 * blijven — dat is wat deze foto's laten zien.
 */
test.describe('zonder code', () => {
  // De rest van dit bestand draait mét code (`playwright.config.ts`), en dan
  // start de bliksemronde gewoon. Het slot is wat een kind zonder code ziet.
  test.use({ storageState: { cookies: [], origins: [] } });

  test('the parent question, and sending it on', async ({ page }, testInfo) => {
    const size = testInfo.project.name;
    await signIn(page, 'Sanne');

    await page.goto('/topografie');
    await page
      .getByRole('region', { name: /Kies een onderwerp/ })
      .getByRole('button', { name: /^Provincies/ })
      .click();
    await page
      .getByRole('region', { name: /Hoe wil je/ })
      .getByRole('button', { name: /^Bliksemronde/ })
      .click();

    const venster = page.getByRole('dialog', { name: 'Vraag het even aan je ouders' });
    await expect(venster).toBeVisible(READY);
    await shoot(page, size, '24-ouder-vraag');

    await venster.getByRole('button', { name: 'Vraag mijn ouders om een code' }).click();
    await expect(venster.getByRole('button', { name: 'Versturen' })).toBeVisible(READY);
    await shoot(page, size, '25-doorsturen');
  });
});

test('the switcher and the parent page', async ({ page }, testInfo) => {
  const size = testInfo.project.name;
  await stubGezin(page);
  await page.route(`${GEZIN}/rest/v1/kinderen**`, (route) => antwoord(route, 200, []));
  await signIn(page, 'Noor');

  await page
    .getByRole('banner')
    .getByRole('button', { name: /Wissel van profiel/ })
    .click();
  await expect(page.getByRole('heading', { name: 'Wie gebruikt de app?' })).toBeVisible(READY);
  await shoot(page, size, '21-wisselaar');

  // De poort vóór de pincode. Deze bouw heeft een gezinsproject, dus het is het
  // account (ADR-178); zonder project staat hier het geboortejaar.
  await page.getByRole('button', { name: 'Ouder' }).click();
  await expect(page.getByRole('heading', { name: 'Maak een ouderaccount' })).toBeVisible(READY);
  await shoot(page, size, '22-ouderpoort');

  await langsDePoort(page);
  await expect(page.getByRole('heading', { name: 'Maak een ouderpagina' })).toBeVisible(READY);
  await shoot(page, size, '22b-ouderslot');

  await page.getByLabel('Nieuwe pincode').fill('1234');
  await page.getByLabel('Nog een keer').fill('1234');
  await page.getByRole('button', { name: 'Bewaren', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Je kinderen', exact: true })).toBeVisible(READY);
  await shoot(page, size, '23-ouder');

  // Het blok waarmee een ouder zijn kinderen meeneemt naar het account (ADR-187).
  const overname = page.getByRole('region', { name: 'Kinderen in je account' });
  await expect(overname).toContainText('oefent op dit apparaat', READY);
  await overname.scrollIntoViewIfNeeded();
  await shoot(page, size, '23c-overname');
});

/** Waar de link uit een herstelmail op uitkomt (ADR-186): een scherm zonder balk. */
test('a new password from the link in the mail', async ({ page }, testInfo) => {
  const size = testInfo.project.name;
  await page.goto(herstelLink());
  await expect(page.getByRole('heading', { name: 'Kies een nieuw wachtwoord' })).toBeVisible(READY);
  await shoot(page, size, '27-nieuw-wachtwoord');
});

/** De pagina's voor wie geen kind is, zonder naam (ADR-214, ADR-216). */
test('for parents and for the class', async ({ page }, testInfo) => {
  const size = testInfo.project.name;
  await page.goto('/voor-ouders');
  await expect(page.getByRole('heading', { name: 'leer.nu voor ouders' })).toBeVisible(READY);
  await shoot(page, size, '28-voor-ouders');
  await page.goto('/scholen');
  await expect(page.getByRole('heading', { name: 'leer.nu voor de klas' })).toBeVisible(READY);
  await shoot(page, size, '29-scholen');
});

/** Engels (ADR-217): het Nederlandse woord, de Engelse zin en vier keuzes. */
test('an English word, chosen', async ({ page }, testInfo) => {
  const size = testInfo.project.name;
  await signIn(page, 'Noor');
  await page.goto('/taal/engels-dieren');
  await page
    .getByRole('region', { name: /Hoe wil je/ })
    .getByRole('button', { name: /^Kies het woord/ })
    .click();
  await start(page);
  const keuzes = page.getByRole('group', { name: 'Kies het Engelse woord' });
  await expect(keuzes).toBeVisible(READY);
  await shoot(page, size, '30-engels');
  await keuzes.getByRole('button').first().click();
  await expect(page.getByRole('button', { name: 'Volgende vraag' })).toBeVisible();
  await shoot(page, size, '31-engels-antwoord');
});

test('the round: pointing, and the answer', async ({ page }, testInfo) => {
  const size = testInfo.project.name;

  await signIn(page, 'Joris');
  await page.goto('/topografie');
  await page
    .getByRole('region', { name: /Kies een onderwerp/ })
    .getByRole('button', { name: /^Provincies/ })
    .click();
  await page
    .getByRole('region', { name: /Hoe wil je/ })
    .getByRole('button', { name: /Aanwijzen/ })
    .click();
  await start(page);

  await expect(page.getByRole('button', { name: 'Limburg' })).toBeVisible(READY);
  await shoot(page, size, '05-wijs-aan');

  await page.getByRole('button', { name: 'Limburg' }).click();
  await expect(page.getByRole('button', { name: 'Volgende vraag' })).toBeVisible();
  await shoot(page, size, '06-antwoord');

  await page.getByRole('button', { name: 'Stoppen' }).click();
  await expect(page.getByRole('heading', { name: 'Ronde klaar' })).toBeVisible();
  await shoot(page, size, '07-resultaat');
});

/**
 * Een doel en de ring, met iets erin (ADR-171). Een kind zonder doelen en
 * zonder rondes laat alleen de lege zinnen zien, en juist de rij van een doel
 * en de ring onder "Je geheugen" zijn wat die feedbackronde veranderde.
 */
test('a goal in the list, and the ring with something in it', async ({ page }, testInfo) => {
  const size = testInfo.project.name;

  await signIn(page, 'Mirre');
  const doelen = page.getByRole('region', { name: 'Je doelen voor deze week' });
  await doelen.getByRole('button', { name: 'Doel toevoegen' }).click();
  await doelen.getByRole('button', { name: '2 rondes doen', exact: true }).click();
  await expect(doelen).toContainText('2 rondes doen');

  await chooseAndStart(page, /Aanwijzen/);
  await expect(page.getByRole('button', { name: 'Limburg' })).toBeVisible(READY);
  await page.getByRole('button', { name: 'Limburg' }).click();
  await expect(page.getByRole('button', { name: 'Volgende vraag' })).toBeVisible();
  await page.getByRole('button', { name: 'Stoppen' }).click();
  await expect(page.getByRole('heading', { name: 'Ronde klaar' })).toBeVisible();

  await page.goto('/');
  await expect(doelen).toContainText('van de 2');
  await doelen.scrollIntoViewIfNeeded();
  await shoot(page, size, '18-doelen');

  await page.goto('/jij');
  const geheugen = page.getByRole('region', { name: 'Je geheugen' });
  await expect(geheugen).toContainText('van de 1 die je geoefend hebt');
  await geheugen.scrollIntoViewIfNeeded();
  await shoot(page, size, '19-geheugen');
});

/**
 * The two maps that are not the Netherlands (ADR-086).
 *
 * Worth a picture at every size for the reason the whole file exists: a
 * continent and a globe are the first maps in this product whose shape is
 * nothing like the one the layout was drawn around, and a world map that goes
 * wrong at 393 pixels goes wrong in a classroom.
 */
test('the round: Europe, and the world', async ({ page }, testInfo) => {
  const size = testInfo.project.name;

  await signIn(page, 'Isa');

  // Europa by pointing, which is what a werelddeel is for: forty-six countries
  // and a handful of rings round the microstates. And the world by choosing,
  // because that is the way in there — a hundred and sixty-seven countries are
  // not something a finger can find, so the map lights one up and the child
  // answers in words (ADR-087). The two pictures are the argument.
  for (const [regio, hoe, naam] of [
    ['Europa', /Aanwijzen/, '13-europa'],
    ['Wereld', /Kies uit 4 namen/, '14-wereld'],
  ] as const) {
    await page.goto('/topografie');
    // In de regiorij: sinds ADR-168 heeft de wereldkaart ook een diploma, en
    // dat vakje heet ook "Wereld".
    await page
      .getByRole('region', { name: 'Waar op de kaart?' })
      .getByRole('button', { name: new RegExp(`^${regio}`) })
      .click();
    await page
      .getByRole('region', { name: /Kies een onderwerp/ })
      .getByRole('button', { name: /^Landen/ })
      .click();
    await page
      .getByRole('region', { name: /Hoe wil je/ })
      .getByRole('button', { name: hoe })
      .click();
    await start(page);

    await expect(page.getByRole('heading', { name: /Waar ligt |Hoe heet dit land/ })).toBeVisible(
      READY,
    );
    await shoot(page, size, naam);

    await page.getByRole('button', { name: 'Stoppen' }).click();
    await expect(page.getByRole('heading', { name: 'Ronde klaar' })).toBeVisible();
  }
});

/**
 * Aanwijzen op de wereldkaart, ingezoomd op West-Europa (ADR-146). De foto
 * waarop te zien is of de knoppen de kaart op een telefoon niet wegdrukken, en
 * of de grenzen ingezoomd even dun blijven.
 */
test('the round: pointing on the world, zoomed in', async ({ page }, testInfo) => {
  const size = testInfo.project.name;

  await signIn(page, 'Sem');
  await page.goto('/topografie/wereld');
  await page
    .getByRole('region', { name: /Hoe wil je/ })
    .getByRole('button', { name: /Aanwijzen/ })
    .click();
  await start(page);
  await expect(page.getByRole('heading', { name: /Waar ligt / })).toBeVisible(READY);

  const zoom = page.getByRole('navigation', { name: 'Inzoomen op de kaart' });
  await zoom.getByRole('button', { name: 'Europa', exact: true }).click();
  await zoom.getByRole('button', { name: 'West-Europa' }).click();
  await shoot(page, size, '15-wereld-ingezoomd');
});

test('the round: choosing between four names', async ({ page }, testInfo) => {
  const size = testInfo.project.name;

  await signIn(page, 'Mila');
  await chooseAndStart(page, /Kies uit 4 namen/);

  await expect(page.getByRole('group', { name: 'Kies de naam' })).toBeVisible(READY);
  await shoot(page, size, '08-meerkeuze');
});

test('the round: typing the name', async ({ page }, testInfo) => {
  const size = testInfo.project.name;

  await signIn(page, 'Stijn');
  await chooseAndStart(page, /Zelf typen/);

  await expect(page.getByPlaceholder('Naam')).toBeVisible(READY);
  await shoot(page, size, '09-typen');
});

/** Rekenen, the second module: the same page, and a round of it. */
test('the tables: choosing one, and a sum', async ({ page }, testInfo) => {
  const size = testInfo.project.name;

  await signIn(page, 'Bas');
  // The word a parent types, which is now the page itself rather than a card
  // pointing at one.
  await page.goto('/rekenen');
  await expect(page.getByRole('heading', { name: /^Wat wil je oefenen,/ })).toBeVisible();

  // Nothing is chosen when the page opens, so the picture is taken once the
  // child has answered every step: the keypad open and the start bar ready.
  await page
    .getByRole('region', { name: /Kies een onderwerp/ })
    .getByRole('button', { name: /^Tafels/ })
    .click();
  await page.getByRole('button', { name: 'Tafel van 1', exact: true }).click();
  await page
    .getByRole('region', { name: /Hoe wil je/ })
    .getByRole('button', { name: /Zelf typen/ })
    .click();
  await shoot(page, size, '10-tafels');

  await start(page);

  await expect(page.getByPlaceholder('Antwoord')).toBeVisible(READY);
  await shoot(page, size, '11-som');
});
