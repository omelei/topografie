import { afterEach, describe, expect, it } from 'vitest';
import { voegWensToe, WENSEN_SLEUTEL, wensenVan } from './wensen';

const op = (dag: string) => new Date(`${dag}T12:00:00`);

afterEach(() => {
  window.localStorage.clear();
});

describe('wensen (ADR-193)', () => {
  it('houdt per kind bij wat het wilde en waar het klaar voor was, het nieuwste eerst', () => {
    voegWensToe('fem', { wat: 'Bliksemronde bij Provincies', soort: 'wil' }, op('2026-09-20'));
    voegWensToe('fem', { wat: 'Tafel van 7', soort: 'klaar' }, op('2026-09-21'));
    voegWensToe('fem', { wat: 'Zelf typen bij Tafel van 3', soort: 'wil' }, op('2026-09-22'));
    voegWensToe('ties', { wat: 'Overleven bij Europa', soort: 'wil' }, op('2026-09-22'));

    expect(wensenVan('fem', op('2026-09-23'))).toEqual({
      klaar: ['Tafel van 7'],
      wil: ['Zelf typen bij Tafel van 3', 'Bliksemronde bij Provincies'],
    });
    expect(wensenVan('ties', op('2026-09-23')).wil).toEqual(['Overleven bij Europa']);
  });

  it('noemt dezelfde wens één keer, en schuift hem naar voren', () => {
    voegWensToe('fem', { wat: 'A', soort: 'wil' }, op('2026-09-20'));
    voegWensToe('fem', { wat: 'B', soort: 'wil' }, op('2026-09-21'));
    voegWensToe('fem', { wat: 'A', soort: 'wil' }, op('2026-09-22'));
    expect(wensenVan('fem', op('2026-09-23')).wil).toEqual(['A', 'B']);
  });

  it('laat hooguit drie zien, en niets ouder dan dertig dagen', () => {
    for (const [i, wat] of ['A', 'B', 'C', 'D'].entries()) {
      voegWensToe('fem', { wat, soort: 'wil' }, op(`2026-09-2${i}`));
    }
    voegWensToe('fem', { wat: 'Oud', soort: 'klaar' }, op('2026-07-01'));
    expect(wensenVan('fem', op('2026-09-24'))).toEqual({ klaar: [], wil: ['D', 'C', 'B'] });
  });

  it('negeert wat er kapot in staat', () => {
    window.localStorage.setItem(WENSEN_SLEUTEL, '{"geen":"lijst"}');
    expect(wensenVan('fem')).toEqual({ klaar: [], wil: [] });
    window.localStorage.setItem(WENSEN_SLEUTEL, 'geen json');
    expect(wensenVan('fem')).toEqual({ klaar: [], wil: [] });
  });
});
