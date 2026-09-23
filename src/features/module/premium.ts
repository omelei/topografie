import type { ModeId } from '@/game-core';
import { t } from '@/i18n';

/**
 * What premium opens (ADR-111, ADR-112, ADR-116, ADR-122, ADR-192).
 *
 * Since ADR-192 the line is **oefenen tegen alles wat over weken gaat**, drawn
 * tighter than ADR-122 drew it, on the owner's instruction. Free is the
 * gentlest practice there is, in every module: **ontdekken**, where a child
 * meets an item before anybody asks them anything, and **meerkeuze**, where the
 * answer is one of four in front of them. On Taal that is choosing the letters
 * of the gap, or one of three verb forms.
 *
 * Everything else is premium: finding the place, the clock or the flag that
 * goes with a name (zoeken), typing the answer, the bliksemronde and overleven,
 * the oefentoets, every diploma — the tafeldiploma too, which ADR-122 had left
 * free — the child's own collected mistakes, and more than one child. Those
 * are gated here and in `App`, where a round starts, so a way into a round
 * from anywhere — a favourite, the history, an unfinished round — meets the
 * same rule; the rest is gated where it is drawn, each with the same slot
 * (`PremiumSlot`).
 *
 * What stays free besides practising: "klaar voor vandaag" (ADR-149), and the
 * ring on every diploma, so a child sees what there is to earn (ADR-192).
 */
const GRATIS_VORMEN: ReadonlySet<ModeId> = new Set<ModeId>([
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
