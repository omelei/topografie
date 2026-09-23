#!/usr/bin/env node
/**
 * The logo delivery v2, drawn from docs/leer.js (ADR-182).
 *
 * leer.js is the Merk en stijlgids's own code: web components that draw
 * Denker, the logo, the app icon and the avatars into a shadow root. This runs
 * that code against a stub of the DOM, takes the SVG each component draws, and
 * writes it out as files — so the app serves exactly what the guide shows,
 * and nobody redraws the logo by hand.
 *
 *   docs/logo/          the delivery: logos, Denker, expressions, app icons
 *   public/             the copies the app serves (logo.test.ts holds them)
 *   src/assets/denker/  the expressions the app draws inline, to animate them
 *   public/avatars/     the eight avatars
 *
 * The PNGs are rendered in Chromium through Playwright, which the e2e tests
 * already install. Run with `node tools/merk-uit-leer.mjs`; it is idempotent.
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync, copyFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'docs', 'logo');
const PUBLIC = join(ROOT, 'public');

/* ---- Run leer.js against a stub DOM --------------------------------------- */

const source = readFileSync(join(ROOT, 'docs', 'leer.js'), 'utf8');
const klassen = new Map();

class StubElement {
  constructor() {
    this.attrs = new Map();
    this.style = { setProperty() {} };
  }
  getAttribute(name) {
    return this.attrs.has(name) ? this.attrs.get(name) : null;
  }
  hasAttribute(name) {
    return this.attrs.has(name);
  }
  toggleAttribute() {}
  attachShadow() {
    this.shadowRoot = {
      innerHTML: '',
      querySelector: () => ({ style: {} }),
    };
    return this.shadowRoot;
  }
}

const window = {
  matchMedia: () => ({ matches: true, addEventListener() {} }),
  addEventListener() {},
  removeEventListener() {},
};
const sandbox = {
  window,
  document: { documentElement: { hasAttribute: () => true } },
  HTMLElement: StubElement,
  customElements: { define: (naam, klasse) => klassen.set(naam, klasse) },
  MutationObserver: class {
    observe() {}
  },
  requestAnimationFrame: () => {},
  Math,
};
vm.createContext(sandbox);
vm.runInContext(source, sandbox);

/** What <tag attrs> draws: the SVG from its shadow root, without its <style>. */
function teken(tag, attrs) {
  const Klasse = klassen.get(tag);
  const el = new Klasse();
  for (const [naam, waarde] of Object.entries(attrs)) el.attrs.set(naam, String(waarde));
  el.attachShadow();
  el.render();
  return el.shadowRoot.innerHTML.replace(/<style>[\s\S]*?<\/style>/, '').trim();
}

/** A drawing as a file of its own: namespace, a title, no size and one line per tag. */
function alsBestand(svg, { titel = 'leer.nu', houdMaat = false } = {}) {
  let uit = svg
    .replace(/\s*\n\s*/g, '')
    .replace(/<svg /, '<svg xmlns="http://www.w3.org/2000/svg" ')
    .replace(/ style="[^"]*"/, '');
  if (!houdMaat)
    uit = uit.replace(/ (width|height)="[^"]*"/g, (m, _a, i) => (i < uit.indexOf('>') ? '' : m));
  uit = uit.replace(/(<svg[^>]*>)/, titel ? `$1<title>${titel}</title>` : '$1');
  return `${uit}\n`;
}

function schrijf(pad, inhoud) {
  mkdirSync(dirname(pad), { recursive: true });
  writeFileSync(pad, inhoud);
}

/* ---- The delivery ---------------------------------------------------------- */

const KLEUREN = ['kleur', 'cacao', 'wit'];
const UITDRUKKINGEN = ['denken', 'blij', 'juichen', 'bemoedigend', 'trots', 'slapen', 'zwaaien'];

rmSync(join(DOCS, 'logo'), { recursive: true, force: true });
rmSync(join(DOCS, 'beeldmerk'), { recursive: true, force: true });
rmSync(join(PUBLIC, 'logo'), { recursive: true, force: true });

for (const kleur of KLEUREN) {
  for (const variant of ['liggend', 'staand']) {
    const svg = alsBestand(teken('leer-logo', { variant, kleur, height: 100 }));
    schrijf(join(DOCS, 'logo', `leernu-logo-${variant}-${kleur}.svg`), svg);
  }
  schrijf(
    join(DOCS, 'beeldmerk', `denker-${kleur}.svg`),
    alsBestand(teken('leer-logo', { variant: 'beeldmerk', kleur, height: 100 })),
  );
}

