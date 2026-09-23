import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ModeId } from '@/game-core';
import { doelwitten, type Doelwit } from '@/features/home/doel';
import { naamVan, startbareOnderdelen, type Onderdeel } from '@/features/module/onderdelen';
import { PremiumLabel } from '@/features/module/PremiumLabel';
import { vraagOuders } from '@/features/premium/ouderVraag';
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
  // Zes sinds ADR-168: elk vak heeft een diploma. Wie er een toevoegt, komt
  // hier langs — `DIPLOMA_VORMEN` in `rewards.ts` noemt deze plek.
  'reken-diploma': 'diploma.soortReken',
  'vlag-diploma': 'diploma.soortVlag',
  'klok-diploma': 'diploma.soortKlok',
  'topo-diploma': 'diploma.soortTopo',
  'taal-diploma': 'diploma.soortTaal',
} as Readonly<Record<ModeId, TranslationKey>>;

/**
 * De diplomakast op Jij: alle diploma's die dit kind kan halen.
 *
 * **Waarom het hele raster hier staat en niet bij de ouder.** ADR-158 zette het
 * bij de ouder met de redenering dat een diploma een toets is, dus hoort bij
 * wie hem afneemt. Die hield zolang het diploma naast een ander programma stond; zodra het
 * diploma zelf de beloning is keert hij om, en geldt weer wat ADR-064 schreef:
 * een gat is de enige onverdiende zaak die dit product met opzet tekent, omdat
 * een kind erop kan mikken.
 *
 * **Eén vak open, de rest als regel.** Het bezwaar van ADR-158 ging over
 * stapelen — "vier lege wanden met een kop erboven" — en niet over een
 * onverdiend vakje. Dus staat er één vak open, standaard dat van de laatste
 * ronde, en de andere als regels die opengaan als je erop drukt.
 *
 * **Sinds ADR-192 staat het hele raster er ook zonder code.** ADR-177 zette
 * de vakken zonder code als een regel zonder raster, omdat ADR-116 geen beloning
 * wil tekenen die een kind niet kan krijgen. Sinds geen enkel diploma meer
 * zonder premium te halen is, liet dat een kind zonder code een kast zonder
 * één diploma zien. Nu hangen alle 68 er, en zegt het venster van een diploma
 * dat je het met premium haalt: een ring waar je naar kunt kijken, en de weg
 * om hem te halen.
 *
 * **En nergens een telling die nul is.** Een kop die de afwezigheid uitrekent,
 * is wat "je hebt niets" letterlijk op het scherm zet. Bij nul staat er de
 * uitnodiging.
 *
 * **Bovenaan Jij** (ADR-172), onder de kop en de wisselaar: het diploma is het
 * hele beloningsprogramma (ADR-167), het is het enige blok op Jij met een knop
 * die iets oplevert, en "Bekijk alle diploma's" op Vandaag komt hier uit. De
 * uitleg over hoe je een diploma haalt en de printknop voor het schooljaar
 * staan erin, als `children`: ze gaan over deze diploma's en nergens anders
 * over.
 *
 * De kast bouwt zichzelf uit `doelwitten()` en niet uit de vier wandcomponenten
 * van de modulepagina's: die geven een verzameling ids terug, en hier is per
 * diploma het onderdeel en de ronde nodig — anders kan de knop in het grote
 * beeld niet naar de toets die erbij hoort.
 */
