import { useEffect, useState } from 'react';
import { schooljaarVan, standVan, type Reeks } from '@/game-core';
import { doelwitten } from '@/features/home/doel';
import { naamVan, onderdelen } from '@/features/module/onderdelen';
import { t } from '@/i18n';
import { getActiveChild } from '@/store/children';
import { loadDiplomaRijen } from '@/store/rewardStore';
import { leesToren } from '@/store/torenStore';
import { leesReeks } from './reeks';

interface Overzicht {
  readonly naam: string;
  readonly schooljaar: number;
  readonly stenen: number;
  readonly verdiepingen: number;
  readonly ditJaar: number;
  readonly meter: number;
  readonly reeks: Reeks;
  readonly diplomas: readonly string[];
}

/**
 * Het jaaroverzicht, om te laten zien of te printen (ADR-158).
 *
 * Wat dit schooljaar opleverde, in vier regels: de toren zoals hij nu staat, de
 * verdiepingen die er dit jaar bij kwamen, de langste reeks, en de diploma's.
 * Geen cijfer en geen vergelijking — dit is wat er gebouwd is, geen rapport.
 *
 * **Stenen zijn niet gedateerd, verdiepingen wel.** Daarom staat het totaal er
 * zonder jaartal en de verdiepingen mét. Dat is eerlijker dan doen alsof de
 * toren per schooljaar te knippen is, en het is de reden dat de kop over de
 * toren gaat en niet over het jaar.
 *
 * Printen gebruikt de printer van de browser. Alleen dit overzicht komt op
 * papier (`data-print`), zonder de rest van de pagina.
 */
export function Jaaroverzicht() {
  const [overzicht, setOverzicht] = useState<Overzicht | null>(null);

  useEffect(() => {
    let levend = true;
    void Promise.all([getActiveChild(), leesToren(), leesReeks(), loadDiplomaRijen()]).then(
      ([kind, toren, reeks, rijen]) => {
        if (!levend) return;
        const now = new Date();
        const stand = standVan(toren);
        // Eén september van dit schooljaar: de verdiepingen dragen een datum,
        // de stenen niet, dus alleen verdiepingen zijn per jaar te tellen.
        const begin = new Date(schooljaarVan(now), 8, 1).toISOString();
        const witten = doelwitten(onderdelen(), true);

        setOverzicht({
          naam: kind?.naam ?? '',
          schooljaar: schooljaarVan(now),
          stenen: stand.stenen,
          verdiepingen: stand.verdiepingen,
          ditJaar: stand.volle.filter((verdieping) => verdieping.datum >= begin).length,
          meter: stand.meter,
          reeks,
          diplomas: rijen.flatMap((rij) => {
            const doelwit = witten.find((kandidaat) => kandidaat.id === rij.id);
            return doelwit ? [naamVan(doelwit.deel)] : [];
          }),
        });
      },
    );
    return () => {
      levend = false;
    };
  }, []);

  if (overzicht === null) return null;

  const regels = [
    overzicht.stenen === 1 ? t('jaar.steenEen') : t('jaar.stenen', { aantal: overzicht.stenen }),
    t('jaar.verdiepingen', { aantal: overzicht.ditJaar, totaal: overzicht.verdiepingen }),
    t('jaar.hoogte', { meter: overzicht.meter }),
    t('jaar.reeks', { aantal: overzicht.reeks.record }),
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
              {overzicht.diplomas.map((naam) => (
                <li key={naam}>{naam}</li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
      <button
        type="button"
        className="tk-button tk-button-secondary self-start"
        onClick={() => window.print()}
      >
        {t('jaar.print')}
      </button>
    </section>
  );
}
