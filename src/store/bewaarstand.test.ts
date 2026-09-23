import { describe, expect, it, vi } from 'vitest';
import { beginscherm, leesBewaarstand, vraagBlijvend, type BewaarOmgeving } from './bewaarstand';

/**
 * Of wat een kind oefent blijft staan (ADR-186). Alleen lezen en vragen; wat
 * er met het antwoord gebeurt, beslist de ouderpagina.
 */
function omgeving(navigator: BewaarOmgeving['navigator'], standalone = false): BewaarOmgeving {
  return { navigator, matchMedia: () => ({ matches: standalone }) };
}

describe('het beginscherm', () => {
  it('herkent een app die vanaf het beginscherm draait', () => {
    expect(beginscherm(omgeving({ standalone: true }))).toBe('staat-erop');
    expect(beginscherm(omgeving({}, true))).toBe('staat-erop');
  });

  it('herkent een tabblad in Safari op iPhone en iPad aan `standalone`', () => {
    expect(beginscherm(omgeving({ standalone: false }))).toBe('kan-erop');
  });

  it('zegt niets over een browser die `standalone` niet kent', () => {
    expect(beginscherm(omgeving({}))).toBe('onbekend');
  });
});

describe('bewaren bij een vol apparaat', () => {
  it('leest wat de browser zegt', async () => {
    const persisted = vi.fn(async () => true);
    expect(await leesBewaarstand(omgeving({ storage: { persisted } }))).toEqual({
      blijvend: true,
      beginscherm: 'onbekend',
    });
  });

  it('zegt "weet niet" als de browser de vraag niet kent, of gooit', async () => {
    expect((await leesBewaarstand(omgeving({}))).blijvend).toBeNull();
    const gooit = async () => {
      throw new Error('nee');
    };
    expect(
      (await leesBewaarstand(omgeving({ storage: { persisted: gooit } }))).blijvend,
    ).toBeNull();
  });

  it('vraagt het alleen als erom gevraagd wordt, en geeft het antwoord door', async () => {
    const persist = vi.fn(async () => false);
    await leesBewaarstand(omgeving({ storage: { persist } }));
    expect(persist).not.toHaveBeenCalled();

    expect(await vraagBlijvend(omgeving({ storage: { persist } }))).toBe(false);
    expect(persist).toHaveBeenCalledTimes(1);
    expect(await vraagBlijvend(omgeving({}))).toBeNull();
  });
});
