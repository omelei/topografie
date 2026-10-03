import { brand } from '@/config/brand';
import { t, type TranslationKey } from '@/i18n';
import { isIngesteld } from '@/store/account/omgeving';
import { Paginakop } from '@/features/shell/Paginakop';

/** Een blok met een kop en alinea's, of een lijst als er een `lijst` is. */
function Blok({
  kop,
  alineas = [],
  lijst,
}: {
  readonly kop: TranslationKey;
  readonly alineas?: readonly string[];
  readonly lijst?: readonly string[];
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="tk-sectie">{t(kop)}</h2>
      <div className="tk-card flex flex-col gap-2">
        {alineas.map((alinea) => (
          <p key={alinea} className="text-lopend">
            {alinea}
          </p>
        ))}
        {lijst ? (
          <ul className="tk-privacy-lijst text-lopend">
            {lijst.map((regel) => (
              <li key={regel}>{regel}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

/**
 * De privacyverklaring (ADR-249): wat er waar staat, waarom, hoe lang, en wat
 * een ouder ermee kan. In de volgorde waarin een ouder het tegenkomt: eerst dit
 * apparaat, dan wat er naar de server gaat, dan wie ons helpt.
 *
 * Het deel over het gezinsaccount staat er alleen als deze bouw accounts heeft
 * (`isIngesteld`). Zo zegt de pagina op elk moment wat er echt gebeurt, en niet
 * wat er straks kan.
 */
export function Privacy() {
  const metAccount = isIngesteld();
  const naam = brand.verantwoordelijke;
  // Uit de bouw (ADR-249): leeg tot de inschrijving bij de KvK er is.
  const kvk = String(import.meta.env.VITE_KVK_NUMMER ?? '').trim();
  const plaats = String(import.meta.env.VITE_VESTIGINGSPLAATS ?? '').trim();
  const adres = brand.contact;

  return (
    <div className="tk-page">
      <div className="tk-page-main">
        <header className="flex flex-col gap-2">
          <Paginakop kop={t('privacy.titel')} regel={t('privacy.intro')} />
          <p className="tk-hulp">{t('privacy.bijgewerkt')}</p>
        </header>

        <Blok
          kop="privacy.kort.kop"
          lijst={[
            t('privacy.kort.apparaat'),
            t('privacy.kort.geen'),
            ...(metAccount ? [t('privacy.kort.account')] : []),
          ]}
        />
        <Blok
          kop="privacy.wie.kop"
          alineas={[
            [
              plaats === ''
                ? t('privacy.wie.naam', { naam })
                : t('privacy.wie.naamPlaats', { naam, plaats }),
              ...(kvk === '' ? [] : [t('privacy.wie.kvk', { kvk })]),
            ].join(' '),
            t('privacy.wie.contact', { adres }),
          ]}
        />
        <Blok
          kop="privacy.apparaat.kop"
          alineas={[t('privacy.apparaat.tekst'), t('privacy.apparaat.wissen')]}
        />
        <Blok
          kop="privacy.teller.kop"
          alineas={[t('privacy.teller.tekst'), t('privacy.teller.nietVolgen')]}
        />
        <Blok
          kop="privacy.premium.kop"
          alineas={[t('privacy.premium.tekst'), t('privacy.premium.pogingen')]}
        />
        <Blok
          kop="privacy.betalen.kop"
          alineas={[t('privacy.betalen.tekst'), t('privacy.betalen.bestelling')]}
        />
        {metAccount ? (
          <section className="flex flex-col gap-2">
            <h2 className="tk-sectie">{t('privacy.account.kop')}</h2>
            <div className="tk-card flex flex-col gap-2">
              <p className="text-lopend">{t('privacy.account.intro')}</p>
              <ul className="tk-privacy-lijst text-lopend">
                <li>{t('privacy.account.ouder')}</li>
                <li>{t('privacy.account.kind')}</li>
                <li>{t('privacy.account.voortgang')}</li>
                <li>{t('privacy.account.rest')}</li>
                <li>{t('privacy.account.inlog')}</li>
              </ul>
              <p className="text-lopend">{t('privacy.account.bewaren')}</p>
            </div>
          </section>
        ) : null}
        <Blok
          kop="privacy.wie2.kop"
          alineas={[t('privacy.wie2.intro')]}
          lijst={[
            t('privacy.wie2.github'),
            t('privacy.wie2.supabase'),
            t('privacy.wie2.mollie'),
            t('privacy.wie2.resend'),
            t('privacy.wie2.google'),
          ]}
        />
        <Blok
          kop="privacy.waarom.kop"
          lijst={[
            t('privacy.waarom.overeenkomst'),
            t('privacy.waarom.belang'),
            ...(metAccount ? [t('privacy.waarom.toestemming')] : []),
          ]}
        />
        <Blok kop="privacy.rechten.kop" alineas={[t('privacy.rechten.tekst', { adres })]} />
        <Blok kop="privacy.wijzigen.kop" alineas={[t('privacy.wijzigen.tekst')]} />
      </div>
    </div>
  );
}
