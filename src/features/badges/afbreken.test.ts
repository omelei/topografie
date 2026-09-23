import { describe, expect, it } from 'vitest';
import { afbreekbaar } from './afbreken';

const Z = '­';

describe('afbreekbaar', () => {
  it('zet een zacht afbreekstreepje tussen de delen van een samenstelling', () => {
    expect(afbreekbaar('Provincievlaggen')).toBe(`Provincie${Z}vlaggen`);
    expect(afbreekbaar('Waddeneilanden')).toBe(`Wadden${Z}eilanden`);
    expect(afbreekbaar('Verkleinwoorden')).toBe(`Verklein${Z}woorden`);
    expect(afbreekbaar('Eén of twee medeklinkers')).toBe(`Eén of twee mede${Z}klinkers`);
  });

  it('laat een kort of los woord heel', () => {
    expect(afbreekbaar('Steden')).toBe('Steden');
    expect(afbreekbaar('Tafel van 7')).toBe('Tafel van 7');
    expect(afbreekbaar('Woorden op -ig')).toBe('Woorden op -ig');
  });
});
