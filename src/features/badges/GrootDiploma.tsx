import type { ComponentType } from 'react';
import { Brandmark } from '@/components/Brandmark';
import {
  CorrectIcon,
  DiplomaIcon,
  FlagIcon,
  GatIcon,
  GlobeIcon,
  HalfUurIcon,
  KeerIcon,
  PinIcon,
  StarIcon,
  TafelIcon,
  UurIcon,
  VormenIcon,
  type IconProps,
} from '@/components/Icon';
import { Wordmark } from '@/components/Wordmark';
import { taalDeelVan } from '@/content/loadTaal';
import type { TaalDeel } from '@/game-core';
import type { Module } from '@/features/shell/modules';
import { t, type TranslationKey } from '@/i18n';
import { Embleem } from './Embleem';

export interface DiplomaBeeld {
  readonly module: Module['id'];
  /** De set, voor de zin over wat je kunt: bij Taal verschilt die per deel. */
  readonly setId: string;
  /** "Tafeldiploma", "Vlaggendiploma". */
  readonly soort: string;
  /** "Tafel van 7", "Europa". */
  readonly naam: string;
  readonly gehaald: boolean;
  /** De naam van het kind, leeg als die er niet is. */
  readonly kindNaam: string;
  /** Al opgemaakt: "20 september 2026". Alleen bij gehaald. */
  readonly datum: string | null;
  /** De toets waarmee het gehaald werd, als die er net was: "19 van 20 goed". */
  readonly score: { readonly goed: number; readonly totaal: number } | null;
  /** Hoeveel je beheerst, als het nog niet gehaald is en de stand er mag staan. */
  readonly stand: { readonly bewezen: number; readonly totaal: number } | null;
  /** De zin als het diploma nog niet gehaald is. */
  readonly standZin: string | null;
}

type Tekening = ComponentType<Omit<IconProps, 'children'>>;

/** Het patroon op het vlak: twee tekeningen van het vak, om en om. */
const PATROON: Record<Module['id'], readonly [Tekening, Tekening]> = {
  topo: [PinIcon, GlobeIcon],
  tafels: [TafelIcon, KeerIcon],
  klok: [UurIcon, HalfUurIcon],
  vlaggen: [FlagIcon, StarIcon],
  woorden: [GatIcon, VormenIcon],
  tijdvakken: [StarIcon, DiplomaIcon],
};

/** Hoeveel tekeningen het patroon heeft: genoeg voor het brede vlak. */
const TEKENINGEN = 100;

/** Wat je kunt als het diploma gehaald is, per vak. */
const UITLEG: Record<Exclude<Module['id'], 'woorden'>, TranslationKey> = {
  topo: 'diploma.uitleg.topo',
  tafels: 'diploma.uitleg.tafels',
  klok: 'diploma.uitleg.klok',
  vlaggen: 'diploma.uitleg.vlaggen',
  tijdvakken: 'diploma.uitleg.tijdvakken',
};

/** En bij Taal per deel: spelling, werkwoorden of Engels. */
const UITLEG_TAAL: Record<TaalDeel, TranslationKey> = {
  spelling: 'diploma.uitleg.spelling',
  werkwoorden: 'diploma.uitleg.werkwoorden',
  engels: 'diploma.uitleg.engels',
};

function uitlegVan(beeld: DiplomaBeeld): string {
  if (beeld.module === 'woorden') return t(UITLEG_TAAL[taalDeelVan(beeld.setId) ?? 'spelling']);
  return t(UITLEG[beeld.module]);
}

/**
 * Het diploma, groot — op het scherm en op papier hetzelfde ding (ADR-218).
 *
 * Liggend, als een echt diploma: links een vlak in de kleur van het vak met
 * zijn tekeningen en Denker, rechts van wie het is, waarvoor, wat je kunt en
 * de lijnen voor de datum en een handtekening. Op de naad het zegel. Op een
 * telefoon komt het vlak bovenaan te staan, want 3:2 op 360 pixels breed is
 * te klein om te lezen (`@container` in index.css).
 *
 * Nog niet gehaald is hetzelfde diploma in zand in plaats van kleur, met
 * streepjeslijnen, en in het zegel hoeveel je al beheerst. "Dan kleurt dit
 * diploma in" is dus letterlijk: het is dezelfde kaart.
 *
 * `data-beat` markeert de delen die de uitreiking één voor één binnenhaalt;
 * `aan` zegt welke al binnen zijn. Er staat geen animatie in dit bestand.
 */
