import { useState } from 'react';
import { Wordmark } from '@/components/Wordmark';
import { KlokFace } from '@/features/klok/KlokFace';
import { naamVan, startbareOnderdelen } from '@/features/module/onderdelen';
import { pathFor } from '@/features/shell/routes';
import type { Module } from '@/features/shell/modules';
import { Vlag } from '@/features/vlaggen/Vlag';
import { t } from '@/i18n';
import { tel } from '@/store/teller';
import { WerkbladKaart } from './WerkbladKaart';
import { werkbladVoor, zaadVan, type WerkbladVraag } from './werkblad';

/**
 * Een werkblad om te printen (ADR-211).
 *
 * Op het scherm: het blad zoals het uit de printer komt, met drie knoppen
 * erboven die niet meegeprint worden. Op papier: een naamregel, de opdracht, de
 * vragen, en op een tweede pagina de antwoorden. Zonder naam te openen, net als
 * de pagina van een onderwerp (ADR-208): wie een werkblad zoekt, is vaak een
 * ouder of een juf, en die oefent niet zelf.
 */
export function WerkbladScherm({
  module,
  setId,
  onTerug,
}: {
  readonly module: Module;
  readonly setId: string;
  readonly onTerug: () => void;
}) {
  const [zaad, setZaad] = useState(() => zaadVan(setId));
  const deel = startbareOnderdelen().find((kandidaat) => kandidaat.setId === setId);
  const blad = deel ? werkbladVoor(deel, zaad) : null;

  // Een adres zonder werkblad (een mix, jouw fouten): terug naar oefenen.
  if (!deel || !blad) {
    return (
      <main className="tk-werkblad">
        <button type="button" className="tk-button" onClick={onTerug}>
          {t('werkblad.terug')}
        </button>
      </main>
    );
  }

  const onderwerp = naamVan(deel);
  const adres = `${window.location.host}${pathFor({ name: 'module', module, setId })}`;

  return (
    <main className="tk-werkblad" data-module={module.id} data-print="ja">
      <div className="tk-werkblad-knoppen">
        <button
          type="button"
          className="tk-button"
          onClick={() => {
            tel('werkblad', pathFor({ name: 'werkblad', module, setId }));
            window.print();
          }}
        >
          {t('werkblad.print')}
        </button>
        <button
          type="button"
          className="tk-button tk-button-secondary"
          onClick={() => setZaad((oud) => oud + 1)}
        >
          {t('werkblad.anders')}
        </button>
        <button type="button" className="tk-button tk-button-tertiary" onClick={onTerug}>
          {t('werkblad.terug')}
        </button>
      </div>

      <article className="tk-werkblad-blad">
        <header className="tk-werkblad-kop">
          <div>
            <p className="tk-werkblad-soort">{t('werkblad.soort')}</p>
            <h1 className="tk-titel">{t('werkblad.kop', { onderwerp })}</h1>
          </div>
          <Wordmark height={28} />
        </header>
        <p className="tk-werkblad-regels">
          <span>{t('werkblad.naam')}: ______________________</span>
          <span>{t('werkblad.datum')}: ____________</span>
        </p>
        <p className="tk-werkblad-opdracht">{t(blad.opdracht)}</p>

        {blad.vragen[0]?.soort === 'plek' ? (
          <div className="tk-werkblad-kaartblok">
            <WerkbladKaart
              setId={setId}
              plekken={blad.vragen.flatMap((vraag) =>
                vraag.soort === 'plek' ? [vraag.geometrieRef] : [],
              )}
            />
            <ol className="tk-werkblad-lijnen">
              {blad.vragen.map((_, index) => (
                <li key={index}>______________________</li>
              ))}
            </ol>
          </div>
        ) : (
          <ol className="tk-werkblad-vragen" data-soort={blad.vragen[0]?.soort}>
            {blad.vragen.map((vraag, index) => (
              <li key={index}>
                <Vraag vraag={vraag} />
              </li>
            ))}
          </ol>
        )}

        <p className="tk-werkblad-voet">{t('werkblad.voet', { adres })}</p>
      </article>

      <article className="tk-werkblad-blad tk-werkblad-antwoorden">
        <h2 className="tk-sectie">
          {t('werkblad.antwoorden')} · {onderwerp}
        </h2>
        <ol className="tk-werkblad-antwoordlijst">
          {blad.vragen.map((vraag, index) => (
            <li key={index}>{vraag.antwoord}</li>
          ))}
        </ol>
      </article>
    </main>
  );
}

function Vraag({ vraag }: { readonly vraag: WerkbladVraag }) {
  if (vraag.soort === 'som') return <span className="tk-werkblad-som">{vraag.tekst}</span>;
  if (vraag.soort === 'klok') {
    return (
      <span className="tk-werkblad-figuur">
        <KlokFace item={vraag.klok} />
        <span>______ : ______</span>
      </span>
    );
  }
  if (vraag.soort === 'vlag') {
    return (
      <span className="tk-werkblad-figuur">
        <Vlag vlag={vraag.vlag} alt={vraag.vlag.beschrijving} lazy={false} />
        <span>______________</span>
      </span>
    );
  }
  if (vraag.soort === 'zin') {
    return (
      <span>
        {vraag.voor}
        <strong>{vraag.gat}</strong>
        {vraag.na} <span className="tk-hulp">{vraag.hint}</span>
      </span>
    );
  }
  return null;
}
