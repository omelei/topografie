import { useMemo } from 'react';
import { t } from '@/i18n';
import { zinDelen, type WerkwoordItem } from '@/game-core';
import { loadTaalSet } from '@/content/loadTaal';
import { naamVan, startbareOnderdelen } from '@/features/module/onderdelen';
import {
  KAART_VOLGORDE,
  kaartTitel,
  kaartUitleg,
  kaartVan,
  setUitleg,
  werkwoordRegelZin,
} from './taalTaal';

/** How many examples a rule card shows: enough to see the rule, few enough to read. */
const VOORBEELDEN = 4;

/**
 * Ontdekken, for Taal: a set with nothing being asked (ADR-118).
 *
 * For spelling, the rule in a sentence and then every word, the letters that
 * decide marked and the sentence under it, with the longer word or the word
 * in pieces where that is what shows the rule. It is also where a child looks
 * a word up before a round, so the list is in the alphabet's order.
 *
 * For verbs, the rule cards — ik is the stem, jij and hij are the stem and a
 * t, 't kofschip, ge- and a t or a d — each with examples from the set and the
 * rule applied to each one, in the sentence the feedback uses.
 *
 * Nothing is scored and nothing is written to the scheduler: a child who
 * browses has not practised (see `ExploreScreen`).
 */
export function TaalExploreScreen({
  setId,
  onHome,
}: {
  readonly setId: string;
  readonly onHome: () => void;
}) {
  const set = useMemo(() => loadTaalSet(setId), [setId]);
  const deel = useMemo(
    () => startbareOnderdelen().find((kandidaat) => kandidaat.setId === setId),
    [setId],
  );
  const uitleg = setUitleg(setId);

  return (
    <div
      className="flex h-screen flex-col bg-papier"
      data-module="woorden"
      data-accent="module"
      data-thema="ronde"
    >
      <header className="tk-verken-kop">
        <div className="min-w-0">
          <p className="tk-label">
            {set?.deel === 'werkwoorden' ? t('taal.explore.kindVormen') : t('taal.explore.kind')}
          </p>
          <h1 className="tk-display truncate text-vraag">{deel ? naamVan(deel) : ''}</h1>
        </div>

        <button type="button" className="tk-button tk-button-secondary ml-auto" onClick={onHome}>
          {t('explore.done')}
        </button>
      </header>

      {/* The one part of the screen that scrolls, and it holds nothing that
          takes focus, so without a tab stop of its own a keyboard could not
          scroll it (axe: scrollable-region-focusable). */}
      <main
        className="min-h-0 flex-1 overflow-y-auto"
        tabIndex={0}
        aria-label={deel ? naamVan(deel) : undefined}
      >
        <div className="tk-uitslag-kolom p-6">
          {uitleg === null ? null : (
            <section className="tk-card flex flex-col gap-3" aria-label={t('taal.explore.regel')}>
              <h2 className="tk-sectie">{t('taal.explore.regel')}</h2>
              <p className="text-lopend">{uitleg}</p>
            </section>
          )}

          {set?.deel === 'spelling' ? (
            <section className="flex flex-col gap-3" aria-label={t('taal.explore.woorden')}>
              <h2 className="tk-sectie">{t('taal.explore.woorden')}</h2>
              <ul className="tk-lijst">
                {[...set.items]
                  .sort((a, b) => a.woord.localeCompare(b.woord, 'nl'))
                  .map((item) => (
                    <li key={item.id}>
                      <div className="tk-lijstrij">
                        <span className="tk-lijstrij-tekst">
                          <span className="tk-lijstrij-titel">
                            {item.woord.slice(0, item.gat[0])}
                            <mark className="tk-letters">
                              {item.woord.slice(item.gat[0], item.gat[1])}
                            </mark>
                            {item.woord.slice(item.gat[1])}
                          </span>
                          <span className="tk-lijstrij-regel">{item.zin}</span>
                        </span>
                        {item.hulp ? <span className="tk-lijstrij-stand">{item.hulp}</span> : null}
                      </div>
                    </li>
                  ))}
              </ul>
            </section>
          ) : null}

          {set?.deel === 'werkwoorden' ? <RegelKaarten items={set.items} /> : null}
        </div>
      </main>
    </div>
  );
}

/** One card per rule the set holds examples of, in the order they are taught. */
function RegelKaarten({ items }: { readonly items: readonly WerkwoordItem[] }) {
  return (
    <>
      {KAART_VOLGORDE.map((kaart) => {
        const voorbeelden = items.filter((item) => kaartVan(item) === kaart).slice(0, VOORBEELDEN);
        if (voorbeelden.length === 0) return null;

        return (
          <section key={kaart} className="flex flex-col gap-3" aria-label={kaartTitel(kaart)}>
            <h2 className="tk-sectie">{kaartTitel(kaart)}</h2>
            <p className="text-lopend">{kaartUitleg(kaart)}</p>
            <ul className="tk-lijst">
              {voorbeelden.map((item) => {
                const delen = zinDelen(item.zin, item.antwoord);
                return (
                  <li key={item.id}>
                    <div className="tk-lijstrij">
                      <span className="tk-lijstrij-tekst">
                        <span className="tk-lijstrij-titel">
                          {delen ? (
                            <>
                              {delen.voor}
                              <mark className="tk-letters">{delen.woord}</mark>
                              {delen.na}
                            </>
                          ) : (
                            item.zin
                          )}
                        </span>
                        <span className="tk-lijstrij-regel">{werkwoordRegelZin(item)}</span>
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </>
  );
}
