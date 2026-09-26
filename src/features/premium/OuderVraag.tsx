import { tel } from '@/store/teller';
import { useEffect, useRef, useState } from 'react';
import { FamilyIcon, NextIcon, OogIcon, SlotIcon } from '@/components/Icon';
import { t } from '@/i18n';
import { isTeKoop } from '@/store/premium';
import { CodeVeld } from './CodeVeld';
import { Doorsturen } from './Doorsturen';
import { huidigeWens, isVraagOmPlek, sluitOuderVraag, useOuderVraag } from './ouderVraag';
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
 *
 * **Dicht is leeg.** Een gesloten `<dialog>` staat niet op het scherm, maar hij
 * staat wél in het document, en daarmee stond er een tweede codeveld in de
 * pagina — op de premiumpagina zelfs naast het echte. Voor een schermlezer is
 * dat niets, want `display: none` haalt hem uit de boom; voor alles wat het
 * document zelf leest, is het een dubbele. Dus wordt de inhoud pas getekend als
 * het venster opengaat, en daarmee is elke keer dat hij opengaat ook een vers
 * veld in plaats van de tekst die er de vorige keer nog in stond.
 */

/** De kassa, als adres, zoals op de premiumpagina (ADR-123). */
const KASSA_PAD = '/kopen/';

export function OuderVraag() {
  const open = useOuderVraag();
  const { actief } = usePremium();
  const venster = useRef<HTMLDialogElement>(null);

  // Openen en sluiten via de methodes, niet via het `open`-attribuut: alleen
  // `showModal` geeft de focusval, de Escape en de ::backdrop.
  useEffect(() => {
    const dialoog = venster.current;
    if (!dialoog) return;
    if (open && !dialoog.open) dialoog.showModal();
    if (!open && dialoog.open) dialoog.close();
  }, [open]);

  // Een code die onderweg goedgekeurd wordt — hier, of op een ander tabblad —
  // maakt de vraag zinloos. Dan gaat het venster vanzelf dicht. Niet als het
  // over een volle code gaat: dan staat premium juist aan (ADR-226).
  useEffect(() => {
    if (actief && !isVraagOmPlek()) sluitOuderVraag();
  }, [actief]);

  return (
    <dialog
      ref={venster}
      className="tk-venster"
      // Een `aria-label` en geen `aria-labelledby` (ADR-174). Het venster heeft
      // drie standen en de kop staat alleen in de eerste; een verwijzing naar
      // een id dat in de tweede niet meer bestaat, laat het venster zonder naam
      // achter — precies op het moment dat een schermlezer hem het hardst
      // nodig heeft. De naam is de vraag, en die blijft in alle drie dezelfde.
      aria-label={open ? t('ouderVraag.titel') : undefined}
      // Escape en de klik op de achtergrond sluiten het venster zelf; dit houdt
      // onze schakelaar gelijk aan wat de browser deed.
      onClose={sluitOuderVraag}
      onClick={(event) => {
        if (event.target === venster.current) sluitOuderVraag();
      }}
    >
      {/* Alleen als hij openstaat: zie hierboven. Met een `key` op het openen,
          zodat elke keer bij de vraag begint en niet bij het antwoord van de
          vorige keer. */}
      {open ? (
        <>
          <Inhoud />
          <button
            type="button"
            className="tk-venster-sluit"
            aria-label={t('ouderVraag.sluit')}
            onClick={sluitOuderVraag}
          >
            <span aria-hidden="true">×</span>
          </button>
        </>
      ) : null}
    </dialog>
  );
}

/**
 * De drie uitwegen (ADR-174).
 *
 * De eerste vraag is niet "heb je een code" maar **"is er iemand bij je?"**,
 * want dat is het enige wat het kind op dit moment weet en het bepaalt alle
 * drie de antwoorden. Daarom staat het codeveld niet meer meteen in beeld
 * (ADR-163 zette het daar): voor een kind dat alleen zit, is een veld dat het
 * niet kan invullen een dichte deur met een formulier ervoor.
 */
type Uitweg = 'vraag' | 'code' | 'sturen';

