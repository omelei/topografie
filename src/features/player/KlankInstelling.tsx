import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon, SpeakIcon } from '@/components/Icon';
import { t, type TranslationKey } from '@/i18n';
import { KLANKEN, speelProef, zetKlank, type Klank } from '@/features/round/geluid';
import { saveKlank } from './settings';

/**
 * Welk geluid er klinkt bij een antwoord en een diploma, als rij bij de
 * instellingen op Jij (ADR-247).
 *
 * Vijf, en niet meer: genoeg om er een te vinden die bij je past, en weinig
 * genoeg om ze allemaal even te proberen. Zoals de groep een rij die zegt wat
 * het nu is, en die openklapt als je erop drukt. Een druk op een geluid laat
 * het horen en bewaart het meteen.
 */
export function KlankInstelling({
  klank,
  onKlank,
}: {
  readonly klank: Klank;
  readonly onKlank: (klank: Klank) => void;
}) {
  const [open, setOpen] = useState(false);
  const naam = (welk: Klank) => t(`klank.${welk}` as TranslationKey);

  function kies(welk: Klank) {
    speelProef(welk);
    zetKlank(welk);
    void saveKlank(welk).then(() => onKlank(welk));
  }

  return (
    <li>
      <button
        type="button"
        className="tk-lijstrij"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span className="tk-plaat tk-plaat-neutraal" data-tint="koraal">
          <SpeakIcon size={24} />
        </span>
        <span className="tk-lijstrij-tekst">
          <span className="tk-lijstrij-titel">{t('you.klank')}</span>
          <span className="tk-lijstrij-regel">{naam(klank)}</span>
        </span>
        <span className="tk-lijstrij-pijl">
          {open ? <ChevronUpIcon size={20} /> : <ChevronDownIcon size={20} />}
        </span>
      </button>

      {open ? (
        <div className="flex flex-col gap-3 px-4 pb-4">
          <p className="text-lopend text-tekst-secundair">{t('you.klankUitleg')}</p>
          <div className="tk-keuzes" role="group" aria-label={t('you.klank')}>
            {KLANKEN.map((welk) => (
              <button
                key={welk}
                type="button"
                className="tk-keuze"
                aria-pressed={welk === klank}
                onClick={() => kies(welk)}
              >
                {naam(welk)}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </li>
  );
}
