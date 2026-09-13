import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Rekenen, as content: the twelve tables, and every other kind of sum in three
 * ranges — keersommen and deelsommen, plus and minus, splitsen, halveren and
 * verdubbelen (ADR-100, ADR-120).
 *
 * Generated rather than written by hand, and that is the opposite of the rule
 * the geography sets follow. The reason is that these need no editor for the
 * *arithmetic*. A province's name, its aliases and its weetje are judgements
 * someone has to make and defend; 7 × 8 = 56 is not a judgement, and a file of
 * a hundred and twenty of them written out by hand is a hundred and twenty
 * chances to make a typo that no reviewer would catch by reading.
 *
 * What replaces the editor is `sums.content.test.ts`, which works every entry
 * back out. That is a stronger guarantee than a careful read, and it is the
 * only place in the content pipeline where that trade is available.
 *
 * **Which sums to practise is still a judgement**, and this file makes it in
 * the open. A table is every sum in it, because that is what a table is. Plus
 * and minus have no such natural edge — "alle sommen tot 100" is nine thousand
 * of them — so the ranges below are curated lists with the rule that chose them
 * written above each one. That is the part a teacher could disagree with, and
 * it should be readable rather than buried in a loop.
 *
 * **One to twelve.** The app design says so in as many words — "Tafels en klok ·
 * Van 1 tot 12, hele en halve uren" — so twelve tables, not the ten that groep
 * 5 gets first. Each runs to ten, which is where a table ends in Dutch primary
 * school; eleven and twelve as multipliers are a different exercise.
 *
 * One set per table, because that is the unit a child is asked to learn and the
 * unit a teacher sets. A single set of a hundred and twenty would make "de
 * tafel van 7 ken ik" unsayable, and that sentence is the whole point. The
 * mixes — all tables at once, everything at once — are not files: they are the
 * union of these sets, composed at run time from the same items, so that
 * answering 7 × 8 in a mix moves the same Leitner box as answering it in the
 * table (`src/content/loadSums.ts`).
 */

const TAFEL_DIR = join(process.cwd(), 'content', 'tafels');
const SOM_DIR = join(process.cwd(), 'content', 'sommen');

/** Tables one through twelve, from the design. */
const TABLES = 12;
/** Each table runs to ten. */
const UPTO = 10;

/**
 * The date the content last changed, not the date the build ran. A version that
 * moves every time the generator runs tells you nothing and invalidates every
 * cache for no reason.
 */
const CONTENT_VERSION = '2026-09-08';

/**
 * Which tables a child is expected to meet first.
 *
 * Not difficulty for its own sake — it decides the order the sets are offered
 * in and nothing else. One, two, five and ten have a rule you can say out loud;
 * three, four, six and eight have a doubling you can lean on; seven, nine,
 * eleven and twelve are the ones that get learned last, and nine only looks
 * hard until somebody shows you the trick.
 */
const NIVEAU = { 1: 1, 2: 1, 5: 1, 10: 1, 3: 2, 4: 2, 6: 2, 8: 2, 7: 3, 9: 3, 11: 3, 12: 3 };

const header = 'tools/content/build-rekenen.mjs — gegenereerd, niet met de hand bewerken.';

function write(dir, set) {
  writeFileSync(
    join(dir, `${set.id}.json`),
    `${JSON.stringify({ _gegenereerd: header, ...set }, null, 2)}\n`,
  );
}

mkdirSync(TAFEL_DIR, { recursive: true });
mkdirSync(SOM_DIR, { recursive: true });

let geschreven = 0;
let sommen = 0;

// ---------------------------------------------------------------------------
// De tafels. Elke tafel tot tien, elk item met het id dat het altijd had:
// `tafel-7x8` staat in de Leitner-doos van elk kind dat ooit geoefend heeft.

for (let tafel = 1; tafel <= TABLES; tafel++) {
  const items = [];

  for (let by = 1; by <= UPTO; by++) {
    items.push({
      id: `tafel-${tafel}x${by}`,
      op: 'keer',
      links: tafel,
      rechts: by,
      antwoord: tafel * by,
    });
  }

  write(TAFEL_DIR, {
    id: `tafel-${tafel}`,
    op: 'keer',
    tafel,
    niveau: NIVEAU[tafel],
    contentVersie: CONTENT_VERSION,
    items,
  });
  geschreven++;
  sommen += items.length;
}

