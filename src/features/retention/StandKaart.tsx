import { useEffect, useId, useState } from 'react';
import type { Item, ItemState } from '@/game-core';
import { loadGeoSet, type GeoSet } from '@/content/loadGeo';
import type { AnswerLayer } from '@/features/practice/MapCanvas';
import { statusOf } from './itemStatus';
import { loadAnswerLayer, SETS, type SetId } from '@/features/practice/useRound';

/**
 * De stand van een topografieset, op de kaart waar hij hoort (ADR-158).
 *
 * Dit was de inkleurende albumpagina. Hij is niet verdwenen maar opgehouden een
 * beloning te zijn: elke plek draagt nu de status die de tabel en de stippen
 * ernaast ook gebruiken — nog niet geoefend, aan het oefenen, onthouden, even
 * opfrissen. Eén taal voor drie beelden van hetzelfde.
 *
 * De kaart is voor de ogen. Wat er per plek staat, zegt de lijst ernaast, die
 * ook met een toetsenbord te lezen is; daarom is dit beeld voor een schermlezer
 * één zin en geen honderdtwintig.
 */

/** Of een set een kaart heeft om in te kleuren: een mix en een foutenlijst niet. */
export function heeftKaart(setId: string): setId is SetId {
  return Object.prototype.hasOwnProperty.call(SETS, setId);
}

export function StandKaart({
  setId,
  items,
  states,
  now,
  label,
}: {
  readonly setId: SetId;
  readonly items: readonly Item[];
  readonly states: ReadonlyMap<string, ItemState>;
  readonly now: Date;
  /** Eén zin voor een schermlezer: wat er op deze kaart staat. */
  readonly label: string;
}) {
  const arcering = `tk-arcering-${useId().replace(/:/g, '')}`;
  const [kaart, setKaart] = useState<{ grond: GeoSet; laag: AnswerLayer } | null>(null);

  useEffect(() => {
    let levend = true;
    const vorm = SETS[setId];
    void Promise.all([loadGeoSet(vorm.achtergrond, 'region', vorm.regio), loadAnswerLayer(vorm)])
      .then(([grond, laag]) => {
        if (levend) setKaart({ grond, laag });
      })
      .catch(() => {
        // Geen kaart is geen kapotte pagina: de lijst eronder zegt hetzelfde.
      });
    return () => {
      levend = false;
    };
  }, [setId]);

  if (kaart === null) return <div className="tk-standkaart" aria-busy="true" />;

  const perRef = new Map<string, Item>();
  for (const item of items) {
    if (item.geometrieRef) perRef.set(item.geometrieRef, item);
  }

  const { grond, laag } = kaart;
  const vormen =
    laag.kind === 'background' ? grond.vormen : laag.kind === 'shapes' ? laag.set.vormen : [];
  const punten = laag.kind === 'points' ? laag.set.punten : [];
  const [, , breedte, hoogte] = grond.viewBox;
  const straal = Math.max(breedte, hoogte) / 90;

  /** De status van de plek achter deze geometrie, in de taal van de tabel. */
  const standVanRef = (ref: string) => {
    const item = perRef.get(ref);
    return statusOf(item ? states.get(item.id) : undefined, now);
  };

  return (
    <svg
      className="tk-standkaart"
      viewBox={grond.viewBox.join(' ')}
      style={{ aspectRatio: `${breedte} / ${hoogte}` }}
      role="img"
      aria-label={label}
    >
      <defs>
        <pattern
          id={arcering}
          width="14"
          height="14"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect className="tk-standkaart-arceergrond" width="14" height="14" />
          <line className="tk-standkaart-arceerlijn" x1="0" y1="0" x2="0" y2="14" />
        </pattern>
      </defs>

      {laag.kind !== 'background'
        ? grond.vormen.map((vorm) => (
            <path key={vorm.id} className="tk-standkaart-grond" d={vorm.d} />
          ))
        : null}

      {vormen.map((vorm) => {
        const item = perRef.get(vorm.id);
        if (!item) return <path key={vorm.id} className="tk-standkaart-grond" d={vorm.d} />;
        const status = standVanRef(vorm.id);
        return (
          <path
            key={vorm.id}
            className="tk-standvorm"
            d={vorm.d}
            data-status={status}
            style={status === 'refresh' ? { fill: `url(#${arcering})` } : undefined}
          />
        );
      })}

      {punten.map((punt) => {
        const item = perRef.get(punt.id);
        if (!item) return null;
        const status = standVanRef(punt.id);
        return (
          <circle
            key={punt.id}
            className="tk-standpunt"
            cx={punt.punt[0]}
            cy={punt.punt[1]}
            r={straal}
            data-status={status}
            style={status === 'refresh' ? { fill: `url(#${arcering})` } : undefined}
          />
        );
      })}
    </svg>
  );
}
