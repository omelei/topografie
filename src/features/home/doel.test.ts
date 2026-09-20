import { describe, expect, it } from 'vitest';
import type { ItemState, LeitnerBox, Schedulable } from '@/game-core';
import type { Onderdeel } from '@/features/module/onderdelen';
import { behaaldDiploma, doelwitVan, doelwitten, standVan, suggesties } from './doel';

const NU = new Date('2026-09-15T09:00:00');

function deel(setId: string, moduleId: Onderdeel['moduleId'], items: number): Onderdeel {
  return {
    moduleId,
    setId,
    naam: null,
    literalNaam: setId,
    kortNaam: null,
    mix: false,
    items: Array.from({ length: items }, (_, i): Schedulable => ({ id: `${setId}-${i}` })),
    roundSize: 10,
  };
}

/** Onthouden is doos vier of vijf, en de review moet niet te lang geleden zijn. */
function standen(ids: readonly string[], box: LeitnerBox): Map<string, ItemState> {
  const map = new Map<string, ItemState>();
  for (const id of ids) {
    map.set(id, {
      itemId: id,
      box,
      laatsteReview: NU.toISOString(),
      volgendeReview: NU.toISOString(),
      goedCount: box,
      foutCount: 0,
    });
  }
  return map;
}

describe('welk diploma bij welke set hoort', () => {
  it('kent de vier soorten', () => {
    expect(doelwitVan(deel('tafel-7', 'tafels', 10))?.id).toBe('diploma-tafel-7');
    expect(doelwitVan(deel('tafel-7', 'tafels', 10))?.mode).toBe('tafeldiploma');
    expect(doelwitVan(deel('vlag-europa-alle', 'vlaggen', 46))?.id).toBe('diploma-vlag-europa');
    expect(doelwitVan(deel('klok-half', 'klok', 12))?.id).toBe('diploma-klok-half');
    expect(doelwitVan(deel('nl-provincies', 'topo', 12))?.id).toBe('diploma-topo-nl-provincies');
  });

  it('geeft niets terug voor een set zonder diploma', () => {
    expect(doelwitVan(deel('tafel-13', 'tafels', 10))).toBeNull();
    expect(doelwitVan(deel('klok-mix', 'klok', 40))).toBeNull();
    // De helft van een werelddeel: een certificaat voor de makkelijke helft.
    expect(doelwitVan(deel('vlag-europa-bekend', 'vlaggen', 12))).toBeNull();
    // En een eigen lijst van een ouder: die heet morgen anders (ADR-168).
    expect(doelwitVan(deel('eigen-1', 'woorden', 20))).toBeNull();
  });

  it('geeft sinds ADR-168 ook de vakken die er geen hadden een diploma', () => {
    expect(doelwitVan(deel('wereld-landen', 'topo', 167))?.mode).toBe('topo-diploma');
    expect(doelwitVan(deel('plus-20', 'tafels', 45))?.mode).toBe('reken-diploma');
    expect(doelwitVan(deel('delen-100', 'tafels', 140))?.mode).toBe('reken-diploma');
    expect(doelwitVan(deel('taal-sp-eiij', 'woorden', 40))?.mode).toBe('taal-diploma');
    expect(doelwitVan(deel('taal-ww-vt', 'woorden', 30))?.mode).toBe('taal-diploma');
    expect(doelwitVan(deel('vlag-nederland-provincies', 'vlaggen', 12))?.mode).toBe('vlag-diploma');
    // Een mix van Taal niet, zoals geen enkele mix.
    expect(doelwitVan(deel('taal-sp-mix', 'woorden', 300))).toBeNull();
    expect(doelwitVan(deel('taal-sp-fouten', 'woorden', 300))).toBeNull();
  });

  /** Een mix heeft er geen: er bestaat geen diploma voor "alles door elkaar". */
  it('geeft niets terug voor een mix, ook niet als de id erop lijkt', () => {
    expect(doelwitVan({ ...deel('nl-provincies', 'topo', 12), mix: true })).toBeNull();
  });
});

describe('welke doelen dit kind mag kiezen', () => {
  const alles = [
    deel('tafel-7', 'tafels', 10),
    deel('nl-provincies', 'topo', 12),
    deel('rekenmix', 'tafels', 40),
  ];

  it('zonder code alleen het tafeldiploma', () => {
    expect(doelwitten(alles, false).map((d) => d.id)).toEqual(['diploma-tafel-7']);
  });

  it('met code alle diploma’s die er zijn', () => {
    expect(doelwitten(alles, true).map((d) => d.id)).toEqual([
      'diploma-tafel-7',
      'diploma-topo-nl-provincies',
    ]);
  });
});

