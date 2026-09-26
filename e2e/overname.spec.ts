import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { antwoord, GEZIN, langsDePoort, stubGezin } from './gezin';
import { signIn } from './naam';

/**
 * Een kind dat al oefende, meenemen naar het account van zijn ouder (ADR-187).
 *
 * Tegen een gezinsproject dat niet bestaat: `page.route` antwoordt voor
 * `kind-beheer` en voor de tabellen, en houdt bij wat er binnenkwam. Wat hier
 * vastligt is de reis — inloggen, toestemming, meenemen — en vooral wát er
 * vertrekt: de rijen van dit kind onder zijn nieuwe id, en niets wat alleen van
 * dit apparaat is.
 */

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
  const inAccount: {
    id: string;
    ouder_id: string;
    voornaam: string;
    inlogcode: string;
    groep: number | null;
  }[] = [];
  const beheer: unknown[] = [];
  /** Wat er binnenkwam, per tabel. */
  const tabellen: Record<string, unknown[]> = {};
  /** Wat de server teruggeeft als er iets opgehaald wordt (ADR-189), per tabel. */
  const opServer: Record<string, unknown[]> = {};

  await page.route(`${GEZIN}/rest/v1/kinderen**`, (route) => antwoord(route, 200, inAccount));
  await page.route(`${GEZIN}/functions/v1/kind-beheer`, async (route) => {
    if (route.request().method() !== 'POST') return antwoord(route, 204, {});
    const lijf = route.request().postDataJSON() as {
      actie: string;
      voornaam?: string;
      wachtwoord?: string;
    };
    beheer.push(lijf);
    if (lijf.actie === 'opnemen') {
      const kind = {
        id: 'server-noor',
        ouder_id: 'ouder-e2e',
        voornaam: lijf.voornaam ?? '',
        inlogcode: 'ABCD2345',
        groep: null,
      };
      inAccount.push(kind);
      return antwoord(route, 200, { kind });
    }
    if (lijf.actie === 'wachtwoord') {
      // Dezelfde ondergrens als `_gezin/code.ts`: zes tekens.
      if ((lijf.wachtwoord ?? '').length < 6) return antwoord(route, 400, { fout: 'te-kort' });
      return antwoord(route, 200, { ok: true });
    }
    if (lijf.actie === 'verwijderen') {
      inAccount.splice(0, inAccount.length);
      return antwoord(route, 200, { ok: true });
    }
    return antwoord(route, 400, { fout: 'onbekende-actie' });
  });
  for (const tabel of ['sessies', 'pogingen', 'voortgang', 'kind_diplomas', 'instellingen']) {
    await page.route(`${GEZIN}/rest/v1/${tabel}**`, (route) => {
      if (route.request().method() === 'GET') return antwoord(route, 200, opServer[tabel] ?? []);
      if (route.request().method() === 'POST') {
        tabellen[tabel] = [
          ...(tabellen[tabel] ?? []),
          ...(route.request().postDataJSON() as unknown[]),
        ];
      }
      return antwoord(route, 201, null);
    });
  }
  return { inAccount, beheer, tabellen, opServer };
}

/** Wat er van een kind in IndexedDB staat, per winkel, voor de controles hieronder. */
async function opApparaat(page: Page) {
  return page.evaluate(
    async () =>
      new Promise<{
        profielen: { id: string; naam: string }[];
        dozen: { kindId: string; itemId: string; box: number }[];
        diplomas: { kindId: string; badgeId: string; behaaldOp: string }[];
        sessies: { id: string; kindId: string }[];
      }>((klaar, mis) => {
        const open = indexedDB.open('leernu');
        open.onerror = () => mis(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const tx = db.transaction(['profile', 'progress', 'kindBadges', 'sessions']);
          const uit: Record<string, unknown[]> = {};
          const lees = (winkel: string, naam: string) => {
            const verzoek = tx.objectStore(winkel).getAll();
            verzoek.onsuccess = () => {
              uit[naam] = verzoek.result;
            };
          };
          lees('profile', 'profielen');
          lees('progress', 'dozen');
          lees('kindBadges', 'diplomas');
          lees('sessions', 'sessies');
          tx.oncomplete = () => {
            db.close();
            klaar(uit as never);
          };
          tx.onerror = () => mis(tx.error);
        };
      }),
  );
}

