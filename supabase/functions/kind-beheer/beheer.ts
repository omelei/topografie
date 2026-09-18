/**
 * Wat een ouder met een kind kan: aanmaken, een nieuwe code, een nieuw
 * wachtwoord, weghalen (ADR-155).
 *
 * Puur, net als `kassa.ts` en `inloggen.ts`: wat de buitenwereld doet gaat via
 * `Diensten` naar binnen. Wat hier staat is welke handelingen er zijn, wie ze
 * mag doen, en wat er precies gebeurt — en dat laatste is bij "nieuwe code" en
 * "nieuw wachtwoord" meer dan één ding.
 *
 * **Waarom dit niet met RLS kan.** Een kind aanmaken betekent een gebruiker
 * aanmaken, en een wachtwoord zetten betekent aan `auth.users` komen. Daar is de
 * service-sleutel voor nodig, en die hoort nergens in een browser. Dus loopt het
 * hierlangs, en controleert deze functie zelf wat de policy anders gedaan had:
 * is de beller een ouder, en is dit kind van hém.
 */

import { adresVoorKind, wachtwoordOordeel, type WachtwoordFout } from '../_gezin/code.ts';

export type BeheerFout =
  | 'geen-ouder'
  | 'niet-jouw-kind'
  | 'onbekende-actie'
  | 'naam-leeg'
  | 'groep-onbekend'
  | WachtwoordFout;

export class BeheerProbleem extends Error {
  constructor(readonly reden: BeheerFout) {
    super(reden);
    this.name = 'BeheerProbleem';
  }
}

export interface NieuwKind {
  readonly id: string;
  readonly voornaam: string;
  readonly inlogcode: string;
}

export interface Diensten {
  /** Het token van de beller omzetten in een ouder-id, of niets. */
  readonly ouderVoorToken: (token: string) => Promise<string | null>;
  /** Een gebruiker aanmaken met een wachtwoord; geeft de nieuwe id terug. */
  readonly maakGebruiker: (wachtwoord: string) => Promise<string>;
  /** Het adres van een gebruiker zetten, nu zijn id bekend is. */
  readonly zetAdres: (gebruikerId: string, adres: string) => Promise<void>;
  readonly zetWachtwoord: (gebruikerId: string, wachtwoord: string) => Promise<void>;
  readonly verwijderGebruiker: (gebruikerId: string) => Promise<void>;
  /** Alle lopende sessies van een gebruiker ongeldig maken. */
  readonly trekSessiesIn: (gebruikerId: string) => Promise<void>;
  /** De rij in `kinderen` schrijven. De code komt van de database. */
  readonly bewaarKind: (kind: {
    readonly id: string;
    readonly ouderId: string;
    readonly voornaam: string;
    readonly groep: number | null;
  }) => Promise<void>;
  /** `gezin_code_uitgeven`: een nieuwe unieke code, door de database gekozen. */
  readonly codeUitgeven: (kindId: string) => Promise<string>;
  /** Van wie is dit kind, en hoe heet het? Niets als het niet bestaat. */
  readonly kind: (
    kindId: string,
  ) => Promise<{ readonly ouderId: string; readonly voornaam: string } | null>;
}

export interface Verzoek {
  readonly token: string;
  readonly actie: unknown;
  readonly kindId: unknown;
  readonly voornaam: unknown;
  readonly wachtwoord: unknown;
  readonly groep: unknown;
}

function tekst(waarde: unknown): string {
  return typeof waarde === 'string' ? waarde : '';
}

function leesGroep(waarde: unknown): number | null {
  if (waarde === null || waarde === undefined || waarde === '') return null;
  const groep = typeof waarde === 'number' ? waarde : Number(waarde);
  if (!Number.isInteger(groep) || groep < 3 || groep > 8) throw new BeheerProbleem('groep-onbekend');
  return groep;
}

async function eigenKind(
  kindId: unknown,
  ouderId: string,
  diensten: Diensten,
): Promise<{ readonly id: string; readonly voornaam: string }> {
  const id = tekst(kindId);
  const kind = id.length === 0 ? null : await diensten.kind(id);
  // Eén antwoord voor "bestaat niet" en "is niet van jou". Het tweede zou
  // vertellen welke kind-ids bestaan, en daar heeft niemand iets te zoeken.
  if (kind === null || kind.ouderId !== ouderId) throw new BeheerProbleem('niet-jouw-kind');
  return { id, voornaam: kind.voornaam };
}

