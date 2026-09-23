import { GROEPEN, type Groep } from '@/game-core';
import { t, type TranslationKey } from '@/i18n';

/**
 * Zes knoppen en een uitweg: groep 3 tot en met 8, en "Zeg ik niet" of
 * "Geen groep" (ADR-151, ADR-161).
 *
 * Dezelfde rij op drie plekken — na de naam, één keer op de voordeur, en op
 * Jij — zodat een groep er overal hetzelfde uitziet. Het zijn de
 * keuzechips van een modulepagina (`tk-keuze`): een kort woord, meer op een
 * regel, en het gekozene draagt `aria-pressed`.
 *
 * De uitweg staat erbij als gewone knop, niet als klein linkje eronder. Een
 * kind dat zijn groep niet kwijt wil, hoort niet te zoeken hoe het verder kan.
 *
 * "Ik ben een ouder" stond hier tot ADR-198; hij staat nu bij de naam.
 */
export function GroepKiezer({
  gekozen,
  uitweg,
  onKies,
  bezig = false,
  label,
}: {
  /** De groep die nu geldt: `undefined` is geen groep, `null` is nog niets gekozen. */
  readonly gekozen: Groep | undefined | null;
  readonly uitweg: TranslationKey;
  readonly onKies: (groep: Groep | undefined) => void;
  readonly bezig?: boolean;
  /**
   * Hoe de groep met knoppen heet voor een schermlezer. Standaard de vraag aan het
   * kind zelf; op de ouderpagina gaat het over een kind, in de derde persoon.
   */
  readonly label?: string | undefined;
}) {
  return (
    <div className="tk-keuzes" role="group" aria-label={label ?? t('groep.vraag')}>
      {GROEPEN.map((groep) => (
        <button
          key={groep}
          type="button"
          className="tk-keuze"
          aria-pressed={gekozen === groep}
          disabled={bezig}
          onClick={() => onKies(groep)}
        >
          {t('groep.knop', { groep })}
        </button>
      ))}
      <button
        type="button"
        className="tk-keuze"
        aria-pressed={gekozen === undefined}
        disabled={bezig}
        onClick={() => onKies(undefined)}
      >
        {t(uitweg)}
      </button>
    </div>
  );
}
