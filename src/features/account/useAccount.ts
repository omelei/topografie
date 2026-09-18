/**
 * De sessie van de ouder, voor een scherm (ADR-155).
 *
 * Dezelfde vorm als `usePremium`: een ruwe string uit de opslag als momentopname
 * — React vergelijkt die op identiteit, en een vers object per lezing zou een
 * renderlus zijn — en de handelingen als functies die nooit gooien maar een
 * uitkomst teruggeven.
 *
 * De echte laag wordt pas geladen als er iets gebeurt (`laadAccount`), zodat een
 * kind dat nooit inlogt hem niet downloadt.
 */

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { abonneer, isIngesteld, laadAccount, leesRuw, leesSessie } from '@/store/account';
import type { AccountUitkomst, Sessie } from '@/store/account';

export interface AccountStand {
  readonly sessie: Sessie | null;
  readonly ingesteld: boolean;
  readonly inloggen: (email: string, wachtwoord: string) => Promise<AccountUitkomst>;
  readonly aanmelden: (email: string, wachtwoord: string) => Promise<AccountUitkomst>;
  readonly uitloggen: () => Promise<void>;
}

export function useAccount(): AccountStand {
  const ruw = useSyncExternalStore(abonneer, leesRuw, () => null);
  const sessie = useMemo(() => leesSessie(ruw), [ruw]);

  const inloggen = useCallback(async (email: string, wachtwoord: string) => {
    const account = await laadAccount();
    return account.inloggen(email, wachtwoord);
  }, []);

  const aanmelden = useCallback(async (email: string, wachtwoord: string) => {
    const account = await laadAccount();
    return account.aanmelden(email, wachtwoord);
  }, []);

  const uitloggen = useCallback(async () => {
    const account = await laadAccount();
    await account.uitloggen();
  }, []);

  return { sessie, ingesteld: isIngesteld(), inloggen, aanmelden, uitloggen };
}
