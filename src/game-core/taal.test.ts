import { describe, expect, it } from 'vitest';
import {
  beoordeelWoord,
  berekendAntwoord,
  gatLetters,
  keerInZin,
  kofschipLetter,
  letterOpties,
  letterVerschil,
  stamVan,
  voorvoegselVan,
  werkwoordAfleiders,
  werkwoordOpties,
  werkwoordRegel,
  werkwoordsvorm,
  zinDelen,
  type Persoon,
  type SpellingItem,
  type SterkeWerkwoorden,
  type Tijd,
  type WerkwoordItem,
} from './taal';

/**
 * Taal's engine (ADR-118): judging a typed word strictly, showing which letters
 * differ, and working a weak verb out rather than trusting the content for it.
 */

describe('judging a typed word', () => {
  it('takes the word itself, whatever its capitals and the spaces around it', () => {
    expect(beoordeelWoord('trein', 'trein').goed).toBe(true);
    expect(beoordeelWoord('Trein', 'trein').goed).toBe(true);
    expect(beoordeelWoord('  trein ', 'trein').goed).toBe(true);
    expect(beoordeelWoord('  trein ', 'trein').getypt).toBe('trein');
  });

  it('forgives no slip at all: one letter out is wrong', () => {
    // The reverse of ADR-017. On the map the letter is noise around a place;
    // in spelling the letter is the question.
    expect(beoordeelWoord('trijn', 'trein').goed).toBe(false);
    expect(beoordeelWoord('tren', 'trein').goed).toBe(false);
    expect(beoordeelWoord('treinn', 'trein').goed).toBe(false);
    expect(beoordeelWoord('tr ein', 'trein').goed).toBe(false);
    expect(beoordeelWoord('', 'trein').goed).toBe(false);
    expect(beoordeelWoord('   ', 'trein').goed).toBe(false);
  });

  it('counts an accent, a trema, an apostrophe and a hyphen as letters', () => {
    expect(beoordeelWoord('cafe', 'café').goed).toBe(false);
    expect(beoordeelWoord('geeindigd', 'geëindigd').goed).toBe(false);
    expect(beoordeelWoord('opas', 'opa’s').goed).toBe(false);
    expect(beoordeelWoord('zeeen', 'zeeën').goed).toBe(false);
    // The same letter sent two ways is the same letter: that is encoding.
    expect(beoordeelWoord('café', 'café').goed).toBe(true);
  });

  it('leaves room for Engels: a word in front, and a second spelling', () => {
    const lidwoord = { vooraf: ['a', 'an', 'the'] };
    expect(beoordeelWoord('the dog', 'dog', lidwoord).goed).toBe(true);
    expect(beoordeelWoord('a dog', 'dog', lidwoord).goed).toBe(true);
    expect(beoordeelWoord('dog', 'dog', lidwoord).goed).toBe(true);
    expect(beoordeelWoord('thedog', 'dog', lidwoord).goed).toBe(false);
    expect(beoordeelWoord('the dog', 'dog').goed).toBe(false);
    expect(beoordeelWoord('to run', 'run', { vooraf: ['to'] }).goed).toBe(true);
    expect(beoordeelWoord('color', 'colour', { aliassen: ['color'] }).goed).toBe(true);
  });
});

describe('which letters differ', () => {
  it('marks ij in what was typed and ei in the word', () => {
    expect(letterVerschil('trijn', 'trein')).toEqual({
      getypt: [
        { tekst: 'tr', anders: false },
        { tekst: 'ij', anders: true },
        { tekst: 'n', anders: false },
      ],
      goed: [
        { tekst: 'tr', anders: false },
        { tekst: 'ei', anders: true },
        { tekst: 'n', anders: false },
      ],
    });
  });

  it('marks a letter that was left out in the word, and one too many in what was typed', () => {
    expect(letterVerschil('wort', 'wordt').goed).toEqual([
      { tekst: 'wor', anders: false },
      { tekst: 'd', anders: true },
      { tekst: 't', anders: false },
    ]);
    expect(letterVerschil('wort', 'wordt').getypt).toEqual([{ tekst: 'wort', anders: false }]);
    expect(letterVerschil('hondt', 'hond').getypt).toEqual([
      { tekst: 'hond', anders: false },
      { tekst: 't', anders: true },
    ]);
  });

  it('does not call a capital a difference', () => {
    expect(letterVerschil('Trein', 'trein').goed).toEqual([{ tekst: 'trein', anders: false }]);
  });
});

