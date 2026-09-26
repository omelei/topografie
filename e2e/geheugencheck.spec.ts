import { expect, test, type Page } from '@playwright/test';
import { langsDePoort, stubGezin } from './gezin';
import { signIn } from './naam';

/**
 * De geheugencheck (ADR-228): één keer per kind, zodra er 8 vragen zijn die het
 * 21 tot 60 dagen geleden voor het eerst oefende. Het kind speelt een ronde
 * zonder hulp, de ouder leest de uitslag en het aanbod, en de dozen blijven
 * precies zoals ze waren.
 *
 * Zonder code, want daar is het aanbod voor.
 */
test.use({ storageState: { cookies: [], origins: [] } });

/** Tafel van 1 met meerkeuze: elk antwoord is de vermenigvuldiger zelf. */
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
    await opties
      .getByRole('button', { name: (som.split('×')[1] ?? '').trim(), exact: true })
      .click();
    await page.getByRole('button', { name: 'Volgende vraag' }).click();
  }
  await expect(page.getByRole('heading', { name: 'Ronde klaar' })).toBeVisible();
}

/** Alles wat geoefend is, 30 dagen terug: de antwoorden en de dozen. */
async function dertigDagenTerug(page: Page) {
  await page.evaluate(async () => {
    const open = indexedDB.open('leernu');
    const db = await new Promise<IDBDatabase>((ok) => {
      open.onsuccess = () => ok(open.result);
    });
    const toen = (iso: string) => new Date(Date.parse(iso) - 30 * 86_400_000).toISOString();
    const tx = db.transaction(['attempts', 'progress', 'sessions'], 'readwrite');
    for (const [naam, velden] of [
      ['attempts', ['tijdstip']],
      ['progress', ['laatsteReview', 'volgendeReview']],
      ['sessions', ['gestart', 'geeindigd']],
    ] as const) {
      const store = tx.objectStore(naam);
      store.getAll().onsuccess = (event) => {
        for (const rij of (event.target as IDBRequest).result as Record<string, string>[]) {
          const nieuw = { ...rij };
          for (const veld of velden)
            if (typeof rij[veld] === 'string') nieuw[veld] = toen(rij[veld]);
          store.put(nieuw);
        }
      };
    }
    await new Promise((ok) => {
      tx.oncomplete = ok;
    });
    db.close();
  });
}

/** Wat er in de winkels staat die de check niet mag raken. */
async function winkels(page: Page) {
  return page.evaluate(async () => {
    const open = indexedDB.open('leernu');
    const db = await new Promise<IDBDatabase>((ok) => {
      open.onsuccess = () => ok(open.result);
    });
    const alles = async (naam: string) =>
      new Promise<unknown[]>((ok) => {
        const vraag = db.transaction(naam).objectStore(naam).getAll();
        vraag.onsuccess = () => ok(vraag.result as unknown[]);
      });
    const uit = {
      progress: await alles('progress'),
      attempts: (await alles('attempts')).length,
      sessions: (await alles('sessions')).length,
    };
    db.close();
    return JSON.stringify(uit);
  });
}

test('the memory check comes once, changes no box, and the parent reads the result', async ({
  page,
}) => {
  await stubGezin(page);
  await signIn(page, 'Lotte');
  await oefenTafelVanEen(page);

  // Vandaag nog niet: wat vandaag nieuw was, is nog geen geheugen.
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Weet je het nog?' })).toHaveCount(0);

  await dertigDagenTerug(page);
  await page.goto('/');
  const kaart = page.getByRole('region', { name: 'Weet je het nog?' });
  await expect(kaart).toContainText('10 vragen uit Tafel van 1');
  // Voor het kind: geen woord over premium, geen prijs, geen link (R-11).
  await expect(kaart).not.toContainText(/premium/i);
  await expect(kaart.getByRole('link')).toHaveCount(0);

  const voor = await winkels(page);
  await kaart.getByRole('button', { name: 'Start' }).click();

  // Zonder hulp: de manier van de oefentoets, getypt, en niets gezegd tot het eind.
  for (let vraag = 1; vraag <= 10; vraag++) {
    const som = await page.locator('.tk-sum').innerText();
    const antwoord = vraag <= 7 ? (som.split('×')[1] ?? '').trim() : '999';
    await page.getByPlaceholder('Antwoord').fill(antwoord);
    await page.getByRole('button', { name: 'Kijk na' }).click();
    await expect(page.getByText(/^Goed!/)).toHaveCount(0);
  }
  await expect(page.getByRole('heading', { name: 'Ronde klaar' })).toBeVisible();

  // Geen invloed op de dozen, en ook geen antwoord of ronde erbij.
  expect(await winkels(page)).toBe(voor);

  // Eén keer: daarna is de kaart weg.
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Weet je het nog?' })).toHaveCount(0);

  // De ouder leest de uitslag, met het aanbod erbij.
  await page
    .getByRole('banner')
    .getByRole('button', { name: /Wissel van profiel/ })
    .click();
  await page.getByRole('button', { name: 'Ouder' }).click();
  await langsDePoort(page);
  await page.getByLabel('Nieuwe pincode').fill('1234');
  await page.getByLabel('Nog een keer').fill('1234');
  await page.getByRole('button', { name: 'Bewaren', exact: true }).click();

  const check = page.getByRole('region', { name: 'Geheugencheck' });
  await expect(check).toContainText('7');
  await expect(check).toContainText('goed, van de 10 vragen');
  await expect(check).toContainText('vragen uit Tafel van 1 die Lotte 3 tot 8 weken geleden');
  await expect(check).toContainText('laat premium op tijd terugkomen');
  await expect(check.getByRole('button', { name: 'Wat zit er in premium?' })).toBeVisible();
});
