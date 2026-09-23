import { useEffect, useId, useState, type FormEvent } from 'react';
import { SlotIcon } from '@/components/Icon';
import { t } from '@/i18n';
import { AccountBlok } from '@/features/account/AccountBlok';
import { ACCOUNT_FOUT } from '@/features/account/fouten';
import { useAccount, type Aanmeldpoging, type Herstelpoging } from '@/features/account/useAccount';
import type { AccountFout } from '@/store/account';

/**
 * De poort vóór de pincode, op een bouw die een gezinsproject heeft (ADR-178).
 *
 * **Wat dit vervangt.** ADR-176 zette er een geboortejaar voor, en noemde dat
 * zelf een hek en geen kluis: een twaalfjarige die het doorheeft, tikt 1985. Dat
 * was de beste poort die er was zolang er geen server was om iets aan te vragen.
 * Die is er nu, en dan is het antwoord beter.
 *
 * **Wat het wel en niet doet.** Het stelt geen leeftijd vast — dat kan een
 * mailadres niet. Het stelt vast dat iemand een postbus kan openen, en dat is
 * iets heel anders dan een jaartal typen: er zit een ronde buiten dit apparaat
 * tussen. Supabase geeft bij aanmelden met bevestiging een gebruiker terug
 * **zonder tokens**, dus zonder die klik in de mail is er geen sessie, en zonder
 * sessie komt hier niemand langs.
 *
 * Wat het daarnaast koopt, en wat voor een gezin waarschijnlijk meer waard is
 * dan de poort zelf: een vergeten pincode is voortaan van overal te herstellen
 * in plaats van alleen op dit apparaat, de bon van premium heeft een adres, en
 * de toestemming van artikel 8 AVG heeft een aanwijsbare volwassene.
 *
 * **Een sessie is geen bewijs — het wachtwoord wel.** Dit is de les die de
 * e2e-suite kwam halen, en het is precies het gat dat ADR-176 moest dichten,
 * één laag hoger terug. De sessie van de ouder staat in `localStorage` en blijft
 * daar staan: dat hoort ook, want anders zou een ouder elke week opnieuw moeten
 * inloggen. Maar dit is een gedéeld apparaat — dat is de hele reden dat er een
 * pincode is. Zou "ben je ingelogd?" de poort zijn, dan tikt het kind op
 * *Pincode vergeten?*, loopt naar binnen op de sessie van zijn vader, kiest een
 * nieuwe code en sluit hem buiten. De poort vraagt daarom altijd om het
 * wachtwoord, ook — juist — als er al iemand ingelogd is. Zelfde patroon als een
 * besturingssysteem dat opnieuw om je wachtwoord vraagt vóór de instellingen.
 *
 * Dat kost een ouder een wachtwoord op de twee momenten dat hij een pincode
 * zet: de eerste keer, en de keer dat hij hem kwijt is. Dat is de prijs, en die
 * is laag naast een pincode die niets tegenhoudt.
 *
 * **Zonder gezinsproject blijft het geboortejaar staan.** Dat is geen restje
 * maar de enige goede terugval: een ouder met een tablet zonder verbinding, of
 * een bouw waarin de variabelen leeg zijn, moet bij de instellingen van zijn
 * eigen kind kunnen. `Pinslot` kiest ertussen; hier staat alleen de ene helft.
 */
export function Accountcheck({ onGoed }: { readonly onGoed: () => void }) {
  const { sessie, inloggen, herstel } = useAccount();

  // Eén keer bij het monteren vastgelegd. Anders wisselt dit scherm van vorm op
  // het moment dat het inloggen lukt, en dat is precies het moment waarop het
  // niet mag wisselen.
  const [bekend] = useState(() => sessie?.email ?? null);

  if (bekend !== null) {
    return <Herbevestigen email={bekend} inloggen={inloggen} herstel={herstel} onGoed={onGoed} />;
  }
  return <Aanmelden binnen={sessie !== null} onGoed={onGoed} />;
}

/**
 * Nog niemand ingelogd: het gewone formulier, met een zin erboven die zegt
 * waaróm er een adres gevraagd wordt.
 *
 * Het formulier zelf is `AccountBlok`, ongewijzigd. Twee schermen die allebei
 * een adres en een wachtwoord vragen, lopen op de dag van de eerste foutmelding
 * uit elkaar.
 */
