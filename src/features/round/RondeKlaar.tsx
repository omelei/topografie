import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { DiplomaIcon, NextIcon, TodayIcon, TorenIcon } from '@/components/Icon';
import { RoundMark } from '@/components/RoundMark';
import {
  aanDeBeurt,
  gepasseerd,
  setRetention,
  vooruitblik,
  type ItemState,
  type ModeId,
  type Vak,
} from '@/game-core';
import type { TorenGroei } from '@/store/torenStore';
import { ReeksBlok } from '@/features/toren/ReeksBlok';
import { useReeks } from '@/features/toren/reeks';
import { useRegister } from '@/features/toren/register';
import { Scene } from '@/features/toren/Scene';
import { Embleem } from '@/features/badges/Embleem';
import { datumVan } from '@/features/badges/datums';
import { Uitreiking } from '@/features/badges/Uitreiking';
import { naamVan, startbareOnderdelen } from '@/features/module/onderdelen';
import { usePreferences } from '@/features/player/settings';
import { MODULE_ICON } from '@/features/shell/moduleIcons';
import { MODULES, type Module } from '@/features/shell/modules';
import { t, type TranslationKey } from '@/i18n';
import type { RoundOutcome } from '@/store/rewardStore';
import { behaaldDiploma } from '@/features/home/doel';
import { getActiveChild } from '@/store/children';
import { leesWeekdoelen } from '@/store/weekdoelStore';
import { HerhaalFouten } from './HerhaalFouten';
import { VandaagVerder } from '@/features/home/VandaagVerder';
import { useVandaag } from '@/features/home/useVandaag';

/**
 * "Ronde klaar": the page after every round, in every module (K8, ADR-112).
 *
 * Since ADR-149 it opens with the **album**: the page of the set just
 * practised, with what changed lit up, and three short lines under it — what
 * the child did, what changed on the page, and what coming back brings. The
 * picture comes first, so a child of six who reads slowly still sees what
 * happened; each line carries an icon for the same reason.
 *
 * Then **the way on**. When nothing is due any more anywhere, the page says
 * "Klaar voor vandaag" and the first button is Klaar: stopping is also done.
 * "Nieuwe plaatjes" is the second, for a child who wants more, and it brings
 * pictures that are still empty rather than another go at what is not due —
 * which would change nothing on the page. Otherwise another round is first,
 * as it always was.
 *
 * Then **what the round earned**, a diploma, when it earned one; and **what is
 * still to practise**, drawn the module's own way.
 *
 * It is still outside the frame: a round and its result have no navigation
 * (ADR-041). And it still never says "goed gedaan": the page says what
 * happened, and what the child makes of it is theirs.
 */
