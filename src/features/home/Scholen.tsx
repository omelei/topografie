import { brand } from '@/config/brand';
import { t, type TranslationKey } from '@/i18n';

/**
 * Voor de klas (ADR-216): wat een klassencode is en hoe een leerkracht hem
 * aanvraagt. Stap A van ADR-200: een gezinscode met 40 plekken, die de
 * leerkracht met de ouders deelt. leer.nu ziet geen leerlingen, en de
 * leerkracht ook niet.
 *
 * Aanvragen gaat per mail, met de vragen al in het bericht. Een formulier zou
 * een server vragen voor iets wat een paar keer per jaar gebeurt.
 */
const BLOKKEN: readonly { readonly kop: TranslationKey; readonly tekst: TranslationKey }[] = [
  { kop: 'scholen.werkt.kop', tekst: 'scholen.werkt.tekst' },
  { kop: 'scholen.privacy.kop', tekst: 'scholen.privacy.tekst' },
  { kop: 'scholen.papier.kop', tekst: 'scholen.papier.tekst' },
  { kop: 'scholen.plekken.kop', tekst: 'scholen.plekken.tekst' },
];

export function Scholen() {
  const mail = `mailto:${brand.contact}?subject=${encodeURIComponent(
    t('scholen.mail.onderwerp'),
  )}&body=${encodeURIComponent(t('scholen.mail.bericht'))}`;

  return (
    <div className="tk-home">
      <header className="flex flex-col gap-3">
        <h1 className="tk-titel">{t('scholen.titel')}</h1>
        <p className="text-lopend">{t('scholen.intro')}</p>
        <a className="tk-button self-start" href={mail}>
          {t('scholen.aanvragen')}
        </a>
      </header>

      <ul className="tk-uitlegstappen">
        {BLOKKEN.map(({ kop, tekst }) => (
          <li key={kop} className="tk-uitlegstap">
            <span className="flex flex-col gap-1">
              <span className="tk-kaart-titel">{t(kop)}</span>
              <span className="text-tekst-secundair">{t(tekst)}</span>
            </span>
          </li>
        ))}
      </ul>

      <section className="flex flex-col gap-2" aria-labelledby="scholen-kosten">
        <h2 id="scholen-kosten" className="tk-sectie">
          {t('scholen.kosten.kop')}
        </h2>
        <p className="text-lopend">{t('scholen.kosten.tekst', { prijs: t('scholen.prijs') })}</p>
        <p className="text-lopend">{t('scholen.kosten.gratis')}</p>
        <p className="text-lopend">{t('scholen.mail', { adres: brand.contact })}</p>
      </section>
    </div>
  );
}
