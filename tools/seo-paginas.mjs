import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createServer } from 'vite';

/**
 * Een echte pagina per vak en per onderwerp (ADR-207).
 *
 * GitHub Pages kent alleen bestanden. Tot nu toe was elk adres behalve de
 * voordeur een 404 met de app erin (`spa-fallback.mjs`): voor een kind werkt
 * dat, voor Google niet, want die neemt geen pagina op die 404 zegt. Hier komt
 * voor elk adres uit `src/seo/paginas.ts` een eigen bestand: /topografie wordt
 * `topografie.html`, /topografie/provincies wordt `topografie/provincies.html`.
 * Pages serveert een adres zonder `.html` uit dat bestand, met 200.
 *
 * Elk bestand is `index.html` met een eigen titel, beschrijving en canonieke
 * link, en met een korte tekst in `#root`. Die tekst is wat Google leest; de
 * app vervangt hem zodra hij start. 404.html blijft de kale app, voor Jij, een
 * ronde en elk adres dat niet bestaat.
 *
 * De pagina's komen uit de app zelf, via Vite, zodat de namen van onderwerpen,
 * de groepen en de adressen nooit uit elkaar lopen met wat de app toont.
 */

const dist = join(process.cwd(), 'dist');
const indexPad = join(dist, 'index.html');
if (!existsSync(indexPad)) {
  console.error('Geen dist/index.html — eerst bouwen.');
  process.exit(1);
}

const domein = readFileSync(join(process.cwd(), 'public', 'CNAME'), 'utf8').trim();
const oorsprong = `https://${domein}`;

const server = await createServer({
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
  logLevel: 'error',
});
let paginas;
try {
  ({ seoPaginas: paginas } = await server.ssrLoadModule('/src/seo/paginas.ts'));
  paginas = paginas();
} finally {
  await server.close();
}

const sjabloon = readFileSync(indexPad, 'utf8');

function html(tekst) {
  return tekst
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function vervang(bron, zoek, door) {
  if (!zoek.test(bron)) throw new Error(`index.html mist ${zoek}`);
  return bron.replace(zoek, door);
}

function pagina(p) {
  const url = `${oorsprong}${p.pad}`;
  const inhoud = [
    '<main>',
    `<h1>${html(p.kop)}</h1>`,
    `<p>${html(p.beschrijving)}</p>`,
    `<h2>${html(p.linksKop)}</h2>`,
    '<ul>',
    ...p.links.map((link) => `<li><a href="${html(link.pad)}">${html(link.naam)}</a></li>`),
    '</ul>',
    '</main>',
  ].join('');

  let uit = sjabloon;
  uit = vervang(uit, /<title>[^<]*<\/title>/, `<title>${html(p.titel)}</title>`);
  uit = vervang(
    uit,
    /(<meta\s+name="description"\s+content=")[^"]*(")/,
    `$1${html(p.beschrijving)}$2`,
  );
  uit = vervang(uit, /(<meta property="og:title" content=")[^"]*(")/, `$1${html(p.titel)}$2`);
  uit = vervang(
    uit,
    /(<meta\s+property="og:description"\s+content=")[^"]*(")/,
    `$1${html(p.beschrijving)}$2`,
  );
  uit = vervang(
    uit,
    /<\/head>/,
    `<link rel="canonical" href="${html(url)}" />\n    <meta property="og:url" content="${html(url)}" />\n  </head>`,
  );
  uit = vervang(uit, /<div id="root"><\/div>/, `<div id="root">${inhoud}</div>`);
  return uit;
}

/** "/" is index.html, "/topografie/provincies" is topografie/provincies.html. */
const basis = process.env.BASE_PATH ?? '/';
function bestandVoor(pad) {
  const binnen = pad.startsWith(basis) ? pad.slice(basis.length) : pad;
  const zonderBasis = binnen.replace(/^\/+|\/+$/g, '');
  return zonderBasis === '' ? indexPad : join(dist, `${zonderBasis}.html`);
}

const gezien = new Set();
for (const p of paginas) {
  if (gezien.has(p.pad)) throw new Error(`Twee pagina's op ${p.pad}`);
  gezien.add(p.pad);
  const bestand = bestandVoor(p.pad);
  mkdirSync(dirname(bestand), { recursive: true });
  writeFileSync(bestand, pagina(p));
}

const vandaag = new Date().toISOString().slice(0, 10);
writeFileSync(
  join(dist, 'sitemap.xml'),
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...paginas.map(
      (p) => `  <url><loc>${html(`${oorsprong}${p.pad}`)}</loc><lastmod>${vandaag}</lastmod></url>`,
    ),
    '</urlset>',
    '',
  ].join('\n'),
);
writeFileSync(
  join(dist, 'robots.txt'),
  ['User-agent: *', 'Allow: /', '', `Sitemap: ${oorsprong}/sitemap.xml`, ''].join('\n'),
);

console.log(`SEO: ${paginas.length} pagina's, sitemap.xml en robots.txt.\n`);
