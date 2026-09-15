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
 * Het tiende goede antwoord: dezelfde twee tonen, en er komt er één achteraan.
 *
 * **Geen eigen geluid.** Een ster valt op hetzelfde moment als het antwoord dat
 * hem vol maakte, en twee geluiden binnen vierhonderd milliseconden zijn geen
 * twee gebeurtenissen maar één rommelige. Dus klinkt het antwoord zoals het
 * altijd klinkt en gaat het één trede verder — een octaaf boven de eerste toon,
 * dus het hoort als hetzelfde en toch als meer.
 */
const STER: readonly Toon[] = [...GOED, { hz: 1320, na: 0.19, duur: 0.16 }];

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
 * `ster` maakt van de twee tonen er drie: het tiende goede antwoord klinkt als
 * de negen ervoor en gaat dan één trede verder. Alleen op een goed antwoord —
 * een ster kan niet uit een misser komen.
 *
 * Doet niets als er geen AudioContext is, als het geluid uitstaat, of als er
 * iets misgaat. Nooit een uitzondering naar buiten: dit hangt aan het nakijken
 * van een antwoord.
 */
export function speelUitkomst(goed: boolean, aan: boolean, ster = false): void {
  if (!aan) return;

  const ctx = audio();
  if (ctx === null) return;

  try {
    // Een context kan opgeschort zijn omdat de tab weg was; hervatten mag,
    // en of het lukt doet er niet toe — dan klinkt deze ene niet.
    void ctx.resume?.();

    const nu = ctx.currentTime;
    const volume = goed ? VOLUME.goed : VOLUME.fout;

    for (const toon of goed ? (ster ? STER : GOED) : FOUT) {
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
