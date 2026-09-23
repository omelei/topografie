import { moetVernieuwen, verlooptOp } from '../account/oordeel';
import { server } from '../account/omgeving';
import type { Sessie } from '../account/types';

/**
 * De sessie van een kind dat zelf inlogde, op dit apparaat (ADR-190).
 *
 * Een kind logt in met zijn inlogcode en een wachtwoord dat de ouder zette, op
 * een apparaat waar geen ouder bij is: de chromebook van school, de laptop bij
 * opa. Daarna houdt dit apparaat bij wat dat kind oefent, met déze sessie en
 * niet met die van een ouder; de policy van `0001_gezin.sql` laat een kind zijn
 * eigen rijen schrijven (`kind_id = auth.uid()`).
 *
 * In `localStorage`, net als de sessie van de ouder (`account/bewaren.ts`), en
 * per kind, want op één apparaat kunnen er twee zelf ingelogd zijn. Een token
 * en een vernieuwtoken; nooit een wachtwoord.
 */

const SLEUTEL = 'leernu.kindsessies';

function leesAlles(): Record<string, Sessie> {
  try {
    const ruw = window.localStorage.getItem(SLEUTEL);
    const waarde: unknown = ruw === null ? {} : JSON.parse(ruw);
    return waarde !== null && typeof waarde === 'object' ? (waarde as Record<string, Sessie>) : {};
  } catch {
    return {};
  }
}

function schrijfAlles(alles: Record<string, Sessie>): void {
  try {
    window.localStorage.setItem(SLEUTEL, JSON.stringify(alles));
  } catch {
    // Een browser die opslag weigert, onthoudt geen inlog. Dan logt het kind
    // de volgende keer opnieuw in; er gaat niets verloren.
  }
}

/** Welke kinderen op dit apparaat zelf ingelogd zijn. */
export function kinderenMetSessie(): string[] {
  return Object.keys(leesAlles());
}

export function bewaarKindsessie(kindId: string, sessie: Sessie): void {
  schrijfAlles({ ...leesAlles(), [kindId]: sessie });
}

export function vergeetKindsessie(kindId: string): void {
  const alles = leesAlles();
  delete alles[kindId];
  schrijfAlles(alles);
}

/**
 * De sessie van dit kind, ververst als hij bijna om is; null als er geen is of
 * als hij is ingetrokken. Dat laatste gebeurt met opzet als de ouder een nieuw
 * wachtwoord zet (`kind-beheer`, ADR-155): dan logt het kind overal uit.
 */
export async function geldigeKindsessie(kindId: string, nu = new Date()): Promise<Sessie | null> {
  const sessie = leesAlles()[kindId];
  if (sessie === undefined) return null;
  if (!moetVernieuwen(sessie, nu)) return sessie;

  const doel = server();
  if (doel === null) return null;
  try {
    const reactie = await fetch(`${doel.url}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: doel.sleutel },
      body: JSON.stringify({ refresh_token: sessie.vernieuwToken }),
    });
    if (reactie.status >= 500) return sessie;
    if (!reactie.ok) {
      vergeetKindsessie(kindId);
      return null;
    }
    const nieuw = (await reactie.json()) as {
      readonly access_token?: unknown;
      readonly refresh_token?: unknown;
      readonly expires_in?: unknown;
    };
    if (
      typeof nieuw.access_token !== 'string' ||
      typeof nieuw.refresh_token !== 'string' ||
      typeof nieuw.expires_in !== 'number'
    ) {
      vergeetKindsessie(kindId);
      return null;
    }
    const ververst: Sessie = {
      ...sessie,
      token: nieuw.access_token,
      vernieuwToken: nieuw.refresh_token,
      verlooptOp: verlooptOp(nieuw.expires_in, nu),
    };
    bewaarKindsessie(kindId, ververst);
    return ververst;
  } catch {
    // Geen verbinding: de sessie blijft staan, zoals bij de ouder. Het verzoek
    // dat erop volgt, merkt wel dat het token te oud is.
    return sessie;
  }
}
