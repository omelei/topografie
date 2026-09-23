import type { ChildBadgeRecord, ChildItemState, SettingRecord } from '../db';

/**
 * Wie er wint als een rij van de server en een rij op dit apparaat botsen
 * (ADR-155, ADR-189).
 *
 * Dezelfde regels als de triggers in `0003_samenvoegen.sql`, want het is
 * dezelfde vraag, de andere kant op: de database beslist als een apparaat
 * stuurt, en dit beslist als een apparaat ophaalt. Twee plekken, en daarom
 * dezelfde toetsen in `samenvoegen.test.ts` als in `supabase/tests/gezin.sql`.
 * Wie een regel hier verandert, verandert hem daar ook.
 *
 * Puur: wat er in de winkel komt te staan, niet het schrijven zelf.
 */

function max(a: number | undefined, b: number | undefined): number | undefined {
  if (a === undefined) return b;
  if (b === undefined) return a;
  return Math.max(a, b);
}

/**
 * Per item wint de jongste `laatsteReview`, met doos en volgende keer. Bij een
 * gelijke tijd wint de lagere doos. Tellers en hoogste doos worden het maximum.
 */
export function samenDoos(hier: ChildItemState | undefined, daar: ChildItemState): ChildItemState {
  if (hier === undefined) return daar;

  const hierWint =
    hier.laatsteReview !== null &&
    (daar.laatsteReview === null ||
      hier.laatsteReview > daar.laatsteReview ||
      (hier.laatsteReview === daar.laatsteReview && hier.box < daar.box));
  const winnaar = hierWint ? hier : daar;
  const hoogste = max(hier.hoogsteDoos, daar.hoogsteDoos) as ChildItemState['hoogsteDoos'];

  return {
    kindId: hier.kindId,
    itemId: hier.itemId,
    box: winnaar.box,
    laatsteReview: winnaar.laatsteReview,
    volgendeReview: winnaar.volgendeReview,
    goedCount: Math.max(hier.goedCount, daar.goedCount),
    foutCount: Math.max(hier.foutCount, daar.foutCount),
    ...(hoogste === undefined ? {} : { hoogsteDoos: hoogste }),
  };
}

/** Een diploma houdt de dag waarop het voor het eerst gehaald werd. */
export function samenDiploma(
  hier: ChildBadgeRecord | undefined,
  daar: ChildBadgeRecord,
): ChildBadgeRecord {
  if (hier === undefined) return daar;
  return hier.behaaldOp <= daar.behaaldOp ? hier : daar;
}

/**
 * Van een instelling wint de jongste schrijver. Een rij hier zonder moment is
 * van vóór ADR-175, en dus ouder dan alles wat er een heeft.
 */
export function samenInstelling(
  hier: SettingRecord | undefined,
  daar: SettingRecord,
): SettingRecord {
  if (hier === undefined) return daar;
  if (hier.gewijzigdOp === undefined) return daar;
  if (daar.gewijzigdOp === undefined) return hier;
  return hier.gewijzigdOp > daar.gewijzigdOp ? hier : daar;
}
