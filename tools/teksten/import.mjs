import { readFileSync, writeFileSync } from 'node:fs';
import { invulplekken, leesTeksten, NL_PAD } from './nl-bestand.mjs';

/**
 * Herschreven teksten uit een CSV terugzetten in `src/i18n/nl.ts`.
 *
 *   node tools/teksten/import.mjs teksten.csv [--proef]
 *
 * Alleen rijen met een "Nieuwe tekst" tellen. Een rij wordt geweigerd als:
 * - de sleutel niet (meer) bestaat;
 * - de invulplekken ({naam}, {aantal}) niet dezelfde zijn: dan vult de app
 *   iets in wat er niet staat, of laat hij {naam} letterlijk staan;
 * - de tekst een regeleinde heeft;
 * - de "Huidige tekst" niet meer is wat er in de app staat: dan is de tekst na
 *   de export veranderd, en zou deze rij die wijziging wissen.
 *
 * Met --proef wordt er niets geschreven, alleen gemeld wat er zou gebeuren.
 */
const [pad, ...opties] = process.argv.slice(2);
if (!pad) {
  console.error('Gebruik: node tools/teksten/import.mjs teksten.csv [--proef]');
  process.exit(1);
}
const proef = opties.includes('--proef');

/** CSV lezen zoals Excel, Numbers en Google Sheets hem schrijven: ; of , en "". */
function leesCsv(tekst) {
  const schoon = tekst.replace(/^\uFEFF/, '');
  const eersteRegel = schoon.slice(0, schoon.search(/\r?\n/));
  const scheiding = eersteRegel.split(';').length >= eersteRegel.split(',').length ? ';' : ',';
  const rijen = [];
  let rij = [];
  let veld = '';
  let tussenAanhalingstekens = false;
  for (let i = 0; i < schoon.length; i++) {
    const teken = schoon[i];
    if (tussenAanhalingstekens) {
      if (teken === '"' && schoon[i + 1] === '"') {
        veld += '"';
        i++;
      } else if (teken === '"') tussenAanhalingstekens = false;
      else veld += teken;
    } else if (teken === '"') tussenAanhalingstekens = true;
    else if (teken === scheiding) {
      rij.push(veld);
      veld = '';
    } else if (teken === '\n' || teken === '\r') {
      if (teken === '\r' && schoon[i + 1] === '\n') i++;
      rij.push(veld);
      rijen.push(rij);
      rij = [];
      veld = '';
    } else veld += teken;
  }
  if (veld !== '' || rij.length > 0) {
    rij.push(veld);
    rijen.push(rij);
  }
  return rijen.filter((r) => r.some((v) => v.trim() !== ''));
}

const [kop, ...rijen] = leesCsv(readFileSync(pad, 'utf8'));
const kolom = (naam) => {
  const index = kop.findIndex((k) => k.trim().toLowerCase() === naam.toLowerCase());
  if (index < 0) {
    console.error(`De kolom "${naam}" ontbreekt.`);
    process.exit(1);
  }
  return index;
};
const [iSleutel, iHuidig, iNieuw] = ['Sleutel', 'Huidige tekst', 'Nieuwe tekst'].map(kolom);

const { bron, teksten } = leesTeksten();
const perSleutel = new Map(teksten.map((t) => [t.sleutel, t]));
const wijzigingen = [];
const fouten = [];

for (const rij of rijen) {
  const sleutel = (rij[iSleutel] ?? '').trim();
  const nieuw = (rij[iNieuw] ?? '').trim();
  if (sleutel === '' || nieuw === '') continue;
  const huidig = perSleutel.get(sleutel);
  if (!huidig) {
    fouten.push(`${sleutel}: deze sleutel bestaat niet (meer).`);
    continue;
  }
  if (nieuw === huidig.tekst) continue;
  if ((rij[iHuidig] ?? '') !== huidig.tekst) {
    fouten.push(`${sleutel}: de tekst is na de export veranderd; exporteer opnieuw.`);
    continue;
  }
  if (/[\r\n]/.test(nieuw)) {
    fouten.push(`${sleutel}: een tekst kan geen regeleinde hebben.`);
    continue;
  }
  const oud = invulplekken(huidig.tekst).join(' ');
  const nu = invulplekken(nieuw).join(' ');
  if (oud !== nu) {
    fouten.push(`${sleutel}: invulplekken waren {${oud}} en zijn nu {${nu}}.`);
    continue;
  }
  wijzigingen.push({ ...huidig, nieuw });
}

// Achteraan beginnen, zodat de plekken van de andere teksten blijven kloppen.
let uit = bron;
for (const w of [...wijzigingen].sort((a, b) => b.begin - a.begin)) {
  const aanhaling = w.nieuw.includes("'") ? '"' : "'";
  const letterlijk = `${aanhaling}${w.nieuw.replaceAll('\\', '\\\\').replaceAll(aanhaling, `\\${aanhaling}`)}${aanhaling}`;
  uit = uit.slice(0, w.begin) + letterlijk + uit.slice(w.eind);
}

for (const w of wijzigingen) console.log(`✓ ${w.sleutel}\n    ${w.tekst}\n  → ${w.nieuw}`);
for (const f of fouten) console.log(`✗ ${f}`);
console.log(
  `\n${wijzigingen.length} gewijzigd, ${fouten.length} geweigerd${proef ? ' (proef: niets geschreven)' : ''}.`,
);
if (!proef && wijzigingen.length > 0) writeFileSync(NL_PAD, uit);
if (fouten.length > 0) process.exitCode = 1;
