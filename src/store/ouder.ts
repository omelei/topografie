/**
 * Het ouderprofiel op dit apparaat (ADR-173).
 *
 * De ouder is geen vierde kind. Een kind is een rij in `profile` met een naam
 * en een stel Leitner-dozen; de ouder heeft geen dozen, geen diploma's en geen
 * weekkaart, en zou dus een rij zijn waarin bijna elke kolom leeg is. Wat de
 * ouder wél is, is **een stand van dit apparaat**: er oefent nog steeds een
 * kind, en daar staat de ouder tijdelijk bovenop. Daarom staat het hier naast
 * `premium.ts` en niet in `children.ts`.
 *
 * **Twee sloten met twee taken** (ADR-173). Het wachtwoord van het account is
 * de waarheid: het hoort bij het gezin, het staat straks in `auth.users`, en
 * het is wat er nodig is om te kopen, op te zeggen en gegevens op te halen. De
 * **pincode hier is de deur op dít apparaat**: vier cijfers, lokaal, zonder
 * verbinding, en in zijn eentje kan hij niets van de server. In deze fase is er
 * nog geen account, dus is de pincode het enige slot dat er is — en dat is
 * precies wat Apple en Google een _parental gate_ noemen: genoeg om een
 * nieuwsgierig kind tegen te houden, en met opzet niet meer dan dat.
 *
 * **De cijfers worden niet bewaard.** Wat er staat is een PBKDF2-afleiding met
 * een salt per apparaat. Vier cijfers zijn tienduizend mogelijkheden, dus die
 * afleiding is niet de bescherming — de pauze na drie missers is dat, en de
 * echte grens is dat er achter dit slot niets van de server te halen valt.
 * Zonder afleiding zou de pincode wél leesbaar in de opslag staan, en dat is
 * het soort ding dat een gezin op meer plekken gebruikt dan hier.
 *
 * **De sessie staat in `sessionStorage` en de pincode in `localStorage`**, en
 * dat verschil is het ontwerp. Van profiel wisselen laadt de pagina opnieuw
 * (`switchChild`), dus een sessie die een herlaadbeurt niet overleeft, is geen
 * sessie. Maar een iPad die op de ouderpagina blijft staan is een iPad zonder
 * slot, dus hij moet wél verdwijnen als de app dichtgaat. Dat is letterlijk wat
 * `sessionStorage` doet, en met de hand nagebouwd zou het een timer zijn die
 * een gesloten tabblad niet ziet.
 */

/** Waar de pincode van dit apparaat staat. Overleeft het sluiten van de app. */
export const OUDER_SLEUTEL = 'leernu.ouder';
/** Waar staat tot wanneer de ouder aan zet is. Gaat weg als de app dichtgaat. */
export const SESSIE_SLEUTEL = 'leernu.oudersessie';
/** Waar de mislukte pogingen geteld worden. Bij de pincode, niet bij de sessie. */
const PAUZE_SLEUTEL = 'leernu.ouderpauze';

/** Vier cijfers. Netflix' maat, en de maat die een ouder onthoudt. */
export const PIN_LENGTE = 4;

/**
 * Hoe lang de ouder aan zet blijft zonder iets aan te raken.
 *
 * Vijf minuten: lang genoeg om een instelling te zoeken en een code over te
 * tikken, kort genoeg dat een iPad die op tafel blijft liggen vanzelf weer van
 * het kind is. Elke handeling op de ouderpagina zet hem terug op vijf.
 */
export const SESSIE_MINUTEN = 5;

/** Na hoeveel missers er gewacht moet worden, en hoe lang. */
export const POGINGEN_VOOR_PAUZE = 3;
export const PAUZE_SECONDEN = 60;

/**
 * PBKDF2-rondes. Het getal dat OWASP voor PBKDF2-HMAC-SHA256 noemt, en het kost
 * op een iPad uit de doelgroep een fractie van een seconde — één keer, bij het
 * indrukken van een knop, en niet tijdens een ronde.
 */
const ITERATIES = 210_000;

const MINUUT_MS = 60_000;

export interface Ouderslot {
  /** Base64, zestien bytes, één keer gemaakt voor dit apparaat. */
  readonly salt: string;
  /** Base64, de afleiding van de pincode met die salt. */
  readonly hash: string;
  /** Meegeschreven, zodat een zwaardere afleiding later de oude blijft lezen. */
  readonly iteraties: number;
  readonly gezetOp: string;
}

