import type { KlokItem } from '@/game-core';
import { digitaleTijd } from './klokTaal';

/**
 * De digitale klok, getekend: het ding waar de vraag over gaat, op de plek
 * van de wijzerklok (ADR-247).
 *
 * In inkt en niet in de kleur van het vak, om dezelfde reden als de
 * wijzerklok: wat een kind moet lezen, is inkt. Donker met lichte cijfers,
 * omdat een digitale klok zo oogt.
 */
export function DigitaleKlok({
  tijd,
  middag,
}: {
  readonly tijd: KlokItem;
  readonly middag: boolean;
}) {
  const tekst = digitaleTijd(tijd, middag);

  return (
    <div className="tk-digitaal" role="img" aria-label={tekst}>
      <span aria-hidden="true">{tekst}</span>
    </div>
  );
}