// The name alone: leer.js has its shapes but no variant for them.
const WORD = /const WORD = '([^']+)'/.exec(source)[1];
const WDOT = /const WDOT = '([^']+)'/.exec(source)[1];
for (const kleur of KLEUREN) {
  const inkt = kleur === 'wit' ? '#FFFFFF' : '#2A1E17';
  const punt = kleur === 'kleur' ? '#FF6A4D' : inkt;
  schrijf(
    join(DOCS, 'logo', `leernu-woordbeeld-${kleur}.svg`),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -730 3090 751" role="img" aria-label="leer.nu"><title>leer.nu</title><path d="${WORD}" fill="${inkt}"/><path d="${WDOT}" fill="${punt}"/></svg>\n`,
  );
}

/*
 * The expressions, as the app draws them. The gradient id is written as
 * `denker-verloop` so Denker.tsx can make it unique per instance; the class
 * names stay, because index.css animates them.
 */
for (const uitdrukking of UITDRUKKINGEN) {
  for (const simpel of [false, true]) {
    const attrs = { expr: uitdrukking, size: 100 };
    if (simpel) attrs.simple = '';
    const svg = alsBestand(teken('leer-denker', attrs), { titel: '' })
      .replace(/ aria-hidden="true"/, '')
      .replace(/id="b\d+"/g, 'id="denker-verloop"')
      .replace(/url\(#b\d+\)/g, 'url(#denker-verloop)');
    const naam = simpel ? `denker-${uitdrukking}-klein.svg` : `denker-${uitdrukking}.svg`;
    schrijf(join(DOCS, 'beeldmerk', 'uitdrukkingen', naam), svg);
  }
}

// App icons: the rounded tile, and a full-bleed one with the face in the safe zone.
const icoon = alsBestand(teken('leer-logo', { variant: 'icoon', height: 100 }));
const APP = join(DOCS, 'app-icoon');
rmSync(APP, { recursive: true, force: true });
schrijf(join(APP, 'app-icoon.svg'), icoon);
schrijf(join(APP, 'favicon.svg'), icoon);
const maskable = icoon
  .replace('<rect width="100" height="100" rx="24"', '<rect width="100" height="100"')
  .replace(/(<\/defs><rect[^>]*\/>)/, '$1<g transform="translate(10 10) scale(.8)">')
  .replace('</svg>', '</g></svg>');
schrijf(join(APP, 'app-icoon-maskable.svg'), maskable);
schrijf(
  join(APP, 'site.webmanifest'),
  `${JSON.stringify(
    {
      name: 'leer.nu',
      short_name: 'leer.nu',
      lang: 'nl',
      start_url: '/',
      display: 'standalone',
      background_color: '#FFF3E6',
      theme_color: '#FFF3E6',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    null,
    2,
  )}\n`,
);

// The colours, with the guide's room.
schrijf(
  join(DOCS, 'code', 'kleuren.css'),
  `:root {
  --leernu-koraal: #FF6A4D;
  --leernu-koraal-diep: #C8412A;
  --leernu-cacao: #2A1E17;
  --leernu-room: #FFF3E6;
  --leernu-zon: #FFC93C;
}
`,
);
schrijf(
  join(DOCS, 'code', 'kleuren.json'),
  `${JSON.stringify(
    { koraal: '#FF6A4D', koraalDiep: '#C8412A', cacao: '#2A1E17', room: '#FFF3E6', zon: '#FFC93C' },
    null,
    2,
  )}\n`,
);
rmSync(join(DOCS, 'code', 'denker-sprite.svg'), { force: true });

/* ---- PNGs, through Chromium ------------------------------------------------ */

const { chromium } = await import('playwright');
const browser = await chromium.launch();
const page = await browser.newPage();

async function png(svg, breedte, hoogte, { achtergrond = null, marge = 0 } = {}) {
  await page.setViewportSize({ width: breedte, height: hoogte });
  const grond = achtergrond ?? 'transparent';
  await page.setContent(
    `<html><body style="margin:0;background:${grond};display:grid;place-items:center;width:${breedte}px;height:${hoogte}px">` +
      `<div style="width:${breedte - 2 * marge}px;height:${hoogte - 2 * marge}px;display:grid;place-items:center">` +
      svg.replace('<svg ', '<svg style="max-width:100%;max-height:100%;width:100%;height:100%" ') +
      `</div></body></html>`,
  );
  return page.screenshot({ omitBackground: achtergrond === null });
}

const logoKleur = readFileSync(join(DOCS, 'logo', 'leernu-logo-liggend-kleur.svg'), 'utf8');
const staandKleur = readFileSync(join(DOCS, 'logo', 'leernu-logo-staand-kleur.svg'), 'utf8');
schrijf(join(DOCS, 'logo', 'leernu-logo-liggend-kleur.png'), await png(logoKleur, 1200, 266));
schrijf(join(DOCS, 'logo', 'leernu-logo-staand-kleur.png'), await png(staandKleur, 800, 465));
schrijf(
  join(DOCS, 'beeldmerk', 'denker-kleur.png'),
  await png(readFileSync(join(DOCS, 'beeldmerk', 'denker-kleur.svg'), 'utf8'), 512, 512),
);

const opIcoon = {
  'favicon-16x16.png': [icoon, 16],
  'favicon-32x32.png': [icoon, 32],
  'apple-touch-icon.png': [maskable, 180],
  'icon-192.png': [icoon, 192],
  'icon-512.png': [icoon, 512],
  'icon-maskable-512.png': [maskable, 512],
};
for (const [naam, [svg, maat]] of Object.entries(opIcoon)) {
  schrijf(join(APP, naam), await png(svg, maat, maat));
}
schrijf(
  join(APP, 'og-image.png'),
  await png(logoKleur, 1200, 630, { achtergrond: '#FFF3E6', marge: 250 }),
);

// favicon.ico: three PNGs in an ICO wrapper, which every browser reads.
const icoMaten = [16, 32, 48];
const icoBeelden = [];
for (const maat of icoMaten) icoBeelden.push(await png(icoon, maat, maat));
const kop = Buffer.alloc(6 + 16 * icoBeelden.length);
kop.writeUInt16LE(0, 0);
kop.writeUInt16LE(1, 2);
kop.writeUInt16LE(icoBeelden.length, 4);
let plek = kop.length;
icoBeelden.forEach((beeld, i) => {
  const o = 6 + 16 * i;
  kop.writeUInt8(icoMaten[i], o);
  kop.writeUInt8(icoMaten[i], o + 1);
  kop.writeUInt16LE(1, o + 4);
  kop.writeUInt16LE(32, o + 6);
  kop.writeUInt32LE(beeld.length, o + 8);
  kop.writeUInt32LE(plek, o + 12);
  plek += beeld.length;
});
schrijf(join(APP, 'favicon.ico'), Buffer.concat([kop, ...icoBeelden]));

await browser.close();

/* ---- The copies the app serves ------------------------------------------- */

for (const naam of readdirSync(APP)) copyFileSync(join(APP, naam), join(PUBLIC, naam));
mkdirSync(join(PUBLIC, 'logo'), { recursive: true });
for (const naam of readdirSync(join(DOCS, 'logo'))) {
  copyFileSync(join(DOCS, 'logo', naam), join(PUBLIC, 'logo', naam));
}
rmSync(join(PUBLIC, 'denker-sprite.svg'), { force: true });
copyFileSync(join(DOCS, 'code', 'kleuren.css'), join(ROOT, 'src', 'design', 'kleuren.css'));

const DENKER = join(ROOT, 'src', 'assets', 'denker');
rmSync(DENKER, { recursive: true, force: true });
mkdirSync(DENKER, { recursive: true });
for (const naam of readdirSync(join(DOCS, 'beeldmerk', 'uitdrukkingen'))) {
  copyFileSync(join(DOCS, 'beeldmerk', 'uitdrukkingen', naam), join(DENKER, naam));
}

// The avatars: the owner's set, which avatars.tsx serves by id (ADR-177).
const AVATARS = join(PUBLIC, 'avatars');
rmSync(AVATARS, { recursive: true, force: true });
for (const kind of ['zon', 'wolk', 'bloem', 'vis', 'raket', 'kat', 'robot', 'boot']) {
  const svg = alsBestand(teken('leer-avatar', { kind, size: 100 }), { titel: '' }).replace(
    /clip-path="circle\(50px at 50px 50px\)"/,
    'clip-path="url(#rond)"',
  );
  schrijf(
    join(AVATARS, `${kind}.svg`),
    svg.replace(
      /(<svg[^>]*>)/,
      '$1<defs><clipPath id="rond"><circle cx="50" cy="50" r="50"/></clipPath></defs>',
    ),
  );
}

console.log('Logolevering v2 geschreven uit docs/leer.js.');
