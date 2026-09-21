import { useSyncExternalStore } from 'react';

/**
 * Of de profielwisselaar openstaat (ADR-173).
 *
 * Precies de vorm van `ouderVraag.ts`, en om precies dezelfde reden. De knop
 * staat in de balk, die diep in de `Shell` zit; het venster hoort in de toplaag
 * naast de app te staan, zodat er één van is in plaats van één per tak van
 * `App`. Een schakelaar waar één component naar luistert, verbindt die twee
 * zonder een callback door zes schermen te rijgen.
 *
 * **Geen adres**, met opzet. Dit venster staat over de pagina waar je was, en
 * wie het wegklikt hoort daar nog te staan. Een adres zou van wegklikken een
 * stap terug maken, en dan zet de systeem-terugknop op een telefoon je twee
 * stappen terug in plaats van één.
 */

/**
 * Dicht, op de lijst, of meteen op de deur naar de ouder.
 *
 * Die derde bestaat omdat de premiumpagina er een knop naartoe heeft: het
 * codeveld staat daar niet meer (ADR-173), en "Ik ben een ouder" hoort dan in
 * één druk bij het slot uit te komen in plaats van bij een lijst met namen
 * waar de ouder niets mee moet.
 */
export type Wisselstand = 'dicht' | 'lijst' | 'slot';

let stand: Wisselstand = 'dicht';
const luisteraars = new Set<() => void>();

function meld(): void {
  for (const luisteraar of luisteraars) luisteraar();
}

export function openWisselaar(doel: Exclude<Wisselstand, 'dicht'> = 'lijst'): void {
  if (stand === doel) return;
  stand = doel;
  meld();
}

export function sluitWisselaar(): void {
  if (stand === 'dicht') return;
  stand = 'dicht';
  meld();
}

export function useWisselaar(): Wisselstand {
  return useSyncExternalStore(
    (luisteraar) => {
      luisteraars.add(luisteraar);
      return () => luisteraars.delete(luisteraar);
    },
    () => stand,
    () => 'dicht' as Wisselstand,
  );
}
