import { isDue, type Schedulable } from './leitner';
import type { ItemState } from './types';

/**
 * Wat er vandaag klaarstaat (ADR-126).
 *
 * De belofte van premium is dat het product het herhalen plant. Tot nu toe deed
 * het dat alleen binnen een ronde die een kind zelf koos: `composeRound` pakt
 * wat aan de beurt is uit de set waar je toevallig staat. Wat ontbrak is het
 * antwoord op de vraag die ervoor komt — **waar moet ik vandaag beginnen?**
 *
 * **Alleen herhalen, nooit nieuw.** Een onderdeel zonder Leitner-stand is niet
 * "aan de beurt", het is nog nooit gezien; `isDue` zegt over zo'n onderdeel wel
 * ja, want een lege stand is per definitie verlopen. Zou dit dat meetellen, dan
 * stond er op dag één 1025 sommen en 196 vlaggen klaar en betekende het niets.
 * Een plan gaat over wat je al een keer wist en weer dreigt te vergeten.
 *
 * **Per set, niet als één grote hoop.** Een ronde draait op één set (`App`),
 * en de ids van precies die onderdelen kunnen mee als `alleen`. Het plan is
 * daarom een lijstje rondes: vier sommen hier, acht provincies daar. Dat is ook
 * eerlijker tegen een kind dan één ronde van tweeëntwintig gemengde vragen.
 *
 * **Het meest verlopen eerst.** Wat het langst over tijd is, is het dichtst bij
 * vergeten, en dat is precies wat een plan hoort te redden.
 */

export interface PlanSet<T> {
  readonly sleutel: string;
  readonly set: T;
  readonly items: readonly Schedulable[];
}

export interface PlanRonde<T> {
  readonly set: T;
  /** De onderdelen die vandaag aan de beurt zijn, het langst verlopen eerst. */
  readonly ids: readonly string[];
  /** Hoeveel dagen het langst verlopen onderdeel al wacht. Nul voor "vandaag". */
  readonly wacht: number;
}

export interface Dagplan<T> {
  readonly rondes: readonly PlanRonde<T>[];
  /** Alles bij elkaar, ook wat buiten `rondes` viel. */
  readonly vragen: number;
}

const DAG_MS = 86_400_000;

/** Hoeveel rondes er hoogstens in een plan staan: meer is geen plan maar een lijst. */
export const PLAN_RONDES = 4;

/** Hoeveel vragen er hoogstens in één geplande ronde gaan. */
export const PLAN_RONDE_MAX = 15;

function verlopenDagen(state: ItemState, now: Date): number {
  if (state.volgendeReview === null) return 0;
  return Math.max(0, (now.getTime() - new Date(state.volgendeReview).getTime()) / DAG_MS);
}

/**
 * **De groep beslist pas daarna** (ADR-151). `voorrang` geeft een set een rang,
 * lager is eerder; hij telt alleen tussen rondes die even lang wachten. Wat
 * een dag langer wacht, gaat dus altijd voor, ook als het bij een andere groep
 * hoort: het onthouden gaat voor het voorstel. Zonder `voorrang` is het plan
 * precies wat het was.
 */
export function dagplan<T>(
  sets: readonly PlanSet<T>[],
  states: ReadonlyMap<string, ItemState>,
  now: Date,
  voorrang: (set: T) => number = () => 0,
): Dagplan<T> {
  const rondes: PlanRonde<T>[] = [];
  let vragen = 0;

  for (const { set, items } of sets) {
    const open = items
      .map((item) => ({ item, state: states.get(item.id) }))
      .filter(
        (paar): paar is { item: Schedulable; state: ItemState } =>
          paar.state !== undefined && isDue(paar.state, now),
      )
      .sort((een, ander) => verlopenDagen(ander.state, now) - verlopenDagen(een.state, now));

    if (open.length === 0) continue;

    vragen += open.length;
    const eerste = open[0];
    rondes.push({
      set,
      ids: open.slice(0, PLAN_RONDE_MAX).map((paar) => paar.item.id),
      wacht: eerste ? Math.floor(verlopenDagen(eerste.state, now)) : 0,
    });
  }

  rondes.sort(
    (een, ander) =>
      ander.wacht - een.wacht ||
      voorrang(een.set) - voorrang(ander.set) ||
      ander.ids.length - een.ids.length,
  );
  return { rondes: rondes.slice(0, PLAN_RONDES), vragen };
}
