import {
  gatLetters,
  werkwoordRegel,
  type SpellingItem,
  type WerkwoordItem,
  type WerkwoordRegel,
} from '@/game-core';
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

/**
 * The rule that makes a verb form, applied to this verb: "Hij, zij of het, dus
 * stam + t: word + t = wordt." What this module is for, the way "half acht" is
 * what the clock is for — worked out from the item's own fields, never stored.
 */
export function werkwoordRegelZin(item: WerkwoordItem): string {
  return regelZin(werkwoordRegel(item));
}

function regelZin(regel: WerkwoordRegel): string {
  switch (regel.soort) {
    case 'sterk':
      return t('taal.regel.sterk', { infinitief: regel.infinitief, vorm: regel.vorm });
    case 'tt-stam':
      return t(regel.achter ? 'taal.regel.ttAchter' : 'taal.regel.ttIk', { stam: regel.stam });
    case 'tt-t': {
      const jij = regel.persoon === 'jij';
      const key = regel.alT
        ? jij
          ? 'taal.regel.ttAlTJij'
          : 'taal.regel.ttAlTHij'
        : jij
          ? 'taal.regel.ttTJij'
          : 'taal.regel.ttTHij';
      return t(key, { stam: regel.stam, vorm: regel.vorm });
    }
    case 'tt-meervoud':
      return t('taal.regel.ttMeervoud', { vorm: regel.vorm });
    case 'vt': {
      const uitgang = `${regel.kofschip ? 't' : 'd'}e${regel.meervoud ? 'n' : ''}`;
      return t(regel.kofschip ? 'taal.regel.vtTe' : 'taal.regel.vtDe', {
        infinitief: regel.infinitief,
        letter: regel.letter,
        stam: regel.stam,
        uitgang,
        vorm: regel.vorm,
      });
    }
    case 'vd': {
      const eind = regel.kofschip ? 't' : 'd';
      const al = regel.stam.endsWith(eind);
      if (regel.voorvoegsel !== null) {
        return t(al ? 'taal.regel.vdZonderGeAl' : 'taal.regel.vdZonderGe', {
          voorvoegsel: regel.voorvoegsel,
          eind,
          vorm: regel.vorm,
        });
      }
      if (al) return t('taal.regel.vdAl', { eind, stam: regel.stam, vorm: regel.vorm });
      return t(regel.kofschip ? 'taal.regel.vdT' : 'taal.regel.vdD', {
        letter: regel.letter,
        infinitief: regel.infinitief,
        vorm: regel.vorm,
      });
    }
  }
}

/** The rule applied to the item a question is about, or null. */
export function regelVoor(vraag: TaalVraag): string | null {
  return vraag.soort === 'spelling' ? spellingRegel(vraag.item) : werkwoordRegelZin(vraag.item);
}

/**
 * The rule cards of Ontdekken for verbs, in the order they are taught: the
 * three ways of the tegenwoordige tijd, 't kofschip in the verleden tijd, the
 * voltooid deelwoord with and without ge-, and the strong verbs last.
 */
export type RegelKaart =
  | 'ik'
  | 'jijhij'
  | 'alT'
  | 'achter'
  | 'meervoud'
  | 'te'
  | 'de'
  | 'vdT'
  | 'vdD'
  | 'zonderGe'
  | 'sterk';

export const KAART_VOLGORDE: readonly RegelKaart[] = [
  'ik',
  'jijhij',
  'alT',
  'achter',
  'meervoud',
  'te',
  'de',
  'vdT',
  'vdD',
  'zonderGe',
  'sterk',
];

/** Which card a verb item is an example on. */
export function kaartVan(item: WerkwoordItem): RegelKaart {
  const regel = werkwoordRegel(item);
  switch (regel.soort) {
    case 'sterk':
      return 'sterk';
    case 'tt-stam':
      return regel.achter ? 'achter' : 'ik';
    case 'tt-t':
      return regel.alT ? 'alT' : 'jijhij';
    case 'tt-meervoud':
      return 'meervoud';
    case 'vt':
      return regel.kofschip ? 'te' : 'de';
    case 'vd':
      return regel.voorvoegsel !== null ? 'zonderGe' : regel.kofschip ? 'vdT' : 'vdD';
  }
}

export function kaartTitel(kaart: RegelKaart): string {
  return t(`taal.kaart.${kaart}` as TranslationKey);
}

export function kaartUitleg(kaart: RegelKaart): string {
  return t(`taal.kaart.${kaart}.uitleg` as TranslationKey);
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
