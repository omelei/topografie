import { expect, test, type Page, type Route } from '@playwright/test';
import { langsDePoort, stubGezin } from './gezin';
import { alsOnthouden } from './zaai';

/**
 * Premium behind a code (ADR-116, ADR-122): without one the premium parts are
 * locked and every lock leads to the code; with one they open, and what went to
 * the server was the code and a device number, nothing else.
 *
 * ADR-122 moved the line to between practising and remembering, so this spec
 * also holds the other way round: ontdekken, "herhaal je fouten", the
 * tafeldiploma's and the forecast on "Ronde klaar" are there without a code.
 *
 * Every other spec runs with premium on (playwright.config.ts). This one starts
 * from nothing, and answers for the premium server itself — the build asks
 * https://premium.leer.test, which does not exist.
 */
test.use({ storageState: { cookies: [], origins: [] } });

const SERVER = 'https://premium.leer.test';
const GOEDE_CODE = '7K3MQ9TX';

async function signIn(page: Page, naam: string) {
  await page.goto('/');
  await page.getByPlaceholder('Je naam').fill(naam);
  await page.getByRole('button', { name: 'Beginnen' }).click();
  // De groep is een tweede stap, altijd over te slaan (ADR-151).
  await page.getByRole('button', { name: 'Zeg ik niet' }).click();
  await expect(page.getByRole('banner').getByRole('button', { name: naam })).toBeVisible();
}

/** The premium server, as the browser will meet it: across origins, so with CORS. */
async function beantwoord(route: Route, body: unknown) {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'apikey, authorization, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
  if (route.request().method() === 'OPTIONS') {
    await route.fulfill({ status: 204, headers: cors });
    return;
  }
  await route.fulfill({ status: 200, headers: cors, json: body });
}

