import { useEffect, useState } from 'react';
import { dayKey, WEEK_DREMPEL, weekOverzicht, type WeekOverzicht } from '@/game-core';
import { t } from '@/i18n';
import { startbareOnderdelen } from '@/features/module/onderdelen';
import { planSets } from '@/features/home/useVandaag';
import { naarPremium, usePremium } from '@/features/premium/usePremium';
import { listChildren } from '@/store/children';
import { isTeKoop } from '@/store/premium';
import { tel } from '@/store/teller';
import { loadItemStates } from '@/store/progress';

/**
 * Wat het dagplan deze week deed, per kind, op de ouderpagina (ADR-227).
 *
 * **Het plan rekent in de gratis versie stil mee.** Elk antwoord schuift een
 * onderdeel naar de dag waarop het terug moet komen, met of zonder code; alleen
 * het plan zelf is premium (ADR-192). Dit blok laat een ouder zien wat dat plan
 * voor zijn kind zou doen: hoeveel het deze week oefende, en op welke twee dagen
 * het herhalen klaarstaat. Met een code is het een feit, zonder code het aanbod.
 *
 * **Pas vanaf 5 onderdelen.** Onder die grens valt er niets te plannen dat een
 * ouder iets zegt, en een aanbod over twee sommen is een aanbod over niets.
 *
 * **Niets hiervan staat bij het kind.** Een prijs of een knop om te kopen hoort
 * achter de pincode (R-11), en dit is de enige pagina daarachter.
 *
 * Een uitzondering op ADR-192, die zegt dat voortgang zonder code niet te zien
 * is: dit blok noemt geen beheersing en geen schatting, alleen een aantal en
 * twee dagen.
 */

interface KindWeek extends WeekOverzicht {
  readonly id: string;
  readonly naam: string;
}

async function lees(now: Date): Promise<KindWeek[]> {
  const sets = planSets(startbareOnderdelen());
  const kinderen = await listChildren();
  return Promise.all(
    kinderen.map(async (kind) => ({
      id: kind.id,
      naam: kind.naam,
      ...weekOverzicht(sets, await loadItemStates(kind.id), now),
    })),
  );
}

/** "vandaag", "morgen", of "dinsdag 29 september". */
function dagNaam(dag: string, now: Date): string {
  if (dag === dayKey(now)) return t('ouder.weekVandaag');
  const morgen = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  if (dag === dayKey(morgen)) return t('ouder.weekMorgen');
  return new Intl.DateTimeFormat('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${dag}T12:00:00`));
}

export function DezeWeek() {
  const { actief } = usePremium();
  const [kinderen, setKinderen] = useState<readonly KindWeek[] | null>(null);

  useEffect(() => {
    let levend = true;
    void lees(new Date()).then((gelezen) => {
      if (levend) setKinderen(gelezen.filter((kind) => kind.geoefend >= WEEK_DREMPEL));
    });
    return () => {
      levend = false;
    };
  }, []);

  if (kinderen === null || kinderen.length === 0) return null;
  const now = new Date();

  return (
    <section className="flex flex-col gap-3" aria-label={t('ouder.week')}>
      <h2 className="tk-sectie">{t('ouder.week')}</h2>
      <ul className="flex flex-col gap-3">
        {kinderen.map((kind) => {
          const dagen = kind.herhaaldagen.map((dag) => dagNaam(dag, now)).join(t('ouder.weekEn'));
          return (
            <li key={`week-${kind.id}`} className="tk-card flex flex-col gap-2">
              <h3 className="tk-sectie">{kind.naam}</h3>
              <p className="text-lopend">
                {t('ouder.weekGeoefend', { naam: kind.naam, aantal: kind.geoefend })}
              </p>
              {dagen === '' ? null : (
                <p className="text-lopend">
                  {t(actief ? 'ouder.weekPlan' : 'ouder.weekPlanPremium', {
                    naam: kind.naam,
                    dagen,
                  })}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      {actief ? null : (
        <div className="flex flex-col gap-3">
          <p className="tk-hulp">{t('ouder.weekAanbod')}</p>
          <div className="flex flex-wrap gap-3">
            {isTeKoop() ? (
              <a
                className="tk-button tk-button-secondary"
                href="/kopen/"
                onClick={() => tel('kassa')}
              >
                {t('premium.kopenKnop')}
              </a>
            ) : null}
            <button
              type="button"
              className="tk-button tk-button-tertiary"
              onClick={() => naarPremium()}
            >
              {t('ouder.bekijkPremium')}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
