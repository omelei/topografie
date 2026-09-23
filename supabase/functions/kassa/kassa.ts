/**
 * De kassa: van betaling naar code (ADR-123).
 *
 * Alles hier is puur — geen netwerk, geen database, geen klok. Wat de buitenwereld
 * doet gaat door `Diensten` naar binnen, zodat elke stap in `kassa.test.ts` met
 * neppe diensten na te spelen is. `index.ts` is het enige bestand dat Deno,
 * Mollie, Supabase en de mailer echt aanraakt.
 *
 * **Wat er bewaard wordt.** Van een bestelling: het betaal-id van Mollie, de hash
 * van de code, en de code zelf tot hij is opgehaald en gemaild. Geen naam, geen
 * adres, en vooral geen e-mailadres: dat blijft bij Mollie, die het voor de
 * transactie toch al moet bewaren, en de webhook leest het daar per keer op.
 * Dat is dezelfde keuze als ADR-116 voor de code maakte, doorgetrokken naar de
 * verkoop: bewaar wat de dienst nodig heeft en niets erbij.
 *
 * **Waarom de code even in het klaar staat.** ADR-116 bewaart alleen hashes, en
 * dat is goed voor een code die met de hand is uitgedeeld. Bij een betaling komt
 * er een plicht bij: er is betaald, dus de code móét aankomen. Als het mailen
 * mislukt nadat de hash is opgeslagen, is een code die alleen als hash bestaat
 * voorgoed weg en heeft een ouder betaald voor niets. Daarom staat de code in
 * `code_klaar` tot hij gemaild is en de bestelling dertig dagen oud is, en ruimt
 * `premium_bestellingen_opschonen` hem daarna op.
 */

/** Wat een jaar premium kost, in centen. Eén plek; ADR-123 legt uit waarom dit bedrag. */
export const PRIJS_CENTEN = 7995;
export const VALUTA = 'EUR';

/** Wat er op het rekeningafschrift en in de Mollie-omschrijving staat. */
export const OMSCHRIJVING = 'leer.nu premium — een jaar';

/** Hoe lang een gekochte code geldt, en op hoeveel apparaten (ADR-116). */
export const GELDIG_DAGEN = 365;
export const MAX_APPARATEN = 3;

/**
 * Hetzelfde alfabet en dezelfde lengte als `tools/premium/maak-codes.mjs`: zonder
 * 0, O, 1, I en L, want dat zijn de tekens die een ouder van het scherm verkeerd
 * overtypt. `kassa.test.ts` houdt de twee gelijk.
 */
export const ALFABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const LENGTE = 8;

/** Een e-mailadres zoals een formulier het mag doorlaten: streng genoeg om een typefout te vangen, niet strenger. */
export function normaliseerEmail(invoer: string): string {
  return invoer.trim().toLowerCase();
}

export function isEmail(invoer: string): boolean {
  const adres = normaliseerEmail(invoer);
  if (adres.length === 0 || adres.length > 254) return false;
  return /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(adres);
}

/**
 * Een code van acht tekens, zonder scheefheid.
 *
 * 256 is geen veelvoud van 31, dus een byte zomaar op het alfabet leggen maakt de
 * eerste acht letters iets waarschijnlijker dan de rest. Bytes vanaf 248 worden
 * daarom weggegooid en opnieuw getrokken — dezelfde eerlijkheid die `randomInt`
 * in het node-script gratis geeft.
 */
export function nieuweCode(willekeur: (lengte: number) => Uint8Array): string {
  const grens = 256 - (256 % ALFABET.length);
  let code = '';
  while (code.length < LENGTE) {
    for (const byte of willekeur(LENGTE * 2)) {
      if (byte >= grens) continue;
      const teken = ALFABET[byte % ALFABET.length];
      if (teken === undefined) continue;
      code += teken;
      if (code.length === LENGTE) break;
    }
  }
  return code;
}

/** "LEER-7K3M-Q9TX": de code zoals een ouder hem leest en overtypt. */
export function codeVoorMens(code: string): string {
  return `LEER-${code.slice(0, 4)}-${code.slice(4)}`;
}

