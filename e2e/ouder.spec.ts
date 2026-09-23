import { expect, test, type Page } from '@playwright/test';
import { antwoord, GEZIN, herbevestig, langsDePoort, stubGezin } from './gezin';

/**
 * De ouder en het kind (ADR-173).
 *
 * Wat hier vastligt is de verhouding, niet de knoppen: **een kind hoeft niets
 * in te tikken om te oefenen, en een ouder wel om iets te regelen.** Drie
 * kinderen zijn gratis, het codeveld staat alleen achter de pincode, en wie de
 * ouderpagina zonder pincode opent, krijgt de deur.
 *
 * Twee dingen die makkelijk stilletjes kapotgaan en daarom apart staan: dat de
 * sessie een adreswissel overleeft (anders is wisselen tussen de blokken van de
 * ouderpagina onmogelijk, want elk kind wisselen herlaadt), en dat de pincode
 * nergens leesbaar in de opslag staat.
 */

async function signIn(page: Page, naam: string) {
  await page.goto('/');
  await page.getByPlaceholder('Je naam').fill(naam);
  await page.getByRole('button', { name: 'Beginnen' }).click();
  // De groep is een tweede stap, altijd over te slaan (ADR-151).
  await page.getByRole('button', { name: 'Zeg ik niet' }).click();
  await expect(page.getByRole('banner').getByRole('button', { name: naam })).toBeVisible();
}

function wisselaar(page: Page) {
  return page.getByRole('banner').getByRole('button', { name: /Wissel van profiel/ });
}

/** De eerste keer: er is nog geen pincode, dus hem maken is hem opendoen. */
async function maakOuder(page: Page, pin = '1234') {
  await stubGezin(page);
  await wisselaar(page).click();
  await page.getByRole('button', { name: 'Ouder' }).click();
  await langsDePoort(page);
  await page.getByLabel('Nieuwe pincode').fill(pin);
  await page.getByLabel('Nog een keer').fill(pin);
  await page.getByRole('button', { name: 'Bewaren', exact: true }).click();
  await expect(page).toHaveURL(/\/ouder$/);
}

test('een kind tikt op zijn naam en oefent; er wordt niets gevraagd', async ({ page }) => {
  await signIn(page, 'Noor');

  await wisselaar(page).click();
  const venster = page.getByRole('dialog');
  await expect(venster.getByRole('heading', { name: 'Wie gebruikt de app?' })).toBeVisible();

  // Het kind dat oefent staat er, zonder slot en zonder veld.
  await expect(venster.getByRole('button', { name: /Noor/ })).toBeDisabled();
  await expect(venster.getByLabel('Pincode')).toHaveCount(0);
  await expect(venster.getByLabel('Wachtwoord')).toHaveCount(0);
});

