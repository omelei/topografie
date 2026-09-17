import { useEffect, useState } from 'react';
import { NextIcon } from '@/components/Icon';
import {
  aanDeBeurt,
  isDue,
  minutenVoor,
  TERUGKOMST_DAGEN,
  type ItemState,
  type ModeId,
} from '@/game-core';
import { isPremiumOnderwerp } from '@/features/module/premium';
import { startbareOnderdelen, type Gespeeld, type Onderdeel } from '@/features/module/onderdelen';
import { t } from '@/i18n';
import { loadItemStates, type PlayedRound } from '@/store/progress';
import { vormVoor } from './useVandaag';

/** De eerste ronde na een tijd weg: kort, zodat hij makkelijk af te maken is. */
const EERSTE_RONDE = 9;

const DAG_MS = 86_400_000;

/**
 * Terugkomen na weken (ADR-149).
 *
 * Wie twee weken of langer geen ronde deed, wordt begroet als iemand die
 * terugkomt, niet als iemand die iets miste. Er staat geen aantal gemiste dagen
 * en er is niets weg: het album staat er nog. Wel hoeveel plaatjes even
 * opgefrist willen worden, en hoe lang de eerste ronde duurt.
 *
 * **De eerste ronde is kort en makkelijk.** Negen vragen, uit de set met de
 * meeste plaatjes die terug moeten komen, en de sterkste eerst: wie drie weken
 * weg was, haalt anders op de eerste dag maar de helft goed (model in het
 * concept), en dat is een slechte eerste dag terug. Elke opfrisser in doos vijf
 * levert bovendien een stempel op.
 */
export function TerugBlok({
  played,
  gespeeld,
  onVerder,
}: {
  readonly played: readonly PlayedRound[];
  readonly gespeeld: readonly Gespeeld[];
  readonly onVerder: (deel: Onderdeel, mode: ModeId, ids: readonly string[]) => void;
}) {
  const [states, setStates] = useState<ReadonlyMap<string, ItemState> | null>(null);

  useEffect(() => {
    void loadItemStates().then(setStates);
  }, []);

  const laatste = played[0]?.at;
  if (states === null || laatste === undefined) return null;

  const now = new Date();
  const weg = Math.floor((now.getTime() - new Date(laatste).getTime()) / DAG_MS);
  if (weg < TERUGKOMST_DAGEN) return null;

  const aantal = aanDeBeurt([...states.keys()], states, now);
  if (aantal === 0) return null;

  const eerste = eersteRonde(states, now);
  if (eerste === null) return null;
  const minuten = minutenVoor(eerste.ids.length);

  return (
    <section className="tk-lijstrij tk-terug" aria-label={t('terug.titel')}>
      <span className="tk-lijstrij-tekst">
        <span className="tk-lijstrij-titel">{t('terug.zin')}</span>
        <span className="tk-lijstrij-regel">
          {aantal === 1 ? t('terug.opfrissenEen') : t('terug.opfrissen', { aantal })}{' '}
          {minuten === 1 ? t('terug.minuutEen') : t('terug.minuten', { minuten })}
        </span>
      </span>
      <button
        type="button"
        className="tk-button"
        onClick={() => onVerder(eerste.deel, vormVoor(eerste.deel, gespeeld), eerste.ids)}
      >
        <NextIcon size={20} />
        {t('terug.knop')}
      </button>
    </section>
  );
}

/** De set met de meeste plaatjes die terug moeten, en daaruit de sterkste negen. */
function eersteRonde(
  states: ReadonlyMap<string, ItemState>,
  now: Date,
): { readonly deel: Onderdeel; readonly ids: readonly string[] } | null {
  let beste: { deel: Onderdeel; ids: string[]; aantal: number } | null = null;
  for (const deel of startbareOnderdelen()) {
    if (deel.mix || isPremiumOnderwerp(deel.setId)) continue;
    const terug = deel.items
      .map((item) => states.get(item.id))
      .filter((state): state is ItemState => state !== undefined && state.laatsteReview !== null)
      .filter((state) => isDue(state, now));
    if (terug.length > 0 && (beste === null || terug.length > beste.aantal)) {
      const ids = [...terug]
        .sort((a, b) => b.box - a.box)
        .slice(0, EERSTE_RONDE)
        .map((state) => state.itemId);
      beste = { deel, ids, aantal: terug.length };
    }
  }
  return beste === null ? null : { deel: beste.deel, ids: beste.ids };
}
