// Van wanneer tot wanneer een code geldt, voor maak-codes.mjs.
//
// Los van het script zodat het te toetsen is zonder het script te draaien: het
// script leest `process.argv` en drukt af, dit rekent alleen.
//
// Drie manieren om de datums te zetten, in deze volgorde van voorrang:
//
//   1. `--van` en `--tot`: wat er staat, dat geldt;
//   2. `--klaspas [jaar]`: een schooljaar, 1 september tot en met 31 augustus;
//   3. niets: vanaf vandaag, een jaar lang (ADR-200).
//
// Een opgegeven datum gaat voor de klaspas, en alleen de datum die is
// opgegeven: `--klaspas --tot 2027-07-17` begint op 1 september en stopt bij
// de zomervakantie.

/** @param {Date} dag */
function iso(dag) {
  const jaar = String(dag.getFullYear()).padStart(4, '0');
  const maand = String(dag.getMonth() + 1).padStart(2, '0');
  const dagVanMaand = String(dag.getDate()).padStart(2, '0');
  return `${jaar}-${maand}-${dagVanMaand}`;
}

/**
 * Het jaar waarin het schooljaar van deze dag begon: vanaf 1 september het
 * jaar zelf, daarvoor het jaar ervoor.
 *
 * @param {Date} dag
 * @returns {number}
 */
export function schooljaarVan(dag) {
  return dag.getMonth() >= 8 ? dag.getFullYear() : dag.getFullYear() - 1;
}

/**
 * @param {string} tekst
 * @returns {boolean}
 */
export function isDatum(tekst) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tekst)) return false;
  const dag = new Date(`${tekst}T12:00:00Z`);
  return !Number.isNaN(dag.getTime()) && dag.toISOString().slice(0, 10) === tekst;
}

/**
 * @param {{ van?: string | undefined, tot?: string | undefined, klaspas?: number | true | undefined }} keuze
 * @param {Date} vandaag
 * @returns {{ van: string, tot: string } | { fout: string }}
 */
export function geldigheid(keuze, vandaag) {
  for (const datum of [keuze.van, keuze.tot]) {
    if (datum !== undefined && !isDatum(datum)) {
      return { fout: `Een datum schrijf je als 2027-09-30, niet "${datum}".` };
    }
  }

  let van = iso(vandaag);
  let tot;
  if (keuze.klaspas !== undefined) {
    const jaar = keuze.klaspas === true ? schooljaarVan(vandaag) : keuze.klaspas;
    if (!Number.isInteger(jaar) || jaar < 2000 || jaar > 2999) {
      return { fout: `Het schooljaar van een klaspas is een jaartal als 2026, niet "${jaar}".` };
    }
    van = `${jaar}-09-01`;
    tot = `${jaar + 1}-08-31`;
  } else {
    const eenJaarLater = new Date(vandaag);
    eenJaarLater.setFullYear(eenJaarLater.getFullYear() + 1);
    tot = iso(eenJaarLater);
  }

  if (keuze.van !== undefined) van = keuze.van;
  if (keuze.tot !== undefined) tot = keuze.tot;

  if (van > tot) return { fout: `De code gaat in op ${van} en stopt op ${tot}: dat kan niet.` };
  return { van, tot };
}
