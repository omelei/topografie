import { DiplomaIcon } from '@/components/Icon';
import type { Module } from '@/features/shell/modules';
import { t } from '@/i18n';
import { Embleem } from './Embleem';

export interface DiplomaVak {
  readonly key: string;
  /** What is on it: "Tafel van 7", "Europa". */
  readonly titel: string;
  /** The whole sentence a screen reader hears: which one, and whether it is held. */
  readonly label: string;
  readonly gehaald: boolean;
  /** Where pressing it chooses it. Absent where the wall is only shown. */
  readonly onKies?: (() => void) | undefined;
}

/**
 * A wall of diplomas with the gaps showing (ADR-064, ADR-104, ADR-112).
 *
 * One card per diploma, in the shape every card in the app has: the emblem a
 * badge wears, the name at a button's size, and under it whether it is held —
 * in words, so "nog niet" is never a tint alone. On a module page each card is
 * a way in: pressing a gap chooses that table or that werelddeel and the
 * diploma with it. On the child's own page the same cards are only shown.
 */
export function DiplomaRaster({
  module,
  vakken,
}: {
  readonly module: Module['id'];
  readonly vakken: readonly DiplomaVak[];
}) {
  return (
    <ul className="tk-diplomas">
      {vakken.map((vak) => {
        const inhoud = (
          <>
            <Embleem icon={DiplomaIcon} module={module} gehaald={vak.gehaald} />
            <span className="tk-diploma-titel" aria-hidden="true">
              {vak.titel}
            </span>
            <span className="tk-diploma-stand" aria-hidden="true">
              {vak.gehaald ? t('diploma.gehaald') : t('diploma.nogNiet')}
            </span>
          </>
        );

        return (
          <li key={vak.key}>
            {vak.onKies ? (
              <button
                type="button"
                className="tk-diploma"
                data-gehaald={vak.gehaald ? 'ja' : undefined}
                aria-label={vak.label}
                onClick={vak.onKies}
              >
                {inhoud}
              </button>
            ) : (
              <span
                className="tk-diploma"
                data-gehaald={vak.gehaald ? 'ja' : undefined}
                role="img"
                aria-label={vak.label}
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
