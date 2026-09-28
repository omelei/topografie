import { useEffect, useId, useState, type ComponentType, type ReactNode } from 'react';
import { brand } from '@/config/brand';
import { Wordmark } from '@/components/Wordmark';
import {
  ChevronDownIcon,
  FamilyIcon,
  OefenenIcon,
  PremiumFilledIcon,
  PupilIcon,
  SlotIcon,
  StarIcon,
  TodayIcon,
  type IconProps,
} from '@/components/Icon';
import { t } from '@/i18n';
import { MODULE_ICON } from './moduleIcons';
import {
  BUILT_DESTINATIONS,
  RAIL_MODULES,
  NAVIGATION_MINIMUM,
  type Destination,
  type Module,
} from './modules';

/**
 * The frame around everything that is not a round, in two postures (ADR-093,
 * ADR-241).
 *
 * **From 1200 up** there is a mouse at eye level. The bar at the top carries
 * the wordmark, premium and the child; the destinations and the modules stand
 * in a side bar on the left: Vandaag, Oefenen with the five modules under it
 * (it folds away), a rule, Jij and Ouders.
 *
 * **Below 1200** — a tablet either way up, and a phone — the bar stands on
 * the ground: the mark, and three round buttons for premium, Ouders and the
 * child. Vandaag, Oefenen and Jij lie along the bottom where a thumb is, and
 * a vak is reached through Oefenen (`/oefenen`), which stays marked inside
 * every vak.
 *
 * "Hier ben je" looks the same everywhere (ADR-241): a tint behind the whole
 * row or tab. A destination's icon keeps its own colour when it is the one you
 * are on; only the row and the word change. Premium is the one loud button.
 *
 * Exactly one of each pair is displayed at any width — side bar or tab bar,
 * Ouders in the side bar or in the bar — so nothing is offered twice. Which
 * one is CSS.
 *
 * **Nothing here appears during a round.** Not hidden: not rendered. A round
 * screen is not wrapped in this component at all (ADR-041), and
 * e2e/shell.spec.ts asserts it from the outside.
 *
 * **En er staat een overslaan-link bovenaan** (ADR-166). Aan een bureau staan
 * er ruim tien knoppen vóór de inhoud — het merk, premium, het kind, en de
 * bestemmingen en vakken in de zijbalk — en die staan op élke
 * pagina. Wie met het toetsenbord werkt, liep ze elke keer opnieuw af. De link
 * is onzichtbaar tot hij focus krijgt en springt naar `main`, dat daarvoor een
 * id en `tabIndex={-1}` heeft: een doel dat geen focus kan krijgen, verplaatst
 * de focus niet en dan doet de link niets voor wie hem het hardst nodig heeft.
 */

/** Waar de overslaan-link heen springt. */
const INHOUD_ID = 'inhoud';

/** A mark per destination: a line icon, always in secondary ink on peach. */
const DESTINATION_ICON: Record<Destination['id'], ComponentType<Omit<IconProps, 'children'>>> = {
  vandaag: TodayIcon,
  oefenen: OefenenIcon,
  vrienden: FamilyIcon,
  jij: PupilIcon,
  premium: StarIcon,
  ouders: SlotIcon,
};

/** Wat in de zijbalk staat, boven en onder de lijn (ADR-241). */
const ZIJBALK_BOVEN: readonly Destination['id'][] = ['vandaag', 'oefenen'];
const ZIJBALK_ONDER: readonly Destination['id'][] = ['jij', 'ouders'];
/** Wat onderaan een telefoon staat: Oefenen in het midden. */
const TABBALK: readonly Destination['id'][] = ['vandaag', 'oefenen', 'jij'];

/**
 * Of de vakken onder Oefenen openstaan, bewaard op dit apparaat (ADR-241).
 * Standaard open. Een browser die geen opslag toelaat, krijgt gewoon open.
 */
const OEFENEN_OPEN = 'nav.oefenenOpen';

function leesOefenenOpen(): boolean {
  try {
    return window.localStorage.getItem(OEFENEN_OPEN) !== 'false';
  } catch {
    return true;
  }
}

