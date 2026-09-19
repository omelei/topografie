import { METER_PER_VERDIEPING } from './toren';

/**
 * Waar de toren langs komt (ADR-158).
 *
 * **Dit is inhoud en geen regel**, dus het is één lijst met een test ernaast en
 * geen code. Een ijkpunt erbij is een regel in deze tabel.
 *
 * Twee registers, dezelfde lijst. Groep 3-5 krijgt het beeld en geen meters; de
 * giraf en de boom zijn er alleen voor hen, want ze zijn te klein om een
 * twaalfjarige iets te zeggen. Groep 6-8 krijgt de getallen erbij en twee
 * ijkpunten meer aan de bovenkant.
 *
 * **Alleen echte bouwwerken dragen een echte hoogte.** Een huis, een windmolen,
 * een kerktoren en een reuzenrad verschillen te veel om een getal te verdienen;
 * die staan er zonder, en het scherm zegt er "ongeveer" bij. Een kind van twaalf
 * dat één getal natrekt en het mis vindt, gelooft de rest van de app ook niet
 * meer.
 */

/** Voor wie een ijkpunt bedoeld is. */
export type Register = 'beeld' | 'getal';

export interface IJkpunt {
  /** De sleutel waarmee het scherm zijn naam opzoekt. */
  readonly id: string;
  readonly verdiepingen: number;
  /** De echte hoogte in meters, waar die vaststaat. Null is "ongeveer". */
  readonly echt: number | null;
  /** Null betekent: in allebei de registers. */
  readonly alleen: Register | null;
}

export const IJKPUNTEN: readonly IJkpunt[] = [
  { id: 'giraf', verdiepingen: 2, echt: null, alleen: 'beeld' },
  { id: 'huis', verdiepingen: 4, echt: null, alleen: null },
  { id: 'boom', verdiepingen: 7, echt: null, alleen: 'beeld' },
  { id: 'windmolen', verdiepingen: 11, echt: null, alleen: null },
  { id: 'kerktoren', verdiepingen: 17, echt: null, alleen: null },
  { id: 'reuzenrad', verdiepingen: 25, echt: null, alleen: null },
  { id: 'domtoren', verdiepingen: 38, echt: 112, alleen: null },
  { id: 'euromast', verdiepingen: 62, echt: 185, alleen: null },
  { id: 'eiffeltoren', verdiepingen: 100, echt: 300, alleen: null },
  { id: 'wolken', verdiepingen: 167, echt: null, alleen: null },
  { id: 'burjkhalifa', verdiepingen: 276, echt: 828, alleen: 'getal' },
  { id: 'kilometer', verdiepingen: 334, echt: 1000, alleen: null },
  { id: 'tienkilometer', verdiepingen: 3334, echt: 10000, alleen: 'getal' },
];

/** De ijkpunten van één register, laagste eerst. */
export function ijkpuntenVoor(register: Register): readonly IJkpunt[] {
  return IJKPUNTEN.filter((punt) => punt.alleen === null || punt.alleen === register);
}

/**
 * Het hoogste ijkpunt dat deze toren voorbij is, of null.
 *
 * "Hoger dan een kerktoren" is waar zodra de toren er even hoog is: de drempel is
 * het aantal verdiepingen waarop de toren het bouwwerk haalt.
 */
export function bereikt(verdiepingen: number, register: Register): IJkpunt | null {
  const gehaald = ijkpuntenVoor(register).filter((punt) => verdiepingen >= punt.verdiepingen);
  return gehaald.length === 0 ? null : (gehaald[gehaald.length - 1] as IJkpunt);
}

/**
 * Het ijkpunt dat deze ronde gepasseerd werd, of null.
 *
 * Alleen de passage zelf telt, en hooguit één per ronde: het hoogste. Wie in één
 * ronde over twee ijkpunten heen gaat, hoort over het verste.
 */
export function gepasseerd(
  voor: number,
  na: number,
  register: Register,
): IJkpunt | null {
  const punten = ijkpuntenVoor(register).filter(
    (punt) => voor < punt.verdiepingen && na >= punt.verdiepingen,
  );
  return punten.length === 0 ? null : (punten[punten.length - 1] as IJkpunt);
}

/** Het eerstvolgende ijkpunt, of null als de toren alles voorbij is. */
export function volgende(verdiepingen: number, register: Register): IJkpunt | null {
  return ijkpuntenVoor(register).find((punt) => verdiepingen < punt.verdiepingen) ?? null;
}

/** Hoe hoog een toren van zoveel verdiepingen is, in meters. */
export function meterVoor(verdiepingen: number): number {
  return verdiepingen * METER_PER_VERDIEPING;
}
