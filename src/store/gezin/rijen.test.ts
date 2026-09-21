import { describe, expect, it } from 'vitest';
import {
  diplomaRij,
  instellingRij,
  isAfgerond,
  pogingRij,
  sessieRij,
  voortgangRij,
  type Eigenaar,
} from './rijen';
import type { AttemptRecord, SessionRecord } from '../db';

/**
 * De ene vertaling tussen het apparaat en de server (ADR-175).
 *
 * Wat hier bewezen wordt is niet dat er iets aankomt — dat is de e2e-bouw —
 * maar dat er niets méér vertrekt dan bedoeld, en niets minder. De twee die er
 * het meest toe doen: een instelling die alleen van dit apparaat is gaat niet
 * mee, en een poging met een genummerde sleutel evenmin.
 */

// Het kind heet op de server `kind-1` en op dit apparaat `me`: de twee
// identiteiten die `Eigenaar` uit elkaar houdt.
const EIGENAAR: Eigenaar = { kindId: 'kind-1', ouderId: 'ouder-1', lokaalId: 'me' };
const NU = new Date('2026-09-21T12:00:00.000Z');

describe('een doos wordt een rij', () => {
  it('draagt allebei de eigenaars, want dat is wat de policy leest', () => {
    const rij = voortgangRij(
      {
        kindId: 'kind-1',
        itemId: 'nl-limburg',
        box: 3,
        laatsteReview: '2026-09-20T10:00:00.000Z',
        volgendeReview: '2026-09-23T10:00:00.000Z',
        goedCount: 4,
        foutCount: 1,
        hoogsteDoos: 4,
      },
      EIGENAAR,
    );

    expect(rij).toEqual({
      kind_id: 'kind-1',
      ouder_id: 'ouder-1',
      item_id: 'nl-limburg',
      box: 3,
      laatste_review: '2026-09-20T10:00:00.000Z',
      volgende_review: '2026-09-23T10:00:00.000Z',
      goed_count: 4,
      fout_count: 1,
      hoogste_doos: 4,
    });
  });

  it('geeft een doos zonder hoogste doos een leeg veld en geen nul', () => {
    // Nul zou "nooit hoger geweest dan doos nul" betekenen, en dat bestaat niet:
    // de ring op een diploma leest deze kolom, en nul zou hem leegtrekken.
    const rij = voortgangRij(
      {
        kindId: 'kind-1',
        itemId: 'nl-drenthe',
        box: 1,
        laatsteReview: null,
        volgendeReview: null,
        goedCount: 0,
        foutCount: 0,
      },
      EIGENAAR,
    );
    expect(rij.hoogste_doos).toBeNull();
  });
});

describe('een ronde wordt een rij', () => {
  const ronde: SessionRecord = {
    id: 'ronde-1',
    mode: 'wijs-aan',
    setId: 'nl-provincies',
    itemSet: ['nl-limburg'],
    score: 8,
    beantwoord: 10,
    gestart: '2026-09-20T10:00:00.000Z',
    geeindigd: '2026-09-20T10:05:00.000Z',
  };

  it('houdt de antwoordsleutel, ook al leest niets hem vandaag', () => {
    // ADR-003: de server heeft precies deze kolom nodig zodra er een ranglijst
    // is om tegen na te rekenen.
    expect(sessieRij(ronde, EIGENAAR).item_set).toEqual(['nl-limburg']);
  });

  it('laat een ronde die nog loopt op het apparaat waar hij openstaat', () => {
    expect(isAfgerond(ronde)).toBe(true);
    expect(isAfgerond({ ...ronde, geeindigd: null })).toBe(false);
  });

  it('maakt van een ontbrekende set en telling een leeg veld', () => {
    const oud: SessionRecord = { ...ronde };
    delete oud.setId;
    delete oud.beantwoord;
    const rij = sessieRij(oud, EIGENAAR);
    expect(rij.set_id).toBeNull();
    expect(rij.beantwoord).toBeNull();
  });
});

