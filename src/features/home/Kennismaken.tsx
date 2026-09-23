import type { Groep, ModeId } from '@/game-core';
import { NextIcon } from '@/components/Icon';
import { t, type TranslationKey } from '@/i18n';
import { naamVan, starters, type Onderdeel } from '@/features/module/onderdelen';
import { MODULE_ICON } from '@/features/shell/moduleIcons';
import { BUILT_MODULES, type Module } from '@/features/shell/modules';
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
      <ul className="tk-vakraster">
        {BUILT_MODULES.map((module) => {
          const ModuleIcon = MODULE_ICON[module.id];
          return (
            <li key={module.id}>
              <button
                type="button"
                data-module={module.id}
                className="tk-vaktegel"
                onClick={() => onVak(module.id)}
              >
                <span className="tk-plaat tk-plaat-groot" aria-hidden="true">
                  <ModuleIcon size={24} />
                </span>
                <span className="tk-vaktegel-tekst">
                  <span className="tk-kaart-titel">{t(module.name)}</span>
                  <span className="tk-kaart-regel">{t(VAK_UITLEG[module.id])}</span>
                </span>
                <span className="tk-lijstrij-pijl" aria-hidden="true">
                  <NextIcon size={20} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Wat er in elk vak zit, in één regel. Tijdvakken is er nog niet en staat er niet. */
const VAK_UITLEG: Record<Module['id'], TranslationKey> = {
  topo: 'home.vak.topo',
  tafels: 'home.vak.tafels',
  klok: 'home.vak.klok',
  woorden: 'home.vak.woorden',
  vlaggen: 'home.vak.vlaggen',
  tijdvakken: 'home.vak.topo',
};

const STAPPEN: readonly { readonly kop: TranslationKey; readonly uitleg: TranslationKey }[] = [
  { kop: 'home.zo.oefen.kop', uitleg: 'home.zo.oefen.uitleg' },
  { kop: 'home.zo.herhaal.kop', uitleg: 'home.zo.herhaal.uitleg' },
  { kop: 'home.zo.diploma.kop', uitleg: 'home.zo.diploma.uitleg' },
];

/** Hoe leer.nu werkt, in drie stappen: oefenen, herhalen, je diploma halen. */
export function ZoWerktHet() {
  return (
    <section className="flex flex-col gap-3" aria-labelledby="zo-kop">
      <h2 id="zo-kop" className="tk-sectie">
        {t('home.zo.titel')}
      </h2>
      <ol className="tk-uitlegstappen">
        {STAPPEN.map((stap, index) => (
          <li key={stap.kop} className="tk-uitlegstap">
            <span className="tk-uitlegstap-nummer" aria-hidden="true">
              {index + 1}
            </span>
            <span className="flex flex-col gap-1">
              <span className="tk-kaart-titel">{t(stap.kop)}</span>
              <span className="text-tekst-secundair">{t(stap.uitleg)}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
