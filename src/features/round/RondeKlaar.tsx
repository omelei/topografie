import { useEffect, useState, type ReactNode } from 'react';
import { DiplomaIcon } from '@/components/Icon';
import { RoundMark } from '@/components/RoundMark';
import { setRetention, type ItemState, type ModeId, type StreakChange } from '@/game-core';
import { BadgeRijen, isBadge } from '@/features/badges/Badges';
import { Embleem } from '@/features/badges/Embleem';
import { naamVan, startbareOnderdelen } from '@/features/module/onderdelen';
import { MODULE_ICON } from '@/features/shell/moduleIcons';
import { MODULES, type Module } from '@/features/shell/modules';
import { t, type TranslationKey } from '@/i18n';
import { loadItemStates } from '@/store/progress';
import type { RoundOutcome } from '@/store/rewardStore';
import { behaaldDiploma } from '@/features/home/doel';
import { leesDoel } from '@/store/doelStore';
import { HerhaalFouten } from './HerhaalFouten';
import { Kist } from '@/features/reis/Kist';
import { VandaagVerder } from '@/features/home/VandaagVerder';

/**
 * "Ronde klaar": the page after every round, in every module (K8, ADR-112).
 *
 * It used to be four pages that each did the same thing a little differently —
 * an eyebrow, a heading of 40 about what had changed, a score in running text,
 * a card of stars, and the misses at four different sizes. Now it is one page
 * in the shape of the rest of the app:
 *
 * - **the module's badge and "Ronde klaar"**, as a module page opens, with what
 *   was practised and how under it;
 * - **the round in numbers**, as tiles: how many were right, how many more the
 *   child now remembers, and after an oefentoets the mark — with one sentence
 *   under them saying what changed, which is the one thing a child could not
 *   have counted themselves, and since ADR-122 one saying what is left of this
 *   subject in three weeks, which is the one thing nobody can count at all;
 * - **the way on**, straight after that and before anything that can be long:
 *   another round, "herhaal je fouten", or back to the front door;
 * - **what the round earned**, a diploma or a badge, when it earned one;
 * - **what is still to practise**, as a list — with the map beside it on
 *   topography, the face on the clock and the flag on flags, because those can
 *   be looked at.
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
  gained,
  streak,
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
}: {
  readonly moduleId: Module['id'];
  readonly setId: string;
  readonly mode: ModeId;
  readonly toetsstand: boolean;
  readonly goed: number;
  readonly beantwoord: number;
  /** A fixed round stopped before its end: how far it got, and how far it was going. */
  readonly gestopt: { readonly gedaan: number; readonly totaal: number } | null;
  readonly gained: number;
  readonly streak: StreakChange | null;
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
}) {
  const module = MODULES.find((kandidaat) => kandidaat.id === moduleId);
  const ModuleIcon = MODULE_ICON[moduleId];
  const deel = startbareOnderdelen().find((kandidaat) => kandidaat.setId === setId);
  const vorm = toetsstand ? t('choose.testMode') : t(`mode.${mode}` as TranslationKey);
  // De badges en de streakzin waren premium (ADR-116) en zijn dat niet meer.
  // Ze werden verdiend, geteld en weggeschreven, en op dit scherm gebeurde er
  // niets — dezelfde fout als de munten en de XP van ADR-130, met een
  // prijskaartje eromheen. Wat een kind verdient, ziet een kind; premium
  // verkoopt het plannen en het bijhouden.
  const badges = (reward?.stamps ?? []).filter(isBadge);
  const reeks = reeksZin(streak);

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

        <section className="tk-card flex flex-col gap-4" aria-label={t('result.samenvatting')}>
          <dl className="tk-cijfers">
            <div className="tk-cijfer">
              <dt className="tk-cijfer-label">{t('result.tegelGoed')}</dt>
              <dd className="tk-cijfer-getal">
                {t('result.tegelGoedWaarde', { goed, totaal: beantwoord })}
              </dd>
            </div>
            <div className="tk-cijfer">
              <dt className="tk-cijfer-label">{t('result.tegelErbij')}</dt>
              <dd className="tk-cijfer-getal">{gained}</dd>
            </div>
            {/* The mark, on the one round that has earned one (ADR-085). */}
            {toetsstand ? <RoundMark goed={goed} totaal={beantwoord} /> : null}
          </dl>

          <div className="flex flex-col gap-1">
            {/* What changed is the product: the one line on this page a child
                could not have counted themselves. */}
            <p className="text-lopend">
              {gained === 0
                ? t('result.gainedNone')
                : gained === 1
                  ? t('result.gainedOne')
                  : t('result.gainedMany', { aantal: gained })}
            </p>
            {missed.length === 0 ? <p className="text-lopend">{t('result.allCorrect')}</p> : null}
            <OnthoudRegel setId={setId} />
            {gestopt ? (
              <p className="text-tekst-secundair">{t('result.stoppedEarly', gestopt)}</p>
            ) : null}
            {toetsstand ? <p className="text-tekst-secundair">{t('result.markWhy')}</p> : null}
            {melding ? <p className="text-tekst-secundair">{melding}</p> : null}
            {reeks ? <p className="text-tekst-secundair">{reeks}</p> : null}
          </div>
        </section>

        {/* Hoeveel er nog van vandaag over is, en de weg erheen (ADR-139).
            Boven de kist, want dit gaat over doorgaan en de kist over wat je
            al hebt — en onder de knoppen zou een kind er langs drukken, net als
            de kist. */}
        {onVandaagVerder ? <VandaagVerder onVerder={onVandaagVerder} /> : null}

        {/* De kist, vóór de knoppen (ADR-138). Alles op dit scherm is te lézen —
            de tegels, het diploma, de missers — en dit is het enige dat
            ingedrukt moet worden. Onder "Nog een ronde" zou een kind er
            telkens langs drukken, en dan staat de kist volgende ronde weer op
            dezelfde plek. */}
        <Kist />

        {/* One primary button, and it is another round rather than the way
            out: the shortest path back to practising, same as K1. Before the
            lists, so a round with fifteen misses does not hide it. */}
        <div className="tk-uitslag-knoppen">
          <button type="button" className="tk-button" onClick={onAgain}>
            {t('result.again')}
          </button>
          <HerhaalFouten missed={missed} onHerhaal={onHerhaal} />
          <button type="button" className="tk-button tk-button-secondary" onClick={onHome}>
            {t('result.home')}
          </button>
        </div>

        {diploma || badges.length > 0 ? (
          <section className="flex flex-col gap-3" aria-label={t('result.beloningTitle')}>
            <h2 className="tk-sectie">{t('result.beloningTitle')}</h2>
            <ul className="tk-lijst">
              {diploma ? (
                <li>
                  <div className="tk-lijstrij">
                    <Embleem icon={DiplomaIcon} module={moduleId} gehaald klein />
                    <span className="tk-lijstrij-tekst">
                      <span className="tk-lijstrij-titel">{diploma}</span>
                      <DoelRegel reward={reward} />
                    </span>
                  </div>
                </li>
              ) : null}
              <BadgeRijen ids={badges} />
            </ul>
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

/**
 * What today did to the streak.
 *
 * Told after the numbers, never before them: a streak that leads the screen
 * turns a lesson into a scoreboard. It is also silent when nothing happened —
 * a second round on the same day says nothing, because nothing changed.
 * A rest day spent or earned is said out loud rather than silently: a safety
 * net nobody knows about protects the streak but teaches nothing about coming
 * back.
 */
function reeksZin(streak: StreakChange | null): string | null {
  if (streak === null || !streak.counted) return null;

  const dagen = streak.state.huidigeStreak;
  const zinnen = [
    dagen === 1
      ? streak.broken
        ? t('result.streakGrewOne')
        : t('result.streakStarted')
      : t('result.streakGrew', { aantal: dagen }),
  ];
  if (streak.rustdagenGebruikt > 0) zinnen.push(t('result.streakSaved'));
  if (streak.rustdagVerdiend) zinnen.push(t('result.restDayEarned'));
  return zinnen.join(' ');
}

/** Three weeks out: the horizon the product has always forecast to (`home.retention`). */
const DRIE_WEKEN_MS = 21 * 86_400_000;

/**
 * What is left of this subject in three weeks, under the round's own numbers
 * (ADR-122).
 *
 * Free, and on purpose: it is the one sentence in this product that is about
 * what happens if you do nothing, and a forecast a family cannot see is a
 * promise they cannot check. It is also the whole argument for coming back
 * tomorrow, which is not an argument to put behind a code.
 *
 * **The whole set, not the ten questions just asked.** A round's own items were
 * answered a minute ago and would forecast at very nearly a hundred per cent,
 * which is true and useless. The figure that means something is the one the
 * front door already shows for this set, and it is the same function
 * (`setRetention`) reading the same boxes.
 *
 * Nothing at all until the states are loaded and the set has items: a number
 * that appears as nought and then jumps has told a child something false on the
 * way. A list of mistakes has no fixed set of its own, so it has no forecast.
 */
function OnthoudRegel({ setId }: { readonly setId: string }) {
  const [states, setStates] = useState<ReadonlyMap<string, ItemState> | null>(null);

  useEffect(() => {
    let levend = true;
    void loadItemStates().then((geladen) => {
      if (levend) setStates(geladen);
    });
    return () => {
      levend = false;
    };
  }, []);

  if (states === null) return null;

  const deel = startbareOnderdelen().find((kandidaat) => kandidaat.setId === setId);
  if (!deel || deel.items.length === 0 || setId.endsWith('fouten')) return null;

  const procent = setRetention(
    states,
    deel.items.map((item) => item.id),
    new Date(Date.now() + DRIE_WEKEN_MS),
  );

  return <p className="text-tekst-secundair">{t('result.onthoud', { procent })}</p>;
}
