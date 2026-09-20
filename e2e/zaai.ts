import type { Page } from '@playwright/test';

/**
 * Wat een toets nodig heeft om bij een diplomaronde te komen.
 *
 * Sinds proefzwemmen weg is, is een rijpe pagina de enige ingang: het scherm
 * Afzwemmen heeft op een pagina die nog niet rijp is één knop, en die gaat
 * terug naar oefenen. Een toets die een diplomaronde wil spelen moet dus eerst
 * zorgen dat de pagina rijp is.
 */

/**
 * Alles wat dit kind geoefend heeft in doos vier zetten: dan is het onthouden
 * (ADR-114), en telt het mee voor de lat van ADR-141. Vier goede rondes over
 * een week afspelen zou hetzelfde doen en tien minuten duren.
 *
 * Het raakt alleen rijen die er al zijn, dus een ronde spelen gaat eraan
 * vooraf: het zet vast wat geoefend is, het verzint niets bij.
 */
export async function alsOnthouden(page: Page) {
  await page.evaluate(async () => {
    await new Promise<void>((klaar, mis) => {
      const open = indexedDB.open('leernu');
      open.onerror = () => mis(open.error);
      open.onsuccess = () => {
        const db = open.result;
        const tx = db.transaction('progress', 'readwrite');
        const store = tx.objectStore('progress');
        store.getAll().onsuccess = (event) => {
          const rijen = (event.target as IDBRequest).result as Record<string, unknown>[];
          const nu = new Date().toISOString();
          const straks = new Date(Date.now() + 14 * 86_400_000).toISOString();
          for (const rij of rijen) {
            store.put({ ...rij, box: 4, goedCount: 4, laatsteReview: nu, volgendeReview: straks });
          }
        };
        tx.oncomplete = () => {
          db.close();
          klaar();
        };
        tx.onerror = () => mis(tx.error);
      };
    });
  });
}
