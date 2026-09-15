/**
 * Drie goed op rij: het moment dat Brawl Stars en Duolingo allebei pakken.
 *
 * Dit product telde het al. `useRoundCore` en `practice/useRound` houden allebei
 * een `combo` bij, en alle vijf de rondeschermen zetten hem in de balk als
 * `×3` — alleen boven de 768 pixels, en aan het begin van elke ronde als `×0`.
 * Het keerde niets uit. Dat is dezelfde fout als de munten en de XP van
 * ADR-130, alleen dan zichtbaar: een getal dat oploopt en nergens toe leidt.
 *
 * Nu is het een gebeurtenis. Bij drie, zes en negen komt er een ring om het
 * maatje (`Maatje.tsx`), en de teller in de balk verschijnt pas vanaf drie —
 * daaronder telt hij naar iets toe dat nog niets is, en dat is precies wat een
 * `×0` zegt.
 *
 * **Drie en niet vijf.** Bij tachtig procent goed en rondes van tien vragen
 * valt dit zo'n twee keer per ronde, dus zes keer per dag van tien minuten. Dat
 * is de frequentie die het middengat vult: vaker dan een ster, zeldzamer dan
 * een antwoord. Bij vijf zou het één keer per twee rondes zijn en daarmee geen
 * ritme meer.
 *
 * **Erkenning, geen valuta.** Tien goed is een ster, altijd, voor iedereen. Dit
 * verandert daar niets aan en mag dat ook niet: twee kinderen die evenveel
 * oefenen eindigen met evenveel (ADR-097).
 */

/** Hoeveel goede antwoorden op rij er een ring opleveren. */
export const DREEF = 3;

/** Of deze stand van de teller er een is om iets van te zeggen. */
export function opDreef(combo: number): boolean {
  return combo > 0 && combo % DREEF === 0;
}
