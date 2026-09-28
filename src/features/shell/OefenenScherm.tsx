import { t } from '@/i18n';
import { MODULE_ICON } from './moduleIcons';
import { RAIL_MODULES, type Module } from './modules';

/**
 * Oefenen, op /oefenen (ADR-241): de vakken bij elkaar, als kaarten.
 *
 * Aan een bureau staan dezelfde vakken ook in de zijbalk, onder Oefenen; op een
 * telefoon is dit de weg naar een vak, want het vakmenu onder de kop is weg.
 * Een kaart opent de startpagina van het vak, dezelfde als de rij in de
 * zijbalk. De kaart draagt de plaat van het vak en zijn naam; de vakkleur
 * staat in de rand en, onder de muis, in de tint.
 */
export function OefenenScherm({
  modules = RAIL_MODULES,
  onOpen,
}: {
  readonly modules?: readonly Module[];
  readonly onOpen: (id: Module['id']) => void;
}) {
  return (
    <div className="tk-page">
      <div className="tk-page-main">
        <h1 className="tk-oefenen-titel">{t('oefenen.titel')}</h1>

        <ul className="tk-vakkaarten">
          {modules.map((module) => {
            const ModuleIcon = MODULE_ICON[module.id];
            return (
              <li key={module.id}>
                <button
                  type="button"
                  data-module={module.id}
                  className="tk-vakkaart"
                  onClick={() => onOpen(module.id)}
                >
                  <span className="tk-plaat tk-vakkaart-plaat" aria-hidden="true">
                    <ModuleIcon size={36} />
                  </span>
                  <span className="tk-vakkaart-naam">{t(module.name)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