describe('a word in its sentence', () => {
  const trein: SpellingItem = {
    id: 'taal-sp-eiij-trein',
    woord: 'trein',
    gat: [2, 4],
    keuzes: ['ei', 'ij'],
    zin: 'Ik ga met de trein naar opa.',
    groep: 5,
  };

  it('knows the letters of the gap', () => {
    expect(gatLetters(trein)).toBe('ei');
  });

  it('finds the word whole, and not inside another', () => {
    expect(zinDelen(trein.zin, 'trein')).toEqual({
      voor: 'Ik ga met de ',
      woord: 'trein',
      na: ' naar opa.',
    });
    expect(keerInZin('De treinen en de trein.', 'trein')).toBe(1);
    expect(keerInZin('Een klein ei.', 'ei')).toBe(1);
    expect(keerInZin('Een klein huis.', 'trein')).toBe(0);
    expect(zinDelen('Een klein huis.', 'trein')).toBeNull();
  });

  it('finds a verb at the start of a question, with its capital', () => {
    expect(zinDelen('Word jij morgen tien?', 'word')?.woord).toBe('Word');
  });

  it('offers the letter pieces and nothing else', () => {
    expect([...letterOpties(trein)].sort()).toEqual(['ei', 'ij']);
  });
});

/** One form, the way the rules make it. */
const vorm = (infinitief: string, persoon: Persoon, tijd: Tijd, achter = false) =>
  werkwoordsvorm(infinitief, persoon, tijd, achter ? { achter } : {});

describe('the stem', () => {
  it.each([
    ['worden', 'word'],
    ['maken', 'maak'],
    ['leven', 'leef'],
    ['verhuizen', 'verhuis'],
    ['bellen', 'bel'],
    ['zetten', 'zet'],
    ['fietsen', 'fiets'],
    ['wandelen', 'wandel'],
    ['tekenen', 'teken'],
    ['luisteren', 'luister'],
    ['spelen', 'speel'],
    ['herhalen', 'herhaal'],
    ['betalen', 'betaal'],
    ['duwen', 'duw'],
    ['lachen', 'lach'],
    ['antwoorden', 'antwoord'],
    ['oefenen', 'oefen'],
    ['wonen', 'woon'],
  ])('%s → %s', (infinitief, stam) => {
    expect(stamVan(infinitief)).toBe(stam);
  });
});

describe('the tegenwoordige tijd', () => {
  it('is the stem for ik, and the stem and a t for jij and hij', () => {
    expect(vorm('worden', 'ik', 'tt')).toBe('word');
    expect(vorm('worden', 'hij', 'tt')).toBe('wordt');
    expect(vorm('worden', 'jij', 'tt')).toBe('wordt');
    expect(vorm('vinden', 'hij', 'tt')).toBe('vindt');
    expect(vorm('antwoorden', 'hij', 'tt')).toBe('antwoordt');
    expect(vorm('leven', 'hij', 'tt')).toBe('leeft');
    expect(vorm('verhuizen', 'hij', 'tt')).toBe('verhuist');
    expect(vorm('maken', 'ik', 'tt')).toBe('maak');
    expect(vorm('bellen', 'jij', 'tt')).toBe('belt');
  });

  it('adds no t where the stem ends in one', () => {
    expect(vorm('zetten', 'hij', 'tt')).toBe('zet');
    expect(vorm('praten', 'hij', 'tt')).toBe('praat');
  });

  it('takes no t with jij after the verb', () => {
    expect(vorm('worden', 'jij', 'tt', true)).toBe('word');
    expect(vorm('fietsen', 'jij', 'tt', true)).toBe('fiets');
  });

  it('is the infinitive for more than one', () => {
    expect(vorm('worden', 'wij', 'tt')).toBe('worden');
  });
});