test('without a code the premium parts are labelled once, and say what they do', async ({
  page,
}) => {
  await signIn(page, 'Noor');

  // Wat Onthouden was, staat op Jij (ADR-171). Sinds ADR-192 zijn wat je
  // inmiddels kent en hoe vaak je oefent premium: zonder code staat er de vraag
  // en niet de cijfers. Bewaard worden ze wel, dus met een code staan ze er
  // meteen.
  await page.goto('/jij');
  await expect(page.getByRole('heading', { level: 1, name: 'Jij' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Wil je zien wat je inmiddels kent?' }),
  ).toBeVisible();
  await expect(page.getByRole('region', { name: 'Je geheugen' })).toHaveCount(0);
  await expect(page.getByRole('list', { name: 'Alles in één blik' })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Hoe vaak oefen je?' })).toHaveCount(0);
  await expect(page.getByRole('table')).toHaveCount(0);

  // En dat is de enige vraag op de pagina (ADR-124, ADR-172): geen slot bij elk
  // blok, en de eigen woorden staan er zonder code niet.
  await expect(page.getByRole('button', { name: 'Bekijk premium' })).toHaveCount(1);
  await expect(page.getByRole('region', { name: 'Hoe gaat het?' })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Eigen woorden' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Bekijk premium' }).first().click();
  await expect(page).toHaveURL(/\/premium$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Premium' })).toBeVisible();

  // Een premiummanier op een modulepagina wordt niet gekozen, maar vraagt het
  // even aan de ouders (ADR-163): een venster over de pagina heen, met een
  // codeveld erin, en de pagina eronder blijft waar hij was.
  await page.goto('/topografie');
  await page
    .getByRole('region', { name: /Kies een onderwerp/ })
    .getByRole('button', { name: /^Provincies/ })
    .click();
  const hoe = page.getByRole('region', { name: /Hoe wil je/ });
  await hoe.getByRole('button', { name: /^Bliksemronde/ }).click();

  const venster = page.getByRole('dialog', { name: 'Vraag het even aan je ouders' });
  await expect(venster).toBeVisible();
  await expect(page).toHaveURL(/\/topografie\/provincies$/);

  // Het codeveld staat er niet meteen in (ADR-174): eerst de vraag of er iemand
  // bij je is. Voor een kind dat alleen zit, is een veld dat het niet kan
  // invullen een dichte deur met een formulier ervoor.
  await expect(venster.getByLabel('Typ de code')).toHaveCount(0);
  await venster.getByRole('button', { name: 'Mijn ouders zijn erbij' }).click();
  await expect(venster.getByLabel('Typ de code')).toBeVisible();
  await venster.getByRole('button', { name: 'Terug', exact: true }).click();

  // Wegklikken zet je terug waar je was, en de manier is niet gekozen.
  await venster.getByRole('button', { name: 'Nee, ik doe iets anders' }).click();
  await expect(venster).toBeHidden();
  await expect(page).toHaveURL(/\/topografie\/provincies$/);
  await expect(hoe.getByRole('button', { name: /^Bliksemronde/ })).toHaveAttribute(
    'aria-pressed',
    'false',
  );

  // En vanuit het venster is de premiumpagina één druk ver, voor wie hem wil.
  await hoe.getByRole('button', { name: /^Bliksemronde/ }).click();
  await venster.getByRole('button', { name: 'Wat is premium?' }).click();
  await expect(page).toHaveURL(/\/premium$/);

  // And a free way is still simply a way.
  await page.goto('/topografie');
  await page
    .getByRole('region', { name: /Kies een onderwerp/ })
    .getByRole('button', { name: /^Provincies/ })
    .click();
  await hoe.getByRole('button', { name: /^Meerkeuze/ }).click();
  await expect(hoe.getByRole('button', { name: /^Meerkeuze/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await page.goto('/jij');
  await expect(page.getByRole('region', { name: 'Wie oefent er?' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Nog een kind erbij' })).toHaveCount(0);

  // De kast hangt vol, ook zonder code (ADR-192). Sinds elk diploma premium
  // is, liet een kast zonder de ringen een kind lezen dat dit product geen
  // diploma's heeft. Nu staan ze er allemaal, en zegt het venster van een
  // diploma dat je het met premium haalt.
  const kast = page.getByRole('region', { name: 'Jouw diploma’s' });
  await expect(kast.locator('.tk-diploma').first()).toBeVisible();
  for (const vak of ['Topo', 'Klok', 'Taal', 'Vlaggen']) {
    const rij = kast.getByRole('button', { name: new RegExp(`^${vak}`) });
    await expect(rij, vak).toContainText('diploma’s');
  }
  await expect(kast).not.toContainText('Hier zijn ook diploma’s');

  // En de weg eruit is de vraag aan de ouders, met het diploma erin (ADR-193).
  await kast.locator('.tk-diploma').first().click();
  const diploma = page.getByRole('dialog');
  await expect(diploma).toContainText('Met premium haal je dit diploma');
  await expect(diploma.getByRole('button', { name: 'Doe de toets' })).toHaveCount(0);
  await diploma.getByRole('button', { name: 'Vraag het je ouders' }).click();
  const vraag = page.getByRole('dialog', { name: 'Vraag het even aan je ouders' });
  await expect(vraag).toContainText(/Het diploma .+ hoort bij premium\./);
});

/**
 * De kolom die op élke pagina meegaat, vraagt zonder code niets (ADR-124).
 *
 * Er stonden twee sloten in — de reeks en "Goed beantwoord" — dus twee keer nee
 * op de voordeur, op elke modulepagina, en zelfs op de premiumpagina zelf.
 * "Goed beantwoord" staat sinds ADR-148 niet meer in de kolom maar op
 * Onthouden, en ook daar alleen met een code. Wat een kind zelf gehaald heeft,
 * zit nooit achter een slot.
 */
test('without a code the column beside every page carries no lock at all', async ({ page }) => {
  await signIn(page, 'Sep');

  for (const pad of ['/', '/premium', '/jij', '/rekenen']) {
    await page.goto(pad);
    await expect(page.getByText('Goed beantwoord'), pad).toHaveCount(0);
  }

  // En de voordeur zegt nergens "Dit hoort bij premium".
  await expect(page.getByText('Dit hoort bij premium.')).toHaveCount(0);
});

test('without a code a child can still discover, choose, and repeat their misses', async ({
  page,
}) => {
  await signIn(page, 'Sam');

  // Ontdekken is a way now, not a lock: it asks nothing, so it can never be
  // the thing a child is turned away from (ADR-122).
  await page.goto('/topografie');
  await page
    .getByRole('region', { name: /Kies een onderwerp/ })
    .getByRole('button', { name: /^Provincies/ })
    .click();
  await page
    .getByRole('region', { name: /Hoe wil je/ })
    .getByRole('button', { name: /^Ontdekken/ })
    .click();
  await page.locator('.tk-choose-start button').click();
  await expect(page).not.toHaveURL(/\/premium$/);

  // The table of one, chosen from four, so the round can be finished honestly
  // — and one answer given wrong on purpose, so there is something to repeat.
  // Meerkeuze is free, typing is premium (ADR-192).
  await page.goto('/rekenen');
  await page
    .getByRole('region', { name: /Kies een onderwerp/ })
    .getByRole('button', { name: /^Tafels/ })
    .click();
  await page.getByRole('button', { name: 'Tafel van 1', exact: true }).click();
  await page
    .getByRole('region', { name: /Hoe wil je/ })
    .getByRole('button', { name: /^Meerkeuze/ })
    .click();
  await page.locator('.tk-choose-start button').click();

  const opties = page.getByRole('group', { name: 'Kies het antwoord' });
  for (let n = 1; n <= 10; n++) {
    const som = await page.locator('.tk-sum').innerText();
    const goed = som.split('×')[1]?.trim() ?? '';
    const keuze =
      n === 1
        ? opties
            .getByRole('button')
            .filter({ hasNotText: new RegExp(`^${goed}$`) })
            .first()
        : opties.getByRole('button', { name: goed, exact: true });
    await keuze.click();
    await page.getByRole('button', { name: 'Volgende vraag' }).click();
  }

  await expect(page.getByRole('heading', { name: 'Ronde klaar' })).toBeVisible();

  // The forecast is premium since ADR-192: it is what you will still know in
  // three weeks, and that is keeping track. The round itself is still there.
  await expect(page.getByText(/Doe je niets, dan weet je hier over drie weken/)).toHaveCount(0);

  // And going back over what just went wrong is free.
  await page.getByRole('button', { name: 'Herhaal je fouten' }).click();
  await expect(page).not.toHaveURL(/\/premium$/);
  await expect(opties).toBeVisible();
});

/**
 * De weg naar de kassa (ADR-123): een gewone link naar een gewone pagina op dit
 * adres. Daarom hoeft de app zelf niets van betalen te weten — hij wijst, en
 * laat los. En hij wijst alleen zolang er nog niets gekocht is.
 */
test('without a code the premium page points at the kassa, and with one it does not', async ({
  page,
  baseURL,
}) => {
  const origin = new URL(baseURL ?? 'http://localhost:4173').origin;
  await signIn(page, 'Tess');

  await page.goto('/premium');

  // De volgorde van de beslissing (ADR-124, ADR-145): in één zin wat het is en
  // wat het kost, wat het doet, basis en premium naast elkaar, waarom wij, en
  // pas daarna het veld voor wie al een code heeft.
  // Gescoped op de pagina zelf: de blokken in de kolom ernaast zijn ook h2.
  //
  // Met `expect(locator)` en niet met `allInnerTexts()`. Dat laatste vraagt de
  // koppen op zoals ze op dát ogenblik staan en wacht nergens op, dus tussen
  // `goto` en de eerste render van React leverde het een lege lijst — een test
  // die meestal slaagt en soms niet, en die dan niets zegt over de pagina maar
  // over de timing (ADR-125). `toHaveText` op een locator probeert het opnieuw
  // tot het klopt of de tijd om is.
  const koppen = page.locator('.tk-page-main').getByRole('heading', { level: 2 });
  await expect(koppen).toHaveText([
    'Oefenen kan gratis. Met premium haalt je kind diploma’s en blijft de stof hangen.',
    'Wat premium voor je doet',
    'Basis en premium naast elkaar',
    'Waarom leer.nu',
    // Het codeveld stond hier en staat sinds ADR-173 bij de ouder: een kind mag
    // deze pagina zien en een kind koopt niets. Wat er nog staat is de weg
    // ernaartoe, onder dezelfde kop. Het account staat er niet meer; dat is ook
    // van de ouder.
    'Heb je al een code?',
  ]);
  await expect(page.getByText('€ 79,95').first()).toBeVisible();

  // Twee manieren van betalen (ADR-164): het jaar als aanrader, de maand
  // ernaast. Per maand betalen bestaat nog niet (ADR-196), dus staat er
  // "binnenkort" en geen knop naar een kassa die het niet kan.
  await expect(page.getByText('€ 9,95').first()).toBeVisible();
  await expect(page.getByText('Binnenkort kun je ook per maand betalen').first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Per maand' })).toHaveCount(0);

  // En de belofte over namen staat erbij (ADR-164).
  await expect(page.getByText('We slaan geen namen van kinderen op')).toBeVisible();
  await expect(page.getByText('Uitgebreide statistieken over je kind')).toBeVisible();

  // En de vergelijking zegt per regel wat erin zit: de bliksemronde niet in
  // basis, alle vakken wel (ADR-122, ADR-145).
  const tabel = page.getByRole('table', { name: 'Basis en premium naast elkaar' });
  await expect(
    tabel.getByRole('row', { name: /De bliksemronde en overleven/ }).getByText('Zit er niet in'),
  ).toHaveCount(1);
  await expect(
    tabel.getByRole('row', { name: /Alle vakken en alle onderwerpen/ }).getByRole('img'),
  ).toHaveCount(2);

  // Zonder kolom ernaast — die staat sinds ADR-168 nergens meer.
  await expect(page.locator('.tk-home-aside')).toHaveCount(0);

  const knop = page.getByRole('link', { name: 'Een code kopen' }).first();
  await expect(knop).toBeVisible();

  const doel = new URL((await knop.getAttribute('href')) ?? '', origin);
  expect(doel.origin, 'de kassa staat op dit adres zelf').toBe(origin);

  await knop.click();
  await expect(page.getByRole('heading', { name: 'Premium voor een schooljaar' })).toBeVisible();
});

test('a code is checked once, and then everything opens', async ({ page }) => {
  const gevraagd: Record<string, unknown>[] = [];
  await page.route(`${SERVER}/rest/v1/rpc/premium_controleer`, async (route) => {
    if (route.request().method() !== 'OPTIONS') {
      gevraagd.push(route.request().postDataJSON() as Record<string, unknown>);
    }
    const code = (route.request().postDataJSON() as { p_code?: string } | null)?.p_code;
    await beantwoord(
      route,
      code === GOEDE_CODE
        ? { geldig: true, geldig_tot: '2099-09-13' }
        : { geldig: false, reden: 'onbekend' },
    );
  });

  await stubGezin(page);
  await signIn(page, 'Mees');

  // Het veld staat bij de ouder (ADR-173), en de premiumpagina heeft er één
  // knop naartoe. Die knop is de parental gate die Apple en Google eisen.
  await page.goto('/premium');
  await page.getByRole('button', { name: 'Ik ben de ouder' }).click();
  await langsDePoort(page);
  await page.getByLabel('Nieuwe pincode').fill('1234');
  await page.getByLabel('Nog een keer').fill('1234');
  await page.getByRole('button', { name: 'Bewaren', exact: true }).click();
  await expect(page).toHaveURL(/\/ouder$/);

  const veld = page.getByLabel('Typ de code');
  await veld.fill('LEER-2222-2222');
  await page.getByRole('button', { name: 'Code gebruiken' }).click();
  await expect(page.getByRole('alert')).toContainText('Deze code kennen we niet');

  // However it is typed: small letters, the LEER in front, spaces.
  await veld.fill('leer 7k3m q9tx');
  await page.getByRole('button', { name: 'Code gebruiken' }).click();
  await expect(page.getByText(/Premium staat aan op dit apparaat/)).toBeVisible();

  // The code, normalised, and a device number: that is all that went.
  expect(gevraagd.at(-1)?.p_code).toBe(GOEDE_CODE);
  expect(Object.keys(gevraagd.at(-1) ?? {}).sort()).toEqual(['p_apparaat', 'p_code']);

  await page.goto('/jij');
  await page.getByRole('button', { name: 'Laat de tabel zien' }).click();
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Laatst geoefend' })).toBeVisible();

  // En er wordt niets meer verkocht: wie net betaald heeft hoeft geen prijs,
  // geen USP's en geen kassa meer te lezen (ADR-123, ADR-124).
  await page.goto('/premium');
  await expect(page.getByRole('link', { name: 'Een code kopen' })).toHaveCount(0);
  await expect(page.getByText('€ 79,95')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Wat premium voor je doet' })).toHaveCount(0);
  await expect(page.getByText(/Premium staat aan op dit apparaat/)).toBeVisible();
});

/**
 * "Vandaag herhalen" (ADR-126): de belofte die de premiumpagina doet, in het
 * product. Zonder code staat er hoevéél er klaarstaat — dat is een feit over dit
 * kind — en het plan zelf is waar premium voor is.
 */
test('the day plan says how much without a code, and is the plan with one', async ({ page }) => {
  await signIn(page, 'Fenna');

  // Zonder geoefend te hebben is er niets te herhalen, en dan staat er niets:
  // een leeg plan aanprijzen is een lege doos op slot doen.
  await expect(page.getByRole('region', { name: 'Vandaag herhalen' })).toHaveCount(0);

  // Eén ronde, en de standen een week terug, zodat er iets aan de beurt is.
  await oefenTafelVanEen(page);
  await zetStandenTerug(page);

  await page.goto('/');
  const vandaag = page.getByRole('region', { name: 'Vandaag herhalen' });
  await expect(vandaag).toContainText('die je bijna vergeten bent');
  await expect(vandaag).toContainText('Leer.nu zet elke dag klaar wat aan de beurt is');
  await expect(vandaag.getByRole('button', { name: /Tafel van 1/ })).toHaveCount(0);

  // En het staat onder de rijen, niet bovenaan: wie binnenkomt, ziet eerst waar
  // hij kan oefenen en dan pas een slot (ADR-152).
  const recent = await page.getByRole('region', { name: 'Recent geoefend' }).boundingBox();
  const slot = await vandaag.boundingBox();
  expect(slot?.y ?? -1).toBeGreaterThan(recent?.y ?? Infinity);

  // En Premium staat in de navigatie, op elke pagina: sinds ADR-171 een van de
  // drie bestemmingen, in plaats van een groene knop in de balk. Exact, want
  // "Bekijk premium" in het blok hierboven bevat hetzelfde woord.
  const inDeNavigatie = page
    .getByRole('navigation', { name: 'Waar je heen kunt' })
    .filter({ visible: true })
    .getByRole('button', { name: 'Premium', exact: true });
  await expect(inDeNavigatie).toBeVisible();
  await page.goto('/jij');
  await expect(inDeNavigatie).toBeVisible();
});

/**
 * Een ronde tafel van 1, uit vier gekozen: elk antwoord is de vermenigvuldiger
 * zelf. Meerkeuze, want zonder code is typen premium (ADR-192).
 */
async function oefenTafelVanEen(page: Page) {
  await page.goto('/rekenen');
  await page
    .getByRole('region', { name: /Kies een onderwerp/ })
    .getByRole('button', { name: /^Tafels/ })
    .click();
  await page.getByRole('button', { name: 'Tafel van 1', exact: true }).click();
  await page
    .getByRole('region', { name: /Hoe wil je/ })
    .getByRole('button', { name: /^Meerkeuze/ })
    .click();
  await page.locator('.tk-choose-start button').click();

  const opties = page.getByRole('group', { name: 'Kies het antwoord' });
  for (let vraag = 1; vraag <= 10; vraag++) {
    const som = await page.locator('.tk-sum').innerText();
    const goed = (som.split('×')[1] ?? '').trim();
    await opties.getByRole('button', { name: goed, exact: true }).click();
    await page.getByRole('button', { name: 'Volgende vraag' }).click();
  }
  await expect(page.getByRole('heading', { name: 'Ronde klaar' })).toBeVisible();
}

/** De Leitner-standen een week terugzetten, zodat ze vandaag aan de beurt zijn. */
async function zetStandenTerug(page: Page) {
  await page.evaluate(async () => {
    const open = indexedDB.open('leernu');
    const db = await new Promise<IDBDatabase>((ok) => {
      open.onsuccess = () => ok(open.result);
    });
    const tx = db.transaction('progress', 'readwrite');
    const store = tx.objectStore('progress');
    const rijen = await new Promise<{ volgendeReview: string }[]>((ok) => {
      const vraag = store.getAll();
      vraag.onsuccess = () => ok(vraag.result as { volgendeReview: string }[]);
    });
    const toen = new Date(Date.now() - 7 * 86_400_000).toISOString();
    for (const rij of rijen) store.put({ ...rij, volgendeReview: toen, laatsteReview: toen });
    await new Promise((ok) => {
      tx.oncomplete = ok;
    });
  });
}

/**
 * De derde uitweg: stuur het naar je ouders (ADR-174).
 *
 * Dit is het geval waar de opdracht van de eigenaar om vroeg en waar ADR-163
 * geen antwoord op had: een kind dat alleen oefent, drukt op een slot en er is
 * niemand in de kamer. Wat hier vastligt is dat er dan iets te doen valt, en
 * dat er niets meegaat dan het adres.
 */
test.describe('doorsturen naar de ouder', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('stuurt de premiumpagina door met de deelknop van het toestel', async ({ page }) => {
    // `navigator.share` bestaat niet in een kale browser, dus hij wordt hier
    // nagebouwd — en tegelijk is dit de enige manier om te zien wát er precies
    // de deur uit gaat.
    await page.addInitScript(() => {
      const gedeeld: unknown[] = [];
      (window as unknown as { gedeeld: unknown[] }).gedeeld = gedeeld;
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: (data: unknown) => {
          gedeeld.push(data);
          return Promise.resolve();
        },
      });
    });

    await signIn(page, 'Fenna');
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
    await venster.getByRole('button', { name: 'Stuur het naar mijn ouders' }).click();
    await venster.getByRole('button', { name: 'Versturen' }).click();
    await expect(venster.getByRole('status')).toContainText('Verstuurd');

    const gedeeld = (await page.evaluate(
      () => (window as unknown as { gedeeld: { url?: string; text?: string }[] }).gedeeld,
    )) as { url?: string; text?: string }[];
    expect(gedeeld).toHaveLength(1);

    // Naar de premiumpagina en niet naar de kassa: wie een link koud
    // binnenkrijgt, heeft eerst de uitleg nodig en niet een betaalformulier.
    expect(gedeeld[0]?.url).toMatch(/\/premium$/);

    // En er gaat niets mee dan het adres: geen naam, geen voortgang, en ook
    // niet welke oefening het kind wilde doen.
    const alles = JSON.stringify(gedeeld[0]);
    for (const geheim of ['Fenna', 'provincies', 'bliksem']) {
      expect(alles.toLowerCase(), geheim).not.toContain(geheim.toLowerCase());
    }
  });

  /**
   * Zonder deelknop, met het klembord als tweede weg.
   *
   * Allebei de takken worden hier afgedwongen in plaats van overgelaten aan wat
   * een engine toevallig toestaat: `grantPermissions` met `clipboard-read` is
   * Chromium-only en gooit op WebKit, en of `writeText` mag hangt op elk toestel
   * van iets anders af. Wat vastligt is de belofte: op een druk gebeurt er
   * altijd iets, en het is altijd aangekondigd.
   */
  async function naarDoorsturen(page: Page, naam: string) {
    await signIn(page, naam);
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
    await venster.getByRole('button', { name: 'Stuur het naar mijn ouders' }).click();
    return venster;
  }

  test('zonder deelknop gaat het naar het klembord', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: () => Promise.resolve() },
      });
    });

    const venster = await naarDoorsturen(page, 'Joep');

    // De mail staat er hoe dan ook, ook op een laptop zonder deelknop.
    await expect(venster.getByRole('link', { name: 'Of mail het ze' })).toHaveAttribute(
      'href',
      /^mailto:/,
    );

    await venster.getByRole('button', { name: 'Versturen' }).click();
    await expect(venster.getByRole('status')).toContainText('plakken');
  });

  test('mag het klembord ook niet, dan staat het adres er om vast te pakken', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: () => Promise.reject(new Error('geweigerd')) },
      });
    });

    const venster = await naarDoorsturen(page, 'Wies');
    await venster.getByRole('button', { name: 'Versturen' }).click();

    // Aangekondigd, en met het adres erbij: een doodlopende weg is geen uitweg.
    const melding = venster.getByRole('status');
    await expect(melding).toContainText('lukt niet op dit apparaat');
    await expect(melding.locator('.tk-adres')).toContainText('/premium');
  });
});

