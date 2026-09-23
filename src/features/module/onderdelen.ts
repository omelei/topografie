import {
  kiesVoorGroep,
  opGroep,
  type Groep,
  type ItemState,
  type ModeId,
  type Schedulable,
  type TaalDeel,
} from '@/game-core';
import { loadItemSets } from '@/content/loadSets';
import { groepenVan, indelingVoor } from './groepen';
import {
  isTaalMix,
  loadTaalSet,
  loadTaalSets,
  TAAL_FOUTEN,
  TAAL_MIX,
  taalDeelVan,
  type TaalSet,
} from '@/content/loadTaal';
import { KIES_VORM, type TaalMode } from '@/features/taal/taalRegels';
import { itemId, leesLijsten, setIdVan } from '@/store/woordlijsten';
import { EIGEN_DEEL } from './regios';
import { isMix, loadSumSet, loadSumSets, MIX_IDS } from '@/content/loadSums';
import { KLOK_FOUTEN_ID, KLOK_MIX_ID, loadKlokSet, loadKlokSets } from '@/content/loadKlok';
import { loadVlagSet, loadVlagSets, type VlagOnderwerp, type VlagSet } from '@/content/loadVlaggen';
import { t, type TranslationKey } from '@/i18n';
import type { Module } from '@/features/shell/modules';
import type { PlayedRound } from '@/store/progress';
import {
  FOUTEN_SET_IDS,
  MIX_SET_ID,
  NL_SET_IDS,
  SET_IDS,
  setsInRound,
  type FoutenSetId,
  type PracticeMode,
  type SetId,
} from '@/features/practice/useRound';
import type { SumMode } from '@/features/sums/useSumRound';
import type { KlokMode } from '@/features/klok/useKlokRound';
import type { VlagMode } from '@/features/vlaggen/useVlagRound';
import { vlagSetNaam } from '@/features/vlaggen/vlagNamen';

/**
 * Every set of every built module, and the subjects they are grouped under.
 *
 * This was the top of `HomeScreen`, and it moved because it stopped being the
 * front door's private business: a module page asks the same three questions of
 * a set that K1 does — how much of it is remembered, when was it last touched,
 * what would a round of it look like — and a second copy of those three is a
 * second place to forget a module.
 *
 * **Two layers, since rekenen grew past the tables (ADR-062).** An *onderdeel*
 * is a set: ten sums, twelve provinces, the thing a round is made of. An
 * *onderwerp* is what step 1 offers: "Tafels", "Provincies", "Rekenmix". Where
 * a subject holds one set the two are the same thing and the page shows one
 * card. Where it holds twelve — the twelve tables — the page shows one card
 * and asks which, because twelve cards for one subject
 * is a page a child scrolls past rather than reads, and it pushed step 2 off
 * the screen on the page whose whole argument is that the two steps are one
 * flow (ADR-061 gives step 2 the same ceiling for the same reason).
 */

export const SET_NAME_KEY: Record<SetId, TranslationKey> = {
  'nl-provincies': 'set.nl-provincies',
  'nl-hoofdsteden': 'set.nl-hoofdsteden',
  'nl-waddeneilanden': 'set.nl-waddeneilanden',
  'nl-wateren': 'set.nl-wateren',
  'nl-steden': 'set.nl-steden',
  'europa-landen': 'set.europa-landen',
  'afrika-landen': 'set.afrika-landen',
  'azie-landen': 'set.azie-landen',
  'noord-amerika-landen': 'set.noord-amerika-landen',
  'zuid-amerika-landen': 'set.zuid-amerika-landen',
  'oceanie-landen': 'set.oceanie-landen',
  'wereld-landen': 'set.wereld-landen',
};

/**
 * What one round of this set asks. Topography samples large sets; a table is
 * whole; the clock is ten, because ten faces is a round and a hundred and
 * forty-four of them is an afternoon. Taal is ten for the same reason: forty
 * words of ei and ij is a week's list, not a round (ADR-118).
 */
export const ROUND_SIZE = { topo: 15, tafels: 10, klok: 10, vlaggen: 10, taal: 10 } as const;

/**
 * How many cards the front door's "meest geoefend" row holds: five, which is
 * what the handoff draws in a row that scrolls rather than wraps (ADR-094).
 */
export const POPULAR_SHOWN = 5;

/**
 * What a child who has never played anything is offered instead.
 *
 * Five sets and the way each of them begins. Not a guess at what is popular
 * with anybody else — there is no anybody else to ask, because there is no
 * backend and nothing is sent anywhere (ADR-015). A number like "3.412 keer
 * gespeeld" would have to be invented, and this product does not put invented
 * numbers in front of children.
 *
 * So they are named as what they are: the ones to start with. The first a
 * Dutch child meets in topography, in rekenen, on the clock, in flags and in
 * Taal. Five, because that is what the row holds (ADR-094): the flags took the
 * places of the capitals and the sums to twenty (ADR-102), and Taal's ei or ij
 * took the second flags card, the world's well-known flags, so that every
 * module has one card and none has two (ADR-118).
 */
const STARTERS: readonly { readonly setId: string; readonly mode: ModeId }[] = [
  // Meerkeuze, want de eerste kaart hoort een kind zonder code niet naar een
  // slot te sturen (ADR-192).
  { setId: 'nl-provincies', mode: 'meerkeuze' },
  { setId: 'tafel-2', mode: 'som-meerkeuze' },
  { setId: 'klok-heel', mode: 'klok-meerkeuze' },
  { setId: 'vlag-europa-bekend', mode: 'vlag-meerkeuze' },
  { setId: 'taal-sp-eiij', mode: 'taal-letters' },
];

/**
 * Hoeveel fouten er in één set moeten staan voordat "Je fouten" aangeboden
 * wordt.
 *
 * Het stond op vijf, en dat was de goede lat voor wat het toen was: een
 * onderwerp over een hele module — elke fout in rekenen, elke fout op een
 * kaart. Sinds ADR-168 is het een spelvorm op de set die er al gekozen is, en
 * daar is dezelfde vijf te hoog: een tafel heeft tien sommen, en wie er vijf
 * van fout heeft, heeft de tafel niet. Drie is wat er overblijft van dezelfde
 * redenering op de nieuwe maat — onder drie is het geen ronde maar een lijstje,
 * en het spaart een kind nog steeds zijn allereerste fout als kop boven een
 * knop.
 */
export const MIN_FOUTEN = 3;

/**
 * De onderdelen van deze set die dit kind wel eens fout had.
 *
 * Eén regel, op één plek, want elke module stelt hem: `foutCount` is wat er van
 * een fout bewaard wordt (`leitner.ts`) en het is nooit iets anders geweest.
 */