describe('the verleden tijd', () => {
  it('asks the letter before -en in the infinitive, not the stem', () => {
    // The trap the rule is taught for: the stem of leven ends in f, and it is
    // still leefde, because the infinitive has a v.
    expect(kofschipLetter('leven')).toBe('v');
    expect(vorm('leven', 'hij', 'vt')).toBe('leefde');
    expect(vorm('verhuizen', 'hij', 'vt')).toBe('verhuisde');
    expect(vorm('fietsen', 'hij', 'vt')).toBe('fietste');
  });

  it.each([
    ['maken', 'hij', 'maakte'],
    ['zetten', 'hij', 'zette'],
    ['praten', 'ik', 'praatte'],
    ['antwoorden', 'hij', 'antwoordde'],
    ['bellen', 'hij', 'belde'],
    ['lachen', 'hij', 'lachte'],
    ['werken', 'ik', 'werkte'],
    ['stoppen', 'hij', 'stopte'],
    ['faxen', 'hij', 'faxte'],
    ['fietsen', 'wij', 'fietsten'],
    ['wandelen', 'wij', 'wandelden'],
    ['horen', 'wij', 'hoorden'],
  ] as const)('%s, %s → %s', (infinitief, persoon, uit) => {
    expect(vorm(infinitief, persoon, 'vt')).toBe(uit);
  });
});

describe('the voltooid deelwoord', () => {
  it.each([
    ['fietsen', 'gefietst'],
    ['leven', 'geleefd'],
    ['verhuizen', 'verhuisd'],
    ['zetten', 'gezet'],
    ['praten', 'gepraat'],
    ['antwoorden', 'geantwoord'],
    ['bellen', 'gebeld'],
    ['betalen', 'betaald'],
    ['herhalen', 'herhaald'],
    ['ontdekken', 'ontdekt'],
    ['gebeuren', 'gebeurd'],
    ['vertellen', 'verteld'],
    ['erkennen', 'erkend'],
    ['maken', 'gemaakt'],
    ['oefenen', 'geoefend'],
    ['eindigen', 'geëindigd'],
    ['wandelen', 'gewandeld'],
    ['verven', 'geverfd'],
  ])('%s → %s', (infinitief, uit) => {
    expect(vorm(infinitief, 'hij', 'vd')).toBe(uit);
  });

  it('knows a prefix only where a verb follows it', () => {
    expect(voorvoegselVan('betalen')).toBe('be');
    expect(voorvoegselVan('ontdekken')).toBe('ont');
    expect(voorvoegselVan('herhalen')).toBe('her');
    expect(voorvoegselVan('gebeuren')).toBe('ge');
    expect(voorvoegselVan('erkennen')).toBe('er');
    // Be- and ver- are only letters here: bellen and verven.
    expect(voorvoegselVan('bellen')).toBeNull();
    expect(voorvoegselVan('verven')).toBeNull();
    expect(voorvoegselVan('fietsen')).toBeNull();
  });
});

const item = (
  infinitief: string,
  persoon: Persoon,
  tijd: Tijd,
  antwoord: string,
  extra: Partial<WerkwoordItem> = {},
): WerkwoordItem => ({
  id: `taal-ww-${tijd}-${infinitief}-${persoon}`,
  zin: '',
  infinitief,
  persoon,
  tijd,
  antwoord,
  groep: 6,
  ...extra,
});

const STERK: SterkeWerkwoorden = {
  worden: { vt: 'werd', vtMv: 'werden', vd: 'geworden' },
  rijden: { vt: 'reed', vtMv: 'reden', vd: 'gereden' },
};

