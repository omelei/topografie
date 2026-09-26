import { expect, test, type Page } from '@playwright/test';
import { signIn } from './naam';

/**
 * Het einde van een jaar, aangekondigd in plaats van afgewacht (ADR-129).
 *
 * De config zet elke test op een code die tot 2099 loopt. Deze twee zetten er
 * een andere neer: eentje die bijna om is en eentje die om is. Dat laatste
 * geval is het geval dat geld kost — tot nu toe kreeg wie een jaar betaald had
 * en over de datum was exact dezelfde pagina als iemand die nog nooit van
 * premium had gehoord.
 */

/** YYYY-MM-DD, `dagen` dagen van vandaag. */
function dag(dagen: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dagen);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function zetCode(page: Page, geldigTot: string) {
  await page.evaluate(
    ([tot, nu]) => {
      window.localStorage.setItem(
        'leernu.premium',
        JSON.stringify({ code: 'E2ETESTS', geldigTot: tot, gecontroleerd: nu }),
      );
    },
    [geldigTot, new Date().toISOString()],
  );
  await page.reload();
}

// Op de premiumpagina, sinds ADR-171 de enige plek: het blok op Voor ouders
// zei hetzelfde, en die pagina is weg.
test('een code die bijna om is zegt dat, op de premiumpagina', async ({ page }) => {
  await signIn(page, 'Noor');

  await page.goto('/premium');
  await zetCode(page, dag(10));
  await expect(page.getByText(/Verleng hem vóór die dag/)).toBeVisible();
});

test('een code die om is zegt dat de voortgang er nog staat, en biedt verlengen aan', async ({
  page,
}) => {
  await signIn(page, 'Noor');

  await page.goto('/premium');
  await zetCode(page, dag(-1));
  await expect(page.getByText(/staat nog op dit apparaat/)).toBeVisible();
  // En het aanbod staat er weer onder: verlengen is kopen.
  await expect(page.getByRole('heading', { name: 'Wat premium voor je doet' })).toBeVisible();
});
