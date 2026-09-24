import { useId, useState, type FormEvent } from 'react';
import { SlotIcon } from '@/components/Icon';
import { t } from '@/i18n';
import { isVolwassenJaar } from '@/store/ouder';

/**
 * "Even kijken of je een volwassene bent" (ADR-176).
 *
 * De poort vóór het zetten én het resetten van de pincode. ADR-173 had er geen:
 * wie als eerste bij de wisselaar kwam, mocht de pincode kiezen — en dat is
 * systematisch het kind, want het kind opent de app als eerste. Daarmee kon een
 * kind zichzelf de instellingen geven, van de parental gate een poort maken
 * waarvan het zelf de sleutel uitdeelde, en zijn ouder buitensluiten.
 *
 * **Geen rekensom.** Dat is de gebruikelijke poort in apps voor kinderen en
 * hier de slechtst denkbare: dit product leert kinderen tafels, dus we zouden
 * de poort bouwen die de app zelf traint om te openen.
 *
 * **Het jaar wordt gecontroleerd en weggegooid.** Er gaat geen `setSetting`
 * achteraan en geen verzoek de deur uit; het staat in de state van dit
 * formulier en verdwijnt ermee. Dat is wat deze vraag verenigbaar maakt met
 * ADR-050, dat zegt dat dit product nooit een geboortedatum vraagt: die regel
 * gaat over het kind, en dit is een vraag aan de volwassene waarvan het
 * antwoord niet blijft bestaan. De zin eronder zegt dat ook, want een ouder die
 * dit product om zijn privacy koos, hoort niet te moeten raden.
 *
 * **En het blijft een hek en geen kluis.** Een twaalfjarige die het doorheeft,
 * tikt een jaartal in. Wat het koopt is dat de zevenjarige er niet in wandelt
 * en dat de ouder de deur houdt.
 */
export function Volwassenencheck({ onGoed }: { readonly onGoed: () => void }) {
  const [jaar, setJaar] = useState('');
  const [fout, setFout] = useState(false);
  const veld = useId();
  const melding = useId();

  function verstuur(event: FormEvent) {
    event.preventDefault();
    if (!isVolwassenJaar(jaar)) {
      setFout(true);
      setJaar('');
      return;
    }
    onGoed();
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={verstuur}>
      <p className="tk-kaartteken">
        <SlotIcon size={24} />
      </p>
      <h2 className="tk-titel">{t('ouder.checkTitel')}</h2>
      <p className="text-lopend">{t('ouder.checkUitleg')}</p>

      <label htmlFor={veld} className="tk-label">
        {t('ouder.checkVraag')}
      </label>
      {/*
        `inputMode="numeric"` geeft een telefoon het cijferbord zonder de
        spinknoppen van `type="number"`, en een jaartal is vier cijfers — dus
        alles wat geen cijfer is, komt er niet in.
      */}
      <input
        id={veld}
        className="tk-input max-w-[10rem]"
        inputMode="numeric"
        autoComplete="off"
        maxLength={4}
        value={jaar}
        onChange={(event) => {
          setJaar(event.target.value.replace(/\D/g, ''));
          setFout(false);
        }}
        aria-describedby={fout ? melding : undefined}
        aria-invalid={fout ? true : undefined}
        autoFocus
      />

      <button type="submit" className="tk-button self-start" disabled={jaar.length < 4}>
        {t('ouder.checkKnop')}
      </button>

      {fout ? (
        <p id={melding} role="alert" className="tk-melding" data-soort="fout">
          {t('ouder.checkFout')}
        </p>
      ) : null}

      <p className="tk-hulp">{t('ouder.checkHulp')}</p>
    </form>
  );
}
