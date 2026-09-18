/**
 * De sessie van de ouder op dit apparaat (ADR-155).
 *
 * In localStorage en niet in IndexedDB, om dezelfde reden als de premiumstand
 * (ADR-116): hij hoort bij het apparaat en niet bij een kind, en hij wordt op
 * het eerste frame gelezen, zodat een scherm niet eerst "niet ingelogd" laat
 * zien en dat daarna terugneemt.
 *
 * Wat hier staat is een token en een adres. Geen wachtwoord — dat heeft de app
 * nooit langer vast dan het ene verzoek waarin het verstuurd wordt.
 */

import type { Sessie } from './types';

export const SESSIE_SLEUTEL = 'leernu.sessie';

const luisteraars = new Set<() => void>();

export function leesRuw(): string | null {
  try {
    return window.localStorage.getItem(SESSIE_SLEUTEL);
  } catch {
    // Een browser die opslag weigert, weigert inloggen op dit apparaat ook. Het
    // scherm zegt dat door niet ingelogd te blijven.
    return null;
  }
}

export function leesSessie(ruw: string | null = leesRuw()): Sessie | null {
  if (ruw === null) return null;
  try {
    const waarde = JSON.parse(ruw) as Partial<Sessie> | null;
    if (
      typeof waarde?.gebruikerId !== 'string' ||
      typeof waarde.email !== 'string' ||
      typeof waarde.token !== 'string' ||
      typeof waarde.vernieuwToken !== 'string' ||
      typeof waarde.verlooptOp !== 'string'
    ) {
      return null;
    }
    return {
      gebruikerId: waarde.gebruikerId,
      email: waarde.email,
      token: waarde.token,
      vernieuwToken: waarde.vernieuwToken,
      verlooptOp: waarde.verlooptOp,
    };
  } catch {
    return null;
  }
}

export function schrijfSessie(sessie: Sessie | null): void {
  try {
    if (sessie === null) window.localStorage.removeItem(SESSIE_SLEUTEL);
    else window.localStorage.setItem(SESSIE_SLEUTEL, JSON.stringify(sessie));
  } catch {
    // Zie `leesRuw`.
  }
  for (const luisteraar of luisteraars) luisteraar();
}

/** Voor `useSyncExternalStore`: wat dit tabblad schrijft, en wat een ander tabblad schrijft. */
export function abonneer(luisteraar: () => void): () => void {
  luisteraars.add(luisteraar);
  const opslag = (event: StorageEvent) => {
    if (event.key === SESSIE_SLEUTEL) luisteraar();
  };
  window.addEventListener('storage', opslag);
  return () => {
    luisteraars.delete(luisteraar);
    window.removeEventListener('storage', opslag);
  };
}
