import { useEffect, useState } from 'react';
import { schooljaarVan } from '@/game-core';
import { doelwitten } from '@/features/home/doel';
import { datumVan } from '@/features/badges/datums';
import { naamVan, startbareOnderdelen } from '@/features/module/onderdelen';
import { t } from '@/i18n';
import { getActiveChild } from '@/store/children';
import { loadDiplomaRijen } from '@/store/rewardStore';

interface Diploma {
  readonly naam: string;
  readonly datum: string;
  readonly ditJaar: boolean;
}

interface Overzicht {
  readonly naam: string;
  readonly schooljaar: number;
  readonly diplomas: readonly Diploma[];
}

/**
 * Het schooljaar, om te printen: één knop onder de kast (ADR-172).
 *
 * Het stond op Jij en ging over de toren: stenen, verdiepingen en meters. Nu de
 * diploma's het beloningsprogramma zijn, is dat wat er te melden valt — welke
 * diploma's dit kind haalde en wanneer. Het ging daarvoor naar Voor ouders, en
 * sinds ADR-171 staat het weer op Jij, onder de diploma's zelf: die pagina is
 * weg, en wat een kind gehaald heeft is ook van het kind.
 *
 * De langste reeks stond er ook in. Die is eruit: het kind ziet de reeks niet
 * (ADR-169), en dit overzicht staat nu bij het kind.
 *
 * **De datums doen het werk.** Een diploma draagt de dag waarop het gehaald is
 * (`rewardStore` schrijft hem één keer weg en laat hem daarna staan), dus dit
 * overzicht hoeft niets te bewaren en niets te tellen dat elders al geteld
 * wordt. Diploma's van dit schooljaar staan bovenaan; oudere eronder, want ze
 * horen bij dit kind ook al horen ze niet bij dit jaar.
 *
 * Geen cijfer en geen vergelijking — dit is wat er gehaald is, geen rapport.
 *
 * **Op het scherm alleen een knop** (ADR-172). Het was een eigen blok met de
 * lijst erin, en die lijst stond er al: de kast laat dezelfde diploma's zien,
 * en het venster van elk diploma zijn datum. Wat dit blok toevoegde was het
 * blad voor de printer. Dus staat er één knop, en alleen als er iets gehaald
 * is — op dag één stond er een knop om een leeg blad te printen.
 *
 * Printen gebruikt de printer van de browser. Alleen dit overzicht komt op
 * papier (`data-print`), zonder de rest van de pagina. Het blad bestaat pas
 * zolang er geprint wordt. Met `data-print` altijd in de pagina stond het ook
 * klaar voor de printer als je vanuit het venster één diploma printte.
 */
export function Jaaroverzicht() {
  const [overzicht, setOverzicht] = useState<Overzicht | null>(null);
  const [printen, setPrinten] = useState(false);

  useEffect(() => {
    let levend = true;
    void Promise.all([getActiveChild(), loadDiplomaRijen()]).then(([kind, rijen]) => {
      if (!levend) return;
      const jaar = schooljaarVan(new Date());
      const begin = new Date(jaar, 8, 1).toISOString();
      const witten = doelwitten(startbareOnderdelen(), true);

      setOverzicht({
        naam: kind?.naam ?? '',
        schooljaar: jaar,
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
    });
    return () => {
      levend = false;
    };
  }, []);

  useEffect(() => {
    if (!printen) return;
    const klaar = () => setPrinten(false);
    window.addEventListener('afterprint', klaar);
    window.print();
    return () => window.removeEventListener('afterprint', klaar);
  }, [printen]);

  if (overzicht === null || overzicht.diplomas.length === 0) return null;

  const ditJaar = overzicht.diplomas.filter((diploma) => diploma.ditJaar);
  const eerder = overzicht.diplomas.filter((diploma) => !diploma.ditJaar);

  return (
    <>
      <button
        type="button"
        className="tk-button tk-button-secondary self-start"
        onClick={() => setPrinten(true)}
      >
        {t('jaar.print')}
      </button>

      {printen ? (
        <div className="tk-jaaroverzicht tk-alleen-print" data-print="ja">
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
        </div>
      ) : null}
    </>
  );
}
