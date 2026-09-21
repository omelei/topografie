import { useEffect, useState } from 'react';
import { setRetention } from '@/game-core';
import { t } from '@/i18n';
import { geheugen, geoefend, perDag } from '@/features/retention/statistiek';
import { listChildren } from '@/store/children';
import { loadItemStates, loadPlayedRounds } from '@/store/progress';

/**
 * Hoe het met je kinderen gaat, op de ouderpagina (ADR-177).
 *
 * **Waarom dit er komt.** De ouderpagina beloofde dit op vier plekken — in de
 * poort ("Hierachter staan de instellingen, premium en hoe het met je kinderen
 * gaat"), in de volwassenencheck, bij het zetten van de pincode, en in de rij
 * van de wisselaar — en had het nergens. Een ouder deed een volwassenencheck,
 * koos een pincode, kwam binnen, en vond de naam van zijn kind, een codeveld
 * en één schakelaar. Vier zinnen die hetzelfde beloofden, en niets erachter.
 *
 * **Per kind en niet over het gezin.** Twee kinderen optellen geeft een getal
 * dat over niemand gaat. Het is ook de enige plek in het product waar een
 * kind náást een ander kind staat, en dat mag hier: ADR-164 weigerde namen in
 * de statistieken van het kind, en dit is de pagina van de ouder.
 *
 * **Kort, en de diepte is premium.** Wat hier staat zijn feiten over het eigen
 * kind, en die zijn gratis — dezelfde grens die ADR-133 trok voor de noemer van
 * de weekdagen en die ADR-177 doortrok naar de vakkeuze op Jij. Wat premium
 * blijft is het bijhouden: per som en per woord, en het verloop week na week
 * (`premium.usp.zicht`).
 *
 * **Hier mag de schatting wél staan.** ADR-177 haalde de ring van Jij omdat een
 * percentage stof van groep 7 is en de zin eronder een model als feit
 * presenteerde. Allebei die bezwaren vervallen hier: de lezer is volwassen, en
 * de zin zegt dat het een schatting is. Dit is de plek die ADR-177 ervoor
 * aanwees.
 */

/** De horizon van elke voorspelling in het product: drie weken. */
const DRIE_WEKEN_MS = 21 * 86_400_000;

interface Stand {
  readonly id: string;
  readonly naam: string;
  readonly onthouden: number;
  readonly geoefend: number;
  /** Op hoeveel van de laatste zeven dagen er een ronde was. */
  readonly dagen: number;
  /** Naar schatting over drie weken, 0-100. Null zonder geoefend werk. */
  readonly schatting: number | null;
}

async function lees(): Promise<Stand[]> {
  const kinderen = await listChildren();
  const now = new Date();

  return Promise.all(
    kinderen.map(async (kind) => {
      const states = await loadItemStates(kind.id);
      const rondes = await loadPlayedRounds(kind.id);
      const stand = geheugen(states, now);
      const gezien = [...states.keys()];

      return {
        id: kind.id,
        naam: kind.naam,
        onthouden: stand.onthouden,
        geoefend: geoefend(stand),
        dagen: perDag(rondes, now).filter((dag) => dag.rondes > 0).length,
        schatting:
          gezien.length === 0
            ? null
            : setRetention(states, gezien, new Date(now.getTime() + DRIE_WEKEN_MS)),
      };
    }),
  );
}

export function HoeGaatHet() {
  const [standen, setStanden] = useState<Stand[] | null>(null);

  useEffect(() => {
    let levend = true;
    void lees().then((gelezen) => {
      if (levend) setStanden(gelezen);
    });
    return () => {
      levend = false;
    };
  }, []);

  return (
    <section
      className="flex flex-col gap-3"
      aria-label={t('ouder.hoeGaatHet')}
      aria-busy={standen === null}
    >
      <h2 className="tk-sectie">{t('ouder.hoeGaatHet')}</h2>
      <p className="text-lopend text-tekst-secundair">{t('ouder.hoeGaatHetUitleg')}</p>

      {standen === null ? null : (
        <ul className="flex flex-col gap-3">
          {standen.map((stand) => (
            <li key={stand.id} className="tk-card flex flex-col gap-2">
              <h3 className="tk-sectie">{stand.naam}</h3>

              {stand.geoefend === 0 ? (
                <p className="text-lopend text-tekst-secundair">
                  {t('ouder.kindNogNiets', { naam: stand.naam })}
                </p>
              ) : (
                <>
                  <p className="tk-reeks-getal">
                    <span className="tk-reeks-aantal">{stand.onthouden}</span>
                    <span className="tk-reeks-zin">{t('retention.geheugenGoed')}</span>
                  </p>
                  <p className="tk-hulp">
                    {t('retention.geheugenVan', { aantal: stand.geoefend })}
                  </p>
                  <p className="text-lopend">
                    {t(stand.dagen === 1 ? 'ouder.kindDagEen' : 'ouder.kindDagen', {
                      dagen: stand.dagen,
                    })}
                  </p>
                  {stand.schatting === null ? null : (
                    <p className="text-lopend text-tekst-secundair">
                      {t('ouder.kindSchatting', { procent: stand.schatting })}
                    </p>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
