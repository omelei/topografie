import { useEffect, useState } from 'react';
import { HomeScreen } from '@/features/home/HomeScreen';
import { SideColumn } from '@/features/home/SideColumn';
import { PracticeScreen } from '@/features/practice/PracticeScreen';
import { ExploreScreen } from '@/features/explore/ExploreScreen';
import { ProfileGate } from '@/features/player/ProfileGate';
import { Gallery } from '@/design/Gallery';
import { DiagnoseScherm } from '@/features/diagnose/DiagnoseScherm';
import { Shell } from '@/features/shell/Shell';
import { TopBar } from '@/features/shell/TopBar';
import { RetentionScreen } from '@/features/retention/RetentionScreen';
import { MODULES, type Destination, type Module } from '@/features/shell/modules';
import { useRoute } from '@/features/shell/useRoute';
import { ModuleSoon } from '@/features/shell/ModuleSoon';
import { CategoryScreen } from '@/features/shell/CategoryScreen';
import { ModuleScreen } from '@/features/module/ModuleScreen';
import { SumScreen } from '@/features/sums/SumScreen';
import { KlokScreen } from '@/features/klok/KlokScreen';
import { VlagScreen } from '@/features/vlaggen/VlagScreen';
import { VlagExploreScreen } from '@/features/vlaggen/VlagExploreScreen';
import type { VlagMode } from '@/features/vlaggen/useVlagRound';
import { isVlagFouten, isVlagMix } from '@/content/loadVlaggen';
import { TaalScreen } from '@/features/taal/TaalScreen';
import { TaalExploreScreen } from '@/features/taal/TaalExploreScreen';
import type { TaalMode } from '@/features/taal/taalRegels';
import { isTaalFouten, isTaalMix, taalDeelVan } from '@/content/loadTaal';
import {
  asKlokMode,
  asPracticeMode,
  asSumMode,
  asTaalMode,
  asVlagMode,
  type Onderdeel,
} from '@/features/module/onderdelen';
import { ProfileScreen } from '@/features/player/ProfileScreen';
import { ParentScreen } from '@/features/player/ParentScreen';
import { loadPreferences, zetRustig } from '@/features/player/settings';
import { Afzwemmen } from '@/features/afzwemmen/Afzwemmen';
import { doelwitVan } from '@/features/home/doel';
import { PremiumScreen } from '@/features/premium/PremiumScreen';
import { vraagOuders } from '@/features/premium/ouderVraag';
import { usePremium } from '@/features/premium/usePremium';
import { isPremiumOnderwerp, isPremiumVorm } from '@/features/module/premium';
import { controleerOpnieuw } from '@/store/premium';
import type { Route } from '@/features/shell/routes';
import { getProfile } from '@/store/profile';
import { dagplan, isDiplomaVorm, type ModeId } from '@/game-core';
import { geplaatst, onderdelen, startbareOnderdelen } from '@/features/module/onderdelen';
import { loadItemStates, loadPlayedRounds } from '@/store/progress';
import { leesDagstand } from '@/store/dagstandStore';
import { standVoor, volgendeSet } from '@/features/home/dagstand';
import { planSets, vormVoor } from '@/features/home/useVandaag';
import {
  isFoutenSet,
  isMixSet,
  type PracticeMode,
  type RoundSetId,
  type SetId,
} from '@/features/practice/useRound';
import type { SumMode } from '@/features/sums/useSumRound';
import type { KlokMode } from '@/features/klok/useKlokRound';
import {
  herhaalKaartVorm,
  herhaalKlokVorm,
  herhaalSomVorm,
  herhaalTaalVorm,
  herhaalVlagVorm,
} from '@/features/round/herhaal';
import type { ProfileRecord } from '@/store/db';

