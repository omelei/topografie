// Premium codes for leer.nu (ADR-116): makes them, and prints the SQL that
// stores them.
//
//   node tools/premium/maak-codes.mjs [--plekken n] [--van dag] [--tot dag]
//                                     [--klaspas [jaar]] [aantal] [geldig-tot] [notitie ...]
//
//   node tools/premium/maak-codes.mjs                 one code, from today, for a year
//   node tools/premium/maak-codes.mjs 5 2027-09-30    five, valid until then
//   node tools/premium/maak-codes.mjs 1 "" familie Jansen
//   node tools/premium/maak-codes.mjs --plekken 40 1 "" klas 6b De Regenboog
//   node tools/premium/maak-codes.mjs --plekken 40 --klaspas 2027 1 "" klas 6b
//
// `--plekken` is op hoeveel apparaten een code werkt: 3 voor een gezin, 40 voor
// een klassencode (ADR-200). Een plek is een apparaat, geen kind.
//
// `--klaspas` zet de datums op een schooljaar: 1 september tot en met 31
// augustus. Zonder jaar het schooljaar van vandaag, met een jaar het schooljaar
// dat in dat jaar begint. `--van` en `--tot` gaan daarvoor, elk voor zich; de
// rekensom staat in datums.mjs. Een code geldt pas vanaf `--van`: de server
// weigert hem daarvoor met de datum erbij.
//
// The codes are printed once, here, and nowhere else: the database only ever
// holds their SHA-256 (tools/premium/schema.sql). Hand a code to a family and
// paste the SQL into the Supabase SQL editor; lose the code and it is gone.
//
// Eight characters from an alphabet without 0, O, 1, I and L, which are the
// ones a parent reading a code off a screen mistakes for each other. That is
// thirty-one to the eighth — about 850 billion — and the server stops a device
// after ten wrong guesses an hour.

import { createHash, randomInt } from 'node:crypto';
import { geldigheid } from './datums.mjs';

const ALFABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const LENGTE = 8;

const argumenten = process.argv.slice(2);

function stop(zin) {
  console.error(zin);
  process.exit(1);
}

/** Haalt `--naam waarde` uit de argumenten, of undefined als hij er niet staat. */
function vlag(naam) {
  const index = argumenten.indexOf(naam);
  if (index === -1) return undefined;
  const waarde = argumenten[index + 1];
  if (waarde === undefined || waarde.startsWith('--')) stop(`Na ${naam} hoort een waarde.`);
  argumenten.splice(index, 2);
  return waarde;
}

let plekken = 3;
const plekTekst = vlag('--plekken');
if (plekTekst !== undefined) {
  plekken = Number(plekTekst);
  if (!Number.isInteger(plekken) || plekken < 1 || plekken > 100) {
    stop('Plekken moet een heel getal zijn van 1 tot en met 100.');
  }
}

const van = vlag('--van');
let tot = vlag('--tot');

// `--klaspas` mag zonder jaar: dan is het het schooljaar van vandaag.
let klaspas;
const klaspasIndex = argumenten.indexOf('--klaspas');
if (klaspasIndex !== -1) {
  const jaar = argumenten[klaspasIndex + 1];
  if (jaar !== undefined && /^\d{4}$/.test(jaar)) {
    klaspas = Number(jaar);
    argumenten.splice(klaspasIndex, 2);
  } else {
    klaspas = true;
    argumenten.splice(klaspasIndex, 1);
  }
}

const onbekend = argumenten.find((argument) => argument.startsWith('--'));
if (onbekend !== undefined) stop(`Deze keuze ken ik niet: ${onbekend}.`);

const [aantalTekst = '1', totTekst = '', ...notitieDelen] = argumenten;

const aantal = Number(aantalTekst);
if (!Number.isInteger(aantal) || aantal < 1 || aantal > 500) {
  stop('Aantal moet een heel getal zijn van 1 tot en met 500.');
}

// De tweede plek was altijd al "geldig tot", en blijft dat. Twee keer opgeven
// is een vergissing, en welke dan wint is een gok.
if (totTekst !== '') {
  if (tot !== undefined && tot !== totTekst) stop('Geef "geldig tot" één keer op.');
  tot = totTekst;
}

const datums = geldigheid({ van, tot, klaspas }, new Date());
if ('fout' in datums) stop(datums.fout);

const notitie = notitieDelen.join(' ').trim();
const sqlTekst = (tekst) => (tekst === '' ? 'null' : `'${tekst.replaceAll("'", "''")}'`);

function nieuweCode() {
  let code = '';
  for (let teken = 0; teken < LENGTE; teken++) code += ALFABET[randomInt(ALFABET.length)];
  return code;
}

const codes = new Set();
while (codes.size < aantal) codes.add(nieuweCode());

const rijen = [];
console.log(`Codes, geldig van ${datums.van} tot en met ${datums.tot}, op ${plekken} apparaten:\n`);
for (const code of codes) {
  const hash = createHash('sha256').update(code).digest('hex');
  console.log(`  LEER-${code.slice(0, 4)}-${code.slice(4)}`);
  rijen.push(`  ('${hash}', '${datums.van}', '${datums.tot}', ${plekken}, ${sqlTekst(notitie)})`);
}

console.log('\n-- Plak dit in de SQL-editor van Supabase:');
console.log(
  'insert into public.premium_codes (code_hash, geldig_van, geldig_tot, max_apparaten, notitie) values',
);
console.log(`${rijen.join(',\n')};`);
