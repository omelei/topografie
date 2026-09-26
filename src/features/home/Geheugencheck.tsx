import { useEffect, useState } from 'react';
import { geheugencheckVoor, type ModeId } from '@/game-core';
import { t } from '@/i18n';
import { MODULE_ICON } from '@/features/shell/moduleIcons';
import { taalDeelVan } from '@/content/loadTaal';
import { formsFor, offeredForms, toetsVormVan } from '@/features/module/forms';
import { naamVan, startbareOnderdelen, type Onderdeel } from '@/features/module/onderdelen';
import { isPremiumOnderwerp } from '@/features/module/premium';
import { activeChildId } from '@/store/children';
import { leesGeheugencheck } from '@/store/geheugencheck';
import { loadEersteKeer } from '@/store/progress';

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

async function zoek(now: Date): Promise<CheckKlaar | null> {
  const kindId = await activeChildId();
  if ((await leesGeheugencheck(kindId)) !== null) return null;

  const sets = startbareOnderdelen()
    .filter((deel) => !isPremiumOnderwerp(deel.setId) && toetsManier(deel) !== null)
    .map((deel) => ({ set: deel, mix: deel.mix, items: deel.items }));
  const check = geheugencheckVoor(sets, await loadEersteKeer(kindId), now);
  if (check === null) return null;
  const mode = toetsManier(check.set);
  return mode === null ? null : { kindId, deel: check.set, mode, ids: check.ids };
}

export function Geheugencheck({ onStart }: { readonly onStart: (check: CheckKlaar) => void }) {
  const [check, setCheck] = useState<CheckKlaar | null>(null);

  useEffect(() => {
    let levend = true;
    void zoek(new Date()).then((gevonden) => {
      if (levend) setCheck(gevonden);
    });
    return () => {
      levend = false;
    };
  }, []);

  if (check === null) return null;
  const ModuleIcon = MODULE_ICON[check.deel.moduleId];

  return (
    <section className="tk-eerste" data-module={check.deel.moduleId} aria-labelledby="check-kop">
      <span className="tk-plaat tk-plaat-groot" aria-hidden="true">
        <ModuleIcon size={28} />
      </span>
      <div className="tk-eerste-tekst">
        <h2 id="check-kop" className="tk-kaart-titel">
          {t('home.check.kop')}
        </h2>
        <p className="text-lopend">
          {t('home.check.zin', { aantal: check.ids.length, onderwerp: naamVan(check.deel) })}
        </p>
      </div>
      <button type="button" className="tk-button" onClick={() => onStart(check)}>
        {t('home.check.knop')}
      </button>
    </section>
  );
}