export function fouteItems(
  deel: Onderdeel,
  known: ReadonlyMap<string, ItemState>,
): readonly string[] {
  return deel.items.filter((item) => (known.get(item.id)?.foutCount ?? 0) > 0).map((i) => i.id);
}

/**
 * Of dit onderwerp een mix van de andere is.
 *
 * Afgeleid en niet nog eens opgeschreven: een set weet zelf al of hij een mix
 * is (`Onderdeel.mix`), en een onderwerp is er een als al zijn sets dat zijn.
 * Zo kan de Keersommen — die één mix onder zich heeft, `keer-10` — nooit per
 * ongeluk achteraan belanden, en hoeft er bij een nieuw vak niets onthouden te
 * worden.
 */
export function isMixOnderwerp(vak: Onderwerp): boolean {
  return vak.sets.length > 0 && vak.sets.every((deel) => deel.mix);
}

export interface Onderdeel {
  readonly moduleId: Module['id'];
  readonly setId: string;
  readonly naam: TranslationKey | null;
  readonly literalNaam: string | null;
  /**
   * The label on the chip when this set is one choice among several — "7" under
   * Tafels, "tot 100" under Plussommen. The full name is still the accessible
   * name of the chip: "7" on its own is not something a screen reader can make
   * a sentence of.
   */
  readonly kortNaam: string | null;
  /**
   * True where this set is the union of others rather than one of its own.
   *
   * It matters wherever sets are counted or compared: a mix holds every item
   * there is, so it is the biggest set, the one with the most due, and the one
   * a naive "which needs doing most" would pick every single time.
   */
  readonly mix: boolean;
  readonly items: readonly Schedulable[];
  readonly roundSize: number;
}

/**
 * A subject: what step 1 offers, and the sets under it.
 *
 * Six at most per section, which is the same ceiling step 2 has and for the
 * same reason — past six a grid stops being one glance.
 */
export interface Onderwerp {
  readonly moduleId: Module['id'];
  readonly id: string;
  readonly naam: TranslationKey;
  /** One line under the name, where the name alone does not say what is in it. */
  readonly uitleg: TranslationKey | null;
  /** The question above the chips. Null for a subject that is one set. */
  readonly keuze: TranslationKey | null;
  /**
   * Where on the map this subject is, for the modules that have a where — and
   * for Taal, which part it is in: Spelling or Werkwoorden (ADR-118).
   *
   * Null on rekenen and the clock, and it is a plain string rather than
   * `Regio['id']` so that `regios.ts` can import from here without this file
   * importing back (ADR-083).
   */
  readonly regio: string | null;
  readonly sets: readonly Onderdeel[];
}

// ---------------------------------------------------------------------------
// Topografie

function topoOnderdelen(): Onderdeel[] {
  // In the curated order, not the order the filenames sort in. It decides what
  // a child who has never practised is offered first, and that should be the
  // set the content calls the way in — provinces — rather than whichever JSON
  // file happens to come first in the alphabet.
  const sets = loadItemSets();

  return SET_IDS.map((id) => sets.find((set) => set.id === id))
    .filter((set): set is (typeof sets)[number] => set !== undefined)
    .map((set) => ({
      moduleId: 'topo' as const,
      setId: set.id,
      naam: SET_NAME_KEY[set.id as SetId] ?? null,
      literalNaam: null,
      kortNaam: null,
      mix: false,
      items: set.items as readonly Schedulable[],
      roundSize: ROUND_SIZE.topo,
    }));
}

/**
 * Everything on the map at once.
 *
 * The same items under a second name rather than a sixth set of them, so a
 * province answered here moves the box it moves anywhere else. It is not
 * counted as part of the module's total anywhere, because that total would then
 * count every province twice (`onderdelen` leaves the mixes out).
 */
function topoMix(): Onderdeel {
  // The Dutch five, not every set there is. A mix is one round on one map, and
  // the countries of Europe are a different map (see NL_SET_IDS).
  const items = topoOnderdelen()
    .filter((deel) => NL_SET_IDS.includes(deel.setId as SetId))
    .flatMap((deel) => deel.items);

  return {
    moduleId: 'topo',
    setId: MIX_SET_ID,
    naam: 'set.nl-mix',
    literalNaam: null,
    kortNaam: null,
    mix: true,
    items,
    roundSize: ROUND_SIZE.topo,
  };
}

/** What each map's list of mistakes is called. */
const TOPO_FOUTEN_NAAM: Record<FoutenSetId, TranslationKey> = {
  'nl-fouten': 'set.nl-fouten',
  'europa-fouten': 'set.europa-fouten',
  'afrika-fouten': 'set.afrika-fouten',
  'azie-fouten': 'set.azie-fouten',
  'noord-amerika-fouten': 'set.noord-amerika-fouten',
  'zuid-amerika-fouten': 'set.zuid-amerika-fouten',
  'oceanie-fouten': 'set.oceanie-fouten',
  'wereld-fouten': 'set.wereld-fouten',
};

/** One map's list of mistakes, over every item that map can ask. */
function topoFoutenOnderdeel(id: FoutenSetId): Onderdeel {
  const wanted: readonly string[] = setsInRound(id);

  return {
    moduleId: 'topo',
    setId: id,
    naam: TOPO_FOUTEN_NAAM[id],
    literalNaam: null,
    kortNaam: null,
    mix: false,
    items: topoOnderdelen()
      .filter((deel) => wanted.includes(deel.setId))
      .flatMap((deel) => deel.items),
    roundSize: ROUND_SIZE.topo,
  };
}

// ---------------------------------------------------------------------------
// Rekenen

/**
 * What a range of sums is called, by the kind in front of its ceiling. Every
 * kind but the tables comes in ranges (ADR-120), and "tot 100" means the same
 * on every one of them: no number in the sum is bigger.
 */
const BEREIK_NAAM: Record<string, TranslationKey> = {
  plus: 'sums.plusUpTo',
  min: 'sums.minusUpTo',
  keer: 'sums.timesUpTo',
  delen: 'sums.divideUpTo',
  splitsen: 'sums.splitUpTo',
  halveren: 'sums.halveUpTo',
  verdubbelen: 'sums.doubleUpTo',
};

