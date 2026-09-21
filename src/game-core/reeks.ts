import { dayKey } from './kalender';

/**
 * De reeks: dagen op rij met een afgemaakte ronde (ADR-158).
 *
 * **Alle dagen tellen mee, ook het weekend, en één gemiste dag breekt hem.** Dat
 * is een keuze van de eigenaar, en een strenge: ADR-149 schrapte de reeks juist
 * omdat hij op elke lege dag breekt terwijl een lege dag is wat spreiden nodig
 * heeft. Hij stond daarom alleen nog op Voor ouders: voor een ouder is
 * volhouden informatie, voor een kind is een reeks die breekt een straf. Sinds
 * die pagina weg is (ADR-171) staat hij nergens; de rekensom blijft, voor als
 * hij een plek krijgt die niet bij het kind is.
 *
 * **Niets hiervan wordt bewaard.** Het is af te leiden uit de afgemaakte rondes
 * (`dagenGeoefend`), en die gaan zo ver terug als het apparaat zelf. Twee
 * boekhoudingen over dezelfde dagen zouden het een keer oneens worden.
 *
 * Een reeks die vandaag nog niet geoefend heeft, is niet gebroken: hij breekt
 * vannacht. Daarom telt hij terug vanaf gisteren zolang vandaag leeg is.
 */

const DAG_MS = 86_400_000;

export interface Reeks {
  /** Dagen op rij, tot en met vandaag of tot en met gisteren. */
  readonly dagen: number;
  /** De langste reeks die dit kind ooit had, deze meegeteld. */
  readonly record: number;
  /** Er is vandaag al een ronde afgemaakt. */
  readonly vandaagTelt: boolean;
  /** Er loopt een reeks en vandaag is nog leeg: vannacht breekt hij. */
  readonly opHetSpel: boolean;
}

function verschoven(dag: string, dagen: number): string {
  const [jaar, maand, dagVanDeMaand] = dag.split('-').map(Number) as [number, number, number];
  return dayKey(new Date(jaar, maand - 1, dagVanDeMaand + dagen));
}

/** Hoe lang de reeks is die op `dag` eindigt. */
function terugtellen(geoefend: ReadonlySet<string>, dag: string): number {
  let aantal = 0;
  let kandidaat = dag;
  while (geoefend.has(kandidaat)) {
    aantal++;
    kandidaat = verschoven(kandidaat, -1);
  }
  return aantal;
}

/**
 * De langste reeks ooit.
 *
 * Elke dag waarvan de vorige dag leeg is, is het begin van een reeks; alleen daar
 * wordt geteld. Zo kost dit één doorloop van de dagen en niet één per dag.
 */
function langste(geoefend: ReadonlySet<string>): number {
  let record = 0;
  for (const dag of geoefend) {
    if (geoefend.has(verschoven(dag, -1))) continue;
    let lengte = 0;
    let kandidaat = dag;
    while (geoefend.has(kandidaat)) {
      lengte++;
      kandidaat = verschoven(kandidaat, 1);
    }
    record = Math.max(record, lengte);
  }
  return record;
}

export function reeksVan(geoefend: ReadonlySet<string>, now: Date): Reeks {
  const vandaag = dayKey(now);
  const gisteren = dayKey(new Date(now.getTime() - DAG_MS));
  const vandaagTelt = geoefend.has(vandaag);

  const dagen = vandaagTelt ? terugtellen(geoefend, vandaag) : terugtellen(geoefend, gisteren);

  return {
    dagen,
    record: Math.max(dagen, langste(geoefend)),
    vandaagTelt,
    opHetSpel: !vandaagTelt && dagen > 0,
  };
}
