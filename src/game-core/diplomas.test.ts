import { describe, expect, it } from 'vitest';
import {
  diplomaDrempel,
  kaartVanDiploma,
  klokDiplomaFor,
  klokVanDiploma,
  tableOfDiploma,
  topoDiplomaFor,
  topodiplomaVragen,
  werelddeelVanDiploma,
  type RewardSnapshot,
} from './rewards';

/**
 * The klokdiploma and the topodiploma (ADR-117): the vlaggendiploma's rule —
 * the whole round, nothing said until the end, nine in ten right — for one
 * step of the clock and for one map.
 */

function ronde(over: Partial<RewardSnapshot>): RewardSnapshot {
  return {
    setId: 'klok-half',
    perfectRound: false,
    completeRound: true,
    streakDays: 1,
    mastered: 0,
    setSize: 12,
    roundsFinished: 1,
    mode: 'klok-diploma',
    correct: 9,
    ...over,
  };
}

describe('the klokdiploma', () => {
  it('is earned with nine of ten faces of one step', () => {
    expect(klokDiplomaFor(ronde({}))).toBe('diploma-klok-half');
    expect(klokDiplomaFor(ronde({ correct: 10 }))).toBe('diploma-klok-half');
    expect(klokDiplomaFor(ronde({ correct: 8 }))).toBeNull();
  });

  it('needs the whole round, and is only sat as a diploma on one of the four steps', () => {
    expect(klokDiplomaFor(ronde({ completeRound: false }))).toBeNull();
    expect(klokDiplomaFor(ronde({ mode: 'klok-typen' }))).toBeNull();
    expect(klokDiplomaFor(ronde({ setId: 'klok-mix' }))).toBeNull();
    expect(klokDiplomaFor(ronde({ setId: 'klok-fouten' }))).toBeNull();
  });

  it('is stored under an id no other diploma reads as its own', () => {
    for (const set of ['klok-heel', 'klok-half', 'klok-kwart', 'klok-vijf']) {
      expect(klokVanDiploma(`diploma-${set}`)).toBe(set);
    }
    expect(klokVanDiploma('diploma-klok-mix')).toBeNull();
    expect(klokVanDiploma('diploma-tafel-7')).toBeNull();
    expect(tableOfDiploma('diploma-klok-half')).toBeNull();
    expect(werelddeelVanDiploma('diploma-klok-half')).toBeNull();
  });
});

describe('the topodiploma', () => {
  const topo = (over: Partial<RewardSnapshot>) =>
    ronde({ mode: 'topo-diploma', setId: 'nl-provincies', setSize: 12, correct: 11, ...over });

  it('asks twenty places, or the whole map where it has fewer', () => {
    expect(topodiplomaVragen(80)).toBe(20);
    expect(topodiplomaVragen(12)).toBe(12);
    expect(topodiplomaVragen(5)).toBe(5);
  });

  it('is earned with nine in ten, rounded up', () => {
    // Eleven of twelve provinces; eighteen of twenty cities; all five islands.
    expect(topoDiplomaFor(topo({}))).toBe('diploma-topo-nl-provincies');
    expect(topoDiplomaFor(topo({ correct: 10 }))).toBeNull();
    expect(topoDiplomaFor(topo({ setId: 'nl-steden', setSize: 80, correct: 18 }))).toBe(
      'diploma-topo-nl-steden',
    );
    expect(diplomaDrempel(5)).toBe(5);
    expect(topoDiplomaFor(topo({ setId: 'nl-waddeneilanden', setSize: 5, correct: 4 }))).toBeNull();
  });

  it('is sat on one map and not on the world, the Topomix or a list of mistakes', () => {
    expect(topoDiplomaFor(topo({ setId: 'europa-landen', setSize: 46, correct: 18 }))).toBe(
      'diploma-topo-europa-landen',
    );
    for (const setId of ['wereld-landen', 'nl-mix', 'nl-fouten']) {
      expect(topoDiplomaFor(topo({ setId, correct: 20 })), setId).toBeNull();
    }
    expect(topoDiplomaFor(topo({ mode: 'hoe-heet-dit' }))).toBeNull();
    expect(topoDiplomaFor(topo({ completeRound: false }))).toBeNull();
  });

  it('reads back which map a stored diploma is for', () => {
    expect(kaartVanDiploma('diploma-topo-oceanie-landen')).toBe('oceanie-landen');
    expect(kaartVanDiploma('diploma-topo-wereld-landen')).toBeNull();
    expect(kaartVanDiploma('diploma-klok-half')).toBeNull();
  });
});
