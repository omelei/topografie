import { useState } from 'react';
import {
  dagenTot,
  laagVan,
  paginaStand,
  stempelsVan,
  tekenVan,
  type ItemState,
  type PaginaStand,
  type Schedulable,
} from '@/game-core';
import { naamVan, type Onderdeel } from '@/features/module/onderdelen';
import { t } from '@/i18n';
import { AlbumKaart, heeftKaart } from './AlbumKaart';
import { isTopoItem, isKlokItem, isVlagItem, PlaatjeInhoud, plaatjeNaam } from './inhoud';
import { Plaatje, plaatjeLabel, stempelWoord } from './Plaatje';

/**
 * Eén pagina van het album: de plaatjes van één onderdeel (ADR-149).
 *
 * Bovenaan in één regel hoe de pagina ervoor staat. Daaronder de pagina zelf:
 * voor topografie de kaart die inkleurt, en voor al het andere een rooster van
 * plaatjes. Tik op een plaatje en de achterkant verschijnt eronder: wat het is,
 * wat het nu nodig heeft, en de stempels met hun maand.
 *
 * Op een kaart staat het rooster eronder in een uitklap, zodat elke plek ook
 * met een toetsenbord en een schermlezer te bereiken is.
 */

export function StandRegel({ stand }: { readonly stand: PaginaStand }) {
  const delen = [t('album.stand', { kleur: stand.kleur, totaal: stand.totaal })];
  if (stand.lijst > 0) delen.push(t('album.standLijst', { aantal: stand.lijst }));
  if (stand.stempels > 0) delen.push(stempelWoord(stand.stempels));
  if (stand.lastig > 0) delen.push(t('album.standLastig', { aantal: stand.lastig }));
  if (stand.opfrissen > 0) delen.push(t('album.standOpfrissen', { aantal: stand.opfrissen }));
  return <p className="tk-album-stand">{delen.join(' · ')}</p>;
}

export function AlbumRooster({
  items,
  states,
  now,
  veranderd,
  gekozen,
  onKies,
}: {
  readonly items: readonly Schedulable[];
  readonly states: ReadonlyMap<string, ItemState>;
  readonly now: Date;
  readonly veranderd: ReadonlySet<string>;
  readonly gekozen: string | null;
  readonly onKies: (id: string) => void;
}) {
  const eerste = items[0];
  const soort =
    eerste && isVlagItem(eerste) ? 'vlag' : eerste && isKlokItem(eerste) ? 'klok' : 'tekst';

  return (
    <ul className="tk-albumrooster" data-soort={soort}>
      {items.map((item) => (
        <li key={item.id}>
          <Plaatje
            state={states.get(item.id)}
            now={now}
            naam={plaatjeNaam(item)}
            nieuw={veranderd.has(item.id)}
            gekozen={gekozen === item.id}
            onKies={() => onKies(item.id)}
          >
            <PlaatjeInhoud item={item} />
          </Plaatje>
        </li>
      ))}
    </ul>
  );
}

const MAAND = new Intl.DateTimeFormat('nl-NL', { month: 'short', year: 'numeric' });

/** De achterkant van een plaatje: wat het is, wat het nodig heeft, en de stempels. */
export function Achterkant({
  item,
  state,
  now,
  onSluit,
}: {
  readonly item: Schedulable;
  readonly state: ItemState | undefined;
  readonly now: Date;
  readonly onSluit: () => void;
}) {
  const naam = plaatjeNaam(item);
  const stempels = stempelsVan(state);
  const weetje = isTopoItem(item) ? item.weetje : undefined;

  let wanneer: string;
  if (!state || state.laatsteReview === null || state.volgendeReview === null) {
    wanneer = t('album.achterkantNooit');
  } else if (new Date(state.volgendeReview).getTime() <= now.getTime()) {
    wanneer = t('album.achterkantNu');
  } else {
    const dagen = dagenTot(state.volgendeReview, now);
    wanneer = dagen === 1 ? t('album.achterkantMorgen') : t('album.achterkantTerug', { dagen });
  }

  return (
    <section className="tk-achterkant" aria-label={naam} aria-live="polite">
      <div className="tk-achterkant-kop">
        <p className="tk-achterkant-naam">{plaatjeLabel(naam, state, now)}</p>
        <button type="button" className="tk-button tk-button-secondary" onClick={onSluit}>
          {t('album.sluit')}
        </button>
      </div>
      <p>{wanneer}</p>
      {tekenVan(state, now) === 'lastig' ? <p>{t('album.achterkantLastig')}</p> : null}
      {weetje ? <p className="text-tekst-secundair">{weetje}</p> : null}
      {stempels.length > 0 ? (
        <ul className="tk-achterkant-stempels" aria-label={t('album.achterkantStempels')}>
          {stempels.map((moment) => (
            <li key={moment}>{MAAND.format(new Date(moment))}</li>
          ))}
        </ul>
      ) : null}
      {laagVan(state) > 0 && stempels.length === 0 ? (
        <p className="text-tekst-secundair">{t('album.achterkantGeenStempels')}</p>
      ) : null}
    </section>
  );
}

export function AlbumPagina({
  deel,
  states,
  now,
  veranderd = new Set(),
  kop = true,
}: {
  readonly deel: Onderdeel;
  readonly states: ReadonlyMap<string, ItemState>;
  readonly now: Date;
  readonly veranderd?: ReadonlySet<string>;
  /** De regel met de stand erboven. Uit waar de pagina er al een naast zich heeft. */
  readonly kop?: boolean;
}) {
  const [gekozen, setGekozen] = useState<string | null>(null);
  const ids = deel.items.map((item) => item.id);
  const stand = paginaStand(ids, states, now);
  const naam = naamVan(deel);
  const kaartSet =
    deel.moduleId === 'topo' && !deel.mix && heeftKaart(deel.setId) ? deel.setId : null;
  const kies = (id: string) => setGekozen((huidig) => (huidig === id ? null : id));
  const item =
    gekozen === null ? null : (deel.items.find((kandidaat) => kandidaat.id === gekozen) ?? null);

  const rooster = (
    <AlbumRooster
      items={deel.items}
      states={states}
      now={now}
      veranderd={veranderd}
      gekozen={gekozen}
      onKies={kies}
    />
  );

  return (
    <section
      className="tk-album"
      data-module={deel.moduleId}
      aria-label={t('album.paginaLabel', { naam })}
    >
      {kop ? <StandRegel stand={stand} /> : null}
      {kaartSet !== null ? (
        <>
          <AlbumKaart
            setId={kaartSet}
            items={deel.items.filter(isTopoItem)}
            states={states}
            now={now}
            veranderd={veranderd}
            label={t('album.kaartLabel', { naam, kleur: stand.kleur, totaal: stand.totaal })}
          />
          <details className="tk-album-lijst">
            <summary>{t('album.allePlaatjes')}</summary>
            {rooster}
          </details>
        </>
      ) : (
        rooster
      )}
      {item ? (
        <Achterkant
          item={item}
          state={states.get(item.id)}
          now={now}
          onSluit={() => setGekozen(null)}
        />
      ) : null}
    </section>
  );
}
