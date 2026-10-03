import { expect, test } from '@playwright/test';
import { signIn } from './naam';
import { stap } from './stap';

/**
 * De vakpagina op een telefoon is een accordeon (ADR-252): één stap open, en
 * na elke keuze opent de eerste stap die nog leeg is en staat hij in beeld.
 * Hiervoor sprong de pagina na een keuze naar het volgende onderdeel (ADR-233,
 * ADR-242, ADR-247); nu is het volgende onderdeel het enige dat openstaat.
 */

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

test('op Topo opent na elke keuze de volgende stap, tot alles gekozen is', async ({ page }) => {
  await signIn(page, 'Noor');
  await page.goto('/topografie');

  // Niets gekozen, stap 1 open, en de balk zegt waar je bent.
  const waar = page.getByRole('region', { name: /Waar op de kaart/ });
  await expect(waar.getByRole('button', { name: 'Nederland' })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await expect(page.getByRole('region', { name: 'Kies een onderwerp' })).toHaveCount(0);
  await expect(page.locator('.tk-choose-start')).toContainText('Stap 1 van 3');

  await waar.getByRole('button', { name: 'Nederland' }).click();
  const onderwerpen = page.getByRole('region', { name: 'Kies een onderwerp' });
  await expect(onderwerpen.getByRole('button').first()).toBeInViewport();
  await expect(waar).toHaveCount(0);

  await onderwerpen.getByRole('button', { name: /^Provincies/ }).click();
  const hoe = page.getByRole('region', { name: /Hoe wil je/ });
  await expect(hoe.getByRole('button').first()).toBeInViewport();

  await hoe.getByRole('button', { name: /^Meerkeuze/ }).click();
  // Alles dicht, en het startblok met de knop in reik.
  await expect(page.locator('.tk-stapopen')).toHaveCount(0);
  await expect(page.locator('.tk-choose-start')).toContainText('Klaar om te starten');
  await expect(page.locator('.tk-choose-start .tk-button-go')).toBeInViewport();
});

test('Wijzig opent die stap, en een andere kaart gaat verder bij het onderwerp', async ({
  page,
}) => {
  await signIn(page, 'Noor');
  await page.goto('/topografie');

  await (await stap(page, /Waar op de kaart/)).getByRole('button', { name: 'Nederland' }).click();
  await (
    await stap(page, 'Kies een onderwerp')
  )
    .getByRole('button', { name: /^Provincies/ })
    .click();
  await (await stap(page, /Hoe wil je/)).getByRole('button', { name: /^Meerkeuze/ }).click();

  await page.getByRole('button', { name: /^Wijzig stap 1, Waar op de kaart/ }).click();
  // Alles gekozen en een stap open: een kleine Start.
  await expect(page.locator('.tk-choose-start')).toContainText('Alles gekozen');
  await page
    .getByRole('region', { name: /Waar op de kaart/ })
    .getByRole('button', { name: 'Europa' })
    .click();

  // Het onderwerp is gewist, en daar staat de pagina nu open en in beeld; de
  // spelvorm blijft gekozen.
  const onderwerpen = page.getByRole('region', { name: 'Kies een onderwerp' });
  await expect(onderwerpen.getByRole('button').first()).toBeInViewport();
  await expect(page.getByRole('button', { name: /^Wijzig stap 3, Hoe wil je/ })).toBeVisible();
});

test('op Rekenen opent een onderwerp de vraag welke, en een tafel de spelvormen', async ({
  page,
}) => {
  await signIn(page, 'Noor');
  await page.goto('/rekenen');

  // Eerst welke sommen (ADR-258); daarna staan de onderwerpen open en in beeld.
  await page
    .getByRole('region', { name: 'Welke sommen?' })
    .getByRole('button', { name: /^Keer en delen/ })
    .click();
  const onderwerpen = page.getByRole('region', { name: 'Kies een onderwerp' });
  await expect(onderwerpen.getByRole('button').first()).toBeInViewport();
  await onderwerpen.getByRole('button', { name: /^Tafels/ }).click();
  const welke = page.getByRole('region', { name: 'Welke tafel?' });
  await expect(welke.getByRole('button', { name: 'Tafel van 7', exact: true })).toBeInViewport();

  await welke.getByRole('button', { name: 'Tafel van 7', exact: true }).click();
  const hoe = page.getByRole('region', { name: /Hoe wil je/ });
  await expect(hoe.getByRole('button').first()).toBeInViewport();
});

test('een stap die nog komt, gaat open met een druk op zijn rij', async ({ page }) => {
  await signIn(page, 'Noor');
  await page.goto('/rekenen');

  await page.getByRole('button', { name: /^Naar stap 3: Hoe wil je oefenen\?/ }).click();
  const hoe = page.getByRole('region', { name: /Hoe wil je/ });
  await expect(hoe.getByRole('button').first()).toBeInViewport();
  await expect(page.getByRole('region', { name: 'Kies een onderwerp' })).toHaveCount(0);
});

test('op een telefoon staan de diploma’s en "Over" in een blad', async ({ page }) => {
  await signIn(page, 'Noor');
  await page.goto('/topografie/provincies');

  // Geen wand op de pagina: een rij die zegt hoeveel er gehaald zijn.
  const rij = page.getByRole('button', { name: /^Jouw topodiploma’s/ });
  await expect(rij).toContainText(/\d+ van de \d+ gehaald/);
  await rij.click();
  const blad = page.getByRole('dialog', { name: 'Jouw topodiploma’s' });
  await expect(blad.getByRole('button', { name: /topodiploma/ })).toHaveCount(12);
  await blad.getByRole('button', { name: 'Sluiten' }).click();
  await expect(blad).toBeHidden();

  // "Over" is er ook dicht, voor wie de pagina leest zonder te tikken.
  await expect(page.locator('dialog.tk-blad').getByText('Vragen van ouders')).toHaveCount(1);
  await page.getByRole('button', { name: /^Over Provincies/ }).click();
  await expect(
    page.getByRole('dialog', { name: /^Over Provincies/ }).getByText('Vragen van ouders'),
  ).toBeVisible();
});