/** Noor zoals ze op een ander apparaat in het account kwam: een doos, een diploma, een ronde. */
function noorOpDeIpad(gezin: Awaited<ReturnType<typeof nepGezin>>) {
  gezin.inAccount.push({
    id: 'server-noor',
    ouder_id: 'ouder-e2e',
    voornaam: 'Noor',
    inlogcode: 'ABCD2345',
    groep: 6,
  });
  const van = { kind_id: 'server-noor', ouder_id: 'ouder-e2e' };
  gezin.opServer.voortgang = [
    {
      ...van,
      item_id: 'nl-utrecht',
      box: 4,
      laatste_review: '2026-09-22T10:01:00+00:00',
      volgende_review: '2026-09-30T10:01:00+00:00',
      goed_count: 6,
      fout_count: 1,
      hoogste_doos: 4,
    },
  ];
  gezin.opServer.kind_diplomas = [
    { ...van, badge_id: 'tafel-3', behaald_op: '2026-09-21T10:00:00+00:00' },
  ];
  gezin.opServer.sessies = [
    {
      ...van,
      id: 'ronde-ipad',
      mode: 'meerkeuze',
      set_id: 'nl-provincies',
      item_set: [],
      score: 1,
      beantwoord: 1,
      gestart: '2026-09-22T10:00:00+00:00',
      geeindigd: '2026-09-22T10:05:00+00:00',
    },
  ];
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

  await expect(blok).toContainText('In je account, bijgewerkt op');
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
  await expect(blok).toContainText('In je account, bijgewerkt op');

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
  await expect(blok).toContainText('In je account, bijgewerkt op');
  // Eén kind, niet twee.
  expect(gezin.beheer.filter((b) => (b as { actie: string }).actie === 'opnemen')).toHaveLength(1);
});

/**
 * Daarna gaat vanzelf mee wat er bij kwam (ADR-188), en alleen dat: een ronde
 * die na het meenemen afliep, en niet opnieuw alles van vóór.
 */
test('wat er daarna geoefend wordt, gaat vanzelf mee, en alleen dat', async ({ page }) => {
  await stubGezin(page);
  const gezin = await nepGezin(page);
  await signIn(page, 'Noor');
  await zaaiVoortgang(page);
  await naarOuder(page);

  const blok = page.getByRole('region', { name: 'Kinderen in je account' });
  await blok.getByRole('button', { name: /Ik ben hun ouder of voogd/ }).click();
  await blok.getByRole('button', { name: 'Neem mee naar mijn account' }).click();
  await expect(blok).toContainText('In je account, bijgewerkt op');
  gezin.tabellen.sessies = [];
  gezin.tabellen.pogingen = [];

  // Een ronde die daarna afliep, zoals `finishSession` hem achterlaat.
  await page.evaluate(
    async () =>
      new Promise<void>((klaar, mis) => {
        const open = indexedDB.open('leernu');
        open.onerror = () => mis(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const tx = db.transaction(['sessions', 'attempts'], 'readwrite');
          const nu = new Date().toISOString();
          tx.objectStore('sessions').put({
            id: 'ronde-twee',
            kindId: 'me',
            mode: 'meerkeuze',
            setId: 'nl-provincies',
            itemSet: [],
            score: 1,
            beantwoord: 1,
            gestart: nu,
            geeindigd: nu,
          });
          tx.objectStore('attempts').put({
            id: 'poging-twee',
            sessionId: 'ronde-twee',
            kindId: 'me',
            itemId: 'nl-drenthe',
            mode: 'meerkeuze',
            correct: true,
            responseMs: 900,
            gekozenAntwoord: 'nl-drenthe',
            tijdstip: nu,
          });
          tx.oncomplete = () => {
            db.close();
            klaar();
          };
          tx.onerror = () => mis(tx.error);
        };
      }),
  );

  // Bij het opnieuw openen van de app gaat hij mee.
  const verstuurd = page.waitForRequest(
    (verzoek) => verzoek.url() === `${GEZIN}/rest/v1/pogingen` && verzoek.method() === 'POST',
  );
  await page.goto('/');
  await verstuurd;
  await expect
    .poll(() => (gezin.tabellen.pogingen as { id: string }[]).map((rij) => rij.id))
    .toEqual(['poging-twee']);
  expect((gezin.tabellen.sessies as { id: string }[]).map((rij) => rij.id)).toEqual(['ronde-twee']);
});

