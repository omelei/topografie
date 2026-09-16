import { describe, expect, it } from 'vitest';
import { DREEF, opDreef } from './dreef';

describe('opDreef', () => {
  it('zegt niets over het begin van een ronde', () => {
    // De teller stond hier op `×0`, op elk scherm breder dan 768 pixels.
    expect(opDreef(0)).toBe(false);
    expect(opDreef(1)).toBe(false);
    expect(opDreef(2)).toBe(false);
  });

  it('valt op elke derde goede op rij', () => {
    expect(opDreef(DREEF)).toBe(true);
    expect(opDreef(6)).toBe(true);
    expect(opDreef(9)).toBe(true);
  });

  it('zwijgt tussen twee drietallen door', () => {
    expect(opDreef(4)).toBe(false);
    expect(opDreef(5)).toBe(false);
    expect(opDreef(7)).toBe(false);
  });
});
