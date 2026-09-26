import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { CorrectIcon, NextIcon, PupilIcon, SlotIcon } from '@/components/Icon';
import { t } from '@/i18n';
import {
  activeChildId,
  createChild,
  listChildren,
  MAX_KINDEREN,
  renameChild,
  switchChild,
} from '@/store/children';
import type { ProfileRecord } from '@/store/db';
import { heeftNaam } from '@/store/profile';
import { tel } from '@/store/teller';
import { NAAM_MAX } from '@/features/player/NaamVraag';
import { Pinslot } from './Pinslot';
import { naarOuder } from './useOuder';
import { sluitWisselaar, useWisselaar } from './wisselaar';

/**
 * "Wie gebruikt de app?" — de profielwisselaar (ADR-173).
 *
 * Tot nu toe stond het wisselen tussen kinderen als blok op Jij, achter
 * premium, en was de ouder nergens. Allebei klopte niet. Wisselen hoort in de
 * **balk**, want het moet overal kunnen en het is geen onderdeel van een
 * pagina; en de ouder hoort **in dezelfde lijst**, want de vraag die je stelt
 * als je hem opent is precies "wie zit hier achter het scherm".
 *
 * Dat is de vorm die Netflix, Squla en Khan Academy Kids alle drie hebben, en
 * de reden is bij alle drie dezelfde: een gezin deelt één apparaat vaker dan
 * het één account deelt.
 *
 * **Een kind hoeft niets in te tikken.** Tik op je naam en je oefent. De prijs
 * is echt en is aanvaard: een broertje kan in het profiel van zijn zus oefenen
 * en haar dozen beïnvloeden. Op een gedeeld gezinsapparaat is dat de goedkope
 * kant — een verkeerd profiel kost één ronde, een wachtwoord bij elke start
 * kost het oefenen zelf.
 *
 * **De ouder heeft een hangslot**, en wat erachter zit is pas te zien als het
 * open is. Dat is niet alleen netjes: Apple en Google eisen voor een app voor
 * kinderen dat alles wat met kopen te maken heeft achter zo'n poort staat.
 *
 * **Een echte `<dialog>` met `showModal`**, zoals ADR-163: de browser doet de
 * toplaag, de focusval en Escape, en met de hand nagebouwd blijft daar altijd
 * de helft van staan. Dicht is ook leeg — de inhoud wordt pas getekend als hij
 * opengaat — want een gesloten venster staat wél in het document, en dan stond
 * er een tweede lijst met dezelfde namen in de pagina.
 *
 * **Wisselen laadt de pagina opnieuw.** Dat is bot en het is het juiste: elk
 * scherm houdt een stukje van een kind in React-state, en het ene wat dit nooit
 * mag doen is het ene kind een getal van het andere laten zien.
 */
export function Profielwisselaar() {
  const stand = useWisselaar();
  const open = stand !== 'dicht';
  const venster = useRef<HTMLDialogElement>(null);
  const kop = useId();

  useEffect(() => {
    const dialoog = venster.current;
    if (!dialoog) return;
    if (open && !dialoog.open) dialoog.showModal();
    if (!open && dialoog.open) dialoog.close();
  }, [open]);

  return (
    <dialog
      ref={venster}
      className="tk-venster"
      aria-labelledby={open ? kop : undefined}
      onClose={sluitWisselaar}
      onClick={(event) => {
        if (event.target === venster.current) sluitWisselaar();
      }}
    >
      {open ? (
        <>
          {/* `key` op de stand waarmee hij opengaat: wie het venster sluit en
              opnieuw opent, hoort op de plek te beginnen waar hij het opende,
              en niet waar hij de vorige keer gebleven was. */}
          <Inhoud key={stand} kopId={kop} begin={stand === 'slot' ? 'slot' : 'lijst'} />
          <button
            type="button"
            className="tk-venster-sluit"
            aria-label={t('wisselaar.sluit')}
            onClick={sluitWisselaar}
          >
            <span aria-hidden="true">×</span>
          </button>
        </>
      ) : null}
    </dialog>
  );
}

/**
 * De twee standen van het venster: de lijst, en de deur naar de ouder.
 *
 * Een eigen component omdat hij pas bestaat als het venster opengaat, en dan
 * elke keer vers. Dat is wat de lijst laat kloppen zonder dat er iets naar
 * veranderingen hoeft te luisteren: wie hem opent, kijkt naar wat er nú staat.
 */
function Inhoud({ kopId, begin }: { readonly kopId: string; readonly begin: 'lijst' | 'slot' }) {
  const [stand, setStand] = useState<'lijst' | 'slot'>(begin);

  if (stand === 'slot') {
    return (
      <div className="tk-venster-body">
        <Pinslot
          onOpen={() => {
            sluitWisselaar();
            naarOuder();
          }}
        />
        <button
          type="button"
          className="tk-doel-ander self-start"
          onClick={() => setStand('lijst')}
        >
          {t('wisselaar.terugLijst')}
        </button>
      </div>
    );
  }

  return <Lijst kopId={kopId} onOuder={() => setStand('slot')} />;
}

