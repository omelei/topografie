import { useEffect, useState } from 'react';
import { schooljaarVan, type Reeks } from '@/game-core';
import { doelwitten } from '@/features/home/doel';
import { datumVan } from '@/features/badges/datums';
import { naamVan, startbareOnderdelen } from '@/features/module/onderdelen';
import { t } from '@/i18n';
import { getActiveChild } from '@/store/children';
import { loadDiplomaRijen } from '@/store/rewardStore';
import { leesReeks } from './reeks';

interface Diploma {
  readonly naam: string;
  readonly datum: string;
  readonly ditJaar: boolean;
}

interface Overzicht {
  readonly naam: string;
  readonly schooljaar: number;
  readonly reeks: Reeks;
  readonly diplomas: readonly Diploma[];
}

/**
 * Het schooljaar, om te laten zien of te printen.
 *
 * Het stond op Jij en ging over de toren: stenen, verdiepingen en meters. Nu de
 * diploma's het beloningsprogramma zijn, is dat wat er te melden valt — welke
 * diploma's dit kind haalde en wanneer — en die vraag is van de ouder. Daarom
 * staat het hier en niet meer bij het kind.
 *
 * **De datums doen het werk.** Een diploma draagt de dag waarop het gehaald is
 * (`rewardStore` schrijft hem één keer weg en laat hem daarna staan), dus dit
 * overzicht hoeft niets te bewaren en niets te tellen dat elders al geteld
 * wordt. Diploma's van dit schooljaar staan bovenaan; oudere eronder, want ze
 * horen bij dit kind ook al horen ze niet bij dit jaar.
 *
 * Geen cijfer en geen vergelijking — dit is wat er gehaald is, geen rapport.
 *
 * Printen gebruikt de printer van de browser. Alleen dit overzicht komt op
 * papier (`data-print`), zonder de rest van de pagina.
 */
export function Jaaroverzicht() {
  const [overzicht, setOverzicht] = useState<Overzicht | null>(null);

  useEffect(() => {
    let levend = true;
    void Promise.all([getActiveChild(), leesReeks(), loadDiplomaRijen()]).then(
      ([kind, reeks, rijen]) => {
        if (!levend) return;
        const jaar = schooljaarVan(new Date());
        const begin = new Date(jaar, 8, 1).toISOString();
        const witten = doelwitten(startbareOnderdelen(), true);

        setOverzicht({
          naam: kind?.naam ?? '',
          schooljaar: jaar,
          reeks,
          diplomas: rijen.flatMap((rij) => {
            const doelwit = witten.find((kandidaat) => kandidaat.id === rij.id);
            if (!doelwit) return [];
            return [
              {
                naam: naamVan(doelwit.deel),
                datum: datumVan(rij.behaaldOp),
                ditJaar: rij.behaaldOp >= begin,
              },
            ];
          }),
        });
      },
    );
    return () => {
      levend = false;
    };
  }, []);

  if (overzicht === null) return null;

  const ditJaar = overzicht.diplomas.filter((diploma) => diploma.ditJaar);
  const eerder = overzicht.diplomas.filter((diploma) => !diploma.ditJaar);

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

        {ditJaar.length === 0 ? (
          <p>{t('jaar.geenDiplomas')}</p>
        ) : (
          <ul className="tk-regels">
            {ditJaar.map((diploma) => (
              <li key={diploma.naam}>
                {t('jaar.diploma', { naam: diploma.naam, datum: diploma.datum })}
              </li>
            ))}
          </ul>
        )}

        {eerder.length > 0 ? (
          <>
            <p className="tk-lijstrij-titel">{t('jaar.eerder')}</p>
            <ul className="tk-regels">
              {eerder.map((diploma) => (
                <li key={diploma.naam}>
                  {t('jaar.diploma', { naam: diploma.naam, datum: diploma.datum })}
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {/* Geen nul afdrukken: bij nul staat het er niet, en het blok erboven
            zegt al dat de reeks nog moet beginnen. */}
        {overzicht.reeks.record > 0 ? (
          <p>{t('jaar.reeks', { aantal: overzicht.reeks.record })}</p>
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
