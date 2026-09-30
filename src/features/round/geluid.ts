/**
 * Twee tonen: één als het goed is, één als het niet goed is (ADR-134).
 *
 * **Gemaakt en niet meegeleverd.** Een geluidsbestand is een asset die kan
 * ontbreken, die de bundel groter maakt en die op een trage verbinding te laat
 * komt om nog feedback te zijn. Deze twee worden door de browser zelf gemaakt,
 * met een oscillator, en kosten nul bytes.
 *
 * **Fout klinkt niet als fout.** Twee korte tonen omhoog voor goed, één zachte
 * lage toon voor mis — geen zoemer, geen afkeuring. ADR-048 maakt het niet
 * weten overal goedkoop, en een geluid dat een kind laat schrikken zou dat in
 * één klap terugdraaien. De foute toon is ook zachter dan de goede.
 *
 * **Het start pas bij een aanraking.** Een AudioContext die voor de eerste
 * handeling van de gebruiker wordt gemaakt, wordt door elke browser opgeschort;
 * de eerste keer dat dit wordt aangeroepen is altijd een antwoord, en dat is een
 * handeling. Lukt het toch niet, dan gebeurt er niets: geluid is nooit de reden
 * dat een ronde vastloopt, dus staat alles hier achter een `try`.
 */

type Toon = { readonly hz: number; readonly na: number; readonly duur: number };

/**
 * Vijf geluiden om uit te kiezen, op Jij (ADR-247). Elk is dezelfde drie
 * dingen: goed, fout en een diploma, met dezelfde regels. Goed gaat omhoog,
 * fout is één lage, zachte toon, en een diploma begint hoog en landt.
 */
export const KLANKEN = ['belletje', 'xylofoon', 'fluitje', 'robot', 'druppel'] as const;
export type Klank = (typeof KLANKEN)[number];

interface Klankset {
  /** De vorm van de golf: sinus is zacht, driehoek houtig, blok elektronisch. */
  readonly golf: OscillatorType;
  /** Kort en klaar voordat je erop wacht. */
  readonly goed: readonly Toon[];
  /** Eén toon. Geen tweede, want herhaling maakt er een oordeel van. */
  readonly fout: readonly Toon[];
  /**
   * Het moment dat een eigen geluid krijgt: een diploma. Niet bij elk goed
   * antwoord — bij tachtig per week zou geluid ruis worden.
   */
  readonly diploma: readonly Toon[];
  /** Hoe hard ten opzichte van het belletje: een blokgolf klinkt veel luider. */
  readonly sterkte: number;
}

const KLANKSETS: Readonly<Record<Klank, Klankset>> = {
  // Het geluid van altijd (ADR-134): twee tonen omhoog, een kleine terts.
  belletje: {
    golf: 'sine',
    goed: [
      { hz: 660, na: 0, duur: 0.09 },
      { hz: 880, na: 0.08, duur: 0.12 },
    ],
    fout: [{ hz: 200, na: 0, duur: 0.16 }],
    diploma: [
      { hz: 880, na: 0, duur: 0.1 },
      { hz: 1320, na: 0.09, duur: 0.1 },
      { hz: 990, na: 0.2, duur: 0.2 },
    ],
    sterkte: 1,
  },
  xylofoon: {
    golf: 'triangle',
    goed: [
      { hz: 784, na: 0, duur: 0.08 },
      { hz: 1047, na: 0.07, duur: 0.08 },
      { hz: 1319, na: 0.14, duur: 0.12 },
    ],
    fout: [{ hz: 262, na: 0, duur: 0.14 }],
    diploma: [
      { hz: 1047, na: 0, duur: 0.08 },
      { hz: 1319, na: 0.08, duur: 0.08 },
      { hz: 1568, na: 0.16, duur: 0.08 },
      { hz: 2093, na: 0.24, duur: 0.2 },
    ],
    sterkte: 1.2,
  },
  fluitje: {
    golf: 'sine',
    goed: [
      { hz: 988, na: 0, duur: 0.07 },
      { hz: 1480, na: 0.06, duur: 0.14 },
    ],
    fout: [{ hz: 330, na: 0, duur: 0.18 }],
    diploma: [
      { hz: 1175, na: 0, duur: 0.12 },
      { hz: 1760, na: 0.1, duur: 0.12 },
      { hz: 1480, na: 0.22, duur: 0.24 },
    ],
    sterkte: 0.8,
  },
  robot: {
    golf: 'square',
    goed: [
      { hz: 440, na: 0, duur: 0.06 },
      { hz: 660, na: 0.07, duur: 0.08 },
    ],
    fout: [{ hz: 150, na: 0, duur: 0.14 }],
    diploma: [
      { hz: 523, na: 0, duur: 0.07 },
      { hz: 659, na: 0.08, duur: 0.07 },
      { hz: 784, na: 0.16, duur: 0.07 },
      { hz: 1047, na: 0.24, duur: 0.16 },
    ],
    sterkte: 0.35,
  },
  druppel: {
    golf: 'sine',
    goed: [
      { hz: 1200, na: 0, duur: 0.05 },
      { hz: 1800, na: 0.05, duur: 0.07 },
    ],
    fout: [{ hz: 420, na: 0, duur: 0.1 }],
    diploma: [
      { hz: 1400, na: 0, duur: 0.06 },
      { hz: 2100, na: 0.07, duur: 0.06 },
      { hz: 1600, na: 0.15, duur: 0.16 },
    ],
    sterkte: 1,
  },
};

