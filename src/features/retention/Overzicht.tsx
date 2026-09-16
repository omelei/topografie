import type { CSSProperties } from 'react';
import { NextIcon } from '@/components/Icon';
import { StatusLabel, type ItemStatus } from '@/components/StatusLabel';
import { dayKey, formatGrade, grade, type FlawlessRun } from '@/game-core';
import { geplaatst, naamVan, startbareOnderdelen } from '@/features/module/onderdelen';
import { MODULE_ICON } from '@/features/shell/moduleIcons';
import type { Module } from '@/features/shell/modules';
import { t } from '@/i18n';
import type { PlayedRound } from '@/store/progress';
import { geoefend, type Geheugen, type Stand, type VakStand, type WeekTelling } from './statistiek';

/**
 * De bovenkant van de Onthouden-pagina (ADR-148): wat je onthoudt over alles,
 * hoe deze week ging, per vak, en week na week.
 *
 * Elk getal hier staat op één plek in het product. De vier tegels over deze
 * week stonden op Voor ouders, het aantal rondes en vragen op de reekspagina,
 * en "Goed beantwoord" in de kolom naast elke pagina. Ze gaan allemaal over hoe
 * het oefenen gaat, en dat is de vraag die deze pagina beantwoordt.
 *
 * **Beelden eerst, binnen de huisstijl.** Een ring voor de voorspelling en een
 * balk voor de vier woorden, in inkt, want onthouden is een stand en geen goed
 * antwoord (`StatusLabel`). Per vak de kleur van het vak, die een vak mag
 * dragen in zijn balk. In de weekgrafiek wél groen en gearceerd rood: daar
 * staan antwoorden, en goed en fout zien er overal in het product zo uit.
 */

/** De drie standen die iets hebben dat geoefend is, in de volgorde van de balk. */
const STANDEN: readonly (readonly [ItemStatus, keyof Stand])[] = [
  ['remembered', 'onthouden'],
  ['refresh', 'opfrissen'],
  ['practising', 'oefenen'],
];

/** Wat je onthoudt, over elk vak: de ring, het getal, en de balk eronder. */
export function GeheugenKaart({ stand }: { readonly stand: Geheugen }) {
  const totaal = geoefend(stand);
  const procent = stand.overDrieWeken;

  return (
    <section className="tk-card tk-geheugen" aria-label={t('retention.geheugenTitel')}>
      <h2 className="tk-label">{t('retention.geheugenTitel')}</h2>

      {totaal === 0 || procent === null ? (
        <p className="text-lopend text-tekst-secundair">{t('retention.geheugenLeeg')}</p>
      ) : (
        <>
          <div className="tk-geheugen-kop">
            {/* Decoratief: de zin ernaast zegt hetzelfde in woorden. */}
            <div
              className="tk-ring"
              style={{ '--vul': `${procent}%` } as CSSProperties}
              aria-hidden="true"
            >
              <span className="tk-ring-getal">{t('retention.procent', { procent })}</span>
              <span className="tk-ring-label">{t('retention.ringLabel')}</span>
            </div>

            <div className="flex min-w-0 flex-col gap-2">
              <p className="tk-reeks-getal">
                <span className="tk-reeks-aantal">{stand.onthouden}</span>
                <span className="tk-reeks-zin">
                  {stand.onthouden === 1
                    ? t('retention.geheugenEen')
                    : t('retention.geheugenVeel')}
                </span>
              </p>
              <p className="tk-hulp">{t('retention.geheugenVan', { aantal: totaal })}</p>
              <p className="text-lopend">{t('retention.ringZin', { procent })}</p>
            </div>
          </div>

          <StandBalk stand={stand} />
        </>
      )}
    </section>
  );
}

/**
 * Onthouden, even opfrissen en nog aan het oefenen, naast elkaar in één balk.
 * De balk is voor het oog; de lijst eronder zegt elk deel met zijn woord, zijn
 * stip en zijn aantal.
 */
