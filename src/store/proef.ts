/**
 * Premium op proef: veertien dagen alles open, op dit apparaat (ADR-193).
 *
 * Sinds ADR-192 is premium alles wat over weken gaat, en dat is precies wat een
 * gezin zonder code nooit te zien krijgt. Dus krijgt elk apparaat één keer
 * veertien dagen alles, en valt het daarna terug naar gratis. Wat er in die
 * dagen geoefend is, blijft staan: met een code staat het er meteen weer.
 *
 * **Eén datum, meer niet.** Wat bewaard wordt is de dag waarop de proef begon,
 * in localStorage naast de code (ADR-116): het hoort bij het apparaat en niet
 * bij een kind, en het wordt op het eerste beeld gelezen, zodat een pagina
 * nooit eerst een slot laat zien en het dan weghaalt.
 *
 * **Alleen zonder code.** Een apparaat waarop bij het openen een geldige code
 * staat, begint geen proef: dat gezin heeft al betaald, en als de code later
 * afloopt is dat een verlenging en geen kennismaking.
 *
 * **Een hek, geen kluis**, net als de code zelf. Wie de opslag van de browser
 * wist, krijgt de proef opnieuw. Met het gezinsaccount kan hij later per gezin
 * op de server worden bijgehouden; tot die tijd weegt dat niet op tegen een
 * proef die zonder account en zonder server werkt.
 */

export const PROEF_SLEUTEL = 'leernu.proef';
/** Hoe lang alles open staat, de dag van beginnen meegeteld. */
export const PROEF_DAGEN = 14;
/** Vanaf hoeveel dagen voor het einde de voordeur aftelt. */
export const PROEF_AFTELLEN = 3;
/** Zolang de voordeur na afloop nog zegt dat de proef voorbij is. */
export const PROEF_NAZEGGEN = 7;

const DAG_MS = 86_400_000;
const DATUM = /^\d{4}-\d{2}-\d{2}$/;

/** Waar de proef staat, voor wie er een scherm op bouwt. */
export type ProefStand =
  | { readonly soort: 'geen' }
  | {
      readonly soort: 'loopt';
      /** Op de dag van beginnen veertien, op de laatste dag één. */
      readonly dagenOver: number;
      /** De laatste dag dat alles open staat: YYYY-MM-DD. */
      readonly laatsteDag: string;
      /** De eerste dagen, waarin de voordeur zegt wat er open staat. */
      readonly eersteDagen: boolean;
    }
  | { readonly soort: 'voorbij'; readonly dagenGeleden: number };

const luisteraars = new Set<() => void>();

export function leesProefRuw(): string | null {
  try {
    return window.localStorage.getItem(PROEF_SLEUTEL);
  } catch {
    return null;
  }
}

/** De dag waarop de proef begon, of null als er geen (leesbare) is. */
export function proefBegin(ruw: string | null = leesProefRuw()): string | null {
  return ruw !== null && DATUM.test(ruw) ? ruw : null;
}

/** De dag van vandaag, zoals een kind hem leest: in de eigen tijdzone. */
export function dagVan(now: Date): string {
  const maand = String(now.getMonth() + 1).padStart(2, '0');
  const dag = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${maand}-${dag}`;
}

/** Een dag als een getal, zodat twee dagen van elkaar af te trekken zijn. */
function dagNummer(dag: string): number {
  const [jaar, maand, dagVanMaand] = dag.split('-').map(Number);
  return Math.round(Date.UTC(jaar ?? 0, (maand ?? 1) - 1, dagVanMaand ?? 1) / DAG_MS);
}

/**
 * Waar de proef staat op deze dag. Op de dag van beginnen zijn er veertien
 * dagen over, op de laatste dag één, en de dag erna is hij voorbij.
 */
export function proefStand(begin: string | null, now: Date): ProefStand {
  if (begin === null) return { soort: 'geen' };
  const verstreken = dagNummer(dagVan(now)) - dagNummer(begin);
  const dagenOver = PROEF_DAGEN - verstreken;
  if (dagenOver > 0) {
    // Een klok die achteruit is gezet, geeft geen proef van meer dan veertien
    // dagen: wat verder dan het begin ligt, telt als de eerste dag.
    const over = Math.min(dagenOver, PROEF_DAGEN);
    const laatste = new Date((dagNummer(dagVan(now)) + over - 1) * DAG_MS).toISOString();
    return {
      soort: 'loopt',
      dagenOver: over,
      laatsteDag: laatste.slice(0, 10),
      eersteDagen: over > PROEF_DAGEN - PROEF_AFTELLEN,
    };
  }
  return { soort: 'voorbij', dagenGeleden: 1 - dagenOver };
}

/**
 * Begin de proef, als hij er nog niet is. Eén keer per apparaat, en alleen als
 * er iets te verkopen valt en er geen geldige code op staat (zie boven).
 */
export function startProef(now: Date, magBeginnen: boolean): void {
  if (!magBeginnen || leesProefRuw() !== null) return;
  try {
    window.localStorage.setItem(PROEF_SLEUTEL, dagVan(now));
  } catch {
    // Een browser die niets bewaart, krijgt geen proef: de sloten blijven dan
    // gewoon staan, en dat is wat hij zonder proef ook zag.
    return;
  }
  for (const luisteraar of luisteraars) luisteraar();
}

/** Voor `useSyncExternalStore`: wat dit tabblad schrijft, en een ander. */
export function abonneerProef(luisteraar: () => void): () => void {
  luisteraars.add(luisteraar);
  const opslag = (event: StorageEvent) => {
    if (event.key === PROEF_SLEUTEL) luisteraar();
  };
  window.addEventListener('storage', opslag);
  return () => {
    luisteraars.delete(luisteraar);
    window.removeEventListener('storage', opslag);
  };
}
