import { activeChildId } from './children';

/**
 * Wat een kind wilde doen en niet kon, en waar het klaar voor was (ADR-193).
 *
 * Een kind drukt op een slot, of haalt de lat voor een diploma zonder code. Dat
 * zijn de twee momenten waarop een ouder het meest heeft aan premium, en tot nu
 * toe wist de ouder daar niets van: de ouderpagina zei alleen dat er een slot
 * op "Hoe gaat het?" zat. Hier wordt het onthouden, per kind, zodat de ouder op
 * de ouderpagina leest "Fem is klaar voor de toets van Tafel van 7" in plaats
 * van een algemene zin over premium.
 *
 * **Alleen op dit apparaat.** Het staat in localStorage en gaat nergens heen.
 * Het doorgestuurde bericht naar een ouder noemt het bewust niet (ADR-174): dat
 * reist via WhatsApp of andermans mail. De ouderpagina staat achter de pincode
 * en is van de ouder zelf.
 *
 * **Kort.** Per kind hooguit drie van elk, uit de laatste dertig dagen, het
 * nieuwste eerst. Wat een kind in september wilde, zegt in november niets meer.
 */

export type WensSoort = 'wil' | 'klaar';

export interface Wens {
  /** Wat het was, zoals een mens het leest: "Bliksemronde bij Provincies". */
  readonly wat: string;
  readonly soort: WensSoort;
}

interface Bewaard extends Wens {
  readonly kind: string;
  /** Wanneer, als ISO-moment. */
  readonly op: string;
}

export const WENSEN_SLEUTEL = 'leernu.wensen';
const MAX_BEWAARD = 30;
const PER_SOORT = 3;
const DAGEN = 30;
const DAG_MS = 86_400_000;

function lees(): Bewaard[] {
  try {
    const ruw = window.localStorage.getItem(WENSEN_SLEUTEL);
    const lijst: unknown = ruw === null ? [] : JSON.parse(ruw);
    if (!Array.isArray(lijst)) return [];
    return lijst.filter(
      (wens): wens is Bewaard =>
        typeof wens === 'object' &&
        wens !== null &&
        typeof (wens as Bewaard).kind === 'string' &&
        typeof (wens as Bewaard).wat === 'string' &&
        typeof (wens as Bewaard).op === 'string' &&
        ((wens as Bewaard).soort === 'wil' || (wens as Bewaard).soort === 'klaar'),
    );
  } catch {
    return [];
  }
}

/** Een wens van dit kind erbij, vooraan; dezelfde wens schuift naar voren. */
export function voegWensToe(kind: string, wens: Wens, now: Date = new Date()): void {
  const lijst = lees().filter(
    (bekend) => !(bekend.kind === kind && bekend.wat === wens.wat && bekend.soort === wens.soort),
  );
  lijst.unshift({ kind, wat: wens.wat, soort: wens.soort, op: now.toISOString() });
  try {
    window.localStorage.setItem(WENSEN_SLEUTEL, JSON.stringify(lijst.slice(0, MAX_BEWAARD)));
  } catch {
    // Een browser die niets bewaart, onthoudt ook dit niet; de vraag aan de
    // ouders werkt er gewoon zonder.
  }
}

/** Alles van dit kind weg, als het van het apparaat gaat (ADR-198). */
export function vergeetWensenVan(kind: string): void {
  try {
    window.localStorage.setItem(
      WENSEN_SLEUTEL,
      JSON.stringify(lees().filter((wens) => wens.kind !== kind)),
    );
  } catch {
    // Niets bewaard, dan valt er ook niets weg te halen.
  }
}

/** Voor het kind dat nu oefent. */
export async function onthoudWens(wens: Wens, now: Date = new Date()): Promise<void> {
  voegWensToe(await activeChildId(), wens, now);
}

/** Wat dit kind wilde en waar het klaar voor was, het nieuwste eerst. */
export function wensenVan(
  kind: string,
  now: Date = new Date(),
): { readonly klaar: readonly string[]; readonly wil: readonly string[] } {
  const grens = now.getTime() - DAGEN * DAG_MS;
  const recent = lees().filter(
    (wens) => wens.kind === kind && new Date(wens.op).getTime() >= grens,
  );
  const van = (soort: WensSoort) =>
    recent
      .filter((wens) => wens.soort === soort)
      .slice(0, PER_SOORT)
      .map((wens) => wens.wat);
  return { klaar: van('klaar'), wil: van('wil') };
}
