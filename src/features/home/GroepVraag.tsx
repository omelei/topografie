import { useEffect, useState } from 'react';
import type { Groep } from '@/game-core';
import { t } from '@/i18n';
import { GroepKiezer } from '@/features/player/GroepKiezer';
import { activeChildId, groepAlGevraagd, setGroep, zetGroepGevraagd } from '@/store/children';

/**
 * De vraag naar de groep, één keer, voor een kind dat er al was (ADR-151).
 *
 * Een kind van vóór die vraag heeft het eerste scherm allang gehad. Het krijgt
 * hem hier, onder Vandaag: het plan staat er eerst en blijft bruikbaar, en de
 * vraag houdt niemand tegen. Een groep kiezen of "Niet nu" zet hem weg, voor
 * altijd; daarna staat hij bij de instellingen op Jij (ADR-171).
 *
 * **Niets tot het bekend is**, zoals `VandaagBlok`: een vraag die even
 * verschijnt en dan verdwijnt omdat hij al beantwoord was, is een knop onder
 * een vinger die weg is.
 */
export function GroepVraag({ onGekozen }: { readonly onGekozen: (groep: Groep) => void }) {
  const [kindId, setKindId] = useState<string | null>(null);
  const [bezig, setBezig] = useState(false);

  useEffect(() => {
    void (async () => {
      const id = await activeChildId();
      if (!(await groepAlGevraagd(id))) setKindId(id);
    })();
  }, []);

  if (kindId === null) return null;

  async function kies(groep: Groep | undefined) {
    if (kindId === null) return;
    setBezig(true);
    if (groep === undefined) {
      await zetGroepGevraagd(kindId);
    } else {
      await setGroep(kindId, groep);
      onGekozen(groep);
    }
    setKindId(null);
  }

  return (
    <section className="flex flex-col gap-3" aria-labelledby="groep-vraag-thuis">
      <h2 id="groep-vraag-thuis" className="tk-sectie">
        {t('groep.vraag')}
      </h2>
      <p className="text-lopend text-tekst-secundair">{t('groep.uitleg')}</p>
      <GroepKiezer
        gekozen={null}
        uitweg="groep.nietNu"
        bezig={bezig}
        onKies={(groep) => void kies(groep)}
      />
    </section>
  );
}
