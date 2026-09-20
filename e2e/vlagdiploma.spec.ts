import { expect, test, type Page } from '@playwright/test';
import { alsOnthouden } from './zaai';

/**
 * The vlaggendiploma (ADR-104): six on the flags page with the gaps showing,
 * one press to sit one, nothing said until the end, and the six again on the
 * child's own page.
 */

async function signIn(page: Page, naam: string) {
  await page.goto('/');
  await page.getByPlaceholder('Je naam').fill(naam);
  await page.getByRole('button', { name: 'Beginnen' }).click();
  // De groep is een tweede stap, altijd over te slaan (ADR-151).
  await page.getByRole('button', { name: 'Zeg ik niet' }).click();
  await expect(page.getByRole('banner').getByRole('button', { name: naam })).toBeVisible();
}

/**
 * How the browser drew the flags to choose from, from the group up to the page:
 * the size of each box and anything that takes it out of the accessibility
 * tree. Runs in the page. A group that is in the page but not found by its role
 * says nothing about why in the error alone, and a phone in WebKit is where it
 * happened (the deploy of #40).
 */
function beschrijfGroep(): string {
  const groep = document.querySelector('.tk-vlag-keuze');
  if (!groep) return 'Geen .tk-vlag-keuze in de pagina.';

  const regels: string[] = [];
  for (let el: Element | null = groep; el; el = el.parentElement) {
    const stijl = getComputedStyle(el);
    const doos = el.getBoundingClientRect();
    const zichtbaar = (el as Element & { checkVisibility?: () => boolean }).checkVisibility?.();
    regels.push(
      `${el.tagName.toLowerCase()} "${String(el.className)}" ` +
        `${Math.round(doos.width)}x${Math.round(doos.height)} op y=${Math.round(doos.y)}, ` +
        `display ${stijl.display}, visibility ${stijl.visibility}, ` +
        `checkVisibility ${String(zichtbaar)}` +
        (el.hasAttribute('aria-hidden')
          ? `, aria-hidden ${String(el.getAttribute('aria-hidden'))}`
          : '') +
        (el.hasAttribute('inert') ? ', inert' : ''),
    );
  }
  const knoppen = groep.querySelectorAll('button').length;
  return `De vlaggen, ${knoppen} knoppen, van de groep omhoog:\n${regels.join('\n')}`;
}

/** Takes the first option every time until the round is over. */
async function speel(page: Page) {
  const klaar = page.getByRole('heading', { name: 'Ronde klaar' });
  const volgende = page.getByRole('button', { name: 'Volgende vraag' });
  const vlaggen = page.getByRole('group', { name: 'Kies een vlag' });
  const namen = page.getByRole('group', { name: 'Kies een naam' });

  for (let vraag = 0; vraag < 40; vraag++) {
    try {
      await expect(klaar.or(volgende).or(vlaggen).or(namen).first()).toBeVisible();
    } catch (error) {
      // Say where the round stood, which the locator alone cannot: which
      // question, what the screen said instead of asking it, and how the
      // flags to choose from were drawn.
      const scherm = (await page.locator('body').innerText()).slice(0, 1500);
      const groep = await page.evaluate(beschrijfGroep);
      throw new Error(
        `Vraag ${vraag + 1}: niets om te beantwoorden. Op het scherm:\n${scherm}\n\n${groep}\n\n${String(error)}`,
      );
    }
    if (await klaar.isVisible()) return;
    // A diploma says nothing until the end, so there is never a "next".
    await expect(volgende).toHaveCount(0);
    if (await vlaggen.isVisible()) await vlaggen.getByRole('button').first().click();
    else await namen.getByRole('button').first().click();
  }
  throw new Error('Het diploma hield niet op.');
}

/**
 * Een gewone ronde Zuid-Amerika, vlag zoeken, eerste keus elke keer. Twee keer
 * gespeeld raakt de twaalf vlaggen van het werelddeel; `alsOnthouden` zet
 * daarna de doos, en pas dan is de pagina rijp genoeg om af te zwemmen — elf
 * van de twaalf (ADR-141).
 */
