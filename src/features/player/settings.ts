import { useEffect, useState } from 'react';
import { getSetting, setSetting } from '@/store/profile';

/**
 * The switch on K10, and it does something.
 *
 * A switch that changes nothing is a promise the screen does not keep, and on a
 * settings page that is the whole content — so this one is wired to the place
 * it claims to affect rather than stored and admired.
 *
 * K10 had a third, for the reading mode; ADR-025 dropped it. And there was a
 * second, "Klok bij het oefenen", whose only job was to hide the bliksemronde.
 * ADR-112 offers the bliksemronde on every page, so the switch had nothing left
 * to switch and went. A value a child stored for it is simply no longer read.
 */

export interface Preferences {
  /**
   * On by default. For group 4 reading aloud is not an aid, it is the only way
   * to know what the question says (styleguide §C), so this starts on and a
   * child turns it off rather than having to find it.
   */
  readonly readAloud: boolean;
  /**
   * Ook aan bij het begin (ADR-134). Twee tonen bij een antwoord zijn de
   * snelste terugkoppeling die er is — sneller dan lezen — en wie ze niet wil,
   * in de klas of naast een slapende broer, zet ze hier uit.
   */
  readonly geluid: boolean;
}

export const DEFAULT_PREFERENCES: Preferences = { readAloud: true, geluid: true };

const KEY = { readAloud: 'voorlezen', geluid: 'geluid' } as const;

/** Stored as strings because that is what the settings store holds. */
function read(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value === 'aan';
}

export async function loadPreferences(): Promise<Preferences> {
  const [readAloud, geluid] = await Promise.all([
    getSetting(KEY.readAloud),
    getSetting(KEY.geluid),
  ]);
  return {
    readAloud: read(readAloud, DEFAULT_PREFERENCES.readAloud),
    geluid: read(geluid, DEFAULT_PREFERENCES.geluid),
  };
}

export async function savePreference(name: keyof Preferences, on: boolean): Promise<void> {
  await setSetting(KEY[name], on ? 'aan' : 'uit');
}

/**
 * The preferences as React state, for the screens that obey them.
 *
 * Deliberately not a context: a handful of consumers, one read each, and a
 * provider around the whole app would be more machinery than the thing it
 * carries.
 */
export function usePreferences(): Preferences {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    void loadPreferences().then(setPrefs);
  }, []);

  return prefs;
}
