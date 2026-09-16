import { useEffect, useState } from 'react';
import { Heldplaat } from '@/components/Heldplaat';
import { loadPreferences } from '@/features/player/settings';
import { useEigenHeld } from '@/features/reis/useEigenHeld';

/**
 * Het maatje: de held van dit kind, in beeld zodra een antwoord nagekeken is
 * (ADR-142).
 *
 * Het rondescherm was het leegste scherm van het product en tegelijk het scherm
 * waar een kind verreweg de meeste tijd doorbrengt: een kaart met een som erin,
 * een teken van tweeëndertig pixels ernaast, en verder wit. Alles wat dit
 * product aan persoonlijkheid heeft — zestig tekeningen — stond ergens anders.
 *
 * Hier staat hij dus. Niet als versiering die er altijd is, maar op het moment
 * dat er iets gebeurde: je hebt geantwoord, en je maatje is er. Dat is hetzelfde
 * moment waarop het geluid klinkt (ADR-134) en het teken landt, dus het is één
 * gebeurtenis en niet drie.
 *
 * **Goed veert, fout komt gewoon aan.** Eén pose per held, dus de held zelf kan
 * niet blij of teleurgesteld kijken; wat verschilt is hoe hij binnenkomt. Een
 * kind dat het even niet weet heeft geen juichend dier nodig — de woorden
 * ernaast zeggen al wat er gebeurde, en die zijn nooit een oordeel.
 *
 * **Altijd even hoog.** Ook als er niets te tekenen valt, want een kaart die van
 * hoogte verspringt tussen goed en fout verplaatst de knop waar een kind net
 * naartoe bewoog.
 *
 * **Drie goed op rij sluit er een ring omheen.** Dat getal werd al geteld —
 * `useRoundCore` houdt `combo` bij en alle vijf de rondeschermen zetten hem als
 * `×3` in de balk — en het keerde niets uit, op een scherm van minstens 768
 * pixels, naast een `×0` aan het begin van elke ronde. Nu is het een
 * gebeurtenis: bij drie, zes en negen komt er een ring om je maatje.
 *
 * **Erkenning, geen valuta.** Tien goed is een ster, altijd, voor iedereen; dit
 * verandert daar niets aan en kan dat ook niet. Het zegt alleen dat het even
 * lekker loopt — en dat is precies het moment dat Brawl Stars en Duolingo
 * allebei pakken en dit product liet liggen.
 *
 * Geen geluid. Het antwoordgeluid klonk nul milliseconden eerder, en twee
 * geluiden binnen vierhonderd milliseconden zijn geen twee gebeurtenissen maar
 * één rommelige.
 */
export function Maatje({
  goed,
  opDreef = false,
}: {
  readonly goed: boolean;
  readonly opDreef?: boolean;
}) {
  const { held, reeks } = useEigenHeld();
  // Uit te zetten op Voor ouders (ADR-145). Null tot het gelezen is: een held
  // die verschijnt en meteen weer weggaat is erger dan een die even wacht.
  const [aan, setAan] = useState<boolean | null>(null);

  useEffect(() => {
    void loadPreferences().then((prefs) => setAan(prefs.maatje));
  }, []);

  return (
    <p
      className="tk-maatje"
      data-goed={goed ? '' : undefined}
      data-dreef={goed && opDreef && aan ? '' : undefined}
    >
      {aan ? (
        <Heldplaat sticker={held.id} reeks={reeks} size={88} className="tk-maatje-beeld" />
      ) : null}
    </p>
  );
}