/** The name of a set of sums, and the short label on its chip. */
function rekenNaam(setId: string): { naam: string; kort: string } {
  const tafel = /^tafel-(\d+)$/.exec(setId)?.[1];
  if (tafel) return { naam: t('sums.table', { tafel }), kort: tafel };

  const bereik = /^(plus|min|keer|delen|splitsen|halveren|verdubbelen)-(\d+)$/.exec(setId);
  const soort = bereik?.[1];
  const grens = bereik?.[2];
  if (soort && grens) {
    return {
      naam: t(BEREIK_NAAM[soort] ?? 'sums.plusUpTo', { grens }),
      kort: t('sums.upTo', { grens }),
    };
  }

  if (setId === 'tafels-alle') return { naam: t('sums.allTables'), kort: t('sums.allShort') };
  if (setId === 'deel-alle') return { naam: t('sums.allDivides'), kort: t('sums.allShort') };
  if (setId === 'fouten') return { naam: t('sums.mistakes'), kort: t('sums.mistakes') };

  // The Rekenmix in three difficulties and an everything. The level is the one
  // every set already carried and nothing else ever read out loud: one is a
  // rule you can say, three is the tables that get learned last (ADR-073).
  const mixNiveau = /^rekenmix-(\d)$/.exec(setId)?.[1];
  if (mixNiveau) {
    return {
      naam: t(`sums.mixLevel${mixNiveau}` as TranslationKey),
      kort: t(`sums.mixLevel${mixNiveau}.kort` as TranslationKey),
    };
  }

  return { naam: t('sums.mix'), kort: t('sums.allShort') };
}

function rekenOnderdeel(setId: string): Onderdeel | null {
  const set = loadSumSet(setId);
  if (!set) return null;
  const { naam, kort } = rekenNaam(setId);

  return {
    moduleId: 'tafels',
    setId,
    naam: null,
    literalNaam: naam,
    kortNaam: kort,
    mix: isMix(setId),
    items: set.items as readonly Schedulable[],
    roundSize: ROUND_SIZE.tafels,
  };
}

function rekenOnderdelen(): Onderdeel[] {
  return loadSumSets()
    .map((set) => rekenOnderdeel(set.id))
    .filter((deel): deel is Onderdeel => deel !== null);
}

function rekenMixen(): Onderdeel[] {
  return MIX_IDS.map((id) => rekenOnderdeel(id)).filter((deel): deel is Onderdeel => deel !== null);
}

// ---------------------------------------------------------------------------
// Klokkijken

/**
 * The four steps of the clock, in the order a classroom teaches them.
 *
 * Named by key rather than composed the way rekenen's are: "Hele uren" is a
 * word, not a number with a word in front of it, so there is nothing here for a
 * `klokNaam` to work out.
 */
const KLOK_NAAM: Record<string, TranslationKey> = {
  'klok-heel': 'set.klok-heel',
  'klok-half': 'set.klok-half',
  'klok-kwart': 'set.klok-kwart',
  'klok-vijf': 'set.klok-vijf',
  [KLOK_MIX_ID]: 'set.klok-mix',
  [KLOK_FOUTEN_ID]: 'set.klok-fouten',
};

function klokOnderdeel(set: { readonly id: string; readonly items: readonly Schedulable[] }) {
  return {
    moduleId: 'klok' as const,
    setId: set.id,
    naam: KLOK_NAAM[set.id] ?? null,
    literalNaam: null,
    kortNaam: null,
    mix: set.id === KLOK_MIX_ID,
    items: set.items,
    roundSize: ROUND_SIZE.klok,
  };
}

function klokOnderdelen(): Onderdeel[] {
  return loadKlokSets().map((set) => klokOnderdeel(set));
}

/**
 * Every face at once.
 *
 * The same items under a second name rather than a fifth set of them, so half
 * past seven answered here moves the box it moves anywhere else. It is not
 * counted as part of the module's total anywhere, because that total would then
 * count every face twice (`onderdelen` leaves the mixes out).
 */
function klokMix(): Onderdeel | null {
  const mix = loadKlokSet(KLOK_MIX_ID);
  return mix ? klokOnderdeel(mix) : null;
}

/**
 * Klokkijken's subjects: four steps and a mix of them, one set each.
 *
 * The shape topografie's Nederland row has rather than rekenen's: no subject
 * here holds thirteen sets, so there is no second question to ask and no row of
 * chips under the tiles. "Hele uren" is one thing to practise and it is twelve
 * faces, the way "Provincies" is one thing and twelve provinces.
 *
 * No regions, so the page draws no region row and numbers its steps from one —
 * which is what `ModuleScreen` works out for itself rather than being told.
 */
function klokOnderwerpen(): Onderwerp[] {
  const sets = klokOnderdelen();
  const van = (id: string) => sets.filter((deel) => deel.setId === id);
  const mix = klokMix();

  const vakken: Onderwerp[] = [
    {
      moduleId: 'klok',
      id: 'hele-uren',
      naam: 'onderwerp.heleUren',
      uitleg: 'onderwerp.heleUren.uitleg',
      keuze: null,
      regio: null,
      sets: van('klok-heel'),
    },
    {
      moduleId: 'klok',
      id: 'halve-uren',
      naam: 'onderwerp.halveUren',
      uitleg: 'onderwerp.halveUren.uitleg',
      keuze: null,
      regio: null,
      sets: van('klok-half'),
    },
    {
      moduleId: 'klok',
      id: 'kwartieren',
      naam: 'onderwerp.kwartieren',
      uitleg: 'onderwerp.kwartieren.uitleg',
      keuze: null,
      regio: null,
      sets: van('klok-kwart'),
    },
    {
      moduleId: 'klok',
      id: 'vijf-minuten',
      naam: 'onderwerp.vijfMinuten',
      uitleg: 'onderwerp.vijfMinuten.uitleg',
      keuze: null,
      regio: null,
      sets: van('klok-vijf'),
    },
    {
      moduleId: 'klok',
      id: KLOK_MIX_ID,
      naam: 'onderwerp.klokmix',
      uitleg: 'set.klok-mix.uitleg',
      keuze: null,
      regio: null,
      sets: mix === null ? [] : [mix],
    },
  ];

  // A subject with nothing in it is a card that opens onto nothing.
  return vakken.filter((vak) => vak.sets.length > 0);
}

// ---------------------------------------------------------------------------
// Vlaggen

function vlagOnderdeel(set: VlagSet): Onderdeel {
  return {
    moduleId: 'vlaggen',
    setId: set.id,
    naam: null,
    literalNaam: vlagSetNaam(set),
    kortNaam: null,
    mix: set.onderwerp === 'mix',
    items: set.items,
    roundSize: ROUND_SIZE.vlaggen,
  };
}

/**
 * The sets progress is counted over: every country once and every province
 * once. Every other set of flags holds the same items under a second name —
 * "Bekende vlaggen van Europa" is a part of the world's — and a total that
 * added them would count Belgium four times.
 */