/**
 * Het tweede apparaat (ADR-189): Noor oefent op de iPad en staat in het
 * account; op de laptop zet de ouder haar neer, met wat ze op de iPad deed.
 */
test('een kind uit het account komt op een tweede apparaat, met wat het daar deed', async ({
  page,
}) => {
  await stubGezin(page);
  const gezin = await nepGezin(page);
  noorOpDeIpad(gezin);
  await signIn(page, 'Sam');
  await naarOuder(page);

  const blok = page.getByRole('region', { name: 'Kinderen in je account' });
  const noor = blok.getByRole('list', { name: 'In je account, maar niet op dit apparaat' });
  await expect(noor).toContainText('Noor');
  // De twee keuzes staan op een scherm dat een ouder leest; axe kijkt mee, met
  // dezelfde regels als `a11y.spec.ts`.
  const scan = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(scan.violations).toEqual([]);
  await noor.getByRole('button', { name: 'Zet Noor op dit apparaat' }).click();

  await expect(blok).toContainText('Noor');
  await expect(noor).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Je kinderen', exact: true })).toContainText(
    'Noor',
  );

  const hier = await opApparaat(page);
  const lokaal = hier.profielen.find((kind) => kind.naam === 'Noor');
  expect(lokaal).toBeDefined();
  expect(hier.dozen).toContainEqual(
    expect.objectContaining({ kindId: lokaal?.id, itemId: 'nl-utrecht', box: 4 }),
  );
  expect(hier.diplomas).toContainEqual(
    expect.objectContaining({ kindId: lokaal?.id, badgeId: 'tafel-3' }),
  );
  expect(hier.sessies).toContainEqual(
    expect.objectContaining({ id: 'ronde-ipad', kindId: lokaal?.id }),
  );
  // Sam is gebleven wie hij was.
  expect(hier.profielen.map((kind) => kind.naam).sort()).toEqual(['Noor', 'Sam']);
});

/**
 * Of Noor oefende hier al — de laptop vroeg om een naam voor er een ouder bij
 * was — en dan koppelt de ouder de twee: één kind, met wat er op beide stond.
 */
test('een kind dat hier al oefent, wordt gekoppeld aan het kind in het account', async ({
  page,
}) => {
  await stubGezin(page);
  const gezin = await nepGezin(page);
  noorOpDeIpad(gezin);
  await signIn(page, 'Noortje');
  await zaaiVoortgang(page);
  await naarOuder(page);

  const blok = page.getByRole('region', { name: 'Kinderen in je account' });
  await blok.getByRole('button', { name: 'Noortje is Noor' }).click();
  await expect(blok).toContainText('In je account, bijgewerkt op');
  await expect(
    blok.getByRole('list', { name: 'In je account, maar niet op dit apparaat' }),
  ).toHaveCount(0);

  // Niets nieuws in het account: gekoppeld, niet opgenomen.
  expect(gezin.beheer).toEqual([]);

  // Hier staat nu wat er op beide stond, onder de id die het hier al had.
  const hier = await opApparaat(page);
  expect(hier.profielen.map((kind) => kind.naam)).toEqual(['Noortje']);
  expect(hier.dozen.map((doos) => `${doos.kindId}:${doos.itemId}`).sort()).toEqual([
    'me:nl-limburg',
    'me:nl-utrecht',
  ]);

  // En wat hier stond, ging naar het account, onder de id daar.
  expect(gezin.tabellen.voortgang).toContainEqual(
    expect.objectContaining({ kind_id: 'server-noor', item_id: 'nl-limburg' }),
  );
  expect((gezin.tabellen.sessies as { id: string }[]).map((rij) => rij.id)).toContain(
    'ronde-klaar',
  );
});

