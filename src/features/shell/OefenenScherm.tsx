import { t } from '@/i18n';
import { BUILT_MODULES, type Module } from './modules';
import { VakTegels } from './VakTegels';

/**
 * Oefenen, op /oefenen (ADR-241): de vakken bij elkaar.
 *
 * Aan een bureau staan dezelfde vakken ook in de zijbalk, onder Oefenen; op een
 * telefoon is dit de weg naar een vak. Sinds ADR-242 dezelfde tegels als onder
 * "Kies een vak" op Vandaag: een lijst met een regel over wat er in elk vak
 * zit. Een tegel opent de startpagina van het vak.
 */
export function OefenenScherm({
  modules = BUILT_MODULES,
  onOpen,
}: {
  readonly modules?: readonly Module[];
  readonly onOpen: (id: Module['id']) => void;
}) {
  return (
    <div className="tk-page">
      <div className="tk-page-main tk-oefenen">
        <h1 className="tk-oefenen-titel">{t('oefenen.titel')}</h1>
        <VakTegels onVak={onOpen} modules={modules} />
      </div>
    </div>
  );
}
