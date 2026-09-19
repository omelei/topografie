import { useState } from 'react';
import { ShieldIcon } from '@/components/Icon';
import { t } from '@/i18n';
import { wisAlles } from '@/store/wissen';

/**
 * "Alles van dit apparaat halen" (ADR-166).
 *
 * De belofte van dit product is dat de voortgang op het apparaat blijft. Tot nu
 * toe was dat een belofte zonder knop: er was geen enkele weg om het er weer af
 * te krijgen, behalve de site-data van de browser wissen — een menu dat de
 * meeste ouders niet vinden, dat de premiumcode meeneemt en dat op een gedeelde
 * iPad veel meer wist dan leer.nu.
 *
 * **Onderaan de pagina.** Dit is het laatste wat iemand hier komt doen, en het
 * is het enige op deze pagina dat niet terug te draaien is.
 *
 * **In twee stappen, en de tweede is geen "weet je het zeker?".** Die vraag
 * leert iemand alleen om twee keer te drukken. De tweede stap vertelt wat er
 * weggaat en wat dat betekent — de voortgang van elk kind, en de code moet
 * opnieuw ingevuld — en de knop erop zegt wat hij doet in plaats van "ja".
 *
 * **En de uitweg is de zwaarste knop.** Wie hier per ongeluk belandt, hoort met
 * één druk terug te kunnen, en de knop die je zoekt hoort de opvallendste te
 * zijn.
 */
export function Wissen() {
  const [vraagt, setVraagt] = useState(false);
  const [bezig, setBezig] = useState(false);

  async function wis() {
    setBezig(true);
    await wisAlles();
    // Terug naar het begin, en met een echte herlaadbeurt: elk scherm houdt een
    // stukje van dit kind in React-state, en na dit moment bestaat dat kind niet
    // meer. Hetzelfde botte middel dat `switchChild` gebruikt, en om dezelfde
    // reden.
    window.location.href = '/';
  }

  return (
    <section className="flex flex-col gap-3" aria-labelledby="wissen-kop">
      <h2 id="wissen-kop" className="tk-sectie">
        {t('wissen.titel')}
      </h2>

      {vraagt ? (
        <div className="tk-card flex flex-col gap-3">
          <p className="text-lopend">{t('wissen.zeker')}</p>
          <ul className="tk-regelkaart-lijst">
            <li className="text-lopend">{t('wissen.watVoortgang')}</li>
            <li className="text-lopend">{t('wissen.watCode')}</li>
          </ul>
          <p className="text-lopend text-tekst-secundair">{t('wissen.onomkeerbaar')}</p>
          {/* Het zwaarst is de knop die níéts doet (Button.tsx: drie gewichten
              en geen vierde). De primaire knop is de weg vooruit, en vooruit is
              hier "laat staan" — de andere is een echt alternatief dat je
              bewust kiest, en dat is precies wat secundair betekent. Een
              vierde, rode knopsoort zou een kleur aan de huisstijl toevoegen
              voor één scherm. */}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="tk-button"
              disabled={bezig}
              onClick={() => setVraagt(false)}
            >
              {t('wissen.laatMaar')}
            </button>
            <button
              type="button"
              className="tk-button tk-button-secondary"
              disabled={bezig}
              onClick={() => void wis()}
            >
              {bezig ? t('wissen.bezig') : t('wissen.doe')}
            </button>
          </div>
        </div>
      ) : (
        <div className="tk-card tk-kaartrij">
          <span className="tk-kaartteken">
            <ShieldIcon size={24} />
          </span>
          <p className="tk-kaartrij-tekst text-lopend">{t('wissen.uitleg')}</p>
          <button
            type="button"
            className="tk-button tk-button-secondary"
            onClick={() => setVraagt(true)}
          >
            {t('wissen.knop')}
          </button>
        </div>
      )}
    </section>
  );
}
