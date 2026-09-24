/**
 * Diploma's.
 *
 * Spec §4.5 is unusually specific about what this may not be: no lootboxes, no
 * chance mechanics, no real money, nothing that can be bought rather than
 * earned. The audience is ten years old. Everything here is deterministic and
 * explainable: a child who asks "waarom kreeg ik dat?" gets a sentence.
 *
 * **Er stonden ook niveaus en badges, en die zijn weg (ADR-149).** Wat er
 * beloond wordt is wat een kind onthoudt, en sinds ADR-167 is het diploma
 * daarvoor het hele programma. Tien losse badges ernaast waren een tweede
 * verzameling over dezelfde leerstof, en vier ervan beloonden iets anders dan
 * onthouden: tempo, volume en een reeks.
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

/**
 * De manieren om een diploma af te leggen: zes, en elk vak heeft er een
 * (ADR-168).
 *
 * **Een nieuwe erbij raakt zes plekken**, en die staan hier zodat niemand er
 * een hoeft te zoeken:
 *
 * 1. `ModeId` in `types.ts`, en de modelijst van de module in `onderdelen.ts`.
 * 2. De ronderegel van de module (`*_ROUND_RULE`), met typen en toetsstand aan.
 * 3. Een `*DiplomaFor` hieronder, en een veld in `RoundOutcome`.
 * 4. `doelwitVan` en `behaaldDiploma` in `features/home/doel.ts`.
 * 5. Een tegel in `features/module/forms.ts`, met `geldtVoor` en `vasteLengte`.
 * 6. `mode.<id>` en `way.<id>` in de teksten, en de muur op de modulepagina.
 */
export const DIPLOMA_VORMEN: readonly string[] = [
  'tafeldiploma',
  'reken-diploma',
  'vlag-diploma',
  'klok-diploma',
  'topo-diploma',
  'taal-diploma',
];

/**
 * Hoeveel vragen een diploma stelt dat niet over één tafel gaat, en hoeveel er
 * goed moeten (`diplomaDrempel`).
 *
 * Twintig, of de hele set waar die kleiner is. Het was al de maat van het
 * vlaggen- en het topodiploma; sinds ADR-168 is het de maat van elk diploma
 * behalve het tafeldiploma, want anders vraagt hetzelfde woord op vijf
 * pagina's vijf verschillende dingen.
 */
export const DIPLOMA_VRAGEN = 20;

export function diplomaVragen(onderdelen: number): number {
  return Math.min(DIPLOMA_VRAGEN, onderdelen);
}

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
 * Waar een vlaggendiploma over gaat (ADR-104, ADR-168).
 *
 * Zes werelddelen — de wereld is er geen — en **de provincies**. Die stonden er
 * niet bij, met het argument dat thuis geen deel van de wereld is. Dat klopt en
 * het is geen reden: de twaalf provincievlaggen zijn het enige onderwerp op de
 * hele vlaggenpagina onder Nederland, en dat was daarmee de enige pagina in de
 * app waar niets te halen viel. Ze zijn een set van zichzelf, ze worden op
 * school geleerd, en twaalf vlaggen zijn precies de maat van een toets.
 */
