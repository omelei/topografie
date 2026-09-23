import { expect, test, type Page } from '@playwright/test';
import { antwoord, GEZIN, langsDePoort, stubGezin } from './gezin';

/**
 * Een kind dat al oefende, meenemen naar het account van zijn ouder (ADR-187).
 *
 * Tegen een gezinsproject dat niet bestaat: `page.route` antwoordt voor
 * `kind-beheer` en voor de tabellen, en houdt bij wat er binnenkwam. Wat hier
 * vastligt is de reis — inloggen, toestemming, meenemen — en vooral wát er
 * vertrekt: de rijen van dit kind onder zijn nieuwe id, en niets wat alleen van
 * dit apparaat is.
 */

async function signIn(page: Page, naam: string) {
  await page.goto('/');
  await page.getByPlaceholder('Je naam').fill(naam);
  await page.getByRole('button', { name: 'Beginnen' }).click();
  await page.getByRole('button', { name: 'Zeg ik niet' }).click();
  await expect(page.getByRole('banner').getByRole('button', { name: naam })).toBeVisible();
}

/** Wat een kind na een paar rondes op dit apparaat heeft, met de hand neergezet. */
async function zaaiVoortgang(page: Page) {
  await page.evaluate(
    async () =>
      new Promise<void>((klaar, mis) => {
        const open = indexedDB.open('leernu');
        open.onerror = () => mis(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const tx = db.transaction(
            ['sessions', 'attempts', 'progress', 'kindBadges', 'settings'],
            'readwrite',
          );
          const ronde = {
            kindId: 'me',
            mode: 'meerkeuze',
            setId: 'nl-provincies',
            itemSet: [],
            score: 1,
            beantwoord: 1,
            gestart: '2026-09-22T10:00:00.000Z',
          };
          tx.objectStore('sessions').put({
            ...ronde,
            id: 'ronde-klaar',
            geeindigd: '2026-09-22T10:05:00.000Z',
          });
          tx.objectStore('sessions').put({ ...ronde, id: 'ronde-loopt', geeindigd: null });
          const poging = {
            kindId: 'me',
            itemId: 'nl-limburg',
            mode: 'meerkeuze',
            correct: true,
            responseMs: 1200,
            gekozenAntwoord: 'nl-limburg',
            tijdstip: '2026-09-22T10:01:00.000Z',
          };
          tx.objectStore('attempts').put({
            ...poging,
            id: 'poging-klaar',
            sessionId: 'ronde-klaar',
          });
          tx.objectStore('attempts').put({
            ...poging,
            id: 'poging-loopt',
            sessionId: 'ronde-loopt',
          });
          tx.objectStore('progress').put({
            kindId: 'me',
            itemId: 'nl-limburg',
            box: 2,
            laatsteReview: '2026-09-22T10:01:00.000Z',
            volgendeReview: '2026-09-24T10:01:00.000Z',
            goedCount: 1,
            foutCount: 0,
          });
          tx.objectStore('kindBadges').put({
            kindId: 'me',
            badgeId: 'tafel-2',
            behaaldOp: '2026-09-20T10:00:00.000Z',
          });
          tx.oncomplete = () => {
            db.close();
            klaar();
          };
          tx.onerror = () => mis(tx.error);
        };
      }),
  );
}

async function naarOuder(page: Page) {
  await page
    .getByRole('banner')
    .getByRole('button', { name: /Wissel van profiel/ })
    .click();
  await page.getByRole('button', { name: 'Ouder', exact: false }).click();
  await langsDePoort(page);
  await page.getByLabel('Nieuwe pincode').fill('1234');
  await page.getByLabel('Nog een keer').fill('1234');
  await page.getByRole('button', { name: 'Bewaren', exact: true }).click();
  await expect(page).toHaveURL(/\/ouder$/);
}

/** Een gezinsproject dat onthoudt wat het krijgt. */
async function nepGezin(page: Page) {
  const inAccount: { id: string; voornaam: string; inlogcode: string }[] = [];
  const beheer: unknown[] = [];
  const tabellen: Record<string, unknown[]> = {};

  await page.route(`${GEZIN}/rest/v1/kinderen**`, (route) => antwoord(route, 200, inAccount));
  await page.route(`${GEZIN}/functions/v1/kind-beheer`, async (route) => {
    if (route.request().method() !== 'POST') return antwoord(route, 204, {});
    const lijf = route.request().postDataJSON() as { actie: string; voornaam?: string };
    beheer.push(lijf);
    if (lijf.actie === 'opnemen') {
      const kind = { id: 'server-noor', voornaam: lijf.voornaam ?? '', inlogcode: 'ABCD2345' };
      inAccount.push(kind);
      return antwoord(route, 200, { kind });
    }
    if (lijf.actie === 'verwijderen') {
      inAccount.splice(0, inAccount.length);
      return antwoord(route, 200, { ok: true });
    }
    return antwoord(route, 400, { fout: 'onbekende-actie' });
  });
  for (const tabel of ['sessies', 'pogingen', 'voortgang', 'kind_diplomas', 'instellingen']) {
    await page.route(`${GEZIN}/rest/v1/${tabel}`, (route) => {
      if (route.request().method() === 'POST') {
        tabellen[tabel] = [
          ...(tabellen[tabel] ?? []),
          ...(route.request().postDataJSON() as unknown[]),
        ];
      }
      return antwoord(route, 201, null);
    });
  }
  return { inAccount, beheer, tabellen };
}