export function RondeKlaar({
  moduleId,
  setId,
  mode,
  toetsstand,
  goed,
  beantwoord,
  gestopt,
  na,
  stenen,
  groei,
  reward,
  diploma = null,
  melding = null,
  oefenTitel,
  missed,
  children,
  onAgain,
  onHerhaal,
  onHome,
  onVandaagVerder,
  onNieuwePlaatjes,
}: {
  readonly moduleId: Module['id'];
  readonly setId: string;
  readonly mode: ModeId;
  readonly toetsstand: boolean;
  readonly goed: number;
  readonly beantwoord: number;
  /** A fixed round stopped before its end: how far it got, and how far it was going. */
  readonly gestopt: { readonly gedaan: number; readonly totaal: number } | null;
  /** De dozen zoals de ronde ze achterliet: wat er morgen terugkomt. */
  readonly na: ReadonlyMap<string, ItemState>;
  /** De stenen die deze ronde opleverde, op volgorde (ADR-158). */
  readonly stenen: readonly Vak[];
  /** Wat de ronde met de toren deed, zodra het weggeschreven is. */
  readonly groei: TorenGroei | null;
  readonly reward: RoundOutcome | null;
  /** A diploma this round earned, in words. */
  readonly diploma?: string | null | undefined;
  /** A diploma this round was and did not earn, in words. */
  readonly melding?: string | null | undefined;
  /** The heading over what is still to practise. */
  readonly oefenTitel: string;
  readonly missed: readonly { readonly id: string }[];
  /** What is still to practise, drawn the module's own way. */
  readonly children?: ReactNode;
  readonly onAgain: () => void;
  readonly onHerhaal: (ids: readonly string[]) => void;
  readonly onHome: () => void;
  /** Naar de volgende ronde van vandaag. Absent waar er geen dagplan speelt (ADR-139). */
  readonly onVandaagVerder?: (() => void) | undefined;
  /** Een ronde met plaatjes die nog leeg zijn (ADR-149). */
  readonly onNieuwePlaatjes?: (() => void) | undefined;
}) {
  const [now] = useState(() => new Date());
  const { geluid } = usePreferences();
  const module = MODULES.find((kandidaat) => kandidaat.id === moduleId);
  const ModuleIcon = MODULE_ICON[moduleId];
  const deel = startbareOnderdelen().find((kandidaat) => kandidaat.setId === setId);
  const vorm = toetsstand ? t('choose.testMode') : t(`mode.${mode}` as TranslationKey);

  // A list of mistakes has no page of its own: its pictures belong to the sets
  // they came from, and a page made of today's misses would change every round.
  const eigenDeel = deel && !setId.endsWith('fouten') && deel.items.length > 0 ? deel : null;
  const ids = eigenDeel ? eigenDeel.items.map((item) => item.id) : [];
  const blik = vooruitblik(ids, na, now);

  // Een verdieping die volliep, en het ijkpunt dat daarbij gepasseerd werd. Het
  // register is hier nog het beeldregister; de groep kiest het in fase twee.
  const verdiepingKlaar = groei !== null && groei.na.verdiepingen > groei.voor.verdiepingen;
  // Het ijkpunt dat deze ronde gepasseerd werd, in het register van dit kind:
  // de onderbouw hoort over een giraf, de bovenbouw over meters (ADR-158).
  const register = useRegister();
  const reeks = useReeks();
  const mijlpaal =
    groei === null ? null : gepasseerd(groei.voor.verdiepingen, groei.na.verdiepingen, register);

  // Vandaag klaar: het plan van vandaag is af (ADR-139), of niets wat dit kind
  // ooit begon is nu nog aan de beurt. Het tweede is voor wie geen plan ziet:
  // stoppen is ook zonder code een goed moment (ADR-149). Niet na een ronde die
  // halverwege stopte: wie na één vraag stopt, heeft vandaag niet afgemaakt.
  const vandaag = useVandaag();
  const vandaagKlaar =
    (vandaag?.voortgang.klaar ?? false) ||
    (gestopt === null && na.size > 0 && aanDeBeurt([...na.keys()], na, now) === 0);

  // Het diploma klinkt niet meer hier: de uitreiking speelt het op de beat
  // waarop het zegel gedrukt wordt, en dát is het moment. Eén geluid, één keer.
  // Wie de uitreiking wegtikt, heeft het al gehoord.
  const [uitreiking, setUitreiking] = useState(true);
  const [kindNaam, setKindNaam] = useState('');
  useEffect(() => {
    let levend = true;
    void getActiveChild().then((kind) => {
      if (levend) setKindNaam(kind?.naam ?? '');
    });
    return () => {
      levend = false;
    };
  }, []);

  // Stabiel houden: de scène wapent per beat een timer, en een nieuw object bij
  // elke render zou die timer telkens opnieuw zetten. `useVandaag` en het
  // diploma komen allebei ná de eerste render binnen, dus dat gebeurt echt.
  const mijlpaalId = mijlpaal?.id ?? null;
  const heeftDiploma = diploma !== null;
  const morgen = blik.morgenTerug;
  const sceneInvoer = useMemo(
    () => ({
      stenen,
      verdiepingKlaar,
      mijlpaal: mijlpaalId,
      diploma: heeftDiploma,
      vandaagKlaar,
      morgen,
    }),
    [stenen, verdiepingKlaar, mijlpaalId, heeftDiploma, vandaagKlaar, morgen],
  );
  const mijlpaalZin =
    mijlpaalId === null
      ? null
      : t('toren.hoger', { ding: t(`ijkpunt.${mijlpaalId}` as TranslationKey) });

  const gedaan =
    beantwoord === 1 ? t('result.gedaanEen', { goed }) : t('result.gedaan', { beantwoord, goed });

  return (
    <main className="tk-uitslag" data-module={moduleId} data-accent="module">
      <div className="tk-uitslag-kolom">
        <header className="flex flex-col gap-3">
          {module ? (
            <p className="tk-modulebadge">
              <ModuleIcon size={16} />
              {t(module.name)}
            </p>
          ) : null}
          <h1 className="tk-titel">{t('result.title')}</h1>
          <p className="text-lopend text-tekst-secundair">
            {deel ? `${naamVan(deel)} · ${vorm}` : vorm}
          </p>
        </header>

        {/* De toren, en wat deze ronde ermee deed (ADR-158). Pas als de stenen
            zijn weggeschreven: eerder is er geen stand om te tekenen. */}
        {groei !== null ? (
          <section className="tk-card flex flex-col gap-4" aria-label={t('toren.naam')}>
            <h2 className="tk-sectie">{t('toren.naam')}</h2>
            <Scene
              stand={groei.na}
              geluid={geluid}
              mijlpaalZin={mijlpaalZin}
              invoer={sceneInvoer}
            />
          </section>
        ) : null}

        <section className="tk-card flex flex-col gap-4" aria-label={t('result.samenvatting')}>
          {toetsstand ? (
            <dl className="tk-cijfers">
              <RoundMark goed={goed} totaal={beantwoord} />
            </dl>
          ) : null}

          <ul className="tk-uitslag-regels">
            <li>
              <span className="tk-uitslag-regelicoon" aria-hidden="true">
                <NextIcon size={20} />
              </span>
              {gedaan}
            </li>
            <li>
              <span className="tk-uitslag-regelicoon" aria-hidden="true">
                <TorenIcon size={20} />
              </span>
              {stenenZin(stenen.length)}
            </li>
            {eigenDeel ? (
              <li>
                <span className="tk-uitslag-regelicoon" aria-hidden="true">
                  <TodayIcon size={20} />
                </span>
                {morgenZin(blik)}
              </li>
            ) : null}
          </ul>

          <div className="flex flex-col gap-1">
            <OnthoudRegel ids={ids} states={na} />
            {gestopt ? (
              <p className="text-tekst-secundair">{t('result.stoppedEarly', gestopt)}</p>
            ) : null}
            {toetsstand ? <p className="text-tekst-secundair">{t('result.markWhy')}</p> : null}
            {reward?.proef === 'gehaald' ? (
              <p className="text-tekst-secundair">{t('afzwemmen.proefGehaald')}</p>
            ) : melding ? (
              <p className="text-tekst-secundair">{melding}</p>
            ) : null}
            {reward?.proef ? (
              <p className="text-tekst-secundair">{t('afzwemmen.proefUitleg')}</p>
            ) : null}
          </div>
        </section>

        {/* Hoeveel er nog van vandaag over is, en de weg erheen (ADR-139). */}
        {onVandaagVerder && !vandaagKlaar ? <VandaagVerder onVerder={onVandaagVerder} /> : null}

        {vandaagKlaar ? (
          <section className="tk-uitslag-klaar" aria-label={t('result.vandaagKlaar')}>
            <h2 className="tk-sectie">{t('result.vandaagKlaar')}</h2>
            <p className="text-lopend">{t('result.vandaagKlaarUitleg')}</p>
          </section>
        ) : null}

        {/* One primary button. Another round, as it always was — unless today is
            done, and then it is Klaar: the shortest way to stopping, because
            stopping is also done (ADR-149). */}
        <div className="tk-uitslag-knoppen">
          {vandaagKlaar ? (
            <>
              <button type="button" className="tk-button" onClick={onHome}>
                {t('result.klaar')}
              </button>
              {/* "Iets nieuws leren" zegt erbij wat het vandaag oplevert:
                  niets. Dat is eerlijker dan een knop die stenen belooft die
                  pas over twee dagen bestaan (ADR-158). */}
              {onNieuwePlaatjes ? (
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    className="tk-button tk-button-secondary"
                    onClick={onNieuwePlaatjes}
                  >
                    {t('result.nieuwePlaatjes')}
                  </button>
                  <span className="tk-hulp">{t('result.nieuwePlaatjesUitleg')}</span>
                </div>
              ) : null}
              <HerhaalFouten missed={missed} onHerhaal={onHerhaal} />
            </>
          ) : (
            <>
              <button type="button" className="tk-button" onClick={onAgain}>
                {t('result.again')}
              </button>
              <HerhaalFouten missed={missed} onHerhaal={onHerhaal} />
              <button type="button" className="tk-button tk-button-secondary" onClick={onHome}>
                {t('result.home')}
              </button>
            </>
          )}
        </div>

        {diploma !== null && uitreiking ? (
          <div className="tk-diplomavenster" data-uitreiking="ja">
            <div className="tk-diplomavenster-blad">
              <Uitreiking
                geluid={geluid}
                beeld={{
                  module: moduleId,
                  soort: t(`mode.${mode}` as TranslationKey),
                  naam: deel ? naamVan(deel) : diploma,
                  gehaald: true,
                  kindNaam,
                  datum: datumVan(now),
                  vul: undefined,
                  standZin: null,
                }}
                knoppen={
                  <div className="tk-diplomavenster-knoppen">
                    <button type="button" className="tk-button" onClick={() => window.print()}>
                      {t('afzwemmen.print')}
                    </button>
                    <button
                      type="button"
                      className="tk-button tk-button-secondary"
                      onClick={() => setUitreiking(false)}
                    >
                      {t('diploma.verder')}
                    </button>
                  </div>
                }
              />
            </div>
          </div>
        ) : null}

        {diploma ? (
          <section className="flex flex-col gap-3" aria-label={t('result.beloningTitle')}>
            <h2 className="tk-sectie">{t('result.beloningTitle')}</h2>
            <ul className="tk-lijst">
              <li>
                <div className="tk-lijstrij">
                  <Embleem icon={DiplomaIcon} module={moduleId} gehaald klein />
                  <span className="tk-lijstrij-tekst">
                    <span className="tk-lijstrij-titel">{diploma}</span>
                    <DoelRegel reward={reward} />
                  </span>
                </div>
              </li>
            </ul>
          </section>
        ) : null}

        {missed.length > 0 ? (
          <section className="flex flex-col gap-3" aria-label={oefenTitel}>
            <h2 className="tk-sectie">{oefenTitel}</h2>
            {children}
          </section>
        ) : null}

        {/* Helemaal onderaan, en nergens anders in de ronde (ADR-158). */}
        <ReeksBlok reeks={reeks} />
      </div>
    </main>
  );
}

