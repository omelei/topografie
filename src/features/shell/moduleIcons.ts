import type { ComponentType } from 'react';
import type { IconProps } from '@/components/Icon';
import {
  KlokGlyph,
  RekenenGlyph,
  TaalGlyph,
  TijdvakkenGlyph,
  TopoGlyph,
  VlaggenGlyph,
} from '@/components/VakGlyph';
import type { Module } from './modules';

/**
 * A glyph per module: the Merk en stijlgids's own, filled, from docs/leer.js
 * (ADR-185). A subject's mark is the brand and not a control, so it is drawn
 * as the guide draws it on the subject's tile, while every other icon keeps
 * §E's line.
 *
 * Its own file rather than a constant inside the Shell, because the rail is no
 * longer the only place a module wears its own mark: K1's tiles carry it too,
 * and a second copy of this map is a second place to forget an eighth module.
 * It stays out of `modules.ts` so that the list of modules remains data a test
 * can read without rendering anything.
 */
export const MODULE_ICON: Record<Module['id'], ComponentType<Omit<IconProps, 'children'>>> = {
  topo: TopoGlyph,
  tafels: RekenenGlyph,
  klok: KlokGlyph,
  woorden: TaalGlyph,
  tijdvakken: TijdvakkenGlyph,
  vlaggen: VlaggenGlyph,
};
