import { isSchoolDay, type HolidayPeriod, type ItemState } from '@/game-core';

/**
 * De week, gelezen in plaats van geteld (ADR-133).
 *
 * "Jij" had al vier tegels over deze week: rondes, dagen, vragen, cijfer. Dat
 * zijn feiten, en een ouder die ze leest moet ze zelf duiden — terwijl juist de
 * duiding is wat hij koopt. De vraag achter het abonnement is niet "hoeveel
 * rondes", het is **"gaat het goed, en moet ik iets doen?"**
 *
 * Drie dingen beantwoorden dat, in die volgorde:
 *
 * - **Is er geoefend?** Tegen schooldagen afgezet en niet tegen zeven dagen: een
 *   weekend is geen dag waarop een kind iets naliet (dezelfde regel als de
 *   reeks, `streak.ts`).
 * - **Blijft het hangen?** Het enige getal dat dit product kent en de andere
 *   niet.
 * - **Wat wankelt?** Eén set, met een naam, die het langst over tijd is. Een
 *   advies dat een ouder kan uitspreken tegen zijn kind — "doe de tafel van 7
 *   even" — is meer waard dan een lijst.
 *
 * Puur, en generiek in de set zoals `dagplan` dat is: wat er in gaat zijn sets
 * met hun onderdelen, wat eruit komt zijn getallen en hoogstens één set.
 */

export interface WeekSet<T> {
  readonly set: T;
  /** Hoeveel onderdelen ervan over tijd zijn. */
  readonly aantal: number;
  /** Hoeveel hele dagen het langst wachtende onderdeel al wacht. */
  readonly wacht: number;
}

export interface Weekbericht<T> {
  /** Schooldagen in de afgelopen zeven, vakanties er al af. */
  readonly schooldagen: number;
  /** Daarvan de dagen waarop een ronde is afgemaakt. */
  readonly geoefend: number;
  readonly rondes: number;
  /** Wat dit kind nu naar verwachting nog weet, over alles wat het ooit oefende. */
  readonly onthouden: number | null;
  /** De set die het langst over tijd is, of null als er niets wacht. */
  readonly wankelt: WeekSet<T> | null;
}

export interface BerichtSet<T> {
  readonly set: T;
  readonly items: readonly { readonly id: string }[];
}

const DAG_MS = 86_400_000;
/** Hoeveel dagen een week is, hier en in het blok met de vier tegels. */
export const WEEK_DAGEN = 7;

/** Hoeveel hele dagen dit onderdeel al over tijd is, of null als het niet wacht. */
function wachtDagen(state: ItemState | undefined, now: Date): number | null {
  if (!state || state.volgendeReview === null) return null;
  const over = (now.getTime() - new Date(state.volgendeReview).getTime()) / DAG_MS;
  return over <= 0 ? null : over;
}

export function weekbericht<T>(params: {
  /** De momenten waarop een ronde is afgemaakt, als ISO-tijdstippen. */
  readonly afgemaakt: readonly string[];
  readonly sets: readonly BerichtSet<T>[];
  readonly states: ReadonlyMap<string, ItemState>;
  /** Wat dit kind over al zijn geoefende onderdelen nog weet, 0-100. */
  readonly onthouden: number | null;
  readonly now: Date;
  readonly vakanties?: readonly HolidayPeriod[];
}): Weekbericht<T> {
  const { afgemaakt, sets, states, onthouden, now } = params;
  const vakanties = params.vakanties ?? [];

  let schooldagen = 0;
  const dagen = new Set<string>();
  for (let terug = 0; terug < WEEK_DAGEN; terug++) {
    const dag = new Date(now.getFullYear(), now.getMonth(), now.getDate() - terug);
    if (isSchoolDay(dag, vakanties)) {
      schooldagen++;
      dagen.add(sleutel(dag));
    }
  }

  // Alleen rondes binnen het venster tellen, en een dag telt één keer: vier
  // rondes op dinsdag zijn één dinsdag.
  const grens = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (WEEK_DAGEN - 1));
  const binnen = afgemaakt.filter((moment) => new Date(moment) >= grens);
  const geoefendeDagen = new Set(binnen.map((moment) => sleutel(new Date(moment))));

  let wankelt: WeekSet<T> | null = null;
  for (const { set, items } of sets) {
    let aantal = 0;
    let wacht = 0;
    for (const item of items) {
      const over = wachtDagen(states.get(item.id), now);
      if (over === null) continue;
      aantal++;
      wacht = Math.max(wacht, over);
    }
    // Het langst wachtende wint, want dat is het dichtst bij vergeten. Bij
    // gelijke spelen de meeste onderdelen mee als tweede maatstaf.
    if (aantal === 0) continue;
    if (
      wankelt === null ||
      wacht > wankelt.wacht ||
      (wacht === wankelt.wacht && aantal > wankelt.aantal)
    ) {
      wankelt = { set, aantal, wacht: Math.floor(wacht) };
    }
  }

  return {
    schooldagen,
    // Ook een zaterdag telt als er geoefend is: werk doen wordt altijd beloond,
    // het nalaten ervan alleen op een schooldag geteld (`streak.ts`).
    geoefend: geoefendeDagen.size,
    rondes: binnen.length,
    onthouden,
    wankelt,
  };
}

function sleutel(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}
