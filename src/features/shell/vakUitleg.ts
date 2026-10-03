import type { TranslationKey } from '@/i18n';
import type { Module } from './modules';

/** Wat er in elk vak zit, in één regel. Tijdvakken is er nog niet en staat er niet. */
export const VAK_UITLEG: Record<Module['id'], TranslationKey> = {
  topo: 'home.vak.topo',
  tafels: 'home.vak.tafels',
  klok: 'home.vak.klok',
  woorden: 'home.vak.woorden',
  vlaggen: 'home.vak.vlaggen',
  tijdvakken: 'home.vak.topo',
};
