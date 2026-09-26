import { useId, type ComponentType } from 'react';
import { GridIcon, type IconProps, PaperIcon, PupilIcon, ShieldIcon } from '@/components/Icon';
import { brand } from '@/config/brand';
import { t, type TranslationKey } from '@/i18n';

type Pictogram = ComponentType<Omit<IconProps, 'children'>>;

/**
 * Wat een klassencode is, in vier kaarten met een teken, zoals de premiumpagina
 * zegt wat premium doet (ADR-145).
 */
const KAARTEN: readonly (readonly [Pictogram, TranslationKey, TranslationKey])[] = [
  [PupilIcon, 'scholen.werkt.kop', 'scholen.werkt.tekst'],
  [ShieldIcon, 'scholen.privacy.kop', 'scholen.privacy.tekst'],
  [PaperIcon, 'scholen.papier.kop', 'scholen.papier.tekst'],
  [GridIcon, 'scholen.plekken.kop', 'scholen.plekken.tekst'],
];

/**
 * Voor de klas (ADR-216): wat een klassencode is en hoe een leerkracht hem
 * aanvraagt. Stap A van ADR-200: een gezinscode met 40 plekken, die de
 * leerkracht met de ouders deelt. leer.nu ziet geen leerlingen, en de
 * leerkracht ook niet.
 *
 * In de vorm van de premiumpagina, op verzoek van de eigenaar: een etalage met
 * de prijs en de knop, kaarten met een teken, en wat het kost. Het is dezelfde
 * beslissing als bij een ouder, en de pagina leest daarom in dezelfde volgorde.
 *
 * Aanvragen gaat per mail, met de vragen al in het bericht. Een formulier zou
 * een server vragen voor iets wat een paar keer per jaar gebeurt.
 */
export function Scholen() {
  const kop = useId();
  const mail = `mailto:${brand.scholen}?subject=${encodeURIComponent(
    t('scholen.mail.onderwerp'),
  )}&body=${encodeURIComponent(t('scholen.mail.bericht'))}`;

  return (
    <div className="tk-page">
      <div className="tk-page-main">
        <h1 className="tk-titel">{t('scholen.titel')}</h1>

        <section className="tk-etalage" aria-labelledby={kop}>
          <span className="tk-pil">{t('scholen.etalageLabel')}</span>
          <h2 id={kop} className="tk-etalage-kop">
            {t('scholen.etalageKop')}
          </h2>
          <p className="tk-etalage-tekst">{t('scholen.intro')}</p>
          <div className="tk-etalage-knoppen">
            <a className="tk-button tk-knop-licht" href={mail}>
              {t('scholen.aanvragen')}
            </a>
            <p className="tk-premium-etalage-prijs">
              <span className="tk-display">{t('scholen.prijs')}</span> {t('premium.perSchooljaar')}
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-4" aria-label={t('scholen.watTitel')}>
          <h2 className="tk-sectie">{t('scholen.watTitel')}</h2>
          <ul className="tk-kaarten">
            {KAARTEN.map(([Teken, kaartKop, uitleg]) => (
              <li key={kaartKop} className="tk-kaartje">
                <span className="tk-kaartteken">
                  <Teken size={24} />
                </span>
                <span className="tk-kaartje-kop">{t(kaartKop)}</span>
                <span className="text-lopend text-tekst-secundair">{t(uitleg)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col gap-3" aria-labelledby="scholen-kosten">
          <h2 id="scholen-kosten" className="tk-sectie">
            {t('scholen.kosten.kop')}
          </h2>
          <div className="tk-card flex flex-col gap-2">
            <p className="text-lopend">
              {t('scholen.kosten.tekst', { prijs: t('scholen.prijs') })}
            </p>
            <p className="text-lopend">{t('scholen.kosten.gratis')}</p>
            <p className="text-lopend">{t('scholen.mail', { adres: brand.scholen })}</p>
          </div>
        </section>
      </div>
    </div>
  );
}
