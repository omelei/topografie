import { SlotIcon } from '@/components/Icon';
import { t } from '@/i18n';
import { AccountBlok } from '@/features/account/AccountBlok';

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
 * sessie komt hier niemand langs. Dat is de hele werking.
 *
 * Wat het daarnaast koopt, en wat voor een gezin waarschijnlijk meer waard is
 * dan de poort zelf: een vergeten pincode is voortaan van overal te herstellen
 * in plaats van alleen op dit apparaat, de bon van premium heeft een adres, en
 * de toestemming van artikel 8 AVG heeft een aanwijsbare volwassene.
 *
 * **Zonder gezinsproject blijft het geboortejaar staan.** Dat is geen restje
 * maar de enige goede terugval: een ouder met een tablet zonder verbinding, of
 * een bouw waarin de variabelen leeg zijn, moet bij de instellingen van zijn
 * eigen kind kunnen. `Pinslot` kiest ertussen; hier staat alleen de ene helft.
 *
 * Het formulier zelf is `AccountBlok`, ongewijzigd. Twee schermen die allebei
 * een adres en een wachtwoord vragen, lopen op de dag van de eerste foutmelding
 * uit elkaar.
 */
export function Accountcheck() {
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
