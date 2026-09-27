import { useEffect, useState } from 'react';
import { t } from '@/i18n';
import { naamVanSet } from '@/features/module/onderdelen';
import { leesbareDatum, usePremium } from '@/features/premium/usePremium';
import { listChildren } from '@/store/children';
import { leesGeheugencheck, type GeheugencheckUitslag as Uitslag } from '@/store/geheugencheck';

/**
 * De uitslag van de geheugencheck, op de ouderpagina (ADR-228).
 *
 * Een kind deed één ronde zonder hulp, over vragen die het 3 tot 8 weken
 * geleden voor het eerst oefende. Hier staat hoeveel er nog zat. Dat is precies
 * de vraag waar premium het antwoord op is: wat na een paar weken wegzakt, laat
 * het plan op tijd terugkomen. Zonder code staat het aanbod erbij; met code
 * alleen de uitslag. Het kind zelf ziet hier niets van (R-11).
 */

interface KindUitslag extends Uitslag {
  readonly id: string;
  readonly naam: string;
}

export function GeheugencheckUitslag() {
  const { actief } = usePremium();
  const [uitslagen, setUitslagen] = useState<readonly KindUitslag[] | null>(null);

  useEffect(() => {
    let levend = true;
    void (async () => {
      const kinderen = await listChildren();
      const gelezen = await Promise.all(
        kinderen.map(async (kind) => {
          const uitslag = await leesGeheugencheck(kind.id);
          return uitslag === null ? null : { ...uitslag, id: kind.id, naam: kind.naam };
        }),
      );
      if (levend) setUitslagen(gelezen.filter((kind): kind is KindUitslag => kind !== null));
    })();
    return () => {
      levend = false;
    };
  }, []);

  if (uitslagen === null || uitslagen.length === 0) return null;

  return (
    <section className="flex flex-col gap-3" aria-label={t('ouder.geheugencheck')}>
      <h2 className="tk-sectie">{t('ouder.geheugencheck')}</h2>
      <ul className="flex flex-col gap-3">
        {uitslagen.map((kind) => {
          const onderwerp = naamVanSet(kind.setId);
          return (
            <li key={`check-${kind.id}`} className="tk-card flex flex-col gap-2">
              <h3 className="tk-sectie">{kind.naam}</h3>
              <p className="tk-reeks-getal">
                <span className="tk-reeks-aantal">{kind.goed}</span>
                <span className="tk-reeks-zin">
                  {t('ouder.geheugencheckVan', { gevraagd: kind.gevraagd })}
                </span>
              </p>
              <p className="text-lopend">
                {t(
                  onderwerp === ''
                    ? 'ouder.geheugencheckUitleg'
                    : 'ouder.geheugencheckUitlegOnderwerp',
                  {
                    naam: kind.naam,
                    datum: leesbareDatum(kind.dag),
                    onderwerp,
                  },
                )}
              </p>
            </li>
          );
        })}
      </ul>

      {actief ? (
        <p className="tk-hulp">{t('ouder.geheugencheckMetPremium')}</p>
      ) : (
        // Eén premiumblok per pagina (ADR-124, ADR-236), zie DezeWeek.
        <p className="tk-hulp">{t('ouder.geheugencheckAanbod')}</p>
      )}
    </section>
  );
}
