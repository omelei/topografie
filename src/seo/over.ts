import {
  sumUitgewerkt,
  type Item,
  type KlokItem,
  type SpellingItem,
  type SumItem,
  type VlagItem,
  type WerkwoordItem,
} from '@/game-core';
import { t } from '@/i18n';
import { groepenVan } from '@/features/module/groepen';
import { naamVan, startbareOnderdelen, type Onderdeel } from '@/features/module/onderdelen';
import { klokVoluit } from '@/features/klok/klokTaal';
import { heeftWerkblad } from '@/features/werkblad/werkblad';

/**
 * "Over dit onderwerp" (ADR-213): wat erin zit, en de vragen die een ouder
 * stelt. Dezelfde tekst staat op de pagina voor Google en onderaan de pagina
 * van het onderwerp in de app, zodat hij er ook nog staat als Google de app
 * heeft laten draaien.
 *
 * Leerinhoud staat zoals hij is: de namen, de sommen, de tijden (zie de
 * schrijfwijzer). De vragen en antwoorden zijn voor ouders.
 */

export interface OverOnderwerp {
  readonly kop: string;
  readonly lijstKop: string;
  readonly lijst: readonly string[];
  /** Hoeveel er niet in de lijst staan, omdat hij anders een telefoonboek wordt. */
  readonly meer: number;
  readonly vragen: readonly { readonly vraag: string; readonly antwoord: string }[];
}

const HOOGSTENS = 60;

let topoNamen: Map<string, string> | null = null;

/** Een plaats met de provincie erbij, als hij daar de hoofdstad van is. */
function topoRegel(item: Item): string {
  const van = item.relaties?.hoofdstadVan;
  if (van === undefined) return item.naam;
  topoNamen ??= new Map(
    startbareOnderdelen()
      .filter((deel) => deel.moduleId === 'topo')
      .flatMap((deel) => (deel.items as readonly Item[]).map((ander) => [ander.id, ander.naam])),
  );
  const provincie = topoNamen.get(van);
  return provincie ? `${item.naam} (${provincie})` : item.naam;
}

function regels(deel: Onderdeel): string[] {
  if (deel.moduleId === 'topo') return (deel.items as readonly Item[]).map(topoRegel);
  if (deel.moduleId === 'tafels') return (deel.items as readonly SumItem[]).map(sumUitgewerkt);
  if (deel.moduleId === 'klok') return (deel.items as readonly KlokItem[]).map(klokVoluit);
  if (deel.moduleId === 'vlaggen') return (deel.items as readonly VlagItem[]).map((v) => v.naam);
  if (deel.setId.startsWith('taal-ww-')) {
    return [
      ...new Set(
        (deel.items as readonly WerkwoordItem[]).map(
          (item) => `${item.infinitief}: ${item.persoon} ${item.antwoord}`,
        ),
      ),
    ];
  }
  return [...new Set((deel.items as readonly SpellingItem[]).map((item) => item.woord))];
}

export function overOnderwerp(deel: Onderdeel): OverOnderwerp {
  const onderwerp = naamVan(deel);
  const alle = regels(deel);
  const groepen = groepenVan(deel) ?? [];
  const van = Math.min(...groepen);
  const tot = Math.max(...groepen);
  const groepTekst =
    groepen.length === 0
      ? null
      : van === tot
        ? t('seo.groep.een', { groep: van })
        : tot - van === 1
          ? t('seo.groep.twee', { van, tot })
          : t('seo.groep.reeks', { van, tot });

  return {
    kop: t('over.kop', { onderwerp }),
    lijstKop: t('over.lijst', { aantal: alle.length }),
    lijst: alle.slice(0, HOOGSTENS),
    meer: Math.max(0, alle.length - HOOGSTENS),
    vragen: [
      { vraag: t('over.vraag.hoe', { onderwerp }), antwoord: t('over.antwoord.hoe') },
      ...(groepTekst === null
        ? []
        : [
            {
              vraag: t('over.vraag.groep'),
              antwoord: t('over.antwoord.groep', { groepen: groepTekst }),
            },
          ]),
      ...(heeftWerkblad(deel)
        ? [{ vraag: t('over.vraag.werkblad'), antwoord: t('over.antwoord.werkblad') }]
        : []),
      { vraag: t('over.vraag.gratis'), antwoord: t('over.antwoord.gratis') },
    ],
  };
}
