import { expect, test, type Page } from '@playwright/test';

/**
 * De kist die opengaat (ADR-138).
 *
 * Tien goede antwoorden zijn een ster, vijf sterren een kist. De hele machinerie
 * stond er al — `aanbod`, `openKist`, `kiesHeld` — en er was nergens een scherm
 * dat het aanriep. Deze test kijkt of een verdiende kist nu echt opengaat, en of
 * hij daarna echt op is: een kist die twee keer uit te geven was, zou het enige
 * in dit product zijn dat niet in antwoorden betaald is.
 */

async function signIn(page: Page, naam: string) {
  await page.goto('/');
  await page.getByPlaceholder('Je naam').fill(naam);
  await page.getByRole('button', { name: 'Beginnen' }).click();
  await expect(page.getByRole('banner').getByRole('button', { name: naam })).toBeVisible();
  await wachtOpHeldenrij(page);
}

/**
 * Wachten tot de heldenrij er staat.
 *
 * De balk vraagt bij het opstarten naar de helden, en `loadHelden` schrijft dan
 * de rij die er nog niet was. Dat is een schrijfactie die na `signIn` nog kan
 * lopen — de knop met de naam staat er eerder dan de rij — en die dus over het
 * zaad van `vijftigGoed` heen kan gaan. Dan is er gerekend met vijftig goede
 * antwoorden, telt `uitLadder` de kist als allang geopend, en ligt er geen kist
 * klaar. Zonder dit is deze test een dobbelsteen, en dat was hij ook.
 */
async function wachtOpHeldenrij(page: Page) {
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            new Promise<boolean>((klaar) => {
              const open = indexedDB.open('leernu');
              open.onerror = () => klaar(false);
              open.onsuccess = () => {
                const db = open.result;
                const rij = db.transaction('settings').objectStore('settings').get('helden:me');
                rij.onsuccess = () => {
                  db.close();
                  klaar(rij.result !== undefined);
                };
                rij.onerror = () => {
                  db.close();
                  klaar(false);
                };
              };
            }),
        ),
      { timeout: 5000 },
    )
    .toBe(true);
}

/**
 * Vijftig goede antwoorden in de geschiedenis zetten, want dat is wat één kist
 * kost. Rechtstreeks in IndexedDB: vijftig vragen echt beantwoorden zou deze
 * test minuten laten duren en niets extra's bewijzen.
 *
 * De heldenstand gaat er expliciet bij op nul. `loadHelden` draait anders
 * `uitLadder`, die de kisten waarvoor al betaald is als geopend telt — en of
 * die migratie vóór of ná dit zaad draait, hangt af van wie er als eerste naar
 * de helden vraagt. Zonder dit is de test een dobbelsteen.
 */
async function vijftigGoed(page: Page) {
  await page.evaluate(async () => {
    await new Promise<void>((klaar, mis) => {
      const open = indexedDB.open('leernu');
      open.onerror = () => mis(open.error);
      open.onsuccess = () => {
        const db = open.result;
        const tx = db.transaction(['attempts', 'settings'], 'readwrite');
        const attempts = tx.objectStore('attempts');
        for (let i = 0; i < 50; i++) {
          attempts.add({
            sessionId: `zaad-${i}`,
            // Het eerste kind op een apparaat heeft het id 'me'.
            kindId: 'me',
            itemId: `zaad-${i}`,
            mode: 'meerkeuze',
            correct: true,
            responseMs: 1000,
            gekozenAntwoord: null,
            tijdstip: new Date().toISOString(),
          });
        }
        tx.objectStore('settings').put({
          key: 'helden:me',
          value: JSON.stringify({ helden: [], kistenOpen: 0 }),
        });
        tx.oncomplete = () => {
          db.close();
          klaar();
        };
        tx.onerror = () => mis(tx.error);
      };
    });
  });
}

/** Eén provincie goed, en dan stoppen: genoeg om bij "Ronde klaar" te komen. */
async function eenRondeEnStop(page: Page) {
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

  await expect(page.getByRole('button', { name: 'Limburg' })).toBeVisible();
  await page.getByRole('button', { name: 'Limburg' }).click();
  await expect(page.getByRole('button', { name: 'Volgende vraag' })).toBeVisible();
  await page.getByRole('button', { name: 'Stoppen' }).click();
  await expect(page.getByRole('heading', { name: 'Ronde klaar' })).toBeVisible();
}

test('een verdiende kist gaat open, en biedt drie helden om uit te kiezen', async ({ page }) => {
  await signIn(page, 'Noor');
  await vijftigGoed(page);
  await eenRondeEnStop(page);

  const kist = page.getByRole('region', { name: 'Je hebt een kist verdiend.' });
  await expect(kist).toBeVisible();
  await expect(kist.getByText('Kies er één.')).toBeVisible();

  // Drie, en elk zegt wat kiezen ervan doet: drie dingen die niet zeggen wat ze
  // zijn is geen keuze maar drie knoppen.
  const kaarten = kist.getByRole('button');
  await expect(kaarten).toHaveCount(3);
  await expect(kist.getByText('Nieuw voor jou').first()).toBeVisible();

  await kaarten.first().click();
  await expect(kist.getByText(/is van jou\./)).toBeVisible();

  // Bij de eerste kist wordt er niet geteld: "0 van de 12" is een berg.
  await expect(kist.getByText(/van de 12 helden/)).toHaveCount(0);
});

/** Een kist die twee keer uit te geven was, zou niet in antwoorden betaald zijn. */
test('een geopende kist is op', async ({ page }) => {
  await signIn(page, 'Sam');
  await vijftigGoed(page);

  await eenRondeEnStop(page);
  const kist = page.getByRole('region', { name: 'Je hebt een kist verdiend.' });
  await kist.getByRole('button').first().click();
  await expect(kist.getByText(/is van jou\./)).toBeVisible();

  // Nog een ronde: die brengt het totaal niet over de volgende vijftig heen,
  // dus er staat geen kist meer klaar.
  await eenRondeEnStop(page);
  await expect(page.getByRole('region', { name: 'Je hebt een kist verdiend.' })).toHaveCount(0);
});

test('zonder verdiende kist staat er niets', async ({ page }) => {
  await signIn(page, 'Rik');
  await eenRondeEnStop(page);
  await expect(page.getByRole('region', { name: 'Je hebt een kist verdiend.' })).toHaveCount(0);
});
