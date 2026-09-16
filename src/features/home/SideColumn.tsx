import { useEffect, useState } from 'react';
import type { ModeId } from '@/game-core';
import { MODULE_ICON } from '@/features/shell/moduleIcons';
import { t, type TranslationKey } from '@/i18n';
import { loadPlayedRounds } from '@/store/progress';
import {
  favorieten,
  geplaatst,
  naamVan,
  startbareOnderdelen,
  type Gespeeld,
  type Onderdeel,
} from '@/features/module/onderdelen';
import { useDesk } from '@/features/shell/useSmallScreen';
import { Blok } from './Blok';
import { ReeksBlok } from './ReeksBlok';
import { ToetsenBlok } from './ToetsenBlok';

/**
 * The child's own column: the tests that are coming, how many days in a row
 * they have practised, and where they keep going back to.
 *
 * It is the same column on every page inside the shell, because it is what the
 * app knows about the child, and that does not change when they walk into
 * topography. The front door lays the same blocks out itself, so each block is
 * exported on its own as well as in this column (ADR-094).
 *
 * **Only beside the page, from 1200** (ADR-119). Below that the column used to
 * go into the flow of every page, under the work, and on a phone or a tablet it
 * was four blocks to scroll past on the way to nothing. The owner asked for it
 * to go there. The front door keeps the tests below 1200, because they are the
 * one block that is also where a test is planned.
 *
 * "Jouw voortgang" — the hero, the chest and the level — is not here any more
 * (ADR-112). It is hidden while it is thought through again; what a child earns
 * still accrues underneath, so nothing is lost the day it comes back.
 *
 * "Samen met" belongs at the foot of it. It is three friends, and there are
 * none until ADR-050's backend, so it is absent rather than empty.
 *
 * **"Goed beantwoord" staat er niet meer** (ADR-148). Het is een getal over hoe
 * het oefenen gaat, en die staan op Onthouden bij elkaar; in een kolom die op
 * élke pagina meegaat stond het ook naast diezelfde pagina.
 */
export function SideColumn({
  onReeks,
  onBegin,
  vanOuder = false,
}: {
  /** The way to the streak's own page, which is what the streak block leads to. */
  readonly onReeks: () => void;
  readonly onBegin: (deel: Onderdeel, mode: ModeId) => void;
  /**
   * Op de ouderpagina (ADR-143). Daar stonden alle vier de blokken, elk met een
   * kop die begint met "Jouw" — een ouder die "Voor ouders" opende werd in de
   * kolom ernaast aangesproken alsof hij het kind was, met zijn reeks, zijn
   * cijfer en zijn favorieten.
   *
   * De toetsen blijven staan, en dat is geen uitzondering maar de regel die
   * eronder ligt: een toetsdatum wordt door de ouder ingevoerd. De andere twee
   * gaan over hoe het kind het doet, en die staan op de pagina's van het kind.
   */
  readonly vanOuder?: boolean;
}) {
  const desk = useDesk();
  if (!desk) return null;

  return (
    <aside className="tk-home-aside">
      <ToetsenBlok />
      {vanOuder ? null : (
        <>
          <ReeksBlok onReeks={onReeks} />
          <FavorietenBlok onBegin={onBegin} />
        </>
      )}
    </aside>
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
