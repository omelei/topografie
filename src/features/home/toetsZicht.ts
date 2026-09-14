import type { ItemState } from '@/game-core';
import { isPremiumOnderwerp } from '@/features/module/premium';
import type { Onderdeel } from '@/features/module/onderdelen';

/**
 * Waar een toets over gaat, voor zover dit kind het al geoefend heeft (ADR-127).
 *
 * Een toets wordt gezet op een vak en niet op een set — "topo, 3 oktober" —
 * want dat is wat een ouder weet op het moment dat de brief van school op tafel
 * ligt. De voorspelling gaat daarom over alles van dat vak waar dit kind een
 * Leitner-stand voor heeft: wat het geoefend heeft, is waar de toets voor hem
 * over gaat.
 *
 * Dezelfde twee uitzonderingen als het dagplan. Een **mix** is de andere sets
 * bij elkaar, dus zijn onderdelen staan er al in en meetellen zou ze dubbel
 * wegen. Een **foutenlijst** is een dwarsdoorsnede, geen set. En onderdelen
 * zonder stand tellen niet: die zijn nooit gezien, en een voorspelling over wat
 * je nooit geoefend hebt is nul procent met een percentageteken eraan.
 */
export function toetsOnderdelen(
  moduleId: string | null,
  alles: readonly Onderdeel[],
  states: ReadonlyMap<string, ItemState>,
): readonly string[] {
  if (moduleId === null) return [];

  const ids = new Set<string>();
  for (const deel of alles) {
    if (deel.moduleId !== moduleId || deel.mix || isPremiumOnderwerp(deel.setId)) continue;
    for (const item of deel.items) {
      if (states.has(item.id)) ids.add(item.id);
    }
  }
  return [...ids];
}
