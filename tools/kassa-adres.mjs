import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Zet het adres van de kassa in de gebouwde kassapagina's (ADR-123).
 *
 * De pagina's onder `public/kopen` gaan buiten Vite om — ze zijn geen app, ze
 * laden geen bundle en ze worden letterlijk gekopieerd — dus er is geen
 * `import.meta.env` om uit te lezen. Deze stap doet wat de build voor de app wel
 * doet: hij vult de variabele in, na de build, in dist.
 *
 * Zonder `KASSA_URL` blijft de placeholder staan en zegt de pagina dat de kassa
 * nog niet open is. Dat is dezelfde keuze als bij premium (ADR-116): een half
 * ingestelde omgeving hoort iets te zeggen, niet stuk te gaan.
 */
const PLACEHOLDER = '__KASSA_URL__';
const adres = (process.env.KASSA_URL ?? '').replace(/\/+$/, '');

const map = join(process.cwd(), 'dist', 'kopen');

function htmlBestanden(vanaf) {
  let gevonden = [];
  for (const naam of readdirSync(vanaf)) {
    const pad = join(vanaf, naam);
    if (statSync(pad).isDirectory()) gevonden = gevonden.concat(htmlBestanden(pad));
    else if (naam.endsWith('.html')) gevonden.push(pad);
  }
  return gevonden;
}

let bestanden = [];
try {
  bestanden = htmlBestanden(map);
} catch {
  console.log('Kassa: geen dist/kopen, niets te doen.\n');
  process.exit(0);
}

if (adres === '') {
  console.log(`Kassa: KASSA_URL is niet gezet — de kassapagina's zeggen dat ze dicht zijn.\n`);
  process.exit(0);
}

let aangepast = 0;
for (const bestand of bestanden) {
  const inhoud = readFileSync(bestand, 'utf8');
  if (!inhoud.includes(PLACEHOLDER)) continue;
  writeFileSync(bestand, inhoud.replaceAll(PLACEHOLDER, adres));
  aangepast += 1;
}

console.log(`Kassa: adres ingevuld in ${aangepast} van de ${bestanden.length} pagina's.\n`);
