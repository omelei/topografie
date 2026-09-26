/**
 * Premium, on this device (ADR-116).
 *
 * A code a parent types once, checked against one small table on a server, and
 * remembered here so the app does not have to ask again for a week. It is the
 * first thing in this product that talks to anybody, so what it says is kept to
 * the least that works: **the code, a random number for this device**, and
 * since ADR-226 what kind of device it is ("iPad"). No name, no child, no
 * progress — nothing that is about a player. The device number is there so one
 * code can be on three devices and not on thirty, and so a parent can free a
 * place by taking the code off a device.
 *
 * **A place is taken when a child starts premium, not when the code is typed**
 * (ADR-226). A parent who fills in the code on a phone to look at the parent
 * page takes no place; the first premium round a child starts on a device does
 * (`claimPlek`).
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
  /**
   * Of dit apparaat een plek op de code heeft, zoals de server het het laatst
   * zei (ADR-226). Ontbreekt bij een code van vóór die tijd: dan vraagt de
   * eerste premiumstart het na.
   */
  readonly plek?: boolean;
}

export type PremiumReden =
  | 'leeg'
  | 'onbekend'
  | 'verlopen'
  | 'nog-niet'
  | 'vol'
  | 'te-vaak'
  | 'geen-verbinding'
  | 'niet-ingesteld';

export type PremiumUitkomst =
  | { readonly ok: true; readonly geldigTot: string; readonly plek?: boolean }
  | {
      readonly ok: false;
      readonly reden: PremiumReden;
      /** Bij `nog-niet`: de eerste dag waarop de code geldt, YYYY-MM-DD (ADR-225). */
      readonly geldigVan?: string;
    };

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
 * Of er überhaupt iets te kopen valt op deze build (ADR-123).
 *
 * De premiumpagina wijst naar de kassa, en de kassa staat op dit adres zelf
 * (`/kopen`) — geen variabele, geen ander domein. Maar een build zonder
 * premiumserver heeft niets te verkopen, en een knop naar een winkel die er niet
 * is, is erger dan geen knop. Dezelfde voorwaarde dus als voor de code zelf.
 */