/** Welk geluid dit kind koos. Gezet bij het opstarten en op Jij (`zetKlank`). */
let klank: Klank = 'belletje';

export function isKlank(waarde: unknown): waarde is Klank {
  return (KLANKEN as readonly unknown[]).includes(waarde);
}

/** Het geluid dat vanaf nu klinkt, bij elk antwoord en elk diploma. */
export function zetKlank(nieuw: Klank): void {
  klank = nieuw;
}

/** Hoe hard, op zijn hardst. Ver onder één: dit speelt naast een stem die voorleest. */
const VOLUME = { goed: 0.16, fout: 0.09 } as const;

let context: AudioContext | null = null;

function audio(): AudioContext | null {
  if (context !== null) return context;
  try {
    const Ctor =
      window.AudioContext ??
      (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
    return context;
  } catch {
    return null;
  }
}

/**
 * Speelt de toon die bij deze uitkomst hoort.
 *
 * Doet niets als er geen AudioContext is, als het geluid uitstaat, of als er
 * iets misgaat. Nooit een uitzondering naar buiten: dit hangt aan het nakijken
 * van een antwoord.
 */
export function speelUitkomst(goed: boolean, aan: boolean): void {
  const set = KLANKSETS[klank];
  speel(set, goed ? set.goed : set.fout, goed ? VOLUME.goed : VOLUME.fout, aan);
}

/** Speelt het geluid van een diploma. */
export function speelMoment(moment: 'diploma', aan: boolean): void {
  const set = KLANKSETS[klank];
  speel(set, set[moment], VOLUME.goed, aan);
}

/** Laat een geluid horen zoals het bij een goed antwoord klinkt: op Jij, bij het kiezen. */
export function speelProef(welk: Klank): void {
  const set = KLANKSETS[welk];
  speel(set, set.goed, VOLUME.goed, true);
}

function speel(set: Klankset, tonen: readonly Toon[], basis: number, aan: boolean): void {
  if (!aan) return;

  const ctx = audio();
  if (ctx === null) return;

  try {
    // Een context kan opgeschort zijn omdat de tab weg was; hervatten mag,
    // en of het lukt doet er niet toe — dan klinkt deze ene niet.
    void ctx.resume?.();

    const nu = ctx.currentTime;
    const volume = basis * set.sterkte;

    for (const toon of tonen) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = set.golf;
      osc.frequency.value = toon.hz;

      // In en uit gefaded, want een blokgolf die abrupt begint klikt.
      const start = nu + toon.na;
      const eind = start + toon.duur;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(volume, start + 0.015);
      gain.gain.linearRampToValueAtTime(0, eind);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(eind + 0.02);
    }
  } catch {
    // Geluid is nooit de reden dat een ronde vastloopt.
  }
}

/** Alleen voor de tests: de gedeelde context vergeten. */
export function vergeetContext(): void {
  context = null;
}
