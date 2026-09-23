import {
  getDb,
  SINGLETON_KEY,
  type AttemptRecord,
  type ChildBadgeRecord,
  type ChildItemState,
  type SessionRecord,
  type SettingRecord,
} from '../db';
import {
  diplomaRij,
  instellingRij,
  isAfgerond,
  pogingRij,
  sessieRij,
  voortgangRij,
  type DiplomaRij,
  type Eigenaar,
  type InstellingRij,
  type PogingRij,
  type SessieRij,
  type VoortgangRij,
} from './rijen';

/**
 * Alles van één kind wat naar het account mag, als rijen (ADR-187).
 *
 * `rijen.ts` zegt wat één rij wordt; dit zegt welke rijen van wie zijn, en in
 * welke volgorde ze moeten. Puur (`pakketVan`) en daarnaast één lezer die de
 * winkels van dit apparaat erin giet (`leesPakket`), zodat wat er vertrekt te
 * toetsen is zonder browser.
 */
export interface Pakket {
  readonly sessies: readonly SessieRij[];
  readonly pogingen: readonly PogingRij[];
  readonly voortgang: readonly VoortgangRij[];
  readonly diplomas: readonly DiplomaRij[];
  readonly instellingen: readonly InstellingRij[];
}

export interface Bron {
  readonly progress: readonly ChildItemState[];
  readonly sessions: readonly SessionRecord[];
  readonly attempts: readonly AttemptRecord[];
  readonly kindBadges: readonly ChildBadgeRecord[];
  readonly settings: readonly SettingRecord[];
}

/**
 * Van wie een ronde of een antwoord is. Rijen van vóór ADR-046 dragen geen
 * `kindId`, en zijn van het eerste kind, dat `me` heet.
 */
function van(rij: { readonly kindId?: string }): string {
  return rij.kindId ?? SINGLETON_KEY;
}

export function pakketVan(bron: Bron, eigenaar: Eigenaar, nu: Date): Pakket {
  const lokaal = eigenaar.lokaalId;

  const sessies = bron.sessions
    .filter((sessie) => van(sessie) === lokaal && isAfgerond(sessie))
    .map((sessie) => sessieRij(sessie, eigenaar));

  // Een poging hangt aan een sessie (`pogingen.sessie_id`). Hoort zijn sessie
  // hier niet bij — een ronde die nog loopt — dan hoort hij er ook niet bij, en
  // anders weigert de database het hele pakket.
  const verstuurd = new Set(sessies.map((sessie) => sessie.id));
  const pogingen = bron.attempts
    .filter((poging) => van(poging) === lokaal && verstuurd.has(poging.sessionId))
    .map((poging) => pogingRij(poging, eigenaar))
    .filter((rij): rij is PogingRij => rij !== null);

  const voortgang = bron.progress
    .filter((staat) => staat.kindId === lokaal)
    .map((staat) => voortgangRij(staat, eigenaar));

  const diplomas = bron.kindBadges
    .filter((diploma) => diploma.kindId === lokaal)
    .map((diploma) => diplomaRij(diploma, eigenaar));

  const instellingen = bron.settings
    .map((rij) => instellingRij(rij, eigenaar, nu))
    .filter((rij): rij is InstellingRij => rij !== null);

  return { sessies, pogingen, voortgang, diplomas, instellingen };
}

/** Wat er nu op dit apparaat staat, als pakket voor één kind. */
export async function leesPakket(eigenaar: Eigenaar, nu = new Date()): Promise<Pakket> {
  const db = await getDb();
  const [progress, sessions, attempts, kindBadges, settings] = await Promise.all([
    db.getAll('progress'),
    db.getAll('sessions'),
    db.getAll('attempts'),
    db.getAll('kindBadges'),
    db.getAll('settings'),
  ]);
  return pakketVan({ progress, sessions, attempts, kindBadges, settings }, eigenaar, nu);
}
