import { NextIcon } from '@/components/Icon';
import { laatsteZevenDagen } from '@/game-core';
import { ReeksGetal, WeekRij } from '@/features/reeks/WeekRij';
import { useReeks } from '@/features/reeks/useReeks';
import { usePremium } from '@/features/premium/usePremium';
import { t } from '@/i18n';
import { Blok } from './Blok';

/**
 * Days in a row, and the week behind the number (ADR-110).
 *
 * Between the tests and the progress card: it is the one block in the column
 * about turning up rather than about what was answered. The number is the app
 * bar's — the same `currentStreak`, read against today — and the row under it
 * is the seven days that made it, today last, so a child sees which days count
 * instead of taking the number on trust.
 *
 * It leads to the streak's own page, where the same days are a calendar and the
 * numbers behind them are written out.
 */
export function ReeksBlok({ onReeks }: { readonly onReeks: () => void }) {
  const { actief } = usePremium();
  const reeks = useReeks();

  // **Het getal en de week zijn niet meer premium**, de pagina erachter wel.
  //
  // Dit is dezelfde herziening van ADR-116 als bij de badges, en de grens loopt
  // binnen dit blok: hoeveel dagen op rij is één regel over dit kind, en die
  // hoort het te zien. Wat je koopt is het bijhouden ervan — de kalender, de
  // zes getallen en de week na week, die op de reekspagina staan.
  //
  // ADR-124 haalde dit blok zonder code helemaal weg, om te voorkomen dat er
  // twee sloten onder elkaar in dezelfde kolom stonden. Dat bezwaar vervalt met
  // het slot: er staat nu gewoon wat er is.

  // Empty until it is known, for the reason the progress card gives.
  if (reeks === null) return <Blok titel={t('reeks.titel')} bezig />;

  return (
    <Blok titel={t('reeks.titel')}>
      <ReeksGetal dagen={reeks.dagen} />
      <WeekRij dagen={laatsteZevenDagen(reeks.geoefend, reeks.vandaag)} />
      {/* De pagina erachter is wél premium: daar staan de kalender en de zes
          getallen, en dat is het bijhouden waarvoor betaald wordt. Zonder code
          staat de knop er niet, in plaats van dat hij op een slot uitkomt. */}
      {actief ? (
        <button type="button" className="tk-blok-knop" onClick={onReeks}>
          <NextIcon size={20} />
          {t('reeks.bekijk')}
        </button>
      ) : null}
    </Blok>
  );
}
