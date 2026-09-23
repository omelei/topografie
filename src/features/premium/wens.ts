import { isDiplomaVorm, type ModeId } from '@/game-core';
import { isPremiumOnderwerp } from '@/features/module/premium';
import { naamVan, type Onderdeel } from '@/features/module/onderdelen';
import { t, type TranslationKey } from '@/i18n';

/**
 * Hoe een wens heet (ADR-193): wat een kind wilde doen, in de woorden van het
 * venster en van de ouderpagina. "Bliksemronde bij Provincies", "Het diploma
 * Tafel van 7", "De oefentoets bij Europa".
 */
export function wensVoor(deel: Onderdeel, mode: ModeId, toetsstand = false): string {
  const naam = naamVan(deel);
  if (isDiplomaVorm(mode)) return t('wens.diploma', { naam });
  if (toetsstand) return t('wens.oefentoets', { naam });
  if (isPremiumOnderwerp(deel.setId)) return naam;
  return t('wens.vorm', { vorm: t(`mode.${mode}` as TranslationKey), naam });
}