function vlagOnderdelen(): Onderdeel[] {
  return ['vlag-wereld-alle', 'vlag-nederland-provincies']
    .map((id) => loadVlagSet(id))
    .filter((set): set is VlagSet => set !== undefined)
    .map(vlagOnderdeel);
}

/**
 * De naam en de uitleg per onderwerp. Zonder `fouten`: die is met ADR-168 geen
 * onderwerp meer maar een spelvorm, en `vlagOnderwerpen` biedt hem niet aan.
 */
const VLAG_ONDERWERP: Record<
  Exclude<VlagOnderwerp, 'fouten'>,
  { naam: TranslationKey; uitleg: TranslationKey }
> = {
  bekend: { naam: 'onderwerp.vlaggen.bekend', uitleg: 'onderwerp.vlaggen.bekend.uitleg' },
  alle: { naam: 'onderwerp.vlaggen.alle', uitleg: 'onderwerp.vlaggen.alle.uitleg' },
  lijkt: { naam: 'onderwerp.vlaggen.lijkt', uitleg: 'onderwerp.vlaggen.lijkt.uitleg' },
  mix: { naam: 'onderwerp.vlaggen.mix', uitleg: 'onderwerp.vlaggen.mix.uitleg' },
  provincies: {
    naam: 'onderwerp.vlaggen.provincies',
    uitleg: 'onderwerp.vlaggen.provincies.uitleg',
  },
};

/**
 * Flags' subjects, one set each, under the region they belong to — the shape
 * topography has (ADR-083, ADR-102).
 *
 * The world and every werelddeel offer the well-known flags, all of them, and
 * the ones that look alike; the world alone offers the mix; Nederland offers
 * the provinces and nothing else, which is the page's one asymmetry and is
 * drawn the way rekenen draws its own — one tile, already chosen. A subject
 * that would hold fewer than four flags is not offered (`MIN_VLAGGEN`).
 *
 * "Oefen je fouten" appears in a region once this child has got five of its
 * flags wrong, the way it appears under rekenen (ADR-078).
 */
function vlagOnderwerpen(): Onderwerp[] {
  return loadVlagSets().flatMap((set): Onderwerp[] => {
    // De eigen foutenlijst is geen onderwerp meer maar een spelvorm (ADR-168).
    if (set.onderwerp === 'fouten') return [];

    const tekst = VLAG_ONDERWERP[set.onderwerp];
    const deel = vlagOnderdeel(set);

    return [
      {
        moduleId: 'vlaggen',
        id: set.id,
        naam: tekst.naam,
        uitleg: tekst.uitleg,
        keuze: null,
        regio: set.regio,
        sets: [deel],
      },
    ];
  });
}

// ---------------------------------------------------------------------------
// Taal

/**
 * What each set of Taal is called, and the short word on its chip where it is
 * one choice among several: "ei / ij" under Onthoudwoorden. The full name is
 * the chip's accessible name, as it is for the tables.
 */
const TAAL_NAAM: Record<string, { readonly naam: TranslationKey; readonly kort?: TranslationKey }> =
  {
    'taal-sp-eiij': { naam: 'set.taal-sp-eiij', kort: 'set.taal-sp-eiij.kort' },
    'taal-sp-auou': { naam: 'set.taal-sp-auou', kort: 'set.taal-sp-auou.kort' },
    'taal-sp-gch': { naam: 'set.taal-sp-gch', kort: 'set.taal-sp-gch.kort' },
    'taal-sp-ck': { naam: 'set.taal-sp-ck', kort: 'set.taal-sp-ck.kort' },
    'taal-sp-dt': { naam: 'set.taal-sp-dt' },
    'taal-sp-klinkers': { naam: 'set.taal-sp-klinkers', kort: 'set.taal-sp-klinkers.kort' },
    'taal-sp-medeklinkers': {
      naam: 'set.taal-sp-medeklinkers',
      kort: 'set.taal-sp-medeklinkers.kort',
    },
    'taal-sp-verkleinwoorden': {
      naam: 'set.taal-sp-verkleinwoorden',
      kort: 'set.taal-sp-verkleinwoorden.kort',
    },
    'taal-sp-ig': { naam: 'set.taal-sp-ig', kort: 'set.taal-sp-ig.kort' },
    'taal-sp-lijk': { naam: 'set.taal-sp-lijk', kort: 'set.taal-sp-lijk.kort' },
    'taal-sp-mix': { naam: 'set.taal-sp-mix' },
    'taal-sp-fouten': { naam: 'set.taal-sp-fouten' },
    'taal-ww-tt': { naam: 'set.taal-ww-tt' },
    'taal-ww-vt': { naam: 'set.taal-ww-vt' },
    'taal-ww-vd': { naam: 'set.taal-ww-vd' },
    'taal-ww-mix': { naam: 'set.taal-ww-mix' },
    'taal-ww-fouten': { naam: 'set.taal-ww-fouten' },
  };

function taalOnderdeel(set: TaalSet): Onderdeel {
  const naam = TAAL_NAAM[set.id];
  return {
    moduleId: 'woorden',
    setId: set.id,
    naam: naam?.naam ?? null,
    literalNaam: naam ? null : set.id,
    kortNaam: naam?.kort ? t(naam.kort) : null,
    mix: isTaalMix(set.id),
    items: set.items,
    roundSize: ROUND_SIZE.taal,
  };
}

function taalOnderdelen(): Onderdeel[] {
  return loadTaalSets().map(taalOnderdeel);
}

/**
 * De lijsten die een ouder zelf intypte, als gewone sets (ADR-135).
 *
 * Ze zien er hier precies zo uit als een ingebouwde set, en dat is het hele
 * punt: daarmee krijgen ze de Leitner-dozen, de onthoudtabel, het dagplan en
 * het toetsvooruitzicht zonder dat één van die vier hoeft te weten dat deze
 * woorden niet uit een bestand komen.
 *
 * Een woord van school heeft geen gat en geen keuzes — die kan een ouder niet
 * schrijven en horen ook niet gevraagd te worden. Daarom is de enige vorm het
 * flitsdictee (`forms.ts`): het woord staat er even, en dan typ je het. Dat is
 * ook precies wat een dictee op school is. `gat` en `keuzes` staan op het hele
 * woord zodat het type klopt; niets leest ze voor deze sets.
 *
 * `zin` is het woord zelf. `zinDelen` vindt het woord daarin terug en zet er
 * het veld neer, dus een kind ziet één woord in plaats van een zin met een gat.
 */
