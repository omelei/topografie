import { describe, expect, it } from 'vitest';
import type { ItemState } from '@/game-core';
import { formsFor, offeredForms, toetsVormVan } from '@/features/module/forms';
import {
  asTaalMode,
  onderdelen,
  onderwerpenVan,
  startbareOnderdelen,
} from '@/features/module/onderdelen';
import { regiosVan, TAAL_DELEN } from '@/features/module/regios';
import { MODULES, type Module } from '@/features/shell/modules';
import { pathFor, routeFor } from '@/features/shell/routes';
import { herhaalTaalVorm } from '@/features/round/herhaal';
import { loadTaalSet } from '@/content/loadTaal';
import { gespeld, spellingRegel } from './taalTaal';

/**
 * Taal as the fifth module of the family (ADR-118): the same page, its parts in
 * the row topography asks where on, and only what is decided for Taal
 * different.
 */

const taal = MODULES.find((module) => module.id === 'woorden') as Module;
const per = (deel: string, known?: ReadonlyMap<string, ItemState>) =>
  onderwerpenVan('woorden', known)
    .filter((vak) => vak.regio === deel)
    .map((vak) => vak.id);

describe('the page', () => {
  it('is built, at /taal, and asks which part in the region row', () => {
    expect(taal.built).toBe(true);
    expect(regiosVan('woorden')).toBe(TAAL_DELEN);
    expect(pathFor({ name: 'module', module: taal, setId: null })).toBe('/taal');
  });

  it('offers spelling in six tiles at most: four subjects and the mix', () => {
    expect(per('spelling')).toEqual([
      'onthoudwoorden',
      'd-of-t',
      'een-of-twee',
      'achter-aan',
      'spellingmix',
    ]);
  });

  it('asks which set under the subjects that hold more than one', () => {
    const vak = onderwerpenVan('woorden').find((kandidaat) => kandidaat.id === 'onthoudwoorden');
    expect(vak?.sets.map((deel) => deel.setId)).toEqual([
      'taal-sp-eiij',
      'taal-sp-auou',
      'taal-sp-gch',
      'taal-sp-ck',
    ]);
    expect(vak?.keuze).not.toBeNull();
    expect(vak?.sets.every((deel) => deel.kortNaam !== null)).toBe(true);
  });

  it('adds "Oefen je fouten" to a part once five of its items were wrong', () => {
    const fout = (id: string): [string, ItemState] => [
      id,
      {
        itemId: id,
        box: 1,
        laatsteReview: '2026-09-01T00:00:00.000Z',
        volgendeReview: '2026-09-02T00:00:00.000Z',
        goedCount: 0,
        foutCount: 1,
      },
    ];
    const ids = ['trein', 'klein', 'plein', 'geit', 'reis'].map((w) => `taal-sp-eiij-${w}`);
    expect(per('spelling', new Map(ids.map(fout)))).toContain('taal-sp-fouten');
    expect(per('spelling', new Map(ids.slice(0, 4).map(fout)))).not.toContain('taal-sp-fouten');
    expect(per('werkwoorden', new Map(ids.map(fout)))).not.toContain('taal-ww-fouten');
  });

  it('counts every spelling word once toward progress, and not the mix', () => {
    const ids = onderdelen()
      .filter((deel) => deel.moduleId === 'woorden')
      .flatMap((deel) => deel.items.map((item) => item.id));
    expect(ids.filter((id) => id.startsWith('taal-sp-'))).toHaveLength(330);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('the ways of practising', () => {
  const tegels = (deel: string, setId: string | null) =>
    offeredForms(formsFor('woorden', deel), setId).map((form) => form.id);

  it('follows the part before a subject is chosen', () => {
    // Every way of the part; the page leaves Ontdekken out until there is a
    // set, as it does for every way offered for some sets only (ADR-111).
    expect(formsFor('woorden', null)).toBe(formsFor('woorden', 'spelling'));
    expect(tegels('spelling', null)).toEqual([
      'taal-letters',
      'taal-flitsdictee',
      'ontdekken',
      'overleven',
    ]);
    expect(tegels('spelling', 'taal-sp-eiij')).toEqual([
      'taal-letters',
      'taal-flitsdictee',
      'ontdekken',
      'overleven',
    ]);
  });

  it('has an oefentoets that is the flitsdictee on spelling', () => {
    const forms = offeredForms(formsFor('woorden', 'spelling'), 'taal-sp-dt');
    expect(toetsVormVan('woorden', forms, 'spelling')?.id).toBe('taal-flitsdictee');
  });

  it('starts a stored way the set cannot use in the way its part chooses', () => {
    expect(asTaalMode('wijs-aan', 'taal-sp-eiij')).toBe('taal-letters');
    expect(asTaalMode('bliksemronde', 'taal-ww-tt')).toBe('taal-vorm-kiezen');
    expect(asTaalMode('taal-flitsdictee', 'taal-sp-eiij')).toBe('taal-flitsdictee');
  });

  it('repeats mistakes in the same way, and overleven by choosing', () => {
    expect(herhaalTaalVorm('taal-flitsdictee', 'spelling')).toBe('taal-flitsdictee');
    expect(herhaalTaalVorm('overleven', 'spelling')).toBe('taal-letters');
    expect(herhaalTaalVorm('overleven', 'werkwoorden')).toBe('taal-vorm-kiezen');
  });
});

describe('the addresses', () => {
  it('gives every set of Taal an address that opens on it', () => {
    for (const deel of startbareOnderdelen().filter((kandidaat) => kandidaat.moduleId === 'woorden')) {
      const route = { name: 'module', module: taal, setId: deel.setId } as const;
      expect(routeFor(pathFor(route)), deel.setId).toEqual(route);
    }
  });
});

describe('what a child hears and reads about a word', () => {
  it('spells a letter piece out, because "ei" and "ij" sound the same', () => {
    expect(gespeld('ei')).toBe('e, i');
    expect(gespeld('ij')).toBe('i, j');
    expect(gespeld('ch')).toBe('c, h');
  });

  it('applies the rule of the set to the word', () => {
    const hond = loadTaalSet('taal-sp-dt')?.items.find((item) => item.id === 'taal-sp-dt-hond');
    expect(hond && 'woord' in hond ? spellingRegel(hond) : null).toBe(
      'Maak het woord langer: honden. Je hoort een d, dus je schrijft een d.',
    );
    const bomen = loadTaalSet('taal-sp-klinkers')?.items.find(
      (item) => item.id === 'taal-sp-klinkers-bomen',
    );
    expect(bomen && 'woord' in bomen ? spellingRegel(bomen) : null).toContain('bo-men');
  });
});