export function GrootDiploma({
  beeld,
  aan = () => undefined,
}: {
  readonly beeld: DiplomaBeeld;
  /** Bij de uitreiking: of een beat al binnen is. Elders staat alles er meteen. */
  readonly aan?: (beat: string) => 'ja' | undefined;
}) {
  const [Een, Twee] = PATROON[beeld.module];
  const heeftNaam = beeld.kindNaam !== '';
  const roep = beeld.gehaald
    ? t('diploma.gehaaldKop')
    : beeld.stand && beeld.stand.bewezen > 0
      ? t('diploma.bijna')
      : t('diploma.nogNiet');

  return (
    <div
      className="tk-grootdiploma"
      data-module={beeld.module}
      data-gehaald={beeld.gehaald ? 'ja' : undefined}
      data-print="ja"
    >
      <div className="tk-grootdiploma-kaart">
        <div className="tk-grootdiploma-vlak">
          <span className="tk-grootdiploma-patroon" aria-hidden="true">
            {Array.from({ length: TEKENINGEN }, (_, index) =>
              index % 2 === 0 ? <Een key={index} size={28} /> : <Twee key={index} size={28} />,
            )}
          </span>
          <p className="tk-grootdiploma-soort" data-beat="soort" data-aan={aan('soort')}>
            {beeld.soort}
          </p>
          <span className="tk-grootdiploma-denker">
            <span className="inline-flex" data-beat="denker" data-aan={aan('denker')}>
              <Brandmark size={160} uitdrukking={beeld.gehaald ? 'juichen' : 'zwaaien'} />
            </span>
          </span>
        </div>

        <span className="tk-grootdiploma-zegel" data-beat="ring" data-aan={aan('ring')}>
          {beeld.gehaald || beeld.stand === null ? (
            <Embleem icon={DiplomaIcon} module={beeld.module} gehaald={beeld.gehaald} groot />
          ) : (
            <span className="tk-grootdiploma-teller">
              <span className="tk-grootdiploma-getal">{beeld.stand.bewezen}</span>
              <span>{t('diploma.vanTotaal', { totaal: beeld.stand.totaal })}</span>
            </span>
          )}
        </span>

        <div className="tk-grootdiploma-tekst">
          <div className="tk-grootdiploma-kop">
            <p className="tk-grootdiploma-roep">{roep}</p>
            <Wordmark className="tk-grootdiploma-merk" />
          </div>

          {heeftNaam ? (
            <div className="tk-grootdiploma-wie" data-beat="wie" data-aan={aan('wie')}>
              <p className="tk-grootdiploma-van">
                {beeld.gehaald ? t('diploma.isVan') : t('diploma.wordtVan')}
              </p>
              <p className="tk-grootdiploma-kind">{beeld.kindNaam}</p>
            </div>
          ) : null}

          <p className="tk-grootdiploma-naam" data-beat="naam" data-aan={aan('naam')}>
            {beeld.naam}
          </p>
          <p className="tk-grootdiploma-zin">
            {beeld.gehaald ? uitlegVan(beeld) : (beeld.standZin ?? '')}
          </p>

          {beeld.gehaald && beeld.score !== null ? (
            <p className="tk-grootdiploma-pil">
              <CorrectIcon size={18} />
              {t('diploma.score', beeld.score)}
            </p>
          ) : null}
          {!beeld.gehaald && beeld.stand !== null && beeld.stand.bewezen > 0 ? (
            <p className="tk-grootdiploma-pil">
              <CorrectIcon size={18} />
              {t('diploma.beheers', beeld.stand)}
            </p>
          ) : null}

          <div className="tk-grootdiploma-voet">
            <p className="tk-grootdiploma-lijn">
              <span className="tk-grootdiploma-invul">{beeld.gehaald ? beeld.datum : null}</span>
              <span>{t('diploma.datum')}</span>
            </p>
            <p className="tk-grootdiploma-lijn">
              <span className="tk-grootdiploma-invul" />
              <span>{t('diploma.handtekening')}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