// ---------------------------------------------------------------------------
// De deelsommen van de tafels: elk de omkering van een keersom die er al staat,
// 56 : 7 = 8 hoort bij de tafel van 7. Ze stonden tot ADR-120 in twaalf sets,
// "delen door 7"; nu staan ze bij de keersommen die ze omkeren, in drie
// bereiken (zie onderaan). Het id bleef wat het was: `deel-56-7` staat in de
// Leitner-doos van elk kind dat ooit gedeeld heeft.

const TAFEL_DELEN = [];
for (let tafel = 1; tafel <= TABLES; tafel++) {
  for (let uitkomst = 1; uitkomst <= UPTO; uitkomst++) {
    const deeltal = tafel * uitkomst;
    TAFEL_DELEN.push({
      id: `deel-${deeltal}-${tafel}`,
      op: 'delen',
      links: deeltal,
      rechts: tafel,
      antwoord: uitkomst,
    });
  }
}

// ---------------------------------------------------------------------------
// Plus en min, in drie bereiken.
//
// Hier houdt het rekenen op en begint de keuze. "Alle plussommen tot 100" zijn
// er negenduizend; welke veertig een kind oefent, is een oordeel. De regel
// staat boven elke lijst en de lijst staat er voluit, zodat een leerkracht het
// oneens kan zijn met iets wat te lezen valt.

/** Elke combinatie van twee getallen onder de tien, één keer. Dit zijn de
 *  optelsommen waar alle andere op leunen — 45 stuks, precies de helft van de
 *  tafel van tien in de andere richting. */
function plusTotTwintig() {
  const items = [];
  for (let a = 1; a <= 9; a++) {
    for (let b = a; b <= 9; b++) {
      items.push({ id: `plus-${a}+${b}`, op: 'plus', links: a, rechts: b, antwoord: a + b });
    }
  }
  return items;
}

/** De aftreksommen die over het tiental heen gaan, en alleen die: 15 − 8 is de
 *  som waar het misgaat, 18 − 3 is er een die een kind al kan. Deeltal van tien
 *  tot achttien, aftrekker en uitkomst allebei onder de tien. */
function minTotTwintig() {
  const items = [];
  for (let deeltal = 10; deeltal <= 18; deeltal++) {
    for (let af = 1; af <= 9; af++) {
      const uit = deeltal - af;
      if (uit < 1 || uit > 9) continue;
      items.push({
        id: `min-${deeltal}-${af}`,
        op: 'min',
        links: deeltal,
        rechts: af,
        antwoord: uit,
      });
    }
  }
  return items;
}

/**
 * Vijftien beginzetallen, verspreid over de tientallen, elk met drie
 * getallen erbij of eraf. De erbij-getallen gaan over een tiental heen (6, 9)
 * of zijn zelf tweecijferig (14), want dat zijn de twee dingen die een kind
 * hier leert. Precies vijfenveertig, net als de sommen tot twintig.
 */
const HONDERD_PLUS = [12, 17, 23, 28, 34, 39, 45, 48, 53, 57, 62, 68, 71, 76, 85];
const HONDERD_MIN = [23, 31, 36, 42, 44, 54, 58, 65, 67, 73, 76, 81, 84, 92, 95];
const DUIZEND_PLUS = [120, 175, 234, 308, 346, 425, 487, 512, 563, 608, 647, 725, 764, 806, 845];
const DUIZEND_MIN = [230, 315, 367, 428, 441, 546, 589, 652, 673, 738, 768, 812, 845, 924, 956];

function plusSommen(basis, erbij, naam) {
  const items = [];
  for (const a of basis) {
    for (const b of erbij) {
      items.push({ id: `${naam}-${a}+${b}`, op: 'plus', links: a, rechts: b, antwoord: a + b });
    }
  }
  return items;
}

function minSommen(basis, eraf, naam) {
  const items = [];
  for (const a of basis) {
    for (const b of eraf) {
      items.push({ id: `${naam}-${a}-${b}`, op: 'min', links: a, rechts: b, antwoord: a - b });
    }
  }
  return items;
}

