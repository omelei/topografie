import { useEffect, useState } from 'react';
import { doelwitVan } from '@/features/home/doel';
import { naamVan, type Onderdeel } from '@/features/module/onderdelen';
import { PremiumLabel } from '@/features/module/PremiumLabel';
import type { Module } from '@/features/shell/modules';
import { t } from '@/i18n';
import { loadBehaald } from '@/store/rewardStore';
import { DiplomaRaster } from './DiplomaRaster';

/**
 * Een wand diploma's voor sets die zichzelf al een naam geven (ADR-168).
 *
 * De vier oudere wanden — de tafels, de vlaggen, de klok, de kaart — tekenen
 * elk hun eigen vaste lijst met hun eigen woord ervoor: "Tafel van 7",
 * "Europa", "Hele uren". Rekenen buiten de tafels en Taal hebben dat woord niet
 * nodig, want hun sets heten al "Plussommen tot 20" en "Tegenwoordige tijd".
 * Dus krijgt deze wand de onderdelen zelf mee en leest hij de naam waar de
 * startbalk hem ook vandaan haalt — één naam per set, op elke plek.
 *
 * Het raster eronder is hetzelfde raster (`DiplomaRaster`), zodat een
 * diplomategel op /taal er precies zo uitziet als op /topografie. Dat is de
 * hele reden dat deze component bestaat in plaats van een vijfde en zesde kopie
 * van dezelfde vijftig regels.
 *
 * Ook zonder code getekend (ADR-192): de ringen zijn te zien, halen kan met
 * premium. Het label in de kop zegt dat, en de toets vraagt om de code.
 */
export function Setdiplomas({
  moduleId,
  titel,
  sets,
  onKies,
}: {
  readonly moduleId: Module['id'];
  readonly titel: string;
  /** De sets die deze wand toont, in de volgorde van de pagina. */
  readonly sets: readonly Onderdeel[];
  /** Drukken kiest die set en het diploma erbij. */
  readonly onKies?: ((setId: string) => void) | undefined;
}) {
  const [behaald, setBehaald] = useState<ReadonlySet<string> | null>(null);

  useEffect(() => {
    void loadBehaald().then(setBehaald);
  }, []);

  // Niets tot het bekend is: een wand die eerst vier gaten toont en er daarna
  // twee van vult, heeft een kind verteld dat het niets had.
  if (behaald === null) return null;

  const vakken = sets.flatMap((deel) => {
    const doelwit = doelwitVan(deel);
    if (doelwit === null) return [];
    const naam = naamVan(deel);
    const gehaald = behaald.has(doelwit.id);

    return [
      {
        key: doelwit.id,
        diplomaId: doelwit.id,
        titel: naam,
        label: gehaald ? t('diploma.muurHave', { naam }) : t('diploma.muurWant', { naam }),
        gehaald,
        onKies: onKies ? () => onKies(deel.setId) : undefined,
      },
    ];
  });

  if (vakken.length === 0) return null;

  return (
    <section className="flex flex-col gap-3" aria-label={titel}>
      <div className="tk-sectie">
        <h2>{titel}</h2>
        <PremiumLabel hoorbaar />
        <span className="tk-sectie-meta">
          {t('diploma.muurCount', {
            aantal: vakken.filter((vak) => vak.gehaald).length,
            totaal: vakken.length,
          })}
        </span>
      </div>

      <DiplomaRaster module={moduleId} vakken={vakken} />
    </section>
  );
}
