import type { ComponentType } from 'react';
import {
  DiplomaIcon,
  FlagIcon,
  GatIcon,
  GlobeIcon,
  HalfUurIcon,
  KeerIcon,
  PinIcon,
  StarIcon,
  TafelIcon,
  UurIcon,
  VormenIcon,
  type IconProps,
} from '@/components/Icon';
import type { Module } from '@/features/shell/modules';

type Tekening = ComponentType<Omit<IconProps, 'children'>>;

/**
 * Het patroon op het vlak van een diploma en van zijn tegel (ADR-218,
 * ADR-219): twee tekeningen van het vak, om en om.
 */
export const PATROON: Record<Module['id'], readonly [Tekening, Tekening]> = {
  topo: [PinIcon, GlobeIcon],
  tafels: [TafelIcon, KeerIcon],
  klok: [UurIcon, HalfUurIcon],
  vlaggen: [FlagIcon, StarIcon],
  woorden: [GatIcon, VormenIcon],
  tijdvakken: [StarIcon, DiplomaIcon],
};