const PLUS_MIN = [
  { id: 'plus-20', op: 'plus', niveau: 1, items: plusTotTwintig() },
  { id: 'min-20', op: 'min', niveau: 1, items: minTotTwintig() },
  { id: 'plus-100', op: 'plus', niveau: 2, items: plusSommen(HONDERD_PLUS, [6, 9, 14], 'plus100') },
  { id: 'min-100', op: 'min', niveau: 2, items: minSommen(HONDERD_MIN, [7, 9, 14], 'min100') },
  {
    id: 'plus-1000',
    op: 'plus',
    niveau: 3,
    items: plusSommen(DUIZEND_PLUS, [60, 95, 140], 'plus1000'),
  },
  {
    id: 'min-1000',
    op: 'min',
    niveau: 3,
    items: minSommen(DUIZEND_MIN, [70, 95, 140], 'min1000'),
  },
];

// ---------------------------------------------------------------------------
// Keersommen voorbij de tafels, in twee bereiken (ADR-100).
//
// Wat na de tafels komt: een getal boven de tien keer een getal onder de tien,
// de som die een kind splitst — 6 × 14 is 6 × 10 en 6 × 4. Het kleine getal
// staat voorop, zoals een rekenboek het schrijft: zes groepjes van veertien.

/** Elf tot en met vijfentwintig keer drie tot en met negen, zolang de uitkomst
 *  niet boven de honderd komt. Geen ronde tientallen: 6 × 20 is een tafelsom
 *  met een nul erachter, niet iets om te splitsen. Precies vijftig. Keer twee
 *  staat er niet in: dat is verdubbelen, en dat kan een kind al. */
function keerTotHonderd() {
  const items = [];
  for (let keer = 3; keer <= 9; keer++) {
    for (let getal = 11; getal <= 25; getal++) {
      if (getal % 10 === 0 || keer * getal > 100) continue;
      items.push({
        id: `keer100-${keer}x${getal}`,
        op: 'keer',
        links: keer,
        rechts: getal,
        antwoord: keer * getal,
      });
    }
  }
  return items;
}

/** Vijftien tweecijferige getallen, verspreid over de tientallen, elk keer 4, 7
 *  en 9 — de tafels waar een kind het langst over doet. De grootste is 9 × 96
 *  en blijft onder de duizend. Vijfenveertig, net als plus en min tot 1000. */
const DUIZEND_KEER = [16, 23, 27, 34, 38, 42, 46, 53, 58, 64, 67, 75, 83, 88, 96];

function keerSommen(getallen, keren, naam) {
  const items = [];
  for (const keer of keren) {
    for (const getal of getallen) {
      items.push({
        id: `${naam}-${keer}x${getal}`,
        op: 'keer',
        links: keer,
        rechts: getal,
        antwoord: keer * getal,
      });
    }
  }
  return items;
}

/**
 * Een eigen datum, want de rest van de inhoud veranderde niet toen deze erbij
 * kwamen — zie CONTENT_VERSION.
 */
const KEER_VERSION = '2026-09-11';

const KEER = [
  { id: 'keer-100', op: 'keer', niveau: 2, items: keerTotHonderd() },
  {
    id: 'keer-1000',
    op: 'keer',
    niveau: 3,
    items: keerSommen(DUIZEND_KEER, [4, 7, 9], 'keer1000'),
  },
];

// "Keersommen tot 10" is geen bestand: dat zijn de tafelsommen met een uitkomst
// tot tien, en die hebben hun id al (`tafel-2x3`). `src/content/loadSums.ts`
// stelt die set samen uit dezelfde items, zoals de mixen (ADR-120).

// ---------------------------------------------------------------------------
// Deelsommen, in drie bereiken, net als de keersommen (ADR-120).
//
// "Tot 10" en "tot 100" betekent hier wat het bij elke andere soort som
// betekent: geen getal in de som is groter. Bij delen is dat het deeltal. Elke
// deelsom is de omkering van een keersom die er al staat, dus er komt nooit een
// rest uit en er wordt nooit door nul gedeeld.
//
// - tot 10: de tafels andersom met een deeltal tot tien. 8 : 2, 9 : 3.
// - tot 100: de rest van de tafels andersom tot honderd, en de keersommen tot
//   100 andersom: 84 : 6 = 14.
// - tot 1000: de keersommen tot 1000 andersom, 864 : 9 = 96, en de drie
//   tafelsommen boven de honderd (108 : 12, 110 : 11, 120 : 12), zodat geen
//   deelsom die er was verdwijnt.

