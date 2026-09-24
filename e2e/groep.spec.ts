import { expect, test, type Page } from '@playwright/test';

/**
 * De groep van een kind (ADR-151): gevraagd na de naam, te wijzigen op Jij
 * (ADR-171), en wat bij de groep past staat bovenaan in Vandaag.
 *
 * Een voorstel en geen slot, dus wat hier wordt nagekeken is een volgorde. Twee
 * sets wachten precies even lang: drie provincies (groep 6 en 7) en één hele
 * klok (groep 3 en 4). Zonder groep gaat de grootste ronde voor, met groep 3 de
 * klok, en met groep 6 weer de provincies. Het onthouden beslist eerst; hier
 * is het gelijk, en dan beslist de groep.
 *
 * De foto's van de stap en van de instelling gaan naar `screenshots/`, zoals
 * die van screens.spec.ts, zodat de PR ze op telefoon en tablet kan laten zien.
 */

async function foto(page: Page, project: string, naam: string) {
  await page.screenshot({ path: `screenshots/${project}-${naam}.png`, fullPage: false });
}

/**
 * De groep wisselen op Jij, en wachten tot hij weg staat.
 *
 * `GroepInstelling` schrijft in een promise waar de klik zelf niet op wacht, dus
 * een `goto` er meteen achteraan haalt die schrijfactie in: de voordeur leest
 * dan nog de oude groep en stelt het oude voor. De knop draagt `aria-pressed`
 * pas nadat `setGroep` terug is, dus dat is het teken dat de wissel rond is —
 * en het is hetzelfde teken dat het kind op het scherm ziet.
 */
async function wisselGroep(page: Page, knop: string) {
  const knoppen = groepRij(page).getByRole('button', { name: knop, exact: true });
  await knoppen.click();
  await expect(knoppen).toHaveAttribute('aria-pressed', 'true');
}

/**
 * De groep op Jij is een rij bij de instellingen die de knoppen opent
 * (ADR-172). Dit is die rij, met wat erin opengaat.
 */
function groepRij(page: Page) {
  const rij = page.getByRole('button', { name: /^Je groep/ });
  return page
    .getByRole('region', { name: 'Instellingen' })
    .getByRole('listitem')
    .filter({ has: rij });
}

/** De rij openen, en teruggeven wat erin staat. */
async function openGroep(page: Page) {
  const rij = groepRij(page);
  await rij.getByRole('button', { name: /^Je groep/ }).click();
  await expect(rij.getByRole('status')).toBeVisible();
  return rij;
}

/** Vier onderdelen die een week geleden aan de beurt kwamen, en een lege dag. */
async function zaaiGelijkWachten(page: Page) {
  await page.evaluate(async () => {
    await new Promise<void>((klaar, mis) => {
      const open = indexedDB.open('leernu');
      open.onerror = () => mis(open.error);
      open.onsuccess = () => {
        const db = open.result;
        const tx = db.transaction(['progress', 'settings'], 'readwrite');
        const week = new Date(Date.now() - 7 * 86_400_000).toISOString();
        const ids = ['nl-prov-groningen', 'nl-prov-fryslan', 'nl-prov-drenthe', 'klok-01-00'];
        for (const itemId of ids) {
          tx.objectStore('progress').put({
            kindId: 'me',
            itemId,
            box: 2,
            laatsteReview: week,
            volgendeReview: week,
            goedCount: 1,
            foutCount: 0,
          });
        }
        tx.objectStore('settings').delete('dagstand:me');
        tx.oncomplete = () => {
          db.close();
          klaar();
        };
        tx.onerror = () => mis(tx.error);
      };
    });
  });
}

/** Staan de provincies in Vandaag boven de hele uren? */
async function provinciesEerst(page: Page): Promise<boolean> {
  const vandaag = page.getByRole('region', { name: 'Vandaag herhalen' });
  await expect(vandaag.getByRole('button', { name: /Hele uren/ })).toBeVisible();
  const rondes = await vandaag.getByRole('button').allTextContents();
  const provincies = rondes.findIndex((tekst) => tekst.includes('Provincies van Nederland'));
  const klok = rondes.findIndex((tekst) => tekst.includes('Hele uren'));
  expect(provincies).toBeGreaterThanOrEqual(0);
  return provincies < klok;
}

