import { expect, test, type Page } from '@playwright/test';

/**
 * De groep van een kind (ADR-151): gevraagd na de naam, te wijzigen op Voor
 * ouders, en wat bij de groep past staat bovenaan in Vandaag.
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
 * De groep wisselen op Voor ouders, en wachten tot hij weg staat.
 *
 * `GroepInstelling` schrijft in een promise waar de klik zelf niet op wacht, dus
 * een `goto` er meteen achteraan haalt die schrijfactie in: de voordeur leest
 * dan nog de oude groep en stelt het oude voor. De knop draagt `aria-pressed`
 * pas nadat `setGroep` terug is, dus dat is het teken dat de wissel rond is —
 * en het is hetzelfde teken dat de ouder op het scherm ziet.
 */
async function wisselGroep(page: Page, naam: string, knop: string) {
  const knoppen = page
    .getByRole('region', { name: `Groep van ${naam}` })
    .getByRole('button', { name: knop, exact: true });
  await knoppen.click();
  await expect(knoppen).toHaveAttribute('aria-pressed', 'true');
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

test('nieuw kind kiest een groep, Vandaag volgt, en Voor ouders verandert het', async ({
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

  await page.goto('/ouder');
  const instelling = page.getByRole('region', { name: 'Groep van Mees' });
  await expect(instelling.getByRole('button', { name: 'Groep 3', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await wisselGroep(page, 'Mees', 'Groep 6');
  await expect(instelling.getByRole('status')).toHaveText('Mees zit in groep 6.');
  await instelling.scrollIntoViewIfNeeded();
  await foto(page, project, 'groep-ouder');

  await page.goto('/');
  expect(await provinciesEerst(page)).toBe(true);

  // En terug naar geen groep: dan beslist weer alleen de grootte, zoals altijd.
  await page.goto('/ouder');
  await wisselGroep(page, 'Mees', 'Geen groep');
  await page.goto('/');
  expect(await provinciesEerst(page)).toBe(true);
});

/**
 * "Ik ben een ouder" op de eerste vraag (ADR-161): geen groep, en meteen Voor
 * ouders in plaats van de voordeur. Het profiel bestaat daarna wel — de app
 * heeft er overal een nodig — en de groep is daar alsnog te zetten.
 */
test('"Ik ben een ouder" maakt het profiel zonder groep en opent Voor ouders', async ({ page }) => {
  await page.goto('/');
  await page.getByPlaceholder('Je naam').fill('Sanne');
  await page.getByRole('button', { name: 'Beginnen' }).click();

  await expect(page.getByRole('heading', { name: 'In welke groep zit je?' })).toBeVisible();
  await page.getByRole('button', { name: 'Ik ben een ouder' }).click();

  await expect(page).toHaveURL(/\/ouder$/);
  await expect(page.getByRole('heading', { name: 'Voor ouders' })).toBeVisible();

  // Geen groep gekozen, en de instelling zegt dat ook.
  const instelling = page.getByRole('region', { name: 'Groep van Sanne' });
  await expect(instelling.getByRole('status')).toHaveText(
    'Er is geen groep gekozen. Dan staat alles in de gewone volgorde.',
  );

  // En de vraag komt niet terug op de voordeur: die is beantwoord.
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'In welke groep zit je?' })).toHaveCount(0);
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
  await expect(
    page.getByRole('banner').getByRole('button', { name: 'Oud', exact: true }),
  ).toBeVisible();
  const begin = page.getByRole('group', { name: 'Hier begin je mee vandaag' });
  await expect(begin.getByRole('button').first()).toContainText('Provincies van Nederland');

  // De vraag staat er, rustig, en houdt niets tegen.
  const vraag = page.getByRole('region', { name: 'In welke groep zit je?' });
  await expect(vraag).toBeVisible();
  await vraag.getByRole('button', { name: 'Niet nu' }).click();
  await expect(vraag).toHaveCount(0);

  await page.reload();
  await expect(
    page.getByRole('banner').getByRole('button', { name: 'Oud', exact: true }),
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

  // Groep 3 op Voor ouders: nu de klok, en geen landen meer.
  await page.goto('/ouder');
  await wisselGroep(page, 'Fenna', 'Groep 3');
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
