import { useId, useState, type FormEvent } from 'react';
import { t, type TranslationKey } from '@/i18n';
import { geefNaam } from '@/store/profile';
import { tel } from '@/store/teller';
import type { ProfileRecord } from '@/store/db';

/** Zo lang als een naam mag zijn: één limiet, voor elk veld waar hij getypt wordt. */
export const NAAM_MAX = 24;

/**
 * Waar de naam gevraagd wordt (ADR-229), en dus in wiens woorden.
 *
 * - `vandaag`: de uitnodiging na de eerste ronde, weg te klikken.
 * - `jij`: bovenaan Jij, zolang er geen naam is.
 * - `toets`: vóór de toets, want de naam komt op het diploma.
 * - `ouder`: op de ouderpagina, over het kind.
 */
export type NaamMoment = 'vandaag' | 'jij' | 'toets' | 'ouder';

const TEKST: Record<
  NaamMoment,
  {
    readonly titel: TranslationKey;
    readonly uitleg: TranslationKey;
    readonly veld: TranslationKey;
    readonly knop: TranslationKey;
    readonly teKort: TranslationKey;
  }
> = {
  vandaag: {
    titel: 'naam.titel',
    uitleg: 'naam.vandaag.uitleg',
    veld: 'naam.veld',
    knop: 'naam.bewaar',
    teKort: 'naam.teKort',
  },
  jij: {
    titel: 'naam.titel',
    uitleg: 'naam.uitleg',
    veld: 'naam.veld',
    knop: 'naam.bewaar',
    teKort: 'naam.teKort',
  },
  toets: {
    titel: 'naam.toets.titel',
    uitleg: 'naam.uitleg',
    veld: 'naam.veld',
    knop: 'naam.bewaar',
    teKort: 'naam.teKort',
  },
  ouder: {
    titel: 'naam.ouder.titel',
    uitleg: 'naam.ouder.uitleg',
    veld: 'naam.ouder.veld',
    knop: 'naam.ouder.bewaar',
    teKort: 'naam.ouder.teKort',
  },
};

/**
 * De vraag naar de naam, op de plek waar hij iets doet (ADR-229).
 *
 * Dit was het eerste scherm van de app: "Wie ben jij?", vóór er iets te zien
 * was. Een naam doet niets voor het oefenen zelf — wat een kind oefent, blijft
 * ook zonder naam op dit apparaat — dus hij wordt gevraagd waar hij wél iets
 * doet, en de vraag zegt dan ook waarvoor.
 *
 * Het kind dat hier een naam krijgt, is het kind dat al oefent: alleen de naam
 * verandert, en alles wat het zonder naam deed, hoort er al bij.
 */
export function NaamVraag({
  moment,
  kop = 'h2',
  onKlaar,
  onNietNu,
}: {
  readonly moment: NaamMoment;
  /** Een `h1` als dit het enige op de pagina is, zoals op de ouderpagina. */
  readonly kop?: 'h1' | 'h2';
  readonly onKlaar: (kind: ProfileRecord) => void;
  /** Alleen waar de vraag weg mag: dan staat er "Niet nu". */
  readonly onNietNu?: (() => void) | undefined;
}) {
  const [naam, setNaam] = useState('');
  const [fout, setFout] = useState(false);
  const [bezig, setBezig] = useState(false);
  const tekst = TEKST[moment];
  const veld = useId();
  const titel = useId();
  const melding = useId();
  const Kop = kop;

  async function bewaar(event: FormEvent) {
    event.preventDefault();
    if (naam.trim().length < 2) {
      setFout(true);
      return;
    }
    setBezig(true);
    const kind = await geefNaam(naam);
    setBezig(false);
    if (!kind) return;
    // Waar de naam getypt werd, als adres zonder iets van het kind (ADR-210).
    tel('naam', `/${moment}`);
    onKlaar(kind);
  }

  return (
    <form
      className="tk-card flex flex-col gap-4"
      aria-labelledby={titel}
      noValidate
      onSubmit={(event) => void bewaar(event)}
    >
      <Kop id={titel} className={kop === 'h1' ? 'tk-titel' : 'tk-sectie'}>
        {t(tekst.titel)}
      </Kop>
      <p className="text-lopend text-tekst-secundair">{t(tekst.uitleg)}</p>
      <label htmlFor={veld} className="tk-label">
        {t(tekst.veld)}
      </label>
      <input
        id={veld}
        className="tk-input max-w-xs"
        value={naam}
        onChange={(event) => {
          setNaam(event.target.value);
          setFout(false);
        }}
        placeholder={t(tekst.veld)}
        autoComplete="off"
        maxLength={NAAM_MAX}
        aria-describedby={fout ? melding : undefined}
        aria-invalid={fout}
      />
      {fout ? (
        <p id={melding} role="alert" className="font-semibold text-fout">
          {t(tekst.teKort)}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <button type="submit" className="tk-button" disabled={bezig}>
          {t(tekst.knop)}
        </button>
        {onNietNu ? (
          <button
            type="button"
            className="tk-button tk-button-tertiary"
            disabled={bezig}
            onClick={onNietNu}
          >
            {t('naam.nietNu')}
          </button>
        ) : null}
      </div>
    </form>
  );
}
