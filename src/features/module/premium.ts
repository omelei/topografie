import type { ModeId } from '@/game-core';
import { t } from '@/i18n';

/**
 * What premium opens (ADR-111, ADR-112, ADR-116, ADR-122).
 *
 * Since ADR-122 the line is drawn between **oefenen** and **onthouden**.
 * Practising is free, all of it: finding the place, the clock or the flag that
 * goes with a name, meerkeuze, typing the answer, and — new — **ontdekken**,
 * which is where a child meets an item before anybody asks them anything. So
 * is the **tafeldiploma**, the one diploma a child can earn without a code.
 *
 * What premium opens is the part that works over weeks rather than inside one
 * round: the Onthouden page, the child's own collected mistakes, the
 * oefentoets, the other three diplomas, "Goed beantwoord", more than one child, and the two ways that only mean something
 * once you already know it — the bliksemronde (a check on speed) and overleven
 * (a check on holding it). Those are gated here and in `App`, where a round
 * starts, so a way into a round from anywhere — a favourite, the history, an
 * unfinished round — meets the same rule; the rest is gated where it is drawn,
 * each with the same slot (`PremiumSlot`).
 *
 * The album, the weekkaart and "klaar voor vandaag" are free (ADR-149): what a
 * child remembers, and when today is done, are the child's to see.
 */
const GRATIS_VORMEN: ReadonlySet<ModeId> = new Set<ModeId>([
  // Zoeken: on the map the name is given and the child finds the place.
  'wijs-aan',
  'klok-welke-klok',
  'vlag-zoeken',
  // Ontdekken: the first meeting with an item, which asks nothing and so can
  // never be the thing a child is turned away from (ADR-122).
  'ontdekken',
  // Meerkeuze. On Taal: the letters of the gap, or one of three forms.
  'meerkeuze',
  'som-meerkeuze',
  'klok-meerkeuze',
  'vlag-meerkeuze',
  'taal-letters',
  'taal-vorm-kiezen',
  // Zelf typen. On Taal: the flitsdictee, and the verb form typed (ADR-118).
  'hoe-heet-dit',
  'som-typen',
  'klok-typen',
  'taal-flitsdictee',
  'taal-vorm-typen',
  // The one diploma that is free (ADR-122): the tafeltoets is the thing a
  // Dutch child already wants before they meet this app, and it is the moment
  // a parent photographs. The other three stay premium.
  'tafeldiploma',
]);

/** A way of practising that is premium. The oefentoets is its own tile. */
export function isPremiumVorm(id: ModeId): boolean {
  return !GRATIS_VORMEN.has(id);
}

/**
 * A child's own collected list of mistakes, in any module: rekenen's `fouten`,
 * and `*-fouten`. Premium because it is a record kept across rounds.
 *
 * Not to be confused with "Herhaal je fouten" on the result page, which is free
 * since ADR-122: that one asks about the round that just ended and nothing
 * else, so it belongs to the round rather than to the record.
 */
export function isPremiumOnderwerp(id: string): boolean {
  return id === 'fouten' || id.endsWith('-fouten');
}

/**
 * An accessible name with the label on the end, so a screen reader hears it
 * after what the tile is — the name still leads, and a query anchored on it
 * still finds it.
 *
 * **Zonder code zegt hij wat indrukken doet** (ADR-125, ADR-163). Een
 * premiumtegel is niet uitgeschakeld: hij opent de vraag aan de ouders. Op het
 * scherm is dat te zien — er komt een venster overheen — maar het woord
 * "Premium" op zichzelf zei nergens dat een druk iets anders doet dan kiezen,
 * en wie met een schermlezer werkt stond ineens in een venster zonder dat iets
 * dat had aangekondigd.
 */
export function metPremium(label: string, premium: boolean, actief = true): string {
  if (!premium) return label;
  return actief ? `${label}. ${t('premium.label')}` : `${label}. ${t('premium.tegelSlot')}`;
}
