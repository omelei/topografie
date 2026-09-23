/**
 * Waar een lang samengesteld woord mag breken (ADR-202).
 *
 * Een diplomategel is smal, en "Provincievlaggen" of "Waddeneilanden" liep
 * eruit. De browser kan Nederlands afbreken (`hyphens: auto`), maar niet overal
 * even goed, en in een smalle tegel moet het zeker zijn. Daarom krijgt een
 * woord hier een zacht afbreekstreepje vóór het tweede deel van een
 * samenstelling: onzichtbaar zolang het past, "provincie-" en "vlaggen" als
 * het niet past.
 *
 * Alleen de achterste delen die in de namen van de diploma's voorkomen, en
 * alleen als er ervoor nog minstens drie letters staan: "Steden" blijft heel.
 */
const ZACHT = '­';
const TWEEDE_DELEN = [
  'vlaggen',
  'eilanden',
  'woorden',
  'steden',
  'sommen',
  'klinkers',
  'landen',
  'wateren',
  'dubbelen',
];

const PATROON = new RegExp(`(\\p{L}{3,}?)(${TWEEDE_DELEN.join('|')})`, 'giu');

export function afbreekbaar(tekst: string): string {
  return tekst.replace(PATROON, `$1${ZACHT}$2`);
}
