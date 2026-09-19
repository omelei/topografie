import type { Uitdrukking } from '@/components/Brandmark';

/**
 * De scène na een ronde, als een lijst beats (ADR-158).
 *
 * **Puur, en met opzet.** De volgorde, de geluiden en wat 'rustig' ermee doet
 * zijn de dingen die het eerst rotten, en ze zijn hier zonder DOM te toetsen.
 * De component voert alleen uit wat hier staat.
 *
 * Geen Web Animations API: jsdom kent `Element.animate` niet, en dan zou juist
 * de bewering die bewaakt moet worden — onder rustig is het dezelfde scène
 * zonder beweging — alleen te controleren zijn via de API die er niet is.
 *
 * **Rustig neemt duren weg en verder niets.** Dezelfde beats, dezelfde zinnen,
 * hetzelfde geluid, alleen elke duur nul. Dat is precies wat de twee tests
 * vastleggen.
 */

export type BeatId = 'toren' | 'stenen' | 'verdieping' | 'mijlpaal' | 'morgen' | 'reeks';

export interface Beat {
  readonly id: BeatId;
  /** Hoeveel ms deze beat duurt voordat de volgende begint. Nul bij rustig. */
  readonly duur: number;
  /** Het geluid bij het ingaan van deze beat, en nooit twee keer. */
  readonly geluid?: 'pagina';
  /** De uitdrukking die Denker vanaf hier draagt. */
  readonly denker: Uitdrukking;
}

export interface RondeInvoer {
  /** Wat deze ronde opleverde, op volgorde van verdienen. */
  readonly stenen: readonly string[];
  /** Er raakte een verdieping vol. */
  readonly verdiepingKlaar: boolean;
  /** Het ijkpunt dat gepasseerd werd, in woorden, of null. */
  readonly mijlpaal: string | null;
  /** Er komt ook een diploma: dat klinkt, en dan klinkt de verdieping niet. */
  readonly diploma: boolean;
  readonly vandaagKlaar: boolean;
  /** Stenen die morgen klaarliggen, voor de lege ronde. */
  readonly morgen: number;
  readonly rustig: boolean;
}

export interface Draaiboek {
  readonly beats: readonly Beat[];
  /** Ms tussen twee stenen. Nul bij één steen en bij rustig. */
  readonly perSteen: number;
  /** De hele scène in ms. Nul bij rustig, en nooit boven `MAX_SCENE`. */
  readonly totaal: number;
  /** Bij nul stenen is er geen scène, en dan valt er niets over te slaan. */
  readonly overslaanbaar: boolean;
}

/** De scène duurt nooit langer dan dit (ADR-142: beweging is kort). */
export const MAX_SCENE = 3200;

/** De veeg waarin de stenen binnenkomen duurt nooit langer dan dit. */
export const VEEG = 700;

const STEEN_DUUR = 180;
const TOREN_DUUR = 300;
const ZETTEN = 240;
const PAN = 420;
const MIJLPAAL = 420;
const REEKS = 120;

/**
 * Hoeveel ms er tussen twee stenen zit.
 *
 * De opdracht vroeg zestig milliseconden ertussen én een veeg van hoogstens
 * zevenhonderd, en die twee spreken elkaar tegen bij precies tien stenen:
 * 9 × 60 + 180 is 720. Eén formule lost dat op in plaats van een tweede regel
 * voor "meer dan tien": vijf stenen staan zestig uit elkaar, tien staan er
 * 57,8 uit elkaar, en twintig worden vanzelf de veeg.
 */
export function tussenruimte(aantal: number): number {
  if (aantal <= 1) return 0;
  return Math.min(60, (VEEG - STEEN_DUUR) / (aantal - 1));
}

export function draaiboek(invoer: RondeInvoer): Draaiboek {
  const rustig = invoer.rustig;
  const duur = (ms: number) => (rustig ? 0 : ms);
  const perSteen = rustig ? 0 : tussenruimte(invoer.stenen.length);

  // Geen stenen: geen scène. Wat er dan staat, is wat er morgen klaarligt — en
  // dat is geen animatie maar een toestand, dus het wordt nooit overgeslagen.
  if (invoer.stenen.length === 0) {
    return {
      beats: [
        { id: 'morgen', duur: duur(ZETTEN), denker: 'iets-nieuws' },
        { id: 'reeks', duur: duur(REEKS), denker: invoer.vandaagKlaar ? 'pauze' : 'iets-nieuws' },
      ],
      perSteen: 0,
      totaal: rustig ? 0 : ZETTEN + REEKS,
      overslaanbaar: false,
    };
  }

  const beats: Beat[] = [
    { id: 'toren', duur: duur(TOREN_DUUR), denker: 'oefenen' },
    {
      id: 'stenen',
      duur: duur(STEEN_DUUR + perSteen * (invoer.stenen.length - 1)),
      denker: 'oefenen',
    },
  ];

  if (invoer.verdiepingKlaar) {
    beats.push({
      id: 'verdieping',
      duur: duur(ZETTEN + PAN),
      denker: 'goed-gedaan',
      // Een diploma klinkt al, en twee geluiden over één moment is er één te
      // veel (ADR-142: één gebeurtenis en niet drie).
      ...(invoer.diploma ? {} : { geluid: 'pagina' as const }),
    });
  }

  if (invoer.mijlpaal !== null) {
    beats.push({ id: 'mijlpaal', duur: duur(MIJLPAAL), denker: 'goed-gedaan' });
  }

  const laatste = beats[beats.length - 1] as Beat;
  beats.push({
    id: 'reeks',
    duur: duur(REEKS),
    denker: invoer.vandaagKlaar ? 'pauze' : laatste.denker,
  });

  return {
    beats,
    perSteen,
    totaal: beats.reduce((som, beat) => som + beat.duur, 0),
    overslaanbaar: true,
  };
}