type Screen =
  | { name: 'home' }
  | { name: 'retention' }
  | {
      name: 'practice';
      setId: RoundSetId;
      practiceMode: PracticeMode;
      aantal: number | null;
      toetsstand: boolean;
      /** "Herhaal je fouten": the only items this round asks (ADR-111). */
      alleen: readonly string[] | null;
    }
  | { name: 'explore'; setId: SetId }
  | {
      name: 'sums';
      setId: string;
      sumMode: SumMode;
      aantal: number | null;
      toetsstand: boolean;
      alleen: readonly string[] | null;
    }
  | {
      name: 'klok';
      setId: string;
      klokMode: KlokMode;
      aantal: number | null;
      toetsstand: boolean;
      alleen: readonly string[] | null;
    }
  | {
      name: 'vlag';
      setId: string;
      vlagMode: VlagMode;
      aantal: number | null;
      toetsstand: boolean;
      alleen: readonly string[] | null;
    }
  | { name: 'vlag-ontdek'; setId: string }
  | {
      name: 'taal';
      setId: string;
      taalMode: TaalMode;
      aantal: number | null;
      toetsstand: boolean;
      alleen: readonly string[] | null;
    }
  | { name: 'taal-ontdek'; setId: string }
  | { name: 'afzwemmen'; deel: Onderdeel; mode: ModeId };
type Boot = { status: 'loading' } | { status: 'ready'; profile: ProfileRecord | null };

/**
 * Eight screens and a router of about sixty lines.
 *
 * This comment used to say a router would be furniture until there was more
 * than one module. There still is one; the reason changed. A module has an
 * address now, and §A's "leer.nu/topografie" only reads as a sentence if the
 * path is real. Hand-rolled rather than a package: the whole map is literal
 * paths with one optional segment and no nesting.
 *
 * A round has no address, on purpose. It is something you are in the middle of,
 * and a URL that resumed one halfway would either lie about the progress or
 * throw it away — which is why the round screens are chosen by `screen` and
 * everything else by `route`.
 *
 * The practice screen is keyed on each visit so a second round starts genuinely
 * fresh rather than reusing the first round's state.
 */