/**
 * Een kind logt zelf in (ADR-190), op een apparaat waar nog niemand oefende en
 * geen ouder bij is: de chromebook van school.
 */
test('een kind logt zelf in met code en wachtwoord, en oefent verder waar het was', async ({
  page,
}) => {
  const gezin = await nepGezin(page);
  noorOpDeIpad(gezin);
  let inlog: unknown = null;
  await page.route(`${GEZIN}/functions/v1/kind-inloggen`, (route) => {
    if (route.request().method() === 'POST') inlog = route.request().postDataJSON();
    return antwoord(route, 200, {
      sessie: {
        access_token: 'token-noor',
        refresh_token: 'vernieuw-noor',
        expires_in: 3600,
        token_type: 'bearer',
      },
    });
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'Ik heb een inlogcode' }).click();
  await page.getByLabel('Inlogcode').fill('kind-abcd-2345');
  await page.getByLabel('Wachtwoord').fill('konijntje');
  await page.getByRole('button', { name: 'Inloggen', exact: true }).click();

  await expect(page.getByRole('banner').getByRole('button', { name: 'Noor' })).toBeVisible();
  expect(inlog).toEqual({ code: 'kind-abcd-2345', wachtwoord: 'konijntje' });

  const hier = await opApparaat(page);
  expect(hier.profielen.map((kind) => kind.naam)).toEqual(['Noor']);
  expect(hier.dozen).toContainEqual(expect.objectContaining({ itemId: 'nl-utrecht', box: 4 }));
  expect(hier.diplomas).toContainEqual(expect.objectContaining({ badgeId: 'tafel-3' }));
});

test('een fout wachtwoord zegt dat, zonder te zeggen of de code bestaat', async ({ page }) => {
  await page.route(`${GEZIN}/functions/v1/kind-inloggen`, (route) =>
    antwoord(route, 200, { fout: 'onjuist' }),
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Ik heb een inlogcode' }).click();
  await page.getByLabel('Inlogcode').fill('KIND-ABCD-2345');
  await page.getByLabel('Wachtwoord').fill('verkeerd');
  await page.getByRole('button', { name: 'Inloggen', exact: true }).click();

  await expect(page.getByRole('alert')).toHaveText(
    'Deze code en dit wachtwoord horen niet bij elkaar.',
  );
  // Terug kan altijd, en er is niemand ingelogd: nog steeds zonder naam.
  await page.getByRole('button', { name: 'Laat maar' }).click();
  await expect(page.getByRole('button', { name: 'Ik heb een inlogcode' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Hoi!' })).toBeVisible();
});

test('de ouder ziet de inlogcode en zet een wachtwoord voor het kind', async ({ page }) => {
  await stubGezin(page);
  const gezin = await nepGezin(page);
  await signIn(page, 'Noor');
  await naarOuder(page);

  const blok = page.getByRole('region', { name: 'Kinderen in je account' });
  await blok.getByRole('button', { name: /Ik ben hun ouder of voogd/ }).click();
  await blok.getByRole('button', { name: 'Neem mee naar mijn account' }).click();
  await expect(blok).toContainText('Inlogcode: KIND-ABCD-2345');

  const veld = blok.getByLabel('Wachtwoord waarmee Noor zelf inlogt');
  await veld.fill('kort');
  await blok.getByRole('button', { name: 'Zet het wachtwoord' }).click();
  await expect(blok.getByRole('alert')).toHaveText('Kies minstens zes tekens.');

  await veld.fill('konijntje');
  await blok.getByRole('button', { name: 'Zet het wachtwoord' }).click();
  await expect(blok.getByRole('status')).toContainText('Noor kan nu zelf inloggen');
  expect(gezin.beheer).toContainEqual({
    actie: 'wachtwoord',
    kindId: 'server-noor',
    wachtwoord: 'konijntje',
  });
});