/**
 * Wat deze ronde opleverde, in één regel (ADR-158).
 *
 * Nul stenen is geen mislukking en wordt ook niet zo gezegd: wie iets voor het
 * eerst ziet, kan het nog niet teruggeweten hebben. Die zin is de enige plek
 * waar de regel wordt uitgelegd op het moment dat hij bijt.
 */
function stenenZin(aantal: number): string {
  if (aantal === 0) return t('result.stenenGeen');
  return aantal === 1 ? t('result.stenenEen') : t('result.stenen', { aantal });
}

/**
 * Wat terugkomen oplevert.
 *
 * Dit is de enige regel die vooruit kijkt, en hij is de tegenhanger van de
 * steenregel: wat er niet terugkomt, levert ook niets op. Komt er morgen niets,
 * dan zegt hij wanneer wel — een kind dat vandaag niets kreeg, hoort zo dat het
 * niet aan hem lag maar aan de kalender.
 */
function morgenZin(blik: {
  readonly morgenTerug: number;
  readonly eerstVolgende: number | null;
}): string {
  if (blik.morgenTerug === 1) return t('result.morgenTerugEen');
  if (blik.morgenTerug > 1) return t('result.morgenTerug', { aantal: blik.morgenTerug });
  if (blik.eerstVolgende !== null) return t('result.morgenNiets', { dagen: blik.eerstVolgende });
  return t('result.morgenNiets', { dagen: 1 });
}