function useOefenenOpen(): readonly [boolean, (open: boolean) => void] {
  const [open, zetOpen] = useState(leesOefenenOpen);
  useEffect(() => {
    try {
      window.localStorage.setItem(OEFENEN_OPEN, String(open));
    } catch {
      // Geen opslag: dan is het alleen voor deze pagina.
    }
  }, [open]);
  return [open, zetOpen];
}

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
  const [oefenenOpen, zetOefenenOpen] = useOefenenOpen();
  const vakkenId = useId();

  const bestemming = (id: Destination['id']) => {
    const destination = destinations.find((candidate) => candidate.id === id);
    if (!destination) return null;
    return { ...destination, label: t(destination.name), Icon: DESTINATION_ICON[id] };
  };
  const bestemmingen = (ids: readonly Destination['id'][]) =>
    ids.flatMap((id) => {
      const gevonden = bestemming(id);
      return gevonden ? [gevonden] : [];
    });

  const premium = showDestinations ? bestemming('premium') : null;
  const ouders = showDestinations ? bestemming('ouders') : null;
  // In een vak ben je in Oefenen. De rij van dat vak zegt het in de zijbalk;
  // staat de lijst dicht, of staat het vak er niet in, dan zegt Oefenen het.
  const inVak = currentModule !== undefined;
  const vakInLijst = showModules && modules.some((module) => module.id === currentModule);
  const oefenenHier: 'page' | 'true' | undefined =
    current === 'oefenen' ? 'page' : inVak && (!oefenenOpen || !vakInLijst) ? 'true' : undefined;

  const zijbalkRij = ({ id, label, Icon }: NonNullable<ReturnType<typeof bestemming>>) => {
    if (id === 'oefenen') {
      return (
        <div key={id} className="tk-zijbalk-oefenen" data-hier={oefenenHier ? '' : undefined}>
          <button
            type="button"
            aria-current={oefenenHier}
            className="tk-zijbalk-rij"
            onClick={() => {
              zetOefenenOpen(true);
              onNavigate?.(id);
            }}
          >
            <span className="tk-plaat tk-plaat-neutraal tk-zijbalk-plaat" aria-hidden="true">
              <Icon size={20} />
            </span>
            {label}
          </button>
          {showModules ? (
            <button
              type="button"
              className="tk-zijbalk-chevron"
              aria-expanded={oefenenOpen}
              aria-controls={vakkenId}
              aria-label={t(oefenenOpen ? 'nav.vakkenInklappen' : 'nav.vakkenUitklappen')}
              onClick={() => zetOefenenOpen(!oefenenOpen)}
            >
              <ChevronDownIcon size={20} />
            </button>
          ) : null}
        </div>
      );
    }
    return (
      <button
        key={id}
        type="button"
        aria-current={id === current ? 'page' : undefined}
        className="tk-zijbalk-rij"
        onClick={() => onNavigate?.(id)}
      >
        <span className="tk-plaat tk-plaat-neutraal tk-zijbalk-plaat" aria-hidden="true">
          <Icon size={20} />
        </span>
        {label}
      </button>
    );
  };

  return (
    <div className="tk-schil bg-grond">
      {/* Op een telefoon scrolt dit deel, en staat het menu eronder in plaats
          van eroverheen (zie `.tk-schil` in index.css). Vanaf 1200 is het
          gewoon de pagina. */}
      <div className="tk-schil-rol">
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

          <div className="tk-appbar-acties">
            {/* Premium, de ene knop die opvalt (ADR-241): zon, en nacht als je
                er bent. Een pil met het woord aan een bureau, een ronde knop
                op een telefoon; het woord blijft dan de naam. */}
            {premium ? (
              <button
                type="button"
                aria-current={current === 'premium' ? 'page' : undefined}
                className="tk-premium-pil"
                onClick={() => onNavigate?.('premium')}
              >
                <PremiumFilledIcon size={24} />
                <span className="tk-premium-pil-naam">{premium.label}</span>
              </button>
            ) : null}
            {/* Ouders staat aan een bureau in de zijbalk, en hier alleen onder
                1200. */}
            {ouders ? (
              <button
                type="button"
                aria-current={current === 'ouders' ? 'page' : undefined}
                aria-label={ouders.label}
                className="tk-balkknop desk:hidden"
                onClick={() => onNavigate?.('ouders')}
              >
                <ouders.Icon size={20} />
              </button>
            ) : null}
            {bar}
          </div>
        </header>

        {/* Geen min-h-0: in de rol die scrolt, kromp deze rij tot de hoogte
            van het scherm en liep de pagina eroverheen, buiten het zand van
            `main`, op het wit van de schil. */}
        <div className="flex flex-1">
          {showDestinations ? (
            <nav aria-label={t('nav.destinations')} className="tk-zijbalk hidden desk:flex">
              {bestemmingen(ZIJBALK_BOVEN).map(zijbalkRij)}
              {showModules ? (
                <ul
                  id={vakkenId}
                  aria-label={t('nav.modules')}
                  className="tk-zijbalk-vakken"
                  hidden={!oefenenOpen}
                >
                  {modules.map((module) => {
                    const ModuleIcon = MODULE_ICON[module.id];
                    return (
                      <li key={module.id}>
                        <button
                          type="button"
                          data-module={module.id}
                          aria-current={module.id === currentModule ? 'page' : undefined}
                          className="tk-zijbalk-rij"
                          onClick={() => onModule?.(module.id)}
                        >
                          <span className="tk-plaat tk-zijbalk-plaat" aria-hidden="true">
                            <ModuleIcon size={20} />
                          </span>
                          {t(module.name)}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
              <hr className="tk-zijbalk-lijn" />
              {bestemmingen(ZIJBALK_ONDER).map(zijbalkRij)}
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
      </div>

      {showDestinations ? (
        <nav aria-label={t('nav.destinations')} className="tk-tabbar flex-none desk:hidden">
          {bestemmingen(TABBALK).map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              // Oefenen is de tab van elk vak: daar ben je in Oefenen, al is het
              // niet de pagina zelf.
              aria-current={
                id === current ? 'page' : id === 'oefenen' && inVak ? 'true' : undefined
              }
              className="tk-tabbar-item"
              onClick={() => onNavigate?.(id)}
            >
              <span className="tk-tabbar-teken" aria-hidden="true">
                <Icon size={24} />
              </span>
              {label}
            </button>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
