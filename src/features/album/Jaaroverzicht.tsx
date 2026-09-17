import { useEffect, useState } from 'react';
import {
  laagVan,
  schooljaarBegin,
  schooljaarVan,
  stempelsVan,
  type ItemState,
} from '@/game-core';
import { doelwitten } from '@/features/home/doel';
import { naamVan, onderdelen } from '@/features/module/onderdelen';
import { t } from '@/i18n';
import { leesBijhouden } from '@/store/bijhoudStore';
import { getActiveChild } from '@/store/children';
import { loadItemStates } from '@/store/progress';
import { loadDiplomaRijen } from '@/store/rewardStore';
import { leesWeek } from '@/store/weekStore';

interface Overzicht {
  readonly naam: string;
  readonly schooljaar: number;
  readonly zegels: number;
  readonly weken: number;
  readonly kleur: number;
  readonly lijst: number;
  readonly stempels: number;
  readonly diplomas: readonly { readonly naam: string; readonly bijgehouden: number }[];
}

/**
 * Het jaaroverzicht, om te laten zien of te printen (ADR-149).
 *
 * Wat dit schooljaar opleverde, in vijf regels: de weken met een zegel, de
 * plaatjes in kleur, de stevige, de stempels, en de diploma's met hun
 * bijhoudstempels. Geen cijfer en geen vergelijking: dit is een album, geen
 * rapport.
 *
 * Printen gebruikt de printer van de browser. Alleen dit overzicht komt op
 * papier (`data-print`), zonder de rest van de pagina.
 */
export function Jaaroverzicht() {
  const [overzicht, setOverzicht] = useState<Overzicht | null>(null);

  useEffect(() => {
    let levend = true;
    void Promise.all([
      getActiveChild(),
      leesWeek(),
      loadItemStates(),
      loadDiplomaRijen(),
      leesBijhouden(),
    ]).then(([kind, week, states, rijen, bijhouden]) => {
      if (!levend) return;
      setOverzicht(maakOverzicht(kind?.naam ?? '', week.strook, states, rijen, bijhouden));
    });
    return () => {
      levend = false;
    };
  }, []);

  if (overzicht === null) return null;
  const regels = [
    t('jaar.zegels', { aantal: overzicht.zegels, weken: overzicht.weken }),
    t('jaar.kleur', { aantal: overzicht.kleur }),
    t('jaar.lijst', { aantal: overzicht.lijst }),
    t('jaar.stempels', { aantal: overzicht.stempels }),
  ];

  return (
    <section className="flex flex-col gap-3" aria-label={t('jaar.titel')}>
      <h2 className="tk-sectie">{t('jaar.titel')}</h2>
      <div className="tk-card tk-jaaroverzicht" data-print="ja">
        <p className="tk-jaaroverzicht-kop">
          {t('jaar.kop', {
            naam: overzicht.naam,
            van: overzicht.schooljaar,
            tot: overzicht.schooljaar + 1,
          })}
        </p>
        <ul className="tk-regels">
          {regels.map((regel) => (
            <li key={regel}>{regel}</li>
          ))}
        </ul>
        {overzicht.diplomas.length > 0 ? (
          <>
            <p className="tk-lijstrij-titel">{t('jaar.diplomas')}</p>
            <ul className="tk-regels">
              {overzicht.diplomas.map((diploma) => (
                <li key={diploma.naam}>
                  {diploma.bijgehouden === 0
                    ? diploma.naam
                    : t('jaar.diplomaBijgehouden', {
                        naam: diploma.naam,
                        aantal: diploma.bijgehouden,
                      })}
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
      <button type="button" className="tk-button tk-button-secondary self-start" onClick={() => window.print()}>
        {t('jaar.print')}
      </button>
    </section>
  );
}

function maakOverzicht(
  naam: string,
  strook: Awaited<ReturnType<typeof leesWeek>>['strook'],
  states: ReadonlyMap<string, ItemState>,
  rijen: Awaited<ReturnType<typeof loadDiplomaRijen>>,
  bijhouden: Awaited<ReturnType<typeof leesBijhouden>>,
): Overzicht {
  const now = new Date();
  const schooljaar = schooljaarVan(now);
  const begin = schooljaarBegin(now).toISOString();
  let kleur = 0;
  let lijst = 0;
  let stempels = 0;
  for (const state of states.values()) {
    const laag = laagVan(state);
    if (laag >= 4) kleur++;
    if (laag === 5) lijst++;
    stempels += stempelsVan(state).filter((moment) => moment >= begin).length;
  }
  const witten = doelwitten(onderdelen(), true);
  const diplomas = rijen.flatMap((rij) => {
    const doelwit = witten.find((kandidaat) => kandidaat.id === rij.id);
    if (!doelwit) return [];
    const dezeJaar = (bijhouden[rij.id] ?? []).filter((seizoen) =>
      seizoen.startsWith(`${schooljaar}-`),
    );
    return [{ naam: naamVan(doelwit.deel), bijgehouden: dezeJaar.length }];
  });
  return {
    naam,
    schooljaar,
    zegels: strook.filter((week) => week.zegel).length,
    weken: strook.length,
    kleur,
    lijst,
    stempels,
    diplomas,
  };
}
