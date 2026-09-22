import { dayKey, weekKey, type ItemState } from '@/game-core';
import { WEEK_DAGEN } from './schooldagen';
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

/**
 * Over alles wat dit kind ooit beantwoordde, in elk vak.
 *
 * **Zonder de voorspelling over drie weken** (ADR-177). Die stond hier als
 * `overDrieWeken` en werd op Jij de ring boven alles; waarom hij daar weg is,
 * staat bij `GeheugenKaart`. De som zelf bestaat nog — `setRetention` in
 * `game-core` — en wordt na een ronde gebruikt. Hier niet meer, en dan hoort
 * hij hier ook niet berekend te worden: een getal dat nergens getoond wordt,
 * is een getal dat niemand meer nakijkt.
 */
export type Geheugen = Stand;

export function geheugen(states: ReadonlyMap<string, ItemState>, now: Date): Geheugen {
  return tel(states.keys(), states, now).stand;
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

/** Eén dag in de strook onder "Hoe vaak oefen je?" (ADR-177). */
export interface DagTelling {
  /** `dayKey` van die dag: uniek, en de sleutel van de lijst. */
  readonly sleutel: string;
  /** "ma", "di" — wat er in het hokje staat. */
  readonly kort: string;
  /** "maandag 15 september" — wat een schermlezer hoort. */
  readonly voluit: string;
  readonly rondes: number;
  readonly vandaag: boolean;
}

/**
 * De laatste zeven dagen, oudste eerst en vandaag als laatste.
 *
 * **Rollend en niet maandag tot zondag**, want dat is wat de tegels erboven al
 * telden (`grens` in `HoeVaak`) en wat de zin eronder bedoelt. De kop zegt dat
 * sinds ADR-177 ook: er stond "Deze week" boven een venster dat op woensdag bij
 * vorige week donderdag begint.
 *
 * De namen komen uit `Intl` en niet uit `nl.ts`: het zijn zeven woorden die
 * niemand ooit anders zou willen schrijven, en de browser heeft ze al.
 */
export function perDag(
  rondes: readonly { readonly at: string }[],
  now: Date,
  dagen: number = WEEK_DAGEN,
): DagTelling[] {
  const telling = new Map<string, number>();
  for (const ronde of rondes) {
    const sleutel = dayKey(new Date(ronde.at));
    telling.set(sleutel, (telling.get(sleutel) ?? 0) + 1);
  }

  const kort = new Intl.DateTimeFormat('nl-NL', { weekday: 'short' });
  const voluit = new Intl.DateTimeFormat('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const vandaag = dayKey(now);

  return Array.from({ length: dagen }, (_, index) => {
    const dag = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (dagen - 1 - index));
    const sleutel = dayKey(dag);
    return {
      sleutel,
      // `short` geeft "ma." met een punt; die hoort niet in een hokje van twee
      // tekens.
      kort: kort.format(dag).replace('.', ''),
      voluit: voluit.format(dag),
      rondes: telling.get(sleutel) ?? 0,
      vandaag: sleutel === vandaag,
    };
  });
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
