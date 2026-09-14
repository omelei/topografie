import { t } from '@/i18n';
import type { Klim as KlimStap } from './klim';

/**
 * De trap die een goed antwoord oplevert (ADR-137).
 *
 * Vijf treden, gevuld tot waar dit onderdeel nu staat, en de nieuwe trede komt
 * aan in plaats van er te staan. Het is het enige plekje in het product waar een
 * kind de motor ziet draaien: elk goed antwoord schuift dit woord een trede op
 * en daarmee verder de toekomst in.
 *
 * De treden hebben geen nummers en geen naam. "Doos drie" is het woord van het
 * algoritme en niet van een kind; wat een kind ziet is dat er iets vol loopt, en
 * wat het leest is dat het dit steeds beter kent.
 *
 * Eén zin eronder, en bij de vierde trede een andere: daar zegt dit product al
 * "dit onthoud je" (`ONTHOUDEN_BOX`), dus is dat geen nieuw beloninkje maar het
 * moment waarop een woord dat al gold, waar wordt.
 */
export function Klim({ klim }: { readonly klim: KlimStap }) {
  const treden = Array.from({ length: klim.treden }, (_, i) => i + 1);

  return (
    <p className="tk-klim" data-onthouden={klim.onthouden ? 'ja' : undefined}>
      <span className="tk-klim-trap" aria-hidden="true">
        {treden.map((trede) => (
          <span
            key={trede}
            className="tk-klim-trede"
            data-vol={trede <= klim.naar ? 'ja' : undefined}
            data-nieuw={trede === klim.naar ? 'ja' : undefined}
          />
        ))}
      </span>
      <span className="tk-klim-woord">
        {klim.onthouden ? t('klim.onthouden') : t('klim.beter')}
      </span>
    </p>
  );
}
