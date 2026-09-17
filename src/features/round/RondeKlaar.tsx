import { useEffect, useRef, useState, type ReactNode } from 'react';
import { DiplomaIcon, NextIcon, StampIcon, TodayIcon } from '@/components/Icon';
import { RoundMark } from '@/components/RoundMark';
import {
  aanDeBeurt,
  paginaStand,
  rondeAlbum,
  setRetention,
  vooruitblik,
  type ItemState,
  type ModeId,
} from '@/game-core';
import { AlbumPagina } from '@/features/album/AlbumPagina';
import { Embleem } from '@/features/badges/Embleem';
import { naamVan, startbareOnderdelen } from '@/features/module/onderdelen';
import { usePreferences } from '@/features/player/settings';
import { MODULE_ICON } from '@/features/shell/moduleIcons';
import { MODULES, type Module } from '@/features/shell/modules';
import { t, type TranslationKey } from '@/i18n';
import type { RoundOutcome } from '@/store/rewardStore';
import { behaaldDiploma } from '@/features/home/doel';
import { getActiveChild } from '@/store/children';
import { leesDoel } from '@/store/doelStore';
import { HerhaalFouten } from './HerhaalFouten';
import { speelMoment } from './geluid';
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
  voor,
  na,
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
  /** The boxes as the round found them, and as it left them (ADR-149). */
  readonly voor: ReadonlyMap<string, ItemState>;
  readonly na: ReadonlyMap<string, ItemState>;
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
  const albumDeel = deel && !setId.endsWith('fouten') && deel.items.length > 0 ? deel : null;
  const ids = albumDeel ? albumDeel.items.map((item) => item.id) : [];
  const ronde = rondeAlbum(ids, voor, na, now);
  const stand = paginaStand(ids, na, now);

  // Vandaag klaar: het plan van vandaag is af (ADR-139), of niets wat dit kind
  // ooit begon is nu nog aan de beurt. Het tweede is voor wie geen plan ziet:
  // stoppen is ook zonder code een goed moment (ADR-149). Niet na een ronde die
  // halverwege stopte: wie na één vraag stopt, heeft vandaag niet afgemaakt.
  const vandaag = useVandaag();
  const vandaagKlaar =
    (vandaag?.voortgang.klaar ?? false) ||
    (gestopt === null && na.size > 0 && aanDeBeurt([...na.keys()], na, now) === 0);

  // Een pagina die in kleur kwam, en een diploma, klinken (ADR-149). Eén keer:
  // een geluid dat bij elke render opnieuw klinkt, is ruis. Het diploma komt
  // pas binnen als de beloning is weggeschreven, dus wordt er gewacht tot het
  // er is in plaats van alleen bij het openen te luisteren.
  const paginaKlinkt = ronde.paginaInKleur;
  const diplomaKlinkt = diploma !== null;
  const geklonken = useRef(false);
  useEffect(() => {
    if (geklonken.current) return;
    if (diplomaKlinkt) {
      geklonken.current = true;
      speelMoment('diploma', geluid);
    } else if (paginaKlinkt) {
      geklonken.current = true;
      speelMoment('pagina', geluid);
    }
  }, [diplomaKlinkt, paginaKlinkt, geluid]);

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

        {albumDeel ? (
          <section className="tk-card flex flex-col gap-4" aria-label={t('album.paginaTitel')}>
            <AlbumPagina deel={albumDeel} states={na} now={now} veranderd={new Set(ronde.veranderd)} />
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
            {albumDeel ? (
              <li>
                <span className="tk-uitslag-regelicoon" aria-hidden="true">
                  <StampIcon size={20} />
                </span>
                {veranderdZin(ronde)}
              </li>
            ) : null}
            {albumDeel ? (
              <li>
                <span className="tk-uitslag-regelicoon" aria-hidden="true">
                  <TodayIcon size={20} />
                </span>
                {vooruitZin(ronde.paginaInKleur, stand.kleur, stand.begonnen, stand.totaal, ids, na, now)}
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
            {reward?.proef ? <p className="text-tekst-secundair">{t('afzwemmen.proefUitleg')}</p> : null}
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
              {onNieuwePlaatjes ? (
                <button type="button" className="tk-button tk-button-secondary" onClick={onNieuwePlaatjes}>
                  {t('result.nieuwePlaatjes')}
                </button>
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
            <PrintDiploma titel={deel ? naamVan(deel) : diploma} vorm={t(`mode.${mode}` as TranslationKey)} />
          </section>
        ) : null}

        {missed.length > 0 ? (
          <section className="flex flex-col gap-3" aria-label={oefenTitel}>
            <h2 className="tk-sectie">{oefenTitel}</h2>
            {children}
          </section>
        ) : null}
      </div>
    </main>
  );
}

/** Wat er op de pagina veranderde, in één regel. */
function veranderdZin(ronde: ReturnType<typeof rondeAlbum>): string {
  const delen: string[] = [];
  if (ronde.verder > 0) {
    delen.push(ronde.verder === 1 ? t('result.verderEen') : t('result.verder', { aantal: ronde.verder }));
  }
  if (ronde.weerGoed > 0) {
    delen.push(
      ronde.weerGoed === 1 ? t('result.weerGoedEen') : t('result.weerGoed', { aantal: ronde.weerGoed }),
    );
  }
  if (ronde.stempels > 0) {
    delen.push(
      ronde.stempels === 1 ? t('result.stempelsEen') : t('result.stempels', { aantal: ronde.stempels }),
    );
  }
  if (ronde.lastig > 0) {
    delen.push(ronde.lastig === 1 ? t('result.pleisterEen') : t('result.pleister', { aantal: ronde.lastig }));
  }
  return delen.length === 0 ? t('result.albumNiets') : `${delen.join('. ')}.`;
}

/**
 * Wat terugkomen oplevert (ADR-149).
 *
 * Een kind dat nog geen enkel plaatje in kleur heeft, hoort wat het al begon:
 * wie nog twijfelt, trekt het meest aan wat er al is (Koo & Fishbach). Wie
 * verder is, hoort wat morgen kan: kleur, of plaatjes die terugkomen, of anders
 * over hoeveel dagen het eerste terugkomt.
 */
function vooruitZin(
  inKleur: boolean,
  kleur: number,
  begonnen: number,
  totaal: number,
  ids: readonly string[],
  states: ReadonlyMap<string, ItemState>,
  now: Date,
): string {
  if (inKleur) return t('result.paginaInKleur');
  if (kleur === 0) return t('result.alBegonnen', { begonnen, totaal });
  const blik = vooruitblik(ids, states, now);
  if (blik.morgenKleur > 0) {
    return blik.morgenKleur === 1
      ? t('result.morgenKleurEen')
      : t('result.morgenKleur', { aantal: blik.morgenKleur });
  }
  if (blik.morgenTerug > 0) {
    return blik.morgenTerug === 1
      ? t('result.morgenTerugEen')
      : t('result.morgenTerug', { aantal: blik.morgenTerug });
  }
  if (blik.eerstVolgende !== null) return t('result.eerstVolgende', { dagen: blik.eerstVolgende });
  return t('result.alBegonnen', { begonnen, totaal });
}

/**
 * "Dit was waar je voor ging" (ADR-141).
 *
 * Alleen die ene regel, en alleen als dit diploma het gekozen doel was. Het
 * vieren gebeurt hier, op het moment zelf, want dat is waar het gebeurde; de
 * vraag wat nu staat op de voordeur, want een nieuw doel kiezen hoort niet aan
 * het eind van een ronde waar het kind al vier dingen moet lezen.
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
    void leesDoel().then((doel) => setGehaald(doel === id));
  }, [id]);

  if (!gehaald) return null;
  return <span className="tk-lijstrij-regel">{t('doel.gehaaldRonde')}</span>;
}

const DATUM = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });

/**
 * Het diploma op papier (ADR-149): met de naam van het kind en de datum, om
 * op te hangen of te laten zien. Op het scherm alleen de knop; wat de printer
 * krijgt, staat er onzichtbaar naast (`data-print`), zodat de rest van de
 * uitslag niet mee op papier komt.
 */
function PrintDiploma({ titel, vorm }: { readonly titel: string; readonly vorm: string }) {
  const [naam, setNaam] = useState('');
  const [datum] = useState(() => DATUM.format(new Date()));

  useEffect(() => {
    let levend = true;
    void getActiveChild().then((kind) => {
      if (levend) setNaam(kind?.naam ?? '');
    });
    return () => {
      levend = false;
    };
  }, []);

  return (
    <>
      <button type="button" className="tk-button tk-button-secondary self-start" onClick={() => window.print()}>
        {t('afzwemmen.print')}
      </button>
      <div className="tk-diplomaprint" data-print="ja" aria-hidden="true">
        <p className="tk-diplomaprint-soort">{vorm}</p>
        <p className="tk-diplomaprint-titel">{titel}</p>
        <p>{naam === '' ? t('afzwemmen.printZonderNaam') : t('afzwemmen.printNaam', { naam })}</p>
        <p>{t('afzwemmen.printDatum', { datum })}</p>
      </div>
    </>
  );
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
