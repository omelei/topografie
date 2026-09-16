import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { fitView, helpTargets, MIN_TOUCH_PX, smallestSidePx, type BoundingBox } from './map';
import {
  delenVan,
  kleinsteRegioMet,
  ligtIn,
  regioById,
  regioViewBox,
  werelddelen,
  WERELD_REGIOS,
  type RegioId,
} from './wereldRegios';

interface Vorm {
  readonly id: string;
  readonly punt: readonly [number, number] | null;
  readonly bbox: BoundingBox;
}

const ROOT = process.cwd();
const wereld = JSON.parse(
  readFileSync(join(ROOT, 'public', 'geo', 'wereld', 'landen.region.json'), 'utf8'),
) as { viewBox: readonly [number, number, number, number]; vormen: readonly Vorm[] };

const vorm = (land: string) => wereld.vormen.find((v) => v.id === `wl-land-${land}`) as Vorm;

/**
 * Een telefoon rechtop: de kaartkaart na de vraag en de zoomknoppen, gemeten op
 * 393 breed. Dit is het scherm waarvoor ADR-146 bestaat.
 */
const TELEFOON = { breed: 345, hoog: 380 };

/**
 * Welke landen in dit beeld te raken zijn, met de regels van de kaart zelf: een
 * land is te raken als het zelf 24 pixels haalt, of als het een ring houdt van
 * minstens die maat (`helpTargets`, met `ringOnderPx` zoals een landenkaart).
 */
function teRaken(view: readonly [number, number, number, number], scherm = TELEFOON): Set<string> {
  const [, , w, h] = view;
  const hoogte = Math.min(scherm.hoog, (scherm.breed * h) / w);
  const fit = fitView(h, hoogte);
  const zichtbaar = wereld.vormen.filter((v) => v.punt !== null && ligtIn(v.punt, view));
  const ringen = helpTargets(zichtbaar, fit, (v) => v.punt, MIN_TOUCH_PX, MIN_TOUCH_PX / 2);
  return new Set(
    zichtbaar
      .filter((v) => smallestSidePx(v.bbox, fit) >= MIN_TOUCH_PX / 2 || ringen.has(v.id))
      .map((v) => v.id),
  );
}

describe('de gebieden om op in te zoomen', () => {
  it('liggen allemaal binnen de wereldkaart', () => {
    const [, , breed, hoog] = wereld.viewBox;
    for (const regio of WERELD_REGIOS) {
      const [x, y, w, h] = regioViewBox(regio.id);
      expect(x, regio.id).toBeGreaterThanOrEqual(0);
      expect(y, regio.id).toBeGreaterThanOrEqual(0);
      expect(x + w, regio.id).toBeLessThanOrEqual(breed);
      expect(y + h, regio.id).toBeLessThanOrEqual(hoog);
    }
  });

  it('een deel ligt binnen zijn werelddeel', () => {
    for (const regio of WERELD_REGIOS) {
      if (regio.ouder === null) continue;
      const [w, o, z, n] = regio.venster;
      const [ow, oo, oz, on] = regioById(regio.ouder).venster;
      expect([w >= ow, o <= oo, z >= oz, n <= on], regio.id).toEqual([true, true, true, true]);
    }
  });

  it('heeft zes werelddelen, en alleen die hebben delen', () => {
    expect(werelddelen()).toHaveLength(6);
    expect(delenVan('europa').map((deel) => deel.id)).toEqual([
      'europa-west',
      'europa-noord',
      'europa-balkan',
      'europa-oost',
    ]);
    expect(delenVan('europa-balkan')).toEqual(delenVan('europa'));
    expect(delenVan('zuid-amerika')).toEqual([]);
  });

  /**
   * De passing van de wereldkaart is nagerekend en niet opgeslagen. Klopt hij
   * niet, dan staat elk venster een stuk naast zijn werelddeel — en dat zie je
   * hier eerder dan op een telefoon.
   */
  it('zet een land op de plek van zijn werelddeel', () => {
    const verwacht: readonly (readonly [string, RegioId])[] = [
      ['nederland', 'europa-west'],
      ['luxemburg', 'europa-west'],
      ['kosovo', 'europa-balkan'],
      ['estland', 'europa-noord'],
      ['gambia', 'afrika-west'],
      ['lesotho', 'afrika-zuid'],
      ['qatar', 'azie-midden-oosten'],
      ['bhutan', 'azie-zuid-centraal'],
      ['japan', 'azie-oost'],
      ['brunei', 'azie-zuidoost'],
      ['jamaica', 'noord-amerika-midden'],
      ['suriname', 'zuid-amerika'],
      ['fiji', 'oceanie'],
    ];
    for (const [land, regio] of verwacht) {
      expect(ligtIn(vorm(land).punt as readonly [number, number], regioViewBox(regio)), land).toBe(
        true,
      );
    }
  });
});

describe('inzoomen maakt de wereldkaart aanwijsbaar', () => {
  /**
   * De reden voor dit alles, als getal. Op de hele wereldkaart is op een
   * telefoon bijna geen land te raken (ADR-087). Met de gebieden erbij is elk
   * land in minstens één beeld te raken — op zes na, die hier bij naam staan,
   * zodat een venster dat later verschuift niet stilletjes een zevende oplevert.
   *
   * Die zes zijn drie paren buren wier middens een paar kaarteenheden uit elkaar
   * liggen: Rwanda en Burundi, Israël en Libanon, Gambia en Guinee-Bissau. Voor
   * de vier aan zee helpt de tik in zee (`dichtstbijzijndeVorm`); Rwanda en
   * Burundi zijn het eerlijke restant.
   */
  it('op een telefoon is elk land in een beeld te raken, op zes na', () => {
    const geraakt = new Set<string>(teRaken(wereld.viewBox));
    for (const regio of WERELD_REGIOS) {
      for (const id of teRaken(regioViewBox(regio.id))) geraakt.add(id);
    }
    const rest = wereld.vormen
      .map((v) => v.id)
      .filter((id) => !geraakt.has(id))
      .sort();

    expect(rest).toEqual(
      [
        'burundi',
        'gambia',
        'guinee-bissau',
        'israel',
        'libanon',
        'rwanda',
      ].map((land) => `wl-land-${land}`),
    );
  });

  it('en op de hele kaart is dat niet zo', () => {
    expect(teRaken(wereld.viewBox).size).toBeLessThan(wereld.vormen.length / 4);
  });
});

describe('kleinsteRegioMet', () => {
  it('kiest het kleinste gebied waarin alles ligt', () => {
    const nl = vorm('nederland').punt as readonly [number, number];
    const be = vorm('belgie').punt as readonly [number, number];
    expect(kleinsteRegioMet([nl, be])).toBe('europa-west');
  });

  it('geeft de hele wereld als geen gebied beide bevat', () => {
    const nl = vorm('nederland').punt as readonly [number, number];
    const jp = vorm('japan').punt as readonly [number, number];
    expect(kleinsteRegioMet([nl, jp])).toBeNull();
  });
});
