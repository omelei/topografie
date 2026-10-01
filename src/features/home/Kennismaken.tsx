import { useState } from 'react';
import type { Groep } from '@/game-core';
import { t } from '@/i18n';
import { MODULE_ICON } from '@/features/shell/moduleIcons';
import { BUILT_MODULES } from '@/features/shell/modules';
import { GroepKiezer } from '@/features/player/GroepKiezer';
import type { Module } from '@/features/shell/modules';
import { VakTegels } from '@/features/shell/VakTegels';
import { ScrollRij } from './ScrollRij';

/**
 * Wat er op Vandaag staat voor een kind dat nog niets deed (ADR-204).
 *
 * De voordeur was voor een nieuw kind een begroeting, een rij van vier kaarten
 * en drie koppen met "nog niets" eronder. Kaal, en het zei niet wat je moest
 * doen of wat je hier kon. Nu: waar je begint, bovenaan, en de vakken om uit
 * te kiezen. "Zo werkt leer.nu" stond eronder, in vier stappen; dat is uitleg
 * voor ouders en staat op de pagina voor ouders (ADR-250).
 */

/**
 * De vraag naar de groep, bovenaan voor een nieuw kind (ADR-243).
 *
 * Hier stond "Je eerste ronde": één kaart met één knop. Zonder groep was dat
 * altijd de provincies, ook voor een kind uit groep 3. De groep bepaalt wat
 * past, en na de keuze staan op deze plek de vijf onderwerpen van die groep,
 * één per vak: het kind kiest zelf waarmee. Geen poort: de vakken staan
 * eronder, en "Weet ik niet" geeft de vijf van altijd.
 */
export function GroepVraag({
  gekozen,
  onKies,
}: {
  /** De groep die nu geldt: `undefined` is geen groep, `null` is nog niets gekozen. */
  readonly gekozen: Groep | undefined | null;
  onKies(groep: Groep | undefined): Promise<void>;
}) {
  const [bezig, setBezig] = useState(false);

  async function kies(groep: Groep | undefined) {
    setBezig(true);
    await onKies(groep);
    setBezig(false);
  }

  // Geen kaart eromheen (ADR-250): de knoppen zijn zelf de actie, en zo past
  // de vraag op een telefoon van 360 bij 640 boven de vouw.
  return (
    <section className="flex flex-col gap-3" aria-labelledby="groepvraag-kop">
      <h2 id="groepvraag-kop" className="tk-sectie">
        {t('groep.vraag')}
      </h2>
      <GroepKiezer
        gekozen={gekozen}
        uitweg="groep.weetNiet"
        bezig={bezig}
        raster
        onKies={(groep) => void kies(groep)}
      />
    </section>
  );
}

/**
 * Voor een kind uit groep 1 of 2, op de plek van de onderwerpen van zijn groep
 * (ADR-244).
 *
 * Er is nog geen stof voor kinderen die niet lezen. Liever dat eerlijk zeggen
 * dan de provincies voorstellen. Wie het leest, is meestal een ouder; de vakken
 * blijven eronder te kiezen.
 */
export function VoorKleuters() {
  return (
    <section className="tk-eerste" aria-labelledby="kleuters-kop">
      <div className="tk-eerste-tekst">
        <h2 id="kleuters-kop" className="tk-kaart-titel">
          {t('home.kleuters.kop')}
        </h2>
        <p className="text-lopend">{t('home.kleuters.zin')}</p>
      </div>
    </section>
  );
}

/** De vakken om uit te kiezen, als tegels in hun eigen kleur. */
export function VakkenRaster({ onVak }: { readonly onVak: (id: Module['id']) => void }) {
  return (
    <section className="flex flex-col gap-3" aria-labelledby="vakken-kop">
      <h2 id="vakken-kop" className="tk-sectie">
        {t('home.vakken.titel')}
      </h2>
      <VakTegels onVak={onVak} />
    </section>
  );
}

/**
 * De vakken als rij op Vandaag, voor een nieuw kind (ADR-250): de plaat en de
 * naam, en verder niets. Wie al geoefend heeft, vindt ze onder de tab Oefenen.
 */
export function VakkenRij({ onVak }: { readonly onVak: (id: Module['id']) => void }) {
  return (
    <ScrollRij titel={t('home.vakken.titel')}>
      {BUILT_MODULES.map((module) => {
        const ModuleIcon = MODULE_ICON[module.id];
        return (
          <button
            key={module.id}
            type="button"
            data-module={module.id}
            className="tk-vaktegel tk-vaktegel-klein"
            onClick={() => onVak(module.id)}
          >
            <span className="tk-plaat tk-plaat-klein" aria-hidden="true">
              <ModuleIcon size={20} />
            </span>
            <span className="tk-kaart-titel">{t(module.name)}</span>
          </button>
        );
      })}
    </ScrollRij>
  );
}
