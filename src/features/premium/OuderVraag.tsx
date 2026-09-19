import { useEffect, useId, useRef } from 'react';
import { FamilyIcon } from '@/components/Icon';
import { t } from '@/i18n';
import { isTeKoop } from '@/store/premium';
import { CodeVeld } from './CodeVeld';
import { sluitOuderVraag, useOuderVraag } from './ouderVraag';
import { naarPremium, usePremium } from './usePremium';

/**
 * "Vraag het even aan je ouders" (ADR-163).
 *
 * Wie op een slot drukte, kreeg de premiumpagina: een etalage met een prijs,
 * vier kaarten, een vergelijkingstabel en helemaal onderaan een codeveld. Voor
 * een ouder is dat de goede pagina. Voor een kind van acht dat op een tegel
 * drukte is het een deur die dichtsloeg en een verkooppraatje dat ervoor in de
 * plaats kwam — en het kind kan er niets mee, want het kind koopt niets.
 *
 * Dus eerst dit: een klein venster over de pagina waar je was, met drie dingen
 * en niets meer.
 *
 * 1. **Wat er aan de hand is**, in één zin, en wat premium doet, in één. Geen
 *    vier kaarten: dit is geen pagina om een besluit op te nemen.
 * 2. **Het codeveld.** Veel gezinnen hebben een code en het kind weet dat niet;
 *    dit is de plek waar een ouder hem intypt terwijl hij toch al over de
 *    schouder meekijkt. Klopt hij, dan gaat het venster dicht en staat het kind
 *    weer waar het was — met het spel nu open.
 * 3. **De weg naar een code**, voor wie er geen heeft: naar de kassa, en naar
 *    de pagina die het uitlegt.
 *
 * En de kop richt zich tot het kind: haal er iemand bij. Dat is eerlijker dan
 * een kind aanspreken alsof het de koper is, en het is ook precies wat er moet
 * gebeuren.
 *
 * **Een echte `<dialog>`.** Die vangt de focus, sluit op Escape en legt zijn
 * eigen laag over de pagina — drie dingen die met de hand nagebouwd altijd voor
 * de helft blijven staan. Wegklikken brengt je terug waar je was, want deze
 * vraag heeft geen adres (`ouderVraag.ts`).
 */

/** De kassa, als adres, zoals op de premiumpagina (ADR-123). */
const KASSA_PAD = '/kopen/';

export function OuderVraag() {
  const open = useOuderVraag();
  const { actief } = usePremium();
  const venster = useRef<HTMLDialogElement>(null);
  const kop = useId();

  // Openen en sluiten via de methodes, niet via het `open`-attribuut: alleen
  // `showModal` geeft de focusval, de Escape en de ::backdrop.
  useEffect(() => {
    const dialoog = venster.current;
    if (!dialoog) return;
    if (open && !dialoog.open) dialoog.showModal();
    if (!open && dialoog.open) dialoog.close();
  }, [open]);

  // Een code die onderweg goedgekeurd wordt — hier, of op een ander tabblad —
  // maakt de vraag zinloos. Dan gaat het venster vanzelf dicht.
  useEffect(() => {
    if (actief) sluitOuderVraag();
  }, [actief]);

  return (
    <dialog
      ref={venster}
      className="tk-venster"
      aria-labelledby={kop}
      // Escape en de klik op de achtergrond sluiten het venster zelf; dit houdt
      // onze schakelaar gelijk aan wat de browser deed.
      onClose={sluitOuderVraag}
      onClick={(event) => {
        if (event.target === venster.current) sluitOuderVraag();
      }}
    >
      <div className="tk-venster-body">
        <p className="tk-kaartteken">
          <FamilyIcon size={24} />
        </p>
        <h2 id={kop} className="tk-titel">
          {t('ouderVraag.titel')}
        </h2>
        <p className="text-lopend">{t('ouderVraag.uitleg')}</p>
        <p className="text-lopend text-tekst-secundair">{t('ouderVraag.watPremium')}</p>

        <CodeVeld className="flex flex-col gap-3" onGelukt={sluitOuderVraag} />

        <div className="tk-venster-knoppen">
          {isTeKoop() ? (
            <a className="tk-button tk-button-secondary" href={KASSA_PAD}>
              {t('premium.kopenKnop')}
            </a>
          ) : null}
          <button
            type="button"
            className="tk-button tk-button-tertiary"
            onClick={() => {
              sluitOuderVraag();
              naarPremium();
            }}
          >
            {t('ouderVraag.bekijken')}
          </button>
        </div>

        {/* De uitweg als laatste en als gewone knop: wie niets wil, hoort niet
            te hoeven zoeken hoe hij terugkomt. Het kruisje rechtsboven doet
            hetzelfde en staat er voor wie het daar zoekt. */}
        <button type="button" className="tk-doel-ander self-start" onClick={sluitOuderVraag}>
          {t('ouderVraag.terug')}
        </button>
      </div>

      <button
        type="button"
        className="tk-venster-sluit"
        aria-label={t('ouderVraag.sluit')}
        onClick={sluitOuderVraag}
      >
        <span aria-hidden="true">×</span>
      </button>
    </dialog>
  );
}