export default function App() {
  const [boot, setBoot] = useState<Boot>({ status: 'loading' });
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const [visit, setVisit] = useState(0);
  // "Bekijk alle diploma's" op de voordeur opent Jij met de prijzenkast open
  // (ADR-153). Eén keer: wie daarna zelf naar Jij gaat, ziet hem zoals altijd.
  const [diplomasOpen, setDiplomasOpen] = useState(false);
  const [route, go] = useRoute();
  const { actief: premium } = usePremium();

  // The tab bar's four destinations, two of which exist. Mapping them here
  // rather than inside the Shell keeps the frame ignorant of what a screen is.
  const goHome = () => {
    go({ name: 'home' });
    setScreen({ name: 'home' });
  };

  const goModule = (id: Module['id']) => {
    const module = MODULES.find((candidate) => candidate.id === id);
    if (!module) return;
    setScreen({ name: 'home' });
    go(module.built ? { name: 'module', module, setId: null } : { name: 'soon', module });
  };

  const bar =
    boot.status === 'ready' && boot.profile ? (
      <TopBar profile={boot.profile} onProfile={() => go({ name: 'you' })} />
    ) : null;

  const goTo = (id: Destination['id']) => {
    const next: Route =
      id === 'onthouden'
        ? { name: 'retention' }
        : id === 'jij'
          ? { name: 'you' }
          : { name: 'home' };
    go(next);
    setScreen({ name: 'home' });
  };

  /**
   * One way into a round, wherever in the app it is pressed.
   *
   * Exploring is the odd one: it is a way of practising as far as a child is
   * concerned and it is not a round, so it is the one mode that opens a
   * different screen. That branch belongs here rather than in the page, because
   * the page's job is to say what was chosen and this is the thing that knows
   * what a screen is.
   */
  const beginRonde = (
    deel: Onderdeel,
    mode: ModeId,
    aantal: number | null = null,
    toetsstand = false,
    alleen: readonly string[] | null = null,
    naIntro = false,
  ) => {
    // The one place every round starts, so the one place premium is asked
    // (ADR-116): a favourite, a line in the history or an unfinished round in
    // a premium way asks first. Sinds ADR-163 is dat een pop-up en niet meer
    // de hele premiumpagina: een kind dat op een spel drukte hoort niet in een
    // etalage te staan, en de code die het nodig heeft ligt bij zijn ouders.
    if (!premium && (toetsstand || isPremiumVorm(mode) || isPremiumOnderwerp(deel.setId))) {
      vraagOuders();
      return;
    }

    // A diploma is sat, not started (ADR-149): first what it asks, whether the
    // page is ripe, and whether someone watches. Not for "Herhaal je fouten"
    // or "Maak af", which are no diploma, and not twice.
    if (isDiplomaVorm(mode) && alleen === null && !naIntro && doelwitVan(deel) !== null) {
      setScreen({ name: 'afzwemmen', deel, mode });
      return;
    }

    setVisit(visit + 1);

    // Flags explore on a screen of their own, like the map, and the mix and
    // the child's own mistakes have nothing to explore (`forms.ts`).
    if (deel.moduleId === 'vlaggen') {
      if (mode === 'ontdekken' && !isVlagMix(deel.setId) && !isVlagFouten(deel.setId)) {
        setScreen({ name: 'vlag-ontdek', setId: deel.setId });
        return;
      }
      const vlagMode = asVlagMode(mode);
      setScreen({ name: 'vlag', setId: deel.setId, vlagMode, aantal, toetsstand, alleen });
      return;
    }
    // Taal explores on a screen of its own too, and asks the way its part
    // does: letters or words for spelling, forms for verbs (ADR-118).
    if (deel.moduleId === 'woorden') {
      if (mode === 'ontdekken' && !isTaalMix(deel.setId) && !isTaalFouten(deel.setId)) {
        setScreen({ name: 'taal-ontdek', setId: deel.setId });
        return;
      }
      const taalMode = asTaalMode(mode, deel.setId);
      setScreen({ name: 'taal', setId: deel.setId, taalMode, aantal, toetsstand, alleen });
      return;
    }
    if (deel.moduleId === 'klok') {
      const klokMode = asKlokMode(mode);
      setScreen({ name: 'klok', setId: deel.setId, klokMode, aantal, toetsstand, alleen });
      return;
    }
    if (deel.moduleId !== 'topo') {
      setScreen({
        name: 'sums',
        setId: deel.setId,
        sumMode: asSumMode(mode),
        aantal,
        toetsstand,
        alleen,
      });
      return;
    }
    // Exploring is one set's own layer, so the mix has no way of exploring and
    // does not offer one (`forms.ts`). A stored favourite from before that rule
    // could still ask for it, and it points instead than fails.
    if (mode === 'ontdekken' && !isMixSet(deel.setId) && !isFoutenSet(deel.setId)) {
      setScreen({ name: 'explore', setId: deel.setId as SetId });
      return;
    }
    setScreen({
      name: 'practice',
      setId: deel.setId as RoundSetId,
      practiceMode: asPracticeMode(mode),
      aantal,
      toetsstand,
      alleen,
    });
  };

  /**
   * "Maak af" (ADR-115): the round a child left, picked up where it stopped —
   * the same set, the same way, and only the questions it had not asked yet.
   */
  const maakAf = (deel: Onderdeel, mode: ModeId, rest: readonly string[]) => {
    if (rest.length === 0) return;
    beginRonde(deel, mode, rest.length, false, [...rest]);
  };

  /**
   * De volgende ronde van vandaag, vanaf het uitslagscherm (ADR-139).
   *
   * Het plan wordt hier vers gerekend en niet meegedragen: tussen het begin van
   * de ronde en dit moment is er precies één ding veranderd — de ronde die net
   * gespeeld is — en dat is nou juist wat eraf moet.
   */
  const vandaagVerder = () => {
    void (async () => {
      const states = await loadItemStates();
      const plan = dagplan(planSets(startbareOnderdelen()), states, new Date());
      const open = plan.rondes.map((ronde) => ronde.set.setId);
      const stand = standVoor(await leesDagstand(), open, new Date());
      if (stand === null) return;

      const eerste = volgendeSet(stand, open);
      const ronde = eerste === null ? null : plan.rondes.find((r) => r.set.setId === eerste);
      if (!ronde) return;

      const gespeeld = geplaatst(await loadPlayedRounds(), startbareOnderdelen());
      maakAf(ronde.set, vormVoor(ronde.set, gespeeld), ronde.ids);
    })();
  };

  /**
   * "Nieuwe plaatjes", vanaf het uitslagscherm als vandaag klaar is (ADR-149).
   *
   * Wie na "klaar voor vandaag" toch door wil, krijgt plaatjes die nog leeg zijn
   * en geen herhaling van wat nog niet aan de beurt is: die telt pas weer als
   * het terugkomt. Eerst de set van de ronde zelf als daar nog lege plaatjes in
   * zitten, anders de eerste set van dezelfde module die ze nog heeft. Heeft de
   * hele module er geen meer, dan terug naar de voordeur.
   */
  const nieuwePlaatjes = (setId: string) => {
    void (async () => {
      const states = await loadItemStates();
      const alles = startbareOnderdelen();
      const huidig = alles.find((deel) => deel.setId === setId) ?? null;
      const heeftLeeg = (deel: Onderdeel) =>
        deel.items.some((item) => (states.get(item.id)?.laatsteReview ?? null) === null);
      const volgende =
        huidig !== null && !huidig.mix && heeftLeeg(huidig)
          ? huidig
          : onderdelen().find((deel) => deel.moduleId === huidig?.moduleId && heeftLeeg(deel));
      if (!volgende) {
        goHome();
        return;
      }
      const gespeeld = geplaatst(await loadPlayedRounds(), alles);
      beginRonde(volgende, vormVoor(volgende, gespeeld));
    })();
  };

  /**
   * "Herhaal je fouten" (ADR-111): the same set straight away, asking what the
   * round just finished got wrong and nothing else — as practice, with the
   * answers shown, in a way that has a length (`round/herhaal.ts`).
   *
   * Free since ADR-122, unlike the collected list of mistakes on the module
   * page: this one reaches no further than the round a child has just played,
   * so it is part of that round rather than a record kept across weeks — and
   * going back over what you just got wrong is the mechanism the product is
   * named after, which is not a thing to sell.
   */
  const herhaal = (ids: readonly string[]) => {
    if (ids.length === 0) return;
    const alleen = [...ids];
    const aantal = alleen.length;
    setVisit(visit + 1);

    if (screen.name === 'practice') {
      const practiceMode = herhaalKaartVorm(screen.practiceMode);
      setScreen({ ...screen, practiceMode, aantal, toetsstand: false, alleen });
    } else if (screen.name === 'sums') {
      const sumMode = herhaalSomVorm(screen.sumMode);
      setScreen({ ...screen, sumMode, aantal, toetsstand: false, alleen });
    } else if (screen.name === 'klok') {
      const klokMode = herhaalKlokVorm(screen.klokMode);
      setScreen({ ...screen, klokMode, aantal, toetsstand: false, alleen });
    } else if (screen.name === 'vlag') {
      const vlagMode = herhaalVlagVorm(screen.vlagMode);
      setScreen({ ...screen, vlagMode, aantal, toetsstand: false, alleen });
    } else if (screen.name === 'taal') {
      const deel = taalDeelVan(screen.setId) ?? 'spelling';
      const taalMode = herhaalTaalVorm(screen.taalMode, deel);
      setScreen({ ...screen, taalMode, aantal, toetsstand: false, alleen });
    }
  };

  /**
   * A new screen starts at the top.
   *
   * There is no page load between screens — the router swaps a component — so
   * the browser keeps the scroll position of the one before. On a phone that
   * meant arriving at the chooser already scrolled past its own heading, with
   * the wordmark cut in half, because the button that opens it sits below the
   * fold on the screen you press it from.
   */
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen.name, route.name]);

  useEffect(() => {
    void getProfile().then((profile) => setBoot({ status: 'ready', profile: profile ?? null }));
  }, []);

  // Once a week, if there is a code on this device: is it still good? Nothing
  // is asked when there is no code, so a device without premium still asks
  // nobody anything (ADR-116).
  useEffect(() => {
    void controleerOpnieuw();
  }, []);

  // Minder beweging staat op het document, dus het wordt gezet voordat er een
  // scherm beweegt, en niet pas wanneer iemand Voor ouders opent (ADR-145).
  useEffect(() => {
    void loadPreferences().then((prefs) => zetRustig(prefs.rustig));
  }, []);

  // The component gallery, in development only. import.meta.env.DEV is
  // replaced with a literal at build time, so this branch and everything under
  // it is dropped from the production bundle rather than hidden in it —
  // asserted by tools/report-bundle-size.mjs, because "should be tree-shaken"
  // is a belief until something checks.
  if (import.meta.env.DEV && window.location.hash === '#componenten') {
    return <Gallery />;
  }

  // Waar haken ze af (ADR-128). Anders dan de galerij hierboven gaat dit wél
  // mee in de build, en dat is de reden dat het bestaat: de geschiedenis waar
  // het over rekent staat op het apparaat waarop een kind oefent, en dat is de
  // echte app. Het staat in geen enkel menu en leest alleen wat er al staat.
  if (window.location.hash === '#diagnose') {
    return <DiagnoseScherm />;
  }

  // No spinner: reading one record from IndexedDB is fast enough that a spinner
  // would flash rather than inform.
  if (boot.status === 'loading') return <div aria-busy="true" />;

  if (boot.profile === null) {
    return (
      <ProfileGate
        // "Ik ben een ouder" op de eerste vraag opent Voor ouders in plaats van
        // de voordeur (ADR-161). Het profiel is er dan al — de app heeft er
        // overal een nodig — en het draagt geen groep, precies als bij "Zeg ik
        // niet". Alleen het adres is anders.
        onReady={(profile, naarOuder) => {
          setBoot({ status: 'ready', profile });
          if (naarOuder) go({ name: 'ouder' });
        }}
      />
    );
  }

  // Explore and practice are rounds, and a round has no navigation: no rail,
  // no bar, no tab bar, only the stop cross, the progress dots and the
  // read-aloud button. They are not wrapped in the Shell rather than having it
  // hidden inside them — there is nothing in the document to tab into, and
  // nothing that can be forgotten on the way back out.
  if (screen.name === 'explore') {
    return <ExploreScreen setId={screen.setId} onHome={goHome} />;
  }

  if (screen.name === 'afzwemmen') {
    return (
      <Afzwemmen
        deel={screen.deel}
        mode={screen.mode}
        onBegin={() => beginRonde(screen.deel, screen.mode, null, false, null, true)}
        // Back to the page it was opened from, which the address still names.
        onTerug={() => setScreen({ name: 'home' })}
      />
    );
  }

  if (screen.name === 'sums') {
    return (
      <SumScreen
        key={`${screen.setId}-${screen.sumMode}-${screen.aantal ?? 0}-${visit}`}
        setId={screen.setId}
        mode={screen.sumMode}
        aantal={screen.aantal}
        toetsstand={screen.toetsstand}
        onHome={goHome}
        onAgain={() => setVisit(visit + 1)}
        alleen={screen.alleen}
        onHerhaal={herhaal}
        onVandaagVerder={vandaagVerder}
        onNieuwePlaatjes={() => nieuwePlaatjes(screen.setId)}
      />
    );
  }

  if (screen.name === 'klok') {
    return (
      <KlokScreen
        key={`${screen.setId}-${screen.klokMode}-${screen.aantal ?? 0}-${visit}`}
        setId={screen.setId}
        mode={screen.klokMode}
        aantal={screen.aantal}
        toetsstand={screen.toetsstand}
        onHome={goHome}
        onAgain={() => setVisit(visit + 1)}
        alleen={screen.alleen}
        onHerhaal={herhaal}
        onVandaagVerder={vandaagVerder}
        onNieuwePlaatjes={() => nieuwePlaatjes(screen.setId)}
      />
    );
  }

  if (screen.name === 'vlag-ontdek') {
    return <VlagExploreScreen setId={screen.setId} onHome={goHome} />;
  }

  if (screen.name === 'vlag') {
    return (
      <VlagScreen
        key={`${screen.setId}-${screen.vlagMode}-${screen.aantal ?? 0}-${visit}`}
        setId={screen.setId}
        mode={screen.vlagMode}
        aantal={screen.aantal}
        toetsstand={screen.toetsstand}
        onHome={goHome}
        onAgain={() => setVisit(visit + 1)}
        alleen={screen.alleen}
        onHerhaal={herhaal}
        onVandaagVerder={vandaagVerder}
        onNieuwePlaatjes={() => nieuwePlaatjes(screen.setId)}
      />
    );
  }

  if (screen.name === 'taal-ontdek') {
    return <TaalExploreScreen setId={screen.setId} onHome={goHome} />;
  }

  if (screen.name === 'taal') {
    return (
      <TaalScreen
        key={`${screen.setId}-${screen.taalMode}-${screen.aantal ?? 0}-${visit}`}
        setId={screen.setId}
        mode={screen.taalMode}
        aantal={screen.aantal}
        toetsstand={screen.toetsstand}
        onHome={goHome}
        onAgain={() => setVisit(visit + 1)}
        alleen={screen.alleen}
        onHerhaal={herhaal}
        onVandaagVerder={vandaagVerder}
        onNieuwePlaatjes={() => nieuwePlaatjes(screen.setId)}
      />
    );
  }

  if (screen.name === 'practice') {
    return (
      <PracticeScreen
        key={`${screen.setId}-${screen.practiceMode}-${screen.aantal ?? 0}-${visit}`}
        setId={screen.setId}
        practiceMode={screen.practiceMode}
        aantal={screen.aantal}
        toetsstand={screen.toetsstand}
        onHome={goHome}
        onAgain={() => setVisit(visit + 1)}
        alleen={screen.alleen}
        onHerhaal={herhaal}
        onVandaagVerder={vandaagVerder}
        onNieuwePlaatjes={() => nieuwePlaatjes(screen.setId)}
      />
    );
  }

  const goOuder = () => go({ name: 'ouder' });
  const goJij = () => go({ name: 'you' });
  // "Bekijk alle diploma's" opent Jij met de kast in beeld — precies wat
  // ADR-153 schreef. ADR-158 stuurde hem naar Voor ouders omdat het raster daar
  // stond; nu het diploma zelf de beloning is, staat het raster weer bij het
  // kind en wijst de link daar ook weer heen.
  const goDiplomas = () => {
    setDiplomasOpen(true);
    go({ name: 'you' });
  };

  /** Uit de kast: naar dat vak met de set gekozen, om te oefenen. */
  const goOefen = (deel: Onderdeel) => {
    const module = MODULES.find((kandidaat) => kandidaat.id === deel.moduleId);
    if (!module?.built) return;
    setScreen({ name: 'home' });
    go({ name: 'module', module, setId: deel.setId });
  };

  /** The child's own column, which every screen inside the shell carries. */
  const eigenKolom = <SideColumn onBegin={beginRonde} />;

  // What premium is and where the code goes (ADR-116). Reached from every
  // lock and from Jij, by its address, and never from the tab bar.
  if (route.name === 'premium') {
    return (
      <Shell bar={bar} onNavigate={goTo} onModule={goModule}>
        {/* Zonder kolom (ADR-145). ADR-143 liet hier het toetsblok staan,
            maar niemand komt hier om een toets te plannen, en de vergelijking
            tussen basis en premium heeft de breedte nodig. */}
        <PremiumScreen />
      </Shell>
    );
  }

  // A word a parent looks for, holding more than one module. Unreachable while
  // rekenen is the only category and the tables are the whole of it — that
  // address opens the tables themselves (see routes.ts).
  if (route.name === 'category') {
    return (
      <Shell bar={bar} onNavigate={goTo} onModule={goModule} grond={route.category.modules[0]}>
        <CategoryScreen
          category={route.category}
          onOpen={(module) => go({ name: 'module', module, setId: null })}
          aside={eigenKolom}
        />
      </Shell>
    );
  }

  // A module's address is where you choose a round in it: what, then how, then
  // a start button that says what it is starting. It is also why /topografie is
  // not the home screen — the front door is every module, this is one of them.
  if (route.name === 'module') {
    return (
      <Shell
        bar={bar}
        onNavigate={goTo}
        onModule={goModule}
        currentModule={route.module.id}
        grond={route.module.id}
      >
        {/* Keyed on the module, so a way or a map chosen on one module's page
            is not still chosen on the next one's. */}
        <ModuleScreen
          key={route.module.id}
          module={route.module}
          naam={boot.profile.naam}
          setId={route.setId}
          regio={route.regio ?? null}
          onSet={(setId) => go({ name: 'module', module: route.module, setId })}
          onStart={beginRonde}
          aside={eigenKolom}
        />
      </Shell>
    );
  }

  // A module the plan has and the product does not. Reached only by typing the
  // address: ADR-037 keeps it out of the rail, because a rail entry is an offer
  // and this is an answer to a question the child asked.
  if (route.name === 'soon') {
    return (
      <Shell
        bar={bar}
        onNavigate={goTo}
        onModule={goModule}
        currentModule={route.module.id}
        grond={route.module.id}
      >
        <ModuleSoon module={route.module} onOpen={goModule} aside={eigenKolom} />
      </Shell>
    );
  }

  if (route.name === 'you') {
    return (
      <Shell bar={bar} current="jij" onNavigate={goTo} onModule={goModule}>
        <ProfileScreen
          profile={boot.profile}
          aside={eigenKolom}
          onOuder={goOuder}
          onOefen={goOefen}
          onToets={(deel, mode) => beginRonde(deel, mode)}
          kastOpen={diplomasOpen}
          onKastGezien={() => setDiplomasOpen(false)}
        />
      </Shell>
    );
  }

  // Wat van de ouder is, op een eigen adres (ADR-136).
  if (route.name === 'ouder') {
    return (
      <Shell bar={bar} current="jij" onNavigate={goTo} onModule={goModule}>
        {/* Zonder kolom sinds ADR-162: wat er voor de ouder in stond waren de
            toetsen, en die zijn weg; de favorieten zijn van het kind. */}
        <ParentScreen onJij={goJij} onOnthouden={() => go({ name: 'retention' })} />
      </Shell>
    );
  }

  if (route.name === 'retention' || screen.name === 'retention') {
    return (
      <Shell bar={bar} current="onthouden" onNavigate={goTo} onModule={goModule}>
        <RetentionScreen aside={eigenKolom} />
      </Shell>
    );
  }

  return (
    <Shell bar={bar} current="vandaag" onNavigate={goTo} onModule={goModule} grond="vandaag">
      <HomeScreen
        naam={boot.profile.naam}
        onBegin={beginRonde}
        onVerder={maakAf}
        onPlan={maakAf}
        onDiplomas={goDiplomas}
      />
    </Shell>
  );
}
