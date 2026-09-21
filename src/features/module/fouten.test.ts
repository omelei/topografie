import { describe, expect, it } from 'vitest';
import { emptyState, type ItemState } from '@/game-core';
import { loadItemSets } from '@/content/loadSets';
import { loadKlokSet } from '@/content/loadKlok';
import { loadSumSet } from '@/content/loadSums';
import { NL_SET_IDS, setsInRound } from '@/features/practice/useRound';
import { MODULES, type Module } from '@/features/shell/modules';
import { pathFor, routeFor } from '@/features/shell/routes';
import { formsFor, offeredForms, teDrukOmAanTeWijzen } from './forms';
import {
  fouteItems,
  MIN_FOUTEN,
  onderwerpenVan,
  startbareOnderdelen,
  type Onderdeel,
} from './onderdelen';

/**
 * "Je fouten" is een spelvorm en geen onderwerp (ADR-168).
 *
 * Het was er een, op elk vak: een tegel tussen Provincies en Steden die de
 * fouten van de hele kaart hield. Wat die tegel beweerde, was iets over wát je
 * oefent, en dat is het niet — het is welk deel van de gekozen set gevraagd
 * wordt. Deze toetsen leggen allebei de helften vast: de tegel is weg uit stap
 * 2, en de lijst die eronder zat is nog steeds uit te rekenen, nu per set.
 */

const fout = (ids: readonly string[]): Map<string, ItemState> =>
  new Map(
    ids.map((id) => [
      id,
      { ...emptyState(id), laatsteReview: '2026-09-01T00:00:00.000Z', foutCount: 1 },
    ]),
  );
const idsVan = (setId: string, aantal: number) =>
  (loadItemSets().find((set) => set.id === setId)?.items ?? []).slice(0, aantal).map((i) => i.id);
const module = (id: Module['id']) => MODULES.find((kandidaat) => kandidaat.id === id) as Module;

const setVan = (moduleId: Module['id'], setId: string): Onderdeel =>
  onderwerpenVan(moduleId)
    .flatMap((vak) => vak.sets)
    .find((deel) => deel.setId === setId) as Onderdeel;

describe('de fouten staan niet meer bij de onderwerpen', () => {
  it('biedt op geen enkel vak nog een onderwerp met fouten aan', () => {
    for (const moduleId of ['topo', 'tafels', 'klok', 'vlaggen', 'woorden'] as const) {
      const ids = onderwerpenVan(moduleId).map((vak) => vak.id);
      expect(
        ids.filter((id) => id === 'fouten' || id.endsWith('-fouten')),
        moduleId,
      ).toEqual([]);
    }
  });

  it('houdt de mix als laatste van zijn rij, nu er niets meer achter staat', () => {
    const nederland = onderwerpenVan('topo')
      .filter((vak) => vak.regio === 'nederland')
      .map((vak) => vak.id);
    expect(nederland.at(-1)).toBe('nl-mix');

    expect(
      onderwerpenVan('klok')
        .map((vak) => vak.id)
        .at(-1),
    ).toBe('klok-mix');
    expect(
      onderwerpenVan('tafels')
        .map((vak) => vak.id)
        .at(-1),
    ).toBe('rekenmix');
  });
});

describe('fouteItems telt wat er van deze set fout ging', () => {
  it('geeft precies de onderdelen met een fout terug', () => {
    const deel = setVan('topo', 'nl-provincies');
    const drie = idsVan('nl-provincies', 3);
    expect(fouteItems(deel, fout(drie))).toEqual(drie);
  });

  it('telt niets van een andere set mee', () => {
    const deel = setVan('topo', 'nl-provincies');
    expect(fouteItems(deel, fout(idsVan('nl-hoofdsteden', 5)))).toEqual([]);
  });

  it('blijft onder de lat bij minder dan drie fouten', () => {
    const deel = setVan('topo', 'nl-provincies');
    expect(fouteItems(deel, fout(idsVan('nl-provincies', 2))).length).toBeLessThan(MIN_FOUTEN);
    expect(fouteItems(deel, fout(idsVan('nl-provincies', 3))).length).toBe(MIN_FOUTEN);
  });

  it('werkt op elk vak, want het kijkt alleen naar foutCount', () => {
    const klok = (loadKlokSet('klok-heel')?.items ?? []).slice(0, 4).map((tijd) => tijd.id);
    expect(fouteItems(setVan('klok', 'klok-heel'), fout(klok))).toEqual(klok);

    const sommen = (loadSumSet('tafel-7')?.items ?? []).slice(0, 3).map((som) => som.id);
    expect(fouteItems(setVan('tafels', 'tafel-7'), fout(sommen))).toEqual(sommen);
  });
});

describe('de oude foutensets blijven bestaan waar ze nog werk doen', () => {
  it('asks a list on the map it spans', () => {
    expect(setsInRound('nl-fouten')).toEqual(NL_SET_IDS);
    expect(setsInRound('wereld-fouten')).toEqual(['wereld-landen']);
  });

  it('does not explore a list of mistakes, and leads with choosing where the map is crowded', () => {
    const vormen = offeredForms(formsFor('topo'), 'nl-fouten').map((form) => form.id);
    expect(vormen).not.toContain('ontdekken');

    expect(teDrukOmAanTeWijzen('wereld-fouten', 5, false)).toBe(true);
    expect(teDrukOmAanTeWijzen('zuid-amerika-fouten', 5, false)).toBe(false);
    expect(teDrukOmAanTeWijzen('nl-fouten', 5, true)).toBe(false);
  });

  it('gives each list an address', () => {
    expect(routeFor('/topografie/fouten')).toMatchObject({ setId: 'nl-fouten' });
    expect(routeFor('/topografie/europa-fouten')).toMatchObject({ setId: 'europa-fouten' });
    expect(routeFor('/klokkijken/fouten')).toMatchObject({ setId: 'klok-fouten' });
    expect(pathFor({ name: 'module', module: module('klok'), setId: 'klok-fouten' })).toBe(
      '/klokkijken/fouten',
    );
    expect(pathFor({ name: 'module', module: module('topo'), setId: 'nl-fouten' })).toBe(
      '/topografie/fouten',
    );
  });

  it('still opens each module\'s own mix at "mix"', () => {
    expect(routeFor('/topografie/mix')).toMatchObject({ setId: 'nl-mix' });
    expect(routeFor('/klokkijken/mix')).toMatchObject({ setId: 'klok-mix' });
  });

  it('places a round of mistakes in the history under its own name', () => {
    const ids = startbareOnderdelen().map((deel) => deel.setId);
    for (const id of ['nl-fouten', 'europa-fouten', 'wereld-fouten', 'klok-fouten']) {
      expect(ids).toContain(id);
    }
  });
});
