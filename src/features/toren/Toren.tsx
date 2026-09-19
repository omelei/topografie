import type { CSSProperties } from 'react';
import { STENEN_PER_VERDIEPING, type TorenStand, type Vak, type Verdieping } from '@/game-core';
import { t } from '@/i18n';
import {
  FUNDAMENT_HOOG,
  maatvoering,
  MAX_GETEKEND,
  SCHACHT,
  STEEN,
  steenPlek,
  TONEEL,
  VERDIEPING_HOOG,
  verdiepingY,
} from './geometrie';

/**
 * De toren (ADR-158).
 *
 * **Eén vaste viewBox, en een schaal die hier wordt uitgerekend.** Zo past elke
 * toren in zijn eigen kader zonder iets te meten, en weet de code hoe groot een
 * letter wordt. Twee torens zijn daardoor ook nooit met het oog te vergelijken:
 * een toren van veertig verdiepingen vult hetzelfde kader als een van vijf.
 *
 * **De bovenste verdiepingen los, de rest in één blok.** Twintig is waar een rij
 * stenen op een telefoon ophoudt leesbaar te zijn; alles daaronder wordt één
 * fundamentblok met het aantal erin. Dat is goed voor de tekensnelheid en het is
 * zelf een beloning: je begin wordt piepklein.
 *
 * **Kleur is versiering.** Gevuld is verdiend en gestippeld ligt klaar, en dat
 * verschil is een vorm. Het vak staat op `data-vak` en niet op `data-module`,
 * want `[data-module]` verzet in deze codebase de hele `--module-*`-familie en
 * wijst topografie naar de merkkleur.
 */
export function Toren({
  stand,
  /** Stenen die morgen klaarliggen, als gestippelde omtrek in de aanbouw. */
  spook = 0,
  /** Hoeveel verdiepingen de camera gezakt is. De scène zet dit op 1. */
  pan = 0,
  /** Hoeveel van de bovenste stenen deze ronde verdiend zijn: die vliegen in. */
  nieuw = 0,
  max = MAX_GETEKEND,
}: {
  readonly stand: TorenStand;
  readonly spook?: number;
  readonly pan?: number;
  readonly nieuw?: number;
  readonly max?: number;
}) {
  const maat = maatvoering(stand.verdiepingen, max);

  // Van onder naar boven: eerst wat het kind al had, dan wat het verdiende.
  const alle: readonly (Verdieping | null)[] = [
    ...Array.from({ length: stand.fundament }, () => null),
    ...stand.volle,
  ];
  const getekend = alle.slice(maat.inFundament);

  const label = t('toren.samenvatting', {
    stenen: stand.stenen,
    verdiepingen: stand.verdiepingen,
    meter: stand.meter,
  });

  return (
    <div className="tk-toren">
      <svg
        className="tk-toren-beeld"
        // Van onderen gesneden: de toren staat onderin het toneel, dus wat
        // eraf gaat is lucht die niemand mist.
        viewBox={`0 ${TONEEL.hoog - maat.zichtbaar} ${TONEEL.breed} ${maat.zichtbaar}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ aspectRatio: `${TONEEL.breed} / ${maat.zichtbaar}` }}
        role="img"
        aria-label={label}
      >
        <g
          className="tk-toren-camera"
          style={
            { '--tk-pan': pan, '--tk-verdieping': maat.schaal * VERDIEPING_HOOG } as CSSProperties
          }
        >
          {/* De grond staat onder het midden, en omhoog is negatief. */}
          <g transform={`translate(${TONEEL.breed / 2} ${TONEEL.hoog - 30}) scale(${maat.schaal})`}>
            {maat.inFundament > 0 ? (
              <g className="tk-toren-fundament">
                <rect
                  className="tk-toren-fundamentblok"
                  x={-SCHACHT / 2}
                  y={-FUNDAMENT_HOOG}
                  width={SCHACHT}
                  height={FUNDAMENT_HOOG}
                />
                {/* Tegen de schaal in: het getal staat binnen de geschaalde
                    groep, en zonder dit is het op een hoge toren tien pixels. */}
                <text
                  className="tk-toren-fundamentgetal"
                  x={0}
                  y={-FUNDAMENT_HOOG / 2}
                  fontSize={20 / maat.schaal}
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {maat.inFundament}
                </text>
              </g>
            ) : null}

            {getekend.map((verdieping, rang) => (
              <VerdiepingBeeld
                key={verdieping?.nummer ?? `fundament-${rang}`}
                vakken={verdieping?.vakken ?? LEEG}
                onderkant={verdiepingY(rang, maat)}
              />
            ))}

            <VerdiepingBeeld
              vakken={stand.aanbouw}
              spook={spook}
              nieuwVanaf={Math.max(0, stand.aanbouw.length - nieuw)}
              onderkant={verdiepingY(maat.getekend, maat)}
            />
          </g>
        </g>
      </svg>

      {/* De datums worden niet getekend, maar ze zijn er wel: voor wie luistert
          is de log het interessantste deel van de toren. Een kind zonder
          verdiepingen krijgt geen lege lijst. */}
      {stand.verdiepingen > 0 ? (
        <ol className="tk-sr-only">
          {[...stand.volle].reverse().map((verdieping) => (
            <li key={verdieping.nummer}>
              {t('toren.verdiepingDatum', {
                n: verdieping.nummer,
                datum: DATUM.format(new Date(verdieping.datum)),
              })}
            </li>
          ))}
          {stand.fundament > 0 ? <li>{t('toren.fundamentUitleg')}</li> : null}
        </ol>
      ) : null}
    </div>
  );
}

const LEEG: readonly (Vak | null)[] = Array.from({ length: STENEN_PER_VERDIEPING }, () => null);

const DATUM = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });

/** Eén verdieping: vijf breed en twee hoog, van onder naar boven gemetseld. */
function VerdiepingBeeld({
  vakken,
  onderkant,
  spook = 0,
  nieuwVanaf = Number.POSITIVE_INFINITY,
}: {
  readonly vakken: readonly (Vak | null)[];
  readonly onderkant: number;
  readonly spook?: number;
  /** Vanaf welke plek de stenen deze ronde verdiend zijn. */
  readonly nieuwVanaf?: number;
}) {
  const plekken = Array.from({ length: STENEN_PER_VERDIEPING }, (_, index) => index);
  return (
    <g transform={`translate(0 ${onderkant})`}>
      {plekken.map((index) => {
        const gelegd = index < vakken.length;
        const wacht = !gelegd && index < vakken.length + spook;
        if (!gelegd && !wacht) return null;
        const plek = steenPlek(index);
        const isNieuw = gelegd && index >= nieuwVanaf;
        return (
          <rect
            key={index}
            className="tk-steen"
            data-vak={gelegd ? (vakken[index] ?? undefined) : undefined}
            data-wacht={wacht ? 'ja' : undefined}
            data-nieuw={isNieuw ? 'ja' : undefined}
            style={isNieuw ? ({ '--tk-i': index - nieuwVanaf } as CSSProperties) : undefined}
            x={plek.x}
            y={plek.y}
            width={STEEN.breed}
            height={STEEN.hoog}
            rx={1}
          />
        );
      })}
    </g>
  );
}
