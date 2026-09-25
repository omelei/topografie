import { writeFileSync } from 'node:fs';
import { leesTeksten } from './nl-bestand.mjs';

/**
 * Alle teksten van de app als CSV, om buiten de code te herschrijven.
 *
 *   node tools/teksten/export.mjs [teksten.csv]
 *
 * Puntkomma's en UTF-8 met BOM, zodat Excel en Numbers het in kolommen openen
 * met de é en de ’ heel. Vul alleen de kolom "Nieuwe tekst" in; leeg betekent
 * ongewijzigd. `import.mjs` zet het terug.
 */
const uit = process.argv[2] ?? 'teksten.csv';
const { teksten } = leesTeksten();

const veld = (waarde) => `"${String(waarde).replaceAll('"', '""')}"`;
const regels = [
  ['Sleutel', 'Groep', 'Huidige tekst', 'Nieuwe tekst', 'Invulplekken', 'Toelichting'],
  ...teksten.map((t) => [
    t.sleutel,
    t.sleutel.split('.')[0],
    t.tekst,
    '',
    [...t.tekst.matchAll(/\{\w+\}/g)].map((m) => m[0]).join(' '),
    t.toelichting,
  ]),
].map((rij) => rij.map(veld).join(';'));

writeFileSync(uit, `\uFEFF${regels.join('\r\n')}\r\n`, 'utf8');
console.log(`${teksten.length} teksten naar ${uit}.`);
