import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sterren, vlieg } from './feest';

/**
 * Het feest na een goed antwoord (ADR-183) is versiering: wie rustig koos,
 * krijgt er niets van, en waar het wel komt ruimt het zichzelf op.
 */
describe('het feest', () => {
  const animate = vi.fn(() => ({ onfinish: null }));

  beforeEach(() => {
    Object.defineProperty(Element.prototype, 'animate', {
      value: animate,
      configurable: true,
      writable: true,
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    delete document.documentElement.dataset.beweging;
    document.body.innerHTML = '';
    animate.mockClear();
    vi.useRealTimers();
  });

  it('doet niets waar beweging uit staat', () => {
    document.documentElement.dataset.beweging = 'rustig';
    const bron = document.body.appendChild(document.createElement('span'));
    sterren(bron);
    vlieg(bron, bron);
    expect(animate).not.toHaveBeenCalled();
    expect(document.body.children).toHaveLength(1);
  });

  it('strooit twaalf sterren in een laag die niets opvangt, en ruimt die op', () => {
    const bron = document.body.appendChild(document.createElement('span'));
    sterren(bron);
    const doek = document.body.lastElementChild as HTMLElement;
    expect(doek.getAttribute('aria-hidden')).toBe('true');
    expect(doek.style.pointerEvents).toBe('none');
    expect(doek.children).toHaveLength(12);
    vi.advanceTimersByTime(1200);
    expect(document.body.contains(doek)).toBe(false);
  });

  it('laat de punt niet vliegen zonder een bolletje om op te landen', () => {
    const bron = document.body.appendChild(document.createElement('span'));
    vlieg(bron, null);
    expect(animate).not.toHaveBeenCalled();
  });
});
