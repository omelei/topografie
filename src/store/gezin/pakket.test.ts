import { describe, expect, it } from 'vitest';
import type { AttemptRecord, SessionRecord } from '../db';
import { pakketVan, type Bron } from './pakket';
import type { Eigenaar } from './rijen';

/**
 * Welke rijen van wie zijn, en wat er dus vertrekt als een ouder één kind
 * meeneemt (ADR-187). Het deel dat ertoe doet is wat er níét meegaat: het
 * broertje, een ronde die nog loopt, en wat alleen van dit apparaat is.
 */

const NOOR: Eigenaar = { kindId: 'server-noor', ouderId: 'ouder-1', lokaalId: 'me' };
const NU = new Date('2026-09-23T12:00:00.000Z');

function sessie(id: string, kindId: string | undefined, klaar = true): SessionRecord {
  return {
    id,
    ...(kindId === undefined ? {} : { kindId }),
    mode: 'meerkeuze',
    setId: 'nl-provincies',
    itemSet: [],
    score: 3,
    beantwoord: 4,
    gestart: '2026-09-22T10:00:00.000Z',
    geeindigd: klaar ? '2026-09-22T10:05:00.000Z' : null,
  } as SessionRecord;
}

function poging(id: string | number, sessionId: string, kindId?: string): AttemptRecord {
  return {
    id,
    sessionId,
    ...(kindId === undefined ? {} : { kindId }),
    itemId: 'nl-limburg',
    mode: 'meerkeuze',
    correct: true,
    responseMs: 1200,
    gekozenAntwoord: 'nl-limburg',
    tijdstip: '2026-09-22T10:01:00.000Z',
  } as AttemptRecord;
}

const BRON: Bron = {
  progress: [
    {
      kindId: 'me',
      itemId: 'nl-limburg',
      box: 2,
      laatsteReview: '2026-09-22T10:01:00.000Z',
      volgendeReview: '2026-09-24T10:01:00.000Z',
      goedCount: 1,
      foutCount: 0,
    },
    {
      kindId: 'sem',
      itemId: 'nl-limburg',
      box: 5,
      laatsteReview: null,
      volgendeReview: null,
      goedCount: 9,
      foutCount: 0,
    },
  ] as Bron['progress'],
  sessions: [
    sessie('s-oud', undefined), // van vóór ADR-046: van het eerste kind
    sessie('s-noor', 'me'),
    sessie('s-loopt', 'me', false),
    sessie('s-sem', 'sem'),
  ],
  attempts: [
    poging('p-oud', 's-oud'),
    poging('p-noor', 's-noor', 'me'),
    poging(7, 's-noor', 'me'), // nog genummerd
    poging('p-loopt', 's-loopt', 'me'),
    poging('p-sem', 's-sem', 'sem'),
  ],
  kindBadges: [
    { kindId: 'me', badgeId: 'tafel-2', behaaldOp: '2026-09-20T10:00:00.000Z' },
    { kindId: 'sem', badgeId: 'tafel-5', behaaldOp: '2026-09-21T10:00:00.000Z' },
  ] as Bron['kindBadges'],
  settings: [
    { key: 'weekdoel:me', value: '{}', gewijzigdOp: '2026-09-21T10:00:00.000Z' },
    { key: 'weekdoel:sem', value: '{}' },
    { key: 'dagstand:me', value: '{}' },
    { key: 'gezin:me', value: '{"kindId":"server-noor","ouderId":"ouder-1"}' },
    { key: 'actiefKind', value: 'me' },
  ],
};

describe('het pakket van één kind', () => {
  const pakket = pakketVan(BRON, NOOR, NU);

  it('neemt de afgeronde rondes van dit kind mee, ook die van vóór er kinderen waren', () => {
    expect(pakket.sessies.map((rij) => rij.id)).toEqual(['s-oud', 's-noor']);
    expect(pakket.sessies.every((rij) => rij.kind_id === 'server-noor')).toBe(true);
  });

  it('neemt alleen pogingen mee waarvan de ronde ook meegaat, met een uuid', () => {
    expect(pakket.pogingen.map((rij) => rij.id)).toEqual(['p-oud', 'p-noor']);
  });

  it('laat het broertje staan', () => {
    const alles = JSON.stringify(pakket);
    expect(alles).not.toContain('s-sem');
    expect(alles).not.toContain('tafel-5');
    expect(pakket.voortgang).toHaveLength(1);
    expect(pakket.voortgang[0]).toMatchObject({ kind_id: 'server-noor', box: 2 });
  });

  it('neemt de diploma’s van dit kind mee', () => {
    expect(pakket.diplomas).toEqual([
      {
        kind_id: 'server-noor',
        ouder_id: 'ouder-1',
        badge_id: 'tafel-2',
        behaald_op: '2026-09-20T10:00:00.000Z',
      },
    ]);
  });

  it('neemt van de instellingen alleen mee wat de server kent', () => {
    expect(pakket.instellingen.map((rij) => rij.sleutel)).toEqual(['weekdoel']);
  });
});

/**
 * Na elke ronde gaat alleen mee wat er sinds de vorige keer bij kwam (ADR-188).
 */
describe('een aanvulling sinds de vorige keer', () => {
  const SINDS = '2026-09-22T10:02:00.000Z';
  const bron: Bron = {
    ...BRON,
    sessions: [
      sessie('s-voor', 'me'), // afgerond om 10:05, dus na SINDS
      {
        ...sessie('s-lang-geleden', 'me'),
        geeindigd: '2026-09-01T10:00:00.000Z',
      } as SessionRecord,
    ],
    attempts: [poging('p-voor', 's-voor', 'me'), poging('p-lang', 's-lang-geleden', 'me')],
    settings: [
      { key: 'weekdoel:me', value: 'nieuw', gewijzigdOp: '2026-09-22T11:00:00.000Z' },
      { key: 'doel:me', value: 'oud', gewijzigdOp: '2026-09-01T10:00:00.000Z' },
      { key: 'bijhouden:me', value: 'zonder moment' },
    ],
  };
  const pakket = pakketVan(bron, NOOR, NU, SINDS);

  it('neemt een ronde die daarna afliep mee, met al haar pogingen', () => {
    expect(pakket.sessies.map((rij) => rij.id)).toEqual(['s-voor']);
    // De poging is van 10:01, vóór SINDS, maar haar ronde liep af om 10:05.
    expect(pakket.pogingen.map((rij) => rij.id)).toEqual(['p-voor']);
  });

  it('neemt alleen dozen, diploma’s en instellingen mee die daarna veranderden', () => {
    // De doos van Noor is om 10:01 bijgewerkt en het diploma op de 20e: allebei ervoor.
    expect(pakket.voortgang).toEqual([]);
    expect(pakket.diplomas).toEqual([]);
    expect(pakket.instellingen.map((rij) => rij.sleutel)).toEqual(['weekdoel']);
  });
});
