/**
 * De woordenlijsten die een ouder zelf intypt (ADR-135).
 *
 * Elke basisschool geeft een eigen lijstje mee, elke week een ander, en geen
 * enkel product kan die allemaal bevatten. Dit is het antwoord daarop: de lijst
 * van deze week gaat erin, en krijgt daarna alles wat een ingebouwde set ook
 * krijgt — Leitner-dozen, de onthoudtabel, het dagplan, het toetsvooruitzicht.
 *
 * **In localStorage en niet in IndexedDB.** Niet uit gemak: `onderdelen()` is
 * synchroon en wordt door het halve product aangeroepen, dus een lijst die
 * asynchroon binnenkomt zou overal een laadmoment introduceren en op de eerste
 * frame ontbreken. Premium staat er om dezelfde reden (ADR-116). Het hoort ook
 * bij het apparaat en niet bij één kind: de lijst van school is voor iedereen
 * in huis die hem moet leren.
 *
 * **De id van een woord hangt aan het woord.** `taal-eigen-<lijst>-<woord>`, en
 * niet aan zijn plek in de lijst. Een ouder die er een woord tussenuit haalt,
 * verschuift anders elke doos eronder: dan zou "fiets" ineens de voortgang van
 * "trein" dragen. Dit is het enige stukje van dit bestand dat niet
 * vanzelfsprekend is en het is het enige dat echt kapot kan.
 *
 * Er gaat niets weg van dit apparaat.
 */

export interface Woordlijst {
  readonly id: string;
  readonly naam: string;
  readonly woorden: readonly string[];
}

export const LIJSTEN_SLEUTEL = 'leernu.woordlijsten';

/** Hoeveel lijsten er hoogstens zijn. Meer is geen lijst maar een archief. */
export const MAX_LIJSTEN = 8;
/** Hoeveel woorden er in één lijst passen. Een weeklijst van school is er tien tot twintig. */
export const MAX_WOORDEN = 40;
export const MAX_NAAM = 30;
/** Het langste woord dat een veld nog fatsoenlijk toont. */
export const MAX_WOORD = 24;

/**
 * Het woord zoals het opgeslagen wordt: spaties eraf, nooit leeg, nooit langer
 * dan een veld aankan. Verder onaangeraakt — hoofdletters horen bij het woord,
 * en een ouder die "Amsterdam" intypt bedoelt de hoofdletter.
 */
export function schoonWoord(invoer: string): string {
  return invoer.trim().slice(0, MAX_WOORD);
}

/** Het stukje id dat van een woord gemaakt wordt. Stabiel, en zonder verrassingen. */
export function woordSleutel(woord: string): string {
  return woord
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Het id van één onderdeel. Hier vandaan, zodat er één plek is die het weet. */
export function itemId(lijstId: string, woord: string): string {
  return `taal-eigen-${lijstId}-${woordSleutel(woord)}`;
}

/** Het setId van een lijst. */
export function setIdVan(lijstId: string): string {
  return `taal-eigen-${lijstId}`;
}

/** Of dit setId van een eigen lijst is. */
export function isEigenSet(setId: string): boolean {
  return setId.startsWith('taal-eigen-');
}

/**
 * Wat er in de rij staat, veilig gemaakt.
 *
 * Dit is door deze code geschreven en wordt toch gelezen alsof een vreemde het
 * schreef: een oudere versie, een half weggeschreven waarde, een browser die de
 * staart kwijtraakte. Een lijst die gooit zou de voordeur meenemen, en het
 * eerlijke antwoord is "geen lijsten" in plaats van een wit scherm.
 */
export function ontleed(ruw: string | null): Woordlijst[] {
  if (!ruw) return [];

  try {
    const geparst: unknown = JSON.parse(ruw);
    if (!Array.isArray(geparst)) return [];

    return geparst
      .flatMap((rij): Woordlijst[] => {
        if (typeof rij !== 'object' || rij === null) return [];
        const waarde = rij as Record<string, unknown>;
        if (typeof waarde.id !== 'string' || typeof waarde.naam !== 'string') return [];
        if (!Array.isArray(waarde.woorden)) return [];

        // Dubbelen eruit: twee keer hetzelfde woord zou twee onderdelen met
        // hetzelfde id geven, en dan deelt het ene de doos van het andere.
        const gezien = new Set<string>();
        const woorden: string[] = [];
        for (const woord of waarde.woorden) {
          if (typeof woord !== 'string') continue;
          const schoon = schoonWoord(woord);
          const sleutel = woordSleutel(schoon);
          if (schoon === '' || sleutel === '' || gezien.has(sleutel)) continue;
          gezien.add(sleutel);
          woorden.push(schoon);
        }

        return [
          {
            id: waarde.id,
            naam: waarde.naam.slice(0, MAX_NAAM),
            woorden: woorden.slice(0, MAX_WOORDEN),
          },
        ];
      })
      .slice(0, MAX_LIJSTEN);
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// De waarde, en wie ernaar luistert. Dezelfde vorm als `store/premium.ts`.

const luisteraars = new Set<() => void>();
let gelezen: { readonly ruw: string | null; readonly lijsten: readonly Woordlijst[] } | null = null;

function ruw(): string | null {
  try {
    return window.localStorage.getItem(LIJSTEN_SLEUTEL);
  } catch {
    return null;
  }
}

/** De lijsten van dit apparaat, synchroon. */
export function leesLijsten(): readonly Woordlijst[] {
  const nu = ruw();
  // Eén keer ontleden per waarde: dit wordt bij elke ronde en elke tegel
  // gelezen, en JSON.parse op elke render is verspilling die je gaat merken.
  if (gelezen === null || gelezen.ruw !== nu) gelezen = { ruw: nu, lijsten: ontleed(nu) };
  return gelezen.lijsten;
}

export function schrijfLijsten(lijsten: readonly Woordlijst[]): void {
  try {
    window.localStorage.setItem(LIJSTEN_SLEUTEL, JSON.stringify(lijsten.slice(0, MAX_LIJSTEN)));
  } catch {
    // Een volle of geweigerde opslag is geen reden om het scherm te laten vallen.
  }
  gelezen = null;
  for (const luisteraar of luisteraars) luisteraar();
}

export function abonneerLijsten(luisteraar: () => void): () => void {
  luisteraars.add(luisteraar);
  return () => luisteraars.delete(luisteraar);
}

/** Alleen voor de tests: de gelezen waarde vergeten. */
export function vergeetLijsten(): void {
  gelezen = null;
}
