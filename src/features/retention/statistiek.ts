import { setRetention, weekKey, type ItemState } from '@/game-core';
import { statusOf } from './itemStatus';

/**
 * De getallen van de Onthouden-pagina, gelezen in plaats van geteld (ADR-148).
 *
 * Puur: wat erin gaat zijn de standen van de Leitner-dozen en de antwoorden
 * zoals ze op het apparaat staan, wat eruit komt zijn getallen. Elke status komt
 * uit `statusOf`, dezelfde functie die de tabel en de stippen gebruiken, zodat
 * de kaart bovenaan en de tabel onderaan nooit twee verhalen vertellen.
 */

/** Hoe een groep onderdelen ervoor staat, zonder wat nog nooit geoefend is. */
export interface Stand {
  readonly onthouden: number;
  readonly opfrissen: number;
  readonly oefenen: number;
}

/** Alles wat minstens één keer beantwoord is. */
export function geoefend(stand: Stand): number {
  return stand.onthouden + stand.opfrissen + stand.oefenen;
}

function tel(ids: Iterable<string>, states: ReadonlyMap<string, ItemState>, now: Date) {
  const stand = { onthouden: 0, opfrissen: 0, oefenen: 0 };
  const gezien: string[] = [];
  for (const id of ids) {
    const status = statusOf(states.get(id), now);
    if (status === 'new') continue;
    gezien.push(id);
    if (status === 'remembered') stand.onthouden += 1;
    else if (status === 'refresh') stand.opfrissen += 1;
    else stand.oefenen += 1;
  }
  return { stand, gezien };
}

/** De horizon van elke voorspelling in het product: drie weken. */
const DRIE_WEKEN_MS = 21 * 86_400_000;

export interface Geheugen extends Stand {
  /**
   * Wat er over drie weken naar verwachting nog van over is, over alles wat
   * geoefend is, 0-100. Null zolang er niets geoefend is: een voorspelling over
   * niets is geen nul procent.
   */
  readonly overDrieWeken: number | null;
}

/** Over alles wat dit kind ooit beantwoordde, in elk vak. */
export function geheugen(states: ReadonlyMap<string, ItemState>, now: Date): Geheugen {
  const { stand, gezien } = tel(states.keys(), states, now);
  return {
    ...stand,
    overDrieWeken:
      gezien.length === 0
        ? null
        : setRetention(states, gezien, new Date(now.getTime() + DRIE_WEKEN_MS)),
  };
}

export interface VakStand<M extends string> extends Stand {
  readonly moduleId: M;
  /** Hoeveel verschillende onderdelen het vak heeft, geoefend of niet. */
  readonly totaal: number;
}

/**
 * Per vak, in de volgorde waarin de sets binnenkomen.
 *
 * Een onderdeel dat in twee sets staat — een hoofdstad in de provincies en in
 * de steden, een tafelsom in twee rijtjes — telt één keer: het is één ding om
 * te onthouden.
 */
export function perVak<M extends string>(
  sets: readonly { readonly moduleId: M; readonly items: readonly { readonly id: string }[] }[],
  states: ReadonlyMap<string, ItemState>,
  now: Date,
): VakStand<M>[] {
  const perModule = new Map<M, Set<string>>();
  for (const set of sets) {
    const ids = perModule.get(set.moduleId) ?? new Set<string>();
    for (const item of set.items) ids.add(item.id);
    perModule.set(set.moduleId, ids);
  }

  return [...perModule].map(([moduleId, ids]) => ({
    moduleId,
    totaal: ids.size,
    ...tel(ids, states, now).stand,
  }));
}

/** Eén antwoord, zoals het op het apparaat staat. */
export interface Antwoord {
  readonly tijdstip: string;
  readonly correct: boolean;
}

export interface WeekTelling {
  /** Het weeknummer, zoals een schoolkalender het noemt. */
  readonly nummer: number;
  readonly goed: number;
  readonly fout: number;
  /** De week waarin `now` valt. */
  readonly deze: boolean;
}

/**
 * De laatste `weken` weken, van maandag tot zondag en deze week als laatste,
 * met de antwoorden die erin vielen. Een week zonder antwoorden staat er ook:
 * een grafiek die lege weken overslaat, liegt over het tempo.
 */
export function perWeek(antwoorden: readonly Antwoord[], now: Date, weken: number): WeekTelling[] {
  const telling = new Map<string, { goed: number; fout: number }>();
  for (const antwoord of antwoorden) {
    const sleutel = weekKey(new Date(antwoord.tijdstip));
    const week = telling.get(sleutel) ?? { goed: 0, fout: 0 };
    if (antwoord.correct) week.goed += 1;
    else week.fout += 1;
    telling.set(sleutel, week);
  }

  const naarMaandag = (now.getDay() + 6) % 7;
  return Array.from({ length: weken }, (_, index) => {
    const terug = weken - 1 - index;
    const maandag = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - naarMaandag - terug * 7,
    );
    const sleutel = weekKey(maandag);
    const week = telling.get(sleutel) ?? { goed: 0, fout: 0 };
    return { nummer: Number(sleutel.slice(-2)), ...week, deze: terug === 0 };
  });
}

/** Het deel van alle antwoorden dat goed was, als heel percentage; null zonder antwoorden. */
export function procentGoedVan(antwoorden: readonly Antwoord[]): number | null {
  if (antwoorden.length === 0) return null;
  const goed = antwoorden.filter((antwoord) => antwoord.correct).length;
  return Math.round((goed / antwoorden.length) * 100);
}