test('de ouder zit achter een pincode, en het kind niet', async ({ page }) => {
  await stubGezin(page);
  await signIn(page, 'Sam');

  await wisselaar(page).click();
  await page.getByRole('button', { name: 'Ouder' }).click();

  // Eerst de poort, en dán pas een pincode maken (ADR-176, ADR-178). Deze bouw
  // heeft een gezinsproject, dus de poort is het account.
  await expect(page.getByRole('heading', { name: 'Maak een ouderaccount' })).toBeVisible();
  await langsDePoort(page);

  await expect(page.getByRole('heading', { name: 'Maak een ouderpagina' })).toBeVisible();
  await page.getByLabel('Nieuwe pincode').fill('4821');
  await page.getByLabel('Nog een keer').fill('4821');
  await page.getByRole('button', { name: 'Bewaren', exact: true }).click();

  await expect(page).toHaveURL(/\/ouder$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Voor de ouder' })).toBeVisible();

  // En de cijfers staan nergens in de opslag (ADR-173): wat er staat is een
  // afleiding met een salt. Vier cijfers zijn geen geheim, maar ze mogen ook
  // niet zomaar te lezen zijn — een gezin gebruikt dezelfde vier vaker.
  const ruw = await page.evaluate(() => window.localStorage.getItem('leernu.ouder'));
  expect(ruw).not.toBeNull();
  expect(ruw).not.toContain('4821');
});

test('een verkeerde pincode komt er niet in, en de goede wel', async ({ page }) => {
  await signIn(page, 'Tess');
  await maakOuder(page, '4821');

  // Terug naar het kind, en dan staat de deur weer dicht.
  await page.getByRole('button', { name: /Terug naar Tess/ }).click();
  await expect(page).toHaveURL(/\/$/);

  await wisselaar(page).click();
  await page.getByRole('button', { name: 'Ouder' }).click();
  await expect(page.getByRole('heading', { name: 'Even je pincode' })).toBeVisible();

  const venster = page.getByRole('dialog');
  await venster.getByLabel('Pincode', { exact: true }).fill('0000');
  await venster.getByRole('button', { name: 'Verder', exact: true }).click();
  await expect(venster.getByRole('alert')).toContainText('niet de pincode van dit apparaat');
  await expect(page).not.toHaveURL(/\/ouder$/);

  await venster.getByLabel('Pincode', { exact: true }).fill('4821');
  await venster.getByRole('button', { name: 'Verder', exact: true }).click();
  await expect(page).toHaveURL(/\/ouder$/);
});

/**
 * Het gat dat ADR-173 openliet, als test (ADR-176).
 *
 * Een kind meldt zich aan, opent de wisselaar en kon de pincode van de ouder
 * zetten — systematisch, want het kind opent de app als eerste. Daarmee gaf het
 * zichzelf de instellingen, werd de parental gate een poort waarvan het kind de
 * sleutel uitdeelde, en kon het zijn ouder buitensluiten.
 */
/**
 * Waar ADR-176 een hek zette, staat sinds ADR-178 een deur met een slot erop —
 * zodra de bouw een gezinsproject heeft, en die van deze suite heeft er een.
 *
 * Het verschil zit hem erin wíe erover gaat. Het geboortejaar werd door dit
 * apparaat beoordeeld, dus een twaalfjarige die het doorhad, tikte 1985. Of het
 * account opengaat beslist de server, en die weet iets wat dit apparaat niet
 * kan verzinnen: of er op een adres geklikt is. Wat hier vastligt is dat een
 * "nee" van die server ook echt een nee is, en niet een scherm dat toch
 * doorschuift.
 */
test('een kind komt niet langs de poort en kan de pincode dus niet zetten', async ({ page }) => {
  await signIn(page, 'Daan');

  // De server zegt nee, want dit e-mailadres en dit wachtwoord horen niet bij
  // elkaar — precies wat een kind te horen krijgt dat iets probeert.
  await page.route(`${GEZIN}/auth/v1/token**`, (route) =>
    antwoord(route, 400, { error_description: 'Invalid login credentials' }),
  );

  await wisselaar(page).click();
  await page.getByRole('button', { name: 'Ouder' }).click();

  // Er staat geen pincodeveld: eerst de poort. En geen geboortejaar meer, want
  // dat is de terugval voor een bouw zonder project (ADR-178).
  await expect(page.getByLabel('Nieuwe pincode')).toHaveCount(0);
  await expect(page.getByLabel('In welk jaar ben je geboren?')).toHaveCount(0);

  const blok = page.getByRole('region', { name: 'Account', exact: true });
  await blok.getByLabel('E-mailadres').fill('daan@example.nl');
  await blok.getByLabel('Wachtwoord').fill('ietsgeprobeerd');
  await blok.getByRole('button', { name: 'Inloggen', exact: true }).click();

  await expect(blok.getByRole('alert')).toContainText('horen niet bij elkaar');
  await expect(page.getByLabel('Nieuwe pincode')).toHaveCount(0);

  // En er is niets blijven hangen waarmee een volgende poging wél langskomt.
  const opslag = await page.evaluate(() => JSON.stringify(window.localStorage));
  expect(opslag).not.toContain('daan@example.nl');
  expect(opslag).not.toContain('ietsgeprobeerd');
});

/**
 * Het gat dat ADR-178 er bijna zelf in liet (ADR-179 in de maak: dit is de
 * reden dat de poort niet naar de sessie kijkt).
 *
 * De sessie van een ouder staat in `localStorage` en blijft daar maanden
 * staan — dat hoort ook, anders logt een ouder elke week opnieuw in. Maar dit
 * is een gedeeld apparaat, en dát is de hele reden dat er een pincode is. Zou
 * "is er een sessie?" de poort zijn, dan is de weg voor een kind: tik op
 * _Pincode vergeten?_, loop naar binnen op de sessie van je vader, kies een
 * nieuwe code, en je vader staat buiten. Dat is precies het gat dat ADR-176
 * dichtte, één laag hoger terug.
 */
test('het kind komt met de sessie van zijn ouder de pincode niet opnieuw zetten', async ({
  page,
}) => {
  await stubGezin(page);
  await signIn(page, 'Roos');
  await maakOuder(page, '4821');
  await page.getByRole('button', { name: /Terug naar Roos/ }).click();

  // Vanaf hier is het kind aan de beurt, op een apparaat waar de ouder
  // ingelogd is gebleven.
  await page.route(`${GEZIN}/auth/v1/token**`, (route) =>
    antwoord(route, 400, { error_code: 'invalid_credentials', msg: 'Invalid login credentials' }),
  );

  await wisselaar(page).click();
  await page.getByRole('button', { name: 'Ouder' }).click();
  await page.getByRole('button', { name: 'Pincode vergeten?' }).click();

  // Geen pincodeveld: eerst het wachtwoord, ook al staat er een sessie.
  await expect(page.getByRole('heading', { name: 'Ben jij het?' })).toBeVisible();
  await expect(page.getByLabel('Nieuwe pincode')).toHaveCount(0);

  await page.getByLabel('Je wachtwoord').fill('gegokt');
  await page.getByRole('button', { name: 'Verder', exact: true }).click();

  await expect(page.getByRole('alert')).toContainText('horen niet bij elkaar');
  await expect(page.getByLabel('Nieuwe pincode')).toHaveCount(0);

  // En de oude code doet het nog: er is niets weggehaald door te proberen.
  await page.goto('/');
  await wisselaar(page).click();
  await page.getByRole('button', { name: 'Ouder' }).click();
  await page.getByLabel('Pincode').fill('4821');
  await page.getByRole('button', { name: 'Verder', exact: true }).click();
  await expect(page).toHaveURL(/\/ouder$/);
});

/**
 * Een vergeten pincode was een val (ADR-176).
 *
 * ADR-173 liet de pincode met opzet niet resetten — "een weg die alleen het slot
 * weghaalt zou geen slot zijn" — en dat klopte alleen zolang de ouder degene was
 * die hem zette. De enige uitweg was het hele apparaat wissen, en dat is geen
 * herstel maar verlies.
 */
test('een vergeten pincode is te vervangen, zonder iets te wissen', async ({ page }) => {
  await signIn(page, 'Roos');
  await maakOuder(page, '4821');
  await page.getByRole('button', { name: /Terug naar Roos/ }).click();

  await wisselaar(page).click();
  await page.getByRole('button', { name: 'Ouder' }).click();
  await page.getByRole('button', { name: 'Pincode vergeten?' }).click();

  // Ook hier staat de poort ervoor, en die is de hele bescherming. De sessie
  // van net opent hem niet: die zegt dat hier ooit een ouder inlogde, niet dat
  // er nu een staat (ADR-178).
  await herbevestig(page);
  await page.getByLabel('Nieuwe pincode').fill('1357');
  await page.getByLabel('Nog een keer').fill('1357');
  await page.getByRole('button', { name: 'Bewaren', exact: true }).click();

  await expect(page).toHaveURL(/\/ouder$/);

  // Het kind staat er nog: er is niets gewist om erbij te komen.
  await expect(page.getByRole('region', { name: 'Je kinderen' })).toContainText('Roos');

  // En de oude code werkt niet meer.
  await page.getByRole('button', { name: /Terug naar Roos/ }).click();
  await wisselaar(page).click();
  await page.getByRole('button', { name: 'Ouder' }).click();
  const venster = page.getByRole('dialog');
  await venster.getByLabel('Pincode', { exact: true }).fill('4821');
  await venster.getByRole('button', { name: 'Verder', exact: true }).click();
  await expect(venster.getByRole('alert')).toContainText('niet de pincode van dit apparaat');
});

test('wie zonder pincode op /ouder komt, krijgt de deur en niet de pagina', async ({ page }) => {
  await signIn(page, 'Mees');

  await page.goto('/ouder');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Dit is de ouderpagina' }),
  ).toBeVisible();

  // Niets van wat erachter zit is te zien: geen codeveld, geen wissen.
  await expect(page.getByLabel('Typ de code')).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Alles van dit apparaat halen' })).toHaveCount(0);

  // En het adres blijft staan: het wordt niet weggeschreven naar een andere
  // pagina, want dan zou de terugknop een stap overslaan.
  await expect(page).toHaveURL(/\/ouder$/);
});

