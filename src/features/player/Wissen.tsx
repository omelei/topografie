import { useId, useState } from 'react';
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
 * **Wat weggaat staat er meteen, en de knop werkt pas na een woord**
 * (ADR-262). Het waren twee stappen met "Laat maar staan" als uitweg. Nu staat
 * in een blok met een rode rand wat er weggaat — de voortgang van elk kind, en
 * de code moet opnieuw ingevuld — en doet de knop niets tot de ouder WISSEN
 * typt. Een vraag die je wegklikt, leert je klikken; een woord typ je niet per
 * ongeluk. Er hoeft dus ook geen uitweg te zijn: niets doen is de uitweg.
 */
export function Wissen() {
  const [getypt, setGetypt] = useState('');
  const [bezig, setBezig] = useState(false);
  const veld = useId();
  const klopt = getypt.trim().toUpperCase() === t('wissen.typWoord');

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
    <section className="tk-wissen" aria-labelledby="wissen-kop">
      <h2 id="wissen-kop" className="tk-sectie">
        {t('wissen.titel')}
      </h2>
      {/* Eerst wat er weggaat, dan het woord, dan de knop (ADR-262). De knop
          doet niets tot het woord er staat: wie hier per ongeluk drukt, typt
          niet per ongeluk WISSEN. */}
      <div className="tk-wissen-kaart">
        <p className="flex items-start gap-3 text-lopend">
          <span className="tk-kaartteken">
            <ShieldIcon size={24} />
          </span>
          <span>{t('wissen.uitleg')}</span>
        </p>
        <p className="text-lopend">{t('wissen.zeker')}</p>
        <ul className="tk-regelkaart-lijst">
          <li className="text-lopend">{t('wissen.watVoortgang')}</li>
          <li className="text-lopend">{t('wissen.watCode')}</li>
        </ul>
        <p className="text-lopend font-bold">{t('wissen.onomkeerbaar')}</p>
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (klopt && !bezig) void wis();
          }}
        >
          <div className="flex flex-col gap-2">
            <label htmlFor={veld} className="tk-label">
              {t('wissen.typLabel', { woord: t('wissen.typWoord') })}
            </label>
            <input
              id={veld}
              className="tk-input max-w-[14rem]"
              value={getypt}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              onChange={(event) => setGetypt(event.target.value)}
            />
          </div>
          <button
            type="submit"
            className="tk-button tk-button-secondary tk-wissen-knop"
            disabled={!klopt || bezig}
          >
            {bezig ? t('wissen.bezig') : t('wissen.knop')}
          </button>
        </form>
      </div>
    </section>
  );
}
