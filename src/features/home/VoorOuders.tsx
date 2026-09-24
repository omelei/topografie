import { NextIcon } from '@/components/Icon';
import { t, type TranslationKey } from '@/i18n';
import type { Module } from '@/features/shell/modules';
import { VakkenRaster } from './Kennismaken';

/**
 * Voor ouders (ADR-214): wat leer.nu is, hoe het werkt, wat het kost en wat er
 * met de gegevens van je kind gebeurt. Voor wie via Google komt en eerst wil
 * weten waarom, voordat een kind een naam intikt.
 *
 * In de woorden van de schrijfwijzer voor ouders: "je" tegen de ouder, rustig,
 * zeggen wat het doet en wat het kost, geen verkoopzinnen.
 */
const BLOKKEN: readonly { readonly kop: TranslationKey; readonly tekst: TranslationKey }[] = [
  { kop: 'ouders.oefenen.kop', tekst: 'ouders.oefenen.tekst' },
  { kop: 'ouders.herhalen.kop', tekst: 'ouders.herhalen.tekst' },
  { kop: 'ouders.papier.kop', tekst: 'ouders.papier.tekst' },
  { kop: 'ouders.privacy.kop', tekst: 'ouders.privacy.tekst' },
];

export function VoorOuders({
  onProberen,
  onPremium,
  onScholen,
  onVak,
}: {
  readonly onProberen: () => void;
  readonly onPremium: () => void;
  /** Voor de leerkracht die hier binnenkomt (ADR-216). */
  readonly onScholen: () => void;
  readonly onVak: (id: Module['id']) => void;
}) {
  return (
    <div className="tk-home">
      <header className="flex flex-col gap-3">
        <h1 className="tk-titel">{t('ouders.titel')}</h1>
        <p className="text-lopend">{t('ouders.intro')}</p>
        <div className="flex flex-wrap gap-3">
          <button type="button" className="tk-button" onClick={onProberen}>
            {t('ouders.proberen')}
          </button>
          <button type="button" className="tk-button tk-button-secondary" onClick={onPremium}>
            {t('ouders.premium')}
            <NextIcon size={18} />
          </button>
        </div>
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

      <section className="flex flex-col gap-2" aria-labelledby="ouders-kosten">
        <h2 id="ouders-kosten" className="tk-sectie">
          {t('ouders.kosten.kop')}
        </h2>
        <p className="text-lopend">{t('ouders.kosten.gratis')}</p>
        <p className="text-lopend">{t('ouders.kosten.premium', { prijs: t('premium.prijs') })}</p>
      </section>

      <VakkenRaster onVak={onVak} />

      <button type="button" className="tk-button tk-button-tertiary self-start" onClick={onScholen}>
        {t('ouders.scholen')}
        <NextIcon size={18} />
      </button>
    </div>
  );
}
