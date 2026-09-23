import type { ReactNode } from 'react';
import { Dot } from '@/components/Dot';
import { NextIcon } from '@/components/Icon';
import { STATUS_FILL, type ItemStatus } from '@/components/StatusLabel';
import { dayKey, formatGrade, grade } from '@/game-core';
import { geplaatst, naamVan, startbareOnderdelen } from '@/features/module/onderdelen';
import { MODULE_ICON } from '@/features/shell/moduleIcons';
import type { Module } from '@/features/shell/modules';
import { t, type TranslationKey } from '@/i18n';
import type { PlayedRound } from '@/store/progress';
import { schooldagen } from './schooldagen';
import {
  geoefend,
  perDag,
  type DagTelling,
  type Geheugen,
  type VakStand,
  type WeekTelling,
} from './statistiek';

/**
 * De cijfers op Jij (ADR-148, ADR-171, ADR-172): wat je onthoudt over alles,
 * hoe vaak je oefent — deze week, en met premium de weken ervoor — en per vak.
 *
 * Elk getal hier staat op één plek in het product. De vier tegels over deze
 * week stonden op Voor ouders, het aantal rondes en vragen op de reekspagina,
 * en "Goed beantwoord" in de kolom naast elke pagina. Ze gaan allemaal over hoe
 * het oefenen gaat, en dat is de vraag die deze pagina beantwoordt.
 *
 * **Beelden eerst, binnen de huisstijl.** Een ring voor de voorspelling en
 * tegels voor de standen, in de kleur van de kaart; de woorden blijven inkt,
 * want onthouden is een stand en geen goed antwoord (`StatusLabel`). Per vak
 * de kleur van het vak, die een vak mag dragen in zijn balk. In de weekgrafiek
 * wél groen en gearceerd rood: daar staan antwoorden, en goed en fout zien er
 * overal in het product zo uit.
 */

/**
 * The four statuses, strongest first: it is the order of the dot's own fill,
 * and the first tile is the one the page is named after.
 */
const STATUSSEN: readonly ItemStatus[] = ['remembered', 'refresh', 'practising', 'new'];

/** De standen van wat minstens één keer beantwoord is: "Je geheugen" telt geen nieuw. */
const GEOEFEND = STATUSSEN.filter((status) => status !== 'new');

/** What each tile counts, in the words the page has always used for them. */
const TEGEL_WOORD: Record<ItemStatus, TranslationKey> = {
  remembered: 'retention.tegelOnthouden',
  refresh: 'retention.tegelOpfrissen',
  practising: 'retention.tegelOefenen',
  new: 'retention.tegelNieuw',
};

/**
 * De standen als tegels: het getal, en eronder de stip met zijn woord.
 *
 * Eén component voor twee kaarten (ADR-171): "Je geheugen" en "Alles in één
 * blik" tellen dezelfde standen, en toen de ene een balk met losse labels had
 * en de andere tegels, zag een kind twee manieren om hetzelfde te lezen onder
 * elkaar op één pagina.
 */
