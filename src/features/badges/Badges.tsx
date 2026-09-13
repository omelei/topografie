import { useEffect, useState, type ComponentType } from 'react';
import {
  BoltIcon,
  EilandIcon,
  FreezerIcon,
  PinIcon,
  ProvincieIcon,
  ShieldIcon,
  StadIcon,
  StreakIcon,
  TafelIcon,
  WaterIcon,
  type IconProps,
} from '@/components/Icon';
import { STAMPS, type StampId } from '@/game-core';
import { STAMP_NAME } from '@/features/reis/stampNames';
import type { Module } from '@/features/shell/modules';
import { t, type TranslationKey } from '@/i18n';
import { loadStamps } from '@/store/rewardStore';
import { Embleem } from './Embleem';

/**
 * Badges: what the ten travel stamps became (ADR-112).
 *
 * The same ten, earned by the same rules (`rewards.ts` still calls them
 * stamps, and the store still holds them under that name, so nothing a child
 * earned is lost). What changed is how they look and where they live: a round
 * emblem each, in the colour of the module it is about, with its drawing on it
 * — a province, an island, a table, a lightning bolt — on the child's own page
 * rather than on the collection page, which is hidden while it is thought
 * through again.
 *
 * Every badge says what earns it, earned or not. A reward a child cannot
 * explain is a riddle, and a child who does not know what earned it cannot
 * earn another one on purpose.
 */

type Tekening = ComponentType<Omit<IconProps, 'children'>>;

const BADGE: Record<StampId, { readonly icon: Tekening; readonly module: Module['id'] | null }> = {
  'provincies-foutloos': { icon: ProvincieIcon, module: 'topo' },
  'hoofdsteden-foutloos': { icon: PinIcon, module: 'topo' },
  'eilanden-foutloos': { icon: EilandIcon, module: 'topo' },
  'wateren-foutloos': { icon: WaterIcon, module: 'topo' },
  'steden-foutloos': { icon: StadIcon, module: 'topo' },
  'tafel-foutloos': { icon: TafelIcon, module: 'tafels' },
  'bliksem-tien': { icon: BoltIcon, module: null },
  'overleven-vijftien': { icon: ShieldIcon, module: null },
  'week-op-rij': { icon: StreakIcon, module: null },
  'set-onthouden': { icon: FreezerIcon, module: null },
};

/**
 * Whether a stored id is a badge this version can name. Stored rows outlive
 * the code that wrote them — "eerste-ronde" is retired and "set-vast" was
 * renamed — and a badge nobody can name is a blank line where a reward should
 * be.
 */
export function isBadge(id: string): id is StampId {
  return id in STAMP_NAME;
}

function uitleg(id: StampId): string {
  return t(`${STAMP_NAME[id]}.criterion` as TranslationKey);
}

/** All ten, the ones not earned yet as well, on the child's own page. */
export function BadgeSectie() {
  const [behaald, setBehaald] = useState<ReadonlySet<string> | null>(null);

  useEffect(() => {
    void loadStamps().then(setBehaald);
  }, []);

  // Nothing until it is known: a wall of ten gaps that then fills three has
  // told a child they had none.
  if (behaald === null) return null;

  const aantal = STAMPS.filter((stamp) => behaald.has(stamp.id)).length;

  return (
    <section className="flex flex-col gap-3" aria-label={t('badges.titel')}>
      <div className="tk-sectie">
        <h2>{t('badges.titel')}</h2>
        <span className="tk-sectie-meta">
          {t('badges.stand', { aantal, totaal: STAMPS.length })}
        </span>
      </div>

      <ul className="tk-badges">
        {STAMPS.map((stamp) => {
          const gehaald = behaald.has(stamp.id);
          const { icon, module } = BADGE[stamp.id];

          return (
            <li key={stamp.id} className="tk-badgekaart" data-gehaald={gehaald ? 'ja' : undefined}>
              <Embleem icon={icon} module={module} gehaald={gehaald} />
              <span className="tk-lijstrij-tekst">
                <span className="tk-lijstrij-titel">{t(STAMP_NAME[stamp.id])}</span>
                <span className="tk-lijstrij-regel">{uitleg(stamp.id)}</span>
                <span className="tk-stand-pil">
                  {gehaald ? t('badges.verdiend') : t('badges.nogNiet')}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** The badges one round earned, as rows in the list on its result screen. */
export function BadgeRijen({ ids }: { readonly ids: readonly StampId[] }) {
  return (
    <>
      {ids.map((id) => {
        const { icon, module } = BADGE[id];

        return (
          <li key={id}>
            <div className="tk-lijstrij">
              <Embleem icon={icon} module={module} gehaald klein />
              <span className="tk-lijstrij-tekst">
                <span className="tk-lijstrij-titel">
                  {t('result.newStamp', { naam: t(STAMP_NAME[id]) })}
                </span>
                <span className="tk-lijstrij-regel">{uitleg(id)}</span>
              </span>
            </div>
          </li>
        );
      })}
    </>
  );
}
