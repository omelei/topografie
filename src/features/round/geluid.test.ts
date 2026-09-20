import { afterEach, describe, expect, it, vi } from 'vitest';
import { speelMoment, speelUitkomst, vergeetContext } from './geluid';

/**
 * De twee tonen (ADR-134). Wat hier het meest toe doet is niet hoe ze klinken
 * maar dat ze nooit in de weg kunnen zitten: geluid hangt aan het nakijken van
 * een antwoord, en een ronde mag er niet op stuklopen.
 */

class NepOscillator {
  type = '';
  frequency = { value: 0 };
  connect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}

function nepContext() {
  const oscillators: NepOscillator[] = [];
  const ctx = {
    currentTime: 0,
    destination: {},
    resume: vi.fn(),
    createOscillator: vi.fn(() => {
      const osc = new NepOscillator();
      oscillators.push(osc);
      return osc;
    }),
    createGain: vi.fn(() => ({
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    })),
  };
  return { ctx, oscillators };
}

function installeer(ctx: unknown) {
  vergeetContext();
  (window as unknown as { AudioContext: unknown }).AudioContext = vi.fn(() => ctx);
}

afterEach(() => {
  vergeetContext();
  delete (window as unknown as { AudioContext?: unknown }).AudioContext;
});

describe('de toon bij een antwoord', () => {
  it('doet niets als het geluid uitstaat', () => {
    const { ctx } = nepContext();
    installeer(ctx);
    speelUitkomst(true, false);
    expect(ctx.createOscillator).not.toHaveBeenCalled();
  });

  it('speelt twee tonen omhoog als het goed is', () => {
    const { ctx, oscillators } = nepContext();
    installeer(ctx);
    speelUitkomst(true, true);
    expect(oscillators).toHaveLength(2);
    expect(oscillators[1]?.frequency.value).toBeGreaterThan(oscillators[0]?.frequency.value ?? 0);
  });

  /** Eén lage toon, en geen tweede: herhaling maakt er een oordeel van. */
  it('speelt één lage toon als het mis is', () => {
    const { ctx, oscillators } = nepContext();
    installeer(ctx);
    speelUitkomst(false, true);
    expect(oscillators).toHaveLength(1);
    expect(oscillators[0]?.frequency.value).toBeLessThan(400);
  });

  it('speelt drie tonen bij een diploma, en niets als het uitstaat', () => {
    const { ctx, oscillators } = nepContext();
    installeer(ctx);
    speelMoment('diploma', false);
    expect(oscillators).toHaveLength(0);
    speelMoment('diploma', true);
    expect(oscillators).toHaveLength(3);
  });

  it('hergebruikt één context in plaats van er een per antwoord te maken', () => {
    const { ctx } = nepContext();
    installeer(ctx);
    const Ctor = (window as unknown as { AudioContext: ReturnType<typeof vi.fn> }).AudioContext;
    speelUitkomst(true, true);
    speelUitkomst(false, true);
    expect(Ctor).toHaveBeenCalledTimes(1);
  });

  it('gaat niet stuk als de browser geen AudioContext heeft', () => {
    vergeetContext();
    delete (window as unknown as { AudioContext?: unknown }).AudioContext;
    expect(() => speelUitkomst(true, true)).not.toThrow();
  });

  /** De belangrijkste: een ronde mag nooit vastlopen op geluid. */
  it('gaat niet stuk als het afspelen zelf mislukt', () => {
    installeer({
      currentTime: 0,
      destination: {},
      resume: vi.fn(),
      createOscillator: () => {
        throw new Error('geen audio');
      },
      createGain: vi.fn(),
    });
    expect(() => speelUitkomst(true, true)).not.toThrow();
  });
});
