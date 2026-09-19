import { useId, useState, type FormEvent } from 'react';
import { activeer, type PremiumReden } from '@/store/premium';
import { t, type TranslationKey } from '@/i18n';

/**
 * Het veld waar een code in gaat, en de melding als hij niet klopt.
 *
 * Het stond alleen onderaan de premiumpagina. Sinds ADR-163 staat het ook in de
 * pop-up die een kind krijgt als het op een slot drukt, en twee formulieren die
 * hetzelfde doen gaan uit elkaar lopen op de dag dat er een foutmelding bij
 * komt. Dus één component, twee plekken.
 *
 * "Inloggen" is een code en niets meer. Geen e-mail en geen wachtwoord: er is
 * geen account om in te loggen (ADR-015), en een veld voor een van beide zou
 * precies verzamelen wat dit product beloofd heeft niet te verzamelen.
 */

const FOUT: Record<PremiumReden, TranslationKey> = {
  leeg: 'premium.fout.leeg',
  onbekend: 'premium.fout.onbekend',
  verlopen: 'premium.fout.verlopen',
  vol: 'premium.fout.vol',
  'te-vaak': 'premium.fout.te-vaak',
  'geen-verbinding': 'premium.fout.geen-verbinding',
  'niet-ingesteld': 'premium.fout.niet-ingesteld',
};

export function CodeVeld({
  onGelukt,
  className,
}: {
  /** Wat er gebeurt zodra de code klopt. Op de pagina niets; in de pop-up: dicht. */
  readonly onGelukt?: (() => void) | undefined;
  readonly className?: string;
}) {
  const [invoer, setInvoer] = useState('');
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<PremiumReden | null>(null);
  const veld = useId();
  const melding = useId();

  async function gebruik(event: FormEvent) {
    event.preventDefault();
    setBezig(true);
    setFout(null);
    const uitkomst = await activeer(invoer);
    setBezig(false);
    if (uitkomst.ok) {
      setInvoer('');
      onGelukt?.();
    } else {
      setFout(uitkomst.reden);
    }
  }

  return (
    <form
      className={className ?? 'tk-card flex flex-col gap-3'}
      onSubmit={(event) => void gebruik(event)}
    >
      <label htmlFor={veld} className="tk-label">
        {t('premium.codeLabel')}
      </label>
      <input
        id={veld}
        className="tk-input max-w-xs"
        value={invoer}
        onChange={(event) => setInvoer(event.target.value)}
        placeholder={t('premium.codePlaceholder')}
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        maxLength={20}
        aria-describedby={fout ? melding : undefined}
        aria-invalid={fout ? true : undefined}
      />
      <button type="submit" className="tk-button tk-button-secondary self-start" disabled={bezig}>
        {bezig ? t('premium.bezig') : t('premium.codeGebruiken')}
      </button>
      {fout ? (
        <p id={melding} role="alert" className="text-lopend">
          {t(FOUT[fout])}
        </p>
      ) : null}
    </form>
  );
}
