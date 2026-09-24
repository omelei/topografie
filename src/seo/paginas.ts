import type { Groep } from '@/game-core';
import { t, type TranslationKey } from '@/i18n';
import { groepenVan } from '@/features/module/groepen';
import { naamVan, onderwerpenVan, type Onderdeel } from '@/features/module/onderdelen';
import { pathFor } from '@/features/shell/routes';
import { BUILT_MODULES, type Module } from '@/features/shell/modules';

/**
 * Wat Google van leer.nu te lezen krijgt (ADR-207).
 *
 * Elk vak en elk onderwerp is een eigen pagina met een eigen titel, een regel
 * voor in de zoekresultaten en een korte tekst. `tools/seo-paginas.mjs` maakt
 * er bij het bouwen een HTML-bestand per adres van, zodat
 * leer.nu/topografie/provincies een echte pagina is in plaats van een 404 met
 * de app erin. De app zelf zet dezelfde titel in het tabblad (`titelVoor`).
 *
 * Een mix en jouw fouten staan er niet in: een mix is de andere onderwerpen
 * door elkaar, en jouw fouten zijn van één kind.
 */

export interface SeoLink {
  readonly pad: string;
  readonly naam: string;
}

export interface SeoPagina {
  readonly pad: string;
  /** Voor het tabblad en de blauwe regel in Google. */
  readonly titel: string;
  /** De regel onder de titel in Google, en de eerste alinea van de pagina. */
  readonly beschrijving: string;
  readonly kop: string;
  readonly links: readonly SeoLink[];
  readonly linksKop: string;
}

/** Het vak zoals een ouder het in Google intikt, niet het korte woord van het menu. */
const VAK_ZOEKNAAM: Record<Module['id'], TranslationKey> = {
  topo: 'seo.vak.topo',
  tafels: 'seo.vak.tafels',
  klok: 'seo.vak.klok',
  woorden: 'seo.vak.woorden',
  vlaggen: 'seo.vak.vlaggen',
  tijdvakken: 'seo.vak.topo',
};

const VAK_UITLEG: Record<Module['id'], TranslationKey> = {
  topo: 'home.vak.topo',
  tafels: 'home.vak.tafels',
  klok: 'home.vak.klok',
  woorden: 'home.vak.woorden',
  vlaggen: 'home.vak.vlaggen',
  tijdvakken: 'home.vak.topo',
};

/** "groep 6", "groep 6 en 7" of "groep 5 tot en met 8". */
export function groepenTekst(groepen: readonly Groep[]): string {
  const van = Math.min(...groepen);
  const tot = Math.max(...groepen);
  if (van === tot) return t('seo.groep.een', { groep: van });
  if (tot - van === 1) return t('seo.groep.twee', { van, tot });
  return t('seo.groep.reeks', { van, tot });
}

function samenGroepen(sets: readonly Onderdeel[]): Groep[] {
  return [...new Set(sets.flatMap((deel) => groepenVan(deel) ?? []))];
}

/** De onderwerpen van een vak die een eigen pagina krijgen. */
function setsVan(module: Module): Onderdeel[] {
  return onderwerpenVan(module.id)
    .flatMap((vak) => vak.sets)
    .filter((deel) => !deel.mix && !/(^|-)fouten$/.test(deel.setId));
}

function titel(wat: string): string {
  return t('seo.titel', { wat });
}

function modulePad(module: Module): string {
  return pathFor({ name: 'module', module, setId: null });
}

function setPad(module: Module, deel: Onderdeel): string {
  return pathFor({ name: 'module', module, setId: deel.setId });
}

export function seoPaginas(): SeoPagina[] {
  const home: SeoPagina = {
    pad: pathFor({ name: 'home' }),
    titel: t('seo.home.titel'),
    beschrijving: t('seo.home.beschrijving'),
    kop: t('seo.home.kop'),
    linksKop: t('seo.vakken'),
    links: BUILT_MODULES.map((module) => ({
      pad: modulePad(module),
      naam: t(VAK_ZOEKNAAM[module.id]),
    })),
  };

  const vakken = BUILT_MODULES.flatMap((module): SeoPagina[] => {
    const vak = t(VAK_ZOEKNAAM[module.id]);
    // Midden in een zin zonder hoofdletter: "Meer topografie".
    const vakKlein = vak.toLocaleLowerCase('nl-NL');
    const sets = setsVan(module);
    const groepen = samenGroepen(sets);

    const vakPagina: SeoPagina = {
      pad: modulePad(module),
      titel: titel(t('seo.oefenen', { wat: vak })),
      beschrijving:
        groepen.length === 0
          ? t('seo.vak.beschrijvingZonderGroep', { uitleg: t(VAK_UITLEG[module.id]) })
          : t('seo.vak.beschrijving', {
              uitleg: t(VAK_UITLEG[module.id]),
              groepen: groepenTekst(groepen),
            }),
      kop: t('seo.oefenen', { wat: vak }),
      linksKop: t('seo.onderwerpen'),
      links: sets.map((deel) => ({ pad: setPad(module, deel), naam: naamVan(deel) })),
    };

    const setPaginas = sets.map((deel): SeoPagina => {
      const naam = naamVan(deel);
      const eigen = groepenVan(deel) ?? [];
      const aantal = deel.items.length;
      return {
        pad: setPad(module, deel),
        titel: titel(t('seo.oefenen', { wat: naam })),
        beschrijving:
          eigen.length === 0
            ? t('seo.onderwerp.beschrijvingZonderGroep', { aantal })
            : t('seo.onderwerp.beschrijving', { aantal, groepen: groepenTekst(eigen) }),
        kop: t('seo.oefenen', { wat: naam }),
        linksKop: t('seo.meer', { vak: vakKlein }),
        links: [
          { pad: vakPagina.pad, naam: t('seo.alles', { vak: vakKlein }) },
          ...sets
            .filter((ander) => ander !== deel)
            .map((ander) => ({ pad: setPad(module, ander), naam: naamVan(ander) })),
        ],
      };
    });

    return [vakPagina, ...setPaginas];
  });

  return [home, ...vakken];
}

let perPad: Map<string, string> | null = null;

/**
 * De titel voor het tabblad, op het adres waar de app staat. Een adres zonder
 * eigen pagina (Jij, Premium, een ronde) heet gewoon leer.nu.
 */
export function titelVoor(pathname: string): string {
  perPad ??= new Map(seoPaginas().map((pagina) => [pagina.pad, pagina.titel]));
  const pad = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return perPad.get(pad) ?? t('seo.standaard');
}
