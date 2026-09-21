import { useEffect, useState } from 'react';
import { huidigeGroep, type Groep } from '@/game-core';
import { t } from '@/i18n';
import { getActiveChild, setGroep } from '@/store/children';
import { GroepKiezer } from './GroepKiezer';

/**
 * De groep van het kind dat nu oefent (ADR-151), bij de instellingen op Jij.
 *
 * Het stond op Voor ouders, omdat instellingen bij de ouder stonden (ADR-143).
 * Die pagina is weg (ADR-171): ouders loggen niet in, kinderen wel. Het kind
 * kiest zijn groep één keer, bij het begin of op de voordeur; daarna is het
 * hier, tussen de andere instellingen.
 *
 * De knop die aanstaat, is de groep van nu: wie vorig schooljaar groep 5 koos,
 * ziet hier groep 6. Kiezen schrijft meteen weg, en Vandaag en elke vakpagina
 * lezen hem de volgende keer dat ze openen.
 */
export function GroepInstelling() {
  const [kind, setKind] = useState<{
    readonly id: string;
    readonly naam: string;
    readonly groep: Groep | undefined;
  } | null>(null);
  const [bezig, setBezig] = useState(false);

  useEffect(() => {
    void getActiveChild().then((profiel) => {
      if (profiel) {
        setKind({ id: profiel.id, naam: profiel.naam, groep: huidigeGroep(profiel, new Date()) });
      }
    });
  }, []);

  if (kind === null) return null;

  async function kies(groep: Groep | undefined) {
    if (kind === null) return;
    setBezig(true);
    await setGroep(kind.id, groep);
    setKind({ ...kind, groep });
    setBezig(false);
  }

  return (
    <section className="flex flex-col gap-3" aria-labelledby="groep-jij">
      <h2 id="groep-jij" className="tk-sectie">
        {t('groep.jijTitel')}
      </h2>
      <p className="text-lopend text-tekst-secundair">{t('groep.jijUitleg')}</p>
      <GroepKiezer
        gekozen={kind.groep}
        uitweg="groep.geen"
        bezig={bezig}
        onKies={(groep) => void kies(groep)}
      />
      <p className="tk-hulp" role="status">
        {kind.groep === undefined
          ? t('groep.nietGekozen')
          : t('groep.gekozen', { groep: kind.groep })}
      </p>
    </section>
  );
}
