import { useState, type ReactNode } from 'react';
import type { Groep } from '@/game-core';
import { DiplomaIcon, GoIcon, LadderIcon, ShieldIcon, type IconProps } from '@/components/Icon';
import { t, type TranslationKey } from '@/i18n';
import { GroepKiezer } from '@/features/player/GroepKiezer';
import type { Module } from '@/features/shell/modules';
import { VakTegels } from '@/features/shell/VakTegels';

/**
 * Wat er op Vandaag staat voor een kind dat nog niets deed (ADR-204).
 *
 * De voordeur was voor een nieuw kind een begroeting, een rij van vier kaarten
 * en drie koppen met "nog niets" eronder. Kaal, en het zei niet wat je moest
 * doen of wat je hier kon. Nu: waar je begint, bovenaan, de vakken om uit te
 * kiezen, en in vier stappen hoe het hier werkt — in de woorden van de
 * schrijfwijzer. De vakken staan er voor iedereen; de rest alleen tot de
 * eerste ronde erop zit.
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

  return (
    <section className="tk-eerste" aria-labelledby="groepvraag-kop">
      <div className="tk-eerste-tekst">
        <h2 id="groepvraag-kop" className="tk-kaart-titel">
          {t('groep.vraag')}
        </h2>
        <p className="text-lopend">{t('home.groep.zin')}</p>
      </div>
      <GroepKiezer
        gekozen={gekozen}
        uitweg="groep.weetNiet"
        bezig={bezig}
        onKies={(groep) => void kies(groep)}
      />
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

const STAPPEN: readonly {
  readonly kop: TranslationKey;
  readonly uitleg: TranslationKey;
  readonly Teken: (props: Omit<IconProps, 'children'>) => ReactNode;
}[] = [
  { kop: 'home.zo.oefen.kop', uitleg: 'home.zo.oefen.uitleg', Teken: GoIcon },
  { kop: 'home.zo.fouten.kop', uitleg: 'home.zo.fouten.uitleg', Teken: ShieldIcon },
  { kop: 'home.zo.moeilijk.kop', uitleg: 'home.zo.moeilijk.uitleg', Teken: LadderIcon },
  { kop: 'home.zo.diploma.kop', uitleg: 'home.zo.diploma.uitleg', Teken: DiplomaIcon },
];

/**
 * Hoe leer.nu werkt, in vier stappen: oefenen, je fouten, wat moeilijk is, je
 * diploma (ADR-231). Elke stap is een kaartje uit de huisstijl, met een teken,
 * een label, een kop en een regel (ADR-232).
 */
export function ZoWerktHet() {
  return (
    <section className="flex flex-col gap-3" aria-labelledby="zo-kop">
      <h2 id="zo-kop" className="tk-sectie">
        {t('home.zo.titel')}
      </h2>
      <ol className="tk-kaarten">
        {STAPPEN.map(({ kop, uitleg, Teken }, index) => (
          <li key={kop} className="tk-kaartje">
            <span className="tk-kaartteken" aria-hidden="true">
              <Teken size={28} />
            </span>
            <span className="tk-label">{t('home.zo.stap', { nummer: index + 1 })}</span>
            <span className="tk-kaartje-kop">{t(kop)}</span>
            <span className="tk-hulp">{t(uitleg)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
