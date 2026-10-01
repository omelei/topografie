import { useRef, useState } from 'react';
import { ChevronRightIcon } from '@/components/Icon';
import { ProgressBar } from '@/components/ProgressBar';
import { MODULE_ICON } from '@/features/shell/moduleIcons';
import type { Module } from '@/features/shell/modules';
import { t } from '@/i18n';

/** Hoeveel rijen er staan voordat "Nog 4 tonen" de rest uitklapt (ADR-252). */
export const ZICHTBAAR = 3;

/** Eén rij in een lijst op Vandaag: een onderwerp, en wat een druk erop doet. */
export interface OefenRijData {
  readonly sleutel: string;
  readonly moduleId: Module['id'];
  readonly titel: string;
  /** "Meerkeuze · 8 van de 10 goed": de spelvorm, en waar dat zo is de uitslag. */
  readonly regel: string;
  /** Een ronde die half af is, als balk. */
  readonly balk?: { readonly waarde: number; readonly label: string } | undefined;
  readonly onClick: () => void;
}

/**
 * Een rij van Vandaag als lijst, op een telefoon (ADR-252).
 *
 * De rijen die opzij doorliepen (ADR-094) toonden op 393 anderhalve kaart, en
 * wat erachter lag zag een kind alleen als het wist dat het moest vegen. Op een
 * telefoon is elke rij nu een lijst in één witte kaart: elke rij even hoog,
 * dezelfde plaat, dezelfde pijl. Drie staan er; de rest is één druk verder,
 * zodat drie lijsten samen geen drie schermen lang worden.
 *
 * Dezelfde naam als de rij (een `group` met de titel), zodat wat de rij vond,
 * de lijst ook vindt.
 */
export function OefenLijst({
  titel,
  meta,
  rijen,
}: {
  readonly titel: string;
  /** Rechts in de kop, waar de lijst dat nodig heeft: "12 vragen". */
  readonly meta?: string | undefined;
  readonly rijen: readonly OefenRijData[];
}) {
  const [alles, setAlles] = useState(false);
  const lijst = useRef<HTMLUListElement>(null);
  const getoond = alles ? rijen : rijen.slice(0, ZICHTBAAR);
  const verborgen = rijen.length - getoond.length;

  if (rijen.length === 0) return null;

  return (
    <section className="tk-oefenlijst" aria-label={titel}>
      <div className="tk-sectie">
        <h2>{titel}</h2>
        {meta === undefined ? null : <span className="tk-sectie-meta">{meta}</span>}
      </div>
      <div role="group" aria-label={titel}>
        <ul ref={lijst} className="tk-oefenlijst-rijen">
          {getoond.map((rij) => (
            <li key={rij.sleutel}>
              <OefenRij rij={rij} />
            </li>
          ))}
          {verborgen > 0 ? (
            <li>
              <button
                type="button"
                className="tk-oefenlijst-meer"
                aria-expanded={false}
                onClick={() => {
                  setAlles(true);
                  // De focus naar de eerste rij die erbij kwam: de knop zelf is
                  // weg, en een toetsenbord begint anders weer bovenaan.
                  requestAnimationFrame(() => {
                    const rijen =
                      lijst.current?.querySelectorAll<HTMLButtonElement>('.tk-oefenrij');
                    rijen?.item(ZICHTBAAR)?.focus();
                  });
                }}
              >
                {verborgen === 1
                  ? t('home.nogTonenEen')
                  : t('home.nogTonen', { aantal: verborgen })}
              </button>
            </li>
          ) : null}
        </ul>
      </div>
    </section>
  );
}

/**
 * De rij zelf: de plaat van het vak, het onderwerp, de spelvorm met de uitslag,
 * bij een halve ronde een balk, en de pijl in de tint van het vak.
 */
function OefenRij({ rij }: { readonly rij: OefenRijData }) {
  const ModuleIcon = MODULE_ICON[rij.moduleId];

  return (
    <button type="button" data-module={rij.moduleId} className="tk-oefenrij" onClick={rij.onClick}>
      <span className="tk-plaat tk-oefenrij-plaat" aria-hidden="true">
        <ModuleIcon size={22} />
      </span>
      <span className="tk-oefenrij-tekst">
        <span className="tk-oefenrij-titel">{rij.titel}</span>
        <span className="tk-oefenrij-regel">{rij.regel}</span>
        {rij.balk === undefined ? null : (
          // De balk is versiering: de regel zegt hetzelfde in woorden, en de
          // hele rij is één knop waarvan de naam één keer gelezen wordt.
          <span aria-hidden="true">
            <ProgressBar value={rij.balk.waarde} showDot={false} label={rij.balk.label} />
          </span>
        )}
      </span>
      <span className="tk-oefenrij-pijl" aria-hidden="true">
        <ChevronRightIcon size={20} />
      </span>
    </button>
  );
}