describe('the wrong answers beside a verb', () => {
  it('are word, wordt and werd for "Hij ▢ morgen tien"', () => {
    expect(werkwoordAfleiders(item('worden', 'hij', 'tt', 'wordt'), STERK)).toEqual([
      'word',
      'werd',
    ]);
    expect(werkwoordAfleiders(item('worden', 'ik', 'tt', 'word'), STERK)).toEqual([
      'wordt',
      'werd',
    ]);
  });

  it('are the other number and the tegenwoordige tijd in the verleden tijd', () => {
    expect(werkwoordAfleiders(item('fietsen', 'hij', 'vt', 'fietste'))).toEqual([
      'fietsten',
      'fietst',
    ]);
    expect(werkwoordAfleiders(item('fietsen', 'wij', 'vt', 'fietsten'))).toEqual([
      'fietste',
      'fietsen',
    ]);
    expect(werkwoordAfleiders(item('rijden', 'hij', 'vt', 'reed', { sterk: true }), STERK)).toEqual(
      ['reden', 'rijdt'],
    );
  });

  it('are the hij-form and the verleden tijd beside a voltooid deelwoord', () => {
    expect(werkwoordAfleiders(item('verhuizen', 'hij', 'vd', 'verhuisd'))).toEqual([
      'verhuist',
      'verhuisde',
    ]);
  });

  it('fill a place with another real form where two forms are one word', () => {
    // Ik zet and hij zet; hij ontmoet and ontmoet.
    expect(werkwoordAfleiders(item('zetten', 'hij', 'tt', 'zet'))).toEqual(['zette', 'zetten']);
    expect(werkwoordAfleiders(item('ontmoeten', 'hij', 'vd', 'ontmoet'))).toEqual([
      'ontmoette',
      'ontmoetten',
    ]);
  });

  it('are always three different words, the right one among them', () => {
    const vragen = [
      item('worden', 'jij', 'tt', 'word', { achter: true }),
      item('zetten', 'ik', 'tt', 'zet'),
      item('praten', 'hij', 'vd', 'gepraat'),
      item('rijden', 'wij', 'vt', 'reden', { sterk: true }),
      item('ontmoeten', 'hij', 'tt', 'ontmoet'),
    ];
    for (const vraag of vragen) {
      const opties = werkwoordOpties(vraag, STERK);
      expect(opties, vraag.id).toHaveLength(3);
      expect(new Set(opties).size, vraag.id).toBe(3);
      expect(opties, vraag.id).toContain(vraag.antwoord);
    }
  });
});

describe('the rule, applied to one item', () => {
  it('says hij, stem and t for "wordt"', () => {
    expect(werkwoordRegel(item('worden', 'hij', 'tt', 'wordt'))).toEqual({
      soort: 'tt-t',
      persoon: 'hij',
      stam: 'word',
      vorm: 'wordt',
      alT: false,
    });
    expect(werkwoordRegel(item('zetten', 'hij', 'tt', 'zet'))).toMatchObject({ alT: true });
    expect(werkwoordRegel(item('worden', 'jij', 'tt', 'word', { achter: true }))).toEqual({
      soort: 'tt-stam',
      stam: 'word',
      achter: true,
    });
  });

  it('names the letter of the infinitive for the verleden tijd', () => {
    expect(werkwoordRegel(item('leven', 'hij', 'vt', 'leefde'))).toMatchObject({
      soort: 'vt',
      letter: 'v',
      kofschip: false,
      stam: 'leef',
    });
  });

  it('names the prefix that takes no ge-', () => {
    expect(werkwoordRegel(item('betalen', 'hij', 'vd', 'betaald'))).toMatchObject({
      soort: 'vd',
      voorvoegsel: 'be',
      letter: 'l',
    });
  });

  it('works an item out the way the content test does', () => {
    expect(berekendAntwoord(item('worden', 'jij', 'tt', 'word', { achter: true }))).toBe('word');
    expect(berekendAntwoord(item('leven', 'wij', 'vt', 'leefden'))).toBe('leefden');
  });
});
