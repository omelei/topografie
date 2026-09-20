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

/** Twee tonen omhoog, een kleine terts: kort en klaar voordat je erop wacht. */
const GOED: readonly Toon[] = [
  { hz: 660, na: 0, duur: 0.09 },
  { hz: 880, na: 0.08, duur: 0.12 },
];

/**
 * Het moment dat een eigen geluid krijgt: een diploma. Drie tonen, en niet bij
 * elk goed antwoord — bij tachtig per week zou geluid ruis worden. Het begint
 * hoog en landt.
 *
 * Hier stond er een tweede naast, voor een albumpagina die helemaal in kleur
 * kwam. Het album is met ADR-158 opgeheven, dus die toon klonk nergens meer.
 */
const MOMENT = {
  diploma: [
    { hz: 880, na: 0, duur: 0.1 },
    { hz: 1320, na: 0.09, duur: 0.1 },
    { hz: 990, na: 0.2, duur: 0.2 },
  ],
} as const satisfies Record<string, readonly Toon[]>;

/** Eén lage, zachte toon. Geen tweede, want herhaling maakt er een oordeel van. */
const FOUT: readonly Toon[] = [{ hz: 200, na: 0, duur: 0.16 }];

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
  speel(goed ? GOED : FOUT, goed ? VOLUME.goed : VOLUME.fout, aan);
}

/** Speelt het geluid van een pagina in kleur of een diploma. */
export function speelMoment(moment: keyof typeof MOMENT, aan: boolean): void {
  speel(MOMENT[moment], VOLUME.goed, aan);
}

function speel(tonen: readonly Toon[], volume: number, aan: boolean): void {
  if (!aan) return;

  const ctx = audio();
  if (ctx === null) return;

  try {
    // Een context kan opgeschort zijn omdat de tab weg was; hervatten mag,
    // en of het lukt doet er niet toe — dan klinkt deze ene niet.
    void ctx.resume?.();

    const nu = ctx.currentTime;

    for (const toon of tonen) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
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
