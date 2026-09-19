import { t } from '@/i18n';
import { useReeks } from './reeks';

/**
 * Wat er vandaag op het spel staat (ADR-158).
 *
 * Eén regel op de voordeur, en alleen als er echt iets loopt: een reeks van
 * minstens één dag, en vandaag nog leeg. Verder staat de reeks niet op de
 * voordeur — het blok met het record en de uitleg hoort op Jij en op Ronde
 * klaar, want daar kijkt een kind terug en niet vooruit.
 *
 * **Dit is verlies-als-prikkel, en dat is een besluit van de eigenaar.** Het
 * staat onder Consequences in ADR-158, met het bezwaar erbij. Wat er hier
 * daarom níét omheen staat: geen aftelklok, geen alarmkleur, geen tweede
 * vermelding, en nergens iets te kopen om hem te redden. Eén zin, en wie hem
 * negeert verliest geen enkele steen.
 */
export function ReeksRegel() {
  const reeks = useReeks();
  if (reeks === null || !reeks.opHetSpel) return null;

  return (
    <p className="tk-reeksregel">
      {reeks.dagen === 1
        ? t('reeks.opHetSpelEen')
        : t('reeks.opHetSpel', { aantal: reeks.dagen })}
    </p>
  );
}
