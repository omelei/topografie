import { useEffect, useState } from 'react';
import { loadGeoSet, type GeoSet } from '@/content/loadGeo';
import type { AnswerLayer } from '@/features/practice/MapCanvas';
import { loadAnswerLayer, SETS, type SetId } from '@/features/practice/useRound';
import { t } from '@/i18n';

/**
 * De blinde kaart van een werkblad (ADR-211): de kaart zonder namen, en een
 * nummer bij elke plek die gevraagd wordt.
 *
 * Een eigen tekening en niet `MapCanvas`: die is gemaakt om op te tikken, en
 * laat een stad pas zien als je hem kiest. Op papier moet alles tegelijk
 * zichtbaar zijn, in zwart op wit.
 */
export function WerkbladKaart({
  setId,
  plekken,
}: {
  readonly setId: string;
  /** De plekken in volgorde: het eerste krijgt nummer 1. */
  readonly plekken: readonly string[];
}) {
  const [kaart, setKaart] = useState<{ achtergrond: GeoSet; laag: AnswerLayer } | null>(null);

  useEffect(() => {
    const vorm = SETS[setId as SetId];
    if (!vorm) return;
    let levend = true;
    void Promise.all([
      loadGeoSet(vorm.achtergrond, 'region', vorm.regio),
      loadAnswerLayer(vorm),
    ]).then(([achtergrond, laag]) => {
      if (levend) setKaart({ achtergrond, laag });
    });
    return () => {
      levend = false;
    };
  }, [setId]);

  if (kaart === null) return <p className="tk-hulp">{t('werkblad.laden')}</p>;

  const { achtergrond, laag } = kaart;
  const [x, y, w, h] = achtergrond.viewBox;
  const r = Math.max(w, h) / 55;

  // Waar het nummer van elke plek staat, en of er een stip bij hoort.
  const plek = new Map<string, { punt: readonly [number, number]; stip: boolean }>();
  const vormen = laag.kind === 'shapes' ? laag.set.vormen : achtergrond.vormen;
  for (const vorm of vormen) {
    const [minX, minY, maxX, maxY] = vorm.bbox;
    plek.set(vorm.id, { punt: vorm.punt ?? [(minX + maxX) / 2, (minY + maxY) / 2], stip: false });
  }
  if (laag.kind === 'points') {
    for (const punt of laag.set.punten) plek.set(punt.id, { punt: punt.punt, stip: true });
  }

  return (
    <svg
      className="tk-werkblad-kaart"
      viewBox={`${x} ${y} ${w} ${h}`}
      role="img"
      aria-label={t('werkblad.opdracht.kaart')}
    >
      {achtergrond.vormen.map((vorm) => (
        <path key={vorm.id} d={vorm.d} className="tk-werkblad-land" />
      ))}
      {laag.kind === 'shapes'
        ? laag.set.vormen.map((vorm) => (
            <path key={vorm.id} d={vorm.d} className="tk-werkblad-vorm" />
          ))
        : null}
      {plekken.map((id, index) => {
        const waar = plek.get(id);
        if (!waar) return null;
        const [px, py] = waar.punt;
        // Bij een stip staat het nummer ernaast, zodat de stip zichtbaar blijft.
        const nx = waar.stip ? px + r * 1.4 : px;
        const ny = waar.stip ? py - r * 1.4 : py;
        return (
          <g key={id}>
            {waar.stip ? <circle cx={px} cy={py} r={r / 3} className="tk-werkblad-stip" /> : null}
            <circle cx={nx} cy={ny} r={r} className="tk-werkblad-nummer" />
            <text
              x={nx}
              y={ny}
              fontSize={r * 1.2}
              textAnchor="middle"
              dominantBaseline="central"
              className="tk-werkblad-nummertekst"
            >
              {index + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
