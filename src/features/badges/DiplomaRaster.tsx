import { DiplomaIcon } from '@/components/Icon';
import { usePremium } from '@/features/premium/usePremium';
import type { Module } from '@/features/shell/modules';
import { t } from '@/i18n';
import { datumVan, useDiplomaDatums } from './datums';
import { afbreekbaar } from './afbreken';
import { Embleem } from './Embleem';
import { useDiplomaStand } from './useDiplomaStand';
import { kaartStandVan, vulling, type KaartStand, type Voortgang } from './voortgang';

export interface DiplomaVak {
  readonly key: string;
  /** Het diploma zoals het in `kindBadges` staat, bijvoorbeeld `diploma-tafel-7`. */
  readonly diplomaId: string;
  /** What is on it: "Tafel van 7", "Europa". */
  readonly titel: string;
  /** The whole sentence a screen reader hears: which one, and whether it is held. */
  readonly label: string;
  readonly gehaald: boolean;
  /** Where pressing it chooses it. Absent where the wall is only shown. */
  readonly onKies?: (() => void) | undefined;
}

/**
 * Een raster diploma's met de gaten zichtbaar (ADR-064, ADR-104, ADR-112).
 *
 * Eén kaart per diploma, in de vorm die elke kaart in de app heeft: het
 * embleem, de naam op de maat van een knop, en eronder hoe het ervoor staat —
 * in woorden, zodat "nog niet" nooit alleen een tint is.
 *
 * **Sinds het diploma het hele beloningsprogramma is, loopt het embleem mee.**
 * De rand is een boog die dichtloopt naarmate dit kind meer van de set
 * onthoudt, en dat is hetzelfde getal als de lat die de toets aanbiedt — geen
 * tweede boekhouding, maar `countMastered` nog een keer bekeken. De vijf
 * standen en hun zinnen staan in `voortgang.ts`.
 *
 * **Indrukken doet op elke kaart hetzelfde, maar de twee plekken verschillen.**
 * In de kast op Jij opent elke kaart het diploma groot (`onOpen`), gehaald of
 * niet: één regel, geen uitzondering. Op een modulepagina blijft een gat een
 * ingang (`onKies`), want dát is de pagina waar je komt om te oefenen.
 *
 * **Zonder code geen voortgang** (ADR-192). De ring blijft leeg en er staat
 * geen telling onder: hoe ver een kind is, is premium. Wat wel blijft: gehaald
 * is gehaald, en een diploma dat klaar is voor de toets zegt dat — met erbij
 * dat die toets bij premium hoort. Dat is het moment waarop een kind het aan
 * zijn ouders vraagt.
 */
export function DiplomaRaster({
  module,
  vakken,
  onOpen,
}: {
  readonly module: Module['id'];
  readonly vakken: readonly DiplomaVak[];
  /** De kast: elke kaart opent het diploma groot. */
  readonly onOpen?: ((vak: DiplomaVak) => void) | undefined;
}) {
  const { actief } = usePremium();
  const stand = useDiplomaStand();
  const datums = useDiplomaDatums();

  return (
    <ul className="tk-diplomas">
      {vakken.map((vak) => {
        const voortgang = stand?.voortgang(vak.diplomaId) ?? null;
        const kaartStand = kaartStandVan(vak.gehaald, voortgang);
        const behaaldOp = datums.get(vak.diplomaId);
        const zin = actief
          ? zinVan(kaartStand, voortgang, behaaldOp)
          : zonderCode(kaartStand, behaaldOp);
        const label = [vak.label, kaartStand === 'gehaald' ? null : zin]
          .filter((deel): deel is string => deel !== null && deel !== '')
          .join('. ');

        const inhoud = (
          <>
            <Embleem
              icon={DiplomaIcon}
              module={module}
              gehaald={vak.gehaald}
              vul={voortgang && actief ? vulling(voortgang) : undefined}
            />
            <span className="tk-diploma-titel" aria-hidden="true">
              {afbreekbaar(vak.titel)}
            </span>
            <span className="tk-diploma-stand" aria-hidden="true" data-stand={kaartStand}>
              {zin}
            </span>
          </>
        );

        if (onOpen) {
          return (
            <li key={vak.key}>
              <button
                type="button"
                className="tk-diploma"
                data-gehaald={vak.gehaald ? 'ja' : undefined}
                aria-label={t('diploma.openLabel', { naam: vak.titel })}
                onClick={() => {
                  onOpen(vak);
                }}
              >
                {inhoud}
              </button>
            </li>
          );
        }

        return (
          <li key={vak.key}>
            {vak.onKies ? (
              <button
                type="button"
                className="tk-diploma"
                data-gehaald={vak.gehaald ? 'ja' : undefined}
                aria-label={label}
                onClick={vak.onKies}
              >
                {inhoud}
              </button>
            ) : (
              <span
                className="tk-diploma"
                data-gehaald={vak.gehaald ? 'ja' : undefined}
                role="img"
                aria-label={label}
              >
                {inhoud}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * De zin onder een kaart zonder code (ADR-192): gehaald, klaar voor de toets
 * met premium, of nog niet. Geen telling en niets over opfrissen: dat is
 * voortgang.
 */
function zonderCode(stand: KaartStand, behaaldOp: string | undefined): string {
  if (stand === 'gehaald') return zinVan(stand, null, behaaldOp);
  if (stand === 'rijp') return t('diploma.rijpMetPremium');
  return t('diploma.nogNiet');
}

/** De zin onder een kaart. Nooit een telling die nul is. */
function zinVan(
  stand: KaartStand,
  voortgang: Voortgang | null,
  behaaldOp: string | undefined,
): string {
  switch (stand) {
    case 'gehaald':
      return behaaldOp
        ? t('diploma.gehaaldOp', { datum: datumVan(behaaldOp) })
        : t('diploma.gehaald');
    case 'rijp':
      return t('diploma.rijp');
    case 'opfrissen':
      return t('diploma.opfrissen');
    case 'nietsNog':
      // Kort, want dit staat op elke kaart die nog op nul staat. De regel zelf
      // staat één keer boven het raster; twaalf keer dezelfde zin onder elkaar
      // is een muur waarin de kaarten verdwijnen.
      return t('diploma.nogNiet');
    case 'bezig':
      return voortgang
        ? t('diploma.onthoudt', { bewezen: voortgang.bewezen, totaal: voortgang.totaal })
        : t('diploma.nogNiet');
  }
}
