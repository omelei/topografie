import {
  klokDigitaal,
  sumText,
  type Item,
  type KlokItem,
  type Schedulable,
  type SpellingItem,
  type SumItem,
  type VlagItem,
  type WerkwoordItem,
} from '@/game-core';
import { KlokFace } from '@/features/klok/KlokFace';
import { Vlag } from '@/features/vlaggen/Vlag';

/**
 * Wat er op een plaatje staat (ADR-149).
 *
 * Het plaatje ís de leerstof: de som, de wijzerplaat, de vlag, het woord. Een
 * kaart tekent topografie zelf (`AlbumKaart`); hier staat de rest, en de namen
 * van plekken waar geen kaart bij past, zoals in een mix.
 */

export function isVlagItem(item: Schedulable): item is VlagItem {
  return 'iso' in item && 'verhouding' in item;
}

export function isKlokItem(item: Schedulable): item is KlokItem {
  return 'uur' in item && 'minuut' in item;
}

function isSomItem(item: Schedulable): item is SumItem {
  return 'op' in item && 'links' in item && 'rechts' in item;
}

function isSpellingItem(item: Schedulable): item is SpellingItem {
  return 'woord' in item && 'gat' in item;
}

function isWerkwoordItem(item: Schedulable): item is WerkwoordItem {
  return 'infinitief' in item && 'antwoord' in item;
}

export function isTopoItem(item: Schedulable): item is Item {
  return 'naam' in item && 'regioSet' in item;
}

/** De naam van een plaatje, zoals een schermlezer en de achterkant hem noemen. */
export function plaatjeNaam(item: Schedulable): string {
  if (isVlagItem(item) || isTopoItem(item)) return item.naam;
  if (isKlokItem(item)) return klokDigitaal(item);
  if (isSomItem(item)) return sumText(item);
  if (isSpellingItem(item)) return item.woord;
  if (isWerkwoordItem(item)) return item.antwoord;
  return item.id;
}

/** Het beeld van een plaatje: een vlag, een wijzerplaat, of de som of het woord zelf. */
export function PlaatjeInhoud({ item }: { readonly item: Schedulable }) {
  if (isVlagItem(item)) return <Vlag vlag={item} alt="" />;
  if (isKlokItem(item)) return <KlokFace item={item} cijfers={false} />;
  return <span className="tk-plaatje-tekst">{plaatjeNaam(item)}</span>;
}
