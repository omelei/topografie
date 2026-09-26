import { expect, test, type Page } from '@playwright/test';
import { alsOnthouden } from './zaai';
import { signIn } from './naam';

/**
 * Rekenen: the second module, and the first thing in this product that is not a
 * map.
 *
 * What is worth testing here is not the arithmetic — `sums.test.ts` multiplies
 * every one of the hundred and twenty back out — but that the module has an
 * address, that a round of it writes to the same schedule the map writes to,
 * and that the rail exists at all, which it did not while there was one module
 * (ADR-037).
 */

async function startTable(page: Page, tafel: number, hoe: RegExp) {
  await page.goto('/rekenen');
  await expect(page.getByRole('heading', { name: /^Wat wil je oefenen,/ })).toBeVisible();

  const wat = page.getByRole('region', { name: /Kies een onderwerp/ });
  const hoeStap = page.getByRole('region', { name: /Hoe wil je/ });

  // Step 1 is five subjects now, and the tables are one of them. Which table is
  // the second, smaller question underneath — a chip whose visible label is the
  // number and whose accessible name is the whole thing (ADR-062).
  // Anchored rather than exact: a subject card's accessible name is everything
  // on it — the name, how it is going, and the line saying what is in it.
  await wat.getByRole('button', { name: /^Tafels/ }).click();
  // Not scoped to step 1 any more: which table is its own numbered step now.
  // Exact, which is what keeps it off the start button and off the diploma
  // wall — both of those name the table inside a longer label.
  await page.getByRole('button', { name: `Tafel van ${tafel}`, exact: true }).click();
  await hoeStap.getByRole('button', { name: hoe }).click();
  await start(page);
}

/** The table of one, ten sums long, every one of them right. */
async function tienGoed(page: Page) {
  for (let vraag = 1; vraag <= 10; vraag++) {
    const som = await page.locator('.tk-sum').innerText();
    await page.getByPlaceholder('Antwoord').fill((som.split('×')[1] ?? '').trim());
    await page.getByRole('button', { name: 'Kijk na' }).click();
    const volgende = page.getByRole('button', { name: 'Volgende vraag' });
    const klaar = page.getByRole('heading', { name: 'Ronde klaar' });
    await expect(volgende.or(klaar).first()).toBeVisible();
    if (await klaar.isVisible()) break;
    await volgende.click();
  }
  await expect(page.getByRole('heading', { name: 'Ronde klaar' })).toBeVisible();
}

/** The one way out of K2, whatever was chosen. See e2e/app.spec.ts. */
async function start(page: Page) {
  await page.locator('.tk-choose-start button').click();
}

/**
 * Step 1 on rekenen: the tables. Nothing is pressed when the page opens — only
 * an address chooses a set — so the keypad and the diploma wall wait for this.
 */
async function kiesTafels(page: Page) {
  await page
    .getByRole('region', { name: /Kies een onderwerp/ })
    .getByRole('button', { name: /^Tafels/ })
    .click();
}

test('the rail is the map of the product, not a list of what is finished', async ({
  page,
}, testInfo) => {
  // Only at a desk: below 1200 the modules are the menu under the app bar
  // instead (ADR-093), which e2e/shell.spec.ts walks. The test below covers
  // the front door's own list, at every size.
  test.skip(!['chromebook', 'desktop-1440'].includes(testInfo.project.name), 'no rail below 1200');

  await signIn(page, 'Sam');

  // ADR-051. Five doors, of which three are not open yet — a rail with only
  // the two built ones does not read as a short list, it reads as the whole
  // product, and a child could not tell what leer.nu is for.
  const rail = page.getByRole('navigation', { name: 'Vakken' });
  await expect(rail.getByRole('button')).toHaveCount(5);

  for (const naam of ['Topo', 'Rekenen', 'Klok', 'Taal', 'Vlaggen']) {
    await expect(rail.getByRole('button', { name: naam, exact: true })).toBeVisible();
  }

  // Every door on the rail is open now — Taal was the last (ADR-118) — so a
  // door opens its module's page and the rail says which one is showing.
  const taal = rail.getByRole('button', { name: 'Taal', exact: true });
  await taal.click();
  await expect(page.getByRole('heading', { name: /^Wat wil je oefenen,/ })).toBeVisible();
  await expect(taal).toHaveAttribute('aria-current', 'page');
});