describe('hoe ver een kind is', () => {
  it('telt wat het onthoudt, niet wat het ooit goed had', () => {
    const doelwit = doelwitVan(deel('tafel-7', 'tafels', 10))!;
    const ids = doelwit.deel.items.map((item) => item.id);
    const states = standen(ids.slice(0, 8), 4);
    expect(standVan(doelwit, states, NU)).toMatchObject({ onthouden: 8, totaal: 10 });
  });

  /**
   * De lat om de toets aan te bieden is de lat van het diploma zelf. Het
   * tafeldiploma is de hele tafel zonder fout; negen van de tien is niet rijp.
   */
  it('biedt het tafeldiploma pas aan bij de hele tafel', () => {
    const doelwit = doelwitVan(deel('tafel-7', 'tafels', 10))!;
    const ids = doelwit.deel.items.map((item) => item.id);
    expect(standVan(doelwit, standen(ids.slice(0, 9), 4), NU).rijp).toBe(false);
    expect(standVan(doelwit, standen(ids, 4), NU).rijp).toBe(true);
  });

  /** De andere drie worden gehaald met negen op de tien, dus rijp bij negen op de tien. */
  it('biedt de andere diploma’s aan op negen van de tien', () => {
    const doelwit = doelwitVan(deel('nl-provincies', 'topo', 12))!;
    const ids = doelwit.deel.items.map((item) => item.id);
    expect(standVan(doelwit, standen(ids.slice(0, 10), 4), NU).rijp).toBe(false);
    expect(standVan(doelwit, standen(ids.slice(0, 11), 4), NU).rijp).toBe(true);
  });

  it('rekent doos drie niet mee', () => {
    const doelwit = doelwitVan(deel('tafel-7', 'tafels', 10))!;
    const ids = doelwit.deel.items.map((item) => item.id);
    expect(standVan(doelwit, standen(ids, 3), NU).onthouden).toBe(0);
  });
});

describe('wat we voorstellen', () => {
  const alle = doelwitten(
    [deel('tafel-3', 'tafels', 10), deel('tafel-7', 'tafels', 10), deel('tafel-9', 'tafels', 10)],
    false,
  );

  it('zet het diploma dat het dichtst bij is bovenaan', () => {
    const states = new Map<string, ItemState>([
      ...standen(
        alle[1]!.deel.items.slice(0, 8).map((item) => item.id),
        4,
      ),
      ...standen(
        alle[2]!.deel.items.slice(0, 3).map((item) => item.id),
        4,
      ),
    ]);

    expect(suggesties(alle, new Set(), states, NU).map((s) => s.doelwit.id)).toEqual([
      'diploma-tafel-7',
      'diploma-tafel-9',
      'diploma-tafel-3',
    ]);
  });

  /** Een doel dat je al hebt is geen doel. */
  it('laat behaalde diploma’s weg', () => {
    const behaald = new Set(['diploma-tafel-3', 'diploma-tafel-7']);
    expect(suggesties(alle, behaald, new Map(), NU).map((s) => s.doelwit.id)).toEqual([
      'diploma-tafel-9',
    ]);
  });

  it('houdt de volgorde van de modules aan als er nog niets geoefend is', () => {
    expect(suggesties(alle, new Set(), new Map(), NU).map((s) => s.doelwit.id)).toEqual([
      'diploma-tafel-3',
      'diploma-tafel-7',
      'diploma-tafel-9',
    ]);
  });

  it('stelt er niet meer voor dan gevraagd', () => {
    expect(suggesties(alle, new Set(), new Map(), NU, 2)).toHaveLength(2);
  });
});

/**
 * De voorgestelde diploma's, met een groep (ADR-153). Zonder groep kreeg elk
 * kind dat nog niets deed de tafels van 1, 2 en 3 — ook in groep 8. De sets
 * hier zijn de echte diploma-sets, met de groepen uit de koppeltabel en de
 * leerdoelen.
 */
