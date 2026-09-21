import { useId, useState, type FormEvent } from 'react';
import { SlotIcon } from '@/components/Icon';
import { t, type TranslationKey } from '@/i18n';
import { isGeldigePin, PIN_LENGTE, probeer, zetPin, type OuderFout } from '@/store/ouder';
import { useOuder } from './useOuder';

/**
 * De deur naar de ouderpagina (ADR-173).
 *
 * Twee standen in één component, want het is één deur. Staat er nog geen
 * pincode op dit apparaat, dan kiest de ouder er hier een; staat hij er wel,
 * dan tikt hij hem in. Twee losse componenten zouden dezelfde velden, dezelfde
 * foutmeldingen en dezelfde knop twee keer hebben, en uit elkaar lopen op de
 * dag dat er een melding bij komt — dezelfde afweging die ADR-163 voor
 * `CodeVeld` maakte.
 *
 * **Vier cijfers en geen wachtwoord**, en dat is een besluit met een prijs. Het
 * wachtwoord van het gezinsaccount is de waarheid en komt in F3; dit is de
 * dagelijkse deur op dít apparaat. Een ouder die tien keer per week veertien
 * tekens op een schermtoetsenbord tikt, kiest binnen een maand een kort
 * wachtwoord of plakt het op de iPad, en dan is het slot minder waard dan deze
 * vier cijfers.
 *
 * **Drie missers kosten een minuut.** Tienduizend mogelijkheden zijn met de
 * hand niet af te lopen zodra elke drie pogingen een minuut kosten, en dat is
 * precies zo zwaar als het hoort te zijn: hierachter zit geen kluis maar de
 * instellingen van dit apparaat.
 *
 * **Vergeten kan, en het levert niets op.** Er is met opzet geen weg die alleen
 * het slot weghaalt — dat zou geen slot zijn. Wie de pincode kwijt is, houdt
 * één uitweg: alles van dit apparaat halen. Die staat op de ouderpagina zelf en
 * hier als zin, want wie hem neemt, houdt een leeg apparaat over.
 */

const FOUT: Record<OuderFout, TranslationKey> = {
  'geen-cijfers': 'ouder.fout.geenCijfers',
  ongelijk: 'ouder.fout.ongelijk',
  onjuist: 'ouder.fout.onjuist',
  'te-vaak': 'ouder.fout.teVaak',
  'geen-kluis': 'ouder.fout.geenKluis',
};

export function Pinslot({ onOpen }: { readonly onOpen: () => void }) {
  const { pinGezet } = useOuder();
  const [pin, setPin] = useState('');
  const [herhaling, setHerhaling] = useState('');
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<OuderFout | null>(null);
  const [wacht, setWacht] = useState(0);

  const pinVeld = useId();
  const herhaalVeld = useId();
  const melding = useId();

  async function verstuur(event: FormEvent) {
    event.preventDefault();
    setBezig(true);
    setFout(null);

    const uitkomst = pinGezet ? await probeer(pin) : await zetPin(pin, herhaling);
    setBezig(false);

    if (!uitkomst.ok) {
      setFout(uitkomst.reden);
      setWacht(uitkomst.wachtSeconden);
      setPin('');
      setHerhaling('');
      return;
    }

    // Een verse pincode opent de deur niet vanzelf: `zetPin` zet het slot en
    // `probeer` doet open. Meteen daarna proberen zou de ouder vragen om wat
    // hij net getypt heeft, dus dat gebeurt hier met dezelfde cijfers.
    if (!pinGezet) await probeer(pin);
    setPin('');
    setHerhaling('');
    onOpen();
  }

  const klaar = isGeldigePin(pin) && (pinGezet || isGeldigePin(herhaling));

  return (
    <form className="flex flex-col gap-3" onSubmit={(event) => void verstuur(event)}>
      <p className="tk-kaartteken">
        <SlotIcon size={24} />
      </p>
      <h2 className="tk-titel">{pinGezet ? t('ouder.slotTitel') : t('ouder.maakTitel')}</h2>
      <p className="text-lopend">{pinGezet ? t('ouder.slotUitleg') : t('ouder.maakUitleg')}</p>

      <label htmlFor={pinVeld} className="tk-label">
        {pinGezet ? t('ouder.pin') : t('ouder.pinNieuw')}
      </label>
      {/*
        `inputMode="numeric"` geeft een telefoon het cijferbord zonder dat het
        veld een spinknop krijgt, wat `type="number"` wel doet — en een spinknop
        bij een pincode is een knop waarmee je hem kunt raden door te tikken.
        `type="password"` verbergt de cijfers voor wie meekijkt, en dat is hier
        letterlijk het geval: het kind staat erbij.
      */}
      <input
        id={pinVeld}
        className="tk-input max-w-[10rem]"
        type="password"
        inputMode="numeric"
        autoComplete="off"
        maxLength={PIN_LENGTE}
        value={pin}
        onChange={(event) => setPin(event.target.value.replace(/\D/g, ''))}
        aria-describedby={fout ? melding : undefined}
        aria-invalid={fout ? true : undefined}
        autoFocus
      />

      {pinGezet ? null : (
        <>
          <label htmlFor={herhaalVeld} className="tk-label">
            {t('ouder.pinHerhaal')}
          </label>
          <input
            id={herhaalVeld}
            className="tk-input max-w-[10rem]"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={PIN_LENGTE}
            value={herhaling}
            onChange={(event) => setHerhaling(event.target.value.replace(/\D/g, ''))}
            aria-describedby={fout ? melding : undefined}
          />
        </>
      )}

      <button type="submit" className="tk-button self-start" disabled={bezig || !klaar}>
        {pinGezet ? t('ouder.open') : t('ouder.bewaarPin')}
      </button>

      {fout ? (
        <p id={melding} role="alert" className="text-lopend">
          {fout === 'te-vaak' ? t('ouder.fout.teVaak', { seconden: wacht }) : t(FOUT[fout])}
        </p>
      ) : null}

      <p className="tk-hulp">{pinGezet ? t('ouder.vergeten') : t('ouder.maakHulp')}</p>
    </form>
  );
}
