import { useEffect, useMemo, useState } from 'react';
import type { ModeId } from '@/game-core';
import { doelwitten, type Doelwit } from '@/features/home/doel';
import { naamVan, startbareOnderdelen, type Onderdeel } from '@/features/module/onderdelen';
import { usePremium } from '@/features/premium/usePremium';
import { MODULES, type Module } from '@/features/shell/modules';
import { t, type TranslationKey } from '@/i18n';
import { getActiveChild } from '@/store/children';
import { loadPlayedRounds } from '@/store/progress';
import { datumVan, useDiplomaDatums } from './datums';
import { DiplomaDialoog } from './DiplomaDialoog';
import { DiplomaRaster, type DiplomaVak } from './DiplomaRaster';
import { useDiplomaStand } from './useDiplomaStand';
import { kaartStandVan, vulling, type KaartStand, type Voortgang } from './voortgang';

const SOORT: Readonly<Record<ModeId, TranslationKey>> = {
  tafeldiploma: 'diploma.soortTafel',
  'vlag-diploma': 'diploma.soortVlag',
  'klok-diploma': 'diploma.soortKlok',
  'topo-diploma': 'diploma.soortTopo',
} as Readonly<Record<ModeId, TranslationKey>>;

/**
 * De diplomakast op Jij: alle diploma's die dit kind kan halen.
 *
 * **Waarom het hele raster hier staat en niet bij de ouder.** ADR-158 zette het
 * bij de ouder met de redenering dat een diploma een toets is, dus hoort bij
 * wie hem afneemt. Die hield zolang het diploma náást de toren stond; zodra het
 * diploma zelf de beloning is keert hij om, en geldt weer wat ADR-064 schreef:
 * een gat is de enige onverdiende zaak die dit product met opzet tekent, omdat
 * een kind erop kan mikken.
 *
 * **Eén vak open, de rest als regel.** Het bezwaar van ADR-158 ging over
 * stapelen — "vier lege wanden met een kop erboven" — en niet over een
 * onverdiend vakje. Dus staat er één vak open, standaard dat van de laatste
 * ronde, en de andere als regels die opengaan als je erop drukt. Voor een kind
 * zonder code verandert dat niets: dat heeft maar één vak, want de andere drie
 * zijn premium.
 *
 * **En nergens een telling die nul is.** Een kop die de afwezigheid uitrekent,
 * is wat "je hebt niets" letterlijk op het scherm zet. Bij nul staat er de
 * uitnodiging.
 *
 * De kast bouwt zichzelf uit `doelwitten()` en niet uit de vier wandcomponenten
 * van de modulepagina's: die geven een verzameling ids terug, en hier is per
 * diploma het onderdeel en de ronde nodig — anders kan de knop in het grote
 * beeld niet naar de toets die erbij hoort.
 */
export function Kast({
  onOefen,
  onToets,
}: {
  /** Naar dat vak, met de set gekozen. */
  readonly onOefen: (deel: Onderdeel) => void;
  /** Naar afzwemmen: de toets die bij dit diploma hoort. */
  readonly onToets: (deel: Onderdeel, mode: ModeId) => void;
}) {
  const { actief: premium } = usePremium();
  const stand = useDiplomaStand();
  const datums = useDiplomaDatums();
  const laatsteVak = useLaatsteVak();
  const [open, setOpen] = useState<Module['id'] | null>(null);
  const [gekozen, setGekozen] = useState<Doelwit | null>(null);
  const [kindNaam, setKindNaam] = useState('');

  useEffect(() => {
    let levend = true;
    void getActiveChild().then((kind) => {
      if (levend) setKindNaam(kind?.naam ?? '');
    });
    return () => {
      levend = false;
    };
  }, []);

  const vakken = useMemo(() => {
    const alle = doelwitten(startbareOnderdelen(), premium);
    return MODULES.map((module) => ({
      module,
      doelen: alle.filter((doelwit) => doelwit.deel.moduleId === module.id),
    })).filter((rij) => rij.doelen.length > 0);
  }, [premium]);

  const gehaaldTotaal = vakken.reduce(
    (som, rij) => som + rij.doelen.filter((doelwit) => datums.has(doelwit.id)).length,
    0,
  );
  const alleTotaal = vakken.reduce((som, rij) => som + rij.doelen.length, 0);

  // Het vak van je laatste ronde staat open. Zonder ronde: tafels, want dat is
  // het enige vak dat zonder code diploma's heeft, en het is het diploma dat een
  // Nederlands kind al wil voordat het deze app kent (ADR-122).
  const heeftTafels = vakken.some((rij) => rij.module.id === 'tafels');
  const openVak = open ?? laatsteVak ?? (heeftTafels ? 'tafels' : (vakken[0]?.module.id ?? null));

  return (
    <section className="flex flex-col gap-4" aria-label={t('kast.titel')}>
      <div className="flex flex-col gap-1">
        <h2 className="tk-sectie">{t('kast.titel')}</h2>
        <p className="text-lopend text-tekst-secundair">
          {gehaaldTotaal === 0
            ? t('kast.leeg')
            : t('kast.stand', { aantal: gehaaldTotaal, totaal: alleTotaal })}
        </p>
        {/* De regel, één keer. Op elke kaart zou het twaalf keer dezelfde zin
            zijn, en dan leest niemand hem meer. */}
        <p className="tk-hulp">{t('kast.regel')}</p>
      </div>

      {vakken.map(({ module, doelen }) => {
        const naam = t(module.name);
        if (module.id !== openVak) {
          return (
            <button
              key={module.id}
              type="button"
              className="tk-vakrij"
              aria-expanded={false}
              onClick={() => setOpen(module.id)}
            >
              <span className="tk-vakrij-naam">{naam}</span>
              <span className="tk-vakrij-meta">
                {t('kast.vakAantal', { aantal: doelen.length })}
              </span>
            </button>
          );
        }

        const gehaald = doelen.filter((doelwit) => datums.has(doelwit.id)).length;
        return (
          <section key={module.id} className="flex flex-col gap-3" aria-label={naam}>
            <div className="tk-sectie">
              <h3>{naam}</h3>
              {gehaald > 0 ? (
                <span className="tk-sectie-meta">
                  {t('kast.stand', { aantal: gehaald, totaal: doelen.length })}
                </span>
              ) : null}
            </div>
            <DiplomaRaster
              module={module.id}
              vakken={doelen.map((doelwit) => vakVan(doelwit, datums))}
              onOpen={(vak) => {
                const doelwit = doelen.find((kandidaat) => kandidaat.id === vak.diplomaId);
                if (doelwit) setGekozen(doelwit);
              }}
            />
          </section>
        );
      })}

      {gekozen ? (
        <Venster
          doelwit={gekozen}
          voortgang={stand?.voortgang(gekozen.id) ?? null}
          behaaldOp={datums.get(gekozen.id)}
          kindNaam={kindNaam}
          onOefen={onOefen}
          onToets={onToets}
          onSluit={() => setGekozen(null)}
        />
      ) : null}
    </section>
  );
}

