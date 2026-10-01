import { useId } from 'react';
import { NextIcon } from '@/components/Icon';
import { ProgressBar } from '@/components/ProgressBar';
import { MODULE_ICON } from '@/features/shell/moduleIcons';
import type { Module } from '@/features/shell/modules';
import { t } from '@/i18n';

/**
 * De kaart van Nu doen (ADR-250): een kop, één regel, en één knop over de
 * hele breedte. Het is de enige koraal knop op Vandaag.
 *
 * Twee vormen, uit het ontwerp "Vandaag varianten". De grote kaart, met de
 * plaat naast de kop, voor Maak af, Welkom terug en de geheugencheck; die
 * hebben een regel die iets uitlegt. De smalle, met de plaat naast kop en
 * regel samen, voor Ga verder: daar is de regel alleen de spelvorm.
 *
 * Zonder vak (Welkom terug gaat over alles) is er geen plaat, en draagt de
 * kaart de lichte lijn en de onderkant in nacht, zoals elke kaart buiten een
 * vak.
 */
export function NuDoenKaart({
  vorm = 'groot',
  moduleId,
  kop,
  regel,
  knop,
  balk,
  onStart,
  onLater,
}: {
  readonly vorm?: 'groot' | 'smal';
  readonly moduleId?: Module['id'] | undefined;
  readonly kop: string;
  readonly regel: string;
  readonly knop: string;
  /** Hoe ver een ronde is, als balk: alleen bij Maak af. */
  readonly balk?: { readonly waarde: number; readonly label: string } | undefined;
  readonly onStart: () => void;
  /** Alleen bij Welkom terug: dan wordt de volgende kaart Nu doen. */
  readonly onLater?: (() => void) | undefined;
}) {
  const kopId = useId();
  const ModuleIcon = moduleId === undefined ? null : MODULE_ICON[moduleId];
  const plaat =
    ModuleIcon === null ? null : (
      <span className="tk-plaat tk-plaat-groot" aria-hidden="true">
        <ModuleIcon size={24} />
      </span>
    );
  const startknop = (
    <button type="button" className="tk-button tk-nudoen-knop" onClick={onStart}>
      {knop}
      <NextIcon size={20} />
    </button>
  );

  if (vorm === 'smal') {
    return (
      <section className="tk-nudoen tk-nudoen-smal" data-module={moduleId} aria-labelledby={kopId}>
        {plaat}
        <div className="tk-nudoen-tekst">
          <h2 id={kopId} className="tk-nudoen-titel">
            {kop}
          </h2>
          <p className="tk-hulp">{regel}</p>
        </div>
        {startknop}
      </section>
    );
  }

  return (
    <section className="tk-nudoen" data-module={moduleId} aria-labelledby={kopId}>
      <div className="tk-nudoen-kop">
        {plaat}
        <h2 id={kopId} className="tk-nudoen-titel">
          {kop}
        </h2>
      </div>
      <div className="tk-nudoen-tekst">
        <p className="text-lopend text-tekst-secundair">{regel}</p>
        {balk === undefined ? null : (
          // De balk is versiering: de regel erboven zegt hetzelfde in woorden.
          <span aria-hidden="true">
            <ProgressBar value={balk.waarde} showDot={false} label={balk.label} />
          </span>
        )}
      </div>
      {startknop}
      {onLater === undefined ? null : (
        <button
          type="button"
          className="tk-button tk-button-tertiary tk-nudoen-later"
          onClick={onLater}
        >
          {t('home.nu.later')}
        </button>
      )}
    </section>
  );
}
