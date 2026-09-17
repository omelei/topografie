/**
 * Diploma's.
 *
 * Spec §4.5 is unusually specific about what this may not be: no lootboxes, no
 * chance mechanics, no real money, nothing that can be bought rather than
 * earned. The audience is ten years old. Everything here is deterministic and
 * explainable: a child who asks "waarom kreeg ik dat?" gets a sentence.
 *
 * **Er stonden ook niveaus en badges, en die zijn weg (ADR-149).** Het album
 * beloont wat een kind onthoudt, plaatje voor plaatje, en een diploma is daar
 * het moment waarop een hele pagina rijp is. Tien losse badges naast die
 * pagina's waren een tweede verzameling over dezelfde leerstof, en vier ervan
 * beloonden iets anders dan onthouden: tempo, volume en een reeks.
 */

/** What the diploma rules get to look at. Nothing else is in scope. */
export interface RewardSnapshot {
  readonly setId: string;
  /** Every answer in the round just finished was right. */
  readonly perfectRound: boolean;
  /** The round covered the whole set, not a session stopped early. */
  readonly completeRound: boolean;
  /** How many items the set just practised has. */
  readonly setSize: number;
  /** Which mode was played. */
  readonly mode: string;
  /** Correct answers in the round. */
  readonly correct: number;
}

/** The four ways of sitting a diploma, one per module that has them. */
export const DIPLOMA_VORMEN: readonly string[] = [
  'tafeldiploma',
  'vlag-diploma',
  'klok-diploma',
  'topo-diploma',
];

export function isDiplomaVorm(mode: string): boolean {
  return DIPLOMA_VORMEN.includes(mode);
}

/**
 * The tafeldiploma: ten sums of one table, all of them right, in one attempt.
 *
 * Stored in `kindBadges`, the store the badges shared with it until ADR-149,
 * under an id of the shape `diploma-…`.
 */
export function diplomaFor(snapshot: RewardSnapshot): string | null {
  if (snapshot.mode !== 'tafeldiploma') return null;
  if (!/^tafel-\d+$/.test(snapshot.setId)) return null;
  if (!snapshot.perfectRound || !snapshot.completeRound) return null;
  return `diploma-${snapshot.setId}`;
}

/** Which table a stored diploma is for, or null if the row is not one. */
export function tableOfDiploma(id: string): number | null {
  const match = /^diploma-tafel-(\d+)$/.exec(id);
  if (!match) return null;
  const tafel = Number(match[1]);
  return tafel >= 1 && tafel <= 12 ? tafel : null;
}

// ---------------------------------------------------------------------------

/**
 * The werelddelen a vlaggendiploma is sat for (ADR-104). Six: the world is not
 * a werelddeel, and the provinces are home rather than a part of the world.
 */
export const DIPLOMA_WERELDDELEN = [
  'afrika',
  'azie',
  'europa',
  'noord-amerika',
  'zuid-amerika',
  'oceanie',
] as const;

export type DiplomaWerelddeel = (typeof DIPLOMA_WERELDDELEN)[number];

function alsDiplomaWerelddeel(deel: string | undefined): DiplomaWerelddeel | null {
  return (DIPLOMA_WERELDDELEN as readonly string[]).includes(deel ?? '')
    ? (deel as DiplomaWerelddeel)
    : null;
}

/**
 * The werelddeel a set is the whole of — `vlag-europa-alle` — which is the
 * only set a vlaggendiploma is sat on. A diploma for "bekende vlaggen" would be
 * a certificate for the easy half.
 */
export function diplomaWerelddeelVanSet(setId: string): DiplomaWerelddeel | null {
  return alsDiplomaWerelddeel(/^vlag-(.+)-alle$/.exec(setId)?.[1]);
}

/** Twenty questions, which is the vlaggendiploma. */
export const VLAGDIPLOMA_VRAGEN = 20;

/**
 * How many questions the diploma of a werelddeel with this many flags asks:
 * twenty, or every flag where there are fewer — Zuid-Amerika has twelve, and
 * asking one of them twice to make up the number would be testing memory of
 * the last two minutes.
 */
export function vlagdiplomaVragen(vlaggen: number): number {
  return Math.min(VLAGDIPLOMA_VRAGEN, vlaggen);
}

/**
 * How many of them must be right: nine in ten, rounded up. Eighteen of twenty,
 * which is what was asked for, and the same bar where there are fewer: eleven
 * of Zuid-Amerika's twelve, thirteen of Oceanië's fourteen. Whole numbers, so
 * the arithmetic has no floating point in it to argue with.
 *
 * The bar of every diploma that is passed with a mark — flags, the clock and
 * the map (ADR-117). The tafeldiploma is the one passed without a mistake.
 */
export function diplomaDrempel(vragen: number): number {
  return Math.ceil((vragen * 9) / 10);
}

/** The vlaggendiploma's name for the same bar, which is where it started. */
export function vlagdiplomaDrempel(vragen: number): number {
  return diplomaDrempel(vragen);
}

