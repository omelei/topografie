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

  // Premium sinds ADR-116, en zonder code sinds ADR-124 helemaal weg in plaats
  // van op slot. ADR-116 liet het blok staan zodat de kolom niet van vorm
  // verandert als er een code komt. Die vormvastheid is één moment waard; het
  // slot stond op élke pagina, naast het tweede slot eronder, bij een reeks van
  // nul — twee keer nee zeggen tegen een kind dat nog niets gedaan heeft. De
  // dagen worden onderhuids wel geteld, dus een code opent een geschiedenis.
  if (!actief) return null;

  // Empty until it is known, for the reason the progress card gives.
  if (reeks === null) return <Blok titel={t('reeks.titel')} bezig />;

  return (
    <Blok titel={t('reeks.titel')}>
      <ReeksGetal dagen={reeks.dagen} />
      <WeekRij dagen={laatsteZevenDagen(reeks.geoefend, reeks.vandaag)} />
      <button type="button" className="tk-blok-knop" onClick={onReeks}>
        <NextIcon size={20} />
        {t('reeks.bekijk')}
      </button>
    </Blok>
  );
}
