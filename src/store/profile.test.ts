import type { ProfileRecord } from './db';
import {
  createChild,
  getActiveChild,
  listChildren,
  renameChild,
  setGroep,
  switchChild,
  zetGroepGevraagd,
} from './children';
import { createProfile, geefNaam, heeftNaam, zorgVoorKind } from './profile';

vi.mock('./children', () => ({
  createChild: vi.fn(),
  getActiveChild: vi.fn(),
  listChildren: vi.fn(),
  renameChild: vi.fn(),
  setGroep: vi.fn(),
  switchChild: vi.fn(),
  zetGroepGevraagd: vi.fn(),
}));

function kind(id: string, naam: string): ProfileRecord {
  return { id, naam, avatarConfig: {}, niveau: 1, aangemaaktOp: '2026-09-26T10:00:00.000Z' };
}

/** Er is altijd een kind, en de naam komt later (ADR-229). */
describe('een kind zonder naam', () => {
  afterEach(() => {
    vi.mocked(createChild).mockReset();
    vi.mocked(getActiveChild).mockReset();
    vi.mocked(listChildren).mockReset();
    vi.mocked(renameChild).mockReset();
    vi.mocked(setGroep).mockReset();
    vi.mocked(switchChild).mockReset();
    vi.mocked(zetGroepGevraagd).mockReset();
  });

  it('kent een naam van alleen spaties niet als naam', () => {
    expect(heeftNaam(kind('me', ''))).toBe(false);
    expect(heeftNaam(kind('me', '  '))).toBe(false);
    expect(heeftNaam(kind('me', 'Noor'))).toBe(true);
  });

  it('maakt bij het eerste bezoek een kind zonder naam', async () => {
    vi.mocked(getActiveChild).mockResolvedValue(undefined);
    vi.mocked(listChildren).mockResolvedValue([]);
    vi.mocked(createChild).mockResolvedValue(kind('me', ''));

    expect(await zorgVoorKind()).toEqual(kind('me', ''));
    expect(createChild).toHaveBeenCalledWith('');
  });

  it('maakt er geen bij als er al een kind oefent', async () => {
    vi.mocked(getActiveChild).mockResolvedValue(kind('me', 'Noor'));

    expect((await zorgVoorKind()).naam).toBe('Noor');
    expect(createChild).not.toHaveBeenCalled();
  });

  it('geeft het eerste kind de beurt als het gekozen kind weg is', async () => {
    vi.mocked(getActiveChild).mockResolvedValue(undefined);
    vi.mocked(listChildren).mockResolvedValue([kind('me', 'Noor'), kind('b', 'Sem')]);

    expect((await zorgVoorKind()).id).toBe('me');
    expect(switchChild).toHaveBeenCalledWith('me');
    expect(createChild).not.toHaveBeenCalled();
  });

  it('geeft het kind dat oefent een naam, met hetzelfde id', async () => {
    vi.mocked(getActiveChild).mockResolvedValue(kind('me', ''));
    vi.mocked(renameChild).mockResolvedValue(kind('me', 'Noor'));

    expect(await geefNaam('Noor')).toEqual(kind('me', 'Noor'));
    expect(renameChild).toHaveBeenCalledWith('me', 'Noor');
  });

  it('wie inlogt, wordt het kind zonder naam dat hier al oefende', async () => {
    vi.mocked(listChildren).mockResolvedValue([kind('me', '')]);
    vi.mocked(renameChild).mockResolvedValue(kind('me', 'Noor'));
    vi.mocked(setGroep).mockResolvedValue({ ...kind('me', 'Noor'), groep: 6 });

    const uit = await createProfile('Noor', 6);

    expect(uit).toEqual({ ...kind('me', 'Noor'), groep: 6 });
    expect(createChild).not.toHaveBeenCalled();
    expect(switchChild).toHaveBeenCalledWith('me');
    expect(zetGroepGevraagd).toHaveBeenCalledWith('me');
  });

  it('komt erbij als iedereen hier al een naam heeft', async () => {
    vi.mocked(listChildren).mockResolvedValue([kind('me', 'Noor')]);
    vi.mocked(createChild).mockResolvedValue(kind('b', 'Sem'));

    expect((await createProfile('Sem'))?.id).toBe('b');
    expect(renameChild).not.toHaveBeenCalled();
  });
});
