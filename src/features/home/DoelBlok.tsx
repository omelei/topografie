import { useEffect, useState, type ReactNode } from 'react';
import { Button } from '@/components/Button';
import { ProgressBar } from '@/components/ProgressBar';
import { NextIcon } from '@/components/Icon';
import type { ItemState, ModeId } from '@/game-core';
import {
  naamVan,
  startbareOnderdelen,
  type Gespeeld,
  type Onderdeel,
} from '@/features/module/onderdelen';
import { usePremium } from '@/features/premium/usePremium';
import { MODULE_ICON } from '@/features/shell/moduleIcons';
import { t } from '@/i18n';
import { loadItemStates } from '@/store/progress';
import { loadStamps } from '@/store/rewardStore';
import { leesDoel, schrijfDoel } from '@/store/doelStore';
import { doelwitMet, doelwitten, standVan, suggesties, type Doelwit, type Suggestie } from './doel';
import { vormVoor } from './useVandaag';

/**
 * "Waar je voor gaat": het doel dat het kind zelf koos (ADR-141).
 *
 * Het blok eronder zegt wat er vandaag aan de beurt is. Dit zegt waar dat
 * naartoe gaat, en het is het enige in de app dat het kind zelf heeft gekozen.
 * Dat verschil is het hele punt: een dagplan is van de planning, een doel is van
 * hem.
 *
 * **Drie toestanden, en elk heeft één druk op de knop.** Nog geen doel: drie
 * voorstellen, het dichtstbijzijnde bovenaan. Een doel: hoeveel je ervan
 * onthoudt, en een knop die oefent — of de toets start zodra je er klaar voor
 * bent. Gehaald: dat staat er, en dan de vraag wat nu.
 *
 * **De knop verandert van woord en niet van plek.** "Oefenen" wordt "Doe de
 * toets" zodra `standVan` het rijp noemt. Een tweede knop ernaast die de toets
 * te vroeg aanbiedt zou een kind een poging en een teleurstelling kosten, en dat
 * is duurder dan een dag langer oefenen.
 *
 * **Niets tot het bekend is.** Zoals `VandaagBlok`: een blok dat eerst "nog geen
 * doel" zegt en daarna van gedachten verandert heeft iets verteld wat niet waar
 * was.
 */