/**
 * Een kind aanmaken.
 *
 * In twee stappen, omdat het adres uit de id komt en die id pas bestaat nadat
 * de gebruiker is aangemaakt. Allebei de adressen zitten op `.invalid`, dus ook
 * tussen de twee stappen in kan er geen post heen.
 */
export async function maakKind(
  verzoek: Verzoek,
  ouderId: string,
  diensten: Diensten,
): Promise<NieuwKind> {
  const voornaam = tekst(verzoek.voornaam).trim();
  if (voornaam.length === 0 || voornaam.length > 40) throw new BeheerProbleem('naam-leeg');

  const groep = leesGroep(verzoek.groep);
  const wachtwoord = tekst(verzoek.wachtwoord);
  const oordeel = wachtwoordOordeel(wachtwoord, voornaam);
  if (oordeel !== null) throw new BeheerProbleem(oordeel);

  const id = await diensten.maakGebruiker(wachtwoord);
  await diensten.zetAdres(id, adresVoorKind(id));
  await diensten.bewaarKind({ id, ouderId, voornaam, groep });
  const inlogcode = await diensten.codeUitgeven(id);
  return { id, voornaam, inlogcode };
}

/**
 * Een nieuwe inlogcode. De oude werkt daarna niet meer — hij wordt overschreven
 * en nergens bewaard, want een code die nog half werkt is geen herstel.
 */
export async function nieuweCode(
  verzoek: Verzoek,
  ouderId: string,
  diensten: Diensten,
): Promise<string> {
  const kind = await eigenKind(verzoek.kindId, ouderId, diensten);
  return diensten.codeUitgeven(kind.id);
}

/**
 * Een nieuw wachtwoord, en overal uitloggen.
 *
 * Het intrekken hoort erbij en is niet netjesheid: wie het wachtwoord opnieuw
 * zet, doet dat meestal omdat iemand anders het kende. Een oude sessie die
 * gewoon doorloopt, maakt dat ongedaan.
 */
export async function nieuwWachtwoord(
  verzoek: Verzoek,
  ouderId: string,
  diensten: Diensten,
): Promise<void> {
  const kind = await eigenKind(verzoek.kindId, ouderId, diensten);
  const wachtwoord = tekst(verzoek.wachtwoord);
  const oordeel = wachtwoordOordeel(wachtwoord, kind.voornaam);
  if (oordeel !== null) throw new BeheerProbleem(oordeel);
  await diensten.zetWachtwoord(kind.id, wachtwoord);
  await diensten.trekSessiesIn(kind.id);
}

/**
 * Een kind weghalen.
 *
 * Alleen de gebruiker wordt verwijderd; alle rijen van dat kind hangen met
 * `on delete cascade` aan `kinderen`, dat zelf aan `auth.users` hangt. Eén
 * handeling, en er blijft niets van dit kind staan — dat is wat "verwijderen"
 * hoort te betekenen als het in een privacyverklaring staat.
 */
export async function verwijderKind(
  verzoek: Verzoek,
  ouderId: string,
  diensten: Diensten,
): Promise<void> {
  const kind = await eigenKind(verzoek.kindId, ouderId, diensten);
  await diensten.verwijderGebruiker(kind.id);
}

export type Antwoord =
  | { readonly kind: NieuwKind }
  | { readonly inlogcode: string }
  | { readonly ok: true };

export async function behandel(verzoek: Verzoek, diensten: Diensten): Promise<Antwoord> {
  const ouderId = await diensten.ouderVoorToken(verzoek.token);
  if (ouderId === null) throw new BeheerProbleem('geen-ouder');

  switch (tekst(verzoek.actie)) {
    case 'aanmaken':
      return { kind: await maakKind(verzoek, ouderId, diensten) };
    case 'nieuwe-code':
      return { inlogcode: await nieuweCode(verzoek, ouderId, diensten) };
    case 'wachtwoord':
      await nieuwWachtwoord(verzoek, ouderId, diensten);
      return { ok: true };
    case 'verwijderen':
      await verwijderKind(verzoek, ouderId, diensten);
      return { ok: true };
    default:
      throw new BeheerProbleem('onbekende-actie');
  }
}
