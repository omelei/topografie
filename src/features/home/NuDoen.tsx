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
 * Hij staat als witte binnenkaart in het koraal welkomstvlak (ADR-252, op elke
 * maat sinds ADR-255): plaat, kop en regel naast elkaar, daaronder bij Maak af
 * de balk, en de knop. Vier kaarten tekenen hem: Welkom terug, Maak af, de
 * geheugencheck en Ga verder. Er waren twee vormen naast het welkomstvlak, een
 * grote en een smalle; die staan sinds ADR-255 nergens meer.
 *
 * Zonder vak (Welkom terug gaat over alles) is er geen plaat.
 */
export function NuDoenKaart({
  moduleId,
  kop,
  regel,
  knop,
  balk,
  onStart,
  onLater,
}: {
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

  return (
    <section className="tk-nudoen tk-nudoen-binnen" data-module={moduleId} aria-labelledby={kopId}>
      <div className="tk-nudoen-kop">
        {plaat}
        <div className="tk-nudoen-tekst">
          <h2 id={kopId} className="tk-nudoen-titel">
            {kop}
          </h2>
          <p className="tk-nudoen-regel">{regel}</p>
        </div>
      </div>
      {balk === undefined ? null : (
        <span aria-hidden="true">
          <ProgressBar value={balk.waarde} showDot={false} label={balk.label} />
        </span>
      )}
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
