import {
  alsTopoDiplomaSet,
  countMastered,
  diplomaDrempel,
  diplomaWerelddeelVanSet,
  KLOK_DIPLOMA_SETS,
  tableOfDiploma,
  type ItemState,
  type ModeId,
} from '@/game-core';
import { isPremiumVorm } from '@/features/module/premium';
import type { Onderdeel } from '@/features/module/onderdelen';
import type { RoundOutcome } from '@/store/rewardStore';

/**
 * Waar dit kind zelf voor gaat (ADR-141).
 *
 * De app wist elke dag wat er aan de beurt was en nooit waar het naartoe ging.
 * Het dagplan is een portie — vier rondes, vandaag — en dat is een goed antwoord
 * op "wat nu", maar geen antwoord op "waarvoor". Wat een kind van acht wél
 * begrijpt is een diploma: "ik ga voor de tafel van 7." Dat is zijn eigen zin,
 * en hij is te halen.
 *
 * **Het doel is een diploma en niets anders.** De 33 diploma's die er al zijn —
 * twaalf tafels, zes werelddelen aan vlaggen, vier stappen van de klok, elf
 * kaarten — zijn de enige mijlpalen in dit product die een kind zelf als doel
 * zou noemen. Er is geen nieuwe beloning bij verzonnen — er stonden er al twaalf
 * in dit product, en ADR-130 haalde er twee weg omdat niets ze ooit las.
 *
 * **Alleen een diploma dat dit kind ook kan halen.** Zonder code is het
 * tafeldiploma het enige vrije diploma (ADR-122), dus staan de twaalf tafels in
 * de lijst en de andere eenentwintig niet. Dat is `vormVoor`'s regel, hardop:
 * een plan dat naar de betaalpagina leidt is geen plan.
 *
 * **De voortgang is eerlijk en niet gemaakt.** Een diploma is geslaagd of niet
 * geslaagd: er bestaat geen "60% van een diploma". Wat er wél is, is hoeveel van
 * de set dit kind onthoudt — `countMastered`, dezelfde som als op de
 * modulepagina — en dat is toevallig ook precies het getal dat zegt wat je nu
 * moet doen. Acht van de tien onthouden betekent: oefen die twee.
 *
 * Puur: er gaan onderdelen, Leitner-standen en behaalde diploma's in, er komt
 * een lijstje uit. Wat er bewaard wordt staat in `store/doelStore.ts`.
 */

export interface Doelwit {
  /** Het diploma zoals het in `kindBadges` staat, bijvoorbeeld `diploma-tafel-7`. */
  readonly id: string;
  /** De ronde die dit diploma ís: er is er per diploma precies één. */
  readonly mode: ModeId;
  readonly deel: Onderdeel;
}

/**
 * Het diploma van deze set, of null waar er geen is.
 *
 * Aan de vorm van de set-id, want dat is waar `rewards.ts` het diploma zelf ook
 * aan herkent. Twee keer dezelfde vraag op twee manieren beantwoorden is een
 * tweede plek om een hernoemde set te vergeten.
 */
export function doelwitVan(deel: Onderdeel): Doelwit | null {
  // Een mix heeft geen diploma: er bestaat geen certificaat voor "alle tafels
  // door elkaar" (`forms.ts`).
  if (deel.mix) return null;
  const setId = deel.setId;

  if (tableOfDiploma(`diploma-${setId}`) !== null) {
    return { id: `diploma-${setId}`, mode: 'tafeldiploma', deel };
  }
  const werelddeel = diplomaWerelddeelVanSet(setId);
  if (werelddeel !== null) {
    return { id: `diploma-vlag-${werelddeel}`, mode: 'vlag-diploma', deel };
  }
  if ((KLOK_DIPLOMA_SETS as readonly string[]).includes(setId)) {
    return { id: `diploma-${setId}`, mode: 'klok-diploma', deel };
  }
  const kaart = alsTopoDiplomaSet(setId);
  if (kaart !== null) {
    return { id: `diploma-topo-${kaart}`, mode: 'topo-diploma', deel };
  }
  return null;
}

/** Elk diploma dat dit kind mag doen: alle 33, of de twaalf tafels zonder code. */
export function doelwitten(alles: readonly Onderdeel[], premium: boolean): readonly Doelwit[] {
  const uit: Doelwit[] = [];
  for (const deel of alles) {
    const doelwit = doelwitVan(deel);
    if (doelwit === null) continue;
    if (!premium && isPremiumVorm(doelwit.mode)) continue;
    uit.push(doelwit);
  }
  return uit;
}