function Inhoud() {
  const [uitweg, setUitweg] = useState<Uitweg>('vraag');
  // Wat het kind wilde (ADR-193): het venster zegt het terug, zodat de vraag
  // over dít gaat en niet over "een onderdeel".
  const [wens] = useState(huidigeWens);
  const [omPlek] = useState(isVraagOmPlek);

  // De code is vol (ADR-226): één zin, en terug. De ouder regelt het op de
  // ouderpagina, achter de pincode.
  if (omPlek) {
    return (
      <div className="tk-venster-body">
        <p className="tk-kaartteken">
          <FamilyIcon size={24} />
        </p>
        <h2 className="tk-titel">{t('ouderVraag.titel')}</h2>
        <p className="text-lopend">{t('ouderVraag.plekUitleg')}</p>
        <button type="button" className="tk-doel-ander self-start" onClick={sluitOuderVraag}>
          {t('ouderVraag.plekTerug')}
        </button>
      </div>
    );
  }

  if (uitweg === 'code') {
    return (
      <div className="tk-venster-body">
        <h2 className="tk-titel">{t('ouderVraag.codeTitel')}</h2>
        <p className="text-lopend">{t('ouderVraag.codeUitleg')}</p>
        <CodeVeld className="flex flex-col gap-3" onGelukt={sluitOuderVraag} />
        {isTeKoop() ? (
          <div className="tk-venster-knoppen">
            <a
              className="tk-button tk-button-secondary"
              href={KASSA_PAD}
              onClick={() => tel('kassa')}
            >
              {t('premium.kopenKnop')}
            </a>
          </div>
        ) : null}
        <Terug onTerug={() => setUitweg('vraag')} />
      </div>
    );
  }

  if (uitweg === 'sturen') {
    return (
      <div className="tk-venster-body">
        <Doorsturen />
        <Terug onTerug={() => setUitweg('vraag')} />
      </div>
    );
  }

  return (
    <div className="tk-venster-body">
      <p className="tk-kaartteken">
        <FamilyIcon size={24} />
      </p>
      <h2 className="tk-titel">{t('ouderVraag.titel')}</h2>
      <p className="text-lopend">
        {wens === null
          ? t('ouderVraag.uitleg')
          : wens.soort === 'klaar'
            ? t('ouderVraag.uitlegKlaar', { wat: wens.wat })
            : t('ouderVraag.uitlegWat', { wat: wens.wat })}
      </p>

      <ul className="tk-lijst">
        <Keuze
          teken={<SlotIcon size={24} />}
          titel={t('ouderVraag.erbij')}
          regel={t('ouderVraag.erbijRegel')}
          onKies={() => setUitweg('code')}
        />
        {/* De nieuwe, en de enige die iets oplost voor een kind dat alleen is. */}
        <Keuze
          teken={<FamilyIcon size={24} />}
          titel={t('ouderVraag.sturen')}
          regel={t('ouderVraag.sturenRegel')}
          onKies={() => setUitweg('sturen')}
        />
        <Keuze
          teken={<OogIcon size={24} />}
          titel={t('ouderVraag.bekijken')}
          regel={t('ouderVraag.bekijkenRegel')}
          onKies={() => {
            sluitOuderVraag();
            naarPremium();
          }}
        />
      </ul>

      {/* De uitweg als laatste en als gewone knop: wie niets wil, hoort niet te
          hoeven zoeken hoe hij terugkomt. Het kruisje rechtsboven doet hetzelfde
          en staat er voor wie het daar zoekt. */}
      <button type="button" className="tk-doel-ander self-start" onClick={sluitOuderVraag}>
        {t('ouderVraag.terug')}
      </button>
    </div>
  );
}

function Keuze({
  teken,
  titel,
  regel,
  onKies,
}: {
  readonly teken: React.ReactNode;
  readonly titel: string;
  readonly regel: string;
  readonly onKies: () => void;
}) {
  return (
    <li>
      <button type="button" className="tk-lijstrij" onClick={onKies}>
        <span className="tk-plaat tk-plaat-neutraal">{teken}</span>
        <span className="tk-lijstrij-tekst">
          <span className="tk-lijstrij-titel">{titel}</span>
          <span className="tk-lijstrij-regel">{regel}</span>
        </span>
        <span className="tk-lijstrij-pijl">
          <NextIcon size={20} />
        </span>
      </button>
    </li>
  );
}

/** Terug naar de drie, en niet naar de pagina: die vraag staat nog open. */
function Terug({ onTerug }: { readonly onTerug: () => void }) {
  return (
    <button type="button" className="tk-doel-ander self-start" onClick={onTerug}>
      {t('ouderVraag.terugVraag')}
    </button>
  );
}
