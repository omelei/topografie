import { expect, test, type Page } from '@playwright/test';

/**
 * De sleutel van een poging wordt een uuid (ADR-175).
 *
 * Deze migratie staat met opzet niet in een unit test. Wat er bewezen moet
 * worden is gedrag van IndexedDB zelf — dat een rij met een genummerde sleutel
 * verdwijnt en er een met een uuid voor terugkomt, met exact dezelfde inhoud —
 * en een nagebouwde IndexedDB bewijst dat over zichzelf en niet over de browser
 * waar een kind in oefent. De rest van dit bestand doet hetzelfde als
 * `groep.spec.ts` met een profiel van vóór de groep: een rij van de oude vorm
 * met de hand neerzetten, herladen, en kijken wat ervan geworden is.
 */

async function signIn(page: Page, naam: string) {
  await page.goto('/');
  await page.getByPlaceholder('Je naam').fill(naam);
  await page.getByRole('button', { name: 'Beginnen' }).click();
  await page.getByRole('button', { name: 'Zeg ik niet' }).click();
  await expect(page.getByRole('banner').getByRole('button', { name: naam })).toBeVisible();
}

/** Elke poging die er ligt, met alleen wat deze test erover te zeggen heeft. */
async function pogingen(page: Page) {
  return page.evaluate(
    async () =>
      new Promise<{ id: unknown; itemId: string; tijdstip: string }[]>((klaar, mis) => {
        const open = indexedDB.open('leernu');
        open.onerror = () => mis(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const verzoek = db.transaction('attempts').objectStore('attempts').getAll();
          verzoek.onsuccess = () => {
            db.close();
            klaar(
              (verzoek.result as { id: unknown; itemId: string; tijdstip: string }[]).map(
                (rij) => ({ id: rij.id, itemId: rij.itemId, tijdstip: rij.tijdstip }),
              ),
            );
          };
          verzoek.onerror = () => mis(verzoek.error);
        };
      }),
  );
}

test('een poging met een genummerde sleutel krijgt een uuid, en houdt alles', async ({ page }) => {
  await signIn(page, 'Juul');

  // De staat van een apparaat dat op deze versie uitkomt: een poging zoals hij
  // vóór ADR-175 werd geschreven — zonder sleutel, dus IndexedDB deelt er zelf
  // een nummer aan uit — en de vlag nog niet gezet. Die vlag moet hier weg,
  // want het openen van de app hierboven heeft hem al over een lege winkel
  // gezet; dat is juist gedrag en het is niet de toestand die dit toetst.
  await page.evaluate(
    async () =>
      new Promise<void>((klaar, mis) => {
        const open = indexedDB.open('leernu');
        open.onerror = () => mis(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const tx = db.transaction(['attempts', 'settings'], 'readwrite');
          tx.objectStore('settings').delete('pogingenUuid');
          tx.objectStore('attempts').add({
            sessionId: 'ronde-oud',
            kindId: 'me',
            itemId: 'nl-limburg',
            mode: 'aanwijzen',
            correct: true,
            responseMs: 1200,
            gekozenAntwoord: 'nl-limburg',
            tijdstip: '2026-09-01T08:00:00.000Z',
          });
          tx.oncomplete = () => {
            db.close();
            klaar();
          };
          tx.onerror = () => mis(tx.error);
        };
      }),
  );

  const voor = await pogingen(page);
  expect(voor).toHaveLength(1);
  expect(typeof voor[0]?.id).toBe('number');

  // Opnieuw openen laat de migratie draaien.
  await page.reload();
  await expect(page.getByRole('banner').getByRole('button', { name: 'Juul' })).toBeVisible();

  await expect(async () => {
    const na = await pogingen(page);
    // Eén rij, niet twee: de oude is weg en niet alleen overschaduwd.
    expect(na).toHaveLength(1);
    expect(typeof na[0]?.id).toBe('string');
    // En het antwoord zelf is precies wat het was.
    expect(na[0]?.itemId).toBe('nl-limburg');
    expect(na[0]?.tijdstip).toBe('2026-09-01T08:00:00.000Z');
  }).toPass({ timeout: 10_000 });

  // En nog een keer openen doet niets meer: de migratie is eenmalig.
  const uuid = (await pogingen(page))[0]?.id;
  await page.reload();
  await expect(page.getByRole('banner').getByRole('button', { name: 'Juul' })).toBeVisible();
  expect((await pogingen(page))[0]?.id).toBe(uuid);
});

test('een ronde schrijft voortaan zelf een uuid', async ({ page }) => {
  await signIn(page, 'Pim');

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
  await expect(page.getByRole('region', { name: 'Hoe de ronde ging' })).toBeVisible();

  const gegeven = await pogingen(page);
  expect(gegeven.length).toBeGreaterThan(0);
  for (const poging of gegeven) expect(typeof poging.id).toBe('string');
});