test('the tables have an address of their own', async ({ page }) => {
  await signIn(page, 'Roos');
  // The slug still works — it has been written down — and it is the same page.
  await page.goto('/tafels');

  await expect(page.getByRole('heading', { name: /^Wat wil je oefenen,/ })).toBeVisible();
  await kiesTafels(page);
  await expect(page.getByRole('button', { name: 'Tafel van 7', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tafel van 12', exact: true })).toBeVisible();
});

test('rekenen is the word a parent looks for, and it is the page itself', async ({ page }) => {
  await signIn(page, 'Daan');
  await page.goto('/rekenen');

  // A category holding one built module *is* that module. There used to be a
  // page here with a single card on it saying "Rekenen", which charged a child
  // a click to be told what they had already typed. Tafels sits under rekenen;
  // klokkijken sits beside it (ADR-044).
  await expect(page.getByRole('heading', { name: /^Wat wil je oefenen,/ })).toBeVisible();

  // Nothing is chosen for the child: no subject pressed, and a start bar that
  // is there but cannot start until every step has an answer.
  const tafels = page
    .getByRole('region', { name: /Kies een onderwerp/ })
    .getByRole('button', { name: /^Tafels/ });
  await expect(tafels).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('.tk-choose-start button')).toBeDisabled();

  await kiesTafels(page);
  await expect(page.getByRole('button', { name: 'Tafel van 3', exact: true })).toBeVisible();
});

/**
 * A set has an address, so a parent can send a child to one exercise rather
 * than to a chooser. The page opens on it rather than on its own first set.
 */
test('a set has an address, and the page opens on it', async ({ page }) => {
  await signIn(page, 'Nienke');

  // Scoped to step 1, because the start button names the chosen set as well —
  // which is what K2 puts it there for, and which makes an unscoped query for
  // the set name ambiguous on exactly the page that opened on it.
  const wat = page.getByRole('region', { name: /Kies een onderwerp/ });

  await page.goto('/rekenen/tafel-7');
  await expect(page.getByRole('button', { name: 'Tafel van 7', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  // And the subject the chip sits under is open, so the page shows the chips at
  // all rather than opening on the first subject and hiding the one asked for.
  await expect(wat.getByRole('button', { name: /^Tafels/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  // Topography's cities are one subject with two chips under it now, so an
  // address for one of them has to open the card as well as press the chip
  // (ADR-083).
  await page.goto('/topografie/hoofdsteden');
  await expect(
    page.getByRole('button', { name: 'Hoofdsteden van de provincies', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(wat.getByRole('button', { name: /^Steden/ }).first()).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('typing a table: right, wrong, and not knowing', async ({ page }) => {
  await signIn(page, 'Fenna');
  await startTable(page, 2, /Zelf typen/);

  const answer = page.getByPlaceholder('Antwoord');
  await expect(answer).toBeFocused();

  // Ten dots for ten sums: a round is the whole table.
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '10');

  await answer.fill('999');
  await page.getByRole('button', { name: 'Kijk na' }).click();

  // Whatever the sum was, the answer is shown and what the child said is quoted
  // back — a cross beside a number teaches nothing.
  await expect(page.getByRole('status')).toContainText('= ');
  await expect(page.getByRole('status')).toContainText('999');

  await page.getByRole('button', { name: 'Volgende vraag' }).click();
  await page.getByRole('button', { name: 'Ik weet het niet' }).click();
  await expect(page.getByRole('button', { name: 'Volgende vraag' })).toBeVisible();
});

test('choosing a table: four numbers, one of them right', async ({ page }) => {
  await signIn(page, 'Joris');
  await startTable(page, 3, /Kies uit 4/);

  const options = page.getByRole('group', { name: 'Kies het antwoord' });
  await expect(options.getByRole('button')).toHaveCount(4);

  await options.getByRole('button').first().click();
  await expect(page.getByRole('button', { name: 'Volgende vraag' })).toBeVisible();
});

test('a finished table says what changed, not only what was scored', async ({ page }) => {
  await signIn(page, 'Mila');
  await startTable(page, 1, /Zelf typen/);

  // The table of one, so every answer is the multiplier itself and the round
  // can be finished honestly rather than by guessing.
  for (let n = 1; n <= 10; n++) {
    const som = await page.locator('.tk-sum').innerText();
    const antwoord = som.split('×')[1]?.trim() ?? '';

    await page.getByPlaceholder('Antwoord').fill(antwoord);
    await page.getByRole('button', { name: 'Kijk na' }).click();
    await page.getByRole('button', { name: 'Volgende vraag' }).click();
  }

  await expect(page.getByRole('heading', { name: 'Ronde klaar' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Hoe de ronde ging' })).toBeVisible();
  // Binnen de samenvatting, want "Iets nieuws leren" legt er verderop hetzelfde
  // in andere woorden uit, en dat is geen toeval: het is dezelfde regel.
  const uitslag = page.getByRole('region', { name: 'Hoe de ronde ging' });
  await expect(uitslag.getByText('10 vragen, 10 goed', { exact: true })).toBeVisible();
  // En de regel die vooruitkijkt, naar wat terugkomt. Dat is wat er van deze
  // ronde overblijft nu de stenen weg zijn: alleen wat terugkomt kan onthouden
  // raken, en alleen wat onthouden is telt voor een diploma.
  await expect(uitslag.getByText(/Morgen kom(t|en) er/)).toBeVisible();
});

/**
 * The clock and the lives, over all twelve tables rather than the chosen one.
 * Ten sums is over long before a minute is, and a child who reaches for the
 * clock is one who already knows a table.
 */
test('a survival round of tables runs on lives, not on ten questions', async ({ page }) => {
  await signIn(page, 'Lieke');
  await startTable(page, 1, /^Overleven\b/);

  await expect(page.getByPlaceholder('Antwoord')).toBeVisible();

  // No dots: there is no ten to count towards.
  await expect(page.getByRole('progressbar')).toHaveCount(0);

  const levens = page
    .getByRole('banner')
    .locator('div')
    .filter({ hasText: /^levens\d$/ });
  await expect(levens).toContainText('3');

  await page.getByPlaceholder('Antwoord').fill('999');
  await page.getByRole('button', { name: 'Kijk na' }).click();
  await expect(levens).toContainText('2');

  // Saying you do not know still costs nothing, here as on the map (ADR-048).
  await page.getByRole('button', { name: 'Volgende vraag' }).click();
  await page.getByRole('button', { name: 'Ik weet het niet' }).click();
  await expect(levens).toContainText('2');
});

test('the lightning round is offered without a setting, and marked premium', async ({ page }) => {
  // It used to wait for "Klok bij het oefenen", which was off by default, so
  // most children never saw it. ADR-112 offers it on every page.
  await signIn(page, 'Timo');
  await page.goto('/rekenen');

  const bliksem = page
    .getByRole('region', { name: /Hoe wil je/ })
    .getByRole('button', { name: /^Bliksemronde\b/ });
  await expect(bliksem).toBeVisible();
  await expect(bliksem).toHaveAccessibleName(/Premium$/);
});

/**
 * Rekenen is four kinds of sum now, not one.
 *
 * What is worth checking is not that 34 + 9 is 43 — `sums.content.test.ts`
 * works all five hundred of them back out — but that a child can reach each
 * kind, that the page keeps its shape while they do, and that no section ever
 * grows past six cards.
 */
test('rekenen offers nine subjects, as the tiles every module uses', async ({ page }) => {
  await signIn(page, 'Bram');
  await page.goto('/rekenen');

  const wat = page.getByRole('region', { name: /Kies een onderwerp/ });

  for (const naam of [
    'Tafels',
    'Keersommen',
    'Deelsommen',
    'Plussommen',
    'Minsommen',
    'Splitsen',
    'Halveren',
    'Verdubbelen',
    'Rekenmix',
  ]) {
    await expect(wat.getByRole('button', { name: new RegExp(`^${naam}`) })).toBeVisible();
  }

  // Six was the ceiling a section of tiles may hold (ADR-061, ADR-062). ADR-120
  // gave rekenen three more kinds of sum, and ADR-168 made them tiles like every
  // other module's subjects — "Oefen je fouten" is er geen meer, dus het zijn er
  // negen en de rij eindigt op de Rekenmix. The step holds nothing else, so the
  // region's buttons are the subjects.
  await expect(wat.getByRole('button')).toHaveCount(9);
  await expect(wat.locator('.tk-tegel')).toHaveCount(9);
  await expect(wat.getByRole('button').last()).toContainText('Rekenmix');
});

test('a subject with many sets asks which, instead of showing all of them', async ({ page }) => {
  await signIn(page, 'Sten');
  await page.goto('/rekenen');

  const wat = page.getByRole('region', { name: /Kies een onderwerp/ });

  // Each second question is a step of its own, named by what it asks, so its
  // answers are the buttons in that region and nothing else — not the chips
  // further down that say how long the round is (ADR-074).
  const welke = (vraag: RegExp) => page.getByRole('region', { name: vraag }).getByRole('button');

  // Twelve tables as a keypad under the subjects (ADR-095), and no mix square
  // among them: the Rekenmix is a subject of its own (ADR-100).
  await wat.getByRole('button', { name: /^Tafels/ }).click();
  await expect(welke(/^Welke tafel/)).toHaveCount(12);

  // The keersommen in three ranges, and the deelsommen in the same three
  // (ADR-120): no keypad of twelve divisors any more.
  await wat.getByRole('button', { name: /^Keersommen/ }).click();
  await expect(welke(/^Tot welk getal/)).toHaveText(['tot 10', 'tot 100', 'tot 1000']);

  await wat.getByRole('button', { name: /^Deelsommen/ }).click();
  await expect(welke(/^Tot welk getal/)).toHaveText(['tot 10', 'tot 100', 'tot 1000']);

  // Splitsen stops at a hundred: past that it is plus and minus.
  await wat.getByRole('button', { name: /^Splitsen/ }).click();
  await expect(welke(/^Tot welk getal/)).toHaveText(['tot 10', 'tot 20', 'tot 100']);

  // Plus has three ranges, and they are offered smallest first. Sorted as
  // numbers: "1000" falls between "100" and "20" in every alphabet there is.
  await wat.getByRole('button', { name: /^Plussommen/ }).click();
  await expect(welke(/^Tot welk getal/)).toHaveCount(3);
  await expect(welke(/^Tot welk getal/)).toHaveText(['tot 20', 'tot 100', 'tot 1000']);

  // The Rekenmix has three difficulties and an everything, out of the level
  // every set already carried (ADR-073).
  await wat.getByRole('button', { name: /^Rekenmix/ }).click();
  await expect(welke(/^Hoe moeilijk/)).toHaveCount(4);
  await expect(welke(/^Hoe moeilijk/)).toHaveText([
    'Makkelijk',
    'Gemiddeld',
    'Pittig',
    'Door elkaar',
  ]);
});

test('a plus sum is a plus sum, and a division is a division', async ({ page }) => {
  await signIn(page, 'Lieve');
  await page.goto('/rekenen/plus-20');

  await page
    .getByRole('region', { name: /Hoe wil je/ })
    .getByRole('button', { name: /Zelf typen/ })
    .click();
  await start(page);

  await expect(page.locator('.tk-sum')).toContainText('+');

  await page.goto('/rekenen/delen-100');
  await page
    .getByRole('region', { name: /Hoe wil je/ })
    .getByRole('button', { name: /Zelf typen/ })
    .click();
  await start(page);

  // The colon Dutch primary school divides with, never the obelus.
  await expect(page.locator('.tk-sum')).toContainText(':');
});

/**
 * The tafeldiploma: the test a child already knows from school, without the
 * stopwatch (ADR-064). Ten sums of one table, in order, and one mistake ends
 * the attempt.
 */
test('a diploma is passed or it is not, and one mistake ends the attempt', async ({ page }) => {
  await signIn(page, 'Guus');

  // Not offered on a mix: there is no diploma for "alle tafels door elkaar".
  await page.goto('/rekenen/mix');
  await expect(
    page.getByRole('region', { name: /Hoe wil je/ }).getByRole('button', { name: /Tafeldiploma/ }),
  ).toHaveCount(0);

  // Eerst de tafel echt kennen. Sinds proefzwemmen weg is, is dit de enige weg
  // naar een diplomaronde: een pagina die niet rijp is heeft geen knop die er
  // een start.
  await startTable(page, 1, /Zelf typen/);
  await tienGoed(page);
  await alsOnthouden(page);

  await startTable(page, 1, /Tafeldiploma/);
  await expect(page.getByText('Klaar voor de toets', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Nee, ik begin' }).click();

  // A diploma asks the table straight through, so the first sum is 1 x 1.
  await expect(page.locator('.tk-sum')).toContainText('1 × 1');

  await page.getByPlaceholder('Antwoord').fill('999');
  await page.getByRole('button', { name: 'Kijk na' }).click();
  // The button says what it does: this attempt is over, not "next question".
  await page.getByRole('button', { name: 'Bekijk je poging' }).click();

  await expect(page.getByText('Nog geen diploma. Alle 10 goed, dan is hij van jou.')).toBeVisible();
});

test('a diploma passed goes on the wall, where the gaps are the point', async ({
  page,
}, testInfo) => {
  await signIn(page, 'Sanne');

  // A diploma is sat on a ripe page (ADR-149): the table practised, and then
  // every sum of it remembered, which takes days and is set here directly.
  await startTable(page, 1, /Zelf typen/);
  await tienGoed(page);
  await alsOnthouden(page);

  await startTable(page, 1, /Tafeldiploma/);
  await expect(page.getByText('Klaar voor de toets', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Ja, ik haal iemand' }).click();
  await page.getByRole('button', { name: 'Begin' }).click();

  // The table of one, so every answer is the multiplier itself and the attempt
  // can be passed honestly rather than by guessing.
  for (let n = 1; n <= 10; n++) {
    const som = await page.locator('.tk-sum').innerText();
    const antwoord = som.split('×')[1]?.trim() ?? '';

    await page.getByPlaceholder('Antwoord').fill(antwoord);
    await page.getByRole('button', { name: 'Kijk na' }).click();
    // Right every time, so the button stays "Volgende vraag" — the attempt only
    // ends early on a mistake, and on the tenth it ends because it is over.
    await page.getByRole('button', { name: 'Volgende vraag' }).click();
  }

  await expect(page.getByText('Diploma gehaald: tafel van 1')).toBeVisible();
  // Het diploma, groot (ADR-218): van wie, waarvoor, en de toets.
  const diploma = page.locator('.tk-grootdiploma');
  await expect(diploma).toContainText('Dit diploma is van');
  await expect(diploma).toContainText('Sanne');
  await expect(diploma).toContainText('10 van 10 goed');
  await expect(page.locator('[data-beat="knoppen"][data-aan]')).toBeVisible();
  await page.screenshot({ path: `screenshots/${testInfo.project.name}-32-diploma-gehaald.png` });

  await page.goto('/rekenen');
  // The wall is under the tables and nowhere else, so it waits for Tafels too.
  await kiesTafels(page);
  const muur = page.getByRole('region', { name: /tafeldiploma/i });
  await expect(muur.getByRole('button', { name: 'Tafel van 1: diploma gehaald' })).toBeVisible();
  await expect(muur.getByRole('button', { name: 'Tafel van 7: nog geen diploma' })).toBeVisible();
  await expect(muur).toContainText('1 van de 12 gehaald');
  // De tegels in de vorm van het diploma (ADR-219): gehaald in de vakkleur.
  await expect(muur.locator('.tk-diploma[data-gehaald]')).toContainText('Tafeldiploma');
  await muur.scrollIntoViewIfNeeded();
  await muur.screenshot({ path: `screenshots/${testInfo.project.name}-34-diplomamuur.png` });
});

/**
 * The Topomix: everything on the map at once, which means the answer layer
 * belongs to the question rather than to the round (ADR-063).
 */
test('the topomix asks about more than one kind of thing in one round', async ({ page }) => {
  await signIn(page, 'Jill');
  await page.goto('/topografie/mix');

  const wat = page.getByRole('region', { name: /Kies een onderwerp/ });
  // "Topo-mix" rather than "Mix": the tile says which module's mix it is, the
  // way Rekenmix always did. The address is untouched — /topografie/mix still
  // opens it, because a rename that breaks a link a parent wrote down is a
  // rename that costs somebody a page.
  await expect(wat.getByRole('button', { name: /^Topo-mix/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  // Exploring is one set's own layer and is not offered here — a mix is not
  // where anybody meets a set for the first time.
  await expect(
    page.getByRole('region', { name: /Hoe wil je/ }).getByRole('button', { name: /Ontdekken/ }),
  ).toHaveCount(0);

  await page
    .getByRole('region', { name: /Hoe wil je/ })
    .getByRole('button', { name: /Aanwijzen/ })
    .click();
  await start(page);

  // A round starts and asks something. Which of the five sets the first
  // question comes from is the scheduler's business, so this asserts the shape
  // rather than the item.
  await expect(page.getByRole('heading', { name: /Waar ligt / })).toBeVisible();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '15');
});
