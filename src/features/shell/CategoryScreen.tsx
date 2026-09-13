import type { ReactNode } from 'react';
import { t } from '@/i18n';
import { MODULE_ICON } from './moduleIcons';
import { MODULES, type Category, type Module } from './modules';

/**
 * The word a parent types, when it holds more than one thing.
 *
 * One category exists, and its shape is the whole reason it does: **tafels
 * belongs under rekenen and klokkijken does not.** Telling the time is not
 * arithmetic — it is reading an instrument — and business plan v6 already made
 * them two modules with two entrances and two accents.
 *
 * This page is what /rekenen becomes on the day arithmetic is more than the
 * tables. Until then it is not what that address does: a category holding one
 * built module *is* that module, and a page with a single card on it saying
 * "Rekenen" charged a child a click to be told what they had already typed.
 * See `routes.ts`.
 *
 * Categories still live at addresses and not in the rail. The rail lists
 * modules, because a module is what a child practises, and nobody practises
 * "rekenen".
 */
export function CategoryScreen({
  category,
  onOpen,
  aside,
}: {
  readonly category: Category;
  readonly onOpen: (module: Module) => void;
  readonly aside: ReactNode;
}) {
  const modules = MODULES.filter((module) => category.modules.includes(module.id));

  return (
    <div className="tk-page">
      <div className="tk-page-main">
        <div className="flex flex-col gap-2">
          <h1 className="tk-titel">{t(category.name)}</h1>
          <p className="text-lopend text-tekst-secundair">{t('category.holds')}</p>
        </div>

        {/* The list every page uses (ADR-112). */}
        <ul className="tk-lijst">
          {modules.map((module) => {
            const ModuleIcon = MODULE_ICON[module.id];

            return (
              <li key={module.id}>
                {/* A module that exists is a way in; one that does not says so
                    and cannot be pressed. Neither is dressed up as the other. */}
                <button
                  type="button"
                  data-module={module.id}
                  className="tk-lijstrij"
                  disabled={!module.built}
                  onClick={() => onOpen(module)}
                >
                  <span className="tk-plaat">
                    <ModuleIcon size={24} />
                  </span>
                  <span className="tk-lijstrij-tekst">
                    <span className="tk-lijstrij-titel">{t(module.name)}</span>
                    {module.built ? null : (
                      <span className="tk-lijstrij-regel">{t('soon.subtitle')}</span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {aside}
    </div>
  );
}
