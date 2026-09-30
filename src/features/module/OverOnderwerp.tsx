import { useId, type MouseEvent } from 'react';
import { t } from '@/i18n';
import { overOnderwerp } from '@/seo/over';
import type { SeoLink } from '@/seo/paginas';
import type { Onderdeel } from './onderdelen';

/**
 * Onderaan de pagina van een onderwerp: wat erin zit, en de vragen die een
 * ouder stelt (ADR-213). Dezelfde tekst als op de pagina voor Google.
 *
 * Daaronder de andere onderwerpen van het vak als echte links (ADR-245): Google
 * volgt een `<a href>` en geen knop, en zonder links hingen de pagina's alleen
 * aan de sitemap. Een gewone klik blijft in de app (`onVolg`); een klik met
 * Ctrl of Cmd, of een lange druk, opent het adres zoals elke link.
 */
export function OverOnderwerp({
  deel,
  links = [],
  linksKop = '',
  onVolg,
}: {
  readonly deel: Onderdeel;
  readonly links?: readonly SeoLink[];
  readonly linksKop?: string;
  readonly onVolg?: (pad: string) => void;
}) {
  const kopId = useId();
  const over = overOnderwerp(deel);

  const volg = (event: MouseEvent<HTMLAnchorElement>, pad: string) => {
    if (!onVolg || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onVolg(pad);
  };

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
      {links.length > 0 ? (
        <nav className="tk-over-links" aria-label={linksKop}>
          <h3 className="tk-kaart-titel">{linksKop}</h3>
          <ul>
            {links.map(({ pad, naam }) => (
              <li key={pad}>
                <a href={pad} onClick={(event) => volg(event, pad)}>
                  {naam}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </section>
  );
}
