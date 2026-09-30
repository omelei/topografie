import { describe, expect, it } from 'vitest';
import {
  DIPLOMA_WERELDDELEN,
  vlagDiplomaSet,
  diplomaWerelddeelVanSet,
  tableOfDiploma,
  vlagDiplomaFor,
  vlagdiplomaDrempel,
  vlagdiplomaVragen,
  vlagDiplomaDeelVan,
  werelddeelVanDiploma,
  type RewardSnapshot,
} from './index';

/**
 * The vlaggendiploma (ADR-104): twenty flags of one werelddeel — or all of
 * them where there are fewer — and nine in ten of them right.
 */

const ronde = (over: Partial<RewardSnapshot>): RewardSnapshot => ({
  setId: 'vlag-europa-alle',
  perfectRound: false,
  completeRound: true,
  setSize: 46,
  mode: 'vlag-diploma',
  correct: 18,
  ...over,
});

describe('how much a vlaggendiploma asks', () => {
  it('asks twenty, or every flag of a smaller werelddeel', () => {
    expect(vlagdiplomaVragen(46)).toBe(20);
    expect(vlagdiplomaVragen(14)).toBe(14);
    expect(vlagdiplomaVragen(12)).toBe(12);
  });

  it('wants nine in ten right: eighteen of twenty, eleven of twelve, thirteen of fourteen', () => {
    expect(vlagdiplomaDrempel(20)).toBe(18);
    expect(vlagdiplomaDrempel(12)).toBe(11);
    expect(vlagdiplomaDrempel(14)).toBe(13);
  });
});

describe('vlagDiplomaFor', () => {
  it('is earned with eighteen of twenty', () => {
    expect(vlagDiplomaFor(ronde({}))).toBe('diploma-vlag-europa');
    expect(vlagDiplomaFor(ronde({ correct: 20 }))).toBe('diploma-vlag-europa');
  });

  it('is not earned with seventeen', () => {
    expect(vlagDiplomaFor(ronde({ correct: 17 }))).toBeNull();
  });

  it('is not earned by a round stopped early, however well it went', () => {
    expect(vlagDiplomaFor(ronde({ completeRound: false, correct: 18 }))).toBeNull();
  });

  it('holds a smaller werelddeel to the same bar', () => {
    const zuidAmerika = { setId: 'vlag-zuid-amerika-alle', setSize: 12 };
    expect(vlagDiplomaFor(ronde({ ...zuidAmerika, correct: 11 }))).toBe(
      'diploma-vlag-zuid-amerika',
    );
    expect(vlagDiplomaFor(ronde({ ...zuidAmerika, correct: 10 }))).toBeNull();
  });

  it('is only sat on the whole of a werelddeel, and only as a diploma', () => {
    expect(vlagDiplomaFor(ronde({ setId: 'vlag-europa-bekend' }))).toBeNull();
    // De wereld wel, sinds ADR-247: twintig vlaggen van de hele wereld.
    expect(vlagDiplomaFor(ronde({ setId: 'vlag-wereld-alle' }))).toBe('diploma-vlag-wereld');
    expect(vlagDiplomaFor(ronde({ setId: 'vlag-wereld-mix' }))).toBeNull();
    expect(vlagDiplomaFor(ronde({ mode: 'vlag-gemengd' }))).toBeNull();
  });

  it('kent de provincievlaggen hun eigen diploma toe (ADR-168)', () => {
    // Het enige onderwerp onder Nederland, en daarmee de enige pagina in de
    // app waar niets te halen viel.
    const provincies = { setId: 'vlag-nederland-provincies', setSize: 12 };
    expect(vlagDiplomaFor(ronde({ ...provincies, correct: 11 }))).toBe('diploma-vlag-nederland');
    expect(vlagDiplomaFor(ronde({ ...provincies, correct: 10 }))).toBeNull();
    expect(vlagDiplomaSet('nederland')).toBe('vlag-nederland-provincies');
    expect(vlagDiplomaSet('europa')).toBe('vlag-europa-alle');
  });
});

describe('the stored diploma', () => {
  it('reads back as the werelddeel it was earned for, for all eight', () => {
    expect(DIPLOMA_WERELDDELEN).toHaveLength(8);
    for (const deel of DIPLOMA_WERELDDELEN) {
      expect(diplomaWerelddeelVanSet(vlagDiplomaSet(deel))).toBe(deel);
      expect(werelddeelVanDiploma(`diploma-vlag-${deel}`)).toBe(deel);
    }
  });

  it('is never mistaken for a tafeldiploma, or the other way round', () => {
    expect(tableOfDiploma('diploma-vlag-europa')).toBeNull();
    expect(werelddeelVanDiploma('diploma-tafel-7')).toBeNull();
    expect(werelddeelVanDiploma('diploma-vlag-wereld')).toBe('wereld');
  });
});

describe('the diploma a set of flags belongs to (ADR-247)', () => {
  it('is the diploma of its werelddeel, also for the known and the look-alike flags', () => {
    expect(vlagDiplomaDeelVan('vlag-europa-bekend')).toBe('europa');
    expect(vlagDiplomaDeelVan('vlag-azie-lijkt')).toBe('azie');
    expect(vlagDiplomaDeelVan('vlag-wereld-bekend')).toBe('wereld');
    expect(vlagDiplomaDeelVan('vlag-nederland-provincies')).toBe('nederland');
  });

  it('is none for a mix or a list of mistakes', () => {
    expect(vlagDiplomaDeelVan('vlag-wereld-mix')).toBeNull();
    expect(vlagDiplomaDeelVan('vlag-fouten')).toBeNull();
  });
});
