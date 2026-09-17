import { describe, expect, it } from 'vitest';
import {
  aanDeBeurt,
  bijhoudstempel,
  laagVan,
  minutenVoor,
  paginaStand,
  rondeAlbum,
  schooljaarVan,
  seizoenVan,
  stapVan,
  stempelsVan,
  tekenVan,
  vooruitblik,
} from './album';
import { emptyState, review } from './leitner';
import type { ItemState } from './types';

const DAG = 86_400_000;
const START = new Date(2026, 8, 7, 10);
const na = (dagen: number) => new Date(START.getTime() + dagen * DAG);

/** Goed op het moment dat het item aan de beurt is, `keer` keer achter elkaar. */
function opTijdGoed(state: ItemState, keer: number): { state: ItemState; now: Date } {
  let huidig = state;
  let now = START;
  for (let i = 0; i < keer; i++) {
    now = huidig.volgendeReview === null ? now : new Date(huidig.volgendeReview);
    huidig = review(huidig, true, now);
  }
  return { state: huidig, now };
}

describe('review draagt het album mee', () => {
  it('onthoudt de hoogste doos als een fout het item terug naar doos één zet', () => {
    const { state, now } = opTijdGoed(emptyState('utrecht'), 3);
    expect(state.box).toBe(4);
    expect(state.hoogsteDoos).toBe(4);
    const fout = review(state, false, now);
    expect(fout.box).toBe(1);
    expect(fout.hoogsteDoos).toBe(4);
  });

  it('geeft een stempel voor goed in doos vijf dat aan de beurt was, en niet ervoor', () => {
    const { state: inVijf, now } = opTijdGoed(emptyState('utrecht'), 4);
    expect(inVijf.box).toBe(5);
    expect(stempelsVan(inVijf)).toEqual([]);
    const opTijd = review(inVijf, true, new Date(inVijf.volgendeReview ?? now.toISOString()));
    expect(stempelsVan(opTijd)).toHaveLength(1);
  });

  it('geeft geen stempel voor goed dat niet aan de beurt was', () => {
    const { state: inVijf, now } = opTijdGoed(emptyState('utrecht'), 4);
    const teVroeg = review(inVijf, true, new Date(now.getTime() + DAG));
    expect(stempelsVan(teVroeg)).toEqual([]);
    expect(teVroeg.hoogsteDoos).toBe(5);
  });

  it('leest een rij van vóór het album als zijn huidige doos', () => {
    const oud: ItemState = {
      itemId: 'x',
      box: 3,
      laatsteReview: START.toISOString(),
      volgendeReview: START.toISOString(),
      goedCount: 2,
      foutCount: 0,
    };
    expect(laagVan(oud)).toBe(3);
    expect(review(oud, true, START).hoogsteDoos).toBe(4);
  });
});

describe('laagVan en tekenVan', () => {
  it('is leeg voor een item dat nooit beantwoord is', () => {
    expect(laagVan(undefined)).toBe(0);
    expect(laagVan(emptyState('x'))).toBe(0);
  });

  it('geeft een schets geen teken, ook na een fout', () => {
    const { state, now } = opTijdGoed(emptyState('x'), 2);
    const fout = review(state, false, now);
    expect(laagVan(fout)).toBe(3);
    expect(tekenVan(fout, now)).toBeNull();
  });

  it('zet lastig op een plaatje met kleur dat fout ging, en haalt het weg op doos vier', () => {
    const { state, now } = opTijdGoed(emptyState('x'), 3);
    const fout = review(state, false, now);
    expect(tekenVan(fout, now)).toBe('lastig');
    const hersteld = opTijdGoed(fout, 3).state;
    expect(hersteld.box).toBe(4);
    expect(tekenVan(hersteld, now)).toBeNull();
  });

  it('zet opfrissen op een plaatje met kleur dat te lang niet gezien is', () => {
    const { state, now } = opTijdGoed(emptyState('x'), 3);
    expect(tekenVan(state, now)).toBeNull();
    expect(tekenVan(state, new Date(now.getTime() + 17 * DAG))).toBe('opfrissen');
  });
});

describe('stapVan', () => {
  it('zegt hoeveel dagen een goed antwoord moet wachten dat niet aan de beurt was', () => {
    const eerste = review(emptyState('x'), true, START);
    const nogEens = review(eerste, true, START);
    const stap = stapVan(eerste, nogEens, START);
    expect(stap.wachtDagen).toBe(2);
    expect(stap.naar).toBe(stap.van);
  });

  it('noemt een laag erbij, en geen wachttijd, als het antwoord telde', () => {
    const stap = stapVan(emptyState('x'), review(emptyState('x'), true, START), START);
    expect(stap).toMatchObject({ van: 0, naar: 2, wachtDagen: null, stempel: false });
  });

  it('meldt lastig en weer goed', () => {
    const { state, now } = opTijdGoed(emptyState('x'), 3);
    const fout = review(state, false, now);
    expect(stapVan(state, fout, now).lastig).toBe(true);
    const bijna = opTijdGoed(fout, 2).state;
    const terug = review(bijna, true, new Date(bijna.volgendeReview ?? now.toISOString()));
    expect(stapVan(bijna, terug, now).weerGoed).toBe(true);
  });
});