export function DoelBlok({
  gespeeld,
  onBegin,
}: {
  readonly gespeeld: readonly Gespeeld[];
  readonly onBegin: (deel: Onderdeel, mode: ModeId) => void;
}) {
  const { actief } = usePremium();
  const [states, setStates] = useState<ReadonlyMap<string, ItemState> | null>(null);
  const [behaald, setBehaald] = useState<ReadonlySet<string> | null>(null);
  const [doel, setDoel] = useState<string | null>(null);
  const [geladen, setGeladen] = useState(false);

  useEffect(() => {
    void (async () => {
      const [standen, stempels, bewaard] = await Promise.all([
        loadItemStates(),
        loadStamps(),
        leesDoel(),
      ]);
      setStates(standen);
      setBehaald(stempels);
      setDoel(bewaard);
      setGeladen(true);
    })();
  }, []);

  if (!geladen || states === null || behaald === null) return null;

  const now = new Date();
  const alle = doelwitten(startbareOnderdelen(), actief);
  const gekozen = doelwitMet(alle, doel);

  function kies(id: string) {
    setDoel(id);
    void schrijfDoel(id);
  }

  function laatLos() {
    setDoel(null);
    void schrijfDoel(null);
  }

  // Gehaald. Het uitslagscherm heeft het al gevierd op het moment zelf; hier
  // staat de vraag die daar niet thuishoort, want een nieuw doel kiezen is iets
  // voor de voordeur en niet voor het eind van een ronde.
  if (gekozen !== null && behaald.has(gekozen.id)) {
    return (
      <Kader>
        <p className="text-lopend">{t('doel.gehaald', { naam: naamVan(gekozen.deel) })}</p>
        <Kiezer vraag={t('doel.nu')} lijst={suggesties(alle, behaald, states, now)} onKies={kies} />
        <button type="button" className="tk-doel-ander" onClick={laatLos}>
          {t('doel.later')}
        </button>
      </Kader>
    );
  }

  if (gekozen !== null) {
    const stand = standVan(gekozen, states, now);
    const mode = stand.rijp ? gekozen.mode : vormVoor(gekozen.deel, gespeeld);

    return (
      <Kader>
        <div className="flex flex-col gap-2">
          <p className="text-lopend">{t('doel.diplomaVan', { naam: naamVan(gekozen.deel) })}</p>
          <ProgressBar
            value={stand.totaal === 0 ? 0 : stand.onthouden / stand.totaal}
            label={t('doel.balk', { onthouden: stand.onthouden, totaal: stand.totaal })}
          />
          <p className="text-tekst-secundair">
            {stand.rijp
              ? t('doel.rijp')
              : t('doel.onthouden', { onthouden: stand.onthouden, totaal: stand.totaal })}
          </p>
        </div>

        <div className="tk-doel-knoppen">
          <Button onClick={() => onBegin(gekozen.deel, mode)}>
            {stand.rijp ? t('doel.toets') : t('doel.oefenen')}
          </Button>
          <button type="button" className="tk-doel-ander" onClick={laatLos}>
            {t('doel.ander')}
          </button>
        </div>
      </Kader>
    );
  }

  const lijst = suggesties(alle, behaald, states, now);

  // Alles binnen. Dat is een zeldzaam scherm en het verdient een zin in plaats
  // van een leeg blok — en zonder code is het er een die klopt: de twaalf
  // tafels zijn dan echt alles wat er te halen viel.
  if (lijst.length === 0) {
    return (
      <Kader>
        <p className="text-lopend">{t('doel.alles')}</p>
      </Kader>
    );
  }

  return (
    <Kader>
      <Kiezer vraag={t('doel.vraag')} lijst={lijst} onKies={kies} />
    </Kader>
  );
}

/** Het blok zelf: dezelfde vorm als "Vandaag herhalen", een stap lager in toon. */
function Kader({ children }: { readonly children: ReactNode }) {
  return (
    <section className="tk-doel" aria-label={t('doel.titel')}>
      <h2 className="tk-sectie">{t('doel.titel')}</h2>
      {children}
    </section>
  );
}

/**
 * De keuze: drie diploma's, het dichtstbijzijnde bovenaan, elk met hoeveel van
 * die set dit kind al onthoudt. Dat getal is er niet om te scoren maar om te
 * kiezen — "nog twee provincies" is een andere beslissing dan "nog twaalf".
 */
function Kiezer({
  vraag,
  lijst,
  onKies,
}: {
  readonly vraag: string;
  readonly lijst: readonly Suggestie[];
  readonly onKies: (id: string) => void;
}) {
  if (lijst.length === 0) return <p className="text-tekst-secundair">{t('doel.alles')}</p>;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-tekst-secundair">{vraag}</p>
      <ul className="tk-lijst">
        {lijst.map(({ doelwit, stand }) => (
          <li key={doelwit.id}>
            <Rij doelwit={doelwit} onKies={() => onKies(doelwit.id)}>
              {t('doel.rij', { onthouden: stand.onthouden, totaal: stand.totaal })}
            </Rij>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Rij({
  doelwit,
  onKies,
  children,
}: {
  readonly doelwit: Doelwit;
  readonly onKies: () => void;
  readonly children: ReactNode;
}) {
  const ModuleIcon = MODULE_ICON[doelwit.deel.moduleId];

  return (
    <button
      type="button"
      data-module={doelwit.deel.moduleId}
      className="tk-lijstrij"
      onClick={onKies}
    >
      <span className="tk-plaat tk-plaat-klein">
        <ModuleIcon size={20} />
      </span>
      <span className="tk-lijstrij-tekst">
        <span className="tk-lijstrij-titel">{naamVan(doelwit.deel)}</span>
        <span className="tk-lijstrij-regel">{children}</span>
      </span>
      <span className="tk-lijstrij-pijl">
        <NextIcon size={20} />
      </span>
    </button>
  );
}