describe('welke doelen bij een groep passen', () => {
  const topo = (setId: string, leerdoel: string): Onderdeel => ({
    ...deel(setId, 'topo', 12),
    items: Array.from({ length: 12 }, (_, i) => ({ id: `${setId}-${i}`, leerdoelen: [leerdoel] })),
  });
  const onderdelen: readonly Onderdeel[] = [
    topo('nl-provincies', 'ak-nl-provincies-aanwijzen'),
    topo('nl-hoofdsteden', 'ak-nl-hoofdsteden-aanwijzen'),
    topo('europa-landen', 'ak-werelddelen-landen-aanwijzen'),
    ...Array.from({ length: 12 }, (_, i) => deel(`tafel-${i + 1}`, 'tafels', 10)),
    deel('klok-heel', 'klok', 12),
    deel('klok-half', 'klok', 12),
    deel('klok-kwart', 'klok', 24),
    deel('klok-vijf', 'klok', 96),
    deel('vlag-europa-alle', 'vlaggen', 46),
    deel('vlag-afrika-alle', 'vlaggen', 54),
  ];
  const met = doelwitten(onderdelen, true);
  const zonder = doelwitten(onderdelen, false);
  const voor = (alle: typeof met, groep?: 3 | 4 | 5 | 6 | 7 | 8) =>
    suggesties(alle, new Set(), new Map(), NU, 3, groep).map((s) => s.doelwit.deel.setId);

  it('is zonder groep precies wat het was', () => {
    expect(voor(zonder)).toEqual(['tafel-1', 'tafel-2', 'tafel-3']);
    expect(voor(met)).toEqual(voor(met, undefined));
  });

  it.each([
    [3, ['klok-heel', 'klok-half', 'tafel-1']],
    [4, ['tafel-2', 'klok-kwart', 'tafel-5']],
    [5, ['tafel-6', 'klok-vijf', 'tafel-7']],
    [6, ['vlag-europa-alle', 'nl-provincies', 'tafel-11']],
    [7, ['nl-hoofdsteden', 'vlag-afrika-alle', 'vlag-europa-alle']],
    [8, ['europa-landen', 'vlag-afrika-alle', 'nl-hoofdsteden']],
  ] as const)('stelt voor groep %s voor wat bij die groep past', (groep, verwacht) => {
    expect(voor(met, groep)).toEqual(verwacht);
  });

  it('stelt nooit de tafels van 1, 2 en 3 voor aan groep 5 of hoger', () => {
    for (const groep of [5, 6, 7, 8] as const) {
      for (const alle of [met, zonder]) {
        const lijst = voor(alle, groep);
        expect(lijst, `groep ${groep}`).not.toContain('tafel-1');
        expect(lijst, `groep ${groep}`).not.toContain('tafel-2');
      }
    }
  });

  it('herhaalt zonder code in de hoogste groepen de zwaarste tafels', () => {
    expect(voor(zonder, 8)).toEqual(['tafel-12', 'tafel-11', 'tafel-9']);
  });

  it('laat een diploma waar je al half bent voorgaan, ook met een groep', () => {
    const states = standen(['tafel-3-0', 'tafel-3-1', 'tafel-3-2', 'tafel-3-3', 'tafel-3-4'], 4);
    const lijst = suggesties(zonder, new Set(), states, NU, 3, 5).map((s) => s.doelwit.deel.setId);
    expect(lijst[0]).toBe('tafel-3');
  });
});

describe('welk diploma een ronde opleverde', () => {
  const leeg = {
    diploma: null,
    rekenDiploma: null,
    taalDiploma: null,
    vlagDiploma: null,
    klokDiploma: null,
    topoDiploma: null,
  } as const;

  it('rekent alle zes de gevallen terug naar een id', () => {
    expect(behaaldDiploma({ ...leeg, diploma: 7 })).toBe('diploma-tafel-7');
    expect(behaaldDiploma({ ...leeg, vlagDiploma: 'europa' })).toBe('diploma-vlag-europa');
    expect(behaaldDiploma({ ...leeg, klokDiploma: 'klok-half' })).toBe('diploma-klok-half');
    expect(behaaldDiploma({ ...leeg, topoDiploma: 'nl-provincies' })).toBe(
      'diploma-topo-nl-provincies',
    );
    expect(behaaldDiploma({ ...leeg, rekenDiploma: 'plus-20' })).toBe('diploma-plus-20');
    expect(behaaldDiploma({ ...leeg, taalDiploma: 'taal-sp-eiij' })).toBe('diploma-taal-sp-eiij');
  });

  it('geeft niets terug voor een gewone ronde', () => {
    expect(behaaldDiploma(leeg)).toBeNull();
    expect(behaaldDiploma(null)).toBeNull();
  });
});
