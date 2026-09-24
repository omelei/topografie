import {
  sumText,
  sumUitgewerkt,
  zinDelen,
  type EngelsItem,
  type Item,
  type KlokItem,
  type SpellingItem,
  type SumItem,
  type VlagItem,
  type WerkwoordItem,
} from '@/game-core';
import type { TranslationKey } from '@/i18n';
import type { Onderdeel } from '@/features/module/onderdelen';
import { klokVoluit } from '@/features/klok/klokTaal';

/**
 * Een werkblad om te printen, per onderwerp (ADR-211).
 *
 * Dezelfde vragen als in de app, op papier: een blinde kaart met nummers, een
 * rij sommen, klokken, vlaggen of zinnen met een gat. Met een naamregel
 * bovenaan en de antwoorden op de tweede pagina, zodat een ouder of juf het
 * kan nakijken. Een werkblad is gratis: het is de manier waarop een klas
 * leer.nu leert kennen.
 *
 * Hier alleen wat er op het blad staat; hoe het eruitziet, staat in
 * `WerkbladScherm`. Welke vragen, in welke volgorde, hangt af van `zaad`: zo
 * geeft hetzelfde zaad hetzelfde blad, en "Andere vragen" een ander.
 */

export type WerkbladVraag =
  | { readonly soort: 'plek'; readonly geometrieRef: string; readonly antwoord: string }
  | { readonly soort: 'som'; readonly tekst: string; readonly antwoord: string }
  | { readonly soort: 'klok'; readonly klok: KlokItem; readonly antwoord: string }
  | { readonly soort: 'vlag'; readonly vlag: VlagItem; readonly antwoord: string }
  | {
      readonly soort: 'zin';
      readonly voor: string;
      readonly gat: string;
      readonly na: string;
      readonly hint: string;
      readonly antwoord: string;
    };

export interface Werkblad {
  readonly opdracht: TranslationKey;
  readonly vragen: readonly WerkbladVraag[];
}

/** Hoeveel vragen er op één blad passen, per soort. */
const HOOGSTENS: Record<WerkbladVraag['soort'], number> = {
  plek: 25,
  som: 30,
  klok: 12,
  vlag: 20,
  zin: 15,
};

/** Een mix en jouw fouten hebben geen werkblad: die zijn geen onderwerp. */
export function heeftWerkblad(deel: Onderdeel): boolean {
  if (deel.mix || /(^|-)fouten$/.test(deel.setId) || deel.items.length === 0) return false;
  if (deel.moduleId === 'topo') {
    return (deel.items as readonly Item[]).some((item) => item.geometrieRef !== undefined);
  }
  return ['tafels', 'klok', 'vlaggen', 'woorden'].includes(deel.moduleId);
}

/** Een vast getal uit een tekst, voor het eerste blad van een onderwerp. */
export function zaadVan(tekst: string): number {
  let h = 2166136261;
  for (let i = 0; i < tekst.length; i += 1) h = Math.imul(h ^ tekst.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** mulberry32: klein, snel en voor hetzelfde zaad altijd dezelfde reeks. */
function reeks(zaad: number): () => number {
  let a = zaad >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function kies<T>(bron: readonly T[], aantal: number, zaad: number): T[] {
  const rng = reeks(zaad);
  const lijst = [...bron];
  for (let i = lijst.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [lijst[i], lijst[j]] = [lijst[j] as T, lijst[i] as T];
  }
  return lijst.slice(0, aantal);
}

const LIJN = '______';

function som(item: SumItem): WerkbladVraag {
  const tekst = sumText(item);
  return {
    soort: 'som',
    tekst: tekst.includes('?') ? tekst.replace('?', LIJN) : `${tekst} = ${LIJN}`,
    antwoord: sumUitgewerkt(item),
  };
}

function spelling(item: SpellingItem): WerkbladVraag | null {
  const delen = zinDelen(item.zin, item.woord);
  if (delen === null) return null;
  const [van, tot] = item.gat;
  return {
    soort: 'zin',
    voor: delen.voor,
    gat: `${item.woord.slice(0, van)}${'_'.repeat(Math.max(2, tot - van + 1))}${item.woord.slice(tot)}`,
    na: delen.na,
    hint: `(${item.keuzes.join(' / ')})`,
    antwoord: item.woord,
  };
}

function werkwoord(item: WerkwoordItem): WerkbladVraag | null {
  const delen = zinDelen(item.zin, item.antwoord);
  if (delen === null) return null;
  return {
    soort: 'zin',
    voor: delen.voor,
    gat: LIJN,
    na: delen.na,
    hint: `(${item.infinitief})`,
    antwoord: item.antwoord,
  };
}

/** Engels (ADR-217): de Engelse zin met een lijn, het Nederlandse woord erachter. */
function engels(item: EngelsItem): WerkbladVraag | null {
  const delen = zinDelen(item.zin, item.en);
  if (delen === null) return null;
  return {
    soort: 'zin',
    voor: delen.voor,
    gat: LIJN,
    na: delen.na,
    hint: `(${item.nl})`,
    antwoord: item.en,
  };
}

export function werkbladVoor(deel: Onderdeel, zaad: number): Werkblad | null {
  if (!heeftWerkblad(deel)) return null;

  if (deel.moduleId === 'topo') {
    const items = (deel.items as readonly Item[]).filter((item) => item.geometrieRef);
    return {
      opdracht: 'werkblad.opdracht.kaart',
      vragen: kies(items, HOOGSTENS.plek, zaad).map((item) => ({
        soort: 'plek',
        geometrieRef: item.geometrieRef as string,
        antwoord: item.naam,
      })),
    };
  }

  if (deel.moduleId === 'tafels') {
    return {
      opdracht: 'werkblad.opdracht.sommen',
      vragen: kies(deel.items as readonly SumItem[], HOOGSTENS.som, zaad).map(som),
    };
  }

  if (deel.moduleId === 'klok') {
    return {
      opdracht: 'werkblad.opdracht.klok',
      vragen: kies(deel.items as readonly KlokItem[], HOOGSTENS.klok, zaad).map((klok) => ({
        soort: 'klok',
        klok,
        antwoord: klokVoluit(klok),
      })),
    };
  }

  if (deel.moduleId === 'vlaggen') {
    return {
      opdracht: 'werkblad.opdracht.vlaggen',
      vragen: kies(deel.items as readonly VlagItem[], HOOGSTENS.vlag, zaad).map((vlag) => ({
        soort: 'vlag',
        vlag,
        antwoord: vlag.naam,
      })),
    };
  }

  const werkwoorden = deel.setId.startsWith('taal-ww-');
  const isEngels = deel.setId.startsWith('taal-en-');
  const vragen = kies(deel.items, deel.items.length, zaad)
    .map((item) =>
      isEngels
        ? engels(item as EngelsItem)
        : werkwoorden
          ? werkwoord(item as WerkwoordItem)
          : spelling(item as SpellingItem),
    )
    .filter((vraag): vraag is WerkbladVraag => vraag !== null)
    .slice(0, HOOGSTENS.zin);
  return {
    opdracht: isEngels
      ? 'werkblad.opdracht.engels'
      : werkwoorden
        ? 'werkblad.opdracht.werkwoorden'
        : 'werkblad.opdracht.spelling',
    vragen,
  };
}
