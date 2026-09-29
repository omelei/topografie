import { NextIcon } from '@/components/Icon';
import { t, type TranslationKey } from '@/i18n';
import { MODULE_ICON } from './moduleIcons';
import { BUILT_MODULES, type Module } from './modules';

/** Wat er in elk vak zit, in één regel. Tijdvakken is er nog niet en staat er niet. */
const VAK_UITLEG: Record<Module['id'], TranslationKey> = {
  topo: 'home.vak.topo',
  tafels: 'home.vak.tafels',
  klok: 'home.vak.klok',
  woorden: 'home.vak.woorden',
  vlaggen: 'home.vak.vlaggen',
  tijdvakken: 'home.vak.topo',
};

/**
 * De vakken als tegels in hun eigen kleur: de plaat, de naam, een regel over
 * wat erin zit en een pijl. Op Vandaag onder "Kies een vak" en op /oefenen
 * dezelfde (ADR-242), zodat een kind één vorm leert voor "naar een vak".
 */
export function VakTegels({
  onVak,
  modules = BUILT_MODULES,
}: {
  readonly onVak: (id: Module['id']) => void;
  readonly modules?: readonly Module[];
}) {
  return (
    <ul className="tk-vakraster">
      {modules.map((module) => {
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
  );
}