test('de ouderpagina draagt de kinderen, premium, de instellingen en het wissen', async ({
  page,
}) => {
  await signIn(page, 'Iris');
  await maakOuder(page);

  for (const blok of [
    'Je kinderen',
    'Hoe gaat het?',
    'Premium',
    'Instellingen',
    'Alles van dit apparaat halen',
  ]) {
    await expect(page.getByRole('region', { name: blok, exact: true })).toBeVisible();
  }

  // Het kind staat erin, met zijn groep, en de naam is hier te veranderen —
  // ook die van een kind dat nu niet aan de beurt is.
  const kinderen = page.getByRole('region', { name: 'Je kinderen' });
  const rij = kinderen.getByRole('button', { name: /^Iris/ });
  await expect(rij).toContainText('geen groep gekozen');
  await rij.click();
  await expect(kinderen.getByRole('button', { name: 'Groep 5' })).toBeVisible();
});

/**
 * Wat de poort belooft, staat erachter (ADR-177).
 *
 * Deze pagina zei op vier plekken "hierachter staat hoe het met je kinderen
 * gaat" — in de poort, in de volwassenencheck, bij het zetten van de pincode en
 * in de rij van de wisselaar — en had geen enkel getal. Deze test is die vier
 * zinnen, als toets.
 */
