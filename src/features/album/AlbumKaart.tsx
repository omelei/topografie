import { useEffect, useId, useState } from 'react';
import { laagVan, stempelsVan, tekenVan, type Item, type ItemState } from '@/game-core';
import { loadGeoSet, type GeoSet } from '@/content/loadGeo';
import type { AnswerLayer } from '@/features/practice/MapCanvas';
import { loadAnswerLayer, SETS, type SetId } from '@/features/practice/useRound';

/**
 * Een albumpagina van topografie: de kaart die inkleurt (ADR-149).
 *
 * De plaatjes zijn de gebieden en de steden zelf, op de kaart waar ze horen.
 * Elke laag is een vorm (`Plaatje`): een stippellijn, een dichte lijn, arcering,
 * vlak, en voor een lijstje een dikke rand. Een stempel en een teken staan als
 * een klein rondje op de plek zelf.
 *
 * De kaart is voor de ogen. Wat er per plek staat, zegt de lijst eronder
 * (`AlbumPagina`), die ook met een toetsenbord te lezen is; daarom is dit beeld
 * voor een schermlezer één zin en geen honderdtwintig.
 */

/** Of een set een kaart heeft om in te kleuren: een mix en een foutenlijst niet. */
export function heeftKaart(setId: string): setId is SetId {
  return Object.prototype.hasOwnProperty.call(SETS, setId);
}

export function AlbumKaart({
  setId,
  items,
  states,
  now,
  veranderd,
  label,
}: {
  readonly setId: SetId;
  readonly items: readonly Item[];
  readonly states: ReadonlyMap<string, ItemState>;
  readonly now: Date;
  readonly veranderd: ReadonlySet<string>;
  /** Eén zin voor een schermlezer: wat er op deze pagina staat. */
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

  if (kaart === null) return <div className="tk-albumkaart" aria-busy="true" />;

  const perRef = new Map<string, Item>();
  for (const item of items) {
    if (item.geometrieRef) perRef.set(item.geometrieRef, item);
  }

  const { grond, laag } = kaart;
  const vormen = laag.kind === 'background' ? grond.vormen : laag.kind === 'shapes' ? laag.set.vormen : [];
  const punten = laag.kind === 'points' ? laag.set.punten : [];
  const [, , breedte, hoogte] = grond.viewBox;
  const straal = Math.max(breedte, hoogte) / 90;

  const merktekens: { id: string; x: number; y: number; stempels: number; teken: string | null }[] = [];

  const staatVan = (id: string) => {
    const item = perRef.get(id);
    return item ? states.get(item.id) : undefined;
  };

  const noteer = (id: string, punt: readonly [number, number] | null) => {
    const state = staatVan(id);
    const stempels = stempelsVan(state).length;
    const teken = tekenVan(state, now);
    if (punt && (stempels > 0 || teken)) {
      merktekens.push({ id, x: punt[0], y: punt[1], stempels, teken });
    }
  };

  return (
    <svg
      className="tk-albumkaart"
      viewBox={grond.viewBox.join(' ')}
      style={{ aspectRatio: `${breedte} / ${hoogte}` }}
      role="img"
      aria-label={label}
    >
      <defs>
        <pattern id={arcering} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect className="tk-albumkaart-arceergrond" width="14" height="14" />
          <line className="tk-albumkaart-arceerlijn" x1="0" y1="0" x2="0" y2="14" />
        </pattern>
      </defs>

      {laag.kind !== 'background'
        ? grond.vormen.map((vorm) => (
            <path key={vorm.id} className="tk-albumkaart-grond" d={vorm.d} />
          ))
        : null}

      {vormen.map((vorm) => {
        const item = perRef.get(vorm.id);
        if (!item) return <path key={vorm.id} className="tk-albumkaart-grond" d={vorm.d} />;
        noteer(vorm.id, vorm.punt);
        const laagNu = laagVan(states.get(item.id));
        return (
          <path
            key={vorm.id}
            className="tk-albumvorm"
            d={vorm.d}
            data-laag={laagNu}
            data-nieuw={veranderd.has(item.id) ? 'ja' : undefined}
            style={laagNu === 3 ? { fill: `url(#${arcering})` } : undefined}
          />
        );
      })}

      {punten.map((punt) => {
        const item = perRef.get(punt.id);
        if (!item) return null;
        noteer(punt.id, punt.punt);
        const laagNu = laagVan(states.get(item.id));
        return (
          <circle
            key={punt.id}
            className="tk-albumpunt"
            cx={punt.punt[0]}
            cy={punt.punt[1]}
            r={straal}
            data-laag={laagNu}
            data-nieuw={veranderd.has(item.id) ? 'ja' : undefined}
            style={laagNu === 3 ? { fill: `url(#${arcering})` } : undefined}
          />
        );
      })}

      {merktekens.map((merk) => (
        <g key={`merk-${merk.id}`} className="tk-albumkaart-merk" data-teken={merk.teken ?? undefined}>
          <circle cx={merk.x + straal} cy={merk.y - straal} r={straal * 0.9} />
          {merk.stempels > 0 && merk.teken === null ? (
            <text x={merk.x + straal} y={merk.y - straal} fontSize={straal * 1.1}>
              {merk.stempels}
            </text>
          ) : null}
        </g>
      ))}
    </svg>
  );
}