describe('een gegeven antwoord wordt een rij', () => {
  const poging: AttemptRecord = {
    id: '3f1a0d6e-0000-4000-8000-000000000001',
    sessionId: 'ronde-1',
    itemId: 'nl-limburg',
    mode: 'wijs-aan',
    correct: true,
    responseMs: 1200,
    gekozenAntwoord: 'nl-limburg',
    tijdstip: '2026-09-20T10:01:00.000Z',
  };

  it('gaat mee met zijn uuid', () => {
    expect(pogingRij(poging, EIGENAAR)?.id).toBe('3f1a0d6e-0000-4000-8000-000000000001');
    expect(pogingRij(poging, EIGENAAR)?.sessie_id).toBe('ronde-1');
  });

  it('gaat niet mee met een genummerde sleutel', () => {
    // Die is per apparaat, en als primaire sleutel zou hij op het tweede
    // apparaat een ánder antwoord overschrijven (ADR-175).
    expect(pogingRij({ ...poging, id: 7 }, EIGENAAR)).toBeNull();
    const zonder: AttemptRecord = { ...poging };
    delete zonder.id;
    expect(pogingRij(zonder, EIGENAAR)).toBeNull();
  });
});

describe('een diploma wordt een rij', () => {
  it('houdt de dag waarop het gehaald is', () => {
    expect(
      diplomaRij(
        { kindId: 'kind-1', badgeId: 'topo-nl', behaaldOp: '2026-09-01T09:00:00.000Z' },
        EIGENAAR,
      ),
    ).toEqual({
      kind_id: 'kind-1',
      ouder_id: 'ouder-1',
      badge_id: 'topo-nl',
      behaald_op: '2026-09-01T09:00:00.000Z',
    });
  });
});

describe('een instelling wordt een rij, of gaat niet mee', () => {
  it('haalt het kind uit de sleutel', () => {
    expect(
      instellingRij(
        { key: 'weekdoel:me', value: '3', gewijzigdOp: '2026-09-20T10:00:00.000Z' },
        EIGENAAR,
        NU,
      ),
    ).toEqual({
      kind_id: 'kind-1',
      ouder_id: 'ouder-1',
      sleutel: 'weekdoel',
      waarde: '3',
      gewijzigd_op: '2026-09-20T10:00:00.000Z',
    });
  });

  it('laat wat dit apparaat vandaag doet, hier', () => {
    // `dagstand:` en `actiefKind` horen nergens anders te zijn (ADR-155).
    expect(instellingRij({ key: 'dagstand:me', value: 'x' }, EIGENAAR, NU)).toBeNull();
    expect(instellingRij({ key: 'actiefKind', value: 'me' }, EIGENAAR, NU)).toBeNull();
    // En een sleutel die de database niet kent, wordt hier tegengehouden in
    // plaats van de hele overname te laten stranden op een check-constraint.
    expect(instellingRij({ key: 'verzonnen:me', value: 'x' }, EIGENAAR, NU)).toBeNull();
  });

  it('laat de instelling van een ander kind staan', () => {
    expect(instellingRij({ key: 'weekdoel:kind-2', value: '3' }, EIGENAAR, NU)).toBeNull();
  });

  it('kijkt naar de lokale sleutel en niet naar die van de server', () => {
    // Het kind heet hier `me`; een rij op zijn server-uuid bestaat lokaal niet
    // en zou bij het samenvoegen een instelling van niemand worden.
    expect(instellingRij({ key: 'weekdoel:kind-1', value: '3' }, EIGENAAR, NU)).toBeNull();
  });

  it('geeft een rij van vóór het moment er alsnog een', () => {
    const rij = instellingRij({ key: 'doel:me', value: 'topo-nl' }, EIGENAAR, NU);
    expect(rij?.gewijzigd_op).toBe(NU.toISOString());
  });

  it('weigert een waarde die langer is dan de kolom', () => {
    const lang = 'x'.repeat(2001);
    expect(instellingRij({ key: 'zegels:me', value: lang }, EIGENAAR, NU)).toBeNull();
  });
});