describe('paginaStand en rondeAlbum', () => {
  it('telt lagen, stempels en tekens per pagina', () => {
    const kleur = opTijdGoed(emptyState('a'), 3);
    const states = new Map<string, ItemState>([
      ['a', kleur.state],
      ['b', review(emptyState('b'), true, START)],
    ]);
    const stand = paginaStand(['a', 'b', 'c'], states, kleur.now);
    expect(stand).toMatchObject({ totaal: 3, begonnen: 2, kleur: 1, lijst: 0, inKleur: false });
  });

  it('noemt wat een ronde veranderde, en wanneer de pagina in kleur kwam', () => {
    const drie = opTijdGoed(emptyState('a'), 2).state;
    const vier = review(drie, true, new Date(drie.volgendeReview ?? START.toISOString()));
    const voor = new Map([['a', drie]]);
    const erna = new Map([['a', vier]]);
    const ronde = rondeAlbum(['a', 'a'], voor, erna, START);
    expect(ronde).toMatchObject({ verder: 1, kleur: 1, veranderd: ['a'], paginaInKleur: true });
  });
});

describe('vooruitblik en aanDeBeurt', () => {
  it('telt wat morgen terugkomt en wat dan kleur kan krijgen', () => {
    const drie = opTijdGoed(emptyState('a'), 2);
    const dag = new Date(new Date(drie.state.volgendeReview ?? '').getTime() - DAG);
    const blik = vooruitblik(['a'], new Map([['a', drie.state]]), dag);
    expect(blik).toMatchObject({ morgenTerug: 1, morgenKleur: 1, eerstVolgende: null });
  });

  it('noemt anders over hoeveel dagen het eerste plaatje terugkomt', () => {
    const een = review(emptyState('a'), true, START);
    const blik = vooruitblik(['a'], new Map([['a', een]]), new Date(START.getTime() - 3 * DAG));
    expect(blik.morgenTerug).toBe(0);
    expect(blik.eerstVolgende).toBe(5);
  });

  it('telt alleen wat nu aan de beurt is', () => {
    const een = review(emptyState('a'), true, START);
    expect(aanDeBeurt(['a', 'b'], new Map([['a', een]]), START)).toBe(0);
    expect(aanDeBeurt(['a'], new Map([['a', een]]), na(2))).toBe(1);
  });
});

describe('seizoenen en bijhouden', () => {
  it('rekent het schooljaar vanaf september', () => {
    expect(schooljaarVan(new Date(2026, 8, 1))).toBe(2026);
    expect(schooljaarVan(new Date(2027, 1, 1))).toBe(2026);
    expect(schooljaarVan(new Date(2027, 7, 31))).toBe(2026);
  });

  it('houdt december en februari in dezelfde winter', () => {
    expect(seizoenVan(new Date(2026, 11, 20)).sleutel).toBe('2026-winter');
    expect(seizoenVan(new Date(2027, 1, 20)).sleutel).toBe('2026-winter');
    expect(seizoenVan(new Date(2026, 9, 1)).seizoen).toBe('herfst');
    expect(seizoenVan(new Date(2027, 3, 1)).seizoen).toBe('lente');
    expect(seizoenVan(new Date(2027, 6, 1)).seizoen).toBe('zomer');
  });

  it('geeft geen stempel in het seizoen van het diploma zelf', () => {
    const behaald = new Date(2026, 9, 1).toISOString();
    expect(bijhoudstempel(behaald, [], true, new Date(2026, 10, 1))).toBeNull();
  });

  it('geeft één stempel per later seizoen, alleen als de pagina nog rijp is', () => {
    const behaald = new Date(2026, 9, 1).toISOString();
    const winter = new Date(2026, 11, 10);
    expect(bijhoudstempel(behaald, [], false, winter)).toBeNull();
    expect(bijhoudstempel(behaald, [], true, winter)).toBe('2026-winter');
    expect(bijhoudstempel(behaald, ['2026-winter'], true, winter)).toBeNull();
  });

  it('schat de minuten van een opfrisronde, minstens één', () => {
    expect(minutenVoor(1)).toBe(1);
    expect(minutenVoor(11)).toBe(4);
  });
});
