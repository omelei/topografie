import { useEffect, useState } from 'react';
import { ChevronRightIcon } from '@/components/Icon';
import { t } from '@/i18n';
import { MODULE_ICON } from './moduleIcons';
import { BUILT_MODULES, type Module } from './modules';
import { Paginakop } from './Paginakop';
import { VAK_UITLEG } from './vakUitleg';

/** Hoe lang Denker juicht nadat je hem kietelde. */
const KIETEL_MS = 1300;

/**
 * Oefenen, op /oefenen (ADR-241): de vakken bij elkaar.
 *
 * Aan een bureau staan dezelfde vakken ook in de zijbalk, onder Oefenen; op een
 * telefoon is dit de weg naar een vak. Een tegel opent de startpagina van het
 * vak.
 *
 * Sinds ADR-259 zijn de vakken weer tegels in hun eigen kleur: de tint met de
 * rand van het vak en een onderkant in zijn heldere kleur, de plaat groot en
 * de naam in de diepe toon. Aan een bureau drie naast elkaar en twee eronder,
 * op een telefoon onder elkaar. Denker zit in de kop en zegt wat hij van het
 * vak vindt waar je met de muis of de tab-toets op staat, en lacht als je hem
 * kietelt.
 */
export function OefenenScherm({
  modules = BUILT_MODULES,
  onOpen,
}: {
  readonly modules?: readonly Module[];
  readonly onOpen: (id: Module['id']) => void;
}) {
  const [wijst, zetWijst] = useState<Module['id'] | null>(null);
  const [gekieteld, zetGekieteld] = useState(0);

  useEffect(() => {
    if (gekieteld === 0) return;
    const klaar = window.setTimeout(() => zetGekieteld(0), KIETEL_MS);
    return () => window.clearTimeout(klaar);
  }, [gekieteld]);

  const gekozen = modules.find((module) => module.id === wijst);
  const zin =
    gekieteld !== 0
      ? t('denker.kietel')
      : gekozen
        ? t('oefenen.vakZin', { vak: t(gekozen.name), regel: t(VAK_UITLEG[gekozen.id]) })
        : t('oefenen.vraag');

  return (
    <div className="tk-page">
      <div className="tk-page-main tk-oefenen">
        <div data-module={gekozen?.id}>
          <Paginakop
            kop={t('oefenen.titel')}
            zin={zin}
            zinKleur={gekozen && gekieteld === 0 ? 'var(--module-tekst)' : undefined}
            uitdrukking={gekieteld !== 0 ? 'juichen' : gekozen ? 'blij' : 'denken'}
            niveau={gekieteld !== 0 ? 3 : gekozen ? 2 : 0}
            onKietel={() => zetGekieteld(Date.now())}
            kietelLabel={t('denker.kietelKnop')}
          />
        </div>
        <ul className="tk-vakvlakken">
          {modules.map((module) => {
            const ModuleIcon = MODULE_ICON[module.id];
            const weg = () => zetWijst((nu) => (nu === module.id ? null : nu));
            return (
              <li key={module.id}>
                <button
                  type="button"
                  data-module={module.id}
                  className="tk-vakvlak-tegel"
                  onClick={() => onOpen(module.id)}
                  onPointerEnter={() => zetWijst(module.id)}
                  onPointerLeave={weg}
                  onFocus={() => zetWijst(module.id)}
                  onBlur={weg}
                >
                  <span className="tk-plaat tk-vakvlak-plaat" aria-hidden="true">
                    <ModuleIcon size={30} />
                  </span>
                  <span className="tk-vakvlak-onder">
                    <span className="tk-vakvlak-tekst">
                      <span className="tk-vakvlak-naam">{t(module.name)}</span>
                      <span className="tk-vakvlak-regel">{t(VAK_UITLEG[module.id])}</span>
                    </span>
                    <span className="tk-vakvlak-pijl" aria-hidden="true">
                      <ChevronRightIcon size={22} />
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
