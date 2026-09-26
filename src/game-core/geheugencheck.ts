import { dayKey } from './kalender';
import type { Schedulable } from './leitner';

/**
 * De geheugencheck: weet een kind nog wat het weken geleden leerde? (ADR-228)
 *
 * Eén keer per kind, zodra er genoeg is om het te meten: minstens 8 onderdelen
 * die 21 tot en met 60 dagen geleden voor het eerst geoefend zijn. Eerder is
 * het nog geen geheugen maar herhaling van vorige week; later is het te lang
 * geleden om iets over dit product te zeggen.
 *
 * **Per onderwerp, want een ronde is één onderwerp.** De 8 moeten samen in één
 * ronde passen. Een mix telt als één onderwerp, dus provincies en hoofdsteden
 * samen tellen mee via de mix van Nederland.
 *
 * Puur: er gaan onderwerpen, de dag waarop elk onderdeel voor het eerst
 * geoefend werd, en een moment in; er komt een onderwerp en een lijst uit.
 */

export const GEHEUGENCHECK_MIN = 8;
export const GEHEUGENCHECK_MAX = 10;
export const GEHEUGENCHECK_VAN_DAGEN = 21;
export const GEHEUGENCHECK_TOT_DAGEN = 60;

export interface CheckSet<T> {
  readonly set: T;
  readonly mix: boolean;
  readonly items: readonly Schedulable[];
}

export interface Geheugencheck<T> {
  readonly set: T;
  /** Wat de ronde vraagt: het langst geleden eerst, hooguit `GEHEUGENCHECK_MAX`. */
  readonly ids: readonly string[];
}

/** Hele kalenderdagen tussen twee momenten, in plaatselijke tijd. */
function dagenTussen(toen: Date, nu: Date): number {
  const a = new Date(`${dayKey(toen)}T12:00:00`);
  const b = new Date(`${dayKey(nu)}T12:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

export function geheugencheckVoor<T>(
  sets: readonly CheckSet<T>[],
  eersteKeer: ReadonlyMap<string, string>,
  now: Date,
): Geheugencheck<T> | null {
  let beste: { set: T; mix: boolean; ids: { id: string; toen: number }[] } | null = null;

  for (const { set, mix, items } of sets) {
    const ids: { id: string; toen: number }[] = [];
    for (const item of items) {
      const eerste = eersteKeer.get(item.id);
      if (eerste === undefined) continue;
      const toen = new Date(eerste);
      const dagen = dagenTussen(toen, now);
      if (dagen >= GEHEUGENCHECK_VAN_DAGEN && dagen <= GEHEUGENCHECK_TOT_DAGEN) {
        ids.push({ id: item.id, toen: toen.getTime() });
      }
    }
    // Meer is beter; bij gelijk een eigen onderwerp boven een mix.
    if (
      beste === null ||
      ids.length > beste.ids.length ||
      (ids.length === beste.ids.length && beste.mix && !mix)
    ) {
      beste = { set, mix, ids };
    }
  }

  if (beste === null || beste.ids.length < GEHEUGENCHECK_MIN) return null;
  return {
    set: beste.set,
    ids: beste.ids
      .sort((een, ander) => een.toen - ander.toen)
      .slice(0, GEHEUGENCHECK_MAX)
      .map((paar) => paar.id),
  };
}