export type OuderFout =
  /** Er stond iets anders dan vier cijfers. */
  | 'geen-cijfers'
  /** De twee velden waren niet hetzelfde. */
  | 'ongelijk'
  /** Deze pincode hoort niet bij dit apparaat. */
  | 'onjuist'
  /** Drie keer mis; even wachten. */
  | 'te-vaak'
  /** Deze browser heeft geen WebCrypto, dus er valt niets af te leiden. */
  | 'geen-kluis';

export type OuderUitkomst =
  | { readonly ok: true }
  | { readonly ok: false; readonly reden: OuderFout; readonly wachtSeconden: number };

// ---------------------------------------------------------------------------
// De opslag, en wie ernaar luistert.

const luisteraars = new Set<() => void>();

function meld(): void {
  for (const luisteraar of luisteraars) luisteraar();
}

function lees(opslag: Storage | null, sleutel: string): string | null {
  try {
    return opslag?.getItem(sleutel) ?? null;
  } catch {
    return null;
  }
}

function schrijf(opslag: Storage | null, sleutel: string, waarde: string | null): void {
  try {
    if (waarde === null) opslag?.removeItem(sleutel);
    else opslag?.setItem(sleutel, waarde);
  } catch {
    // Een browser die niets wil bewaren, houdt de ouder buiten. Dat is zichtbaar
    // — het slot blijft dicht — en dus beter dan het slot stilletjes openzetten.
  }
}

function lokaal(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function sessie(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/**
 * De ruwe waarde van de sessie, als momentopname voor `useSyncExternalStore`.
 *
 * Een string en geen object, om de reden die `premium.ts` er ook voor geeft:
 * React vergelijkt momentopnames op identiteit, en een vers object per lezing
 * zou een renderlus zijn.
 */
export function leesRuw(): string | null {
  return lees(sessie(), SESSIE_SLEUTEL);
}

export function abonneer(luisteraar: () => void): () => void {
  luisteraars.add(luisteraar);
  // `sessionStorage` is per tabblad, dus een ander tabblad gaat deze sessie
  // niets aan. De pincode wél: wie hem op het ene tabblad zet, hoort hem op het
  // andere niet opnieuw te hoeven zetten.
  const opslag = (event: StorageEvent) => {
    if (event.key === OUDER_SLEUTEL) luisteraar();
  };
  window.addEventListener('storage', opslag);
  return () => {
    luisteraars.delete(luisteraar);
    window.removeEventListener('storage', opslag);
  };
}

// ---------------------------------------------------------------------------
// De pincode.

export function leesSlot(): Ouderslot | null {
  const ruw = lees(lokaal(), OUDER_SLEUTEL);
  if (ruw === null) return null;
  try {
    const waarde = JSON.parse(ruw) as Partial<Ouderslot> | null;
    if (
      typeof waarde?.salt !== 'string' ||
      typeof waarde.hash !== 'string' ||
      typeof waarde.iteraties !== 'number' ||
      typeof waarde.gezetOp !== 'string'
    ) {
      return null;
    }
    return {
      salt: waarde.salt,
      hash: waarde.hash,
      iteraties: waarde.iteraties,
      gezetOp: waarde.gezetOp,
    };
  } catch {
    return null;
  }
}

/** Of er op dit apparaat al een ouder is. */
export function isPinGezet(): boolean {
  return leesSlot() !== null;
}

/**
 * De volwassenencheck vóór het zetten of resetten van de pincode (ADR-176).
 *
 * **Waarom hij er is.** ADR-173 liet iedereen die als eerste bij de wisselaar
 * kwam de pincode zetten, op de aanname dat dat de ouder zou zijn. Die aanname
 * was niet alleen fout maar systematisch fout: het kind opent de app als eerste
 * — dat is precies het geval waar dit hele project over gaat. Een kind kon
 * daarmee zichzelf de instellingen geven, van de parental gate een poort maken
 * waarvan het zelf de sleutel uitdeelde, en de ouder buitensluiten met het
 * wissen van het apparaat als enige uitweg.
 *
 * **Waarom geen rekensom.** Dat is de gebruikelijke poort in apps voor
 * kinderen, en hier de slechtst denkbare: dit product leert kinderen tafels. We
 * zouden de poort bouwen die de app zelf traint om te openen.
 *
 * **Het jaar wordt gecontroleerd en weggegooid.** Het wordt nergens geschreven,
 * niet in de opslag en niet in een verzoek. Dat is geen detail maar de enige
 * reden dat dit te verenigen is met ADR-050, dat zegt dat dit product nooit een
 * geboortedatum vraagt: die regel gaat over het kind, en dit is een vraag aan de
 * volwassene waarvan het antwoord niet blijft bestaan.
 *
 * **En het blijft een hek en geen kluis.** Een twaalfjarige die het doorheeft,
 * tikt een jaartal in. Wat dit koopt is dat de zevenjarige er niet in wandelt,
 * dat de ouder niet buitengesloten raakt, en dat het product niet liegt over
 * wat het slot is — dezelfde eerlijkheid die ADR-116 over de premiumcode
 * opschreef.
 */
export const VOLWASSEN_VANAF = 18;
/** Ouder dan dit is geen antwoord maar een typefout. */
const OUDSTE = 120;

export function isVolwassenJaar(invoer: string, now: Date = new Date()): boolean {
  if (!/^\d{4}$/.test(invoer)) return false;
  const jaar = Number(invoer);
  const dit = now.getFullYear();
  return jaar <= dit - VOLWASSEN_VANAF && jaar >= dit - OUDSTE;
}

/** Vier cijfers, en niets anders. Geen spaties weghalen: dan zou 1 2 3 4 lukken. */
export function isGeldigePin(pin: string): boolean {
  return new RegExp(`^\\d{${PIN_LENGTE}}$`).test(pin);
}

function kluis(): SubtleCrypto | null {
  try {
    return globalThis.crypto?.subtle ?? null;
  } catch {
    return null;
  }
}

function naarBase64(bytes: Uint8Array): string {
  let tekst = '';
  for (const byte of bytes) tekst += String.fromCharCode(byte);
  return btoa(tekst);
}

function uitBase64(tekst: string): Uint8Array {
  const ruw = atob(tekst);
  const bytes = new Uint8Array(ruw.length);
  for (let i = 0; i < ruw.length; i += 1) bytes[i] = ruw.charCodeAt(i);
  return bytes;
}

async function leid(pin: string, salt: Uint8Array, iteraties: number): Promise<string | null> {
  const subtle = kluis();
  if (subtle === null) return null;

  const sleutel = await subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: iteraties, hash: 'SHA-256' },
    sleutel,
    256,
  );
  return naarBase64(new Uint8Array(bits));
}