/** Een keersom omgekeerd: de uitkomst gedeeld door het kleine getal. */
function omgekeerd(keersommen, naam) {
  return keersommen.map((som) => ({
    id: `${naam}-${som.antwoord}-${som.links}`,
    op: 'delen',
    links: som.antwoord,
    rechts: som.links,
    antwoord: som.rechts,
  }));
}

const DELEN = [
  {
    id: 'delen-10',
    op: 'delen',
    niveau: 1,
    items: TAFEL_DELEN.filter((som) => som.links <= 10),
  },
  {
    id: 'delen-100',
    op: 'delen',
    niveau: 2,
    items: [
      ...TAFEL_DELEN.filter((som) => som.links > 10 && som.links <= 100),
      ...omgekeerd(KEER[0].items, 'deel100'),
    ],
  },
  {
    id: 'delen-1000',
    op: 'delen',
    niveau: 3,
    items: [
      ...TAFEL_DELEN.filter((som) => som.links > 100),
      ...omgekeerd(KEER[1].items, 'deel1000'),
    ],
  },
];

// ---------------------------------------------------------------------------
// Splitsen (ADR-120): "10 = 7 + ?". Het hele getal staat links, het deel dat
// je al hebt rechts, en het antwoord is het deel dat mist. Dat is het
// splitsbeen uit groep 3 en 4, als som geschreven.

/** Elke manier om twee tot en met tien in twee delen te splitsen: 45 stuks,
 *  net als plus tot twintig, en elk splitsbeen dat een kind leert. */
function splitsTotTien() {
  const items = [];
  for (let heel = 2; heel <= 10; heel++) {
    for (let deel = 1; deel < heel; deel++) {
      items.push({
        id: `splits-${heel}-${deel}`,
        op: 'splitsen',
        links: heel,
        rechts: deel,
        antwoord: heel - deel,
      });
    }
  }
  return items;
}

/** Elf tot en met negentien, elk met vier tot en met acht als het deel dat er
 *  al is: 13 = 5 + ?. Het antwoord gaat dan meestal over het tiental heen, en
 *  dat is wat een kind hier leert. Vijfenveertig. */
function splitsTotTwintig() {
  const items = [];
  for (let heel = 11; heel <= 19; heel++) {
    for (let deel = 4; deel <= 8; deel++) {
      items.push({
        id: `splits-${heel}-${deel}`,
        op: 'splitsen',
        links: heel,
        rechts: deel,
        antwoord: heel - deel,
      });
    }
  }
  return items;
}

/** Aanvullen tot een rond tiental en tot honderd: de ronde tientallen van
 *  twintig tot honderd, elk met vijf delen verspreid over het getal. Vijfenveertig. */
const HONDERD_SPLITS = {
  20: [3, 8, 11, 14, 17],
  30: [4, 9, 13, 18, 26],
  40: [6, 12, 17, 23, 35],
  50: [7, 15, 22, 34, 46],
  60: [8, 19, 27, 41, 53],
  70: [5, 16, 28, 44, 62],
  80: [9, 23, 36, 47, 71],
  90: [12, 24, 38, 55, 83],
  100: [6, 25, 37, 64, 88],
};

function splitsTotHonderd() {
  return Object.entries(HONDERD_SPLITS).flatMap(([heel, delen]) =>
    delen.map((deel) => ({
      id: `splits-${heel}-${deel}`,
      op: 'splitsen',
      links: Number(heel),
      rechts: deel,
      antwoord: Number(heel) - deel,
    })),
  );
}

// ---------------------------------------------------------------------------
// Halveren en verdubbelen (ADR-120), elk in drie bereiken zoals plus en min.
// Verdubbelen is halveren andersom, precies zoals delen de tafels andersom is:
// dezelfde getallen, de andere kant op. Alleen even getallen worden gehalveerd,
// dus het antwoord is altijd heel.

