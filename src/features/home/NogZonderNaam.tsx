import { useEffect, useState } from 'react';
import { t } from '@/i18n';
import { isIngesteld } from '@/store/account';
import { activeChildId } from '@/store/children';
import { naamAlGevraagd, zetNaamGevraagd } from '@/store/profile';
import { MetCode } from '@/features/player/MetCode';
import { NaamVraag } from '@/features/player/NaamVraag';

/**
 * Wat de voordeur zegt tegen wie nog geen naam heeft (ADR-229).
 *
 * Er stond een naamscherm vóór de voordeur, met drie uitwegen eronder: eerst
 * proberen, "Ik ben een ouder" en "Ik heb een inlogcode". Het naamscherm is
 * weg, dus proberen is gewoon de voordeur zelf, en de twee andere staan hier,
 * als twee knoppen onder de eerste ronde. Een ouder gaat naar de pagina die
 * voor hem geschreven is (ADR-214); een kind met een code logt hier in.
 */
export function VoorWieNieuwIs({ onVoorOuders }: { readonly onVoorOuders: () => void }) {
  const [inloggen, setInloggen] = useState(false);

  if (inloggen) {
    // Wie inlogt, wordt dit kind (`createProfile`), en elk scherm houdt een
    // stukje van het kind van daarnet: opnieuw laden, zoals de wisselaar doet.
    return <MetCode onReady={() => window.location.reload()} onTerug={() => setInloggen(false)} />;
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button type="button" className="tk-button tk-button-tertiary" onClick={onVoorOuders}>
        {t('naam.ikBenOuder')}
      </button>
      {isIngesteld() ? (
        <button
          type="button"
          className="tk-button tk-button-tertiary"
          onClick={() => setInloggen(true)}
        >
          {t('inlog.knop')}
        </button>
      ) : null}
    </div>
  );
}

/**
 * De uitnodiging om je naam te typen, na de eerste ronde (ADR-229).
 *
 * Geen poort: de rest van Vandaag staat eronder en werkt. "Niet nu" zet hem
 * voorgoed weg voor dit kind, zoals de vraag naar de groep (ADR-151); de naam
 * kan daarna nog op Jij, en de toets vraagt hem als het diploma eraan komt.
 *
 * **Niets tot het bekend is**, zoals `GroepVraag`: een vraag die even
 * verschijnt en dan verdwijnt, is een knop onder een vinger die weg is.
 */
export function NaamUitnodiging() {
  const [kindId, setKindId] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const id = await activeChildId();
      if (!(await naamAlGevraagd(id))) setKindId(id);
    })();
  }, []);

  if (kindId === null) return null;

  return (
    <NaamVraag
      moment="vandaag"
      // De naam staat ook in de balk en in de kop: opnieuw laden, zoals
      // hernoemen op Jij, zodat nergens het oude "Hoi!" blijft staan.
      onKlaar={() => window.location.reload()}
      onNietNu={() => {
        void zetNaamGevraagd(kindId);
        setKindId(null);
      }}
    />
  );
}