function eigenOnderdelen(): Onderdeel[] {
  return leesLijsten()
    .filter((lijst) => lijst.woorden.length > 0)
    .map((lijst) => ({
      moduleId: 'woorden' as const,
      setId: setIdVan(lijst.id),
      naam: null,
      literalNaam: lijst.naam,
      kortNaam: null,
      mix: false,
      items: lijst.woorden.map((woord) => ({
        id: itemId(lijst.id, woord),
        woord,
        gat: [0, woord.length] as readonly [number, number],
        keuzes: [woord],
        zin: woord,
      })),
      roundSize: ROUND_SIZE.taal,
    }));
}

/** The mix, or the list of mistakes, of each part that has sets. */
function taalSamengesteld(ids: Readonly<Record<TaalDeel, string>>): Onderdeel[] {
  return Object.values(ids)
    .map((id) => loadTaalSet(id))
    .filter((set): set is TaalSet => set !== undefined)
    .map(taalOnderdeel);
}

interface TaalVak {
  readonly id: string;
  readonly deel: TaalDeel;
  readonly naam: TranslationKey;
  readonly uitleg: TranslationKey;
  readonly keuze: TranslationKey | null;
  readonly sets: readonly string[];
}

/**
 * Taal's subjects, six at most per part (ADR-061, ADR-118).
 *
 * Spelling has ten sets and room for six tiles, with the mix and the child's
 * own mistakes among them. So the four kinds of onthoudwoord are one tile with
 * a chip each, as the tables are one tile with twelve, and so are the three
 * endings: what a child decides is the same kind of thing within each, and a
 * tile per set would have been ten tiles of equal weight.
 *
 * Werkwoorden are the three tenses, a mix and the mistakes: one set each.
 */
const TAAL_VAKKEN: readonly TaalVak[] = [
  {
    id: 'onthoudwoorden',
    deel: 'spelling',
    naam: 'onderwerp.taal.onthoud',
    uitleg: 'onderwerp.taal.onthoud.uitleg',
    keuze: 'onderwerp.taal.onthoud.keuze',
    sets: ['taal-sp-eiij', 'taal-sp-auou', 'taal-sp-gch', 'taal-sp-ck'],
  },
  {
    id: 'd-of-t',
    deel: 'spelling',
    naam: 'onderwerp.taal.dt',
    uitleg: 'onderwerp.taal.dt.uitleg',
    keuze: null,
    sets: ['taal-sp-dt'],
  },
  {
    id: 'een-of-twee',
    deel: 'spelling',
    naam: 'onderwerp.taal.eenTwee',
    uitleg: 'onderwerp.taal.eenTwee.uitleg',
    keuze: 'onderwerp.taal.eenTwee.keuze',
    sets: ['taal-sp-klinkers', 'taal-sp-medeklinkers'],
  },
  {
    id: 'achter-aan',
    deel: 'spelling',
    naam: 'onderwerp.taal.achter',
    uitleg: 'onderwerp.taal.achter.uitleg',
    keuze: 'onderwerp.taal.achter.keuze',
    sets: ['taal-sp-verkleinwoorden', 'taal-sp-ig', 'taal-sp-lijk'],
  },
  {
    id: 'spellingmix',
    deel: 'spelling',
    naam: 'onderwerp.taal.spellingmix',
    uitleg: 'onderwerp.taal.spellingmix.uitleg',
    keuze: null,
    sets: [TAAL_MIX.spelling],
  },
  {
    id: 'tegenwoordige-tijd',
    deel: 'werkwoorden',
    naam: 'onderwerp.taal.tt',
    uitleg: 'onderwerp.taal.tt.uitleg',
    keuze: null,
    sets: ['taal-ww-tt'],
  },
  {
    id: 'verleden-tijd',
    deel: 'werkwoorden',
    naam: 'onderwerp.taal.vt',
    uitleg: 'onderwerp.taal.vt.uitleg',
    keuze: null,
    sets: ['taal-ww-vt'],
  },
  {
    id: 'voltooid-deelwoord',
    deel: 'werkwoorden',
    naam: 'onderwerp.taal.vd',
    uitleg: 'onderwerp.taal.vd.uitleg',
    keuze: null,
    sets: ['taal-ww-vd'],
  },
  {
    id: 'werkwoordmix',
    deel: 'werkwoorden',
    naam: 'onderwerp.taal.werkwoordmix',
    uitleg: 'onderwerp.taal.werkwoordmix.uitleg',
    keuze: null,
    sets: [TAAL_MIX.werkwoorden],
  },
];

function taalOnderwerpen(): Onderwerp[] {
  const sets = [...taalOnderdelen(), ...taalSamengesteld(TAAL_MIX)];
  const vakken = TAAL_VAKKEN.map((vak): Onderwerp => ({
    moduleId: 'woorden',
    id: vak.id,
    naam: vak.naam,
    uitleg: vak.uitleg,
    keuze: vak.keuze,
    regio: vak.deel,
    sets: vak.sets.flatMap((id) => sets.filter((deel) => deel.setId === id)),
  }));

  // A subject with nothing in it is a card that opens onto nothing: a set not
  // written yet takes its subject with it.
  return [...vakken.filter((vak) => vak.sets.length > 0), ...eigenOnderwerp()];
}

/**
 * De eigen lijsten, als één onderwerp met een chip per lijst (ADR-135).
 *
 * Eén tegel en niet één per lijst, om dezelfde reden als de tafels er één zijn
 * met twaalf chips: wat een kind hier kiest is telkens hetzelfde soort ding.
 * De naam van een tegel is een vertaalsleutel en de naam van een lijst is wat
 * een ouder typte — dus draagt de tegel de vaste naam en dragen de chips de
 * getypte namen.
 *
 * Geen lijsten, geen tegel: een onderwerp dat op niets uitkomt is een deur naar
 * een lege kamer.
 */
function eigenOnderwerp(): Onderwerp[] {
  const sets = eigenOnderdelen();
  if (sets.length === 0) return [];

  return [
    {
      moduleId: 'woorden',
      id: 'eigen-lijsten',
      naam: 'onderwerp.taal.eigen',
      uitleg: 'onderwerp.taal.eigen.uitleg',
      keuze: sets.length > 1 ? 'onderwerp.taal.eigen.keuze' : null,
      regio: EIGEN_DEEL,
      sets,
    },
  ];
}

// ---------------------------------------------------------------------------

/**
 * Every set that is a set of its own: the unit progress is counted over.
 *
 * The mixes are deliberately absent. They hold the same items under a second
 * name, and a total that added them would tell a child there are a thousand
 * sums in rekenen and that they remember four hundred of a set of ten.
 */
