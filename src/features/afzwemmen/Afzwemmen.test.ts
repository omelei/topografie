import { describe, expect, it } from 'vitest';
import { eisenVan } from './Afzwemmen';

/**
 * Wat een diploma vraagt, per soort.
 *
 * Dit stond nergens vast. Afzwemmen was alleen indirect gedekt, door twee
 * e2e-regels die controleren dát het scherm er is — niet wat erop staat. Dat
 * was te billijken toen het diploma een bijzaak was; nu het het hele
 * beloningsprogramma is, is het dat niet meer.
 *
 * De getallen hieronder zijn de lat van ADR-064, ADR-104 en ADR-117, en ze
 * staan hier zodat een verschuiving opvalt voordat een kind ertegenaan loopt.
 */
describe('wat een diploma vraagt', () => {
  it('een tafel: tien sommen, en ze moeten allemaal goed', () => {
    expect(eisenVan('tafeldiploma', 10)).toEqual({ vragen: 10, drempel: 10 });
  });

  it('de tafel blijft tien vragen, hoe groot de set ook heet te zijn', () => {
    expect(eisenVan('tafeldiploma', 40)).toEqual({ vragen: 10, drempel: 10 });
  });

  it('vlaggen: hoogstens twintig, en negen op de tien goed', () => {
    expect(eisenVan('vlag-diploma', 46)).toEqual({ vragen: 20, drempel: 18 });
  });

  it('vlaggen van een klein werelddeel vraagt de hele set', () => {
    // Zuid-Amerika heeft er twaalf: elf goed is negen op de tien, afgerond.
    expect(eisenVan('vlag-diploma', 12)).toEqual({ vragen: 12, drempel: 11 });
  });

  it('de klok: hoogstens tien', () => {
    expect(eisenVan('klok-diploma', 96)).toEqual({ vragen: 10, drempel: 9 });
    expect(eisenVan('klok-diploma', 4)).toEqual({ vragen: 4, drempel: 4 });
  });

  it('topografie: twintig, en een kwart van een kaart die groter is', () => {
    // ADR-168: de wereldkaart heeft een diploma, en twintig van de
    // honderdzevenenzestig zou een loting zijn.
    expect(eisenVan('topo-diploma', 167)).toEqual({ vragen: 42, drempel: 38 });
    expect(eisenVan('topo-diploma', 46)).toEqual({ vragen: 20, drempel: 18 });
    expect(eisenVan('topo-diploma', 12)).toEqual({ vragen: 12, drempel: 11 });
  });

  it('vraagt nooit meer dan er in de set zit', () => {
    for (const grootte of [1, 3, 7, 12, 19, 20, 21, 46]) {
      for (const mode of ['vlag-diploma', 'klok-diploma', 'topo-diploma'] as const) {
        expect(eisenVan(mode, grootte).vragen).toBeLessThanOrEqual(grootte);
      }
    }
  });

  it('vraagt nooit meer goed dan er gevraagd wordt', () => {
    for (const grootte of [1, 4, 10, 12, 20, 46, 167]) {
      for (const mode of [
        'tafeldiploma',
        'vlag-diploma',
        'klok-diploma',
        'topo-diploma',
      ] as const) {
        const eisen = eisenVan(mode, grootte);
        expect(eisen.drempel).toBeLessThanOrEqual(eisen.vragen);
      }
    }
  });
});
