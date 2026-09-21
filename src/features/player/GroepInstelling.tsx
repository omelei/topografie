import { useEffect, useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon, GridIcon } from '@/components/Icon';
import { huidigeGroep, type Groep } from '@/game-core';
import { t } from '@/i18n';
import { getActiveChild, setGroep } from '@/store/children';
import { GroepKiezer } from './GroepKiezer';

/**
 * De groep van het kind dat nu oefent (ADR-151), als rij bij de instellingen
 * op Jij (ADR-172).
 *
 * Het stond op Voor ouders, omdat instellingen bij de ouder stonden (ADR-143),
 * en daarna als eigen blok op Jij (ADR-171): een kop, twee zinnen en zeven
 * knoppen, bij elk bezoek. Maar een groep kies je één keer, bij het begin of op
 * de voordeur, en op 1 augustus schuift hij vanzelf door. Dus is het nu een rij
 * tussen de andere instellingen die zegt welke groep het is, en de knoppen
 * komen pas als je erop drukt.
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
  const [open, setOpen] = useState(false);
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
    <li>
      <button
        type="button"
        className="tk-lijstrij"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span className="tk-plaat tk-plaat-neutraal">
          <GridIcon size={24} />
        </span>
        <span className="tk-lijstrij-tekst">
          <span className="tk-lijstrij-titel">{t('groep.jijTitel')}</span>
          <span className="tk-lijstrij-regel">
            {kind.groep === undefined
              ? t('groep.rijGeen')
              : t('groep.knop', { groep: kind.groep })}
          </span>
        </span>
        <span className="tk-lijstrij-pijl">
          {open ? <ChevronUpIcon size={20} /> : <ChevronDownIcon size={20} />}
        </span>
      </button>

      {open ? (
        <div className="flex flex-col gap-3 px-4 pb-4">
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
        </div>
      ) : null}
    </li>
  );
}