export interface Stand {
  /** Hoeveel van de set dit kind onthoudt: doos vier of vijf (ADR-114). */
  readonly onthouden: number;
  readonly totaal: number;
  /** Ver genoeg om de toets aan te bieden. */
  readonly rijp: boolean;
}

/**
 * Hoe ver dit kind is, gemeten met de som die de rest van het product ook
 * gebruikt — inclusief `now`, dus wat te lang geleden is telt niet meer mee.
 * Een diploma waarvan je de helft weer kwijt bent is geen diploma dat bijna af
 * is.
 */
export function standVan(
  doelwit: Doelwit,
  states: ReadonlyMap<string, ItemState>,
  now: Date,
): Stand {
  const ids = doelwit.deel.items.map((item) => item.id);
  const totaal = ids.length;
  const onthouden = countMastered(states, ids, now);
  return { onthouden, totaal, rijp: rijpVoor(doelwit, onthouden, totaal) };
}

/**
 * Wanneer de knop "Doe de toets" gaat zeggen in plaats van "Oefenen".
 *
 * Dezelfde lat als het diploma zelf. Het tafeldiploma is de hele tafel zonder
 * fout, dus tien van de tien onthouden; de andere drie worden gehaald met negen
 * op de tien (`diplomaDrempel`), dus dezelfde verhouding over de hele set — een
 * toets die twintig van de zesenveertig landen vraagt, haal je door
 * zesenveertig landen te kennen en niet door twintig.
 *
 * Te vroeg aanbieden kost een kind een poging en een teleurstelling, en dat is
 * duurder dan een dag langer oefenen.
 */
function rijpVoor(doelwit: Doelwit, onthouden: number, totaal: number): boolean {
  if (totaal === 0) return false;
  if (doelwit.mode === 'tafeldiploma') return onthouden === totaal;
  return onthouden >= diplomaDrempel(totaal);
}

/** Hoeveel doelen er voorgesteld worden. Drie: meer is een lijst, niet een keuze. */
export const SUGGESTIES = 3;

export interface Suggestie {
  readonly doelwit: Doelwit;
  readonly stand: Stand;
}

/**
 * Wat we voorstellen: het diploma dat het dichtst bij is, bovenaan.
 *
 * Dichtbij en niet makkelijk. Een kind dat tien van de twaalf provincies
 * onthoudt is twee provincies van een diploma af, en dat is een betere eerste
 * zin dan "begin bij de tafel van 1" — die suggestie wint vanzelf zodra er
 * niets geoefend is, want dan staat alles op nul en telt de volgorde van de
 * modules zelf (`sort` is stabiel).
 *
 * Behaalde diploma's vallen af: een doel dat je al hebt is geen doel.
 */
export function suggesties(
  alle: readonly Doelwit[],
  behaald: ReadonlySet<string>,
  states: ReadonlyMap<string, ItemState>,
  now: Date,
  hoeveel: number = SUGGESTIES,
): readonly Suggestie[] {
  return alle
    .filter((doelwit) => !behaald.has(doelwit.id))
    .map((doelwit) => ({ doelwit, stand: standVan(doelwit, states, now) }))
    .filter(({ stand }) => stand.totaal > 0)
    .sort((a, b) => deelVan(b.stand) - deelVan(a.stand) || b.stand.onthouden - a.stand.onthouden)
    .slice(0, hoeveel);
}

function deelVan(stand: Stand): number {
  return stand.totaal === 0 ? 0 : stand.onthouden / stand.totaal;
}

/** Het bewaarde doel, terug tussen de doelwitten van nu, of null. */
export function doelwitMet(alle: readonly Doelwit[], id: string | null): Doelwit | null {
  if (id === null) return null;
  return alle.find((doelwit) => doelwit.id === id) ?? null;
}

/**
 * Het diploma dat deze ronde opleverde, als id.
 *
 * Het uitslagscherm krijgt het diploma in woorden, en woorden zijn niet te
 * vergelijken met wat er bewaard staat. De uitslag zelf draagt wél alle vier de
 * gevallen, elk in zijn eigen veld, dus wordt de id hier teruggerekend in
 * plaats van door vijf schermen heen gegeven.
 */
export function behaaldDiploma(reward: RoundOutcome | null): string | null {
  if (reward === null) return null;
  if (reward.diploma !== null) return `diploma-tafel-${reward.diploma}`;
  if (reward.vlagDiploma !== null) return `diploma-vlag-${reward.vlagDiploma}`;
  if (reward.klokDiploma !== null) return `diploma-${reward.klokDiploma}`;
  if (reward.topoDiploma !== null) return `diploma-topo-${reward.topoDiploma}`;
  return null;
}