function Lijst({ kopId, onOuder }: { readonly kopId: string; readonly onOuder: () => void }) {
  const [kinderen, setKinderen] = useState<ProfileRecord[] | null>(null);
  const [actief, setActief] = useState<string | null>(null);
  const [erbij, setErbij] = useState(false);
  const [naam, setNaam] = useState('');
  // De naam van het kind zonder naam dat hier al oefent (ADR-229).
  const [eigenNaam, setEigenNaam] = useState('');
  const [bezig, setBezig] = useState(false);
  const veld = useId();
  const eigenVeld = useId();

  useEffect(() => {
    void Promise.all([listChildren(), activeChildId()]).then(([rijen, id]) => {
      setKinderen(rijen);
      setActief(id);
    });
  }, []);

  // Wie hier al zonder naam oefent (ADR-229). Bij een tweede kind moet je ze
  // uit elkaar kunnen houden, dus dan krijgt het eerst een naam.
  const naamloos = kinderen?.find((kind) => !heeftNaam(kind)) ?? null;

  async function voegToe(event: FormEvent) {
    event.preventDefault();
    if (naam.trim() === '' || (naamloos !== null && eigenNaam.trim() === '')) return;
    setBezig(true);
    if (naamloos !== null) {
      await renameChild(naamloos.id, eigenNaam);
      tel('naam', '/wisselaar');
    }
    const kind = await createChild(naam);
    // Geweigerd betekent dat er in de tussentijd al drie stonden — op een ander
    // tabblad. Dan is de lijst het antwoord en niet een foutmelding.
    if (kind === null) {
      setBezig(false);
      setErbij(false);
      setKinderen(await listChildren());
      return;
    }
    window.location.reload();
  }

  async function geef(id: string) {
    setBezig(true);
    await switchChild(id);
    window.location.reload();
  }

  const vol = (kinderen?.length ?? 0) >= MAX_KINDEREN;

  return (
    <div className="tk-venster-body">
      <h2 id={kopId} className="tk-titel">
        {t('wisselaar.titel')}
      </h2>

      <ul className="tk-lijst" aria-busy={kinderen === null}>
        {(kinderen ?? []).map((kind) => {
          const nu = kind.id === actief;
          const wie = heeftNaam(kind) ? kind.naam : t('wisselaar.zonderNaam');

          return (
            <li key={kind.id}>
              {/* Wie nu oefent kan de beurt niet nog een keer krijgen: er valt
                  niets te doen, en een knop die niets doet liegt. */}
              <button
                type="button"
                className="tk-lijstrij"
                aria-pressed={nu}
                disabled={nu || bezig}
                onClick={() => void geef(kind.id)}
              >
                <span className="tk-plaat tk-plaat-neutraal">
                  <PupilIcon size={24} />
                </span>
                <span className="tk-lijstrij-tekst">
                  <span className="tk-lijstrij-titel">{wie}</span>
                  <span className="tk-lijstrij-regel">
                    {nu ? t('wisselaar.oefentNu') : t('wisselaar.geefBeurt', { naam: wie })}
                  </span>
                </span>
                <span className="tk-lijstrij-pijl">
                  {nu ? <CorrectIcon size={20} /> : <NextIcon size={20} />}
                </span>
              </button>
            </li>
          );
        })}

        {/* De ouder staat in dezelfde lijst, achter een haarlijn van een rij:
            het is een antwoord op dezelfde vraag. Met een hangslot, zodat een
            kind ziet dat dit niet van hem is voordat het erop drukt. */}
        <li>
          <button type="button" className="tk-lijstrij" onClick={onOuder} disabled={bezig}>
            <span className="tk-plaat tk-plaat-neutraal">
              <SlotIcon size={24} />
            </span>
            <span className="tk-lijstrij-tekst">
              <span className="tk-lijstrij-titel">{t('wisselaar.ouder')}</span>
              <span className="tk-lijstrij-regel">{t('wisselaar.ouderRegel')}</span>
            </span>
            <span className="tk-lijstrij-pijl">
              <NextIcon size={20} />
            </span>
          </button>
        </li>
      </ul>

      {erbij ? (
        <form className="flex flex-wrap items-end gap-3" onSubmit={(event) => void voegToe(event)}>
          {naamloos !== null ? (
            <div className="flex flex-col gap-2">
              <label htmlFor={eigenVeld} className="tk-label">
                {t('wisselaar.naamNu')}
              </label>
              <input
                id={eigenVeld}
                className="tk-input max-w-xs"
                value={eigenNaam}
                onChange={(event) => setEigenNaam(event.target.value)}
                autoComplete="off"
                maxLength={NAAM_MAX}
                autoFocus
              />
            </div>
          ) : null}
          <div className="flex flex-col gap-2">
            <label htmlFor={veld} className="tk-label">
              {t('wisselaar.kindNaam')}
            </label>
            <input
              id={veld}
              className="tk-input max-w-xs"
              value={naam}
              onChange={(event) => setNaam(event.target.value)}
              autoComplete="off"
              maxLength={NAAM_MAX}
              autoFocus={naamloos === null}
            />
          </div>
          <button
            type="submit"
            className="tk-button"
            disabled={bezig || naam.trim() === '' || (naamloos !== null && eigenNaam.trim() === '')}
          >
            {t('wisselaar.voegToe')}
          </button>
        </form>
      ) : null}

      {!erbij && !vol ? (
        <button
          type="button"
          className="tk-button tk-button-secondary self-start"
          onClick={() => setErbij(true)}
        >
          {t('wisselaar.nogEenKind')}
        </button>
      ) : null}

      {/* De grens wordt genoemd waar hij geldt, en alleen dan. Een zin over drie
          kinderen op een apparaat met één kind is ruis. */}
      {vol ? <p className="tk-hulp">{t('wisselaar.vol', { aantal: MAX_KINDEREN })}</p> : null}
    </div>
  );
}
