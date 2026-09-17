import { NextIcon } from '@/components/Icon';
import { Blok } from '@/features/home/Blok';
import { t } from '@/i18n';
import { useWeek } from './useWeek';
import { WeekkaartVakjes, WeekStandZin } from './Weekkaart';

/**
 * De weekkaart in de kolom en op de voordeur (ADR-149). Hij stond hier als de
 * reeks: een getal en zeven balken. Nu zijn het zeven vakjes met stempels, een
 * doel en één zin. Gratis, net als de reeks sinds ADR-148: dit is wat een kind
 * deed, en dat ziet een kind.
 */
export function WeekBlok({ onWeek }: { readonly onWeek: () => void }) {
  const { week } = useWeek();

  if (week === null) return <Blok titel={t('week.titel')} bezig />;

  return (
    <Blok titel={t('week.titel')}>
      <WeekkaartVakjes kaart={week.kaart} />
      <WeekStandZin kaart={week.kaart} />
      <button type="button" className="tk-blok-knop" onClick={onWeek}>
        <NextIcon size={20} />
        {t('week.bekijk')}
      </button>
    </Blok>
  );
}