/** Tot twintig: elk even getal. Tot honderd: elk even getal daarboven. */
const EVEN_TOT_TWINTIG = Array.from({ length: 10 }, (_, i) => 2 * (i + 1));
const EVEN_TOT_HONDERD = Array.from({ length: 40 }, (_, i) => 22 + 2 * i);
/** Tot duizend: vijfenveertig even getallen, verspreid over de honderdtallen,
 *  met ronde tientallen (150, 250) en getallen waar een helft over een tiental
 *  of honderdtal gaat (136, 314). */
const EVEN_TOT_DUIZEND = [
  108, 124, 136, 150, 172, 190, 214, 236, 250, 268, 290, 312, 338, 350, 376, 394, 410, 432, 456,
  470, 498, 516, 530, 554, 572, 590, 614, 638, 650, 676, 692, 710, 734, 756, 770, 798, 812, 836,
  850, 874, 890, 916, 938, 956, 1000,
];

function halveren(getallen) {
  return getallen.map((getal) => ({
    id: `halveer-${getal}`,
    op: 'halveren',
    links: getal,
    rechts: 2,
    antwoord: getal / 2,
  }));
}

function verdubbelen(getallen) {
  return getallen.map((getal) => ({
    id: `verdubbel-${getal / 2}`,
    op: 'verdubbelen',
    links: getal / 2,
    rechts: 2,
    antwoord: getal,
  }));
}

const NIEUW = [
  { id: 'splitsen-10', op: 'splitsen', niveau: 1, items: splitsTotTien() },
  { id: 'splitsen-20', op: 'splitsen', niveau: 1, items: splitsTotTwintig() },
  { id: 'splitsen-100', op: 'splitsen', niveau: 2, items: splitsTotHonderd() },
  { id: 'halveren-20', op: 'halveren', niveau: 1, items: halveren(EVEN_TOT_TWINTIG) },
  { id: 'halveren-100', op: 'halveren', niveau: 2, items: halveren(EVEN_TOT_HONDERD) },
  { id: 'halveren-1000', op: 'halveren', niveau: 3, items: halveren(EVEN_TOT_DUIZEND) },
  { id: 'verdubbelen-20', op: 'verdubbelen', niveau: 1, items: verdubbelen(EVEN_TOT_TWINTIG) },
  { id: 'verdubbelen-100', op: 'verdubbelen', niveau: 2, items: verdubbelen(EVEN_TOT_HONDERD) },
  { id: 'verdubbelen-1000', op: 'verdubbelen', niveau: 3, items: verdubbelen(EVEN_TOT_DUIZEND) },
];

/** De datum waarop delen, splitsen, halveren en verdubbelen erbij kwamen. */
const BEREIK_VERSION = '2026-09-13';

function versieVan(set) {
  if (set.op === 'keer') return KEER_VERSION;
  if (set.op === 'plus' || set.op === 'min') return CONTENT_VERSION;
  return BEREIK_VERSION;
}

const BEREIKEN = [...PLUS_MIN, ...KEER, ...DELEN, ...NIEUW];

for (const set of BEREIKEN) {
  write(SOM_DIR, {
    id: set.id,
    op: set.op,
    tafel: null,
    niveau: set.niveau,
    contentVersie: versieVan(set),
    items: set.items,
  });
  geschreven++;
  sommen += set.items.length;
}

// Een uitkomst onder de één of een getal boven het bereik zou hier stil
// doorheen glippen en pas op een scherm van een kind opvallen. "Tot 100" is een
// belofte over elk getal in de som, niet alleen over de uitkomst: bij delen,
// min, splitsen en halveren is het getal links het grootste. De test
// controleert het ook, maar de generator hoort geen bestand te schrijven
// waarvan hij weet dat het fout is.
for (const set of BEREIKEN) {
  const grens = Number(set.id.split('-')[1]);
  for (const som of set.items) {
    const grootste = Math.max(som.links, som.rechts, som.antwoord);
    if (som.antwoord < 1 || grootste > grens || !Number.isInteger(som.antwoord)) {
      throw new Error(`${set.id}: ${som.links} ${som.op} ${som.rechts} = ${som.antwoord}`);
    }
  }
}

console.log(`${geschreven} sets, ${sommen} sommen`);
