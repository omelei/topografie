/**
 * Premium, on this device (ADR-116).
 *
 * A code a parent types once, checked against one small table on a server, and
 * remembered here so the app does not have to ask again for a week. It is the
 * first thing in this product that talks to anybody, so what it says is kept to
 * the least that works: **the code, and a random number for this device**. No
 * name, no child, no progress — nothing that is about a player. The device
 * number is there so one code can be on three devices and not on thirty, and so
 * a parent can free a place by taking the code off a device.
 *
 * **Kept in localStorage, not IndexedDB.** It belongs to the device rather than
 * to a child — one code is for every child on it — and it is read synchronously
 * on the first frame, so a page never shows a lock and then takes it away.
 *
 * **It is a gate, not a safe.** Everything the app can do is in the bundle a
 * browser downloads, and a child with the developer tools open can set this
 * value by hand. That is true of every web app without a server behind each
 * screen, and it is the price of ADR-015: progress never leaves the device, so
 * there is nothing on the server to withhold. What a code buys is honest use,
 * which is what a family paying for it is doing anyway.
 */

export interface PremiumStand {
  /** The code, normalised: eight letters and digits, no dashes. */
  readonly code: string;
  /** The last day it is valid, as the server said it: YYYY-MM-DD. */
  readonly geldigTot: string;
  /** When the server last said yes, as an ISO moment. */
  readonly gecontroleerd: string;
}

export type PremiumReden =
  'leeg' | 'onbekend' | 'verlopen' | 'vol' | 'te-vaak' | 'geen-verbinding' | 'niet-ingesteld';

export type PremiumUitkomst =
  | { readonly ok: true; readonly geldigTot: string }
  | { readonly ok: false; readonly reden: PremiumReden };

export const PREMIUM_SLEUTEL = 'leernu.premium';
const APPARAAT_SLEUTEL = 'leernu.apparaat';

/** How long a yes is trusted before the app asks again, when it can. */
export const OPNIEUW_NA_DAGEN = 7;
/**
 * How long premium keeps working without the server being reachable. Two weeks:
 * a holiday without wifi should not lock a child out of what the family paid
 * for, and a code taken back is off every device within a fortnight.
 */
export const ZONDER_VERBINDING_DAGEN = 14;

const DAG_MS = 86_400_000;

/**
 * Where the code is checked. Set at build time (`VITE_PREMIUM_URL` and the
 * public key `VITE_PREMIUM_KEY`); a build without them has no premium to sell
 * and says so rather than failing.
 */
function server(): { readonly url: string; readonly sleutel: string } | null {
  const url = String(import.meta.env.VITE_PREMIUM_URL ?? '').replace(/\/+$/, '');
  const sleutel = String(import.meta.env.VITE_PREMIUM_KEY ?? '');
  return url === '' || sleutel === '' ? null : { url, sleutel };
}

/**
 * What a parent typed, as the server stores it: capitals and digits only, and
 * without the "LEER" in front that the printed code carries. "leer-7k3m q9tx"
 * and "7K3MQ9TX" are the same code.
 */
export function normaliseerCode(invoer: string): string {
  const schoon = invoer.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return schoon.length === 12 && schoon.startsWith('LEER') ? schoon.slice(4) : schoon;
}

/** Whether a remembered code still counts on this day. */
export function isActief(stand: PremiumStand | null, now: Date): boolean {
  if (stand === null) return false;
  const tot = new Date(`${stand.geldigTot}T23:59:59`);
  if (Number.isNaN(tot.getTime()) || tot.getTime() < now.getTime()) return false;
  const sinds = now.getTime() - new Date(stand.gecontroleerd).getTime();
  return sinds <= ZONDER_VERBINDING_DAGEN * DAG_MS;
}

// ---------------------------------------------------------------------------
// The value, and who is listening to it.

const luisteraars = new Set<() => void>();

/**
 * The raw stored string. A string rather than the parsed object because React
 * compares snapshots by identity, and a fresh object on every read would be a
 * render loop.
 */
export function leesRuw(): string | null {
  try {
    return window.localStorage.getItem(PREMIUM_SLEUTEL);
  } catch {
    return null;
  }
}

export function leesStand(ruw: string | null = leesRuw()): PremiumStand | null {
  if (ruw === null) return null;
  try {
    const waarde = JSON.parse(ruw) as Partial<PremiumStand> | null;
    if (
      typeof waarde?.code !== 'string' ||
      typeof waarde.geldigTot !== 'string' ||
      typeof waarde.gecontroleerd !== 'string'
    ) {
      return null;
    }
    return { code: waarde.code, geldigTot: waarde.geldigTot, gecontroleerd: waarde.gecontroleerd };
  } catch {
    return null;
  }
}