function Aanmelden({ binnen, onGoed }: { readonly binnen: boolean; readonly onGoed: () => void }) {
  useEffect(() => {
    if (binnen) onGoed();
  }, [binnen, onGoed]);

  return (
    <div className="flex flex-col gap-3">
      <p className="tk-kaartteken">
        <SlotIcon size={24} />
      </p>
      <h2 className="tk-titel">{t('ouder.accountTitel')}</h2>
      <p className="text-lopend">{t('ouder.accountUitleg')}</p>
      <p className="tk-hulp">{t('ouder.accountHulp')}</p>

      <AccountBlok />
    </div>
  );
}

/**
 * Er is al iemand ingelogd: dan alleen het wachtwoord, bij het adres dat er al
 * staat.
 *
 * Het adres staat er als tekst en niet als veld. Er valt hier niets te kiezen:
 * de vraag is niet wie je bent maar of jij het bent, en een tweede adres zou
 * van deze poort een tweede inlogscherm maken.
 *
 * Een mislukte poging laat de bewaarde sessie met rust (`supabaseAccount.ts`
 * schrijft alleen bij een geslaagd antwoord), dus een typefout logt de ouder
 * niet uit.
 *
 * **Wachtwoord vergeten gaat naar het adres dat er al staat** (ADR-186). Dit is
 * het scherm waar een ouder die zijn pincode kwijt is uitkomt, en hier hield
 * de keten op: zonder wachtwoord geen nieuwe pincode, en zonder pincode alleen
 * nog het apparaat wissen. De mail gaat naar het adres van deze sessie en niet
 * naar een adres dat iemand intikt, dus een kind dat hier op drukt, stuurt zijn
 * vader een mail en komt zelf nergens.
 */
function Herbevestigen({
  email,
  inloggen,
  herstel,
  onGoed,
}: {
  readonly email: string;
  readonly inloggen: Aanmeldpoging;
  readonly herstel: Herstelpoging;
  readonly onGoed: () => void;
}) {
  const [wachtwoord, setWachtwoord] = useState('');
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<AccountFout | null>(null);
  const [gemaild, setGemaild] = useState(false);

  async function vergeten() {
    setBezig(true);
    setFout(null);
    setGemaild(false);
    const uitkomst = await herstel(email);
    setBezig(false);
    if (uitkomst.ok) setGemaild(true);
    else setFout(uitkomst.reden);
  }

  const veld = useId();
  const melding = useId();

  async function verstuur(event: FormEvent) {
    event.preventDefault();
    setBezig(true);
    setFout(null);
    setGemaild(false);

    const uitkomst = await inloggen(email, wachtwoord);
    setBezig(false);
    setWachtwoord('');

    if (!uitkomst.ok) {
      setFout(uitkomst.reden);
      return;
    }
    onGoed();
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={(event) => void verstuur(event)}>
      <p className="tk-kaartteken">
        <SlotIcon size={24} />
      </p>
      <h2 className="tk-titel">{t('ouder.bevestigTitel')}</h2>
      <p className="text-lopend">{t('ouder.bevestigUitleg', { email })}</p>

      <label htmlFor={veld} className="tk-label">
        {t('ouder.bevestigVeld')}
      </label>
      <input
        id={veld}
        className="tk-input"
        type="password"
        autoComplete="current-password"
        value={wachtwoord}
        onChange={(event) => setWachtwoord(event.target.value)}
        aria-describedby={fout ? melding : undefined}
        aria-invalid={fout ? true : undefined}
        autoFocus
      />

      <button
        type="submit"
        className="tk-button self-start"
        disabled={bezig || wachtwoord.length === 0}
      >
        {bezig ? t('account.bezig') : t('ouder.bevestigKnop')}
      </button>

      {fout ? (
        <p id={melding} role="alert" className="text-lopend">
          {t(ACCOUNT_FOUT[fout])}
        </p>
      ) : null}
      {gemaild ? (
        <p role="status" className="text-lopend">
          {t('ouder.herstelGemaild', { email })}
        </p>
      ) : null}

      <button
        type="button"
        className="tk-button tk-button-tertiary self-start"
        disabled={bezig}
        onClick={() => void vergeten()}
      >
        {t('account.wachtwoordVergeten')}
      </button>

      <p className="tk-hulp">{t('ouder.bevestigHulp')}</p>
    </form>
  );
}
