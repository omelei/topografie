import { useEffect, useState } from 'react';
import { keuzeUit, registerUit, type Register, type RegisterKeuze } from '@/game-core';
import { groepVanActiefKind } from '@/store/children';
import { getSetting, setSetting } from '@/store/settings';

/**
 * Welk gezicht de toren laat zien, en wie dat kiest (ADR-158).
 *
 * De groep beslist standaard: onderbouw het beeld, bovenbouw de getallen. Een
 * ouder kan dat op Voor ouders overschrijven.
 *
 * Op het apparaat en niet per kind, zoals `voorlezen` (`settings.ts`), met
 * dezelfde afweging: het zijn schakelaars van het ding waar je op oefent. Wie
 * hem op "volg de groep" laat staan — de standaardwaarde — krijgt vanzelf per
 * kind het goede gezicht.
 */

const SLEUTEL = 'register';

export async function leesRegisterKeuze(): Promise<RegisterKeuze> {
  return keuzeUit(await getSetting(SLEUTEL));
}

export async function schrijfRegisterKeuze(keuze: RegisterKeuze): Promise<void> {
  await setSetting(SLEUTEL, keuze);
}

/**
 * Het register van dit moment.
 *
 * Begint op `beeld`: dat is de veilige kant zolang de groep nog niet gelezen
 * is, want een kind van zes dat een tel lang getallen ziet, is erger af dan een
 * twaalfjarige die een tel lang het beeld ziet.
 */
export function useRegister(): Register {
  const [register, setRegister] = useState<Register>('beeld');

  useEffect(() => {
    let levend = true;
    void Promise.all([leesRegisterKeuze(), groepVanActiefKind()]).then(([keuze, groep]) => {
      if (levend) setRegister(registerUit(keuze, groep));
    });
    return () => {
      levend = false;
    };
  }, []);

  return register;
}
