import { describe, expect, it } from 'vitest';
import { diagnose, duiding, stukVan, type DiagnoseRonde } from './afhaken';

function antwoord(correct: boolean, responseMs = 2000, tijdstip = '2026-09-01T10:00:00.000Z') {
  return { correct, responseMs, tijdstip };
}

function ronde(over: Partial<DiagnoseRonde> = {}): DiagnoseRonde {
  return {
    mode: 'meerkeuze',
    gevraagd: 15,
    gestart: '2026-09-01T10:00:00.000Z',
    antwoorden: Array.from({ length: 15 }, () => antwoord(true)),
    ...over,
  };
}

describe('waar een kind afhaakt', () => {
  it('telt niets als er niets gespeeld is', () => {
    const uit = diagnose([]);
    expect(uit.rondes).toBe(0);
    expect(uit.afbreekPercentage).toBeNull();
    expect(uit.stopBijVraag).toBeNull();
    expect(uit.oefendagen).toBe(0);
  });

  /**
   * De belangrijkste: een ronde zonder vast einde is nooit afgebroken. Een
   * bliksemronde duurt een minuut en een overlevingsronde drie levens, dus
   * negen antwoorden is daar het einde en niet het afhaken. Zou dit meetellen,
   * dan zou het afbreekpercentage vooral meten hoeveel van die rondes er
   * gespeeld zijn.
   */
  it('laat rondes zonder vast einde buiten de telling', () => {
    const uit = diagnose([
      ronde({ mode: 'bliksemronde', gevraagd: 0, antwoorden: [antwoord(true), antwoord(false)] }),
      ronde(),
    ]);
    expect(uit.rondes).toBe(1);
    expect(uit.afgemaakt).toBe(1);
    expect(uit.afgebroken).toBe(0);
  });

  it('laat een ronde waarin niemand iets antwoordde buiten de telling', () => {
    const uit = diagnose([ronde({ antwoorden: [] }), ronde()]);
    expect(uit.rondes).toBe(1);
  });

  it('scheidt afgemaakt van afgebroken', () => {
    const uit = diagnose([
      ronde(),
      ronde({ antwoorden: Array.from({ length: 4 }, () => antwoord(true)) }),
      ronde({ antwoorden: Array.from({ length: 6 }, () => antwoord(true)) }),
    ]);
    expect(uit.rondes).toBe(3);
    expect(uit.afgemaakt).toBe(1);
    expect(uit.afgebroken).toBe(2);
    expect(uit.afbreekPercentage).toBeCloseTo(66.67, 1);
    expect(uit.stopBijVraag).toBe(5);
  });

  /**
   * Het getal waar de hele diagnose om draait. Vier goed en dan drie fout, en
   * weg: dat is te moeilijk, niet te lang. Het moet dus zichtbaar hoger
   * uitkomen dan het foutpercentage over alles.
   */
  it('ziet dat het misging vlak voor het stoppen', () => {
    const uit = diagnose([
      ronde({
        antwoorden: [
          ...Array.from({ length: 4 }, () => antwoord(true)),
          antwoord(false),
          antwoord(false),
          antwoord(false),
        ],
      }),
    ]);
    expect(uit.foutVoorStop).toBe(1);
    expect(uit.foutAlgemeen).toBeCloseTo(3 / 7, 5);
  });

  /** De spiegel ervan: alles goed en tóch weg is een ronde die te lang is. */
  it('ziet dat het juist goed ging vlak voor het stoppen', () => {
    const uit = diagnose([ronde({ antwoorden: Array.from({ length: 6 }, () => antwoord(true)) })]);
    expect(uit.foutVoorStop).toBe(0);
  });

  /** Een afgemaakte ronde levert geen "vlak voor het stoppen" op: er is niet gestopt. */
  it('kijkt alleen naar het einde van afgebroken rondes', () => {
    const uit = diagnose([
      ronde({ antwoorden: Array.from({ length: 15 }, () => antwoord(false)) }),
    ]);
    expect(uit.foutAlgemeen).toBe(1);
    expect(uit.foutVoorStop).toBeNull();
    expect(uit.tempoVoorStop).toBeNull();
  });

  it('legt naast elkaar hoe snel er geantwoord werd', () => {
    const uit = diagnose([
      ronde({
        antwoorden: [
          antwoord(true, 1000),
          antwoord(true, 1000),
          antwoord(true, 9000),
          antwoord(true, 9000),
          antwoord(false, 9000),
        ],
      }),
    ]);
    expect(uit.tempoAlgemeen).toBe(9000);
    expect(uit.tempoVoorStop).toBe(9000);
  });

  it('verdeelt het stoppen over begin, midden en eind', () => {
    const uit = diagnose([
      ronde({ antwoorden: Array.from({ length: 2 }, () => antwoord(true)) }),
      ronde({ antwoorden: Array.from({ length: 7 }, () => antwoord(true)) }),
      ronde({ antwoorden: Array.from({ length: 13 }, () => antwoord(true)) }),
    ]);
    expect(uit.stopVerdeling).toEqual([1, 1, 1]);
    expect(uit.stopVerdeling.reduce((a, b) => a + b, 0)).toBe(uit.afgebroken);
  });

  it('meet de mediane lengte van wat wél werd afgemaakt', () => {
    const uit = diagnose([
      ronde({ gevraagd: 10, antwoorden: Array.from({ length: 10 }, () => antwoord(true)) }),
      ronde(),
    ]);
    expect(uit.lengteAfgemaakt).toBe(12.5);
  });

  it('telt oefendagen als dagen en niet als rondes', () => {
    const uit = diagnose([
      // Twee tijdstippen dicht bij elkaar, zodat dit dezelfde kalenderdag is
      // in elke tijdzone waarin de tests kunnen draaien.
      ronde({ gestart: '2026-09-01T10:00:00.000Z' }),
      ronde({ gestart: '2026-09-01T11:00:00.000Z' }),
      ronde({ gestart: '2026-09-04T10:00:00.000Z' }),
    ]);
    expect(uit.oefendagen).toBe(2);
    expect(uit.gatTussenDagen).toBe(3);
  });
});

