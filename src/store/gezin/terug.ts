import type { LeitnerBox, ModeId } from '@/game-core';
import type {
  AttemptRecord,
  ChildBadgeRecord,
  ChildItemState,
  SessionRecord,
  SettingRecord,
} from '../db';
import {
  GEDEELDE_INSTELLINGEN,
  type DiplomaRij,
  type InstellingRij,
  type PogingRij,
  type SessieRij,
  type VoortgangRij,
} from './rijen';

/**
 * De andere kant op: een rij van de server wordt weer een rij op dit apparaat
 * (ADR-189).
 *
 * `rijen.ts` is de heenweg en dit de terugweg, met dezelfde ene vertaling:
 * snake_case wordt camelCase, en de id van het kind op de server wordt de
 * lokale id waar het hier onder staat (`Eigenaar.lokaalId`, ADR-175).
 *
 * Wat de server teruggeeft, wordt niet geloofd omdat het van ons komt: een rij
 * zonder de velden die hier nodig zijn, wordt overgeslagen in plaats van half
 * weggeschreven. Een kapotte rij op de server mag geen kapotte doos op het
 * apparaat worden.
 */

function tekst(waarde: unknown): string | null {
  return typeof waarde === 'string' ? waarde : null;
}

function getal(waarde: unknown): number | null {
  return typeof waarde === 'number' && Number.isFinite(waarde) ? waarde : null;
}

function isDoos(waarde: unknown): waarde is LeitnerBox {
  return waarde === 1 || waarde === 2 || waarde === 3 || waarde === 4 || waarde === 5;
}

/** Postgres geeft een `timestamptz` terug als `2026-09-22T10:00:00+00:00`; hier is het `…Z`. */
function moment(waarde: unknown): string | null {
  const ruw = tekst(waarde);
  if (ruw === null) return null;
  const tijd = new Date(ruw);
  return Number.isNaN(tijd.getTime()) ? null : tijd.toISOString();
}

export function doosTerug(rij: Partial<VoortgangRij>, lokaalId: string): ChildItemState | null {
  const itemId = tekst(rij.item_id);
  const goed = getal(rij.goed_count);
  const fout = getal(rij.fout_count);
  if (itemId === null || !isDoos(rij.box) || goed === null || fout === null) return null;
  return {
    kindId: lokaalId,
    itemId,
    box: rij.box,
    laatsteReview: moment(rij.laatste_review),
    volgendeReview: moment(rij.volgende_review),
    goedCount: goed,
    foutCount: fout,
    ...(isDoos(rij.hoogste_doos) ? { hoogsteDoos: rij.hoogste_doos } : {}),
  };
}

export function sessieTerug(rij: Partial<SessieRij>, lokaalId: string): SessionRecord | null {
  const id = tekst(rij.id);
  const mode = tekst(rij.mode);
  const gestart = moment(rij.gestart);
  const geeindigd = moment(rij.geeindigd);
  // Alleen afgeronde rondes staan op de server (ADR-187); een rij zonder einde
  // hoort hier dus niet, en zou op dit apparaat een ronde lijken die nog loopt.
  if (id === null || mode === null || gestart === null || geeindigd === null) return null;
  const setId = tekst(rij.set_id);
  const beantwoord = getal(rij.beantwoord);
  return {
    id,
    kindId: lokaalId,
    mode: mode as ModeId,
    ...(setId === null ? {} : { setId }),
    itemSet: rij.item_set ?? [],
    score: getal(rij.score),
    ...(beantwoord === null ? {} : { beantwoord }),
    gestart,
    geeindigd,
  };
}

export function pogingTerug(rij: Partial<PogingRij>, lokaalId: string): AttemptRecord | null {
  const id = tekst(rij.id);
  const sessionId = tekst(rij.sessie_id);
  const itemId = tekst(rij.item_id);
  const mode = tekst(rij.mode);
  const responseMs = getal(rij.response_ms);
  const tijdstip = moment(rij.tijdstip);
  if (
    id === null ||
    sessionId === null ||
    itemId === null ||
    mode === null ||
    typeof rij.correct !== 'boolean' ||
    responseMs === null ||
    tijdstip === null
  ) {
    return null;
  }
  return {
    id,
    sessionId,
    kindId: lokaalId,
    itemId,
    mode: mode as ModeId,
    correct: rij.correct,
    responseMs,
    gekozenAntwoord: tekst(rij.gekozen_antwoord),
    tijdstip,
  };
}

export function diplomaTerug(rij: Partial<DiplomaRij>, lokaalId: string): ChildBadgeRecord | null {
  const badgeId = tekst(rij.badge_id);
  const behaaldOp = moment(rij.behaald_op);
  if (badgeId === null || behaaldOp === null) return null;
  return { kindId: lokaalId, badgeId, behaaldOp };
}

/** Een instelling heet op de server `weekdoel` bij een kind, en hier `weekdoel:<lokaalId>`. */
export function instellingTerug(
  rij: Partial<InstellingRij>,
  lokaalId: string,
): SettingRecord | null {
  const sleutel = tekst(rij.sleutel);
  const waarde = tekst(rij.waarde);
  const gewijzigdOp = moment(rij.gewijzigd_op);
  if (sleutel === null || waarde === null || gewijzigdOp === null) return null;
  if (!GEDEELDE_INSTELLINGEN.includes(sleutel)) return null;
  return { key: `${sleutel}:${lokaalId}`, value: waarde, gewijzigdOp };
}
