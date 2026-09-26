import type { ModeId } from '@/game-core';
import { t } from '@/i18n';

/**
 * What premium opens (ADR-111, ADR-112, ADR-116, ADR-122, ADR-192, ADR-224).
 *
 * Since ADR-192 the line is **oefenen tegen alles wat over weken gaat**. ADR-192
 * drew the free side as ontdekken and meerkeuze only; since ADR-224, on the
 * owner's instruction, it is **every way that teaches**, in every module:
 * ontdekken, zoeken (aanwijzen on the map, the clock or the flag that goes with
 * a name), meerkeuze and zelf typen. A child without a code can learn a subject
 * all the way; premium is what comes on top.
 *
 * Everything else is premium: the bliksemronde and overleven, the oefentoets,
 * every diploma — the tafeldiploma too, which ADR-122 had left
 * free — the child's own collected mistakes, and the child's own word lists.
 * Those are gated here and in `App`, where a round starts, so a way into a
 * round from anywhere meets the same rule; the rest is gated where it is drawn,
 * each with the same slot (`PremiumSlot`). The rows on Vandaag and an
 * unfinished round turn a premium way into the set's first free way instead of
 * a lock (`vrijeVorm`).
 *
 * What stays free besides practising: the result of the round just played,
 * "Herhaal je fouten", "klaar voor vandaag" (ADR-149), finishing a round, the
 * way back after a break, three children on a device (ADR-173), and the ring on
 * every diploma, so a child sees what there is to earn (ADR-192).
 */
const GRATIS_VORMEN: ReadonlySet<ModeId> = new Set<ModeId>([
  // Ontdekken: the first meeting with an item, which asks nothing and so can
  // never be the thing a child is turned away from (ADR-122).
  'ontdekken',
  // Meerkeuze. On Taal: the letters of the gap, one of three forms, or one of
  // four English words (ADR-217).
  'meerkeuze',
  'som-meerkeuze',
  'klok-meerkeuze',
  'vlag-meerkeuze',
  'taal-letters',
  'taal-vorm-kiezen',
  'taal-engels-kiezen',
  // Zoeken and zelf typen, premium from ADR-192 until ADR-224. On Taal typing
  // is the flitsdictee, the typed verb form and the typed English word.
  'wijs-aan',
  'klok-welke-klok',
  'vlag-zoeken',
  'hoe-heet-dit',
  'som-typen',
  'klok-typen',
  'taal-flitsdictee',
  'taal-vorm-typen',
  'taal-engels-typen',
]);

/** A way of practising that is premium. The oefentoets is its own tile. */
export function isPremiumVorm(id: ModeId): boolean {
  return !GRATIS_VORMEN.has(id);
}

/**
 * A child's own collected list of mistakes, in any module: rekenen's `fouten`,
 * and `*-fouten`. Premium because it is a record kept across rounds. And the
 * child's own word lists (the `eigen-lijsten` subject and its `taal-eigen-*`
 * sets): the lists are made on Jij with premium, and without it the subject is
 * a lock rather than a page whose only way is premium (ADR-192).
 *
 * Not to be confused with "Herhaal je fouten" on the result page, which is free
 * since ADR-122: that one asks about the round that just ended and nothing
 * else, so it belongs to the round rather than to the record.
 */
export function isPremiumOnderwerp(id: string): boolean {
  return (
    id === 'fouten' ||
    id.endsWith('-fouten') ||
    id === 'eigen-lijsten' ||
    id.startsWith('taal-eigen-')
  );
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