/**
 * Zonder code leidt de eerste kaart op Vandaag niet naar een slot, en vraagt
 * een diploma op een vakpagina eerst de ouders (ADR-192).
 */
test('without a code the first card starts a round, and a diploma asks the parents', async ({
  page,
}) => {
  await signIn(page, 'Pim');

  // De startkaarten zijn meerkeuze: gratis, dus geen vraag aan de ouders.
  await page
    .getByRole('button', { name: /Provincies/ })
    .first()
    .click();
  await expect(page.getByRole('button', { name: 'Stoppen' })).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Vraag het even aan je ouders' })).toHaveCount(0);

  // Een diploma op de muur kiezen is premium.
  await page.goto('/rekenen');
  await page
    .getByRole('region', { name: /Kies een onderwerp/ })
    .getByRole('button', { name: /^Tafels/ })
    .click();
  await page
    .getByRole('region', { name: 'Jouw tafeldiploma’s' })
    .getByRole('button', { name: /^Tafel van 3/ })
    .click();
  await expect(page.getByRole('dialog', { name: 'Vraag het even aan je ouders' })).toBeVisible();
});

/**
 * De triggers van ADR-193: het venster zegt wat het kind wilde, de uitslag zegt
 * dat het klaar is voor de toets, en de ouderpagina onthoudt allebei.
 */
