import { describe, expect, it } from 'vitest';
import { draaiboek, MAX_SCENE } from './draaiboek';

describe('de diploma-uitreiking', () => {
  it('past ruim in het scèneslot dat ADR-158 uitzonderde', () => {
    expect(draaiboek({ rustig: false }).totaal).toBeLessThanOrEqual(MAX_SCENE);
  });

  it('duurt 1620ms', () => {
    expect(draaiboek({ rustig: false }).totaal).toBe(1620);
  });

  it('klinkt precies één keer, en op het zegel', () => {
    const geluiden = draaiboek({ rustig: false }).beats.filter((beat) => beat.geluid);
    expect(geluiden).toHaveLength(1);
    expect(geluiden[0]?.id).toBe('ring');
  });

  it('eindigt op de knoppen: die komen op in dekking, niet in volgorde', () => {
    const beats = draaiboek({ rustig: false }).beats;
    expect(beats[beats.length - 1]?.id).toBe('knoppen');
  });
});

// De twee beweringen die het eerst rotten, en daarom de twee die vastliggen.
describe('rustig is dezelfde scène zonder beweging', () => {
  it('dezelfde beats, in dezelfde volgorde', () => {
    expect(draaiboek({ rustig: true }).beats.map((beat) => beat.id)).toEqual(
      draaiboek({ rustig: false }).beats.map((beat) => beat.id),
    );
  });

  it('dezelfde geluiden', () => {
    expect(draaiboek({ rustig: true }).beats.map((beat) => beat.geluid)).toEqual(
      draaiboek({ rustig: false }).beats.map((beat) => beat.geluid),
    );
  });

  it('en elke duur op nul, zodat de eerste frame de eindstand is', () => {
    const plan = draaiboek({ rustig: true });
    expect(plan.beats.every((beat) => beat.duur === 0)).toBe(true);
    expect(plan.totaal).toBe(0);
  });
});