function StandBalk({ stand }: { readonly stand: Stand }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="tk-standbalk" aria-hidden="true">
        {STANDEN.map(([status, sleutel]) =>
          stand[sleutel] === 0 ? null : (
            <span
              key={status}
              className="tk-standbalk-deel"
              data-status={status}
              style={{ flexGrow: stand[sleutel] }}
            />
          ),
        )}
      </div>
      <ul className="flex flex-wrap gap-x-6 gap-y-2">
        {STANDEN.map(([status, sleutel]) => (
          <li key={status} className="flex items-center gap-2">
            <StatusLabel status={status} />
            <span className="tk-standbalk-aantal">{stand[sleutel]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Deze week, in vier tegels: rondes, dagen, vragen en het cijfer waar ze op
 * uitkwamen, en wat het meest geoefend is (ADR-079). Van Voor ouders hierheen
 * gekomen (ADR-148); daar staat de lezing ervan, het weekbericht.
 *
 * Gratis, zoals het daar was: het zijn feiten over het eigen kind (ADR-124).
 */
export function DezeWeek({
  rondes,
  now,
}: {
  readonly rondes: readonly PlayedRound[];
  readonly now: Date;
}) {
  const grens = dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6));
  const deze = rondes.filter((ronde) => dayKey(new Date(ronde.at)) >= grens);

  const beantwoord = deze.reduce((samen, ronde) => samen + ronde.answered, 0);
  const goed = deze.reduce((samen, ronde) => samen + ronde.correct, 0);
  const dagen = new Set(deze.map((ronde) => dayKey(new Date(ronde.at)))).size;
  const cijfer = grade(goed, beantwoord);

  // Wat het meest geoefend is: de zin die een ouder herhaalt.
  const perSet = new Map<string, number>();
  for (const { deel, ronde } of geplaatst(deze, startbareOnderdelen())) {
    perSet.set(naamVan(deel), (perSet.get(naamVan(deel)) ?? 0) + ronde.answered);
  }
  const meest = [...perSet.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;

  const tegels = [
    [t('you.tegelRondes'), String(deze.length)],
    [t('you.tegelDagen'), String(dagen)],
    [t('you.tegelVragen'), String(beantwoord)],
    [t('you.tegelCijfer'), cijfer === null ? t('you.geenCijfer') : formatGrade(cijfer)],
  ] as const;

  return (
    <section className="flex flex-col gap-3" aria-label={t('you.week')}>
      <h2 className="tk-sectie">{t('you.week')}</h2>
      {deze.length === 0 ? (
        <p className="text-tekst-secundair">{t('you.weekNone')}</p>
      ) : (
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
    </section>
  );
}

/** Een deel van een balk als percentage. Wat er is, krijgt in de CSS een minimum. */
function breedte(deel: number, totaal: number): string {
  return `${totaal === 0 ? 0 : (deel / totaal) * 100}%`;
}

/**
 * Elk vak op één regel: hoeveel je onthoudt, hoeveel je geoefend hebt, en van
 * hoeveel, met een balk in de kleur van het vak. Een druk op de regel kiest dat
 * vak hieronder, bij Per onderwerp.
 */
export function PerVak({
  vakken,
  modules,
  onKies,
}: {
  readonly vakken: readonly VakStand<Module['id']>[];
  readonly modules: readonly Module[];
  readonly onKies: (moduleId: Module['id']) => void;
}) {
  return (
    <section className="flex flex-col gap-3" aria-label={t('retention.vakTitel')}>
      <h2 className="tk-sectie">{t('retention.vakTitel')}</h2>
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
    </section>
  );
}

/**
 * Week na week: vijf getallen over al het oefenen, en de vragen van de laatste
 * weken als staven, goed onderin.
 *
 * Premium: dit is het bijhouden, en het cijfer over hoe het gaat was dat al in
 * de kolom (ADR-124).
 */
export function WeekNaWeek({
  weken,
  procentGoed,
  run,
  rondes,
  vragen,
}: {
  readonly weken: readonly WeekTelling[];
  readonly procentGoed: number | null;
  readonly run: FlawlessRun;
  readonly rondes: number;
  readonly vragen: number;
}) {
  const tegels = [
    [
      t('retention.cijferGoed'),
      procentGoed === null ? t('retention.nooit') : t('retention.procent', { procent: procentGoed }),
    ],
    [t('retention.cijferOpRij'), String(run.nu)],
    [t('retention.cijferRecord'), String(run.beste)],
    [t('retention.cijferRondes'), String(rondes)],
    [t('retention.cijferVragen'), String(vragen)],
  ] as const;

  const hoogste = Math.max(1, ...weken.map((week) => week.goed + week.fout));

  return (
    <section className="flex flex-col gap-3" aria-label={t('retention.verloopTitel')}>
      <h2 className="tk-sectie">{t('retention.verloopTitel')}</h2>

      <dl className="tk-cijfers">
        {tegels.map(([label, waarde]) => (
          <div key={label} className="tk-cijfer">
            <dt className="tk-cijfer-label">{label}</dt>
            <dd className="tk-cijfer-getal">{waarde}</dd>
          </div>
        ))}
      </dl>

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
                  {week.deze ? t('retention.grafiekNu') : t('retention.grafiekWk', { nummer: week.nummer })}
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
    </section>
  );
}