export function Kast({
  onOefen,
  onToets,
  children,
}: {
  /** Naar dat vak, met de set gekozen. */
  readonly onOefen: (deel: Onderdeel) => void;
  /** Naar afzwemmen: de toets die bij dit diploma hoort. */
  readonly onToets: (deel: Onderdeel, mode: ModeId) => void;
  /** Wat onder het raster hoort: de uitleg en het printen (ADR-172). */
  readonly children?: ReactNode;
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
    // Alle diploma's, ook zonder code (ADR-192): halen kan alleen met premium,
    // zien kan iedereen.
    const alle = doelwitten(startbareOnderdelen(), true);
    return MODULES.map((module) => ({
      module,
      doelen: alle.filter((doelwit) => doelwit.deel.moduleId === module.id),
    })).filter((rij) => rij.doelen.length > 0);
  }, []);

  const gehaaldTotaal = vakken.reduce(
    (som, rij) => som + rij.doelen.filter((doelwit) => datums.has(doelwit.id)).length,
    0,
  );
  const alleTotaal = vakken.reduce((som, rij) => som + rij.doelen.length, 0);

  // Het vak van je laatste ronde staat open. Zonder ronde: tafels, want dat is
  // het diploma dat een Nederlands kind al wil voordat het deze app kent
  // (ADR-122).
  const heeftTafels = vakken.some((rij) => rij.module.id === 'tafels');
  const openVak = open ?? laatsteVak ?? (heeftTafels ? 'tafels' : (vakken[0]?.module.id ?? null));

  return (
    <section className="flex flex-col gap-4" aria-label={t('kast.titel')}>
      <div className="flex flex-col gap-1">
        <div className="tk-sectie">
          <h2>{t('kast.titel')}</h2>
          {/* Halen is premium (ADR-192), en de muren op de vakpagina's zeggen
              dat ook in hun kop. */}
          {premium ? null : <PremiumLabel hoorbaar />}
        </div>
        <p className="text-lopend text-tekst-secundair">
          {gehaaldTotaal === 0
            ? t('kast.leeg')
            : t('kast.stand', { aantal: gehaaldTotaal, totaal: alleTotaal })}
        </p>
        {/* De regel die hier stond, staat sinds ADR-177 als stap 2 in "Hoe haal
            je een diploma?" — zie `DiplomaUitleg`. Hij legde één voorwaarde uit
            op de plek waar een kind de stand komt lezen, en de uitleg die de
            vraag wél beantwoordt stond één druk verder. */}
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

      {children}

      {gekozen ? (
        <Venster
          doelwit={gekozen}
          voortgang={stand?.voortgang(gekozen.id) ?? null}
          behaaldOp={datums.get(gekozen.id)}
          kindNaam={kindNaam}
          premium={premium}
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
  premium,
  onOefen,
  onToets,
  onSluit,
}: {
  readonly doelwit: Doelwit;
  readonly voortgang: Voortgang | null;
  readonly behaaldOp: string | undefined;
  readonly kindNaam: string;
  /**
   * Zonder premium geen stand en geen knop naar de toets, maar wat premium hier
   * doet (ADR-192): hoe ver je bent is voortgang, en halen kan alleen met een
   * code.
   */
  readonly premium: boolean;
  readonly onOefen: (deel: Onderdeel) => void;
  readonly onToets: (deel: Onderdeel, mode: ModeId) => void;
  readonly onSluit: () => void;
}) {
  const gehaald = behaaldOp !== undefined;
  const opSlot = !premium && !gehaald;
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
        vul: voortgang && !opSlot ? vulling(voortgang) : undefined,
        standZin: gehaald || opSlot ? null : standZinVan(kaartStand, voortgang),
      }}
      knop={
        opSlot ? (
          <div className="flex flex-col gap-3">
            {/* Klaar voor de toets is het moment om het te vragen (ADR-193).
                Het venster gaat eerst dicht: de vraag aan de ouders is zelf een
                venster, en twee over elkaar is er één te veel. */}
            <p className="flex flex-wrap items-center gap-2 text-tekst-secundair">
              <PremiumLabel hoorbaar />
              {kaartStand === 'rijp' ? t('premium.wat.diplomaKlaar') : t('premium.wat.diploma')}
            </p>
            <button
              type="button"
              className="tk-button tk-button-secondary self-start"
              onClick={() => {
                onSluit();
                vraagOuders(
                  kaartStand === 'rijp'
                    ? { wat: naam, soort: 'klaar' }
                    : { wat: t('wens.diploma', { naam }), soort: 'wil' },
                );
              }}
            >
              {t('premium.vraagKnop')}
            </button>
          </div>
        ) : gehaald ? (
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