export const DIPLOMA_WERELDDELEN = [
  'nederland',
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
  // De provincies zijn hun eigen hele set: er is geen `vlag-nederland-alle`,
  // want er is niets anders onder Nederland om "alle" van te onderscheiden.
  if (setId === 'vlag-nederland-provincies') return 'nederland';
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

/**
 * De set waarop het diploma van dit werelddeel wordt afgelegd.
 *
 * De omgekeerde weg van `diplomaWerelddeelVanSet`, want een wand kent het
 * werelddeel en de pagina heeft de set nodig. Nederland is de uitzondering
 * waarvoor deze functie bestaat: daar heet de set naar wat erin zit.
 */
export function vlagDiplomaSet(deel: DiplomaWerelddeel): string {
  return deel === 'nederland' ? 'vlag-nederland-provincies' : `vlag-${deel}-alle`;
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
  // De wereld erbij (ADR-168). Het argument ertegen was dat twintig van de
  // honderdzevenenzestig een loterij is, en dat argument is waar — dus gaat
  // niet het diploma eruit maar het getal omhoog (`topodiplomaVragen`). Wat er
  // stond, was de enige kaart in het product waar een kind alles van kon leren
  // en niets voor kon krijgen.
  'wereld-landen',
] as const;

export type TopoDiplomaSet = (typeof TOPO_DIPLOMA_SETS)[number];

export function alsTopoDiplomaSet(setId: string | undefined): TopoDiplomaSet | null {
  return (TOPO_DIPLOMA_SETS as readonly string[]).includes(setId ?? '')
    ? (setId as TopoDiplomaSet)
    : null;
}

/** Twenty places, or the whole map where it has fewer: the vlaggendiploma's rule. */
export const TOPODIPLOMA_VRAGEN = 20;

/**
 * Hoeveel plekken het diploma van een kaart vraagt.
 *
 * Twintig, of de hele kaart waar die kleiner is — en **minstens een kwart van
 * de kaart** waar die groter is. Dat laatste is er voor precies één kaart, en
 * hardop: op de wereld zijn twintig van de honderdzevenenzestig landen geen
 * toets maar een loting, en dat was de reden dat de wereld hier niet stond. Een
 * kwart is tweeënveertig landen, en dat is een toets die je niet haalt door
 * geluk te hebben. Elke andere kaart blijft op twintig, want elke andere kaart
 * is kleiner dan tachtig.
 */
export function topodiplomaVragen(plekken: number): number {
  return Math.min(plekken, Math.max(TOPODIPLOMA_VRAGEN, Math.ceil(plekken / 4)));
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

// ---------------------------------------------------------------------------

/**
 * Het rekendiploma (ADR-168): één per soort som en bereik — plussommen tot 20,
 * deelsommen tot 100, halveren tot 1000.
 *
 * **Waarom het niet het tafeldiploma is.** Een tafel is tien feiten die een
 * kind opzegt, en het tafeldiploma is daarom foutloos: dat is wat de juf
 * uitdeelt en het is de reden dat dat diploma gratis is (ADR-122). "Plussommen
 * tot 100" zijn vijfenveertig sommen waarvan er twintig gevraagd worden; dat is
 * een toets, en een Nederlandse toets haal je met een cijfer. Dus dezelfde lat
 * als de vlaggen, de klok en de kaart: negen op de tien.
 *
 * **En niet op een mix.** De Rekenmix is elke andere soort som nog een keer;
 * een certificaat voor "alles door elkaar" certificeert niets in het
 * bijzonder, en het telt bij het onthouden ook nergens mee (`onderdelen`).
 */
const REKEN_DIPLOMA_SOORTEN = [
  'keer',
  'delen',
  'plus',
  'min',
  'splitsen',
  'halveren',
  'verdubbelen',
] as const;

/** Of deze set een rekendiploma kent: een soort som met een bereik erachter. */
export function isRekenDiplomaSet(setId: string): boolean {
  const match = /^([a-z]+)-(\d+)$/.exec(setId);
  if (!match) return false;
  return (REKEN_DIPLOMA_SOORTEN as readonly string[]).includes(match[1] ?? '');
}

export function rekenDiplomaFor(snapshot: RewardSnapshot): string | null {
  if (snapshot.mode !== 'reken-diploma') return null;
  if (!isRekenDiplomaSet(snapshot.setId) || !snapshot.completeRound) return null;
  if (snapshot.correct < diplomaDrempel(diplomaVragen(snapshot.setSize))) return null;
  return `diploma-${snapshot.setId}`;
}

/** Welke rekenset een bewaard rekendiploma is, of null. */
export function rekenSetVanDiploma(id: string): string | null {
  const setId = /^diploma-(.+)$/.exec(id)?.[1] ?? '';
  return isRekenDiplomaSet(setId) ? setId : null;
}

// ---------------------------------------------------------------------------

/**
 * Het taaldiploma (ADR-168): één per set van Taal — ei of ij, d of t, de
 * tegenwoordige tijd.
 *
 * **Hier stond dat het niet kon.** `forms.ts` schreef dat geen school een
 * spellingdiploma uitdeelt en dat het verzinnen ervan een verzonnen certificaat
 * is. Dat argument gold ook voor de klok en voor de kaart, en ADR-117 heeft het
 * daar al omgedraaid met de reden die hier net zo goed geldt: een diploma in
 * dit product is de toets aan het eind van het oefenen, en een kind dat twintig
 * woorden met ei en ij zonder hulp goed schrijft, heeft iets waar een naam bij
 * hoort. Wat er stond was dat Taal het enige vak was waar niets te halen viel.
 *
 * Hij wordt afgelegd zoals de oefentoets van dat deel vraagt — het flitsdictee
 * bij spelling, de vorm getypt bij werkwoorden — en met dezelfde lat als de
 * rest: negen op de tien.
 *
 * Niet op een mix, en niet op een eigen lijst: die laatste is wat een ouder
 * gisteravond intypte en morgen anders noemt, en een diploma hoort bij de stof
 * van het product.
 */
export function isTaalDiplomaSet(setId: string): boolean {
  return /^taal-(sp|ww|en)-/.test(setId) && !/-(mix|fouten)$/.test(setId);
}

export function taalDiplomaFor(snapshot: RewardSnapshot): string | null {
  if (snapshot.mode !== 'taal-diploma') return null;
  if (!isTaalDiplomaSet(snapshot.setId) || !snapshot.completeRound) return null;
  if (snapshot.correct < diplomaDrempel(diplomaVragen(snapshot.setSize))) return null;
  return `diploma-${snapshot.setId}`;
}

/** Welke taalset een bewaard taaldiploma is, of null. */
export function taalSetVanDiploma(id: string): string | null {
  const setId = /^diploma-(.+)$/.exec(id)?.[1] ?? '';
  return isTaalDiplomaSet(setId) ? setId : null;
}
