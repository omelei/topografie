import { activeChildId } from './children';
import { getSetting, setSetting } from './settings';

/**
 * De doelen van deze week, per kind (ADR-162).
 *
 * "Waar je voor gaat" was één doel, door het kind gekozen uit drie voorstellen,
 * en het liep net zo lang als het diploma dat het was — soms maanden. Dit is
 * kleiner en het is van de week: een handvol dingen die je je deze week
 * voorneemt, met de datums erbij, zodat "gehaald" iets is wat op zondag vaststaat
 * en niet iets wat ooit een keer gebeurt.
 *
 * **Ze worden zelf gemaakt**, door het kind op de voordeur. Er wordt niets
 * voorgesteld dat er dan al staat: een doel dat de app zelf stelt is een
 * opdracht, en dit blok gaat er juist over dat je hem zelf geeft.
 *
 * **En ze mogen er niet zijn.** `uit` zet het hele blok weg. Niet elk gezin wil
 * doelen, en een blok dat elke maandag opnieuw vraagt of je er een wilt, is een
 * zeurpiet. Aanzetten kan bij de instellingen op Jij (ADR-171).
 *
 * **Wat er bewaard wordt, is alleen de bedoeling.** Hoeveel rondes je deze week
 * deed, op hoeveel dagen, en welk diploma je hebt: dat staat al in `progress` en
 * `rewardStore` en wordt daar geteld. Een tweede kopie zou meteen gaan
 * scheellopen. Daarom geen voortgang in deze rij, en geen weeknummer: een doel
 * van "vier rondes" geldt elke week opnieuw, en wat er deze week van gehaald
 * is, wordt elke maandag vanzelf weer nul.
 *
 * Gelezen alsof een vreemde het schreef: een halve rij levert "geen doelen" op,
 * want de voordeur mag niet stukgaan op een instelling.
 */

/** Hoeveel doelen er tegelijk mogen staan. Een week is geen lijst met klusjes. */
export const MAX_DOELEN = 3;

/** Het grootste aantal dat een doel mag vragen, zodat "999 rondes" niet kan. */
const MAX_AANTAL = 99;

export type WeekdoelSoort = 'rondes' | 'dagen' | 'diploma';

export interface Weekdoel {
  readonly id: string;
  readonly soort: WeekdoelSoort;
  /** Bij `rondes` en `dagen`: hoeveel. Bij `diploma`: niet gebruikt, altijd 1. */
  readonly aantal: number;
  /** Bij `diploma`: welk diploma, als `diploma-tafel-7`. Anders null. */
  readonly diplomaId: string | null;
}

export interface Weekdoelen {
  /** Het blok staat uit: dit gezin wil geen doelen. */
  readonly uit: boolean;
  readonly doelen: readonly Weekdoel[];
}

export const GEEN_DOELEN: Weekdoelen = { uit: false, doelen: [] };

const sleutel = (kindId: string) => `weekdoelen:${kindId}`;

/** Alleen wat er als diploma uit kan zien; de rest is een halve rij. */
const DIPLOMA = /^diploma-[a-z0-9-]{1,40}$/;

function leesDoel(waarde: unknown): Weekdoel[] {
  if (typeof waarde !== 'object' || waarde === null) return [];
  const rij = waarde as Record<string, unknown>;
  const soort = rij.soort;
  if (soort !== 'rondes' && soort !== 'dagen' && soort !== 'diploma') return [];
  const id = typeof rij.id === 'string' ? rij.id : null;
  if (id === null) return [];

  if (soort === 'diploma') {
    const diplomaId = typeof rij.diplomaId === 'string' ? rij.diplomaId : '';
    if (!DIPLOMA.test(diplomaId)) return [];
    return [{ id, soort, aantal: 1, diplomaId }];
  }

  const aantal = typeof rij.aantal === 'number' ? Math.round(rij.aantal) : 0;
  if (!Number.isFinite(aantal) || aantal < 1 || aantal > MAX_AANTAL) return [];
  return [{ id, soort, aantal, diplomaId: null }];
}

function parse(ruw: string | undefined): Weekdoelen {
  if (!ruw) return GEEN_DOELEN;

  try {
    const waarde: unknown = JSON.parse(ruw);
    if (typeof waarde !== 'object' || waarde === null) return GEEN_DOELEN;
    const rij = waarde as Record<string, unknown>;
    const lijst = Array.isArray(rij.doelen) ? rij.doelen : [];
    return {
      uit: rij.uit === true,
      doelen: lijst.flatMap(leesDoel).slice(0, MAX_DOELEN),
    };
  } catch {
    return GEEN_DOELEN;
  }
}

export async function leesWeekdoelen(): Promise<Weekdoelen> {
  return parse(await getSetting(sleutel(await activeChildId())));
}

export async function schrijfWeekdoelen(stand: Weekdoelen): Promise<void> {
  await setSetting(sleutel(await activeChildId()), JSON.stringify(stand));
}
