import { useMemo } from 'react';
import { t } from '@/i18n';
import { loadTaalSet } from '@/content/loadTaal';
import { naamVan, startbareOnderdelen } from '@/features/module/onderdelen';
import { setUitleg } from './taalTaal';

/**
 * Ontdekken, for Taal: a set with nothing being asked (ADR-118).
 *
 * For spelling, the rule in a sentence and then every word, the letters that
 * decide marked and the sentence under it, with the longer word or the word
 * in pieces where that is what shows the rule. It is also where a child looks
 * a word up before a round, so the list is in the alphabet's order.
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
          <p className="tk-label">{t('taal.explore.kind')}</p>
          <h1 className="tk-display truncate text-vraag">{deel ? naamVan(deel) : ''}</h1>
        </div>

        <button type="button" className="tk-button tk-button-secondary ml-auto" onClick={onHome}>
          {t('explore.done')}
        </button>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
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
                        {item.hulp ? (
                          <span className="tk-lijstrij-stand">{item.hulp}</span>
                        ) : null}
                      </div>
                    </li>
                  ))}
              </ul>
            </section>
          ) : null}
        </div>
      </main>
    </div>
  );
}
