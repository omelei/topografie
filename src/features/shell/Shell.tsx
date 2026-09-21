import type { ComponentType, ReactNode } from 'react';
import { brand } from '@/config/brand';
import { Wordmark } from '@/components/Wordmark';
import { FamilyIcon, PupilIcon, StarIcon, TodayIcon, type IconProps } from '@/components/Icon';
import { t } from '@/i18n';
import { MODULE_ICON } from './moduleIcons';
import {
  BUILT_DESTINATIONS,
  RAIL_MODULES,
  NAVIGATION_MINIMUM,
  type Destination,
  type Module,
} from './modules';
import { VakMenu } from './VakMenu';

/**
 * The frame around everything that is not a round, in three postures
 * (ADR-093).
 *
 * **From 1200 up** there is a mouse at eye level. The app bar carries the
 * wordmark and the destinations, and the modules stand in a rail on the left.
 *
 * **Below 1200** — a tablet either way up, and a phone — the app bar is the
 * mark, the streak and the child. The modules are one control under it that
 * opens into the same list, and the destinations lie along the bottom where a
 * thumb is. A tablet used to get the rail lying along the bottom and the
 * destinations in the app bar; the handoff swaps them, so both kinds of device
 * in a child's hand are held the same way. That one control is stuck to the top
 * of the glass and the app bar above it is not (ADR-121): the way to a vak is
 * the thing worth keeping within reach the whole way down a page, and the mark
 * and the streak are the thing worth spending the height on.
 *
 * Exactly one of each pair is displayed at any width — rail or menu, app bar
 * row or tab bar — so nothing is offered twice. Which one is CSS: the menu's
 * list is not in the document until it is opened, so a closed menu and the rail
 * never both answer to "Modules".
 *
 * **Nothing here appears during a round.** Not hidden: not rendered. A round
 * screen is not wrapped in this component at all (ADR-041), and
 * e2e/shell.spec.ts asserts it from the outside.
 *
 * **En er staat een overslaan-link bovenaan** (ADR-166). Aan een bureau staan
 * er twaalf knoppen vóór de inhoud — het merk, drie bestemmingen, het kind,
 * en zes vakken in de rail — en die staan op élke
 * pagina. Wie met het toetsenbord werkt, liep ze elke keer opnieuw af. De link
 * is onzichtbaar tot hij focus krijgt en springt naar `main`, dat daarvoor een
 * id en `tabIndex={-1}` heeft: een doel dat geen focus kan krijgen, verplaatst
 * de focus niet en dan doet de link niets voor wie hem het hardst nodig heeft.
 */

/** Waar de overslaan-link heen springt. */
const INHOUD_ID = 'inhoud';

/** A mark per destination, for the tab bar, where a row of words is read rather than recognised. */
const DESTINATION_ICON: Record<Destination['id'], ComponentType<Omit<IconProps, 'children'>>> = {
  vandaag: TodayIcon,
  vrienden: FamilyIcon,
  jij: PupilIcon,
  premium: StarIcon,
};

export interface ShellProps {
  readonly children: ReactNode;
  /**
   * Which destination is showing, when one is.
   *
   * Not all of them are: a module page is not Vandaag, and a screen that is not
   * a destination marks nothing, which is the truth and is also what a screen
   * reader should hear.
   */
  readonly current?: Destination['id'];
  readonly onNavigate?: (id: Destination['id']) => void;
  /** Which module is open, so the rail and the menu can say so truthfully. */
  readonly currentModule?: Module['id'];
  readonly onModule?: (id: Module['id']) => void;
  /** The streak, the profile switch — whatever the app bar is carrying today. */
  readonly bar?: ReactNode;
  /**
   * What the page stands on (ADR-120): the front door's ground, a module's —
   * on its page and on a category of it — or, left out, the plain paper.
   */
  readonly grond?: 'vandaag' | Module['id'] | undefined;
  /**
   * The two lists, injectable so the frame can be tested with more than the
   * entries that exist today. Nothing in the app passes them.
   */
  readonly modules?: readonly Module[];
  readonly destinations?: readonly Destination[];
}

/** Which ground `main` stands on: the front door's, a module's, or none of its own. */
function grondSoort(grond: ShellProps['grond']): 'vandaag' | 'vak' | undefined {
  if (grond === undefined) return undefined;
  return grond === 'vandaag' ? 'vandaag' : 'vak';
}

