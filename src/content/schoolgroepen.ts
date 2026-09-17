import { isGroep, type Groep } from '@/game-core';
import tabel from '../../content/schoolgroepen.json';
import leerdoelen from '../../content/leerdoelen.json';

/**
 * Bij welke groepen een set past, gelezen uit de content (ADR-151).
 *
 * Dit is de enige plek die weet waar dat staat. Er zijn drie bronnen, en een
 * set heeft er hoogstens één:
 *
 * - **De koppeltabel** (`content/schoolgroepen.json`) voor rekenen, klokkijken
 *   en vlaggen. Die sets dragen alleen een `niveau`, en een niveau is geen
 *   groep: tafel 7 is niveau 3 omdat hij laat komt, niet omdat hij bij groep 8
 *   hoort. De tabel is onze eigen indeling en zegt dat ook (ADR-011).
 * - **Het veld `groep` per item**, bij Taal. Een set is dan alle groepen van
 *   zijn woorden.
 * - **De leerdoelen per item**, bij topografie: elk leerdoel in
 *   `leerdoelen.json` heeft een `leerjaar` ("groep6"), en een set is alle
 *   leerjaren van de leerdoelen van zijn plaatsen.
 *
 * Wat daar niet uit volgt, heeft geen groepen: een eigen lijst van een ouder,
 * een foutenlijst, een mix die niet in de tabel staat. `pastBijGroep` maakt
 * daar `neutraal` van, en neutraal staat nooit onder "Voor later".
 *
 * Geen React en geen `import.meta.glob`, zodat de contenttest dit zelf kan
 * lezen.
 */

const TABEL: Readonly<Record<string, readonly number[]>> = tabel.sets;

const LEERJAAR = new Map<string, readonly Groep[]>(
  leerdoelen.leerdoelen.map((doel): [string, readonly Groep[]] => [
    doel.id,
    doel.leerjaar.map((jaar) => Number(/^groep(\d)$/.exec(jaar)?.[1])).filter(isGroep),
  ]),
);

/** De sets in de koppeltabel, voor de contenttest. */
export function setsInTabel(): readonly string[] {
  return Object.keys(TABEL);
}

/**
 * Een mix of een foutenlijst is geen stof van een groep: hij is de andere sets
 * door elkaar, of wat dit kind fout had. `keer-10` is formeel een mix maar
 * staat als eigen keuze op de pagina, en staat daarom in de tabel; de tabel
 * gaat voor.
 */
function isSamengesteld(setId: string, mix: boolean): boolean {
  return mix || /(^|-)fouten$/.test(setId);
}

export function groepenVanSet(
  setId: string,
  items: readonly object[],
  mix = false,
): readonly Groep[] | undefined {
  const uitTabel = TABEL[setId];
  if (uitTabel) return uitTabel.filter(isGroep);
  if (isSamengesteld(setId, mix)) return undefined;

  const groepen = new Set<Groep>();
  for (const item of items) {
    const { groep, leerdoelen: doelen } = item as { groep?: unknown; leerdoelen?: unknown };
    if (isGroep(groep)) groepen.add(groep);
    if (Array.isArray(doelen)) {
      for (const doel of doelen) for (const jaar of LEERJAAR.get(doel) ?? []) groepen.add(jaar);
    }
  }

  return groepen.size === 0 ? undefined : [...groepen].sort((a, b) => a - b);
}
