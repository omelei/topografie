import { describe, expect, it } from 'vitest';
import {
  jaarstrook,
  schooljaarBegin,
  weekdoelUit,
  weekkaart,
  WEEKDOEL_STANDAARD,
  zegelsAfleiden,
} from './weekkaart';
import { dayKey, weekKey } from './kalender';

/** Een lokaal moment op een dag. 7 september 2026 is een maandag. */
const op = (key: string, uur = 12) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1, uur);
};

describe('weekkaart', () => {
  it('loopt van maandag tot en met zondag, ook als vandaag woensdag is', () => {
    const kaart = weekkaart(new Set(), 3, op('2026-09-09'));
    expect(kaart.dagen.map((d) => d.dag)).toEqual([
      '2026-09-07',
      '2026-09-08',
      '2026-09-09',
      '2026-09-10',
      '2026-09-11',
      '2026-09-12',
      '2026-09-13',
    ]);
    expect(kaart.dagen[2]?.vandaag).toBe(true);
    expect(kaart.dagen[3]?.later).toBe(true);
  });

  it('is gehaald zodra het aantal dagen het doel haalt, op welke dagen ook', () => {
    const dagen = new Set(['2026-09-07', '2026-09-12', '2026-09-13']);
    const kaart = weekkaart(dagen, 3, op('2026-09-13'));
    expect(kaart).toMatchObject({ aantal: 3, doel: 3, gehaald: true });
    expect(weekkaart(dagen, 4, op('2026-09-13')).gehaald).toBe(false);
  });

  it('telt geen dagen van de week ervoor mee', () => {
    const kaart = weekkaart(new Set(['2026-09-06']), 2, op('2026-09-07'));
    expect(kaart.aantal).toBe(0);
  });
});

describe('weekdoelUit', () => {
  it('houdt het doel tussen twee en vijf, met drie als het onleesbaar is', () => {
    expect(weekdoelUit(1)).toBe(2);
    expect(weekdoelUit(9)).toBe(5);
    expect(weekdoelUit('4')).toBe(4);
    expect(weekdoelUit('niets')).toBe(WEEKDOEL_STANDAARD);
    expect(weekdoelUit(undefined)).toBe(WEEKDOEL_STANDAARD);
  });
});

describe('het schooljaar en de strook', () => {
  it('begint op de maandag van de week van 1 september', () => {
    // 1 september 2026 is een dinsdag.
    expect(dayKey(schooljaarBegin(op('2026-10-15')))).toBe('2026-08-31');
    expect(dayKey(schooljaarBegin(op('2027-03-01')))).toBe('2026-08-31');
    expect(dayKey(schooljaarBegin(op('2026-08-20')))).toBe('2025-09-01');
  });

  it('loopt tot en met deze week, met een zegel waar er een is', () => {
    const now = op('2026-09-16');
    const strook = jaarstrook(new Set([weekKey(op('2026-09-08'))]), now);
    expect(strook).toHaveLength(3);
    expect(strook.map((w) => w.zegel)).toEqual([false, true, false]);
    expect(strook[2]?.nu).toBe(true);
  });

  it('leidt zegels af voor eerdere weken, niet voor deze', () => {
    const dagen = new Set(['2026-09-07', '2026-09-08', '2026-09-14', '2026-09-15', '2026-09-16']);
    expect(zegelsAfleiden(dagen, 2, op('2026-09-16'))).toEqual([weekKey(op('2026-09-07'))]);
  });
});
