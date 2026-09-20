import type { TopoDiplomaSet } from '@/game-core';
import type { TranslationKey } from '@/i18n';

/**
 * The name on each topodiploma (ADR-117): the word the subject tile uses at
 * home, and the werelddeel further out, where the only thing on the map is its
 * countries. Shared by the wall and by the result screen, so a diploma is
 * called the same thing where it is earned and where it hangs.
 */
export const KAART_NAAM: Record<TopoDiplomaSet, TranslationKey> = {
  'nl-provincies': 'onderwerp.provincies',
  'nl-hoofdsteden': 'onderwerp.steden.kortHoofd',
  'nl-steden': 'onderwerp.steden',
  'nl-wateren': 'onderwerp.wateren',
  'nl-waddeneilanden': 'onderwerp.eilanden',
  'europa-landen': 'regio.europa',
  'afrika-landen': 'regio.afrika',
  'azie-landen': 'regio.azie',
  'noord-amerika-landen': 'regio.noord-amerika',
  'zuid-amerika-landen': 'regio.zuid-amerika',
  'oceanie-landen': 'regio.oceanie',
  'wereld-landen': 'regio.wereld',
};
