import { dayKey, weekKey } from './kalender';

/**
 * De weekkaart (ADR-149): dagen tellen, reeksen niet.
 *
 * Zeven vakjes van maandag tot en met zondag. Een dag met een afgemaakte ronde
 * krijgt een stempel, en een week waarin het doel gehaald is, een zegel in de
 * schooljaarstrook. Een gemiste dag haalt niets weg en een gemiste week ook
 * niet: maandag begint een nieuwe kaart. Dat is wat de dagreeks niet kon, die
 * op elke lege dag brak (ADR-148) en daarmee precies straft wat spreiden nodig
 * heeft: een dag rust.
 *
 * Het doel kiest een kind met een ouder, twee tot vijf dagen.
 */

export const WEEKDOEL_MIN = 2;
export const WEEKDOEL_MAX = 5;
export const WEEKDOEL_STANDAARD = 3;

/** Een opgeslagen weekdoel terug naar een geldig getal. */
export function weekdoelUit(waarde: unknown): number {
  const getal = typeof waarde === 'number' ? waarde : Number(waarde);
  if (!Number.isFinite(getal)) return WEEKDOEL_STANDAARD;
  return Math.min(WEEKDOEL_MAX, Math.max(WEEKDOEL_MIN, Math.round(getal)));
}

export interface WeekDag {
  /** YYYY-MM-DD. */
  readonly dag: string;
  /** 0 is maandag, 6 is zondag. */
  readonly index: number;
  readonly geoefend: boolean;
  readonly vandaag: boolean;
  readonly later: boolean;
}

export interface Weekkaart {
  /** ISO-week, YYYY-Www. */
  readonly week: string;
  readonly dagen: readonly WeekDag[];
  readonly aantal: number;
  readonly doel: number;
  readonly gehaald: boolean;
}

function maandagVan(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - ((date.getDay() + 6) % 7));
}

/** De kaart van de week waarin `now` valt. */
export function weekkaart(geoefend: ReadonlySet<string>, doel: number, now: Date): Weekkaart {
  const maandag = maandagVan(now);
  const vandaag = dayKey(now);
  const dagen = Array.from({ length: 7 }, (_, index) => {
    const dag = dayKey(new Date(maandag.getFullYear(), maandag.getMonth(), maandag.getDate() + index));
    return { dag, index, geoefend: geoefend.has(dag), vandaag: dag === vandaag, later: dag > vandaag };
  });
  const aantal = dagen.filter((d) => d.geoefend).length;
  const geldig = weekdoelUit(doel);
  return { week: weekKey(now), dagen, aantal, doel: geldig, gehaald: aantal >= geldig };
}

/**
 * De maandag waarmee het schooljaar van `now` begint: die van de week waarin
 * 1 september valt. Ligt `now` daarvoor, dan het jaar ervoor.
 */
export function schooljaarBegin(now: Date): Date {
  const ditJaar = maandagVan(new Date(now.getFullYear(), 8, 1));
  return now.getTime() >= ditJaar.getTime() ? ditJaar : maandagVan(new Date(now.getFullYear() - 1, 8, 1));
}

export interface JaarWeek {
  readonly week: string;
  /** YYYY-MM-DD van de maandag. */
  readonly maandag: string;
  readonly zegel: boolean;
  readonly nu: boolean;
}

/**
 * De schooljaarstrook: elke week van het schooljaar tot en met deze, met of
 * zonder zegel. Een lege plek is een lege plek, geen "gemist".
 */
export function jaarstrook(zegels: ReadonlySet<string>, now: Date): JaarWeek[] {
  const begin = schooljaarBegin(now);
  const deze = weekKey(now);
  const weken: JaarWeek[] = [];
  for (let i = 0; i < 60; i++) {
    const maandag = new Date(begin.getFullYear(), begin.getMonth(), begin.getDate() + i * 7);
    const week = weekKey(maandag);
    weken.push({ week, maandag: dayKey(maandag), zegel: zegels.has(week), nu: week === deze });
    if (week === deze) break;
  }
  return weken;
}

/**
 * De weken van dit schooljaar vóór deze waarin het doel gehaald werd, uit de
 * dagen met een ronde. Eén keer afgeleid als er nog geen zegels bewaard zijn;
 * daarna worden zegels alleen nog toegevoegd, zodat een hoger doel later geen
 * zegel meer afpakt.
 */
export function zegelsAfleiden(geoefend: ReadonlySet<string>, doel: number, now: Date): string[] {
  const perWeek = new Map<string, number>();
  const begin = dayKey(schooljaarBegin(now));
  for (const dag of geoefend) {
    if (dag < begin) continue;
    const [jaar, maand, dagNr] = dag.split('-').map(Number);
    const week = weekKey(new Date(jaar ?? 1970, (maand ?? 1) - 1, dagNr ?? 1));
    perWeek.set(week, (perWeek.get(week) ?? 0) + 1);
  }
  const deze = weekKey(now);
  const geldig = weekdoelUit(doel);
  return [...perWeek.entries()]
    .filter(([week, aantal]) => week !== deze && aantal >= geldig)
    .map(([week]) => week)
    .sort();
}
