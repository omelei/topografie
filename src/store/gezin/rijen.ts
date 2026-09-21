import type { AttemptRecord, ChildBadgeRecord, ChildItemState, SessionRecord } from '../db';

/**
 * De ene vertaling tussen het apparaat en de server (ADR-175).
 *
 * `docs/DATAMODEL.md` belooft dit sinds de eerste versie: deel A en deel C
 * hebben dezelfde rijvormen, veldnamen zijn camelCase hier en snake_case daar,
 * en **die hernoeming is de enige vertaling** — "geschreven in één
 * mappingfunctie op de dag dat accounts arriveren, en niet vast door de code
 * heen in afwachting van een vorm die nog niemand nodig had". Dit is die dag en
 * dit is die plek.
 *
 * Puur, en daarom hier los van het versturen. Wat een rij wordt is te toetsen
 * zonder browser en zonder netwerk; dát het aankomt, is iets voor de e2e-bouw.
 *
 * **Twee dingen gaan er met opzet níét in.** `stempels` wordt sinds ADR-158
 * door niets meer geschreven of gelezen; de kolom staat nog in
 * `0001_gezin.sql` en wordt niet gevuld. En van de instellingen gaat alleen wat
 * in de `check` van die migratie staat — `dagstand:` en `actiefKind` zijn wat
 * dít apparaat vandaag doet, en horen nergens anders te zijn (ADR-155).
 */

/**
 * Wat elke rij van een kind draagt, gedenormaliseerd (ADR-156) — en daarnaast
 * de sleutel die dit apparaat voor hetzelfde kind gebruikt.
 *
 * **Twee identiteiten, met opzet.** Op de server is een kind zijn auth-uuid; op
 * dit apparaat is het eerste kind `me` en elk volgend kind een lokale uuid, en
 * dat verandert niet als er een account bij komt. Het alternatief — de lokale
 * sleutel omschrijven naar de uuid van de server — raakt elke winkel tegelijk,
 * en een migratie die halverwege breekt laat de dozen van een kind achter onder
 * twee sleutels. Dat is precies de fout die ADR-046 opruimde.
 *
 * De prijs is deze twee velden en de vertaling hieronder. Dat is goedkoper dan
 * de risico's van het verplaatsen, en het is ook wat `SINGLETON_KEY` al doet:
 * alles wat onder `me` geschreven is, blijft van dat kind zonder te verhuizen.
 */
export interface Eigenaar {
  /** De uuid op de server. Elke rij draagt hem, en de policy leest hem. */
  readonly kindId: string;
  readonly ouderId: string;
  /** Waar ditzelfde kind op dit apparaat onder staat. */
  readonly lokaalId: string;
}

/**
 * De instellingen die de server kent.
 *
 * Letterlijk de lijst uit de `check` op `instellingen.sleutel`. Hij staat hier
 * nog een keer omdat de client hem moet kennen om niets anders te versturen —
 * een rij die de database weigert, laat de hele overname stranden op iets wat
 * hier te zien was.
 */
export const GEDEELDE_INSTELLINGEN: readonly string[] = [
  'weekdoel',
  'zegels',
  'bijhouden',
  'doel',
  'groepGevraagd',
];

export interface VoortgangRij {
  readonly kind_id: string;
  readonly ouder_id: string;
  readonly item_id: string;
  readonly box: number;
  readonly laatste_review: string | null;
  readonly volgende_review: string | null;
  readonly goed_count: number;
  readonly fout_count: number;
  readonly hoogste_doos: number | null;
}

export function voortgangRij(staat: ChildItemState, eigenaar: Eigenaar): VoortgangRij {
  return {
    kind_id: eigenaar.kindId,
    ouder_id: eigenaar.ouderId,
    item_id: staat.itemId,
    box: staat.box,
    laatste_review: staat.laatsteReview,
    volgende_review: staat.volgendeReview,
    goed_count: staat.goedCount,
    fout_count: staat.foutCount,
    hoogste_doos: staat.hoogsteDoos ?? null,
  };
}

export interface SessieRij {
  readonly id: string;
  readonly kind_id: string;
  readonly ouder_id: string;
  readonly mode: string;
  readonly set_id: string | null;
  readonly item_set: unknown;
  readonly score: number | null;
  readonly beantwoord: number | null;
  readonly gestart: string;
  readonly geeindigd: string | null;
}

