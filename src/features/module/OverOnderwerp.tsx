import { useId } from 'react';
import { t } from '@/i18n';
import { overOnderwerp } from '@/seo/over';
import type { Onderdeel } from './onderdelen';

/**
 * Onderaan de pagina van een onderwerp: wat erin zit, en de vragen die een
 * ouder stelt (ADR-213). Dezelfde tekst als op de pagina voor Google.
 */
export function OverOnderwerp({ deel }: { readonly deel: Onderdeel }) {
  const kopId = useId();
  const over = overOnderwerp(deel);

  return (
    <section className="tk-over" aria-labelledby={kopId}>
      <h2 id={kopId} className="tk-sectie">
        {over.kop}
      </h2>
      <h3 className="tk-kaart-titel">{over.lijstKop}</h3>
      <ul className="tk-over-lijst">
        {over.lijst.map((regel) => (
          <li key={regel}>{regel}</li>
        ))}
      </ul>
      {over.meer > 0 ? <p className="tk-hulp">{t('over.meer', { aantal: over.meer })}</p> : null}
      <h3 className="tk-kaart-titel">{t('over.vragen')}</h3>
      <dl className="tk-over-vragen">
        {over.vragen.map(({ vraag, antwoord }) => (
          <div key={vraag}>
            <dt>{vraag}</dt>
            <dd>{antwoord}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
