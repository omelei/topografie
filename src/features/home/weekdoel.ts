import { dayKey } from '@/game-core';
import type { Weekdoel } from '@/store/weekdoelStore';

/**
 * Hoe ver deze week is, en hoe ver de doelen erin zijn (ADR-162).
 *
 * Puur, zoals `doel.ts` en `dagplan`: er gaan afgemaakte rondes, behaalde
 * diploma's en een moment in, er komen getallen uit. Wat er opgeslagen is, is
 * alleen de bedoeling (`store/weekdoelStore.ts`); de voortgang wordt hier
 * geteld uit wat er toch al staat, zodat er nooit twee lezingen van dezelfde
 * week kunnen ontstaan.
 *
 * **De week loopt van maandag tot en met zondag**, zoals de grafiek op
 * Onthouden en zoals een schoolkalender (`weekKey`). Niet "de laatste zeven
 * dagen": een doel voor deze week hoort op zondagavond af te zijn en op
 * maandagochtend weer op nul te staan, want dat is wat "deze week" betekent
 * tegen een kind.
 */

const DAG_MS = 86_400_000;

/** De maandag van de week waarin `now` valt, op middernacht plaatselijke tijd. */
export function maandagVan(now: Date): Date {
  const naarMaandag = (now.getDay() + 6) % 7;
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - naarMaandag);
}

/** De zondag van diezelfde week, op middernacht: de laatste dag die meetelt. */
export function zondagVan(now: Date): Date {
  const maandag = maandagVan(now);
  return new Date(maandag.getFullYear(), maandag.getMonth(), maandag.getDate() + 6);
}

/**
 * Hoeveel rondes er deze week zijn afgemaakt, en op hoeveel verschillende dagen.
 *
 * Dagen worden op de kalenderdag geteld en niet op de klok: twee rondes op
 * dinsdagavond en woensdagochtend zijn twee dagen, en om elf uur 's avonds nog
 * een ronde maakt er geen derde van.
 */
export function weekTelling(
  afgemaakt: readonly string[],
  now: Date,
): { readonly rondes: number; readonly dagen: number } {
  const vanaf = maandagVan(now).getTime();
  const tot = zondagVan(now).getTime() + DAG_MS;
  const dagen = new Set<string>();
  let rondes = 0;

  for (const stempel of afgemaakt) {
    const moment = new Date(stempel);
    const tijd = moment.getTime();
    if (Number.isNaN(tijd) || tijd < vanaf || tijd >= tot) continue;
    rondes += 1;
    dagen.add(dayKey(moment));
  }

  return { rondes, dagen: dagen.size };
}

export interface DoelStand {
  readonly doel: Weekdoel;
  /** Hoe ver het is: rondes, dagen, of 0 of 1 voor een diploma. */
  readonly gedaan: number;
  /** Wat ervoor nodig is. Bij een diploma altijd 1. */
  readonly nodig: number;
  readonly gehaald: boolean;
}

/**
 * Elk doel met hoe ver het is.
 *
 * Een diploma is geslaagd of niet geslaagd — daar bestaat geen "60%" van
 * (ADR-141) — dus het telt als nul of één, en de balk eronder is dan een balk
 * met twee standen. Dat is eerlijker dan hoeveel van de set al onthouden wordt,
 * want dat getal zegt niets over of het diploma deze week gehaald is.
 */
export function standen(
  doelen: readonly Weekdoel[],
  afgemaakt: readonly string[],
  behaald: ReadonlySet<string>,
  now: Date,
): readonly DoelStand[] {
  const week = weekTelling(afgemaakt, now);

  return doelen.map((doel) => {
    const gedaan =
      doel.soort === 'rondes'
        ? week.rondes
        : doel.soort === 'dagen'
          ? week.dagen
          : doel.diplomaId !== null && behaald.has(doel.diplomaId)
            ? 1
            : 0;
    const nodig = doel.soort === 'diploma' ? 1 : doel.aantal;
    return { doel, gedaan, nodig, gehaald: gedaan >= nodig };
  });
}

/**
 * "14 t/m 20 september", en over een maandgrens heen beide maanden: "29
 * september t/m 5 oktober".
 *
 * De datums staan erbij omdat een doel voor "deze week" anders geen einde
 * heeft: een kind dat op donderdag kijkt, hoort te kunnen zien hoeveel dagen
 * het nog heeft.
 */
export function weekZin(now: Date): string {
  const maandag = maandagVan(now);
  const zondag = zondagVan(now);
  const zelfdeMaand = maandag.getMonth() === zondag.getMonth();
  const dag = new Intl.DateTimeFormat('nl-NL', { day: 'numeric' });
  const dagMaand = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long' });
  const van = zelfdeMaand ? dag.format(maandag) : dagMaand.format(maandag);
  return `${van} t/m ${dagMaand.format(zondag)}`;
}
