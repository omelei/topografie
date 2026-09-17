import { DiplomaIcon, StampIcon } from '@/components/Icon';
import type { Module } from '@/features/shell/modules';
import { t, type TranslationKey } from '@/i18n';
import { Embleem } from './Embleem';
import { useDiplomaStand } from './useDiplomaStand';

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
 * A wall of diplomas with the gaps showing (ADR-064, ADR-104, ADR-112).
 *
 * One card per diploma, in the shape every card in the app has: the emblem, the
 * name at a button's size, and under it where it stands — in words, so "nog
 * niet" is never a tint alone. On a module page each card is a way in: pressing
 * a gap chooses that table or that werelddeel and the diploma with it. On the
 * child's own page the same cards are only shown.
 *
 * **Since ADR-149 a diploma is where keeping up begins.** A card that is not
 * held yet says when its page is ready to sit it: "klaar om af te zwemmen". A
 * held one carries four small squares, one per season of this school year, and
 * each season in which the page was still ripe has a stamp in it.
 */
export function DiplomaRaster({
  module,
  vakken,
}: {
  readonly module: Module['id'];
  readonly vakken: readonly DiplomaVak[];
}) {
  const stand = useDiplomaStand();

  return (
    <ul className="tk-diplomas">
      {vakken.map((vak) => {
        const rijp = !vak.gehaald && (stand?.rijp(vak.diplomaId) ?? false);
        const seizoenen = vak.gehaald && stand ? stand.seizoenen(vak.diplomaId) : [];
        const stempels = seizoenen.filter((s) => s.stempel).length;
        const label = [
          vak.label,
          rijp ? t('diploma.rijp') : null,
          vak.gehaald && stempels > 0 ? t('diploma.bijgehouden', { aantal: stempels }) : null,
        ]
          .filter((deel): deel is string => deel !== null)
          .join('. ');

        const inhoud = (
          <>
            <Embleem icon={DiplomaIcon} module={module} gehaald={vak.gehaald} />
            <span className="tk-diploma-titel" aria-hidden="true">
              {vak.titel}
            </span>
            <span className="tk-diploma-stand" aria-hidden="true" data-rijp={rijp ? 'ja' : undefined}>
              {vak.gehaald ? t('diploma.gehaald') : rijp ? t('diploma.rijp') : t('diploma.nogNiet')}
            </span>
            {seizoenen.length > 0 ? (
              <span className="tk-diploma-seizoenen" aria-hidden="true">
                {seizoenen.map(({ seizoen, stempel }) => (
                  <span
                    key={seizoen}
                    className="tk-diploma-seizoen"
                    data-stempel={stempel ? 'ja' : undefined}
                    title={t(`seizoen.${seizoen}` as TranslationKey)}
                  >
                    {stempel ? <StampIcon size={14} /> : null}
                  </span>
                ))}
              </span>
            ) : null}
          </>
        );

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
