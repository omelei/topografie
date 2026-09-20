import { describe, expect, it } from 'vitest';
import { doelwitten } from '@/features/home/doel';
import { onderdelen, startbareOnderdelen } from '@/features/module/onderdelen';

/**
 * De kast moet elk diploma kunnen tonen dat een kind kan halen, en dat is niet
 * vanzelfsprekend: er zijn twee lijsten met onderdelen, en de ene is korter dan
 * de andere.
 *
 * `onderdelen()` kent maar twee vlaggensets — de wereld en de provincies —
 * omdat de zes werelddelen pas door `loadVlagSets()` worden opgebouwd. Wie de
 * kast daarop bouwt, mist zes diploma's zonder dat er iets stukgaat: er staan
 * er dan zevenentwintig, en niemand telt ze.
 *
 * Deze toets is er omdat dat precies is wat er gebeurde.
 */
describe('welke diploma’s de kast kan tonen', () => {
  it('kent ze alle achtenzestig', () => {
    // Drieëndertig tot ADR-168; sindsdien heeft elk onderwerp dat een eigen set
    // is er een. Het getal staat hier hardop, zodat een set die stilletjes uit
    // de lijst valt niet onopgemerkt blijft.
    expect(doelwitten(startbareOnderdelen(), true)).toHaveLength(68);
  });

  it('per vak: twaalf tafels en twintig andere sommen, zeven vlaggensets, vier klokstappen, twaalf kaarten en dertien sets Taal', () => {
    const perVak = new Map<string, number>();
    for (const doelwit of doelwitten(startbareOnderdelen(), true)) {
      perVak.set(doelwit.deel.moduleId, (perVak.get(doelwit.deel.moduleId) ?? 0) + 1);
    }
    expect(Object.fromEntries(perVak)).toEqual({
      tafels: 32,
      vlaggen: 7,
      klok: 4,
      topo: 12,
      woorden: 13,
    });
  });

  it('en `onderdelen()` is daar de verkeerde bron voor', () => {
    // Niet een wens maar een waarschuwing: zolang dit verschil bestaat, moet
    // alles wat over álle diploma's gaat de startbare lijst gebruiken.
    expect(doelwitten(onderdelen(), true).length).toBeLessThan(
      doelwitten(startbareOnderdelen(), true).length,
    );
  });

  it('zonder code blijven de twaalf tafeldiploma’s over, en niets anders', () => {
    const gratis = doelwitten(startbareOnderdelen(), false);
    expect(gratis).toHaveLength(12);
    expect(gratis.every((doelwit) => doelwit.mode === 'tafeldiploma')).toBe(true);
  });

  it('elk diploma komt precies één keer voor', () => {
    const ids = doelwitten(startbareOnderdelen(), true).map((doelwit) => doelwit.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
