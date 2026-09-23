import type { TranslationKey } from '@/i18n';
import type { AccountFout } from '@/store/account';

/**
 * Wat een ouder leest bij elke fout van de accountlaag.
 *
 * Eén tabel voor alle schermen die een adres of een wachtwoord vragen. Het
 * stond twee keer, in `AccountBlok` en in `Accountcheck`, en twee kopieën van
 * dezelfde zinnen lopen uit elkaar op de dag dat er een fout bij komt — dat was
 * met ADR-186 precies die dag.
 */
export const ACCOUNT_FOUT: Record<AccountFout, TranslationKey> = {
  leeg: 'account.fout.leeg',
  'geen-email': 'account.fout.geen-email',
  'te-kort': 'account.fout.te-kort',
  onjuist: 'account.fout.onjuist',
  'bestaat-al': 'account.fout.bestaat-al',
  'bevestig-email': 'account.fout.bevestig-email',
  'te-vaak': 'account.fout.te-vaak',
  verlopen: 'account.fout.verlopen',
  zelfde: 'account.fout.zelfde',
  'geen-verbinding': 'account.fout.geen-verbinding',
  'niet-ingesteld': 'account.fout.niet-ingesteld',
};