export function onderdelen(): Onderdeel[] {
  return [
    ...topoOnderdelen(),
    ...rekenOnderdelen(),
    ...klokOnderdelen(),
    ...vlagOnderdelen(),
    ...taalOnderdelen(),
    ...eigenOnderdelen(),
  ];
}

/** Every set a round can be started on, mixes included. Used to name a round. */
export function startbareOnderdelen(): Onderdeel[] {
  const klok = klokMix();
  const klokFout = loadKlokSet(KLOK_FOUTEN_ID);
  return [
    ...topoOnderdelen(),
    topoMix(),
    ...FOUTEN_SET_IDS.map(topoFoutenOnderdeel),
    ...(klokFout ? [klokOnderdeel(klokFout)] : []),
    ...rekenOnderdelen(),
    ...rekenMixen(),
    ...klokOnderdelen(),
    ...(klok === null ? [] : [klok]),
    ...loadVlagSets().map(vlagOnderdeel),
    ...taalOnderdelen(),
    ...eigenOnderdelen(),
    ...taalSamengesteld(TAAL_MIX),
    ...taalSamengesteld(TAAL_FOUTEN),
  ];
}

/**
 * The subjects a module offers, in the order a child should meet them.
 *
 * Topography is five sets and a mix of them, one subject each. Rekenen is eight
 * kinds of sum and a mix of them; the tables hold twelve sets, every other kind
 * three ranges, and the mix of the tables is the Rekenmix rather than a
 * thirteenth square (ADR-100, ADR-120). Klokkijken is four steps and a mix, one subject each — the shape
 * topography has rather than the shape rekenen has. Taal is two parts of five
 * subjects and the mistakes, under the row topography asks where on (ADR-118).
 */
export function onderwerpenVan(moduleId: Module['id']): Onderwerp[] {
  if (moduleId === 'topo') return topoOnderwerpen();
  if (moduleId === 'klok') return klokOnderwerpen();
  if (moduleId === 'vlaggen') return vlagOnderwerpen();
  if (moduleId === 'woorden') return taalOnderwerpen();

  if (moduleId !== 'tafels') return [];

  const sets = rekenOnderdelen();
  const mix = rekenMixen();
  const van = (prefix: string) => sets.filter((deel) => deel.setId.startsWith(prefix));
  const mixMet = (id: string) => mix.filter((deel) => deel.setId === id);

  return [
    {
      moduleId: 'tafels',
      id: 'tafels',
      naam: 'onderwerp.tafels',
      uitleg: 'onderwerp.tafels.uitleg',
      keuze: 'onderwerp.tafels.keuze',
      regio: null,
      sets: van('tafel-'),
    },
    // Keersommen in three ranges (ADR-100, ADR-120): to 10 is the table sums
    // with an answer of ten at most, made of the tables' own items; to 100 and
    // 1000 is a number past ten times one under it, the sum a child splits.
    // Beside the tables because it is the same sign.
    {
      moduleId: 'tafels',
      id: 'keer',
      naam: 'onderwerp.keer',
      uitleg: 'onderwerp.keer.uitleg',
      keuze: 'onderwerp.bereik.keuze',
      regio: null,
      sets: [...mixMet('keer-10'), ...van('keer-')],
    },
    // Deelsommen in the same three ranges, by the number that is divided: the
    // tables the other way round, and the keersommen the other way round
    // (ADR-120). They were twelve sets, "delen door 7", until then.
    {
      moduleId: 'tafels',
      id: 'delen',
      naam: 'onderwerp.delen',
      uitleg: 'onderwerp.delen.uitleg',
      keuze: 'onderwerp.bereik.keuze',
      regio: null,
      sets: van('delen-'),
    },
    {
      moduleId: 'tafels',
      id: 'plus',
      naam: 'onderwerp.plus',
      uitleg: 'onderwerp.plus.uitleg',
      keuze: 'onderwerp.bereik.keuze',
      regio: null,
      sets: van('plus-'),
    },
    {
      moduleId: 'tafels',
      id: 'min',
      naam: 'onderwerp.min',
      uitleg: 'onderwerp.min.uitleg',
      keuze: 'onderwerp.bereik.keuze',
      regio: null,
      sets: van('min-'),
    },
    // Splitsen, halveren and verdubbelen (ADR-120): three more kinds of sum,
    // each in three ranges, after plus and minus because they lean on them.
    {
      moduleId: 'tafels',
      id: 'splitsen',
      naam: 'onderwerp.splitsen',
      uitleg: 'onderwerp.splitsen.uitleg',
      keuze: 'onderwerp.bereik.keuze',
      regio: null,
      sets: van('splitsen-'),
    },
    {
      moduleId: 'tafels',
      id: 'halveren',
      naam: 'onderwerp.halveren',
      uitleg: 'onderwerp.halveren.uitleg',
      keuze: 'onderwerp.bereik.keuze',
      regio: null,
      sets: van('halveren-'),
    },
    {
      moduleId: 'tafels',
      id: 'verdubbelen',
      naam: 'onderwerp.verdubbelen',
      uitleg: 'onderwerp.verdubbelen.uitleg',
      keuze: 'onderwerp.bereik.keuze',
      regio: null,
      sets: van('verdubbelen-'),
    },
    {
      moduleId: 'tafels',
      id: 'rekenmix',
      naam: 'onderwerp.rekenmix',
      uitleg: 'onderwerp.rekenmix.uitleg',
      keuze: 'onderwerp.rekenmix.keuze',
      regio: null,
      sets: [
        ...mixMet('rekenmix-1'),
        ...mixMet('rekenmix-2'),
        ...mixMet('rekenmix-3'),
        ...mixMet('rekenmix'),
      ],
    },
  ];
}

/**
 * Topography's subjects, in one word each and under the region they belong to.
 *
 * Five sets became five subjects named after themselves — "Provincies van
 * Nederland", "Hoofdsteden van de provincies" — which said where they were
 * three times on one page. The region row above says it once, so the cards can
 * be the word a child would use: **Provincies, Steden, Wateren, Eilanden,
 * Mix** (ADR-083).
 *
 * The two city sets are one subject with a choice under it, which is the shape
 * `onderwerpenVan` already uses for the twelve tables: the twelve capitals and
 * the eighty cities are the same question at two sizes, and a child who wants
 * "steden" should not have to know which of two cards means which.
 */