/**
 * Een pincode zetten, of hem vervangen.
 *
 * Twee velden, want vier cijfers die je één keer typt en daarna elke keer nodig
 * hebt, zijn vier cijfers die je verkeerd typt. De salt is vers bij elke keer:
 * dezelfde pincode op twee apparaten hoort niet dezelfde afleiding te geven.
 */
export async function zetPin(pin: string, herhaling: string): Promise<OuderUitkomst> {
  if (!isGeldigePin(pin)) return { ok: false, reden: 'geen-cijfers', wachtSeconden: 0 };
  if (pin !== herhaling) return { ok: false, reden: 'ongelijk', wachtSeconden: 0 };

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await leid(pin, salt, ITERATIES);
  if (hash === null) return { ok: false, reden: 'geen-kluis', wachtSeconden: 0 };

  const slot: Ouderslot = {
    salt: naarBase64(salt),
    hash,
    iteraties: ITERATIES,
    gezetOp: new Date().toISOString(),
  };
  schrijf(lokaal(), OUDER_SLEUTEL, JSON.stringify(slot));
  wisPauze();
  meld();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// De pauze na drie missers.

interface Pauze {
  readonly missers: number;
  /** Tot wanneer er niet geprobeerd mag worden, als ISO-moment. */
  readonly tot: string | null;
}

function leesPauze(): Pauze {
  const ruw = lees(lokaal(), PAUZE_SLEUTEL);
  if (ruw === null) return { missers: 0, tot: null };
  try {
    const waarde = JSON.parse(ruw) as Partial<Pauze> | null;
    const missers = typeof waarde?.missers === 'number' ? waarde.missers : 0;
    const tot = typeof waarde?.tot === 'string' ? waarde.tot : null;
    return { missers, tot };
  } catch {
    return { missers: 0, tot: null };
  }
}

function wisPauze(): void {
  schrijf(lokaal(), PAUZE_SLEUTEL, null);
}

/**
 * Hoeveel seconden er nog gewacht moet worden. Nul als er niets te wachten valt.
 *
 * Naar boven afgerond, want "nog 0 seconden wachten" is geen zin die iemand
 * hoort te lezen terwijl de knop nog uit staat.
 */
export function wachtSeconden(now: Date = new Date()): number {
  const { tot } = leesPauze();
  if (tot === null) return 0;
  const over = new Date(tot).getTime() - now.getTime();
  return over > 0 ? Math.ceil(over / 1000) : 0;
}

// ---------------------------------------------------------------------------
// De sessie.

/** Tot wanneer de ouder aan zet is, of null. */
export function leesSessie(ruw: string | null = leesRuw()): Date | null {
  if (ruw === null) return null;
  const tot = new Date(ruw);
  return Number.isNaN(tot.getTime()) ? null : tot;
}

/** Of de ouder nu aan zet is. */
export function isOuder(ruw: string | null = leesRuw(), now: Date = new Date()): boolean {
  const tot = leesSessie(ruw);
  return tot !== null && tot.getTime() > now.getTime();
}

/**
 * De klok opnieuw op vijf minuten zetten.
 *
 * Elke handeling op de ouderpagina doet dit. Niet elke muisbeweging: wat telt
 * is dat er iemand aan het werk is, en een pagina die zichzelf openhoudt zolang
 * hij openstaat, is een pagina zonder slot.
 */
export function verleng(now: Date = new Date()): void {
  const tot = new Date(now.getTime() + SESSIE_MINUTEN * MINUUT_MS);
  schrijf(sessie(), SESSIE_SLEUTEL, tot.toISOString());
  meld();
}

/** Terug naar het kind. Ook wat de knop op de ouderpagina doet. */
export function sluit(): void {
  schrijf(sessie(), SESSIE_SLEUTEL, null);
  meld();
}

/**
 * De pincode proberen. Klopt hij, dan is de ouder aan zet.
 *
 * Het antwoord op een verkeerde pincode duurt even lang als dat op een goede:
 * de afleiding wordt altijd gedraaid, ook als er geen slot is. Anders is de
 * tijd zelf het antwoord op de vraag of er een ouder bestaat — dezelfde
 * redenering die ADR-155 voor de inlogcode van een kind maakt.
 */
export async function probeer(pin: string, now: Date = new Date()): Promise<OuderUitkomst> {
  const wacht = wachtSeconden(now);
  if (wacht > 0) return { ok: false, reden: 'te-vaak', wachtSeconden: wacht };

  const slot = leesSlot();
  const salt = slot === null ? crypto.getRandomValues(new Uint8Array(16)) : uitBase64(slot.salt);
  const hash = await leid(pin, salt, slot?.iteraties ?? ITERATIES);
  if (hash === null) return { ok: false, reden: 'geen-kluis', wachtSeconden: 0 };

  if (slot === null || hash !== slot.hash) {
    const missers = leesPauze().missers + 1;
    const pauze = missers >= POGINGEN_VOOR_PAUZE;
    schrijf(
      lokaal(),
      PAUZE_SLEUTEL,
      JSON.stringify({
        missers: pauze ? 0 : missers,
        tot: pauze ? new Date(now.getTime() + PAUZE_SECONDEN * 1000).toISOString() : null,
      } satisfies Pauze),
    );
    return {
      ok: false,
      reden: pauze ? 'te-vaak' : 'onjuist',
      wachtSeconden: pauze ? PAUZE_SECONDEN : 0,
    };
  }

  wisPauze();
  verleng(now);
  return { ok: true };
}

/**
 * Alles van de ouder van dit apparaat halen: de pincode, de pauze, de sessie.
 *
 * Hoort bij `wisAlles`, en sinds ADR-176 ook bij het vergeten van de pincode.
 * ADR-173 liet dat laatste met opzet niet toe — "een weg die alleen het slot
 * weghaalt zou geen slot zijn" — maar dat klopte alleen zolang de ouder degene
 * was die de pincode zette. Nu de volwassenencheck ervóór staat, is die check
 * de bescherming en niet het niet-kunnen-resetten. Een ouder die zijn code
 * kwijt is, hoefde daarvoor het apparaat te wissen; dat was geen slot maar een
 * val.
 */
export function vergeetOuder(): void {
  schrijf(lokaal(), OUDER_SLEUTEL, null);
  schrijf(lokaal(), PAUZE_SLEUTEL, null);
  schrijf(sessie(), SESSIE_SLEUTEL, null);
  meld();
}
