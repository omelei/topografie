import { useEffect, useState } from 'react';
import type { RegisterKeuze } from '@/game-core';
import { t } from '@/i18n';
import { leesRegisterKeuze, schrijfRegisterKeuze } from './register';

/**
 * Welk gezicht de toren laat zien, op Voor ouders (ADR-158).
 *
 * Standaard volgt hij de groep: onderbouw het beeld, bovenbouw de getallen.
 * Een ouder die vindt dat het niet past, zet het hier om — en "volg de groep"
 * blijft een stand, zodat een kind dat overgaat vanzelf meeschuift.
 *
 * Hier en niet op Jij, zoals de groep en het voorlezen: het is een instelling,
 * en instellingen staan bij de ouder (ADR-136, ADR-143). Zonder slot.
 */
const KEUZES: readonly { readonly waarde: RegisterKeuze; readonly label: string }[] = [
  { waarde: 'auto', label: 'register.auto' },
  { waarde: 'beeld', label: 'register.beeld' },
  { waarde: 'getal', label: 'register.getal' },
];

export function RegisterInstelling() {
  const [keuze, setKeuze] = useState<RegisterKeuze | null>(null);

  useEffect(() => {
    let levend = true;
    void leesRegisterKeuze().then((waarde) => {
      if (levend) setKeuze(waarde);
    });
    return () => {
      levend = false;
    };
  }, []);

  if (keuze === null) return null;

  async function kies(waarde: RegisterKeuze) {
    setKeuze(waarde);
    await schrijfRegisterKeuze(waarde);
  }

  return (
    <section className="flex flex-col gap-3" aria-labelledby="register-ouder">
      <h2 id="register-ouder" className="tk-sectie">
        {t('register.titel')}
      </h2>
      <p className="text-lopend text-tekst-secundair">{t('register.uitleg')}</p>
      <div className="tk-keuzerij" role="group" aria-labelledby="register-ouder">
        {KEUZES.map(({ waarde, label }) => (
          <button
            key={waarde}
            type="button"
            className="tk-keuze"
            aria-pressed={keuze === waarde}
            onClick={() => void kies(waarde)}
          >
            {t(label as 'register.auto')}
          </button>
        ))}
      </div>
    </section>
  );
}
