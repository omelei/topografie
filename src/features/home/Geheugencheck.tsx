import { geheugencheckVoor, type ModeId } from '@/game-core';
import { t } from '@/i18n';
import { taalDeelVan } from '@/content/loadTaal';
import { formsFor, offeredForms, toetsVormVan } from '@/features/module/forms';
import { naamVan, startbareOnderdelen, type Onderdeel } from '@/features/module/onderdelen';
import { isFoutenOnderwerp, isPremiumOnderwerp } from '@/features/module/premium';
import { activeChildId } from '@/store/children';
import { leesGeheugencheck } from '@/store/geheugencheck';
import { loadEersteKeer } from '@/store/progress';
import { NuDoenKaart } from './NuDoen';

/**
 * De geheugencheck op Vandaag: één ronde, één keer per kind (ADR-228).
 *
 * Zodra er minstens 8 vragen zijn die een kind 21 tot 60 dagen geleden voor
 * het eerst oefende, staat hier een kaart: weet je het nog? De ronde is de
 * manier van de oefentoets, zonder hulp en zonder iets te zeggen tot het eind,
 * en hij verschuift niets in de dozen. Wat eruit kwam, leest de ouder.
 *
 * **Geen woord over premium.** Dit is een kaart voor het kind, en een kind
 * koopt niets (R-11). Wat er te kiezen valt, staat achter de pincode.
 */

export interface CheckKlaar {
  readonly kindId: string;
  readonly deel: Onderdeel;
  readonly mode: ModeId;
  readonly ids: readonly string[];
}

/** De manier van de oefentoets voor dit onderwerp, of null als het er geen heeft. */
function toetsManier(deel: Onderdeel): ModeId | null {
  const taalDeel = taalDeelVan(deel.setId);
  const vormen = offeredForms(formsFor(deel.moduleId, taalDeel), deel.setId);
  return toetsVormVan(deel.moduleId, vormen, taalDeel)?.id ?? null;
}

export async function zoekGeheugencheck(now: Date): Promise<CheckKlaar | null> {
  const kindId = await activeChildId();
  if ((await leesGeheugencheck(kindId)) !== null) return null;

  const sets = startbareOnderdelen()
    .filter(
      (deel) =>
        !(isPremiumOnderwerp(deel.setId) || isFoutenOnderwerp(deel.setId)) &&
        toetsManier(deel) !== null,
    )
    .map((deel) => ({ set: deel, mix: deel.mix, items: deel.items }));
  const check = geheugencheckVoor(sets, await loadEersteKeer(kindId), now);
  if (check === null) return null;
  const mode = toetsManier(check.set);
  return mode === null ? null : { kindId, deel: check.set, mode, ids: check.ids };
}

/**
 * De kaart als Nu doen (ADR-250): na Welkom terug, Vandaag herhalen en Maak af,
 * want hij is één keer per kind en heeft geen haast.
 */
export function Geheugencheck({
  check,
  onStart,
}: {
  readonly check: CheckKlaar;
  readonly onStart: (check: CheckKlaar) => void;
}) {
  return (
    <NuDoenKaart
      moduleId={check.deel.moduleId}
      kop={t('home.check.kop')}
      regel={t('home.check.zin', { aantal: check.ids.length, onderwerp: naamVan(check.deel) })}
      knop={t('home.check.knop')}
      onStart={() => onStart(check)}
    />
  );
}