test('nieuw kind kiest een groep, Vandaag volgt, en op Jij verandert het', async ({
  page,
}, testInfo) => {
  const project = testInfo.project.name;

  await page.goto('/');
  await page.getByPlaceholder('Je naam').fill('Mees');
  await page.getByRole('button', { name: 'Beginnen' }).click();

  // De tweede stap: zes groepen en een uitweg. Nooit een leeftijd.
  await expect(page.getByRole('heading', { name: 'In welke groep zit je?' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Zeg ik niet' })).toBeVisible();
  await expect(page.getByText(/leeftijd|geboren/i)).toHaveCount(0);
  await foto(page, project, 'groep-stap');

  await page.getByRole('button', { name: 'Groep 3', exact: true }).click();
  await expect(page.getByRole('banner').getByRole('button', { name: 'Mees' })).toBeVisible();
  // Wie het bij het begin beantwoordde, krijgt de vraag niet nog eens.
  await expect(page.getByRole('heading', { name: 'In welke groep zit je?' })).toHaveCount(0);

  await zaaiGelijkWachten(page);
  await page.reload();
  expect(await provinciesEerst(page)).toBe(false);

  await page.goto('/jij');
  // De rij zegt de groep al voor hij open is.
  await expect(groepRij(page).getByRole('button', { name: /^Je groep/ })).toContainText('Groep 3');
  const instelling = await openGroep(page);
  await expect(instelling.getByRole('button', { name: 'Groep 3', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await wisselGroep(page, 'Groep 6');
  await expect(instelling.getByRole('status')).toHaveText('Je zit in groep 6.');
  await instelling.scrollIntoViewIfNeeded();
  await foto(page, project, 'groep-jij');

  await page.goto('/');
  expect(await provinciesEerst(page)).toBe(true);

  // En terug naar geen groep: dan beslist weer alleen de grootte, zoals altijd.
  await page.goto('/jij');
  await openGroep(page);
  await wisselGroep(page, 'Geen groep');
  await page.goto('/');
  expect(await provinciesEerst(page)).toBe(true);
});

/**
 * De groep doet ook iets op Vandaag (ADR-206): de rij om mee te beginnen noemt
 * de groep en heeft de stof van dat jaar, en wie al geoefend heeft, krijgt
 * "Past bij groep 6" met wat erbij past en nog niet gedaan is.
 */
test('de groep staat in de kop, en na een ronde komt "Past bij groep"', async ({ page }) => {
  await page.goto('/');
  await page.getByPlaceholder('Je naam').fill('Lot');
  await page.getByRole('button', { name: 'Beginnen' }).click();
  await page.getByRole('button', { name: 'Groep 6', exact: true }).click();

  const begin = page.getByRole('group', { name: 'Hier begin je mee in groep 6' });
  await expect(begin.getByRole('button', { name: /Keersommen tot 100/ })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Past bij groep 6' })).toHaveCount(0);

  await page.goto('/topografie');
  await page
    .getByRole('region', { name: /Kies een onderwerp/ })
    .getByRole('button', { name: /^Provincies/ })
    .click();
  await page
    .getByRole('region', { name: /Hoe wil je/ })
    .getByRole('button', { name: /Aanwijzen/ })
    .click();
  await page.locator('.tk-choose-start button').click();
  await page.getByRole('button', { name: 'Limburg' }).click();
  await expect(page.getByRole('button', { name: 'Volgende vraag' })).toBeVisible();
  await page.getByRole('button', { name: 'Stoppen' }).click();
  await expect(page.getByRole('heading', { name: 'Ronde klaar' })).toBeVisible();

  await page.goto('/');
  const passend = page.getByRole('group', { name: 'Past bij groep 6' });
  await expect(passend.getByRole('button', { name: /Keersommen tot 100/ })).toBeVisible();
  // Wat al gedaan is, staat onder "Meest geoefend" en niet nog eens hier.
  await expect(passend.getByRole('button', { name: /Provincies van Nederland/ })).toHaveCount(0);
});

/**
 * "Ik ben een ouder" op de eerste vraag (ADR-161, ADR-198). Een ouder oefent
 * niet en wordt dus geen profiel: de kaart vraagt naar de naam en de groep van
 * het kind, dat kind bestaat daarna, en de app opent op Premium.
 */
test('"Ik ben een ouder" maakt het kind, niet de ouder, en opent Premium', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Ik ben een ouder' }).click();

  await expect(page.getByRole('heading', { name: 'Hoe heet je kind?' })).toBeVisible();
  await page.getByPlaceholder('Naam van je kind').fill('Sanne');
  await page.getByRole('button', { name: 'Verder', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'In welke groep zit Sanne?' })).toBeVisible();
  await page.getByRole('button', { name: 'Groep 5', exact: true }).click();

  await expect(page).toHaveURL(/\/premium$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Premium' })).toBeVisible();

  // Wie er oefent, is het kind, in de groep die de ouder koos.
  await expect(page.getByRole('banner').getByRole('button', { name: /Sanne/ })).toBeVisible();
  await page.goto('/jij');
  await expect(groepRij(page).getByRole('button', { name: /^Je groep/ })).toContainText('Groep 5');

  // En er is maar één kind: de ouder neemt geen plek in.
  await page
    .getByRole('banner')
    .getByRole('button', { name: /Wissel van profiel/ })
    .click();
  const venster = page.getByRole('dialog');
  await expect(venster.getByRole('button', { name: /de beurt/ })).toHaveCount(0);
  await expect(venster.getByRole('button', { name: 'Nog een kind erbij' })).toBeVisible();
});

test('wie "Ik ben een ouder" per ongeluk kiest, kan terug', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Ik ben een ouder' }).click();
  await page.getByRole('button', { name: 'Ik ben een kind' }).click();
  await expect(page.getByRole('heading', { name: 'Wie ben jij?' })).toBeVisible();
  await expect(page.getByPlaceholder('Je naam')).toBeVisible();
});

test('een kind van vóór de groep laadt zoals altijd, en krijgt de vraag één keer', async ({
  page,
}) => {
  // Het profiel zoals het vóór ADR-151 werd geschreven: geen groep, geen vlag.
  await page.goto('/');
  await expect(page.getByPlaceholder('Je naam')).toBeVisible();
  await page.evaluate(async () => {
    await new Promise<void>((klaar, mis) => {
      const open = indexedDB.open('leernu');
      open.onerror = () => mis(open.error);
      open.onsuccess = () => {
        const db = open.result;
        const tx = db.transaction('profile', 'readwrite');
        tx.objectStore('profile').put({
          id: 'me',
          naam: 'Oud',
          avatarConfig: {},
          niveau: 1,
          aangemaaktOp: '2026-09-01T08:00:00.000Z',
        });
        tx.oncomplete = () => {
          db.close();
          klaar();
        };
        tx.onerror = () => mis(tx.error);
      };
    });
  });
  await page.reload();

  // Het werkt zoals voorheen: de voordeur, en de rij om mee te beginnen in de
  // volgorde van altijd.
  // De knop in de balk is sinds ADR-173 de wisselaar, en draagt de naam van wie
  // er oefent in zijn toegankelijke naam.
  await expect(
    page.getByRole('banner').getByRole('button', { name: /Nu oefent Oud/ }),
  ).toBeVisible();
  const begin = page.getByRole('group', { name: 'Hier begin je mee vandaag' });
  await expect(begin.getByRole('button').first()).toContainText('Provincies van Nederland');

  // De vraag staat er, rustig, en houdt niets tegen.
  const vraag = page.getByRole('region', { name: 'In welke groep zit je?' });
  await expect(vraag).toBeVisible();
  await vraag.getByRole('button', { name: 'Niet nu' }).click();
  await expect(vraag).toHaveCount(0);

  await page.reload();
  // De knop in de balk is sinds ADR-173 de wisselaar, en draagt de naam van wie
  // er oefent in zijn toegankelijke naam.
  await expect(
    page.getByRole('banner').getByRole('button', { name: /Nu oefent Oud/ }),
  ).toBeVisible();
  await expect(page.getByRole('region', { name: 'In welke groep zit je?' })).toHaveCount(0);
});

/**
 * De diploma's die als weekdoel worden voorgesteld, passen bij de groep
 * (ADR-153, ADR-162): groep 8 krijgt geen tafel van 1 meer voorgesteld, groep 3
 * geen landen van Europa. En de weg naar alle diploma's staat eronder.
 */
test('de voorgestelde diploma’s passen bij de groep, met de weg naar alle diploma’s', async ({
  page,
}, testInfo) => {
  const project = testInfo.project.name;

  await page.goto('/');
  await page.getByPlaceholder('Je naam').fill('Fenna');
  await page.getByRole('button', { name: 'Beginnen' }).click();
  await page.getByRole('button', { name: 'Groep 8', exact: true }).click();

  const blok = page.getByRole('region', { name: 'Je doelen voor deze week' });
  const voorstellen = async () => {
    await blok.getByRole('button', { name: 'Doel toevoegen' }).click();
    await blok.getByRole('button', { name: 'Een diploma halen', exact: true }).click();
  };

  // Sinds ADR-168 is élk diploma te kiezen, dus gaat deze test over de drie
  // die bovenaan voorgesteld worden: dát is wat de groep stuurt. De rest staat
  // eronder per vak en hoort er voor elke groep te staan.
  await voorstellen();
  const dichtbij = blok.getByRole('region', { name: 'Dichtbij' });
  await expect(dichtbij.getByRole('button', { name: /Landen van Europa/ })).toBeVisible();
  await expect(dichtbij.getByRole('button', { name: /Tafel van 1 / })).toHaveCount(0);
  await expect(dichtbij.getByRole('button', { name: /Tafel van 2 / })).toHaveCount(0);
  await blok.scrollIntoViewIfNeeded();
  await foto(page, project, 'doel-groep-8');

  // Groep 3 op Jij: nu de klok, en geen landen meer.
  await page.goto('/jij');
  await openGroep(page);
  await wisselGroep(page, 'Groep 3');
  await page.goto('/');
  await voorstellen();
  const dichtbij3 = blok.getByRole('region', { name: 'Dichtbij' });
  await expect(dichtbij3.getByRole('button', { name: /Hele uren/ })).toBeVisible();
  await expect(dichtbij3.getByRole('button', { name: /Landen van Europa/ })).toHaveCount(0);

  // De knop onderaan het blok: naar Jij, met de kast in beeld — precies wat
  // ADR-153 schreef. ADR-158 stuurde hem naar Voor ouders omdat het raster daar
  // stond; nu het diploma zelf de beloning is, staat het weer bij het kind.
  await blok.getByRole('button', { name: 'Bekijk alle diploma’s' }).click();
  await expect(page).toHaveURL(/\/jij$/);
  await expect(page.getByRole('region', { name: 'Jouw diploma’s' })).toBeVisible();
});
