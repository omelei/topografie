import type { Page } from '@playwright/test';

/**
 * Of deze maat een bureau is: vanaf 1200 breed, het breekpunt `desk` uit
 * `tailwind.config.ts`. Daar staan op Vandaag de vakken en "Zo werkt
 * leer.nu"; op een telefoon en een tablet niet (ADR-251).
 */
export function aanEenBureau(page: Page): boolean {
  return (page.viewportSize()?.width ?? 0) >= 1200;
}