test('een ouder neemt zijn kind mee naar het account, met toestemming', async ({ page }) => {
  await stubGezin(page);
  const gezin = await nepGezin(page);
  await signIn(page, 'Noor');
  await zaaiVoortgang(page);
  await naarOuder(page);

  const blok = page.getByRole('region', { name: 'Kinderen in je account' });
  await expect(blok).toContainText('Noor oefent op dit apparaat');

  // Zonder toestemming gaat de knop niet.
  const knop = blok.getByRole('button', { name: 'Neem mee naar mijn account' });
  await expect(knop).toBeDisabled();
  await blok.getByRole('button', { name: /Ik ben hun ouder of voogd/ }).click();
  await expect(knop).toBeEnabled();
  await knop.click();

  await expect(blok).toContainText('In je account, met alles tot');
  expect(gezin.beheer).toEqual([{ actie: 'opnemen', voornaam: 'Noor', groep: null }]);

  // Wat er vertrok: de afgeronde ronde en zijn poging, niet de ronde die nog
  // loopt; de doos en het diploma; en alles onder de id van de server.
  const sessies = gezin.tabellen.sessies as { id: string; kind_id: string }[];
  expect(sessies.map((rij) => rij.id)).toEqual(['ronde-klaar']);
  const pogingen = gezin.tabellen.pogingen as { id: string }[];
  expect(pogingen.map((rij) => rij.id)).toEqual(['poging-klaar']);
  expect(gezin.tabellen.voortgang).toEqual([
    expect.objectContaining({ kind_id: 'server-noor', item_id: 'nl-limburg', box: 2 }),
  ]);
  expect(gezin.tabellen.kind_diplomas).toEqual([
    expect.objectContaining({ kind_id: 'server-noor', badge_id: 'tafel-2' }),
  ]);
  const alles = JSON.stringify(gezin.tabellen);
  expect(alles).not.toContain('"kind_id":"me"');
  expect(alles).not.toContain('dagstand');
  expect(alles).not.toContain('actiefKind');
});

test('een kind uit het account halen laat het op dit apparaat staan', async ({ page }) => {
  await stubGezin(page);
  const gezin = await nepGezin(page);
  await signIn(page, 'Noor');
  await naarOuder(page);

  const blok = page.getByRole('region', { name: 'Kinderen in je account' });
  await blok.getByRole('button', { name: /Ik ben hun ouder of voogd/ }).click();
  await blok.getByRole('button', { name: 'Neem mee naar mijn account' }).click();
  await expect(blok).toContainText('In je account, met alles tot');

  await blok.getByRole('button', { name: 'Haal uit mijn account' }).click();
  await expect(blok).toContainText('Op dit apparaat blijft het gewoon staan');
  await blok.getByRole('button', { name: 'Ja, haal weg' }).click();

  await expect(blok).toContainText('Noor oefent op dit apparaat');
  expect(gezin.beheer).toContainEqual({ actie: 'verwijderen', kindId: 'server-noor' });
  // En het kind zelf is er nog.
  await expect(page.getByRole('region', { name: 'Je kinderen', exact: true })).toContainText(
    'Noor',
  );
});

test('als het versturen hapert, is het kind er wel en kan het opnieuw', async ({ page }) => {
  await stubGezin(page);
  const gezin = await nepGezin(page);
  let eersteKeer = true;
  await page.route(`${GEZIN}/rest/v1/sessies`, (route) => {
    if (route.request().method() === 'POST' && eersteKeer) {
      eersteKeer = false;
      return antwoord(route, 503, {});
    }
    return antwoord(route, 201, null);
  });
  await signIn(page, 'Noor');
  await zaaiVoortgang(page);
  await naarOuder(page);

  const blok = page.getByRole('region', { name: 'Kinderen in je account' });
  await blok.getByRole('button', { name: /Ik ben hun ouder of voogd/ }).click();
  await blok.getByRole('button', { name: 'Neem mee naar mijn account' }).click();
  await expect(blok).toContainText('nog niet alles is verstuurd');

  await blok.getByRole('button', { name: 'Verstuur opnieuw' }).click();
  await expect(blok).toContainText('In je account, met alles tot');
  // Eén kind, niet twee.
  expect(gezin.beheer.filter((b) => (b as { actie: string }).actie === 'opnemen')).toHaveLength(1);
});