export function Shell({
  children,
  current,
  onNavigate,
  currentModule,
  onModule,
  bar,
  grond,
  modules = RAIL_MODULES,
  destinations = BUILT_DESTINATIONS,
}: ShellProps) {
  // A tab bar with one destination is a label you cannot press, so it waits
  // until there is somewhere to go. The modules no longer wait: ADR-051 makes
  // them the map of the product rather than an index of what is finished.
  const showModules = modules.length >= NAVIGATION_MINIMUM;
  const showDestinations = destinations.length >= NAVIGATION_MINIMUM;

  const destinationItems = destinations.map((destination) => ({
    ...destination,
    label: t(destination.name),
    Icon: DESTINATION_ICON[destination.id],
  }));

  return (
    <div className="flex min-h-screen flex-col bg-kaart">
      {/* Het eerste wat de tab-toets raakt, op elke pagina (ADR-166).
          De focus wordt met de hand verzet in plaats van aan het anker
          overgelaten: browsers zijn het er niet over eens of springen naar een
          fragment ook de focus meeneemt, en een link die de pagina wel scrollt
          maar de focus laat staan, helpt precies niemand. Het adres blijft
          schoon, want het volgende `pushState` schrijft toch alleen het pad. */}
      <a
        className="tk-overslaan"
        href={`#${INHOUD_ID}`}
        onClick={(event) => {
          event.preventDefault();
          const inhoud = document.getElementById(INHOUD_ID);
          inhoud?.focus();
          inhoud?.scrollIntoView();
        }}
      >
        {t('nav.overslaan')}
      </a>

      <header className="tk-appbar flex-none">
        {/* The logo, and the way back to the front door: Denker and the name,
            at every width (ADR-154). */}
        <button
          type="button"
          className="tk-brand"
          aria-label={t('nav.home', { merk: brand.name })}
          onClick={() => onNavigate?.('vandaag')}
        >
          <Wordmark className="tk-logo" />
        </button>

        {showDestinations ? (
          <nav aria-label={t('nav.destinations')} className="tk-navbar hidden desk:flex">
            {destinationItems.map((destination) => (
              <button
                key={destination.id}
                type="button"
                aria-current={destination.id === current ? 'page' : undefined}
                className="tk-navbar-item"
                onClick={() => onNavigate?.(destination.id)}
              >
                {destination.label}
              </button>
            ))}
          </nav>
        ) : null}

        {bar}
      </header>

      {/* The vak menu, and the box that keeps it on the glass (ADR-121). The
          sticky is here rather than inside VakMenu because a sticky box can
          only travel inside its containing block: on the component's own root
          that block is this wrapper, which is exactly as tall as the menu, and
          it would not move at all. Here the block is the page's column. */}
      {showModules ? (
        <div className="tk-vakmenu-houder flex-none desk:hidden">
          <VakMenu modules={modules} current={currentModule} onModule={onModule} />
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1">
        {showModules ? (
          <nav aria-label={t('nav.modules')} className="tk-rail hidden desk:flex">
            {modules.map((module) => {
              const ModuleIcon = MODULE_ICON[module.id];

              return (
                <button
                  key={module.id}
                  type="button"
                  data-module={module.id}
                  data-accent="module"
                  aria-current={module.id === currentModule ? 'page' : undefined}
                  className="tk-rail-item"
                  onClick={() => onModule?.(module.id)}
                >
                  <span className="tk-plaat tk-plaat-rail">
                    <ModuleIcon size={20} />
                  </span>
                  {t(module.name)}
                </button>
              );
            })}
          </nav>
        ) : null}

        <main
          id={INHOUD_ID}
          tabIndex={-1}
          className="tk-grond min-h-0 min-w-0 flex-1"
          data-grond={grondSoort(grond)}
          data-module={grond === 'vandaag' ? undefined : grond}
        >
          {children}
        </main>
      </div>

      {showDestinations ? (
        <nav aria-label={t('nav.destinations')} className="tk-tabbar flex-none desk:hidden">
          {destinationItems.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              aria-current={id === current ? 'page' : undefined}
              className="tk-tabbar-item"
              onClick={() => onNavigate?.(id)}
            >
              <Icon size={24} />
              {label}
            </button>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
