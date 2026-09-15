import {
  GOED_PER_STER,
  STERREN_PER_KIST,
  goedInSter,
  goedTotKist,
  sterrenInKist,
} from '@/game-core';

/**
 * De ster, als gebeurtenis in plaats van als stand.
 *
 * Tien goede antwoorden zijn een ster en vijf sterren een kist — dat staat
 * sinds ADR-096 in `game-core/helden.ts`, het wordt bij elk antwoord opnieuw
 * waar, en **geen enkel scherm liet het zien**. `goedInSter`, `goedTotKist` en
 * `kistProgress` zijn drie pure functies die door niets werden aangeroepen;
 * `RoundOutcome.sterren` werd elke ronde uitgerekend en door niets gelezen. Dat
 * is dezelfde fout als de munten en de XP van ADR-130, alleen dan met iets dat
 * een kind wél had willen zien.
 *
 * Tussen het antwoord (elke twintig seconden) en de kist (elke vijftig goede
 * antwoorden, bij tien minuten per dag twee à drie dagen) zat daardoor niets.
 * De ster is de enige beloning in dit product die élke dag valt: ruim twee keer
 * per tien minuten.
 *
 * **Alleen na een goed antwoord.** Net als de klim van ADR-137: een fout
 * antwoord laat hier niets zien, want een teller die na een misser laat zien
 * hoe ver je nog moet, is een verwijt. Daarom hoeft deze functie ook niets van
 * de fase te weten — ze wordt alleen aangeroepen waar het antwoord goed was.
 *
 * Puur: er gaat een tellerstand in en er komt een stand uit. Geen klok, geen
 * database, geen toeval.
 */

export interface Sterstand {
  /** Alle goede antwoorden ooit, dit antwoord meegeteld. */
  readonly totaal: number;
  /** Hoeveel van de tien treden er gevuld zijn. */
  readonly vol: number;
  /** Hoeveel treden er zijn: tien. */
  readonly treden: number;
  /** Of dít antwoord de ster vol maakte. */
  readonly voltooid: boolean;
  /** De hoeveelste ster van de kist dit is, één tot vijf. */
  readonly ster: number;
  /** Hoeveel sterren een kist kost: vijf. */
  readonly sterrenPerKist: number;
  /** Goede antwoorden tot de kist, één tot vijftig. */
  readonly totKist: number;
}

export function sterstandVan(totaal: number): Sterstand {
  const veilig = Math.max(0, totaal);
  const voltooid = veilig > 0 && goedInSter(veilig) === 0;

  // Een volle ster staat vol en niet op nul. `goedInSter` telt modulo tien, dus
  // het tiende goede antwoord geeft nul — en dan zou de rij leeglopen op
  // precies het moment dat hij verdiend is, en ziet een kind zijn ster niet
  // aankomen maar verdwijnen. Vol blijven staan tot de volgende vraag is wat
  // een kind ziet gebeuren; de rij begint weer bij nul zodra er iets nieuws
  // gevraagd wordt.
  const vol = voltooid ? GOED_PER_STER : goedInSter(veilig);

  // Welke ster van de kist dit is. Bij een volle ster telt `sterrenInKist` al
  // door naar de volgende, dus staat hij daar één te laag: de vijfde ster van
  // een kist geeft nul, en dat is de eerste van de kist erna.
  const inKist = sterrenInKist(veilig);
  const ster = voltooid ? (inKist === 0 ? STERREN_PER_KIST : inKist) : inKist + 1;

  return {
    totaal: veilig,
    vol,
    treden: GOED_PER_STER,
    voltooid,
    ster,
    sterrenPerKist: STERREN_PER_KIST,
    totKist: goedTotKist(veilig),
  };
}
