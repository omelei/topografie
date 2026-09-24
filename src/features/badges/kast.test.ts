import { describe, expect, it } from 'vitest';
import { doelwitten } from '@/features/home/doel';
import { nl } from '@/i18n/nl';
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
  it('kent ze alle negenenzeventig', () => {
    // Drieëndertig tot ADR-168; sindsdien heeft elk onderwerp dat een eigen set
    // is er een. Het getal staat hier hardop, zodat een set die stilletjes uit
    // de lijst valt niet onopgemerkt blijft.
    // Elf erbij met Engels (ADR-217).
    expect(doelwitten(startbareOnderdelen(), true)).toHaveLength(79);
  });

  it('per vak: twaalf tafels en twintig andere sommen, zeven vlaggensets, vier klokstappen, twaalf kaarten en vierentwintig sets Taal', () => {
    const perVak = new Map<string, number>();
    for (const doelwit of doelwitten(startbareOnderdelen(), true)) {
      perVak.set(doelwit.deel.moduleId, (perVak.get(doelwit.deel.moduleId) ?? 0) + 1);
    }
    expect(Object.fromEntries(perVak)).toEqual({
      tafels: 32,
      vlaggen: 7,
      klok: 4,
      topo: 12,
      woorden: 24,
    });
  });

  it('en `onderdelen()` is daar de verkeerde bron voor', () => {
    // Niet een wens maar een waarschuwing: zolang dit verschil bestaat, moet
    // alles wat over álle diploma's gaat de startbare lijst gebruiken.
    expect(doelwitten(onderdelen(), true).length).toBeLessThan(
      doelwitten(startbareOnderdelen(), true).length,
    );
  });

  it('zonder code is er geen enkel diploma te halen, ook niet de tafels (ADR-192)', () => {
    // Tot ADR-192 bleven de twaalf tafeldiploma's gratis (ADR-122). De eigenaar
    // zette alle diploma's achter premium; de ring bij elk diploma blijft wel
    // te zien, zodat een kind weet wat er te halen valt.
    expect(doelwitten(startbareOnderdelen(), false)).toEqual([]);
  });

  it('en alle vijf de vakken hebben diploma’s, met of zonder code om ze te halen', () => {
    const vakken = new Set(
      doelwitten(startbareOnderdelen(), true).map((doelwit) => doelwit.deel.moduleId),
    );
    expect([...vakken].sort()).toEqual(['klok', 'tafels', 'topo', 'vlaggen', 'woorden']);
  });

  it('en de premiumtabel noemt datzelfde aantal', () => {
    // `premium.regel.diplomas` staat een getal in de verkooptekst, en een getal
    // in copy verloopt stil (ADR-177). Deze toets bindt de zin aan de lijst,
    // zodat een set erbij of eraf de tabel meeneemt.
    const alles = doelwitten(startbareOnderdelen(), true).length;
    expect(nl['premium.regel.diplomas']).toContain(String(alles));
  });

  it('elk diploma komt precies één keer voor', () => {
    const ids = doelwitten(startbareOnderdelen(), true).map((doelwit) => doelwit.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