test('without a code the parents read what the child wanted, and what it is ready for', async ({
  page,
}) => {
  await stubGezin(page);
  await signIn(page, 'Fem');

  // Een slot noemt wat het kind wilde.
  await page.goto('/topografie');
  await page
    .getByRole('region', { name: /Kies een onderwerp/ })
    .getByRole('button', { name: /^Provincies/ })
    .click();
  await page
    .getByRole('region', { name: /Hoe wil je/ })
    .getByRole('button', { name: /^Bliksemronde/ })
    .click();
  const vraag = page.getByRole('dialog', { name: 'Vraag het even aan je ouders' });
  await expect(vraag).toContainText('Bliksemronde bij Provincies van Nederland hoort bij premium.');
  await vraag.getByRole('button', { name: 'Nee, ik doe iets anders' }).click();

  // Met meerkeuze de tafel van 1 onthouden, en dan zegt de uitslag het.
  await oefenTafelVanEen(page);
  await alsOnthouden(page);
  await oefenTafelVanEen(page);
  const klaar = page.getByRole('region', { name: 'Je bent klaar voor de toets!' });
  await expect(klaar).toContainText('Je kent Tafel van 1 goed genoeg voor het diploma.');
  await klaar.getByRole('button', { name: 'Vraag het je ouders' }).click();
  await expect(vraag).toContainText('Je bent klaar voor de toets van Tafel van 1!');
  await vraag.getByRole('button', { name: 'Nee, ik doe iets anders' }).click();

  // En op de ouderpagina staat het, in de derde persoon.
  await page.goto('/');
  await page
    .getByRole('banner')
    .getByRole('button', { name: /Wissel van profiel/ })
    .click();
  await page.getByRole('button', { name: 'Ouder' }).click();
  await langsDePoort(page);
  await page.getByLabel('Nieuwe pincode').fill('1234');
  await page.getByLabel('Nog een keer').fill('1234');
  await page.getByRole('button', { name: 'Bewaren', exact: true }).click();
  const hoe = page.getByRole('region', { name: 'Hoe gaat het?' });
  await expect(hoe).toContainText('Fem is klaar voor de toets van Tafel van 1.');
  await expect(hoe).toContainText('Fem wilde dit graag doen');
  await expect(hoe).toContainText('Bliksemronde bij Provincies van Nederland');
});
