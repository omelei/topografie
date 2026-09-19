import { GROEPEN, type Groep } from '@/game-core';
import { t, type TranslationKey } from '@/i18n';

/**
 * Zes knoppen en een uitweg: groep 3 tot en met 8, en "Zeg ik niet" of
 * "Geen groep" (ADR-151, ADR-161).
 *
 * Dezelfde rij op drie plekken — na de naam, één keer op de voordeur, en op
 * Voor ouders — zodat een groep er overal hetzelfde uitziet. Het zijn de
 * keuzechips van een modulepagina (`tk-keuze`): een kort woord, meer op een
 * regel, en het gekozene draagt `aria-pressed`.
 *
 * De uitweg staat erbij als gewone knop, niet als klein linkje eronder. Een
 * kind dat zijn groep niet kwijt wil, hoort niet te zoeken hoe het verder kan.
 *
 * **En bij de eerste vraag staat er nog een knop naast** (ADR-161): "Ik ben een
 * ouder". Die is geen groep en kiest er ook geen — hij draagt daarom nooit
 * `aria-pressed`, want er valt niets aan te staan. Alleen de eerste vraag geeft
 * hem mee; op Voor ouders zou hij de ouder sturen naar de pagina waar hij al is.
 */
export function GroepKiezer({
  gekozen,
  uitweg,
  onKies,
  onOuder,
  bezig = false,
}: {
  /** De groep die nu geldt: `undefined` is geen groep, `null` is nog niets gekozen. */
  readonly gekozen: Groep | undefined | null;
  readonly uitweg: TranslationKey;
  readonly onKies: (groep: Groep | undefined) => void;
  /** "Ik ben een ouder", waar die knop erbij hoort. Weggelaten is weggelaten. */
  readonly onOuder?: (() => void) | undefined;
  readonly bezig?: boolean;
}) {
  return (
    <div className="tk-keuzes" role="group" aria-label={t('groep.vraag')}>
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
      {onOuder ? (
        <button type="button" className="tk-keuze" disabled={bezig} onClick={onOuder}>
          {t('groep.ouder')}
        </button>
      ) : null}
    </div>
  );
}