function schrijf(stand: PremiumStand | null): void {
  try {
    if (stand === null) window.localStorage.removeItem(PREMIUM_SLEUTEL);
    else window.localStorage.setItem(PREMIUM_SLEUTEL, JSON.stringify(stand));
  } catch {
    // A browser that refuses storage refuses premium on this device too; the
    // page says the code did not stick by staying locked.
  }
  for (const luisteraar of luisteraars) luisteraar();
}

/** For `useSyncExternalStore`: this tab's writes, and another tab's. */
export function abonneer(luisteraar: () => void): () => void {
  luisteraars.add(luisteraar);
  const opslag = (event: StorageEvent) => {
    if (event.key === PREMIUM_SLEUTEL) luisteraar();
  };
  window.addEventListener('storage', opslag);
  return () => {
    luisteraars.delete(luisteraar);
    window.removeEventListener('storage', opslag);
  };
}

/** A random number for this device, made once. Says nothing about who holds it. */
function apparaatId(): string {
  try {
    const bekend = window.localStorage.getItem(APPARAAT_SLEUTEL);
    if (bekend) return bekend;
    const nieuw = crypto.randomUUID();
    window.localStorage.setItem(APPARAAT_SLEUTEL, nieuw);
    return nieuw;
  } catch {
    return crypto.randomUUID();
  }
}

// ---------------------------------------------------------------------------
// The server.

interface ServerAntwoord {
  readonly geldig?: boolean;
  readonly geldig_tot?: string | null;
  readonly reden?: string | null;
}

const REDENEN: readonly PremiumReden[] = ['onbekend', 'verlopen', 'vol', 'te-vaak'];

/**
 * How the public key goes along. A new Supabase project hands out a
 * publishable key (`sb_publishable_…`), which belongs on the `apikey` header
 * only: it is not a JWT, and sent as `Authorization: Bearer` it is refused.
 * The older anon key is a JWT and was sent on both, which is what a project
 * made before the switch still expects.
 */
export function sleutelKoppen(sleutel: string): Record<string, string> {
  const koppen: Record<string, string> = { 'Content-Type': 'application/json', apikey: sleutel };
  if (sleutel.startsWith('eyJ')) koppen.Authorization = `Bearer ${sleutel}`;
  return koppen;
}

async function vraag(functie: string, code: string): Promise<PremiumUitkomst> {
  const doel = server();
  if (doel === null) return { ok: false, reden: 'niet-ingesteld' };

  let antwoord: ServerAntwoord;
  try {
    const reactie = await fetch(`${doel.url}/rest/v1/rpc/${functie}`, {
      method: 'POST',
      headers: sleutelKoppen(doel.sleutel),
      body: JSON.stringify({ p_code: code, p_apparaat: apparaatId() }),
    });
    if (!reactie.ok) return { ok: false, reden: 'geen-verbinding' };
    antwoord = (await reactie.json()) as ServerAntwoord;
  } catch {
    return { ok: false, reden: 'geen-verbinding' };
  }

  if (antwoord.geldig === true && typeof antwoord.geldig_tot === 'string') {
    return { ok: true, geldigTot: antwoord.geldig_tot.slice(0, 10) };
  }
  const reden = REDENEN.find((kandidaat) => kandidaat === antwoord.reden) ?? 'onbekend';
  return { ok: false, reden };
}

/** A code typed on the premium page. Remembered only if the server says yes. */
export async function activeer(invoer: string, now = new Date()): Promise<PremiumUitkomst> {
  const code = normaliseerCode(invoer);
  if (code.length === 0) return { ok: false, reden: 'leeg' };

  const uitkomst = await vraag('premium_controleer', code);
  if (uitkomst.ok) {
    schrijf({ code, geldigTot: uitkomst.geldigTot, gecontroleerd: now.toISOString() });
  }
  return uitkomst;
}

/**
 * Once a week, when the app opens: is the code still good? A no from the
 * server takes premium off; no answer at all leaves it on, for up to two weeks
 * from the last yes (`isActief`).
 */
export async function controleerOpnieuw(now = new Date()): Promise<void> {
  const stand = leesStand();
  if (stand === null || server() === null) return;
  const sinds = now.getTime() - new Date(stand.gecontroleerd).getTime();
  if (sinds < OPNIEUW_NA_DAGEN * DAG_MS) return;

  const uitkomst = await vraag('premium_controleer', stand.code);
  if (uitkomst.ok) {
    schrijf({ ...stand, geldigTot: uitkomst.geldigTot, gecontroleerd: now.toISOString() });
  } else if (
    uitkomst.reden === 'onbekend' ||
    uitkomst.reden === 'verlopen' ||
    uitkomst.reden === 'vol'
  ) {
    schrijf(null);
  }
}

/**
 * Takes the code off this device, and frees its place on the server when the
 * server can be reached. Off here either way: a parent who pressed the button
 * meant it, whether or not there was wifi.
 */
export async function meldAf(): Promise<void> {
  const stand = leesStand();
  schrijf(null);
  if (stand !== null) await vraag('premium_afmelden', stand.code);
}