async function zoekDeVlaggen(page: Page) {
  await page.goto('/vlaggen');
  await page
    .getByRole('region', { name: 'Waar op de kaart?' })
    .getByRole('button', { name: 'Zuid-Amerika' })
    .click();
  await page
    .getByRole('region', { name: /Kies een onderwerp/ })
    .getByRole('button', { name: /^Alle vlaggen/ })
    .click();
  await page
    .getByRole('region', { name: /Hoe wil je/ })
    .getByRole('button', { name: /^Vlag zoeken/ })
    .click();
  await page.locator('.tk-choose-start button').click();

  const klaar = page.getByRole('heading', { name: 'Ronde klaar' });
  const volgende = page.getByRole('button', { name: 'Volgende vraag' });
  const vlaggen = page.getByRole('group', { name: 'Kies een vlag' });
  const namen = page.getByRole('group', { name: 'Kies een naam' });
  for (let vraag = 0; vraag < 40; vraag++) {
    await expect(klaar.or(volgende).or(vlaggen).or(namen).first()).toBeVisible();
    if (await klaar.isVisible()) return;
    if (await volgende.isVisible()) await volgende.click();
    else if (await vlaggen.isVisible()) await vlaggen.getByRole('button').first().click();
    else await namen.getByRole('button').first().click();
  }
  throw new Error('De ronde Zuid-Amerika hield niet op.');
}

test('six vlaggendiploma’s, and one press chooses a whole werelddeel to sit', async ({ page }) => {
  await signIn(page, 'Anouk');
  await page.goto('/vlaggen');

  const muur = page.getByRole('region', { name: 'Jouw vlaggendiploma’s' });
  // Zeven sinds ADR-168: de provincievlaggen hebben er ook een.
  await expect(muur.getByRole('button')).toHaveCount(7);
  await muur.getByRole('button', { name: 'Zuid-Amerika: nog geen vlaggendiploma' }).click();

  const waar = page.getByRole('region', { name: 'Waar op de kaart?' });
  await expect(waar.getByRole('button', { name: 'Zuid-Amerika' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  const wat = page.getByRole('region', { name: /Kies een onderwerp/ });
  await expect(wat.getByRole('button', { name: /^Alle vlaggen/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  const hoe = page.getByRole('region', { name: /Hoe wil je/ });
  await expect(hoe.getByRole('button', { name: /^Vlaggendiploma/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  // A diploma is its own length.
  await expect(page.getByRole('region', { name: 'Hoeveel vragen?' })).toHaveCount(0);

  await page.locator('.tk-choose-start button').click();

  // Niemand oefende deze vlaggen, dus de pagina is niet rijp: één knop, en die
  // gaat terug naar oefenen. Sinds proefzwemmen weg is, is dat de enige uitweg.
  await expect(page.getByText('Nog niet klaar om af te zwemmen')).toBeVisible();
  const knoppen = page.locator('.tk-uitslag-knoppen').getByRole('button');
  await expect(knoppen).toHaveCount(1);
  await expect(knoppen).toHaveText('Eerst oefenen');
  await knoppen.click();

  // Dus eerst oefenen. Twee rondes raken alle twaalf de vlaggen.
  await zoekDeVlaggen(page);
  await zoekDeVlaggen(page);
  await alsOnthouden(page);

  await page.goto('/vlaggen');
  await muur.getByRole('button', { name: 'Zuid-Amerika: nog geen vlaggendiploma' }).click();
  await page.locator('.tk-choose-start button').click();
  await expect(page.getByText('Klaar om af te zwemmen', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Nee, ik begin' }).click();
  await speel(page);

  await expect(page.getByText(/^Vlaggendiploma|^Nog geen diploma/)).toBeVisible();
  await expect(page.getByText('Cijfer', { exact: true })).toBeVisible();

  // En in de kast op Jij, waar alle diploma's staan die dit kind kan halen.
  await page.goto('/jij');
  const kast = page.getByRole('region', { name: 'Jouw diploma’s' });
  // Vlaggen staat open: het vak van de laatste ronde is het vak dat openstaat.
  // Zeven sinds ADR-168: de provincievlaggen hebben er ook een.
  await expect(kast.getByRole('region', { name: 'Vlaggen' }).getByRole('button')).toHaveCount(7);
});
