// Premium codes for leer.nu (ADR-116): makes them, and prints the SQL that
// stores them.
//
//   node tools/premium/maak-codes.mjs [aantal] [geldig-tot] [notitie ...]
//
//   node tools/premium/maak-codes.mjs                 one code, valid for a year
//   node tools/premium/maak-codes.mjs 5 2027-09-30    five, valid until then
//   node tools/premium/maak-codes.mjs 1 "" familie Jansen
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

const ALFABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const LENGTE = 8;

const [aantalTekst = '1', totTekst = '', ...notitieDelen] = process.argv.slice(2);

const aantal = Number(aantalTekst);
if (!Number.isInteger(aantal) || aantal < 1 || aantal > 500) {
  console.error('Aantal moet een heel getal zijn van 1 tot en met 500.');
  process.exit(1);
}

function eenJaarVanaf(dag) {
  const tot = new Date(dag);
  tot.setFullYear(tot.getFullYear() + 1);
  return tot.toISOString().slice(0, 10);
}

const tot = totTekst === '' ? eenJaarVanaf(new Date()) : totTekst;
if (!/^\d{4}-\d{2}-\d{2}$/.test(tot) || Number.isNaN(new Date(`${tot}T00:00:00Z`).getTime())) {
  console.error(`Geldig tot moet een datum zijn als 2027-09-30, niet "${tot}".`);
  process.exit(1);
}

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
console.log(`Codes, geldig tot en met ${tot}:\n`);
for (const code of codes) {
  const hash = createHash('sha256').update(code).digest('hex');
  console.log(`  LEER-${code.slice(0, 4)}-${code.slice(4)}`);
  rijen.push(`  ('${hash}', '${tot}', 3, ${sqlTekst(notitie)})`);
}

console.log('\n-- Plak dit in de SQL-editor van Supabase:');
console.log(
  'insert into public.premium_codes (code_hash, geldig_tot, max_apparaten, notitie) values',
);
console.log(`${rijen.join(',\n')};`);