export function isTeKoop(): boolean {
  return server() !== null;
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

/**
 * Hoeveel hele dagen een code nog geldig is. Nul op de laatste dag zelf,
 * negatief zodra hij verlopen is, en null als er geen code is (ADR-129).
 *
 * Gerekend van middag tot middag, zodat de zomertijd er geen dag bij of af
 * haalt: `geldigTot` is een kalenderdag en geen moment.
 */
export function dagenGeldig(stand: PremiumStand | null, now: Date): number | null {
  if (stand === null) return null;
  const laatste = new Date(`${stand.geldigTot}T12:00:00`);
  if (Number.isNaN(laatste.getTime())) return null;
  const vandaag = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  return Math.round((laatste.getTime() - vandaag.getTime()) / DAG_MS);
}

/**
 * Of de code zelf over de datum is.
 *
 * Met opzet iets anders dan `!isActief`. Die staat ook uit als de server twee
 * weken onbereikbaar was (`ZONDER_VERBINDING_DAGEN`), en dat is geen verlopen
 * abonnement maar een vakantiehuis zonder wifi. Tegen een ouder zeggen dat zijn
 * code verlopen is terwijl hij gewoon nog een half jaar loopt, is het ergste
 * wat dit scherm kan doen.
 */
export function isVerlopen(stand: PremiumStand | null, now: Date): boolean {
  const dagen = dagenGeldig(stand, now);
  return dagen !== null && dagen < 0;
}

/**
 * Vanaf hoeveel dagen voor het einde er iets gezegd wordt.
 *
 * Een maand: lang genoeg om er rustig over te doen, kort genoeg om over dít
 * jaar te gaan. Eerder waarschuwen maakt er een reclameboodschap van die elf
 * maanden lang in de weg staat.
 */
export const WAARSCHUW_VANAF_DAGEN = 30;

/** Of het einde dichtbij genoeg is om het te melden, en nog niet gepasseerd. */
export function verlooptBinnenkort(stand: PremiumStand | null, now: Date): boolean {
  const dagen = dagenGeldig(stand, now);
  return dagen !== null && dagen >= 0 && dagen <= WAARSCHUW_VANAF_DAGEN;
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
    const stand = {
      code: waarde.code,
      geldigTot: waarde.geldigTot,
      gecontroleerd: waarde.gecontroleerd,
    };
    return typeof waarde.plek === 'boolean' ? { ...stand, plek: waarde.plek } : stand;
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

/**
 * Wat voor apparaat dit is, grof: genoeg om het in een lijst te herkennen, en
 * nooit meer (ADR-226). Uit wat de browser zegt, en altijd een woord uit de
 * lijst die de server ook kent; wat er niet in past, is "onbekend".
 *
 * Een iPad zegt sinds iPadOS 13 dat hij een Mac is. Een Mac heeft geen
 * aanraakscherm, dus een "Mac" met aanraakpunten is een iPad.
 */
export type ApparaatLabel =
  | 'ipad'
  | 'iphone'
  | 'android-tablet'
  | 'android-telefoon'
  | 'chromebook'
  | 'windows'
  | 'mac'
  | 'linux'
  | 'onbekend';

export function grofLabel(userAgent: string, aanraakpunten = 0): ApparaatLabel {
  if (/iPad/.test(userAgent)) return 'ipad';
  if (/iPhone|iPod/.test(userAgent)) return 'iphone';
  if (/Android/.test(userAgent))
    return /Mobile/.test(userAgent) ? 'android-telefoon' : 'android-tablet';
  if (/CrOS/.test(userAgent)) return 'chromebook';
  if (/Windows/.test(userAgent)) return 'windows';
  if (/Macintosh|Mac OS X/.test(userAgent)) return aanraakpunten > 1 ? 'ipad' : 'mac';
  if (/Linux/.test(userAgent)) return 'linux';
  return 'onbekend';
}

function ditLabel(): ApparaatLabel {
  try {
    return grofLabel(navigator.userAgent, navigator.maxTouchPoints ?? 0);
  } catch {
    return 'onbekend';
  }
}

// ---------------------------------------------------------------------------
// The server.

interface ServerAntwoord {
  readonly geldig?: boolean;
  readonly geldig_tot?: string | null;
  readonly geldig_van?: string | null;
  readonly reden?: string | null;
  readonly plek?: boolean | null;
}

const REDENEN: readonly PremiumReden[] = ['onbekend', 'verlopen', 'nog-niet', 'vol', 'te-vaak'];

/**
 * How the public key goes along. A new Supabase project hands out a
 * publishable key (`sb_publishable_…`), which belongs on the `apikey` header
 * only: it is not a JWT, and sent as `Authorization: Bearer` it is refused.
 * The older anon key is a JWT and was sent on both, which is what a project
 * made before the switch still expects.
 */
/** Waar de teller telt: dezelfde server, met dezelfde publieke sleutel (ADR-210). */
export { server as premiumServer };

export function sleutelKoppen(sleutel: string): Record<string, string> {
  const koppen: Record<string, string> = { 'Content-Type': 'application/json', apikey: sleutel };
  if (sleutel.startsWith('eyJ')) koppen.Authorization = `Bearer ${sleutel}`;
  return koppen;
}

/**
 * Eén functie op de server, met de code en het nummer van dit apparaat, en wat
 * die functie verder nodig heeft, of waarom er geen antwoord is.
 */
async function rpc<T>(
  functie: string,
  code: string,
  extra: Readonly<Record<string, unknown>> = {},
): Promise<T | 'niet-ingesteld' | 'geen-verbinding'> {
  const doel = server();
  if (doel === null) return 'niet-ingesteld';
  try {
    const reactie = await fetch(`${doel.url}/rest/v1/rpc/${functie}`, {
      method: 'POST',
      headers: sleutelKoppen(doel.sleutel),
      body: JSON.stringify({ p_code: code, p_apparaat: apparaatId(), ...extra }),
    });
    if (!reactie.ok) return 'geen-verbinding';
    return (await reactie.json()) as T;
  } catch {
    return 'geen-verbinding';
  }
}

/**
 * De code nakijken. `claim` vraagt er een plek voor dit apparaat bij (ADR-226):
 * alleen bij een premiumstart van een kind, en bij het wekelijkse nakijken van
 * een apparaat dat al een plek had.
 */
async function vraag(functie: string, code: string, claim?: boolean): Promise<PremiumUitkomst> {
  const extra = claim === undefined ? {} : { p_claim: claim, p_label: ditLabel() };
  const antwoord = await rpc<ServerAntwoord>(functie, code, extra);
  if (antwoord === 'niet-ingesteld' || antwoord === 'geen-verbinding') {
    return { ok: false, reden: antwoord };
  }

  if (antwoord.geldig === true && typeof antwoord.geldig_tot === 'string') {
    const geldigTot = antwoord.geldig_tot.slice(0, 10);
    return typeof antwoord.plek === 'boolean'
      ? { ok: true, geldigTot, plek: antwoord.plek }
      : { ok: true, geldigTot };
  }
  const reden = REDENEN.find((kandidaat) => kandidaat === antwoord.reden) ?? 'onbekend';
  // Een code die nog niet ingaat, zegt op welke dag wel (ADR-225).
  if (reden === 'nog-niet' && typeof antwoord.geldig_van === 'string') {
    return { ok: false, reden, geldigVan: antwoord.geldig_van.slice(0, 10) };
  }
  return { ok: false, reden };
}

/**
 * A code typed by a parent. Remembered only if the server says yes.
 *
 * Checked without taking a place (ADR-226): the parent may be on a phone no
 * child ever practises on. The place comes with the first premium start.
 */
export async function activeer(invoer: string, now = new Date()): Promise<PremiumUitkomst> {
  const code = normaliseerCode(invoer);
  if (code.length === 0) return { ok: false, reden: 'leeg' };

  const uitkomst = await vraag('premium_controleer', code, false);
  if (uitkomst.ok) {
    schrijf({
      code,
      geldigTot: uitkomst.geldigTot,
      gecontroleerd: now.toISOString(),
      plek: uitkomst.plek === true,
    });
  }
  return uitkomst;
}

/**
 * Een plek voor dit apparaat, bij de eerste premiumstart van een kind (ADR-226).
 *
 * `'ok'` als het kind kan beginnen, `'vol'` als alle plekken van de code in
 * gebruik zijn, `'weg'` als de code niet meer geldt (dan staat premium hier nu
 * uit). Heeft dit apparaat al een plek, dan wordt er niets gevraagd.
 * Zonder server of zonder verbinding kan het kind ook beginnen: een ronde
 * weigeren omdat de wifi hapert, is een kind straffen voor het huis waar het
 * zit. De volgende premiumstart vraagt het opnieuw.
 */
export async function claimPlek(now = new Date()): Promise<'ok' | 'vol' | 'weg'> {
  const stand = leesStand();
  if (stand === null || stand.plek === true) return 'ok';

  const uitkomst = await vraag('premium_controleer', stand.code, true);
  if (uitkomst.ok) {
    schrijf({
      ...stand,
      geldigTot: uitkomst.geldigTot,
      gecontroleerd: now.toISOString(),
      plek: true,
    });
    return 'ok';
  }
  if (uitkomst.reden === 'vol') {
    schrijf({ ...stand, plek: false });
    return 'vol';
  }
  if (
    uitkomst.reden === 'onbekend' ||
    uitkomst.reden === 'verlopen' ||
    uitkomst.reden === 'nog-niet'
  ) {
    schrijf(null);
    return 'weg';
  }
  return 'ok';
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

  // Een apparaat met een plek vraagt hem opnieuw: is hij na negentig dagen
  // vrijgegeven, of door een ouder vervangen, dan neemt het hem terug als er
  // ruimte is (ADR-226). Een apparaat zonder plek vraagt er geen.
  const uitkomst = await vraag('premium_controleer', stand.code, stand.plek === true);
  if (uitkomst.ok) {
    schrijf({
      ...stand,
      geldigTot: uitkomst.geldigTot,
      gecontroleerd: now.toISOString(),
      plek: uitkomst.plek === true,
    });
  } else if (uitkomst.reden === 'vol') {
    // De code klopt nog; alleen dit apparaat heeft geen plek meer. De volgende
    // premiumstart vraagt er weer een.
    schrijf({ ...stand, gecontroleerd: now.toISOString(), plek: false });
  } else if (
    uitkomst.reden === 'onbekend' ||
    uitkomst.reden === 'verlopen' ||
    uitkomst.reden === 'nog-niet'
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

// ---------------------------------------------------------------------------
// De apparaten van een code, voor de ouderpagina (ADR-226).

export interface Apparaat {
  /** Een aanwijzing voor de server, geen apparaatnummer. */
  readonly plek: string;
  readonly label: ApparaatLabel;
  /** YYYY-MM-DD: de dag dat het een plek nam. */
  readonly toegevoegd: string;
  /** YYYY-MM-DD: de dag dat het het laatst gebruikt is. */
  readonly laatstGezien: string;
  readonly ditApparaat: boolean;
}

export type ApparatenFout =
  'geen-plek' | 'onbekend' | 'verlopen' | 'te-vaak' | 'geen-verbinding' | 'niet-ingesteld';

export type Apparaten =
  | {
      readonly ok: true;
      readonly bezet: number;
      readonly plekken: number;
      readonly vervangingenOver: number;
      readonly apparaten: readonly Apparaat[];
    }
  | {
      readonly ok: false;
      readonly reden: ApparatenFout;
      readonly bezet?: number;
      readonly plekken?: number;
    };

interface LijstAntwoord {
  readonly ok?: boolean;
  readonly reden?: string;
  readonly bezet?: number;
  readonly plekken?: number;
  readonly vervangingen_over?: number;
  readonly apparaten?: readonly {
    readonly plek?: string;
    readonly label?: string;
    readonly toegevoegd?: string;
    readonly laatst_gezien?: string;
    readonly dit_apparaat?: boolean;
  }[];
}

const LABELS: readonly ApparaatLabel[] = [
  'ipad',
  'iphone',
  'android-tablet',
  'android-telefoon',
  'chromebook',
  'windows',
  'mac',
  'linux',
  'onbekend',
];

/**
 * De apparaten op de code van dit apparaat. Alleen als dit apparaat er zelf op
 * staat; anders zegt de server alleen hoeveel plekken er bezet zijn.
 */
export async function toonApparaten(): Promise<Apparaten> {
  const stand = leesStand();
  if (stand === null) return { ok: false, reden: 'onbekend' };

  const antwoord = await rpc<LijstAntwoord>('premium_apparaten_tonen', stand.code);
  if (antwoord === 'niet-ingesteld' || antwoord === 'geen-verbinding') {
    return { ok: false, reden: antwoord };
  }
  if (antwoord.ok !== true) {
    const redenen: readonly ApparatenFout[] = ['geen-plek', 'verlopen', 'te-vaak'];
    const reden = redenen.find((kandidaat) => kandidaat === antwoord.reden) ?? 'onbekend';
    // Staat dit apparaat er niet (meer) op, dan weet de volgende premiumstart
    // dat hij een plek moet vragen.
    if (reden === 'geen-plek' && stand.plek === true) schrijf({ ...stand, plek: false });
    return typeof antwoord.bezet === 'number' && typeof antwoord.plekken === 'number'
      ? { ok: false, reden, bezet: antwoord.bezet, plekken: antwoord.plekken }
      : { ok: false, reden };
  }

  if (stand.plek !== true) schrijf({ ...stand, plek: true });
  return {
    ok: true,
    bezet: antwoord.bezet ?? 0,
    plekken: antwoord.plekken ?? 0,
    vervangingenOver: antwoord.vervangingen_over ?? 0,
    apparaten: (antwoord.apparaten ?? []).map((rij) => ({
      plek: rij.plek ?? '',
      label: LABELS.find((label) => label === rij.label) ?? 'onbekend',
      toegevoegd: (rij.toegevoegd ?? '').slice(0, 10),
      laatstGezien: (rij.laatst_gezien ?? '').slice(0, 10),
      ditApparaat: rij.dit_apparaat === true,
    })),
  };
}

export type VervangUitkomst =
  | { readonly ok: true; readonly vervangingenOver: number }
  | {
      readonly ok: false;
      readonly reden: 'grens' | 'geen-plek' | 'weg' | 'te-vaak' | 'geen-verbinding' | 'onbekend';
    };

/**
 * Een plek vervangen: dat apparaat gaat van de code af, en het volgende
 * apparaat waarop een kind premium start, neemt zijn plek (ADR-226). Drie keer
 * per code in twaalf maanden; daarna `grens`.
 */
export async function vervangPlek(plek: string): Promise<VervangUitkomst> {
  const stand = leesStand();
  if (stand === null) return { ok: false, reden: 'onbekend' };

  const antwoord = await rpc<{ ok?: boolean; reden?: string; vervangingen_over?: number }>(
    'premium_plek_vervangen',
    stand.code,
    { p_plek: plek },
  );
  if (antwoord === 'niet-ingesteld' || antwoord === 'geen-verbinding') {
    return { ok: false, reden: 'geen-verbinding' };
  }
  if (antwoord.ok === true) return { ok: true, vervangingenOver: antwoord.vervangingen_over ?? 0 };
  const redenen = ['grens', 'geen-plek', 'weg', 'te-vaak'] as const;
  return {
    ok: false,
    reden: redenen.find((kandidaat) => kandidaat === antwoord.reden) ?? 'onbekend',
  };
}