/**
 * The vlaggendiploma: the whole round answered, and nine in ten of it right.
 *
 * Not "one mistake and you sit it again", which is the tafeldiploma. A table
 * is ten facts a child recites in order; twenty flags from fifty-four is a
 * test, and a Dutch test is passed with a mark rather than with perfection.
 */
export function vlagDiplomaFor(snapshot: RewardSnapshot): string | null {
  if (snapshot.mode !== 'vlag-diploma') return null;
  const deel = diplomaWerelddeelVanSet(snapshot.setId);
  if (deel === null || !snapshot.completeRound) return null;
  if (snapshot.correct < vlagdiplomaDrempel(vlagdiplomaVragen(snapshot.setSize))) return null;
  return `diploma-vlag-${deel}`;
}

/** Which werelddeel a stored vlaggendiploma is for, or null if the row is not one. */
export function werelddeelVanDiploma(id: string): DiplomaWerelddeel | null {
  return alsDiplomaWerelddeel(/^diploma-vlag-(.+)$/.exec(id)?.[1]);
}

// ---------------------------------------------------------------------------

/**
 * The klokdiploma (ADR-117): one per step of the clock, in the order a
 * classroom teaches them. Not the mix, which is every step at once, and not a
 * child's own mistakes.
 */
export const KLOK_DIPLOMA_SETS = ['klok-heel', 'klok-half', 'klok-kwart', 'klok-vijf'] as const;

export type KlokDiplomaSet = (typeof KLOK_DIPLOMA_SETS)[number];

function alsKlokDiplomaSet(setId: string | undefined): KlokDiplomaSet | null {
  return (KLOK_DIPLOMA_SETS as readonly string[]).includes(setId ?? '')
    ? (setId as KlokDiplomaSet)
    : null;
}

/** Ten faces, which is a round of the clock and so its diploma. */
export const KLOKDIPLOMA_VRAGEN = 10;

/**
 * The klokdiploma: ten faces of one step, the time typed without help, nothing
 * said until the end, and nine of the ten right — the vlaggendiploma's bar,
 * because reading a face is a test passed with a mark, not a table recited.
 */
export function klokDiplomaFor(snapshot: RewardSnapshot): string | null {
  if (snapshot.mode !== 'klok-diploma') return null;
  const set = alsKlokDiplomaSet(snapshot.setId);
  if (set === null || !snapshot.completeRound) return null;
  const vragen = Math.min(KLOKDIPLOMA_VRAGEN, snapshot.setSize);
  if (snapshot.correct < diplomaDrempel(vragen)) return null;
  return `diploma-${set}`;
}

/** Which step a stored klokdiploma is for, or null if the row is not one. */
export function klokVanDiploma(id: string): KlokDiplomaSet | null {
  return alsKlokDiplomaSet(/^diploma-(klok-.+)$/.exec(id)?.[1]);
}

/**
 * The topodiploma (ADR-117): one per map a child is asked to know. The five
 * Dutch maps and the six werelddelen — not the world, where twenty countries
 * of a hundred and sixty-seven is a lottery rather than a test, not the
 * Topomix, and not a list of mistakes.
 */
export const TOPO_DIPLOMA_SETS = [
  'nl-provincies',
  'nl-hoofdsteden',
  'nl-steden',
  'nl-wateren',
  'nl-waddeneilanden',
  'europa-landen',
  'afrika-landen',
  'azie-landen',
  'noord-amerika-landen',
  'zuid-amerika-landen',
  'oceanie-landen',
] as const;

export type TopoDiplomaSet = (typeof TOPO_DIPLOMA_SETS)[number];

export function alsTopoDiplomaSet(setId: string | undefined): TopoDiplomaSet | null {
  return (TOPO_DIPLOMA_SETS as readonly string[]).includes(setId ?? '')
    ? (setId as TopoDiplomaSet)
    : null;
}

/** Twenty places, or the whole map where it has fewer: the vlaggendiploma's rule. */
export const TOPODIPLOMA_VRAGEN = 20;

export function topodiplomaVragen(plekken: number): number {
  return Math.min(TOPODIPLOMA_VRAGEN, plekken);
}

/**
 * The topodiploma: the whole round answered by typing the name, nothing said
 * until the end, and nine in ten right. Oceanië's nine countries need all nine
 * and the five islands all five, because nine in ten of a small number rounds
 * up to all of it — the same arithmetic the flags use.
 */
export function topoDiplomaFor(snapshot: RewardSnapshot): string | null {
  if (snapshot.mode !== 'topo-diploma') return null;
  const set = alsTopoDiplomaSet(snapshot.setId);
  if (set === null || !snapshot.completeRound) return null;
  if (snapshot.correct < diplomaDrempel(topodiplomaVragen(snapshot.setSize))) return null;
  return `diploma-topo-${set}`;
}

/** Which map a stored topodiploma is for, or null if the row is not one. */
export function kaartVanDiploma(id: string): TopoDiplomaSet | null {
  return alsTopoDiplomaSet(/^diploma-topo-(.+)$/.exec(id)?.[1]);
}
