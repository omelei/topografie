import { useEffect, useState } from 'react';
import { paginaStand, type ItemState } from '@/game-core';
import { naamVan, onderdelen, type Onderdeel } from '@/features/module/onderdelen';
import { MODULE_ICON } from '@/features/shell/moduleIcons';
import { BUILT_MODULES } from '@/features/shell/modules';
import { t } from '@/i18n';
import { loadItemStates } from '@/store/progress';
import { AlbumPagina, StandRegel } from './AlbumPagina';

/**
 * Het hele album, op Jij (ADR-149).
 *
 * Per module één uitklap, met in de kop hoeveel plaatjes van die module kleur
 * hebben. Daarin de pagina's, elk met hun stand; tik er een aan en de pagina
 * zelf staat eronder. Dicht bij het openen: zeventig pagina's open is geen
 * album maar een telefoonboek.
 *
 * Alleen de eigen sets, geen mixen: een mix is andere pagina's bij elkaar, en
 * zou elk plaatje twee keer tonen.
 */
export function AlbumOverzicht() {
  const [states, setStates] = useState<ReadonlyMap<string, ItemState> | null>(null);
  const [gekozen, setGekozen] = useState<string | null>(null);
  const [now] = useState(() => new Date());

  useEffect(() => {
    void loadItemStates().then(setStates);
  }, []);

  if (states === null) return null;

  const alle = onderdelen();

  return (
    <section className="flex flex-col gap-3" aria-label={t('album.titel')}>
      <h2 className="tk-sectie">{t('album.titel')}</h2>
      <p className="text-lopend">{t('album.uitleg')}</p>
      {BUILT_MODULES.map((module) => {
        const paginas = alle.filter((deel) => deel.moduleId === module.id && !deel.mix);
        if (paginas.length === 0) return null;
        const ModuleIcon = MODULE_ICON[module.id];
        const stand = paginaStand(
          paginas.flatMap((deel) => deel.items.map((item) => item.id)),
          states,
          now,
        );
        return (
          <details key={module.id} className="tk-card tk-albummodule" data-module={module.id}>
            <summary className="tk-albummodule-kop">
              <span className="tk-plaat tk-plaat-klein">
                <ModuleIcon size={20} />
              </span>
              <span className="tk-lijstrij-tekst">
                <span className="tk-lijstrij-titel">{t(module.name)}</span>
                <span className="tk-lijstrij-regel">
                  {t('album.stand', { kleur: stand.kleur, totaal: stand.totaal })}
                </span>
              </span>
            </summary>
            <ul className="tk-albumpaginas">
              {paginas.map((deel) => (
                <li key={deel.setId}>
                  <PaginaKnop
                    deel={deel}
                    states={states}
                    now={now}
                    open={gekozen === deel.setId}
                    onKies={() => setGekozen(gekozen === deel.setId ? null : deel.setId)}
                  />
                  {gekozen === deel.setId ? <AlbumPagina deel={deel} states={states} now={now} /> : null}
                </li>
              ))}
            </ul>
          </details>
        );
      })}
    </section>
  );
}

function PaginaKnop({
  deel,
  states,
  now,
  open,
  onKies,
}: {
  readonly deel: Onderdeel;
  readonly states: ReadonlyMap<string, ItemState>;
  readonly now: Date;
  readonly open: boolean;
  readonly onKies: () => void;
}) {
  const stand = paginaStand(
    deel.items.map((item) => item.id),
    states,
    now,
  );
  return (
    <button type="button" className="tk-lijstrij tk-albumpagina-knop" aria-expanded={open} onClick={onKies}>
      <span className="tk-lijstrij-tekst">
        <span className="tk-lijstrij-titel">{naamVan(deel)}</span>
        <StandRegel stand={stand} />
      </span>
    </button>
  );
}
