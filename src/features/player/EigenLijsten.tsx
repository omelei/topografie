import {
  useCallback,
  useId,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import { t } from '@/i18n';
import { PremiumSlot } from '@/features/premium/PremiumSlot';
import { usePremium } from '@/features/premium/usePremium';
import {
  abonneerLijsten,
  importeer,
  leesLijsten,
  MAX_LIJSTEN,
  MAX_NAAM,
  MAX_WOORD,
  MAX_WOORDEN,
  schoonWoord,
  schrijfLijsten,
  woordSleutel,
  type Woordlijst,
} from '@/store/woordlijsten';

/**
 * Waar een ouder de oefenstof van school intypt of importeert (ADR-135,
 * ADR-145).
 *
 * Op "Voor ouders" en niet op een pagina van een kind: dit is invoerwerk voor
 * een volwassene, en het staat naast de instellingen omdat het daar thuishoort.
 *
 * **Premium.** Dit is de functie waar het schoolwerk van deze week in gaat, en
 * daarmee de duidelijkste reden om te betalen. De ingebouwde spellingsets
 * blijven gratis, zoals alle inhoud gratis blijft (ADR-124).
 */
export function EigenLijsten() {
  const { actief } = usePremium();
  const lijsten = useSyncExternalStore(abonneerLijsten, leesLijsten);

  const zet = useCallback((volgende: readonly Woordlijst[]) => schrijfLijsten(volgende), []);

  if (!actief) {
    return (
      <section className="flex flex-col gap-3" aria-label={t('you.lijstenTitel')}>
        <h2 className="tk-sectie">{t('you.lijstenTitel')}</h2>
        <PremiumSlot wat="premium.wat.lijsten" />
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3" aria-label={t('you.lijstenTitel')}>
      <h2 className="tk-sectie">{t('you.lijstenTitel')}</h2>
      <p className="text-tekst-secundair">{t('you.lijstenUitleg')}</p>

      {lijsten.length === 0 ? (
        <p className="text-tekst-secundair">{t('you.lijstenGeen')}</p>
      ) : (
        lijsten.map((lijst) => (
          <Lijst
            key={lijst.id}
            lijst={lijst}
            onWijzig={(volgende) =>
              zet(lijsten.map((andere) => (andere.id === lijst.id ? volgende : andere)))
            }
            onWeg={() => zet(lijsten.filter((andere) => andere.id !== lijst.id))}
          />
        ))
      )}

      {lijsten.length >= MAX_LIJSTEN ? (
        <p className="tk-hulp">{t('you.lijstenGenoeg')}</p>
      ) : (
        <NieuweLijst
          onMaak={(naam) => zet([...lijsten, { id: crypto.randomUUID(), naam, woorden: [] }])}
        />
      )}

      {/* Ook als er geen lijst meer bij past: een bestand kan een bestaande
          lijst nog aanvullen. */}
      <Importeer lijsten={lijsten} onKlaar={zet} />
    </section>
  );
}

type Melding =
  | {
      readonly soort: 'klaar';
      readonly woorden: number;
      readonly geraakt: number;
      readonly over: number;
    }
  | { readonly soort: 'leeg' | 'fout' };

/**
 * Een bestand in plaats van intypen (ADR-145).
 *
 * School stuurt de woorden vaak al als lijstje mee, in een mail of een
 * spreadsheet, en veertig woorden één voor één overtypen is precies het werk
 * waarvoor een ouder deze functie níét gebruikt. De uitleg staat erboven en
 * niet achter een knop: wie een bestand kiest zonder te weten hoe het eruit
 * moet zien, krijgt een lijst met "lijst;woord" als eerste woord.
 *
 * Het bestand blijft op het apparaat. Het wordt gelezen, in lijsten gezet
 * (`importeer`) en weggeschreven zoals intypen dat doet.
 */
function Importeer({
  lijsten,
  onKlaar,
}: {
  readonly lijsten: readonly Woordlijst[];
  readonly onKlaar: (volgende: readonly Woordlijst[]) => void;
}) {
  const [melding, setMelding] = useState<Melding | null>(null);
  const veld = useId();

  async function lees(event: ChangeEvent<HTMLInputElement>) {
    const bestand = event.target.files?.[0];
    // Leeg maken, zodat hetzelfde bestand nog een keer gekozen kan worden.
    event.target.value = '';
    if (!bestand) return;

    try {
      const naam = bestand.name.replace(/\.[^.]+$/, '').trim().slice(0, MAX_NAAM);
      const uit = importeer(
        await bestand.text(),
        naam === '' ? t('you.lijstenImport') : naam,
        lijsten,
        () => crypto.randomUUID(),
      );
      if (uit.woorden === 0) {
        setMelding({ soort: 'leeg' });
        return;
      }
      onKlaar(uit.lijsten);
      setMelding({
        soort: 'klaar',
        woorden: uit.woorden,
        geraakt: uit.geraakt,
        over: uit.overgeslagen,
      });
    } catch {
      setMelding({ soort: 'fout' });
    }
  }

  return (
    <div className="tk-card flex flex-col gap-3">
      <h3 className="tk-lijstrij-titel">{t('you.lijstenImportTitel')}</h3>
      <p className="text-tekst-secundair">{t('you.lijstenImportUitleg')}</p>
      <p className="tk-hulp">{t('you.lijstenImportVoorbeeld')}</p>
      <label className="tk-label" htmlFor={veld}>
        {t('you.lijstenImport')}
      </label>
      <input
        id={veld}
        type="file"
        className="tk-bestand"
        accept=".csv,.txt,text/csv,text/plain"
        onChange={(event) => void lees(event)}
      />
      <p role="status" className="text-lopend">
        {melding === null ? null : melding.soort === 'klaar' ? (
          <>
            {melding.geraakt === 1
              ? t('you.lijstenImportKlaarEen', { woorden: melding.woorden })
              : t('you.lijstenImportKlaar', { woorden: melding.woorden, lijsten: melding.geraakt })}
            {melding.over > 0 ? ` ${t('you.lijstenImportOver', { aantal: melding.over })}` : null}
          </>
        ) : melding.soort === 'leeg' ? (
          t('you.lijstenImportLeeg')
        ) : (
          t('you.lijstenImportFout')
        )}
      </p>
    </div>
  );
}

function NieuweLijst({ onMaak }: { readonly onMaak: (naam: string) => void }) {
  const [naam, setNaam] = useState('');
  const veld = useId();

  function maak(event: FormEvent) {
    event.preventDefault();
    const schoon = naam.trim().slice(0, MAX_NAAM);
    if (schoon === '') return;
    onMaak(schoon);
    setNaam('');
  }

  return (
    <form className="tk-card flex flex-col gap-2" onSubmit={maak}>
      <label className="tk-label" htmlFor={veld}>
        {t('you.lijstenNaam')}
      </label>
      <input
        id={veld}
        className="tk-input max-w-xs"
        value={naam}
        maxLength={MAX_NAAM}
        placeholder={t('you.lijstenNaamHint')}
        onChange={(event) => setNaam(event.target.value)}
      />
      <button type="submit" className="tk-button self-start" disabled={naam.trim() === ''}>
        {t('you.lijstenMaak')}
      </button>
    </form>
  );
}

function Lijst({
  lijst,
  onWijzig,
  onWeg,
}: {
  readonly lijst: Woordlijst;
  readonly onWijzig: (volgende: Woordlijst) => void;
  readonly onWeg: () => void;
}) {
  const [woord, setWoord] = useState('');
  const veld = useId();
  const vol = lijst.woorden.length >= MAX_WOORDEN;

  function voegToe(event: FormEvent) {
    event.preventDefault();
    const schoon = schoonWoord(woord);
    const sleutel = woordSleutel(schoon);
    if (schoon === '' || sleutel === '' || vol) return;
    // Hetzelfde woord twee keer zou twee onderdelen met hetzelfde id geven, en
    // dan deelt het ene de Leitner-doos van het andere.
    if (lijst.woorden.some((bestaand) => woordSleutel(bestaand) === sleutel)) {
      setWoord('');
      return;
    }
    onWijzig({ ...lijst, woorden: [...lijst.woorden, schoon] });
    setWoord('');
  }

  return (
    <div className="tk-card flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="tk-lijstrij-titel">{lijst.naam}</h3>
        <span className="text-tekst-secundair">
          {lijst.woorden.length === 1
            ? t('you.lijstenAantalEen')
            : t('you.lijstenAantal', { aantal: lijst.woorden.length })}
        </span>
      </div>

      {lijst.woorden.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {lijst.woorden.map((bestaand) => (
            <li key={woordSleutel(bestaand)}>
              <button
                type="button"
                className="tk-chip"
                aria-label={t('you.lijstenWoordWeg', { woord: bestaand })}
                onClick={() =>
                  onWijzig({
                    ...lijst,
                    woorden: lijst.woorden.filter((andere) => andere !== bestaand),
                  })
                }
              >
                {bestaand}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <form className="flex flex-wrap items-end gap-2" onSubmit={voegToe}>
        <div className="flex flex-col gap-1">
          <label className="tk-label" htmlFor={veld}>
            {t('you.lijstenWoord')}
          </label>
          <input
            id={veld}
            className="tk-input max-w-xs"
            value={woord}
            maxLength={MAX_WOORD}
            disabled={vol}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            onChange={(event) => setWoord(event.target.value)}
          />
        </div>
        <button
          type="submit"
          className="tk-button tk-button-secondary"
          disabled={vol || schoonWoord(woord) === ''}
        >
          {t('you.lijstenWoordToe')}
        </button>
      </form>

      {vol ? <p className="tk-hulp">{t('you.lijstenVol')}</p> : null}

      <button type="button" className="tk-button tk-button-secondary self-start" onClick={onWeg}>
        {t('you.lijstenWeg')}
      </button>
    </div>
  );
}
