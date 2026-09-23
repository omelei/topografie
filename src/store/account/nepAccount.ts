/**
 * Een account zonder server, voor de tests (ADR-155).
 *
 * Er is geen Supabase-project in CI en er zijn geen sleutels, dus zou zonder dit
 * bestand niets van de accountlaag getest worden — en dat is precies de laag
 * waar een fout geen bug is maar een lek. Het houdt zich aan dezelfde regels als
 * `supabaseAccount.ts` doordat het dezelfde `oordeel.ts` gebruikt; wat het niet
 * naspeelt is Supabase zelf, en dat is eerlijk gezegd de helft van het risico
 * (zie `docs/SUPABASE.md`).
 *
 * Het gaat niet mee in de app: alleen tests importeren dit.
 */

import {
  adresFout,
  invoerFout,
  moetVernieuwen,
  nieuwWachtwoordFout,
  normaliseerEmail,
  verlooptOp,
  wachtwoordKort,
} from './oordeel';
import type { Account, AccountUitkomst, Sessie } from './types';

export interface NepOpties {
  /** Alsof de bouw geen adres en geen sleutel heeft. */
  readonly nietIngesteld?: boolean;
  /** Alsof er geen verbinding is. */
  readonly offline?: boolean;
  /** Alsof aanmelden eerst een mail stuurt: aangemaakt, maar nog niet binnen. */
  readonly bevestigingNodig?: boolean;
  /** Hoe lang een token meegaat, in seconden. */
  readonly tokenSeconden?: number;
}

export interface NepAccount extends Account {
  /** Wat er nu bewaard is, zonder te verversen. Alleen voor de test. */
  readonly bewaard: () => Sessie | null;
  /** Hoe vaak er ververst is. */
  readonly verversingen: () => number;
  /** Alsof de server de sessie heeft ingetrokken, zoals na een nieuw wachtwoord. */
  readonly trekIn: () => void;
  /** De verbinding wegnemen nádat er is ingelogd. */
  readonly zetOffline: () => void;
  /** Naar welke adressen een herstelmail ging, en waar de link heen wees. */
  readonly herstelmails: () => readonly { readonly email: string; readonly terugNaar: string }[];
  /** De sessie die de link in een herstelmail zou geven, voor een adres dat er is. */
  readonly herstelSessie: (email: string) => Sessie | null;
}

export function maakNepAccount(opties: NepOpties = {}): NepAccount {
  const { nietIngesteld = false, bevestigingNodig = false } = opties;
  let offline = opties.offline ?? false;
  const tokenSeconden = opties.tokenSeconden ?? 3600;

  const gebruikers = new Map<string, { readonly id: string; readonly wachtwoord: string }>();
  let sessie: Sessie | null = null;
  let ingetrokken = false;
  let verversingen = 0;
  let volgende = 0;
  const mails: { readonly email: string; readonly terugNaar: string }[] = [];
  /** De tokens die een herstellink uitgaf, en of ze nog niet gebruikt zijn. */
  const herstelTokens = new Map<string, string>();

  function nieuweSessie(email: string, id: string, now: Date): Sessie {
    ingetrokken = false;
    volgende += 1;
    return {
      gebruikerId: id,
      email,
      token: `token-${volgende}`,
      vernieuwToken: `vernieuw-${volgende}`,
      verlooptOp: verlooptOp(tokenSeconden, now),
    };
  }

  function vooraf(email: string, wachtwoord: string): AccountUitkomst | null {
    const fout = invoerFout(email, wachtwoord);
    if (fout !== null) return { ok: false, reden: fout };
    if (nietIngesteld) return { ok: false, reden: 'niet-ingesteld' };
    if (offline) return { ok: false, reden: 'geen-verbinding' };
    return null;
  }

  return {
    aanmelden: async (email, wachtwoord) => {
      const mis = vooraf(email, wachtwoord);
      if (mis !== null) return mis;
      if (wachtwoordKort(wachtwoord)) return { ok: false, reden: 'te-kort' };

      const adres = normaliseerEmail(email);
      if (gebruikers.has(adres)) return { ok: false, reden: 'bestaat-al' };

      const id = `ouder-${gebruikers.size + 1}`;
      gebruikers.set(adres, { id, wachtwoord });
      if (bevestigingNodig) return { ok: true, sessie: null };

      sessie = nieuweSessie(adres, id, new Date());
      return { ok: true, sessie };
    },

    inloggen: async (email, wachtwoord) => {
      const mis = vooraf(email, wachtwoord);
      if (mis !== null) return mis;

      const adres = normaliseerEmail(email);
      const gebruiker = gebruikers.get(adres);
      // Eén antwoord voor een onbekend adres en een fout wachtwoord.
      if (gebruiker === undefined || gebruiker.wachtwoord !== wachtwoord) {
        return { ok: false, reden: 'onjuist' };
      }

      sessie = nieuweSessie(adres, gebruiker.id, new Date());
      return { ok: true, sessie };
    },

    uitloggen: async () => {
      sessie = null;
    },

    sessie: async (now = new Date()) => {
      if (sessie === null) return null;
      if (!moetVernieuwen(sessie, now)) return sessie;
      if (ingetrokken) {
        sessie = null;
        return null;
      }
      if (offline) return sessie;
      verversingen += 1;
      sessie = nieuweSessie(sessie.email, sessie.gebruikerId, now);
      return sessie;
    },

    herstel: async (email, terugNaar) => {
      const fout = adresFout(email);
      if (fout !== null) return { ok: false, reden: fout };
      if (nietIngesteld) return { ok: false, reden: 'niet-ingesteld' };
      if (offline) return { ok: false, reden: 'geen-verbinding' };
      // Ook voor een adres zonder account: hetzelfde antwoord, zoals Supabase.
      if (gebruikers.has(normaliseerEmail(email))) {
        mails.push({ email: normaliseerEmail(email), terugNaar });
      }
      return { ok: true, sessie: null };
    },

    nieuwWachtwoord: async (link, wachtwoord) => {
      const fout = nieuwWachtwoordFout(wachtwoord);
      if (fout !== null) return { ok: false, reden: fout };
      if (nietIngesteld) return { ok: false, reden: 'niet-ingesteld' };
      if (offline) return { ok: false, reden: 'geen-verbinding' };

      const adres = herstelTokens.get(link.token);
      const gebruiker = adres === undefined ? undefined : gebruikers.get(adres);
      if (adres === undefined || gebruiker === undefined) return { ok: false, reden: 'verlopen' };
      if (gebruiker.wachtwoord === wachtwoord) return { ok: false, reden: 'zelfde' };

      herstelTokens.delete(link.token);
      gebruikers.set(adres, { id: gebruiker.id, wachtwoord });
      sessie = link;
      return { ok: true, sessie };
    },

    bewaard: () => sessie,
    herstelmails: () => mails,
    herstelSessie: (email) => {
      const adres = normaliseerEmail(email);
      const gebruiker = gebruikers.get(adres);
      if (gebruiker === undefined) return null;
      const link = nieuweSessie(adres, gebruiker.id, new Date());
      herstelTokens.set(link.token, adres);
      return link;
    },
    verversingen: () => verversingen,
    trekIn: () => {
      ingetrokken = true;
    },
    zetOffline: () => {
      offline = true;
    },
  };
}
