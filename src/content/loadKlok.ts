import type { KlokItem, KlokSet } from '@/game-core';

/**
 * Klokkijken's content, at build time: four steps and a hundred and
 * forty-four faces.
 *
 * Bundled like the sums and unlike the geometry. A hundred and forty-four times
 * is under three kilobytes, and a round has to be able to start without waiting
 * for anything.
 *
 * Written by tools/content/build-klok.mjs. Generated, so a hand correction here
 * is lost at the next run — and `klok.content.test.ts` works every entry back
 * out, which is what stands in for an editor.
 *
 * **The mix is not a file.** "Alle tijden door elkaar" is the union of the four
 * sets, composed here from the same items, so half past seven answered in the
 * mix moves the same Leitner box as half past seven answered under "halve
 * uren". A mix written out as its own file would have had to give those faces
 * second ids, and a child would then have had to learn the clock twice over to
 * fill both (ADR-062, in the module it was written for).
 */

const modules = import.meta.glob<{ default: KlokSet }>('../../content/klok/*.json', {
  eager: true,
});

/** The id of the set that is a union rather than a file. */
export const KLOK_MIX_ID = 'klok-mix';

/**
 * "Oefen je fouten" on the clock (ADR-103): every face there is, narrowed to
 * the ones this child has had wrong when a round starts. The same items as the
 * mix, under the child's own name.
 */
export const KLOK_FOUTEN_ID = 'klok-fouten';

/**
 * De digitale klok (ADR-257): dezelfde vier stappen, dezelfde tijden, maar in
 * cijfers. Geen eigen bestanden: elke set is die van de wijzerklok met
 * `klok-dig-` ervoor, in de set en in elk item. Eigen ids, want 19:30 lezen
 * is iets anders leren dan een wijzer lezen, en een kind dat de wijzerklok
 * kent heeft de digitale daarmee nog niet in zijn doosjes.
 */
export const KLOK_DIGITAAL_VOORVOEGSEL = 'klok-dig-';
export const KLOK_DIG_MIX_ID = 'klok-dig-mix';
export const KLOK_DIG_FOUTEN_ID = 'klok-dig-fouten';

/** Of een set van de digitale klok is. */
export function isDigitaleKlokSet(id: string): boolean {
  return id.startsWith(KLOK_DIGITAAL_VOORVOEGSEL);
}

/** `klok-half` wordt `klok-dig-half`, `klok-07-30` wordt `klok-dig-07-30`. */
function digitaalId(id: string): string {
  return `${KLOK_DIGITAAL_VOORVOEGSEL}${id.slice('klok-'.length)}`;
}

function alsDigitaal(set: KlokSet): KlokSet {
  return {
    ...set,
    id: digitaalId(set.id),
    digitaal: true,
    items: set.items.map((item) => ({ ...item, id: digitaalId(item.id) })),
  };
}

/**
 * The four, in the order a child meets them: whole hours, half hours, quarters,
 * then the five-minute steps.
 *
 * Ordered here rather than left to the filenames, which sort `klok-half` before
 * `klok-heel` and would offer a child half past before they had met the hour.
 */
const VOLGORDE = ['klok-heel', 'klok-half', 'klok-kwart', 'klok-vijf'];

/** De vier stappen van de wijzerklok. */
export function loadKlokSets(): KlokSet[] {
  const sets = Object.values(modules).map((module) => module.default);
  return VOLGORDE.map((id) => sets.find((set) => set.id === id)).filter(
    (set): set is KlokSet => set !== undefined,
  );
}

/** De vier stappen van de digitale klok (ADR-257). */
export function loadDigitaleKlokSets(): KlokSet[] {
  return loadKlokSets().map(alsDigitaal);
}

export function isKlokMix(id: string): boolean {
  return id === KLOK_MIX_ID || id === KLOK_DIG_MIX_ID;
}

/** Everything on the face at once, under one name. */
function klokMix(sets: readonly KlokSet[], id: string): KlokSet {
  return {
    id,
    // Null, because the items in it sit at four different steps. A mix that
    // claimed one of them would be claiming to be a set it is not.
    stap: null,
    niveau: 1,
    contentVersie: sets[0]?.contentVersie ?? '',
    items: sets.flatMap((set) => set.items),
    ...(isDigitaleKlokSet(id) ? { digitaal: true } : {}),
  };
}

export function loadKlokSet(id: string): KlokSet | undefined {
  const digitaal = isDigitaleKlokSet(id);
  const sets = digitaal ? loadDigitaleKlokSets() : loadKlokSets();
  if (isKlokMix(id)) return klokMix(sets, id);
  if (id === KLOK_FOUTEN_ID || id === KLOK_DIG_FOUTEN_ID) return klokMix(sets, id);
  return sets.find((set) => set.id === id);
}

/**
 * The pool a round without a fixed length draws from: the whole face.
 *
 * Twelve whole hours is over long before a minute is, so a lightning round of
 * "hele uren" has to reach past those twelve. Unlike rekenen it reaches all the
 * way — there is no second kind of thing to stray into. A clock is a clock, and
 * a child who reaches for the stopwatch on it is one who can already read it.
 * De digitale klok blijft bij de digitale (ADR-257).
 */
export function klokPool(id: string): readonly KlokItem[] {
  const mix = isDigitaleKlokSet(id) ? KLOK_DIG_MIX_ID : KLOK_MIX_ID;
  return loadKlokSet(mix)?.items ?? [];
}