/**
 * "Dit was een doel van deze week" (ADR-141, ADR-162).
 *
 * Alleen die ene regel, en alleen als dit diploma een van de doelen van deze
 * week was. Het vieren gebeurt hier, op het moment zelf, want dat is waar het
 * gebeurde; het doel weghalen of een nieuw kiezen staat op de voordeur, want
 * dat hoort niet aan het eind van een ronde waar het kind al vier dingen moet
 * lezen.
 *
 * De uitslag draagt het diploma in woorden, en woorden zijn niet te vergelijken
 * met wat er bewaard staat. `behaaldDiploma` rekent de id terug uit de beloning
 * zelf, zodat er niets door vijf schermen heen hoeft.
 */
function DoelRegel({ reward }: { readonly reward: RoundOutcome | null }) {
  const [gehaald, setGehaald] = useState(false);
  const id = behaaldDiploma(reward);

  useEffect(() => {
    if (id === null) return;
    void leesWeekdoelen().then(({ doelen }) =>
      setGehaald(doelen.some((doel) => doel.diplomaId === id)),
    );
  }, [id]);

  if (!gehaald) return null;
  return <span className="tk-lijstrij-regel">{t('weekdoel.gehaaldRonde')}</span>;
}

/** Three weeks out: the horizon the product has always forecast to (`home.retention`). */
const DRIE_WEKEN_MS = 21 * 86_400_000;

/**
 * What is left of this subject in three weeks, under the round's own numbers
 * (ADR-122).
 *
 * Free, and on purpose: it is the one sentence in this product that is about
 * what happens if you do nothing, and a forecast a family cannot see is a
 * promise they cannot check.
 *
 * **The whole set, not the ten questions just asked.** A round's own items were
 * answered a minute ago and would forecast at very nearly a hundred per cent,
 * which is true and useless. A list of mistakes has no fixed set of its own, so
 * it has no forecast.
 */
function OnthoudRegel({
  ids,
  states,
}: {
  readonly ids: readonly string[];
  readonly states: ReadonlyMap<string, ItemState>;
}) {
  if (ids.length === 0) return null;
  const procent = setRetention(states, ids, new Date(Date.now() + DRIE_WEKEN_MS));
  return <p className="text-tekst-secundair">{t('result.onthoud', { procent })}</p>;
}
