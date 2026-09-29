import type { ReactNode } from 'react';
import type { Groep, ModeId } from '@/game-core';
import { DiplomaIcon, GoIcon, LadderIcon, ShieldIcon, type IconProps } from '@/components/Icon';
import { t, type TranslationKey } from '@/i18n';
import { naamVan, starters, type Onderdeel } from '@/features/module/onderdelen';
import { MODULE_ICON } from '@/features/shell/moduleIcons';
import type { Module } from '@/features/shell/modules';
import { VakTegels } from '@/features/shell/VakTegels';
import { vrijeVorm } from './useVandaag';

/**
 * Wat er op Vandaag staat voor een kind dat nog niets deed (ADR-204).
 *
 * De voordeur was voor een nieuw kind een begroeting, een rij van vier kaarten
 * en drie koppen met "nog niets" eronder. Kaal, en het zei niet wat je moest
 * doen of wat je hier kon. Nu: één ronde om mee te beginnen, groot, de vakken
 * om uit te kiezen, en in drie stappen hoe het hier werkt — in de woorden van
 * de schrijfwijzer. De vakken staan er voor iedereen; de rest alleen tot de
 * eerste ronde erop zit.
 */

/** De eerste ronde, met één knop: de bovenste van de starters voor deze groep. */
export function EersteRonde({
  groep,
  premium,
  onBegin,
}: {
  readonly groep: Groep | undefined;
  readonly premium: boolean;
  readonly onBegin: (deel: Onderdeel, mode: ModeId) => void;
}) {
  const eerste = starters(groep)[0];
  if (eerste === undefined) return null;

  const mode = vrijeVorm(eerste.deel, eerste.mode, premium);
  const ModuleIcon = MODULE_ICON[eerste.deel.moduleId];

  return (
    <section className="tk-eerste" data-module={eerste.deel.moduleId} aria-labelledby="eerste-kop">
      <span className="tk-plaat tk-plaat-groot" aria-hidden="true">
        <ModuleIcon size={28} />
      </span>
      <div className="tk-eerste-tekst">
        <h2 id="eerste-kop" className="tk-kaart-titel">
          {t('home.eerste.kop')}
        </h2>
        <p className="text-lopend">
          {t('home.eerste.zin', {
            onderwerp: naamVan(eerste.deel),
            manier: t(`mode.${mode}` as TranslationKey).toLocaleLowerCase('nl-NL'),
          })}
        </p>
      </div>
      <button type="button" className="tk-button" onClick={() => onBegin(eerste.deel, mode)}>
        {t('home.eerste.knop')}
      </button>
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
