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
  // Een klassenset (ADR-212): 30 verschillende bladen, zodat buren niet van
  // elkaar kunnen overschrijven, met de antwoorden achteraan.
  const [klas, setKlas] = useState(false);
  const deel = startbareOnderdelen().find((kandidaat) => kandidaat.setId === setId);
  const bladen = deel
    ? Array.from({ length: klas ? KLASSENSET : 1 }, (_, index) => werkbladVoor(deel, zaad + index))
    : [];

  // Een adres zonder werkblad (een mix, jouw fouten): terug naar oefenen.
  if (!deel || bladen.length === 0 || bladen.some((blad) => blad === null)) {
    return (
      <main className="tk-werkblad">
        <button type="button" className="tk-button" onClick={onTerug}>
          {t('werkblad.terug')}
        </button>
      </main>
    );
  }

  const onderwerp = naamVan(deel);
  const onderwerpPad = pathFor({ name: 'module', module, setId });
  const adres = `${window.location.host}${onderwerpPad}`;
  const qr = `${import.meta.env.BASE_URL}qr${onderwerpPad}.svg`.replace(/\/{2,}/g, '/');

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
          onClick={() => setZaad((oud) => oud + (klas ? KLASSENSET : 1))}
        >
          {t('werkblad.anders')}
        </button>
        <button
          type="button"
          className="tk-button tk-button-secondary"
          aria-pressed={klas}
          onClick={() => setKlas((oud) => !oud)}
        >
          {t('werkblad.klassenset', { aantal: KLASSENSET })}
        </button>
        <button type="button" className="tk-button tk-button-tertiary" onClick={onTerug}>
          {t('werkblad.terug')}
        </button>
      </div>

      {bladen.map((blad, index) =>
        blad === null ? null : (
          <article key={index} className="tk-werkblad-blad">
            <header className="tk-werkblad-kop">
              <div>
                <p className="tk-werkblad-soort">
                  {klas ? t('werkblad.soortNummer', { nummer: index + 1 }) : t('werkblad.soort')}
                </p>
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
                  {blad.vragen.map((_, vraagIndex) => (
                    <li key={vraagIndex}>______________________</li>
                  ))}
                </ol>
              </div>
            ) : (
              <ol className="tk-werkblad-vragen" data-soort={blad.vragen[0]?.soort}>
                {blad.vragen.map((vraag, vraagIndex) => (
                  <li key={vraagIndex}>
                    <Vraag vraag={vraag} />
                  </li>
                ))}
              </ol>
            )}

            {/* Wie de code scant, oefent hetzelfde onderwerp verder (ADR-212). */}
            <footer className="tk-werkblad-voet">
              <img className="tk-werkblad-qr" src={qr} alt="" width={72} height={72} />
              <span>{t('werkblad.voet', { adres })}</span>
            </footer>
          </article>
        ),
      )}

      <article className="tk-werkblad-blad tk-werkblad-antwoorden">
        <h2 className="tk-sectie">
          {t('werkblad.antwoorden')} · {onderwerp}
        </h2>
        {bladen.map((blad, index) =>
          blad === null ? null : (
            <section key={index} className="tk-werkblad-antwoordblok">
              {klas ? (
                <h3 className="tk-werkblad-opdracht">
                  {t('werkblad.soortNummer', { nummer: index + 1 })}
                </h3>
              ) : null}
              <ol className="tk-werkblad-antwoordlijst">
                {blad.vragen.map((vraag, vraagIndex) => (
                  <li key={vraagIndex}>{vraag.antwoord}</li>
                ))}
              </ol>
            </section>
          ),
        )}
      </article>
    </main>
  );
}

/** Een klas is ongeveer dertig kinderen. */
const KLASSENSET = 30;

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
