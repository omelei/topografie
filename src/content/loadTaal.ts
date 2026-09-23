import type { SpellingItem, SterkeWerkwoorden, TaalDeel, WerkwoordItem } from '@/game-core';
import { itemId, leesLijsten, setIdVan } from '@/store/woordlijsten';

/**
 * Taal's content, at build time: the spelling sets and the verb sets, and the
 * strong verbs a rule does not make (ADR-118).
 *
 * Bundled like the clock, the sums and the flags: a few hundred short sentences
 * are a few kilobytes, and a round has to start without waiting for anything.
 *
 * Written by hand, not generated — every word and every sentence is a choice,
 * and `content/taal/AFBAKENING.md` says what was chosen and why. What stands
 * in for the editor is `taal.content.test.ts`: the gap is where the letters
 * are, the word is in its sentence, and every weak verb is worked out again.
 *
 * **No mix is a file** (ADR-062). The Spellingmix and the Werkwoordmix are the
 * sets of their part under one name, composed here, so "trein" answered in the
 * mix moves the same Leitner box as "trein" answered under ei/ij.
 */

interface SpellingBestand {
  readonly id: string;
  readonly deel: 'spelling';
  readonly contentVersie: string;
  readonly items: readonly SpellingItem[];
}

interface WerkwoordBestand {
  readonly id: string;
  readonly deel: 'werkwoorden';
  readonly contentVersie: string;
  readonly items: readonly WerkwoordItem[];
}

export type SpellingSet = SpellingBestand;
export type WerkwoordSet = WerkwoordBestand;
export type TaalSet = SpellingSet | WerkwoordSet;

const bestanden = import.meta.glob<{ default: TaalSet }>(
  '../../content/taal/{spelling,werkwoorden}/*.json',
  { eager: true },
);

const sterkBestand = import.meta.glob<{ default: SterkeWerkwoorden }>(
  '../../content/taal/sterke-werkwoorden.json',
  { eager: true },
);

/**
 * The sets in the order the page offers them, which is the order a child
 * meets them — not the order the filenames sort in. A set not written yet is
 * simply absent, and so is the subject it would have been under.
 */
export const TAAL_VOLGORDE = [
  'taal-sp-eiij',
  'taal-sp-auou',
  'taal-sp-gch',
  'taal-sp-ck',
  'taal-sp-dt',
  'taal-sp-klinkers',
  'taal-sp-medeklinkers',
  'taal-sp-verkleinwoorden',
  'taal-sp-ig',
  'taal-sp-lijk',
  'taal-ww-tt',
  'taal-ww-vt',
  'taal-ww-vd',
] as const;

/** Everything of one part under one name: the mix. Not a file. */
export const TAAL_MIX: Readonly<Record<TaalDeel, string>> = {
  spelling: 'taal-sp-mix',
  werkwoorden: 'taal-ww-mix',
};

/**
 * "Oefen je fouten" (ADR-078, ADR-103): everything of one part, narrowed to
 * what this child has had wrong when a round starts.
 */
export const TAAL_FOUTEN: Readonly<Record<TaalDeel, string>> = {
  spelling: 'taal-sp-fouten',
  werkwoorden: 'taal-ww-fouten',
};

export function loadTaalSets(): TaalSet[] {
  const sets = Object.values(bestanden).map((module) => module.default);
  return TAAL_VOLGORDE.map((id) => sets.find((set) => set.id === id)).filter(
    (set): set is TaalSet => set !== undefined,
  );
}

/** Which part a set belongs to, from its id: `taal-sp-…` or `taal-ww-…`. */
export function taalDeelVan(setId: string): TaalDeel | null {
  if (setId.startsWith('taal-sp-')) return 'spelling';
  if (setId.startsWith('taal-ww-')) return 'werkwoorden';
  return null;
}

/** The set an item was written in, from its id: `taal-sp-eiij-trein` → `taal-sp-eiij`. */
export function taalSetVanItem(itemId: string): string | null {
  return TAAL_VOLGORDE.find((id) => itemId.startsWith(`${id}-`)) ?? null;
}

export function isTaalMix(setId: string): boolean {
  return Object.values(TAAL_MIX).includes(setId);
}

export function isTaalFouten(setId: string): boolean {
  return Object.values(TAAL_FOUTEN).includes(setId);
}

/** Every set of one part under one name, or nothing if the part has no sets. */
function samen(deel: TaalDeel, id: string): TaalSet | undefined {
  const sets = loadTaalSets().filter((set) => set.deel === deel);
  const eerste = sets[0];
  if (eerste === undefined) return undefined;
  const contentVersie = eerste.contentVersie;

  if (deel === 'spelling') {
    const items = sets.flatMap((set) => (set.deel === 'spelling' ? set.items : []));
    return { id, deel, contentVersie, items };
  }
  const items = sets.flatMap((set) => (set.deel === 'werkwoorden' ? set.items : []));
  return { id, deel, contentVersie, items };
}

export function loadTaalSet(id: string): TaalSet | undefined {
  if (id.startsWith('taal-eigen-')) return eigenSet(id);
  const deel = taalDeelVan(id);
  if (deel !== null && (id === TAAL_MIX[deel] || id === TAAL_FOUTEN[deel])) return samen(deel, id);
  return loadTaalSets().find((set) => set.id === id);
}

/**
 * Een eigen woordenlijst als set (ADR-195): de woorden die een ouder op Jij
 * intypte, uit localStorage. Zonder dit zocht een ronde alleen tussen de sets
 * in de bundel, en liep elk flitsdictee op een eigen lijst uit op "De woorden
 * konden niet geladen worden".
 *
 * Elk woord is het hele woord: geen gat en geen keuzes, want het flitsdictee
 * laat het woord zien en vraagt het dan te typen (`onderdelen.ts`, dezelfde
 * items). De versie is `eigen`: er is geen bestand dat kan veranderen.
 */
function eigenSet(id: string): SpellingSet | undefined {
  const lijst = leesLijsten().find((kandidaat) => setIdVan(kandidaat.id) === id);
  if (lijst === undefined || lijst.woorden.length === 0) return undefined;
  return {
    id,
    deel: 'spelling',
    contentVersie: 'eigen',
    items: lijst.woorden.map((woord) => ({
      id: itemId(lijst.id, woord),
      woord,
      gat: [0, woord.length] as const,
      keuzes: [woord],
      zin: woord,
      // Een lijst van school hoort bij de groep van het kind dat hem oefent,
      // niet bij een vaste groep; in een ronde wordt de groep niet gelezen.
      groep: 3,
    })),
  };
}

/** The forms of the strong verbs in the content: "reed", "geworden". */
export function sterkeWerkwoorden(): SterkeWerkwoorden {
  return Object.values(sterkBestand)[0]?.default ?? {};
}
