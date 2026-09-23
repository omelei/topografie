/**
 * Of wat een kind oefent op dit apparaat blijft staan (ADR-186).
 *
 * Alles wat een kind oefent staat in IndexedDB (ADR-015), en een browser mag dat
 * opruimen. Twee manieren waarop dat gebeurt, en ze vragen elk iets anders:
 *
 * - **Een vol apparaat.** Elke browser ruimt bij ruimtegebrek op wat niet
 *   "blijvend" is. `navigator.storage.persist()` vraagt om die uitzondering;
 *   de browser beslist zelf of hij ja zegt.
 * - **Safari's week.** WebKit gooit alles weg wat een script bewaart voor een
 *   site die zeven dagen niet geopend is (ADR-046). Een app op het beginscherm
 *   valt daarbuiten. Of `persist()` ook tegen die regel beschermt, staat nergens
 *   vastgelegd, en daarom wordt dat hier niet beloofd.
 *
 * Dit bestand leest en vraagt alleen; het beslist niets en bewaart niets. Het
 * vraagt ook nooit uit zichzelf: Firefox toont bij `persist()` een venster, en
 * dat hoort voor een ouder te staan en niet voor een kind midden in een ronde.
 */

export type Beginscherm =
  /** De app draait vanaf het beginscherm: Safari's week geldt niet. */
  | 'staat-erop'
  /** Een tabblad in Safari (of WebKit op iOS): de week geldt wél. */
  | 'kan-erop'
  /** Een andere browser, of niet vast te stellen. */
  | 'onbekend';

export interface Bewaarstand {
  /** Of de browser het bewaart als het apparaat vol raakt; null als hij dat niet zegt. */
  readonly blijvend: boolean | null;
  readonly beginscherm: Beginscherm;
}

/** Wat hier van de browser gelezen wordt — los te geven, zodat het te toetsen is. */
export interface BewaarOmgeving {
  readonly navigator: {
    readonly storage?: {
      readonly persisted?: () => Promise<boolean>;
      readonly persist?: () => Promise<boolean>;
    };
    /** Alleen WebKit op iPhone en iPad kent deze, en daar is hij de enige betrouwbare vlag. */
    readonly standalone?: boolean;
  };
  readonly matchMedia?: (query: string) => { readonly matches: boolean };
}

function echteOmgeving(): BewaarOmgeving {
  return { navigator, matchMedia: (query) => window.matchMedia(query) };
}

export function beginscherm(omgeving: BewaarOmgeving): Beginscherm {
  const vanafBeginscherm =
    omgeving.navigator.standalone === true ||
    (omgeving.matchMedia?.('(display-mode: standalone)').matches ?? false);
  if (vanafBeginscherm) return 'staat-erop';
  // `standalone` bestaat alleen in WebKit op iOS en iPadOS, en is daar false in
  // een tabblad. Een user-agent lezen zou hetzelfde zeggen, minder betrouwbaar.
  if ('standalone' in omgeving.navigator) return 'kan-erop';
  return 'onbekend';
}

export async function leesBewaarstand(
  omgeving: BewaarOmgeving = echteOmgeving(),
): Promise<Bewaarstand> {
  let blijvend: boolean | null = null;
  try {
    const persisted = omgeving.navigator.storage?.persisted;
    if (persisted) blijvend = await persisted.call(omgeving.navigator.storage);
  } catch {
    blijvend = null;
  }
  return { blijvend, beginscherm: beginscherm(omgeving) };
}

/** Vraag de browser om het te bewaren. Null als hij die vraag niet kent. */
export async function vraagBlijvend(
  omgeving: BewaarOmgeving = echteOmgeving(),
): Promise<boolean | null> {
  try {
    const persist = omgeving.navigator.storage?.persist;
    if (!persist) return null;
    return await persist.call(omgeving.navigator.storage);
  } catch {
    return null;
  }
}
