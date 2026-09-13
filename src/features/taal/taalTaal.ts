import { gatLetters, type SpellingItem } from '@/game-core';
import { taalSetVanItem } from '@/content/loadTaal';
import { t, type TranslationKey } from '@/i18n';
import type { TaalVraag } from './useTaalRound';

/**
 * Taal's sentences about a rule, put together from an item (ADR-118).
 *
 * The rules are game-core's and the words are here, the split the clock makes
 * between `klokVorm` and `klokTaal` (ADR-092): which rule applied to which
 * letters is worked out; how it is said is copy, and copy lives in `i18n`.
 */

/**
 * Letters one at a time: "e, i". What a screen reader has to hear for a letter
 * piece, because "ei" and "ij" are one sound out loud and the difference is
 * the whole question.
 */
export function gespeld(letters: string): string {
  return [...letters].join(', ');
}

/** The key of a spelling set without its prefix: `taal-sp-eiij` → `eiij`. */
function setSleutel(itemId: string): string {
  return (taalSetVanItem(itemId) ?? '').replace(/^taal-sp-/, '');
}

/** The sets where no rule helps and the picture of the word is the lesson. */
const ONTHOUD = ['eiij', 'auou', 'gch', 'ck'];

const VERKLEIN: Record<string, TranslationKey> = {
  je: 'taal.regel.vk.je',
  tje: 'taal.regel.vk.tje',
  pje: 'taal.regel.vk.pje',
  etje: 'taal.regel.vk.etje',
};

/**
 * The rule of a spelling item's set, applied to this word: "Maak het woord
 * langer: honden. Je hoort een d, dus je schrijft een d."
 */
export function spellingRegel(item: SpellingItem): string | null {
  const sleutel = setSleutel(item.id);
  const letters = gatLetters(item);
  const hulp = item.hulp ?? item.woord;

  if (ONTHOUD.includes(sleutel)) return t('taal.regel.onthoud', { woord: item.woord, letters });
  if (sleutel === 'dt') return t('taal.regel.dt', { hulp, letter: letters });
  if (sleutel === 'klinkers') {
    return t(letters.length > 1 ? 'taal.regel.klinkerTwee' : 'taal.regel.klinkerEen', {
      hulp,
      letters,
    });
  }
  if (sleutel === 'medeklinkers') {
    return t(letters.length > 1 ? 'taal.regel.medeTwee' : 'taal.regel.medeEen', {
      hulp,
      letters,
    });
  }
  if (sleutel === 'verkleinwoorden') {
    const key = VERKLEIN[letters];
    return key ? t(key, { woord: item.woord }) : null;
  }
  if (sleutel === 'ig') return t('taal.regel.ig', { woord: item.woord });
  if (sleutel === 'lijk') return t('taal.regel.lijk', { woord: item.woord });
  return null;
}

/** The rule applied to the item a question is about, or null. */
export function regelVoor(vraag: TaalVraag): string | null {
  return vraag.soort === 'spelling' ? spellingRegel(vraag.item) : null;
}

/** What a spelling set's Ontdekken says above its words: the rule, in general. */
export function setUitleg(setId: string): string | null {
  const sleutel = setId.replace(/^taal-sp-/, '');
  const key = `taal.uitleg.${sleutel}`;
  return key in UITLEG ? t(key as TranslationKey) : null;
}

/** The sets that have a rule to say above their words, by key. */
const UITLEG: Readonly<Record<string, true>> = {
  'taal.uitleg.eiij': true,
  'taal.uitleg.auou': true,
  'taal.uitleg.gch': true,
  'taal.uitleg.ck': true,
  'taal.uitleg.dt': true,
  'taal.uitleg.klinkers': true,
  'taal.uitleg.medeklinkers': true,
  'taal.uitleg.verkleinwoorden': true,
  'taal.uitleg.ig': true,
  'taal.uitleg.lijk': true,
};