export function StandTegels({
  telling,
  statussen = STATUSSEN,
}: {
  readonly telling: Readonly<Record<ItemStatus, number>>;
  /** Welke tegels er staan. "Je geheugen" telt alleen wat geoefend is. */
  readonly statussen?: readonly ItemStatus[];
}) {
  return (
    <ul className="tk-standtegels">
      {statussen.map((status) => (
        <li key={status} className="tk-standtegel" data-status={status}>
          <span className="tk-standtegel-getal">{telling[status]}</span>
          <span className="tk-standtegel-woord">
            {/* Decoratief: het woord ernaast zegt hetzelfde. De stip in de
                kleur van de kaart, zoals de muur op Alles in één blik. */}
            <span className="tk-stip">
              <Dot size={24} fill={STATUS_FILL[status]} tone="inherit" />
            </span>
            {t(TEGEL_WOORD[status])}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Wat je onthoudt, over elk vak: de ring, het getal, en de tegels eronder.
 *
 * **Opgemaakt zoals Alles in één blik** (ADR-171): de kop boven de kaart en
 * niet erin, en de kaart in de kleur van de pagina met de tegels die daar ook
 * staan. Het was een kaart met een klein label bovenin, een ring in inkt en een
 * grijze balk met losse woorden eronder — het enige blok op de pagina dat er
 * zo uitzag. Over alle vakken, dus in de kleur van leer.nu zelf en niet die van
 * een vak.
 *
 * **Met de uitleg erbij** (ADR-172). "Wanneer onthoud je iets?" was een eigen
 * blok bovenaan, open, met vier regels (ADR-160). De reden daarvoor blijft: wie
 * het woord niet kent, leest getallen zonder eenheid. Dus staat de eerste regel
 * — wat onthouden is — open boven het getal dat het telt. De andere drie gaan
 * over uitzonderingen die een kind één keer leest, en staan in een uitklap
 * eronder; open kostten ze bij elk bezoek een half scherm op een telefoon.
 *
 * **De ring met de voorspelling is weg** (ADR-177), en dat was het grootste
 * ding op de kaart. Twee redenen, en ze wijzen dezelfde kant op.
 *
 * Ten eerste was het geen meting maar een model: een vergeetcurve met een
 * gekozen constante (`retention.ts` — negen tiende blijft staan na één stap van
 * de doos). Dat bestand schrijft over zichzelf dat de tekst eromheen nooit mag
 * suggereren dat het een meting is, en de zin eronder deed precies dat: "Over
 * drie weken weet je nog 67%." Niet bijna, niet ongeveer.
 *
 * Ten tweede is een percentage in Nederland stof van groep 7 en 8, en dit
 * product begint bij zes jaar. Het kind voor wie deze pagina geschreven is, kan
 * het grootste getal erop niet lezen — en het getal dat het wél kan lezen,
 * hoeveel het er goed weet, stond ernaast in kleiner.
 *
 * Wat ervoor in de plaats komt is niets: de tegel "Even opfrissen" telt al wat
 * er te doen is, en handelen hoort op Vandaag (ADR-172). De voorspelling zelf
 * blijft bestaan — hij stuurt het schema en staat na een ronde op `RondeKlaar`,
 * waar hij één regel is met iets om voor te pleiten in plaats van een kop.
 */
export function GeheugenKaart({
  stand,
  uitleg,
  zoom,
}: {
  readonly stand: Geheugen;
  /** De regels, ingeklapt onder de kaart (ADR-172). */
  readonly uitleg?: ReactNode;
  /**
   * Eén vak en één onderwerp, in dezelfde sectie (ADR-177).
   *
   * "Per vak" en "Per onderwerp" stonden hieronder als twee eigen koppen, en
   * dat was vreemd op de manier die de eigenaar benoemde: het zijn niet drie
   * onderwerpen maar één, van ver naar dichtbij. Alles bij elkaar, dan één vak,
   * dan één onderwerp — dus één regio met één naam, en de zoom erin.
   */
  readonly zoom?: ReactNode;
}) {
  const totaal = geoefend(stand);
  const telling = {
    remembered: stand.onthouden,
    refresh: stand.opfrissen,
    practising: stand.oefenen,
    new: 0,
  } satisfies Record<ItemStatus, number>;

  return (
    <section className="flex flex-col gap-3" aria-label={t('retention.geheugenTitel')}>
      <h2 className="tk-sectie">{t('retention.geheugenTitel')}</h2>
      {/* Wat onthouden is, open en boven het getal dat het telt (ADR-160). De
          andere drie regels staan eronder, ingeklapt (ADR-172). */}
      <p className="text-lopend">{t('retention.regel1')}</p>

      <div className="tk-card tk-vakkleur tk-geheugen">
        {totaal === 0 ? (
          <p className="text-lopend text-tekst-secundair">{t('retention.geheugenLeeg')}</p>
        ) : (
          <>
            <p className="tk-reeks-getal">
              <span className="tk-reeks-aantal">{stand.onthouden}</span>
              <span className="tk-reeks-zin">{t('retention.geheugenGoed')}</span>
            </p>
            <p className="tk-hulp">{t('retention.geheugenVan', { aantal: totaal })}</p>

            <StandTegels telling={telling} statussen={GEOEFEND} />
          </>
        )}
      </div>
      {uitleg}
      {zoom}
    </section>
  );
}

/** Het verloop over de weken: alleen met premium. */
export interface Verloop {
  readonly weken: readonly WeekTelling[];
  readonly procentGoed: number | null;
  readonly vragen: number;
}

/**
 * Hoe vaak je oefent (ADR-172): deze week in vier tegels — rondes, dagen,
 * vragen en het cijfer waar ze op uitkwamen — en wat het meest geoefend is
 * (ADR-079). Met premium eronder de vragen van de laatste weken als staven, en
 * alles bij elkaar in één zin.
 *
 * **Twee blokken werden er één.** "Deze week" en "Week na week" stonden los,
 * met twee rijen tegels boven elkaar: "Rondes" en "Rondes in totaal", "Vragen
 * beantwoord" en "Vragen in totaal". Dat las als één rij die zichzelf
 * tegensprak. Nu is er één rij tegels, over deze week, en is het totaal een zin.
 *
 * **En de dagen tellen tegen schooldagen**, zoals het weekbericht dat deed
 * (ADR-133): "3 van 5". Het weekbericht zelf is weg (ADR-172) — elke zin ervan
 * stond ergens anders al, en die over wat blijft hangen noemde een ander getal
 * dan de ring erboven. De noemer was het enige wat het toevoegde, en het is een
 * feit over het eigen kind, dus gratis (ADR-124).
 *
 * De tegels waren gratis, zoals ze op Voor ouders waren, en het verloop
 * premium (ADR-124). Sinds ADR-192 staat dit hele blok alleen met een code.
 */
export function HoeVaak({
  rondes,
  now,
  verloop,
}: {
  readonly rondes: readonly PlayedRound[];
  readonly now: Date;
  /** Null zonder premium: dan staan alleen de tegels er. */
  readonly verloop: Verloop | null;
}) {
  const grens = dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6));
  const deze = rondes.filter((ronde) => dayKey(new Date(ronde.at)) >= grens);

  const beantwoord = deze.reduce((samen, ronde) => samen + ronde.answered, 0);
  const goed = deze.reduce((samen, ronde) => samen + ronde.correct, 0);
  const dagen = new Set(deze.map((ronde) => dayKey(new Date(ronde.at)))).size;
  const school = schooldagen(now);
  const cijfer = grade(goed, beantwoord);

  // Wat het meest geoefend is: welke set deze week de meeste vragen kreeg.
  const perSet = new Map<string, number>();
  for (const { deel, ronde } of geplaatst(deze, startbareOnderdelen())) {
    perSet.set(naamVan(deel), (perSet.get(naamVan(deel)) ?? 0) + ronde.answered);
  }
  const meest = [...perSet.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;

  // Een zaterdag telt mee als er geoefend is (`kalender.ts`). Wie op meer dagen
  // oefende dan er schooldagen waren, krijgt geen breuk — "6 van 5" is er geen
  // — en dan klopt het woord "schooldagen" ook niet meer, dus die zin is een
  // andere (`you.weekDagenLos`).
  //
  // `school !== 0` en niet `school > 0`: de copy-toets zoekt tekst tussen een
  // `>` en een `<`, en leest `school > 0 && dagen <= school` als een zichtbare
  // string.
  const breuk = school !== 0 && dagen <= school;

  const tegels = [
    [t('you.tegelRondes'), String(deze.length)],
    [t('you.tegelVragen'), String(beantwoord)],
    [t('you.tegelCijfer'), cijfer === null ? t('you.geenCijfer') : formatGrade(cijfer)],
  ] as const;

  return (
    <section className="flex flex-col gap-3" aria-label={t('you.week')}>
      <h2 className="tk-sectie">{t('you.week')}</h2>

      {/* De strook staat er ook in een week zonder rondes, en dat is met opzet:
          zeven lege hokjes met vandaag aangewezen zijn de uitnodiging, en een
          zin die zegt dat er niets was, is er alleen de mededeling van. */}
      <Weekstrook dagen={perDag(rondes, now)} />
      <p className="text-tekst-secundair">
        {deze.length === 0
          ? t('you.weekNone')
          : breuk
            ? t('you.weekDagen', { dagen: t('you.dagenVan', { dagen, schooldagen: school }) })
            : t('you.weekDagenLos', { dagen })}
      </p>

      {deze.length === 0 ? null : (
        <>
          <dl className="tk-cijfers">
            {tegels.map(([label, waarde]) => (
              <div key={label} className="tk-cijfer">
                <dt className="tk-cijfer-label">{label}</dt>
                <dd className="tk-cijfer-getal">{waarde}</dd>
              </div>
            ))}
          </dl>
          {meest ? (
            <p className="text-tekst-secundair">{t('you.weekMost', { set: meest[0] })}</p>
          ) : null}
        </>
      )}

      {/* Zonder één ronde geen grafiek: acht lege staven zeggen niets wat de
          zin hierboven niet al zegt. */}
      {verloop && rondes.length > 0 ? <Weken verloop={verloop} rondes={rondes.length} /> : null}
    </section>
  );
}

/**
 * De laatste zeven dagen als hokjes, vandaag rechts (ADR-177).
 *
 * **Waarom dit er staat.** "Hoe vaak oefen je?" was vier getallen op een grijze
 * ondergrond, en het getal dat een kind het meest aangaat — heb ik vandaag al
 * geoefend? — stond erin als "Dagen geoefend: 3 van 5". Dat is een breuk, en
 * een breuk is geen beeld. Zeven hokjes zijn dat wel: je ziet in één oogopslag
 * welke dagen je gehaald hebt, welke niet, en dat de laatste vandaag is.
 *
 * **Drie signalen, niet één.** Een gevuld hokje draagt de vakkleur én het
 * aantal rondes én een zwaardere letter; een leeg hokje een liggend streepje.
 * Kleur alleen zou dit onleesbaar maken voor een kind dat kleuren niet
 * onderscheidt, en dat is precies de helft van de huisstijl die telt.
 *
 * **Geen groen.** Een geoefende dag is een feit en geen goed antwoord, en groen
 * en gearceerd rood zijn in dit product voorbehouden aan antwoorden
 * (`StatusLabel`, HUISSTIJL §8). Dus de kleur van leer.nu zelf, zoals de tegels
 * van Je geheugen.
 */
function Weekstrook({ dagen }: { readonly dagen: readonly DagTelling[] }) {
  return (
    <ol className="tk-weekstrook" aria-label={t('you.weekStrook')}>
      {dagen.map((dag) => (
        <li
          key={dag.sleutel}
          className="tk-weekdag"
          data-geoefend={dag.rondes > 0 ? 'ja' : undefined}
          data-vandaag={dag.vandaag ? 'ja' : undefined}
        >
          <span className="tk-weekdag-naam" aria-hidden="true">
            {dag.kort}
          </span>
          <span className="tk-weekdag-getal" aria-hidden="true">
            {dag.rondes > 0 ? dag.rondes : '–'}
          </span>
          {/* Wat er te zien is, in één zin per dag: een schermlezer leest de
              lijst af en hoort per hokje de dag, of er geoefend is, en of het
              vandaag is. */}
          <span className="tk-sr-only">
            {t(dag.rondes === 0 ? 'you.weekDagLeeg' : 'you.weekDagRondes', {
              dag: dag.voluit,
              rondes: dag.rondes,
            })}
            {dag.vandaag ? ` ${t('you.weekDagVandaag')}` : ''}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Een deel van een balk als percentage. Wat er is, krijgt in de CSS een minimum. */
function breedte(deel: number, totaal: number): string {
  return `${totaal === 0 ? 0 : (deel / totaal) * 100}%`;
}

/**
 * Elk vak op één regel: hoeveel je onthoudt, hoeveel je geoefend hebt, en van
 * hoeveel, met een balk in de kleur van het vak. Een druk op de regel kiest dat
 * vak, en wat eronder staat gaat mee.
 *
 * **Sinds ADR-192 staat hij er alleen met een code**, zoals de rest van deze
 * pagina. Wat hieronder staat, is waarom hij tussen ADR-177 en ADR-192 gratis
 * was.
 *
 * **Sinds ADR-177 is dit de keuze zelf, en staat hij er zonder code.** Twee
 * dingen die allebei fout waren, met één oorzaak. De rij stond achter premium,
 * en de chips eronder ook, dus een kind zonder code kreeg altijd en alleen het
 * eerste onderwerp van het eerste vak te zien: de provincies van Nederland.
 * Niet als keuze maar als lot — en dat terwijl oefenen volledig gratis is
 * (`premium.ts`), dus dat kind heeft óók klokgekeken, woorden gedaan en vlaggen
 * geraden. Het zag cijfers over één van de vijf dingen die het deed.
 *
 * Wat premium blijft, is het bijhouden: de tabel per onderdeel en de weken
 * achter elkaar. Wat gratis wordt, is welk van je eigen vakken je bekijkt. Dat
 * is dezelfde grens als ADR-133 trok toen de noemer van de weekdagen gratis
 * werd — een feit over het eigen kind — en het maakt de voorproef van ADR-124
 * eindelijk een voorproef van iets: de eigen cijfers van dit kind, over het vak
 * dat het zelf aanwijst.
 */
export function PerVak({
  vakken,
  modules,
  gekozen,
  onKies,
}: {
  readonly vakken: readonly VakStand<Module['id']>[];
  readonly modules: readonly Module[];
  /** Het vak waar de kaart eronder over gaat. */
  readonly gekozen: Module['id'];
  readonly onKies: (moduleId: Module['id']) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {/* De vraag, niet de categorie: "Per vak" was de naam van een blok dat
          je las, en dit is een rij die je aanwijst. */}
      <h3 className="tk-sectie">{t('retention.welkVak')}</h3>
      <ul className="tk-lijst">
        {vakken.map((vak) => {
          const module = modules.find((kandidaat) => kandidaat.id === vak.moduleId);
          if (!module || vak.totaal === 0) return null;
          const ModuleIcon = MODULE_ICON[vak.moduleId];
          const bezig = vak.opfrissen + vak.oefenen;

          return (
            <li key={vak.moduleId}>
              <button
                type="button"
                className="tk-lijstrij"
                data-module={vak.moduleId}
                aria-pressed={vak.moduleId === gekozen}
                onClick={() => onKies(vak.moduleId)}
              >
                <span className="tk-plaat">
                  <ModuleIcon size={24} />
                </span>
                <span className="tk-lijstrij-tekst">
                  <span className="tk-lijstrij-titel">{t(module.name)}</span>
                  <span className="tk-lijstrij-regel">
                    {geoefend(vak) === 0
                      ? t('retention.vakLeeg', { totaal: vak.totaal })
                      : t('retention.vakRegel', {
                          onthouden: vak.onthouden,
                          geoefend: geoefend(vak),
                          totaal: vak.totaal,
                        })}
                  </span>
                  <span className="tk-vakbalk" aria-hidden="true">
                    {vak.onthouden > 0 ? (
                      <span
                        className="tk-vakbalk-onthouden"
                        style={{ width: breedte(vak.onthouden, vak.totaal) }}
                      />
                    ) : null}
                    {bezig > 0 ? (
                      <span
                        className="tk-vakbalk-bezig"
                        style={{ width: breedte(bezig, vak.totaal) }}
                      />
                    ) : null}
                  </span>
                </span>
                <span className="tk-lijstrij-pijl">
                  <NextIcon size={20} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * De vragen van de laatste weken als staven, goed onderin, en alles bij elkaar
 * in één zin. "Foutloos op rij" en het record stonden er ook; een reeks die één
 * fout afpakt, is weg met de andere reeksen (ADR-149).
 */
function Weken({ verloop, rondes }: { readonly verloop: Verloop; readonly rondes: number }) {
  const { weken, procentGoed, vragen } = verloop;
  const hoogste = Math.max(1, ...weken.map((week) => week.goed + week.fout));

  return (
    <>
      <figure className="tk-card tk-grafiek">
        <figcaption className="tk-label">{t('retention.grafiek')}</figcaption>
        <ol className="tk-grafiek-weken" aria-label={t('retention.grafiek')}>
          {weken.map((week) => {
            const totaal = week.goed + week.fout;
            return (
              <li
                key={week.nummer}
                className="tk-grafiek-week"
                data-deze={week.deze ? 'ja' : undefined}
              >
                <span className="tk-grafiek-getal" aria-hidden="true">
                  {totaal}
                </span>
                <span className="tk-grafiek-vak" aria-hidden="true">
                  <span
                    className="tk-grafiek-staaf"
                    style={{ height: breedte(totaal, hoogste) }}
                    data-leeg={totaal === 0 ? 'ja' : undefined}
                  >
                    {week.goed > 0 ? (
                      <span className="tk-grafiek-goed" style={{ flexGrow: week.goed }} />
                    ) : null}
                    {week.fout > 0 ? (
                      <span className="tk-grafiek-fout" style={{ flexGrow: week.fout }} />
                    ) : null}
                  </span>
                </span>
                <span className="tk-grafiek-naam" aria-hidden="true">
                  {week.deze
                    ? t('retention.grafiekNu')
                    : t('retention.grafiekWk', { nummer: week.nummer })}
                </span>
                <span className="tk-sr-only">
                  {t(week.deze ? 'retention.grafiekDezeZin' : 'retention.grafiekZin', {
                    nummer: week.nummer,
                    totaal,
                    goed: week.goed,
                  })}
                </span>
              </li>
            );
          })}
        </ol>
        <ul className="flex flex-wrap gap-x-6 gap-y-2" aria-hidden="true">
          <li className="tk-grafiek-legenda">
            <span className="tk-grafiek-teken tk-grafiek-goed" />
            {t('retention.grafiekGoed')}
          </li>
          <li className="tk-grafiek-legenda">
            <span className="tk-grafiek-teken tk-grafiek-fout" />
            {t('retention.grafiekFout')}
          </li>
        </ul>
      </figure>

      {procentGoed === null ? null : (
        <p className="text-tekst-secundair">
          {t('retention.totaal', { rondes, vragen, procent: procentGoed })}
        </p>
      )}
    </>
  );
}