test('hoe het met je kinderen gaat, staat er per kind en niet opgeteld', async ({ page }) => {
  await signIn(page, 'Fenna');

  // Eén ronde, zodat er iets te melden valt.
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
  await page.getByRole('button', { name: 'Stoppen' }).click();
  await expect(page.getByRole('heading', { name: 'Ronde klaar' })).toBeVisible();

  // Terug naar de app: het uitslagscherm draagt de balk niet, en de wisselaar
  // zit in de balk.
  await page.goto('/');
  await maakOuder(page);
  const blok = page.getByRole('region', { name: 'Hoe gaat het?' });

  // Per kind een eigen kaart met zijn naam erboven: twee kinderen optellen
  // geeft een getal dat over niemand gaat.
  await expect(blok.getByRole('heading', { name: 'Fenna' })).toBeVisible();
  // Over het kind in de derde persoon: de ouder leest dit.
  await expect(blok).toContainText('kent Fenna inmiddels');
  await expect(blok).toContainText('van de 1 die Fenna geoefend heeft');
  await expect(blok).toContainText('Fenna oefende op 1 van de laatste 7 dagen.');

  // De schatting mag hier staan, en zegt dat hij er een is. Op Jij is ze weg:
  // daar is de lezer acht en leest hij geen percentages (ADR-177).
  await expect(blok).toContainText(/naar schatting nog \d+% van over\./);

  // Een tweede kind komt er los bij te staan, en niet erbij opgeteld.
  const kinderen = page.getByRole('region', { name: 'Je kinderen' });
  await kinderen.getByRole('button', { name: 'Nog een kind erbij' }).click();
  await kinderen.getByLabel('Naam').fill('Joep');
  await kinderen.getByRole('button', { name: 'Toevoegen' }).click();

  await expect(blok.getByRole('heading', { name: 'Joep' })).toBeVisible();
  await expect(blok).toContainText('Joep heeft nog niets geoefend.');
});

test('de sessie van de ouder overleeft een adreswissel in hetzelfde tabblad', async ({ page }) => {
  await signIn(page, 'Loes');
  await maakOuder(page);

  await page.goto('/jij');
  await page.goto('/ouder');
  await expect(page.getByRole('region', { name: 'Je kinderen' })).toBeVisible();
});

/**
 * Zonder code, want de rest van dit bestand draait ermee
 * (`playwright.config.ts`) en de verkoopkant van de premiumpagina is precies
 * wat een kind zonder code te zien krijgt.
 */
test.describe('zonder code', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  /**
   * De parental gate die Apple en Google eisen: een kind dat op de
   * premiumpagina belandt, vindt daar geen veld maar één knop naar de ouder.
   */
  test('het codeveld staat niet op de premiumpagina, maar erachter', async ({ page }) => {
    await stubGezin(page);
    await signIn(page, 'Wout');
    await page.goto('/premium');

    await expect(page.getByLabel('Typ de code')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Code gebruiken' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Ik ben de ouder' }).click();
    await langsDePoort(page);
    await page.getByLabel('Nieuwe pincode').fill('1234');
    await page.getByLabel('Nog een keer').fill('1234');
    await page.getByRole('button', { name: 'Bewaren', exact: true }).click();

    await expect(page).toHaveURL(/\/ouder$/);
    await expect(page.getByLabel('Typ de code')).toBeVisible();
  });

  /**
   * Drie kinderen zijn gratis (ADR-173). Tot nu toe was meer dan één kind
   * premium, en dat botst met één code die voor alle drie geldt: dan moet een
   * gezin betalen om te kunnen zien wat er te betalen valt.
   */
  test('een tweede kind kan zonder premium', async ({ page }) => {
    await signIn(page, 'Bram');

    await wisselaar(page).click();
    await page.getByRole('button', { name: 'Nog een kind erbij' }).click();
    await page.getByLabel('Naam van het kind').fill('Fien');
    await page.getByRole('button', { name: 'Toevoegen', exact: true }).click();

    await expect(page.getByRole('banner').getByRole('button', { name: 'Fien' })).toBeVisible();
  });
});
