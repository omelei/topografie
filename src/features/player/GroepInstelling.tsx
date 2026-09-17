import { useEffect, useState } from 'react';
import { huidigeGroep, type Groep } from '@/game-core';
import { t } from '@/i18n';
import { getActiveChild, setGroep } from '@/store/children';
import { GroepKiezer } from './GroepKiezer';

/**
 * De groep van het kind dat nu oefent, op Voor ouders (ADR-151).
 *
 * Hier en niet op Jij: wat de app voorstelt is een instelling, en instellingen
 * staan bij de ouder (ADR-143). Zonder slot, zoals de rest van deze pagina
 * (ADR-136). Het kind kiest zijn groep één keer, bij het begin of op de
 * voordeur; daarna is het hier.
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
    <section className="flex flex-col gap-3" aria-labelledby="groep-ouder">
      <h2 id="groep-ouder" className="tk-sectie">
        {t('groep.ouderTitel', { naam: kind.naam })}
      </h2>
      <p className="text-lopend text-tekst-secundair">
        {t('groep.ouderUitleg', { naam: kind.naam })}
      </p>
      <GroepKiezer
        gekozen={kind.groep}
        uitweg="groep.geen"
        bezig={bezig}
        onKies={(groep) => void kies(groep)}
      />
      <p className="tk-hulp" role="status">
        {kind.groep === undefined
          ? t('groep.nietGekozen')
          : t('groep.gekozen', { naam: kind.naam, groep: kind.groep })}
      </p>
    </section>
  );
}
