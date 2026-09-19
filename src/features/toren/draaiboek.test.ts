import { describe, expect, it } from 'vitest';
import { draaiboek, MAX_SCENE, tussenruimte, VEEG, type RondeInvoer } from './draaiboek';

const BASIS: RondeInvoer = {
  stenen: ['topo', 'topo', 'tafels'],
  verdiepingKlaar: false,
  mijlpaal: null,
  diploma: false,
  vandaagKlaar: false,
  morgen: 4,
  rustig: false,
};

/** Elke combinatie die een ronde kan opleveren. */
function alleGevallen(): RondeInvoer[] {
  const uit: RondeInvoer[] = [];
  for (const aantal of [0, 1, 3, 10, 20, 47]) {
    for (const verdiepingKlaar of [false, true]) {
      for (const mijlpaal of [null, 'een kerktoren']) {
        for (const diploma of [false, true]) {
          for (const vandaagKlaar of [false, true]) {
            for (const rustig of [false, true]) {
              uit.push({
                ...BASIS,
                stenen: Array(aantal).fill('topo'),
                verdiepingKlaar,
                mijlpaal,
                diploma,
                vandaagKlaar,
                rustig,
              });
            }
          }
        }
      }
    }
  }
  return uit;
}

describe('rustig neemt de beweging weg en verder niets', () => {
  it('speelt dezelfde beats', () => {
    for (const geval of alleGevallen()) {
      const stil = draaiboek({ ...geval, rustig: true }).beats.map((beat) => beat.id);
      const bewegend = draaiboek({ ...geval, rustig: false }).beats.map((beat) => beat.id);
      expect(stil).toEqual(bewegend);
    }
  });

  it('laat hetzelfde klinken', () => {
    for (const geval of alleGevallen()) {
      const stil = draaiboek({ ...geval, rustig: true }).beats.map((beat) => beat.geluid ?? '');
      const bewegend = draaiboek({ ...geval, rustig: false }).beats.map(
        (beat) => beat.geluid ?? '',
      );
      expect(stil).toEqual(bewegend);
    }
  });

  it('laat Denker hetzelfde gezicht houden', () => {
    for (const geval of alleGevallen()) {
      const stil = draaiboek({ ...geval, rustig: true }).beats.map((beat) => beat.denker);
      const bewegend = draaiboek({ ...geval, rustig: false }).beats.map((beat) => beat.denker);
      expect(stil).toEqual(bewegend);
    }
  });

  it('duurt nul', () => {
    for (const geval of alleGevallen()) {
      const stil = draaiboek({ ...geval, rustig: true });
      expect(stil.totaal).toBe(0);
      expect(stil.perSteen).toBe(0);
      expect(stil.beats.every((beat) => beat.duur === 0)).toBe(true);
    }
  });
});

describe('een ronde zonder stenen', () => {
  it('is geen scène en wordt nooit overgeslagen', () => {
    const leeg = draaiboek({ ...BASIS, stenen: [] });
    expect(leeg.beats.map((beat) => beat.id)).toEqual(['morgen', 'reeks']);
    expect(leeg.overslaanbaar).toBe(false);
    expect(leeg.beats[0]?.denker).toBe('iets-nieuws');
  });

  it('blijft de lege ronde ook als er een verdieping of mijlpaal opgegeven wordt', () => {
    // Zonder stenen kan er geen verdieping volgeraakt zijn; dat mag nooit tot
    // een scène leiden die stenen laat invliegen die er niet zijn.
    const leeg = draaiboek({ ...BASIS, stenen: [], verdiepingKlaar: true, mijlpaal: 'een huis' });
    expect(leeg.beats.map((beat) => beat.id)).toEqual(['morgen', 'reeks']);
  });
});

describe('de scène zelf', () => {
  it('opent met de toren en eindigt met de reeks', () => {
    const boek = draaiboek(BASIS);
    expect(boek.beats[0]?.id).toBe('toren');
    expect(boek.beats[boek.beats.length - 1]?.id).toBe('reeks');
  });

  it('laat Denker op pauze eindigen als vandaag klaar is', () => {
    const boek = draaiboek({ ...BASIS, vandaagKlaar: true });
    expect(boek.beats[boek.beats.length - 1]?.denker).toBe('pauze');
  });

  it('laat de verdieping klinken, en zwijgt als er een diploma komt', () => {
    expect(
      draaiboek({ ...BASIS, verdiepingKlaar: true }).beats.some((b) => b.geluid === 'pagina'),
    ).toBe(true);
    expect(
      draaiboek({ ...BASIS, verdiepingKlaar: true, diploma: true }).beats.some((b) => b.geluid),
    ).toBe(false);
  });

  it('laat nooit twee dingen tegelijk klinken, en blijft binnen 3,2 seconden', () => {
    for (const geval of alleGevallen()) {
      const boek = draaiboek(geval);
      expect(boek.beats.filter((beat) => beat.geluid).length).toBeLessThanOrEqual(1);
      expect(boek.totaal).toBeLessThanOrEqual(MAX_SCENE);
    }
  });
});

describe('de veeg', () => {
  it('houdt zestig milliseconden aan zolang dat past', () => {
    expect(tussenruimte(5)).toBe(60);
    expect(tussenruimte(1)).toBe(0);
  });

  it('loopt nooit uit, ook niet bij tien of bij vijftig stenen', () => {
    // Tien stenen op zestig uit elkaar zou 720ms zijn: dat is de reden dat dit
    // een formule is en geen tabel.
    for (const aantal of [2, 5, 10, 20, 50]) {
      expect(180 + tussenruimte(aantal) * (aantal - 1)).toBeLessThanOrEqual(VEEG);
    }
  });
});