export function sessieRij(sessie: SessionRecord, eigenaar: Eigenaar): SessieRij {
  return {
    id: sessie.id,
    kind_id: eigenaar.kindId,
    ouder_id: eigenaar.ouderId,
    mode: sessie.mode,
    set_id: sessie.setId ?? null,
    item_set: sessie.itemSet ?? [],
    score: sessie.score,
    beantwoord: sessie.beantwoord ?? null,
    gestart: sessie.gestart,
    geeindigd: sessie.geeindigd,
  };
}

/**
 * Een ronde die nog loopt gaat niet mee.
 *
 * Die hoort bij het apparaat waar hij openstaat (ADR-155). Het is ook wat
 * `pogingen.sessie_id` afdwingt: een poging hangt aan een sessie, dus een
 * poging uit een lopende ronde mag evenmin mee.
 */
export function isAfgerond(sessie: SessionRecord): boolean {
  return sessie.geeindigd !== null;
}

export interface PogingRij {
  readonly id: string;
  readonly sessie_id: string;
  readonly kind_id: string;
  readonly ouder_id: string;
  readonly item_id: string;
  readonly mode: string;
  readonly correct: boolean;
  readonly response_ms: number;
  readonly gekozen_antwoord: string | null;
  readonly tijdstip: string;
}

/**
 * Een poging wordt alleen een rij als zijn sleutel een uuid is.
 *
 * Een genummerde sleutel is per apparaat (ADR-175), en die als primaire sleutel
 * versturen zou op het tweede apparaat een ánder antwoord overschrijven.
 * `zorgVoorUniekePogingen` draait bij het openen van de app, dus dit hoort niet
 * voor te komen — en als het toch zo is, is overslaan beter dan een antwoord
 * van iemand anders wegschrijven.
 */
export function pogingRij(poging: AttemptRecord, eigenaar: Eigenaar): PogingRij | null {
  if (typeof poging.id !== 'string') return null;

  return {
    id: poging.id,
    sessie_id: poging.sessionId,
    kind_id: eigenaar.kindId,
    ouder_id: eigenaar.ouderId,
    item_id: poging.itemId,
    mode: poging.mode,
    correct: poging.correct,
    response_ms: poging.responseMs,
    gekozen_antwoord: poging.gekozenAntwoord,
    tijdstip: poging.tijdstip,
  };
}

export interface DiplomaRij {
  readonly kind_id: string;
  readonly ouder_id: string;
  readonly badge_id: string;
  readonly behaald_op: string;
}

export function diplomaRij(diploma: ChildBadgeRecord, eigenaar: Eigenaar): DiplomaRij {
  return {
    kind_id: eigenaar.kindId,
    ouder_id: eigenaar.ouderId,
    badge_id: diploma.badgeId,
    behaald_op: diploma.behaaldOp,
  };
}

export interface InstellingRij {
  readonly kind_id: string;
  readonly ouder_id: string;
  readonly sleutel: string;
  readonly waarde: string;
  readonly gewijzigd_op: string;
}

/**
 * Een instelling is lokaal `weekdoel:<kindId>` en op de server `weekdoel` bij
 * een `kind_id`. De naam van het kind zit dus in de sleutel, en gaat eruit.
 *
 * `null` betekent: deze gaat niet mee. Dat is zo voor alles wat niet in de
 * lijst staat — `dagstand:` en `actiefKind` voorop — en voor een waarde die de
 * lengte uit de migratie niet haalt.
 */
const WAARDE_MAX = 2000;

export function instellingRij(
  rij: { readonly key: string; readonly value: string; readonly gewijzigdOp?: string },
  eigenaar: Eigenaar,
  nu: Date,
): InstellingRij | null {
  const scheiding = rij.key.indexOf(':');
  if (scheiding === -1) return null;

  const sleutel = rij.key.slice(0, scheiding);
  // Tegen de lokale sleutel, niet tegen die van de server: de instelling heet
  // op dit apparaat `weekdoel:me` en niet `weekdoel:<uuid>`.
  const vanKind = rij.key.slice(scheiding + 1);
  if (vanKind !== eigenaar.lokaalId) return null;
  if (!GEDEELDE_INSTELLINGEN.includes(sleutel)) return null;
  if (rij.value.length > WAARDE_MAX) return null;

  return {
    kind_id: eigenaar.kindId,
    ouder_id: eigenaar.ouderId,
    sleutel,
    waarde: rij.value,
    // Een rij van vóór ADR-175 draagt geen moment. Die is per definitie ouder
    // dan alles wat er daarna bij komt, en krijgt het moment van nu mee zodat
    // de kolom niet leeg is — de server kan hem dan nog steeds verliezen van
    // een verse schrijver, en dat is precies goed.
    gewijzigd_op: rij.gewijzigdOp ?? nu.toISOString(),
  };
}