function vakVan(doelwit: Doelwit, datums: ReadonlyMap<string, string>): DiplomaVak {
  const titel = naamVan(doelwit.deel);
  return {
    key: doelwit.id,
    diplomaId: doelwit.id,
    titel,
    label: titel,
    gehaald: datums.has(doelwit.id),
  };
}

function Venster({
  doelwit,
  voortgang,
  behaaldOp,
  kindNaam,
  onOefen,
  onToets,
  onSluit,
}: {
  readonly doelwit: Doelwit;
  readonly voortgang: Voortgang | null;
  readonly behaaldOp: string | undefined;
  readonly kindNaam: string;
  readonly onOefen: (deel: Onderdeel) => void;
  readonly onToets: (deel: Onderdeel, mode: ModeId) => void;
  readonly onSluit: () => void;
}) {
  const gehaald = behaaldOp !== undefined;
  const kaartStand: KaartStand = kaartStandVan(gehaald, voortgang);
  const naam = naamVan(doelwit.deel);
  const soortSleutel = SOORT[doelwit.mode];

  return (
    <DiplomaDialoog
      titel={t('diploma.openLabel', { naam })}
      onSluit={onSluit}
      beeld={{
        module: doelwit.deel.moduleId,
        soort: soortSleutel ? t(soortSleutel) : '',
        naam,
        gehaald,
        kindNaam,
        datum: behaaldOp ? datumVan(behaaldOp) : null,
        vul: voortgang ? vulling(voortgang) : undefined,
        standZin: gehaald ? null : standZinVan(kaartStand, voortgang),
      }}
      knop={
        gehaald ? (
          <button type="button" className="tk-button" onClick={() => window.print()}>
            {t('afzwemmen.print')}
          </button>
        ) : kaartStand === 'rijp' ? (
          <button
            type="button"
            className="tk-button"
            onClick={() => onToets(doelwit.deel, doelwit.mode)}
          >
            {t('diploma.toets')}
          </button>
        ) : (
          <button type="button" className="tk-button" onClick={() => onOefen(doelwit.deel)}>
            {t('diploma.oefen')}
          </button>
        )
      }
    />
  );
}

function standZinVan(stand: KaartStand, voortgang: Voortgang | null): string {
  if (stand === 'rijp') return t('diploma.rijp');
  if (stand === 'opfrissen') return t('diploma.opfrissen');
  if (stand === 'nietsNog' || voortgang === null) return t('diploma.nogNiets');
  return t('diploma.onthoudt', { bewezen: voortgang.bewezen, totaal: voortgang.totaal });
}

/** Het vak van de laatste afgemaakte ronde, of null. */
function useLaatsteVak(): Module['id'] | null {
  const [vak, setVak] = useState<Module['id'] | null>(null);

  useEffect(() => {
    let levend = true;
    void loadPlayedRounds().then((rondes) => {
      if (!levend) return;
      const delen = startbareOnderdelen();
      for (const ronde of rondes) {
        const deel = delen.find((kandidaat) => kandidaat.setId === ronde.setId);
        if (deel) {
          setVak(deel.moduleId);
          return;
        }
      }
    });
    return () => {
      levend = false;
    };
  }, []);

  return vak;
}
