import { useEffect, useState } from 'react';
import { diagnose, duiding, type Duiding } from './afhaken';
import { loadDiagnoseRondes, type KindRondes } from '@/store/diagnose';

/**
 * Waar haken ze af? (ADR-128)
 *
 * Geen productscherm. Het staat achter `#diagnose`, het staat in geen enkel
 * menu, en een kind komt er niet. Het is een meetinstrument voor de eigenaar,
 * en het bestaat omdat dit product met opzet geen analytics heeft: zonder iets
 * als dit is de vraag "waarom stoppen ze?" alleen te beantwoorden met een
 * onderbuikgevoel.
 *
 * Anders dan de componentengalerij gaat dit wél mee in de build, en dat is de
 * hele reden dat het bestaat: de kinderen oefenen op de echte app, en daar
 * staat hun geschiedenis. Een instrument dat alleen in `npm run dev` draait
 * meet een leeg apparaat.
 *
 * Er gaat niets weg. Het leest IndexedDB van dit apparaat en schrijft niets,
 * verstuurt niets en onthoudt niets.
 */

const ZIN: Readonly<Record<Duiding, string>> = {
  weinig: 'Nog te weinig rondes om iets te durven zeggen.',
  gaatGoed: 'Er wordt weinig afgebroken. Het afhaken zit niet in de ronde.',
  teMoeilijk: 'Het gaat vlak voor het stoppen vaker mis dan gemiddeld: te moeilijk, niet te lang.',
  teLang: 'Ze stoppen terwijl het goed gaat: de ronde vraagt meer dan ze te geven hebben.',
  onduidelijk: 'Er wordt afgebroken, maar de cijfers wijzen niet één kant op.',
};

function procent(deel: number | null): string {
  return deel === null ? '—' : `${Math.round(deel * 100)}%`;
}

function getal(waarde: number | null, achter = ''): string {
  return waarde === null ? '—' : `${Math.round(waarde)}${achter}`;
}

function seconden(ms: number | null): string {
  return ms === null ? '—' : `${(ms / 1000).toFixed(1)} s`;
}

export function DiagnoseScherm() {
  const [kinderen, setKinderen] = useState<readonly KindRondes[] | null>(null);

  useEffect(() => {
    void loadDiagnoseRondes().then(setKinderen);
  }, []);

  return (
    <div className="tk-page">
      <div className="tk-page-main">
        <h1 className="tk-titel">{'Waar haken ze af?'}</h1>
        <p className="text-tekst-secundair">
          {'Gerekend over wat er op dit apparaat staat. Er wordt niets verstuurd en niets bewaard.'}
        </p>

        {kinderen === null ? (
          <p aria-busy="true" className="text-tekst-secundair">
            {'Bezig met lezen…'}
          </p>
        ) : kinderen.length === 0 ? (
          <p className="text-tekst-secundair">{'Nog niemand op dit apparaat.'}</p>
        ) : (
          kinderen.map((kind) => <Kind key={kind.kindId} kind={kind} />)
        )}
      </div>
    </div>
  );
}

function Kind({ kind }: { readonly kind: KindRondes }) {
  const uit = diagnose(kind.rondes);
  const oordeel = duiding(uit);

  return (
    <section className="flex flex-col gap-3" aria-label={kind.naam}>
      <h2 className="tk-sectie">{kind.naam}</h2>
      <p className="text-lopend">{ZIN[oordeel]}</p>

      <dl className="tk-cijfers">
        <Tegel label={'Rondes'} waarde={String(uit.rondes)} />
        <Tegel label={'Afgebroken'} waarde={getal(uit.afbreekPercentage, '%')} />
        <Tegel label={'Stopt bij vraag'} waarde={getal(uit.stopBijVraag)} />
        <Tegel label={'Oefendagen'} waarde={String(uit.oefendagen)} />
      </dl>

      <ul className="tk-lijst">
        <Regel
          wat={'Fout vlak voor het stoppen'}
          waarde={procent(uit.foutVoorStop)}
          naast={`tegen ${procent(uit.foutAlgemeen)} over alles`}
        />
        <Regel
          wat={'Tempo vlak voor het stoppen'}
          waarde={seconden(uit.tempoVoorStop)}
          naast={`tegen ${seconden(uit.tempoAlgemeen)} over alles`}
        />
        <Regel
          wat={'Waar het stopt'}
          waarde={uit.stopVerdeling.join(' · ')}
          naast={'begin · midden · eind'}
        />
        <Regel
          wat={'Lengte van een afgemaakte ronde'}
          waarde={getal(uit.lengteAfgemaakt)}
          naast={'vragen'}
        />
        <Regel wat={'Tussen twee oefendagen'} waarde={getal(uit.gatTussenDagen)} naast={'dagen'} />
      </ul>
    </section>
  );
}

function Tegel({ label, waarde }: { readonly label: string; readonly waarde: string }) {
  return (
    <div className="tk-cijfer">
      <dt className="tk-cijfer-label">{label}</dt>
      <dd className="tk-cijfer-getal">{waarde}</dd>
    </div>
  );
}

function Regel({
  wat,
  waarde,
  naast,
}: {
  readonly wat: string;
  readonly waarde: string;
  readonly naast: string;
}) {
  return (
    <li>
      <div className="tk-lijstrij">
        <span className="tk-lijstrij-tekst">
          <span className="tk-lijstrij-titel">{wat}</span>
          <span className="text-tekst-secundair">{naast}</span>
        </span>
        <span className="tk-cijfer-getal">{waarde}</span>
      </div>
    </li>
  );
}
