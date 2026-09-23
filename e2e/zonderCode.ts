import type { BrowserContextOptions } from '@playwright/test';

/**
 * Een apparaat zonder code, waarvan de proef lang voorbij is (ADR-193).
 *
 * Een lege opslag is sinds de proef geen apparaat zonder premium meer: wie voor
 * het eerst opent, krijgt veertien dagen alles. De tests die de sloten
 * nakijken, beginnen daarom met een proef uit 2000 — voorbij, en zo lang
 * geleden dat de voordeur er ook niets meer over zegt.
 */
export const ZONDER_CODE: BrowserContextOptions['storageState'] = {
  cookies: [],
  origins: [
    {
      origin: 'http://localhost:4173',
      localStorage: [{ name: 'leernu.proef', value: '2000-01-01' }],
    },
  ],
};
