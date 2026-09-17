import {
  dagenGeoefend,
  jaarstrook,
  weekdoelUit,
  weekkaart,
  zegelsAfleiden,
  type JaarWeek,
  type Weekkaart,
} from '@/game-core';
import { activeChildId } from './children';
import { loadPlayedRounds } from './progress';
import { getSetting, setSetting } from './settings';

/**
 * De weekkaart per kind (ADR-149), in `settings` zoals het doel en de dagstand.
 *
 * Twee dingen worden bewaard, en de dagen zelf niet: die staan al in de rondes
 * (`dagenGeoefend`). Het **weekdoel**, twee tot vijf dagen, standaard drie. En de
 * **zegels**, de weken waarin het doel gehaald werd. Die worden alleen
 * toegevoegd: een ouder die het doel later verhoogt, pakt geen zegel af die
 * eerder verdiend werd. De eerste keer worden ze afgeleid uit de rondes van dit
 * schooljaar, zodat een kind dat al oefende niet met een lege strook begint.
 */

const doelSleutel = (kindId: string) => `weekdoel:${kindId}`;
const zegelSleutel = (kindId: string) => `zegels:${kindId}`;
const WEEK = /^\d{4}-W\d{2}$/;

export async function leesWeekdoel(): Promise<number> {
  return weekdoelUit(await getSetting(doelSleutel(await activeChildId())));
}

export async function schrijfWeekdoel(doel: number): Promise<void> {
  await setSetting(doelSleutel(await activeChildId()), String(weekdoelUit(doel)));
}

function zegelsUit(ruw: string | undefined): string[] | null {
  if (ruw === undefined) return null;
  try {
    const waarde: unknown = JSON.parse(ruw);
    if (!Array.isArray(waarde)) return null;
    return waarde.filter((week): week is string => typeof week === 'string' && WEEK.test(week));
  } catch {
    return null;
  }
}

export interface WeekStand {
  readonly kaart: Weekkaart;
  readonly strook: readonly JaarWeek[];
  /** Alle dagen met een afgemaakte ronde, YYYY-MM-DD. */
  readonly geoefend: ReadonlySet<string>;
}

/**
 * De kaart van deze week en de strook van dit schooljaar.
 *
 * Werkt de zegels meteen bij: is het doel deze week gehaald, dan krijgt deze
 * week haar zegel en blijft die staan, ook als het doel daarna omhoog gaat.
 */
export async function leesWeek(now: Date = new Date()): Promise<WeekStand> {
  const kindId = await activeChildId();
  const [doel, ruw, rondes] = await Promise.all([
    leesWeekdoel(),
    getSetting(zegelSleutel(kindId)),
    loadPlayedRounds(),
  ]);
  const geoefend = dagenGeoefend(rondes.map((ronde) => ronde.at));
  const kaart = weekkaart(geoefend, doel, now);

  const bewaard = zegelsUit(ruw);
  const zegels = new Set(bewaard ?? zegelsAfleiden(geoefend, doel, now));
  const erbij = kaart.gehaald && !zegels.has(kaart.week);
  if (erbij) zegels.add(kaart.week);
  if (bewaard === null || erbij) {
    await setSetting(zegelSleutel(kindId), JSON.stringify([...zegels].sort()));
  }

  return { kaart, strook: jaarstrook(zegels, now), geoefend };
}
