import { useEffect, useId, useRef, useState, type FocusEvent, type KeyboardEvent } from 'react';
import { ChevronDownIcon, ChevronUpIcon, CorrectIcon, MenuIcon } from '@/components/Icon';
import { t } from '@/i18n';
import { MODULE_ICON } from './moduleIcons';
import type { Module } from './modules';

/**
 * The modules below 1200: one control under the app bar that opens into the
 * list the rail shows at a desk (ADR-093).
 *
 * It replaces two things. On a tablet the rail used to lie along the bottom of
 * the screen, a second bar of five under a page that now has the tab bar
 * there. On a phone there was no way to a module at all except the tiles on the
 * front door. One control that says which module you are in, and opens into all
 * five, does both jobs in one row.
 *
 * ADR-121 made it the loudest thing under the app bar and stuck it there. Three
 * changes, and each is a separate reason:
 *
 * - **It sticks.** `Shell` wraps it in `.tk-vakmenu-houder`, which is what
 *   carries `position: sticky` — the row *and* its open panel in one box, so an
 *   open menu is never anchored to a place the page has scrolled past.
 * - **It says "Oefenen" where no module is open**, because in that state it is
 *   not a read-out of where you are but the way to a round, and a control that
 *   names its own job is pressed.
 * - **The word "vak" left the row.** It was a grey label in front of the button
 *   taking width off a 393 phone, and with "Oefenen" on the button it said the
 *   same thing twice. It survives in the button's accessible name, where "Topo"
 *   on its own does not say what kind of thing Topo is.
 *
 * The rest of its behaviour, from the handoff and the disclosure pattern:
 *
 * - a button that says which module you are in, with `aria-expanded`;
 * - the list opens under it, in the flow of the page rather than over it, and
 *   focus goes to the module you are in;
 * - the arrow keys, Home and End move through the list;
 * - it closes on a choice, on Escape, on a press outside it and on tabbing out
 *   of it — and after the first two, focus is back on the button;
 * - the module you are in is `aria-current="page"`, exactly as in the rail.
 *
 * A disclosure holding a navigation rather than an ARIA menu. These are five
 * places to go, and `role="menu"` would tell a screen reader to expect
 * application commands and take its reading keys away to get there.
 */
export function VakMenu({
  modules,
  current,
  onModule,
}: {
  readonly modules: readonly Module[];
  readonly current?: Module['id'] | undefined;
  readonly onModule?: ((id: Module['id']) => void) | undefined;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const wrap = useRef<HTMLDivElement>(null);
  const knop = useRef<HTMLButtonElement>(null);
  const lijst = useRef<HTMLUListElement>(null);

  const actief = modules.find((module) => module.id === current) ?? null;
  const ActiefIcon = actief ? MODULE_ICON[actief.id] : MenuIcon;

  useEffect(() => {
    if (!open) return;

    // Into the list, on the module you are in: that is the one a child who
    // opened this by accident wants to press again.
    const opties = [...(lijst.current?.querySelectorAll<HTMLButtonElement>('button') ?? [])];
    (opties.find((optie) => optie.getAttribute('aria-current') === 'page') ?? opties[0])?.focus();

    const buiten = (event: PointerEvent) => {
      if (!wrap.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', buiten);
    return () => document.removeEventListener('pointerdown', buiten);
  }, [open]);

  function sluit() {
    setOpen(false);
    knop.current?.focus();
  }

  function toets(event: KeyboardEvent<HTMLDivElement>) {
    if (!open) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      sluit();
      return;
    }

    const opties = [...(lijst.current?.querySelectorAll<HTMLButtonElement>('button') ?? [])];
    const nu = opties.indexOf(document.activeElement as HTMLButtonElement);
    const laatste = opties.length - 1;
    const naar =
      event.key === 'ArrowDown'
        ? nu === laatste
          ? 0
          : nu + 1
        : event.key === 'ArrowUp'
          ? nu <= 0
            ? laatste
            : nu - 1
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? laatste
              : null;
    if (naar === null) return;

    event.preventDefault();
    opties[naar]?.focus();
  }

  // Tabbing out of it closes it. Only when focus actually went somewhere: a
  // press on something that takes no focus is the pointer handler's to judge,
  // and Safari does not focus a button it is pressing, which would otherwise
  // read as leaving and reopen it on the same click.
  function weg(event: FocusEvent<HTMLDivElement>) {
    const naar = event.relatedTarget as Node | null;
    if (open && naar !== null && !wrap.current?.contains(naar)) setOpen(false);
  }

  return (
    <div ref={wrap} className="tk-vakmenu" onKeyDown={toets} onBlur={weg}>
      <div className="tk-vakmenu-rij">
        <button
          ref={knop}
          type="button"
          className="tk-vakmenu-knop"
          data-module={actief?.id}
          aria-expanded={open}
          aria-controls={open ? `${id}-lijst` : undefined}
          aria-label={actief ? t('nav.vakHuidig', { vak: t(actief.name) }) : t('nav.vakKies')}
          onClick={() => setOpen(!open)}
        >
          <span
            className={
              actief ? 'tk-plaat tk-plaat-klein' : 'tk-plaat tk-plaat-klein tk-plaat-neutraal'
            }
          >
            <ActiefIcon size={22} />
          </span>
          <span className="tk-vakmenu-naam">{actief ? t(actief.name) : t('nav.vakKies')}</span>
          {open ? <ChevronUpIcon size={22} /> : <ChevronDownIcon size={22} />}
        </button>
      </div>

      {open ? (
        <nav id={`${id}-lijst`} aria-label={t('nav.modules')} className="tk-vakmenu-paneel">
          <ul ref={lijst} className="tk-vakmenu-lijst">
            {modules.map((module) => {
              const ModuleIcon = MODULE_ICON[module.id];
              const hier = module.id === current;

              return (
                <li key={module.id}>
                  <button
                    type="button"
                    data-module={module.id}
                    data-accent="module"
                    className="tk-vakmenu-optie"
                    aria-current={hier ? 'page' : undefined}
                    onClick={() => {
                      sluit();
                      onModule?.(module.id);
                    }}
                  >
                    <span className="tk-plaat">
                      <ModuleIcon size={20} />
                    </span>
                    <span className="min-w-0 flex-1">{t(module.name)}</span>
                    {hier ? <CorrectIcon size={22} /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