describe('in welk stuk van de ronde er gestopt werd', () => {
  it('valt nooit buiten de stukken', () => {
    expect(stukVan(0, 15)).toBe(0);
    expect(stukVan(15, 15)).toBe(2);
    expect(stukVan(99, 15)).toBe(2);
    expect(stukVan(3, 0)).toBe(0);
  });
});

describe('welke verklaring de cijfers steunen', () => {
  function veel(maak: (i: number) => DiagnoseRonde, aantal = 12): DiagnoseRonde[] {
    return Array.from({ length: aantal }, (_, i) => maak(i));
  }

  it('trekt geen conclusie uit te weinig rondes', () => {
    expect(duiding(diagnose(veel(() => ronde(), 5)))).toBe('weinig');
  });

  it('zegt dat het goed gaat als er nauwelijks wordt afgebroken', () => {
    expect(duiding(diagnose(veel(() => ronde())))).toBe('gaatGoed');
  });

  it('wijst moeilijkheid aan als het vlak voor het stoppen misgaat', () => {
    const uit = diagnose(
      veel(() =>
        ronde({
          antwoorden: [
            ...Array.from({ length: 5 }, () => antwoord(true)),
            antwoord(false),
            antwoord(false),
            antwoord(false),
          ],
        }),
      ),
    );
    expect(duiding(uit)).toBe('teMoeilijk');
  });

  it('wijst lengte aan als het stoppen niet met fouten samenhangt', () => {
    const uit = diagnose(
      veel(() => ronde({ antwoorden: Array.from({ length: 8 }, () => antwoord(true)) })),
    );
    expect(duiding(uit)).toBe('teLang');
  });

  /** Meteen weer weg is geen afhaken in de ronde maar een app die net openging. */
  it('durft niets te zeggen als ze meteen aan het begin stoppen', () => {
    const uit = diagnose(veel(() => ronde({ antwoorden: [antwoord(true)] })));
    expect(duiding(uit)).toBe('onduidelijk');
  });
});