function topoOnderwerpen(): Onderwerp[] {
  const sets = topoOnderdelen();
  const van = (id: string) => sets.filter((deel) => deel.setId === id);

  const steden = [...van('nl-hoofdsteden'), ...van('nl-steden')].map((deel) => ({
    ...deel,
    kortNaam:
      deel.setId === 'nl-hoofdsteden'
        ? t('onderwerp.steden.kortHoofd')
        : t('onderwerp.steden.kortAlle'),
  }));

  const vakken: Onderwerp[] = [
    {
      moduleId: 'topo',
      id: 'provincies',
      naam: 'onderwerp.provincies',
      uitleg: null,
      keuze: null,
      regio: 'nederland',
      sets: van('nl-provincies'),
    },
    {
      moduleId: 'topo',
      id: 'steden',
      naam: 'onderwerp.steden',
      uitleg: 'onderwerp.steden.uitleg',
      keuze: 'onderwerp.steden.keuze',
      regio: 'nederland',
      sets: steden,
    },
    {
      moduleId: 'topo',
      id: 'wateren',
      naam: 'onderwerp.wateren',
      uitleg: null,
      keuze: null,
      regio: 'nederland',
      sets: van('nl-wateren'),
    },
    {
      moduleId: 'topo',
      id: 'eilanden',
      naam: 'onderwerp.eilanden',
      uitleg: null,
      keuze: null,
      regio: 'nederland',
      sets: van('nl-waddeneilanden'),
    },
    {
      moduleId: 'topo',
      id: MIX_SET_ID,
      naam: 'onderwerp.topomix',
      uitleg: 'set.nl-mix.uitleg',
      keuze: null,
      regio: 'nederland',
      sets: [topoMix()],
    },
    // Every werelddeel is one subject, and that is not a placeholder: a
    // continent has one thing on it a child is asked to find, and it is the
    // countries. Rivers and mountains would be a second subject and a second
    // licensed source; neither exists yet, and a card for one that does not
    // would be the product promising something (ADR-086).
    {
      moduleId: 'topo',
      id: 'europa-landen',
      naam: 'onderwerp.landen',
      uitleg: 'onderwerp.landen.europa',
      keuze: null,
      regio: 'europa',
      sets: van('europa-landen'),
    },
    {
      moduleId: 'topo',
      id: 'afrika-landen',
      naam: 'onderwerp.landen',
      uitleg: 'onderwerp.landen.afrika',
      keuze: null,
      regio: 'afrika',
      sets: van('afrika-landen'),
    },
    {
      moduleId: 'topo',
      id: 'azie-landen',
      naam: 'onderwerp.landen',
      uitleg: 'onderwerp.landen.azie',
      keuze: null,
      regio: 'azie',
      sets: van('azie-landen'),
    },
    {
      moduleId: 'topo',
      id: 'noord-amerika-landen',
      naam: 'onderwerp.landen',
      uitleg: 'onderwerp.landen.noord-amerika',
      keuze: null,
      regio: 'noord-amerika',
      sets: van('noord-amerika-landen'),
    },
    {
      moduleId: 'topo',
      id: 'zuid-amerika-landen',
      naam: 'onderwerp.landen',
      uitleg: 'onderwerp.landen.zuid-amerika',
      keuze: null,
      regio: 'zuid-amerika',
      sets: van('zuid-amerika-landen'),
    },
    {
      moduleId: 'topo',
      id: 'oceanie-landen',
      naam: 'onderwerp.landen',
      uitleg: 'onderwerp.landen.oceanie',
      keuze: null,
      regio: 'oceanie',
      sets: van('oceanie-landen'),
    },
    {
      moduleId: 'topo',
      id: 'wereld-landen',
      naam: 'onderwerp.landen',
      uitleg: 'onderwerp.landen.wereld',
      keuze: null,
      regio: 'wereld',
      sets: van('wereld-landen'),
    },
  ];

  // A subject with nothing in it is a card that opens onto nothing. Only the
  // mix is guaranteed to hold something; the rest depend on the content files
  // being there.
  return vakken.filter((vak) => vak.sets.length > 0);
}

/** Which subject a set belongs to, so an address for a set opens the right card. */
export function onderwerpVan(onderwerpen: readonly Onderwerp[], setId: string): Onderwerp | null {
  return onderwerpen.find((vak) => vak.sets.some((deel) => deel.setId === setId)) ?? null;
}

export function naamVan(deel: Onderdeel): string {
  return deel.naam ? t(deel.naam) : (deel.literalNaam ?? '');
}

/**
 * De naam van een set, op zijn id.
 *
 * Voor een uitslagscherm dat alleen de id in handen heeft: het diploma van een
 * rekenset of een taalset heet naar de set, en dat moet hetzelfde woord zijn
 * als in de startbalk stond. Leeg voor een id die niet bestaat, want een naam
 * verzinnen is erger dan er geen tonen.
 */
export function naamVanSet(setId: string): string {
  const deel = startbareOnderdelen().find((kandidaat) => kandidaat.setId === setId);
  return deel ? naamVan(deel) : '';
}

/** When this set was last answered, or null. Decides what "verder" means. */
export function laatstGeoefend(
  deel: Onderdeel,
  known: ReadonlyMap<string, ItemState>,
): string | null {
  let laatste: string | null = null;
  for (const item of deel.items) {
    const at = known.get(item.id)?.laatsteReview ?? null;
    if (at !== null && (laatste === null || at > laatste)) laatste = at;
  }
  return laatste;
}

/** The whole of a subject, counted over its sets and never over its mix. */
export function itemsVan(onderwerp: Onderwerp): readonly string[] {
  const ids = new Set<string>();
  for (const deel of onderwerp.sets) {
    if (deel.mix && onderwerp.sets.length > 1) continue;
    for (const item of deel.items) ids.add(item.id);
  }
  return [...ids];
}

/**
 * Which set a played round was about.
 *
 * A round says so itself now (ADR-063). It did not always: rows written before
 * that carry only the questions they asked, so those are still matched on the
 * questions — one shared item is enough, because no two sets that are files
 * share an item. What that fallback cannot do is recognise a mix, which holds
 * every set's items and would always match the first one; a mix played before
 * the round recorded its own set therefore reads as the set it started from,
 * which is wrong and unfixable and was true of exactly one release.
 */
export function setVanRonde(ronde: PlayedRound, alles: readonly Onderdeel[]): Onderdeel | null {
  if (ronde.setId !== null) {
    const genoemd = alles.find((deel) => deel.setId === ronde.setId);
    if (genoemd) return genoemd;
  }

  const asked = new Set(ronde.itemIds);
  return alles.find((deel) => deel.items.some((item) => asked.has(item.id))) ?? null;
}

