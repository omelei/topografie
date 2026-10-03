import { ChevronRightIcon } from '@/components/Icon';
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
 * De vakken als lijst: de plaat, de naam, een regel over wat erin zit en een
 * pijl in de tint van het vak. Op Vandaag onder "Kies een vak", op /oefenen en
 * op Voor ouders dezelfde (ADR-242), zodat een kind één vorm leert voor "naar
 * een vak". Sinds ADR-254 de lijst van Vandaag op een telefoon (ADR-252): één
 * witte kaart, de rijen met een haarlijn ertussen. Het waren tegels in de kleur
 * van het vak, met een rand en een onderkant.
 */
export function VakTegels({
  onVak,
  modules = BUILT_MODULES,
}: {
  readonly onVak: (id: Module['id']) => void;
  readonly modules?: readonly Module[];
}) {
  return (
    <ul className="tk-oefenlijst-rijen">
      {modules.map((module) => {
        const ModuleIcon = MODULE_ICON[module.id];
        return (
          <li key={module.id}>
            <button
              type="button"
              data-module={module.id}
              className="tk-oefenrij"
              onClick={() => onVak(module.id)}
            >
              <span className="tk-plaat tk-oefenrij-plaat" aria-hidden="true">
                <ModuleIcon size={22} />
              </span>
              <span className="tk-oefenrij-tekst">
                <span className="tk-oefenrij-titel">{t(module.name)}</span>
                <span className="tk-oefenrij-regel">{t(VAK_UITLEG[module.id])}</span>
              </span>
              <span className="tk-oefenrij-pijl" aria-hidden="true">
                <ChevronRightIcon size={20} />
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