/** Dezelfde hash als `premium_hash` in het schema en `maak-codes.mjs`: SHA-256 van de acht tekens. */
export async function hashVanCode(code: string): Promise<string> {
  const ruw = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code));
  return [...new Uint8Array(ruw)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** Tot en met welke dag een vandaag gekochte code geldt, als YYYY-MM-DD. */
export function geldigTot(nu: Date): string {
  const tot = new Date(nu.getTime() + GELDIG_DAGEN * 86_400_000);
  return tot.toISOString().slice(0, 10);
}

/** Het bedrag zoals Mollie het wil: een string met twee decimalen. */
export function bedragVoorMollie(centen: number = PRIJS_CENTEN): string {
  return (centen / 100).toFixed(2);
}

/** Het bedrag zoals een ouder het leest: "€ 79,95". */
export function bedragVoorMens(centen: number = PRIJS_CENTEN): string {
  return `€ ${(centen / 100).toFixed(2).replace('.', ',')}`;
}

/** "13 september 2027", zoals een ouder een datum leest. */
export function leesbareDatum(dag: string): string {
  return new Intl.DateTimeFormat('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${dag}T12:00:00Z`));
}

/**
 * De mail met de code erin.
 *
 * Plat en kort, want het enige wat telt is dat de code overkomt en dat duidelijk
 * is wat je ermee doet. Geen plaatjes, geen knoppen die naar iets anders leiden,
 * geen "klik hier" — een mail die eruitziet als reclame komt in de map waar een
 * ouder hem niet zoekt.
 */
export function mailVoorCode(input: {
  readonly code: string;
  readonly geldigTot: string;
  readonly premiumUrl: string;
}): { readonly onderwerp: string; readonly tekst: string; readonly html: string } {
  const code = codeVoorMens(input.code);
  const tot = leesbareDatum(input.geldigTot);
  // De code vult een ouder in op de ouderpagina (ADR-173), niet op de
  // premiumpagina. Het adres van de premiumpagina staat in de configuratie;
  // de ouderpagina ligt ernaast.
  const ouderUrl = input.premiumUrl.replace(/\/premium\/?$/, '/ouder');

  const tekst = [
    'Bedankt. Hier is je code voor leer.nu premium:',
    '',
    `    ${code}`,
    '',
    `Vul hem in op de ouderpagina: ${ouderUrl}. Hij geldt tot en met ${tot},`,
    `voor alle kinderen thuis, op maximaal ${MAX_APPARATEN} apparaten.`,
    '',
    'Bewaar deze mail: de code staat nergens anders. Wij bewaren hem niet in',
    'leesbare vorm, dus kwijt is kwijt — dan maken we een nieuwe.',
    '',
    'leer.nu',
  ].join('\n');

  const html = [
    '<p>Bedankt. Hier is je code voor leer.nu premium:</p>',
    `<p style="font-size:24px;font-weight:700;letter-spacing:1px">${code}</p>`,
    `<p>Vul hem in op de ouderpagina: <a href="${ouderUrl}">${ouderUrl}</a>.`,
    ` Hij geldt tot en met ${tot}, voor alle kinderen thuis,`,
    ` op maximaal ${MAX_APPARATEN} apparaten.</p>`,
    '<p>Bewaar deze mail: de code staat nergens anders. Wij bewaren hem niet in',
    ' leesbare vorm, dus kwijt is kwijt — dan maken we een nieuwe.</p>',
    '<p>leer.nu</p>',
  ].join('');

  return { onderwerp: 'Je code voor leer.nu premium', tekst, html };
}

// ---------------------------------------------------------------------------
// De diensten die van buiten komen, en de drie dingen die de kassa doet.

export interface Betaling {
  readonly id: string;
  /** Mollie's eigen woord: open, pending, paid, canceled, expired, failed. */
  readonly status: string;
  readonly email: string | null;
}

export interface Bestelling {
  /** Vals als deze betaling al eerder een code kreeg: dan is er niets nieuws gemaakt. */
  readonly nieuw: boolean;
  /** De code in leesbare vorm, zolang hij nog niet is opgehaald en opgeruimd. */
  readonly code: string | null;
  readonly geldigTot: string;
  readonly gemaild: boolean;
}

export interface Diensten {
  readonly mollie: {
    maakBetaling(input: {
      readonly bedrag: string;
      readonly valuta: string;
      readonly omschrijving: string;
      readonly email: string;
      readonly terugUrl: string;
      readonly webhookUrl: string;
    }): Promise<{ readonly id: string; readonly checkoutUrl: string }>;
    leesBetaling(id: string): Promise<Betaling>;
  };
  readonly db: {
    /** Idempotent: dezelfde betaling levert dezelfde bestelling, nooit een tweede code. */
    legVast(input: {
      readonly betaling: string;
      readonly codeHash: string;
      readonly code: string;
      readonly geldigTot: string;
    }): Promise<Bestelling>;
    lees(betaling: string): Promise<Bestelling | null>;
    noteerGemaild(betaling: string): Promise<void>;
  };
  readonly mail: {
    stuur(input: {
      readonly aan: string;
      readonly onderwerp: string;
      readonly tekst: string;
      readonly html: string;
    }): Promise<void>;
  };
  readonly nu: () => Date;
  readonly willekeur: (lengte: number) => Uint8Array;
  readonly premiumUrl: string;
  readonly terugUrl: string;
  readonly webhookUrl: string;
}

/**
 * Wat er misging, in twee lagen.
 *
 * `reden` gaat terug naar de browser en is met opzet grof: "mollie", niet wat
 * Mollie precies zei. Wat een dienst antwoordt kan de naam van een tabel of een
 * kolom bevatten, en dat hoort niet in het scherm van iemand die toevallig een
 * verzoek doet. `detail` gaat naar de log, waar het thuishoort.
 */
export class KassaFout extends Error {
  constructor(
    readonly code: number,
    readonly reden: string,
    readonly detail: string | null = null,
  ) {
    super(detail === null ? reden : `${reden}: ${detail}`);
    this.name = 'KassaFout';
  }
}

/**
 * Stap 1: een ouder vult een e-mailadres in en wil betalen.
 *
 * Het adres gaat mee als metadata naar Mollie en verder nergens heen. De
 * terug-url krijgt het betaal-id mee, zodat de pagina na afloop kan vragen hoe
 * het afliep zonder dat wij iets hoeven te onthouden.
 */
export async function startBestelling(email: string, diensten: Diensten) {
  const adres = normaliseerEmail(email);
  if (!isEmail(adres)) throw new KassaFout(400, 'geen-geldig-adres');

  const betaling = await diensten.mollie.maakBetaling({
    bedrag: bedragVoorMollie(),
    valuta: VALUTA,
    omschrijving: OMSCHRIJVING,
    email: adres,
    terugUrl: diensten.terugUrl,
    webhookUrl: diensten.webhookUrl,
  });

  return { betaling: betaling.id, checkoutUrl: betaling.checkoutUrl };
}

/**
 * Stap 2: Mollie meldt dat er iets met een betaling gebeurd is.
 *
 * Mollie stuurt niets anders dan een id — geen bedrag, geen handtekening — dus
 * het enige wat telt is wat Mollie zelf zegt als wij het ophalen. Alles hier
 * hangt aan `leesBetaling`, en niets aan wat er in het verzoek stond.
 *
 * Twee keer dezelfde melding mag geen twee codes maken en geen twee mails
 * sturen, en Mollie stuurt met opzet vaker. `legVast` is daarom idempotent, en
 * het mailen hangt aan `gemaild` en niet aan `nieuw`: als de vorige poging de
 * code wél vastlegde maar de mail niet rondkreeg, doet deze poging alsnog het
 * stuk dat ontbrak.
 */
export async function verwerkWebhook(betalingId: string, diensten: Diensten): Promise<void> {
  if (betalingId.trim() === '') throw new KassaFout(400, 'geen-betaling');

  const betaling = await diensten.mollie.leesBetaling(betalingId);
  // Alles behalve betaald is een melding om niets te doen: een geannuleerde of
  // verlopen betaling hoort geen code te maken, en Mollie meldt die ook.
  if (betaling.status !== 'paid') return;

  const code = nieuweCode(diensten.willekeur);
  const bestelling = await diensten.db.legVast({
    betaling: betaling.id,
    codeHash: await hashVanCode(code),
    code,
    geldigTot: geldigTot(diensten.nu()),
  });

  if (bestelling.gemaild) return;

  const teMailen = bestelling.code;
  if (teMailen === null) {
    // De code is al opgeruimd maar de mail stond nog open: dat kan alleen als er
    // dertig dagen tussen zaten. Niets meer te sturen; met de hand een nieuwe.
    throw new KassaFout(410, 'code-opgeruimd');
  }

  if (betaling.email === null) throw new KassaFout(422, 'geen-adres-bij-betaling');

  const mail = mailVoorCode({
    code: teMailen,
    geldigTot: bestelling.geldigTot,
    premiumUrl: diensten.premiumUrl,
  });
  await diensten.mail.stuur({ aan: betaling.email, ...mail });
  await diensten.db.noteerGemaild(betaling.id);
}

/**
 * Stap 3: de pagina waar Mollie de ouder heen stuurt vraagt hoe het afliep.
 *
 * De code komt hier terug zolang hij er nog is, zodat een ouder hem meteen kan
 * overtypen en niet op de mail hoeft te wachten. Het e-mailadres komt niet terug:
 * een betaal-id in een adresbalk is geen bewijs dat je die ouder bent.
 */
export async function leesStatus(
  betalingId: string,
  diensten: Diensten,
): Promise<{
  readonly status: 'betaald' | 'bezig' | 'mislukt';
  readonly code: string | null;
  readonly geldigTot: string | null;
}> {
  if (betalingId.trim() === '') throw new KassaFout(400, 'geen-betaling');

  const betaling = await diensten.mollie.leesBetaling(betalingId);
  if (betaling.status === 'open' || betaling.status === 'pending') {
    return { status: 'bezig', code: null, geldigTot: null };
  }
  if (betaling.status !== 'paid') return { status: 'mislukt', code: null, geldigTot: null };

  const bestelling = await diensten.db.lees(betaling.id);
  // Betaald, maar de webhook is er nog niet langs: de pagina vraagt zo nog eens.
  if (bestelling === null) return { status: 'bezig', code: null, geldigTot: null };

  return {
    status: 'betaald',
    code: bestelling.code === null ? null : codeVoorMens(bestelling.code),
    geldigTot: bestelling.geldigTot,
  };
}
