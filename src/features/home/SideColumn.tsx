import { useEffect, useState, type CSSProperties } from 'react';
import type { FlawlessRun, ModeId } from '@/game-core';
import { MODULE_ICON } from '@/features/shell/moduleIcons';
import { t, type TranslationKey } from '@/i18n';
import { loadAccuracy, loadPlayedRounds } from '@/store/progress';
import type { Accuracy } from '@/store/progress';
import { loadRun } from '@/store/streakStore';
import {
  favorieten,
  geplaatst,
  naamVan,
  startbareOnderdelen,
  type Gespeeld,
  type Onderdeel,
} from '@/features/module/onderdelen';
import { Blok } from './Blok';
import { ReeksBlok } from './ReeksBlok';
import { ToetsenBlok } from './ToetsenBlok';

/**
 * The child's own column: the tests that are coming, how many days in a row
 * they have practised, how the whole of it is going, and where they keep going
 * back to.
 *
 * It is the same column on every page inside the shell, because it is what the
 * app knows about the child, and that does not change when they walk into
 * topography. The front door lays the same blocks out itself — it puts them in
 * the flow of its own page below 1200 — so each block is exported on its own as
 * well as in this column (ADR-094).
 *
 * "Jouw voortgang" — the hero, the chest and the level — is not here any more
 * (ADR-112). It is hidden while it is thought through again; what a child earns
 * still accrues underneath, so nothing is lost the day it comes back.
 *
 * "Samen met" belongs at the foot of it. It is three friends, and there are
 * none until ADR-050's backend, so it is absent rather than empty.
 */
export function SideColumn({
  onReeks,
  onBegin,
}: {
  /** The way to the streak's own page, which is what the streak block leads to. */
  readonly onReeks: () => void;
  readonly onBegin: (deel: Onderdeel, mode: ModeId) => void;
}) {
  return (
    <aside className="tk-home-aside">
      <ToetsenBlok />
      <ReeksBlok onReeks={onReeks} />
      <GoedBlok />
      <FavorietenBlok onBegin={onBegin} />
    </aside>
  );
}

/**
 * Everything answered, ever, as one fraction.
 *
 * Deliberately not a retention figure, and worded so the two cannot be
 * confused. The ring is ink on the sunken tone rather than a material: this is
 * how the work is going, and a material is a reward (ADR-071).
 */
export function GoedBlok() {
  const [accuracy, setAccuracy] = useState<Accuracy | null>(null);
  const [run, setRun] = useState<FlawlessRun | null>(null);

  useEffect(() => {
    void loadAccuracy().then(setAccuracy);
    void loadRun().then(setRun);
  }, []);

  // Empty until it is known: a block that says nought and then changes its
  // mind has told a child something that was not true.
  if (accuracy === null) return <Blok titel={t('home.accuracyTitle')} bezig />;

  const procent =
    accuracy.answered === 0 ? 0 : Math.round((accuracy.correct / accuracy.answered) * 100);

  return (
    <Blok titel={t('home.accuracyTitle')}>
      {accuracy.answered === 0 ? (
        <p className="text-tekst-secundair">{t('home.accuracyNone')}</p>
      ) : (
        <div className="flex items-center gap-4">
          {/* Decorative: the figure beside it is the same number in words. */}
          <span
            className="tk-donut"
            style={{ '--vul': `${procent}%` } as CSSProperties}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="tk-procent">{`${procent}%`}</p>
            <p className="tk-hulp">
              {t('home.accuracyOf', { goed: accuracy.correct, totaal: accuracy.answered })}
            </p>
          </div>
        </div>
      )}

      {/* The other streak: correct answers in a row. Under the fraction, because
          it is the one number a single wrong answer takes away (ADR-072). */}
      {run !== null && run.beste > 0 ? (
        <p className="flex flex-wrap items-baseline gap-x-3 border-t border-rand-licht pt-3">
          <span className="tk-label">{t('home.runLabel')}</span>
          <span className="tk-display text-kaartkop tabular-nums">{run.nu}</span>
          <span className="tk-hulp">{t('home.runBest', { aantal: run.beste })}</span>
        </p>
      ) : null}
    </Blok>
  );
}

/** Where a child keeps going back to, one press away. */
export function FavorietenBlok({
  onBegin,
}: {
  readonly onBegin: (deel: Onderdeel, mode: ModeId) => void;
}) {
  const [gespeeld, setGespeeld] = useState<readonly Gespeeld[]>([]);

  useEffect(() => {
    void loadPlayedRounds().then((rondes) => setGespeeld(geplaatst(rondes, startbareOnderdelen())));
  }, []);

  const lijst = favorieten(gespeeld);

  return (
    <Blok titel={t('home.favouritesTitle')}>
      {lijst.length === 0 ? (
        <p className="text-tekst-secundair">{t('home.favouritesNone')}</p>
      ) : (
        <ul className="tk-favorieten">
          {lijst.map((favoriet) => {
            const ModuleIcon = MODULE_ICON[favoriet.deel.moduleId];

            return (
              <li key={`${favoriet.deel.setId}-${favoriet.mode}`}>
                <button
                  type="button"
                  data-module={favoriet.deel.moduleId}
                  className="tk-favoriet"
                  onClick={() => onBegin(favoriet.deel, favoriet.mode)}
                >
                  <span className="tk-plaat tk-plaat-klein">
                    <ModuleIcon size={20} />
                  </span>
                  <span className="tk-lijstrij-tekst">
                    <span className="tk-lijstrij-titel truncate">{naamVan(favoriet.deel)}</span>
                    <span className="tk-lijstrij-regel truncate">
                      {t(`mode.${favoriet.mode}` as TranslationKey)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Blok>
  );
}
