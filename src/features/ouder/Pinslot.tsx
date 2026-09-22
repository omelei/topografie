import { useId, useState, type FormEvent } from 'react';
import { SlotIcon } from '@/components/Icon';
import { t, type TranslationKey } from '@/i18n';
import { isGeldigePin, PIN_LENGTE, probeer, zetPin, type OuderFout } from '@/store/ouder';
import { useAccount } from '@/features/account/useAccount';
import { Accountcheck } from './Accountcheck';
import { useOuder } from './useOuder';
import { Volwassenencheck } from './Volwassenencheck';

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
 * **Er staat een poort vóór het zetten** (ADR-176, ADR-178). Zonder die poort
 * mocht iedereen die als eerste bij de wisselaar kwam de pincode kiezen, en dat
 * is systematisch het kind: het kind opent de app als eerste.
 *
 * Welke poort, hangt af van wat de bouw heeft. Met een gezinsproject is het het
 * **account**, en dan is een bevestigd mailadres de voorwaarde
 * (`Accountcheck.tsx`). Zonder project is het het **geboortejaar**
 * (`Volwassenencheck.tsx`) — zwakker, en de enige goede terugval voor een
 * apparaat dat nergens iets kan navragen.
 *
 * **De poort staat er elke keer, ook voor wie al ingelogd is.** Een sessie zegt
 * dat hier ooit een ouder is binnengekomen, niet dat er nu een staat; zie
 * `Accountcheck.tsx` voor waarom dat verschil het hele slot is.
 *
 * **En vergeten kan.** ADR-173 liet dat met opzet niet toe — "een weg die alleen
 * het slot weghaalt zou geen slot zijn" — en dat klopte alleen zolang de ouder
 * degene was die de pincode zette. Nu de check ervóór staat, is die check de
 * bescherming, en is niet-kunnen-resetten geen slot meer maar een val: een ouder
 * die zijn code kwijt was, moest het hele apparaat wissen om erbij te komen.
 */

const FOUT: Record<OuderFout, TranslationKey> = {
  'geen-cijfers': 'ouder.fout.geenCijfers',
  ongelijk: 'ouder.fout.ongelijk',
  onjuist: 'ouder.fout.onjuist',
  'te-vaak': 'ouder.fout.teVaak',
  'geen-kluis': 'ouder.fout.geenKluis',
};

/**
 * De drie standen van de deur.
 *
 * `openen` is de dagelijkse: er is een pincode en die wordt gevraagd. `check`
 * en `zetten` horen bij elkaar en komen twee keer langs — als dit apparaat nog
 * geen ouder heeft, en als iemand zijn code kwijt is.
 */
type Stand = 'openen' | 'check' | 'zetten';

export function Pinslot({ onOpen }: { readonly onOpen: () => void }) {
  const { pinGezet } = useOuder();
  const { ingesteld } = useAccount();
  const [stand, setStand] = useState<Stand>(pinGezet ? 'openen' : 'check');

  if (stand === 'check') {
    // Met een gezinsproject is het account de poort (ADR-178), en dan is een
    // bevestigd mailadres de voorwaarde: Supabase geeft bij aanmelden zonder
    // die klik in de mail een gebruiker zónder tokens terug, dus geen sessie.
    //
    // Let op wat er níet staat: een bestaande sessie slaat deze poort niet
    // over. Die sessie blijft maandenlang in `localStorage` staan, en dit is
    // een gedeeld apparaat — dat is de hele reden dat er een pincode is.
    // `Accountcheck` vraagt dan om het wachtwoord, en dat is het verschil
    // tussen "er is hier ooit een ouder ingelogd" en "er staat er nu een".
    if (ingesteld) return <Accountcheck onGoed={() => setStand('zetten')} />;
    return <Volwassenencheck onGoed={() => setStand('zetten')} />;
  }

  // De poort is gepasseerd. Geen aparte stand ervoor — wie erdoor is, hoort
  // niet nog een knop te krijgen.
  return <Veld zetten={stand !== 'openen'} onOpen={onOpen} onVergeten={() => setStand('check')} />;
}

function Veld({
  zetten,
  onOpen,
  onVergeten,
}: {
  /** Een nieuwe pincode kiezen (de check is net gedaan) of de bestaande geven. */
  readonly zetten: boolean;
  readonly onOpen: () => void;
  readonly onVergeten: () => void;
}) {
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

    const uitkomst = zetten ? await zetPin(pin, herhaling) : await probeer(pin);
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
    if (zetten) await probeer(pin);
    setPin('');
    setHerhaling('');
    onOpen();
  }

  const klaar = isGeldigePin(pin) && (!zetten || isGeldigePin(herhaling));

  return (
    <form className="flex flex-col gap-3" onSubmit={(event) => void verstuur(event)}>
      <p className="tk-kaartteken">
        <SlotIcon size={24} />
      </p>
      <h2 className="tk-titel">{zetten ? t('ouder.maakTitel') : t('ouder.slotTitel')}</h2>
      <p className="text-lopend">{zetten ? t('ouder.maakUitleg') : t('ouder.slotUitleg')}</p>

      <label htmlFor={pinVeld} className="tk-label">
        {zetten ? t('ouder.pinNieuw') : t('ouder.pin')}
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

      {zetten ? (
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
      ) : null}

      <button type="submit" className="tk-button self-start" disabled={bezig || !klaar}>
        {zetten ? t('ouder.bewaarPin') : t('ouder.open')}
      </button>

      {fout ? (
        <p id={melding} role="alert" className="text-lopend">
          {fout === 'te-vaak' ? t('ouder.fout.teVaak', { seconden: wacht }) : t(FOUT[fout])}
        </p>
      ) : null}

      {zetten ? (
        <p className="tk-hulp">{t('ouder.maakHulp')}</p>
      ) : (
        /* De uitweg is een knop en geen zin meer (ADR-176): wie zijn code kwijt
           is, moest het apparaat wissen om erbij te komen, en dat was geen slot
           maar een val. De check ervóór is wat hem beschermt. */
        <button type="button" className="tk-doel-ander self-start" onClick={onVergeten}>
          {t('ouder.vergetenKnop')}
        </button>
      )}
    </form>
  );
}
