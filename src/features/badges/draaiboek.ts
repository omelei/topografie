/**
 * De diploma-uitreiking, als een lijst beats.
 *
 * **Puur, en met opzet.** De volgorde, het geluid en wat 'rustig' ermee doet
 * zijn de dingen die het eerst rotten, en ze zijn hier zonder DOM te toetsen.
 * De component voert alleen uit wat hier staat.
 *
 * Geen Web Animations API: jsdom kent `Element.animate` niet, en dan zou juist
 * de bewering die bewaakt moet worden — onder rustig is het dezelfde scène
 * zonder beweging — alleen te controleren zijn via de API die er niet is.
 *
 * **Rustig neemt duren weg en verder niets.** Dezelfde beats, dezelfde zinnen,
 * hetzelfde geluid, alleen elke duur nul. Dat zijn de twee tests ernaast.
 */

export type BeatId = 'diploma' | 'soort' | 'naam' | 'ring' | 'wie' | 'denker' | 'knoppen';

export interface Beat {
  readonly id: BeatId;
  /** Hoeveel ms deze beat duurt voordat de volgende begint. Nul bij rustig. */
  readonly duur: number;
  /** Het geluid bij het ingaan van deze beat, en nooit twee keer. */
  readonly geluid?: 'diploma';
}

export interface Draaiboek {
  readonly beats: readonly Beat[];
  /** De hele scène in ms. Nul bij rustig, en nooit boven `MAX_SCENE`. */
  readonly totaal: number;
}

/**
 * De scène duurt nooit langer dan dit.
 *
 * ADR-142 legt beweging op vierhonderdtwintig milliseconden, en ADR-158 maakte
 * daar één uitzondering op: één scène op Ronde klaar van hoogstens 3,2 seconden.
 * De uitreiking neemt dat slot over en maakt het kleiner. Er komt geen tweede
 * uitzondering bij.
 */
export const MAX_SCENE = 3200;

const KOMT_BINNEN = 420;
const VERSCHIJNT = 180;
const VEERT = 240;

/**
 * De zeven beats, op volgorde.
 *
 * Het geluid is er precies één, en het is het diplomageluid dat er al was — het
 * klonk tot nu toe los op Ronde klaar. Nu hoort het bij het moment waarop het
 * zegel gedrukt wordt, want dát is het moment.
 *
 * Het diploma komt eerst leeg in beeld en vult zich daarna: soort, naam, en dan
 * het zegel dat gedrukt wordt — dat is het moment, en dat is het enige geluid.
 * Denker komt er pas daarna naast staan, want hij is de terugkoppeling en niet
 * de uitslag (ADR-159).
 *
 * De knoppen zijn de laatste beat, maar alleen in dekking: ze staan vanaf de
 * eerste frame in de documentvolgorde en zijn vanaf dan te gebruiken.
 */
export function draaiboek({ rustig }: { readonly rustig: boolean }): Draaiboek {
  const beats: readonly Beat[] = [
    { id: 'diploma', duur: KOMT_BINNEN },
    { id: 'soort', duur: VERSCHIJNT },
    { id: 'naam', duur: VERSCHIJNT },
    { id: 'ring', duur: VEERT, geluid: 'diploma' },
    { id: 'wie', duur: VERSCHIJNT },
    { id: 'denker', duur: VEERT },
    { id: 'knoppen', duur: VERSCHIJNT },
  ];

  if (rustig) {
    return { beats: beats.map((beat) => ({ ...beat, duur: 0 })), totaal: 0 };
  }
  return { beats, totaal: beats.reduce((som, beat) => som + beat.duur, 0) };
}