/** A round that has been placed: which set, in which way, and how it went. */
export interface Gespeeld {
  readonly deel: Onderdeel;
  readonly ronde: PlayedRound;
}

export function geplaatst(rondes: readonly PlayedRound[], alles: readonly Onderdeel[]): Gespeeld[] {
  return rondes
    .map((ronde) => ({ deel: setVanRonde(ronde, alles), ronde }))
    .filter((played): played is Gespeeld => played.deel !== null);
}

/**
 * The exercises this child goes back to most, with how often.
 *
 * One entry per set rather than per set and way — which is the difference
 * between this and de rij die hiervoor per manier telde. Een tegel op de
 * voordeur gaat over de oefening, dus zijn de twaalf provincies één tegel hoe
 * ze ook beantwoord zijn, en de weg erin is de manier die dit kind het vaakst
 * koos.
 *
 * The count is over this device and nothing else, and it is the honest one:
 * every round that was placed, mixes included.
 */
export interface Populair {
  readonly deel: Onderdeel;
  readonly mode: ModeId;
  readonly keer: number;
  readonly at: string;
}

export function meestGeoefend(
  gespeeld: readonly Gespeeld[],
  hoeveel: number = POPULAR_SHOWN,
): Populair[] {
  const perSet = new Map<string, Populair & { readonly perMode: Map<ModeId, number> }>();

  for (const { deel, ronde } of gespeeld) {
    const seen = perSet.get(deel.setId);
    const perMode = seen?.perMode ?? new Map<ModeId, number>();
    const vanDezeMode = (perMode.get(ronde.mode) ?? 0) + 1;
    perMode.set(ronde.mode, vanDezeMode);

    perSet.set(deel.setId, {
      deel,
      // The way this set was answered most often. Ties keep the one already
      // holding it, which is the earlier — and therefore more recent — round.
      mode:
        seen === undefined || vanDezeMode > (perMode.get(seen.mode) ?? 0) ? ronde.mode : seen.mode,
      keer: (seen?.keer ?? 0) + 1,
      // The list arrives newest first, so the first sighting is the latest one.
      at: seen?.at ?? ronde.at,
      perMode,
    });
  }

  return [...perSet.values()]
    .sort((a, b) => b.keer - a.keer || b.at.localeCompare(a.at))
    .slice(0, hoeveel)
    .map(({ deel, mode, keer, at }) => ({ deel, mode, keer, at }));
}

/**
 * The four to start with, for a child who has played nothing yet.
 *
 * Returned with a count of zero rather than with a made-up one, so the tile can
 * say "nog niet geoefend" and mean it.
 *
 * Met een groep (ADR-151) blijft het één kaart per module, maar niet per se
 * dezelfde: past de vaste set niet bij de groep, dan komt de set van die
 * module die wel past (`kiesVoorGroep`). Een kind in groep 3 begint rekenen
 * met plussommen tot 20 in plaats van met de tafel van 2. Wat daarna nog
 * steeds niet past — de provincies voor groep 4 — schuift achteraan, maar
 * blijft in de rij.
 */
export function starters(groep?: Groep): Populair[] {
  const alles = startbareOnderdelen();

  const lijst = STARTERS.flatMap(({ setId, mode }) => {
    const vast = alles.find((kandidaat) => kandidaat.setId === setId);
    if (!vast) return [];

    const kandidaten = alles.filter(
      (kandidaat) =>
        kandidaat.moduleId === vast.moduleId &&
        !kandidaat.mix &&
        (kandidaat.moduleId !== 'woorden' || taalDeelVan(kandidaat.setId) !== null),
    );
    const deel = kiesVoorGroep(vast, kandidaten, groepenVan, groep);
    // De vorm hoort bij de module, behalve bij Taal: daar kiest elk deel op
    // zijn eigen manier, en een werkwoord heeft geen letters om te kiezen.
    const deelVanTaal = taalDeelVan(deel.setId);
    const vorm = deel === vast || deelVanTaal === null ? mode : KIES_VORM[deelVanTaal];
    return [{ deel, mode: vorm, keer: 0, at: '' }];
  });

  return opGroep(lijst, (kaart) => indelingVoor(kaart.deel, groep));
}

/**
 * A stored way of answering, narrowed back to the one its module can start.
 *
 * `ModeId` is every way there is across both modules, because that is what a
 * session records. Anything a module does not recognise falls back to the way
 * that module begins — which is never wrong, only sometimes not the one that
 * was asked for. That way is a free one (ADR-192): the premium check in `App`
 * looks at the mode before it is narrowed, so a fallback must never open more
 * than what was checked.
 */
const PRACTICE_MODES: readonly ModeId[] = [
  'wijs-aan',
  'meerkeuze',
  'hoe-heet-dit',
  'bliksemronde',
  'overleven',
  'topo-diploma',
];
const SUM_MODES: readonly ModeId[] = [
  'som-typen',
  'som-meerkeuze',
  'bliksemronde',
  'overleven',
  'tafeldiploma',
  'reken-diploma',
];
const KLOK_MODES: readonly ModeId[] = [
  'klok-meerkeuze',
  'klok-welke-klok',
  'klok-typen',
  'bliksemronde',
  'overleven',
  'klok-diploma',
];

export function asPracticeMode(mode: ModeId): PracticeMode {
  return PRACTICE_MODES.includes(mode) ? (mode as PracticeMode) : 'meerkeuze';
}

export function asSumMode(mode: ModeId): SumMode {
  return SUM_MODES.includes(mode) ? (mode as SumMode) : 'som-meerkeuze';
}

export function asKlokMode(mode: ModeId): KlokMode {
  return KLOK_MODES.includes(mode) ? (mode as KlokMode) : 'klok-meerkeuze';
}

const VLAG_MODES: readonly ModeId[] = [
  'vlag-zoeken',
  'vlag-meerkeuze',
  'vlag-gemengd',
  'bliksemronde',
  'overleven',
  'vlag-diploma',
];

export function asVlagMode(mode: ModeId): VlagMode {
  return VLAG_MODES.includes(mode) ? (mode as VlagMode) : 'vlag-meerkeuze';
}

const TAAL_MODES: readonly ModeId[] = [
  'taal-letters',
  'taal-flitsdictee',
  'taal-vorm-kiezen',
  'taal-vorm-typen',
  'overleven',
  'taal-diploma',
];

/** Taal's ways, falling back to the way the set's part chooses in (ADR-118). */
export function asTaalMode(mode: ModeId, setId: string): TaalMode {
  if (TAAL_MODES.includes(mode)) return mode as TaalMode;
  return KIES_VORM[taalDeelVan(setId) ?? 'spelling'];
}
