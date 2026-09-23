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

/**
 * Waar de link in een herstelmail op uitkomt (ADR-186). De ouderpagina, want
 * daar kwam de ouder vandaan; `App` vangt de link op elk adres op, dus ook als
 * Supabase hem naar de hoofdpagina stuurt omdat dit adres niet op zijn lijst
 * staat (`docs/SUPABASE.md`, stap 4).
 */
function terugNaar(): string {
  return `${window.location.origin}/ouder`;
}

/**
 * De twee vormen die een scherm doorgeeft, hier met een naam.
 *
 * Dat is niet alleen netter: `copy.test.ts` zoekt zichtbare tekst met een regex
 * die `=> Promise<…>` in een `.tsx` aanziet voor tekst tussen twee tags. Door
 * deze twee hier te noemen, staat die vorm in een `.ts` en blijft die controle
 * onaangeroerd — een guard omzeilen is erger dan een type een naam geven.
 */
export type Aanmeldpoging = (email: string, wachtwoord: string) => Promise<AccountUitkomst>;
export type Uitloggen = () => Promise<void>;
export type Herstelpoging = (email: string) => Promise<AccountUitkomst>;
export type Wachtwoordpoging = (sessie: Sessie, wachtwoord: string) => Promise<AccountUitkomst>;

export interface AccountStand {
  readonly sessie: Sessie | null;
  readonly ingesteld: boolean;
  readonly inloggen: Aanmeldpoging;
  readonly aanmelden: Aanmeldpoging;
  readonly uitloggen: Uitloggen;
  readonly herstel: Herstelpoging;
  readonly nieuwWachtwoord: Wachtwoordpoging;
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

  const herstel = useCallback(async (email: string) => {
    const account = await laadAccount();
    return account.herstel(email, terugNaar());
  }, []);

  const nieuwWachtwoord = useCallback(async (link: Sessie, wachtwoord: string) => {
    const account = await laadAccount();
    return account.nieuwWachtwoord(link, wachtwoord);
  }, []);

  return {
    sessie,
    ingesteld: isIngesteld(),
    inloggen,
    aanmelden,
    uitloggen,
    herstel,
    nieuwWachtwoord,
  };
}
